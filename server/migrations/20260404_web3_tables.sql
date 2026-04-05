-- =====================================================
-- 第六轮创新功能: Web3与区块链集成数据库迁移
-- 创建时间: 2026-04-04
-- 功能: 支持数字钱包、NFT、代币经济和去中心化存储
-- =====================================================

-- 1. 用户数字钱包表
CREATE TABLE IF NOT EXISTS user_wallets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_address VARCHAR(255) NOT NULL UNIQUE,
    wallet_type VARCHAR(50) DEFAULT 'metamask', -- metamask, walletconnect, coinbase, etc.
    chain_id INTEGER DEFAULT 1, -- 1=Ethereum, 56=BSC, 137=Polygon
    nonce VARCHAR(255), -- 用于签名验证的随机数
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallets_address ON user_wallets(wallet_address);

-- 2. NFT收藏品表
CREATE TABLE IF NOT EXISTS nfts (
    id SERIAL PRIMARY KEY,
    token_id VARCHAR(255) NOT NULL, -- 区块链上的Token ID
    contract_address VARCHAR(255) NOT NULL,
    chain_id INTEGER DEFAULT 1,
    owner_wallet VARCHAR(255) NOT NULL,
    creator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255),
    description TEXT,
    image_url TEXT,
    metadata_uri TEXT, -- IPFS或HTTP链接
    metadata_json JSONB, -- 完整的NFT元数据
    article_id INTEGER REFERENCES articles(id) ON DELETE SET NULL, -- 关联的文章
    mint_transaction_hash VARCHAR(255),
    minted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active', -- active, burned, transferred
    UNIQUE(token_id, contract_address, chain_id)
);

CREATE INDEX IF NOT EXISTS idx_nfts_owner ON nfts(owner_wallet);
CREATE INDEX IF NOT EXISTS idx_nfts_creator ON nfts(creator_id);
CREATE INDEX IF NOT EXISTS idx_nfts_article ON nfts(article_id);

