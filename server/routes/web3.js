/**
 * Web3 区块链集成 API
 * 功能：数字钱包、NFT铸造、代币经济、去中心化存储
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { ethers } = require('ethers');
const { Web3Storage } = require('web3.storage');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Web3 Storage 客户端
const web3Storage = new Web3Storage({ token: process.env.WEB3_STORAGE_TOKEN });

// 智能合约配置
const CONTRACT_CONFIG = {
    nft: {
        address: process.env.NFT_CONTRACT_ADDRESS,
        abi: [
            'function mint(address to, string memory uri) public returns (uint256)',
            'function tokenURI(uint256 tokenId) public view returns (string memory)',
            'function balanceOf(address owner) public view returns (uint256)',
            'function ownerOf(uint256 tokenId) public view returns (address)',
            'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
        ]
    },
    token: {
        address: process.env.TOKEN_CONTRACT_ADDRESS,
        abi: [
            'function balanceOf(address account) public view returns (uint256)',
            'function transfer(address to, uint256 amount) public returns (bool)',
            'function reward(address to, uint256 amount) public',
            'function burn(uint256 amount) public',
            'event Transfer(address indexed from, address indexed to, uint256 value)'
        ]
    }
};

// JWT认证中间件
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: '未提供访问令牌' });
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            return res.status(403).json({ message: '令牌无效或已过期' });
        }
        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ message: '认证失败', error: error.message });
    }
};

// ==================== 数字钱包连接 ====================

// 生成钱包登录nonce
router.get('/wallet/nonce', async (req, res) => {
    const { address } = req.query;
    
    if (!address || !ethers.isAddress(address)) {
        return res.status(400).json({ message: '无效的钱包地址' });
    }

    try {
        const nonce = generateNonce();
        
        // 存储nonce
        await supabase.from('wallet_nonces').insert({
            wallet_address: address.toLowerCase(),
            nonce,
            expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5分钟过期
        });

        res.json({ 
            nonce,
            message: `Welcome to Hakimi Blog!\n\nPlease sign this message to verify your wallet ownership.\n\nNonce: ${nonce}`
        });
    } catch (error) {
        res.status(500).json({ message: '生成nonce失败', error: error.message });
    }
});

// 验证钱包签名并登录
router.post('/wallet/verify', async (req, res) => {
    const { address, signature, message } = req.body;

    try {
        // 验证签名
        const recoveredAddress = ethers.verifyMessage(message, signature);
        
        if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
            return res.status(400).json({ message: '签名验证失败' });
        }

        // 检查nonce是否过期
        const { data: nonceRecord } = await supabase
            .from('wallet_nonces')
            .select('*')
            .eq('wallet_address', address.toLowerCase())
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (!nonceRecord || new Date(nonceRecord.expires_at) < new Date()) {
            return res.status(400).json({ message: 'Nonce已过期，请重新获取' });
        }

        // 查找或创建用户
        let { data: walletUser } = await supabase
            .from('web3_user_wallets')
            .select('*, user:user_profiles(*)')
            .eq('wallet_address', address.toLowerCase())
            .single();

        let userId;

        if (!walletUser) {
            // 创建新用户
            const { data: newUser, error: userError } = await supabase.auth.signUp({
                email: `${address.toLowerCase()}@wallet.user`,
                password: generateRandomPassword()
            });

            if (userError) throw userError;

            // 创建钱包关联
            await supabase.from('web3_user_wallets').insert({
                user_id: newUser.user.id,
                wallet_address: address.toLowerCase(),
                wallet_type: 'ethereum',
                chain_id: 1
            });

            userId = newUser.user.id;
        } else {
            userId = walletUser.user_id;
        }

        // 删除已使用的nonce
        await supabase.from('wallet_nonces').delete().eq('id', nonceRecord.id);

        // 生成JWT token
        const { data: { session }, error: sessionError } = await supabase.auth.signInWithPassword({
            email: `${address.toLowerCase()}@wallet.user`,
            password: generateRandomPassword() // 这里需要使用实际的密码策略
        });

        if (sessionError) throw sessionError;

        res.json({
            token: session.access_token,
            user: {
                id: userId,
                wallet_address: address,
                wallet_type: 'ethereum'
            }
        });
    } catch (error) {
        res.status(500).json({ message: '验证失败', error: error.message });
    }
});

// 获取用户钱包信息
router.get('/wallet/info', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('web3_user_wallets')
            .select('*')
            .eq('user_id', req.user.id)
            .single();

        if (error) throw error;

        // 获取链上余额
        const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
        const ethBalance = await provider.getBalance(data.wallet_address);

        // 获取代币余额
        const tokenContract = new ethers.Contract(
            CONTRACT_CONFIG.token.address,
            CONTRACT_CONFIG.token.abi,
            provider
        );
        const tokenBalance = await tokenContract.balanceOf(data.wallet_address);

        res.json({
            wallet: data,
            balances: {
                eth: ethers.formatEther(ethBalance),
                token: ethers.formatUnits(tokenBalance, 18)
            }
        });
    } catch (error) {
        res.status(500).json({ message: '获取钱包信息失败', error: error.message });
    }
});

// ==================== NFT 内容铸造 ====================

// 获取用户NFT列表
router.get('/nfts', authenticateToken, async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    try {
        const { data, error, count } = await supabase
            .from('nft_tokens')
            .select('*, article:articles(*)', { count: 'exact' })
            .eq('owner_id', req.user.id)
            .order('minted_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        res.json({
            nfts: data,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: '获取NFT列表失败', error: error.message });
    }
});

// 铸造NFT
router.post('/nfts/mint', authenticateToken, async (req, res) => {
    const { article_id, metadata } = req.body;

    try {
        // 获取文章信息
        const { data: article, error: articleError } = await supabase
            .from('articles')
            .select('*')
            .eq('id', article_id)
            .single();

        if (articleError || !article) {
            return res.status(404).json({ message: '文章不存在' });
        }

        // 检查是否已铸造
        const { data: existingNFT } = await supabase
            .from('nft_tokens')
            .select('*')
            .eq('article_id', article_id)
            .single();

        if (existingNFT) {
            return res.status(400).json({ message: '该文章已铸造为NFT' });
        }

        // 准备NFT元数据
        const nftMetadata = {
            name: metadata.name || article.title,
            description: metadata.description || article.summary,
            image: metadata.image || article.cover_image,
            attributes: [
                { trait_type: 'Author', value: article.author_id },
                { trait_type: 'Created At', value: article.created_at },
                { trait_type: 'Category', value: metadata.category || 'Article' }
            ]
        };

        // 上传元数据到IPFS
        const metadataBlob = new Blob([JSON.stringify(nftMetadata)], { type: 'application/json' });
        const metadataFile = new File([metadataBlob], 'metadata.json');
        const metadataCid = await web3Storage.put([metadataFile]);
        const tokenURI = `https://${metadataCid}.ipfs.dweb.link/metadata.json`;

        // 获取用户钱包
        const { data: wallet } = await supabase
            .from('web3_user_wallets')
            .select('wallet_address')
            .eq('user_id', req.user.id)
            .single();

        // 调用智能合约铸造NFT（这里简化处理，实际需要私钥签名）
        // 实际部署时应该使用后端钱包或者让用户前端签名

        // 记录到数据库
        const { data: nft, error } = await supabase
            .from('nft_tokens')
            .insert({
                article_id,
                owner_id: req.user.id,
                token_id: null, // 铸造后更新
                contract_address: CONTRACT_CONFIG.nft.address,
                token_uri: tokenURI,
                metadata: nftMetadata,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;

        res.json({
            message: 'NFT铸造已提交',
            nft,
            metadata_uri: tokenURI
        });
    } catch (error) {
        res.status(500).json({ message: '铸造NFT失败', error: error.message });
    }
});

// 转移NFT
router.post('/nfts/:id/transfer', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { to_address } = req.body;

    try {
        // 验证接收地址
        if (!ethers.isAddress(to_address)) {
            return res.status(400).json({ message: '无效的钱包地址' });
        }

        // 获取NFT信息
        const { data: nft, error } = await supabase
            .from('nft_tokens')
            .select('*')
            .eq('id', id)
            .eq('owner_id', req.user.id)
            .single();

        if (error || !nft) {
            return res.status(404).json({ message: 'NFT不存在或不属于您' });
        }

        // 查找接收用户
        const { data: toWallet } = await supabase
            .from('web3_user_wallets')
            .select('user_id')
            .eq('wallet_address', to_address.toLowerCase())
            .single();

        // 更新NFT所有权
        await supabase
            .from('nft_tokens')
            .update({
                owner_id: toWallet?.user_id || null,
                previous_owner_id: req.user.id,
                transferred_at: new Date().toISOString()
            })
            .eq('id', id);

        // 记录转移历史
        await supabase.from('nft_transfer_history').insert({
            nft_id: id,
            from_user_id: req.user.id,
            to_user_id: toWallet?.user_id,
            from_address: nft.wallet_address,
            to_address: to_address.toLowerCase(),
            transaction_hash: null // 链上确认后更新
        });

        res.json({ message: 'NFT转移成功' });
    } catch (error) {
        res.status(500).json({ message: '转移NFT失败', error: error.message });
    }
});

// ==================== 代币经济系统 ====================

// 获取代币余额
router.get('/tokens/balance', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('token_balances')
            .select('*')
            .eq('user_id', req.user.id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        res.json({
            balance: data?.balance || 0,
            locked: data?.locked || 0,
            total_earned: data?.total_earned || 0,
            total_spent: data?.total_spent || 0
        });
    } catch (error) {
        res.status(500).json({ message: '获取余额失败', error: error.message });
    }
});

// 获取代币交易记录
router.get('/tokens/transactions', authenticateToken, async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    try {
        const { data, error, count } = await supabase
            .from('token_transactions')
            .select('*', { count: 'exact' })
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        res.json({
            transactions: data,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: '获取交易记录失败', error: error.message });
    }
});

// 代币转账
router.post('/tokens/transfer', authenticateToken, async (req, res) => {
    const { to_user_id, amount, reason } = req.body;

    try {
        // 检查余额
        const { data: fromBalance } = await supabase
            .from('token_balances')
            .select('balance')
            .eq('user_id', req.user.id)
            .single();

        if (!fromBalance || fromBalance.balance < amount) {
            return res.status(400).json({ message: '余额不足' });
        }

        // 开始事务
        const { error: txError } = await supabase.rpc('transfer_tokens', {
            from_user: req.user.id,
            to_user: to_user_id,
            amount: amount,
            reason: reason || 'transfer'
        });

        if (txError) throw txError;

        res.json({ message: '转账成功' });
    } catch (error) {
        res.status(500).json({ message: '转账失败', error: error.message });
    }
});

// 代币兑换（与积分系统互通）
router.post('/tokens/exchange', authenticateToken, async (req, res) => {
    const { direction, amount } = req.body; // direction: 'tokens_to_coins' | 'coins_to_tokens'

    try {
        const exchangeRate = 10; // 1 token = 10 coins
        
        if (direction === 'tokens_to_coins') {
            // Token 转 Coins
            await supabase.rpc('exchange_tokens_to_coins', {
                user_id: req.user.id,
                token_amount: amount,
                coin_amount: amount * exchangeRate
            });
        } else {
            // Coins 转 Token
            await supabase.rpc('exchange_coins_to_tokens', {
                user_id: req.user.id,
                coin_amount: amount,
                token_amount: amount / exchangeRate
            });
        }

        res.json({ message: '兑换成功' });
    } catch (error) {
        res.status(500).json({ message: '兑换失败', error: error.message });
    }
});

// ==================== 去中心化存储 ====================

// 上传文件到IPFS
router.post('/ipfs/upload', authenticateToken, async (req, res) => {
    try {
        const files = req.files;
        
        if (!files || files.length === 0) {
            return res.status(400).json({ message: '没有上传文件' });
        }

        const uploadedFiles = [];

        for (const file of files) {
            // 上传到Web3.Storage
            const cid = await web3Storage.put([{
                name: file.originalname,
                stream: () => require('stream').Readable.from(file.buffer)
            }]);

            // 记录到数据库
            const { data, error } = await supabase
                .from('ipfs_files')
                .insert({
                    user_id: req.user.id,
                    filename: file.originalname,
                    cid: cid,
                    size: file.size,
                    mime_type: file.mimetype,
                    gateway_urls: [
                        `https://${cid}.ipfs.dweb.link/${file.originalname}`,
                        `https://ipfs.io/ipfs/${cid}/${file.originalname}`
                    ]
                })
                .select()
                .single();

            if (error) throw error;
            uploadedFiles.push(data);
        }

        res.json({
            message: '文件上传成功',
            files: uploadedFiles
        });
    } catch (error) {
        res.status(500).json({ message: '上传失败', error: error.message });
    }
});

// 获取用户IPFS文件
router.get('/ipfs/files', authenticateToken, async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    try {
        const { data, error, count } = await supabase
            .from('ipfs_files')
            .select('*', { count: 'exact' })
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        res.json({
            files: data,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: '获取文件列表失败', error: error.message });
    }
});

// 获取代币经济统计
router.get('/economy/stats', async (req, res) => {
    try {
        const { data: totalSupply } = await supabase
            .from('token_balances')
            .select('balance')
            .then(({ data }) => ({
                data: data?.reduce((sum, b) => sum + b.balance, 0) || 0
            }));

        const { data: nftStats } = await supabase
            .from('nft_tokens')
            .select('id', { count: 'exact' });

        const { data: recentTransfers } = await supabase
            .from('token_transactions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        res.json({
            total_supply: totalSupply,
            nft_count: nftStats?.length || 0,
            recent_activity: recentTransfers
        });
    } catch (error) {
        res.status(500).json({ message: '获取统计失败', error: error.message });
    }
});

// 辅助函数
function generateNonce() {
    return Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
}

function generateRandomPassword() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

module.exports = router;