-- 3. 代币交易记录表
CREATE TABLE IF NOT EXISTS token_transactions (
    id SERIAL PRIMARY KEY,
    transaction_hash VARCHAR(255) UNIQUE,
    from_wallet VARCHAR(255) NOT NULL,
    to_wallet VARCHAR(255) NOT NULL,
    amount DECIMAL(65, 18) NOT NULL, -- ERC-20代币精度
    token_address VARCHAR(255), -- 代币合约地址
    token_symbol VARCHAR(50) DEFAULT 'BLOG', -- 平台代币符号
    transaction_type VARCHAR(50), -- transfer, reward, purchase, exchange
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    related_article_id INTEGER REFERENCES articles(id) ON DELETE SET NULL,
    related_nft_id INTEGER REFERENCES nfts(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, failed
    gas_used DECIMAL(65, 0),
    gas_price DECIMAL(65, 0),
    block_number BIGINT,
    confirmed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_token_tx_from ON token_transactions(from_wallet);
CREATE INDEX IF NOT EXISTS idx_token_tx_to ON token_transactions(to_wallet);
CREATE INDEX IF NOT EXISTS idx_token_tx_user ON token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_token_tx_status ON token_transactions(status);

-- 4. IPFS文件存储表
CREATE TABLE IF NOT EXISTS ipfs_files (
    id SERIAL PRIMARY KEY,
    cid VARCHAR(255) NOT NULL UNIQUE, -- IPFS Content Identifier
    name VARCHAR(255),
    size_bytes BIGINT,
    mime_type VARCHAR(255),
    url TEXT, -- IPFS网关链接
    gateway_urls JSONB DEFAULT '[]', -- 多个网关链接
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    article_id INTEGER REFERENCES articles(id) ON DELETE SET NULL,
    file_type VARCHAR(50), -- image, video, document, metadata
    pin_status VARCHAR(50) DEFAULT 'pinned', -- pinned, pinning, failed
    pinned_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP, -- 可选的过期时间
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_ipfs_user ON ipfs_files(user_id);
CREATE INDEX IF NOT EXISTS idx_ipfs_article ON ipfs_files(article_id);
CREATE INDEX IF NOT EXISTS idx_ipfs_cid ON ipfs_files(cid);

-- 5. 代币兑换汇率表
CREATE TABLE IF NOT EXISTS token_exchange_rates (
    id SERIAL PRIMARY KEY,
    from_symbol VARCHAR(50) NOT NULL,
    to_symbol VARCHAR(50) NOT NULL,
    rate DECIMAL(65, 18) NOT NULL,
    source VARCHAR(100), -- 数据来源
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(from_symbol, to_symbol)
);

-- 插入默认汇率: 平台积分兑换代币
INSERT INTO token_exchange_rates (from_symbol, to_symbol, rate, source)
VALUES 
    ('COIN', 'BLOG', 0.01, 'platform'), -- 100积分 = 1 BLOG代币
    ('BLOG', 'COIN', 100, 'platform')  -- 1 BLOG代币 = 100积分
ON CONFLICT (from_symbol, to_symbol) DO NOTHING;

-- 6. 智能合约事件日志表
CREATE TABLE IF NOT EXISTS contract_events (
    id SERIAL PRIMARY KEY,
    contract_address VARCHAR(255) NOT NULL,
    chain_id INTEGER DEFAULT 1,
    event_name VARCHAR(100) NOT NULL,
    transaction_hash VARCHAR(255),
    block_number BIGINT,
    log_index INTEGER,
    from_address VARCHAR(255),
    to_address VARCHAR(255),
    token_id VARCHAR(255),
    amount DECIMAL(65, 18),
    event_data JSONB, -- 完整事件数据
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contract_events_tx ON contract_events(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_contract_events_processed ON contract_events(processed);
CREATE INDEX IF NOT EXISTS idx_contract_events_block ON contract_events(block_number);

-- 7. 用户链上活动统计表
CREATE TABLE IF NOT EXISTS user_chain_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_address VARCHAR(255),
    total_nfts_minted INTEGER DEFAULT 0,
    total_nfts_owned INTEGER DEFAULT 0,
    total_tokens_received DECIMAL(65, 18) DEFAULT 0,
    total_tokens_sent DECIMAL(65, 18) DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    first_activity_at TIMESTAMP,
    last_activity_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_chain_stats_wallet ON user_chain_stats(wallet_address);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为所有表添加更新时间触发器
CREATE TRIGGER update_user_wallets_updated_at BEFORE UPDATE ON user_wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nfts_updated_at BEFORE UPDATE ON nfts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ipfs_files_updated_at BEFORE UPDATE ON ipfs_files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_token_exchange_rates_updated_at BEFORE UPDATE ON token_exchange_rates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_chain_stats_updated_at BEFORE UPDATE ON user_chain_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 添加RLS策略（行级安全）
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ipfs_files ENABLE ROW LEVEL SECURITY;

-- 用户只能看到自己的钱包
CREATE POLICY user_wallets_select ON user_wallets
    FOR SELECT USING (user_id = current_setting('app.current_user_id')::INTEGER);

-- NFT对所有用户可见
CREATE POLICY nfts_select ON nfts
    FOR SELECT USING (true);

-- 用户只能看到自己的交易
CREATE POLICY token_transactions_select ON token_transactions
    FOR SELECT USING (
        from_wallet = current_setting('app.current_wallet')::VARCHAR OR
        to_wallet = current_setting('app.current_wallet')::VARCHAR
    );

-- IPFS文件公开访问
CREATE POLICY ipfs_files_select ON ipfs_files
    FOR SELECT USING (true);

-- 创建视图：用户完整的Web3资料
CREATE OR REPLACE VIEW user_web3_profiles AS
SELECT 
    u.id as user_id,
    u.username,
    u.email,
    uw.wallet_address,
    uw.wallet_type,
    uw.is_verified,
    ucs.total_nfts_minted,
    ucs.total_nfts_owned,
    ucs.total_tokens_received,
    ucs.total_tokens_sent,
    ucs.total_transactions,
    COUNT(DISTINCT n.id) as current_nfts_owned
FROM users u
LEFT JOIN user_wallets uw ON u.id = uw.user_id
LEFT JOIN user_chain_stats ucs ON u.id = ucs.user_id
LEFT JOIN nfts n ON uw.wallet_address = n.owner_wallet AND n.status = 'active'
GROUP BY u.id, uw.wallet_address, uw.wallet_type, uw.is_verified, 
         ucs.total_nfts_minted, ucs.total_nfts_owned, 
         ucs.total_tokens_received, ucs.total_tokens_sent, ucs.total_transactions;

-- 注释说明
COMMENT ON TABLE user_wallets IS '用户绑定的数字钱包';
COMMENT ON TABLE nfts IS '平台铸造的NFT收藏品';
COMMENT ON TABLE token_transactions IS '代币转账交易记录';
COMMENT ON TABLE ipfs_files IS 'IPFS去中心化存储文件';
COMMENT ON TABLE token_exchange_rates IS '代币兑换汇率配置';
COMMENT ON TABLE contract_events IS '智能合约事件日志';
COMMENT ON TABLE user_chain_stats IS '用户链上活动统计';
