/**
 * 低代码平台路由
 * 第六轮创新性功能 - Low-code Platform
 * 
 * 功能模块：
 * 5.1 可视化页面构建
 * 5.2 表单设计器
 * 5.3 工作流引擎
 * 5.4 自定义组件
 */

const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Supabase客户端
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 组件库配置
const COMPONENT_LIBRARY = {
    basic: {
        name: '基础组件',
        components: [
            { type: 'text', name: '文本', icon: '📝', props: { content: '文本内容', fontSize: 16, color: '#333', align: 'left' } },
            { type: 'heading', name: '标题', icon: 'H', props: { content: '标题', level: 2, color: '#333', align: 'left' } },
            { type: 'button', name: '按钮', icon: '🔘', props: { text: '点击我', type: 'primary', size: 'medium', link: '' } },
            { type: 'image', name: '图片', icon: '🖼️', props: { src: '', alt: '', width: '100%', height: 'auto', borderRadius: 0 } },
            { type: 'divider', name: '分割线', icon: '➖', props: { style: 'solid', color: '#e0e0e0', margin: 20 } }
        ]
    },
    layout: {
        name: '布局组件',
        components: [
            { type: 'container', name: '容器', icon: '□', props: { padding: 20, backgroundColor: '#fff', borderRadius: 8, shadow: true } },
            { type: 'grid', name: '栅格', icon: '▦', props: { columns: 2, gap: 16, align: 'stretch' } },
            { type: 'card', name: '卡片', icon: '🃏', props: { title: '卡片标题', padding: 16, shadow: true } },
            { type: 'tabs', name: '标签页', icon: '📑', props: { items: [{ label: '标签1' }, { label: '标签2' }], type: 'line' } },
            { type: 'collapse', name: '折叠面板', icon: '📂', props: { items: [{ title: '面板1', content: '' }], accordion: false } }
        ]
    },
    form: {
        name: '表单组件',
        components: [
            { type: 'input', name: '输入框', icon: '⌨️', props: { label: '标签', placeholder: '请输入', required: false, type: 'text' } },
            { type: 'textarea', name: '多行文本', icon: '📄', props: { label: '标签', placeholder: '请输入', rows: 4, required: false } },
            { type: 'select', name: '下拉选择', icon: '▼', props: { label: '标签', options: [{ label: '选项1', value: '1' }], required: false } },
            { type: 'radio', name: '单选框', icon: '◉', props: { label: '标签', options: [{ label: '选项1', value: '1' }], required: false } },
            { type: 'checkbox', name: '复选框', icon: '☑️', props: { label: '标签', options: [{ label: '选项1', value: '1' }], required: false } },
            { type: 'switch', name: '开关', icon: '🎚️', props: { label: '标签', checked: false } },
            { type: 'date', name: '日期选择', icon: '📅', props: { label: '标签', placeholder: '选择日期', required: false } },
            { type: 'upload', name: '文件上传', icon: '📤', props: { label: '标签', accept: '*', multiple: false, maxSize: 10 } }
        ]
    },
    data: {
        name: '数据组件',
        components: [
            { type: 'table', name: '表格', icon: '▦', props: { columns: [{ title: '列1', dataIndex: 'col1' }], dataSource: [], bordered: true, size: 'medium' } },
            { type: 'list', name: '列表', icon: '☰', props: { dataSource: [], itemLayout: 'horizontal', bordered: false } },
            { type: 'statistic', name: '统计数字', icon: '🔢', props: { title: '标题', value: 0, prefix: '', suffix: '', precision: 0 } },
            { type: 'chart', name: '图表', icon: '📊', props: { type: 'line', data: [], xField: 'x', yField: 'y', height: 300 } },
            { type: 'progress', name: '进度条', icon: '▓', props: { percent: 0, type: 'line', status: 'active', strokeColor: '#1890ff' } }
        ]
    },
    advanced: {
        name: '高级组件',
        components: [
            { type: 'carousel', name: '轮播图', icon: '🎠', props: { autoplay: true, dots: true, effect: 'scrollx', items: [] } },
            { type: 'timeline', name: '时间轴', icon: '⏱️', props: { mode: 'left', items: [{ content: '事件1', time: '2024-01-01' }] } },
            { type: 'countdown', name: '倒计时', icon: '⏰', props: { target: Date.now() + 86400000, format: 'HH:mm:ss' } },
            { type: 'map', name: '地图', icon: '🗺️', props: { center: [116.4074, 39.9042], zoom: 10, markers: [] } },
            { type: 'markdown', name: 'Markdown', icon: 'M↓', props: { content: '# 标题\n\n正文内容' } }
        ]
    }
};

// 工作流节点类型
const WORKFLOW_NODES = {
    start: { name: '开始', color: '#52c41a', inputs: 0, outputs: 1 },
    end: { name: '结束', color: '#f5222d', inputs: 1, outputs: 0 },
    task: { name: '任务', color: '#1890ff', inputs: 1, outputs: 1 },
    decision: { name: '判断', color: '#faad14', inputs: 1, outputs: 2 },
    parallel: { name: '并行', color: '#722ed1', inputs: 1, outputs: -1 },
    delay: { name: '延迟', color: '#13c2c2', inputs: 1, outputs: 1 },
    webhook: { name: 'Webhook', color: '#eb2f96', inputs: 1, outputs: 1 },
    email: { name: '发送邮件', color: '#2f54eb', inputs: 1, outputs: 1 },
    notification: { name: '通知', color: '#fa8c16', inputs: 1, outputs: 1 }
};

// 中间件
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// ==================== 5.1 可视化页面构建 ====================

/**
 * 获取组件库
 * GET /api/lowcode/components
 */
router.get('/components', async (req, res) => {
    try {
        res.json({
            success: true,
            data: COMPONENT_LIBRARY
        });
    } catch (error) {
        res.status(500).json({ error: '获取组件库失败' });
    }
});

/**
 * 创建页面
 * POST /api/lowcode/pages
 */
router.post('/pages', [
    body('name').trim().isLength({ min: 1, max: 50 }),
    body('title').optional().trim(),
    validateRequest
], async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, title, description, template = 'blank' } = req.body;

        const pageId = uuidv4();
        const page = {
            id: pageId,
            user_id: userId,
            name,
            title: title || name,
            description: description || '',
            template,
            components: getTemplateComponents(template),
            styles: {
                backgroundColor: '#f5f5f5',
                padding: 0,
                maxWidth: 1200
            },
            scripts: [],
            settings: {
                seo: {
                    keywords: '',
                    description: ''
                },
                analytics: true,
                responsive: true
            },
            version: 1,
            is_published: false,
            created_at: new Date(),
            updated_at: new Date()
        };

        await supabase.from('lowcode_pages').insert(page);

        res.json({
            success: true,
            data: {
                pageId,
                name,
                title: page.title,
                editUrl: `/builder/${pageId}`
            }
        });
    } catch (error) {
        console.error('Create Page Error:', error);
        res.status(500).json({ error: '创建页面失败' });
    }
});

/**
 * 获取页面列表
 * GET /api/lowcode/pages
 */
router.get('/pages', async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20 } = req.query;

        const { data, error, count } = await supabase
            .from('lowcode_pages')
            .select('id, name, title, is_published, created_at, updated_at, template, version', { count: 'exact' })
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        if (error) throw error;

        res.json({
            success: true,
            data: {
                pages: data,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count
                }
            }
        });
    } catch (error) {
        res.status(500).json({ error: '获取页面列表失败' });
    }
});

/**
 * 获取页面详情
 * GET /api/lowcode/pages/:pageId
 */
router.get('/pages/:pageId', async (req, res) => {
    try {
        const { pageId } = req.params;
        const userId = req.user.id;

        const { data: page, error } = await supabase
            .from('lowcode_pages')
            .select('*')
            .eq('id', pageId)
            .eq('user_id', userId)
            .single();

        if (error || !page) {
            return res.status(404).json({ error: '页面不存在' });
        }

        res.json({
            success: true,
            data: { page }
        });
    } catch (error) {
        res.status(500).json({ error: '获取页面失败' });
    }
});

/**
 * 更新页面
 * PUT /api/lowcode/pages/:pageId
 */
router.put('/pages/:pageId', async (req, res) => {
    try {
        const { pageId } = req.params;
        const userId = req.user.id;
        const { components, styles, scripts, settings, title } = req.body;

        // 创建版本历史
        const { data: currentPage } = await supabase
            .from('lowcode_pages')
            .select('*')
            .eq('id', pageId)
            .single();

        if (currentPage) {
            await supabase.from('lowcode_page_versions').insert({
                page_id: pageId,
                version: currentPage.version,
                components: currentPage.components,
                styles: currentPage.styles,
                scripts: currentPage.scripts,
                settings: currentPage.settings,
                created_at: new Date()
            });
        }

        // 更新页面
        const updates = {
            updated_at: new Date(),
            version: (currentPage?.version || 0) + 1
        };

        if (components) updates.components = components;
        if (styles) updates.styles = styles;
        if (scripts) updates.scripts = scripts;
        if (settings) updates.settings = settings;
        if (title) updates.title = title;

        await supabase.from('lowcode_pages')
            .update(updates)
            .eq('id', pageId)
            .eq('user_id', userId);

        res.json({ success: true, data: { version: updates.version } });
    } catch (error) {
        res.status(500).json({ error: '更新页面失败' });
    }
});

/**
 * 发布页面
 * POST /api/lowcode/pages/:pageId/publish
 */
router.post('/pages/:pageId/publish', async (req, res) => {
    try {
        const { pageId } = req.params;
        const userId = req.user.id;
        const { customDomain } = req.body;

        const { data: page } = await supabase
            .from('lowcode_pages')
            .select('*')
            .eq('id', pageId)
            .eq('user_id', userId)
            .single();

        if (!page) {
            return res.status(404).json({ error: '页面不存在' });
        }

        // 生成HTML
        const html = generatePageHTML(page);

        // 保存到存储
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('published-pages')
            .upload(`${pageId}/index.html`, html, {
                contentType: 'text/html',
                upsert: true
            });

        if (uploadError) throw uploadError;

        // 获取公开URL
        const { data: { publicUrl } } = supabase.storage
            .from('published-pages')
            .getPublicUrl(`${pageId}/index.html`);

        // 更新页面状态
        await supabase.from('lowcode_pages')
            .update({
                is_published: true,
                published_at: new Date(),
                published_url: customDomain || publicUrl,
                custom_domain: customDomain || null
            })
            .eq('id', pageId);

        res.json({
            success: true,
            data: {
                url: customDomain || publicUrl,
                publishedAt: new Date()
            }
        });
    } catch (error) {
        console.error('Publish Error:', error);
        res.status(500).json({ error: '发布失败' });
    }
});

/**
 * 预览页面
 * GET /api/lowcode/pages/:pageId/preview
 */
router.get('/pages/:pageId/preview', async (req, res) => {
    try {
        const { pageId } = req.params;

        const { data: page } = await supabase
            .from('lowcode_pages')
            .select('*')
            .eq('id', pageId)
            .single();

        if (!page) {
            return res.status(404).json({ error: '页面不存在' });
        }

        const html = generatePageHTML(page, true);
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } catch (error) {
        res.status(500).json({ error: '预览失败' });
    }
});

// ==================== 5.2 表单设计器 ====================

/**
 * 创建表单
 * POST /api/lowcode/forms
 */
router.post('/forms', [
    body('name').trim().isLength({ min: 1, max: 50 }),
    validateRequest
], async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, description, fields = [], settings = {} } = req.body;

        const formId = uuidv4();
        const form = {
            id: formId,
            user_id: userId,
            name,
            description: description || '',
            fields: fields.map((f, index) => ({
                id: uuidv4(),
                ...f,
                order: index
            })),
            settings: {
                submitButtonText: '提交',
                successMessage: '提交成功！',
                allowMultiple: true,
                requireAuth: false,
                ...settings
            },
            responses_count: 0,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
        };

        await supabase.from('lowcode_forms').insert(form);

        res.json({
            success: true,
            data: {
                formId,
                name,
                embedUrl: `/forms/${formId}`,
                shareUrl: `/f/${formId}`
            }
        });
    } catch (error) {
        res.status(500).json({ error: '创建表单失败' });
    }
});

/**
 * 获取表单列表
 * GET /api/lowcode/forms
 */
router.get('/forms', async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20 } = req.query;

        const { data, count, error } = await supabase
            .from('lowcode_forms')
            .select('id, name, description, responses_count, is_active, created_at, updated_at', { count: 'exact' })
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        if (error) throw error;

        res.json({
            success: true,
            data: {
                forms: data,
                pagination: { page: parseInt(page), limit: parseInt(limit), total: count }
            }
        });
    } catch (error) {
        res.status(500).json({ error: '获取表单列表失败' });
    }
});

/**
 * 获取表单详情
 * GET /api/lowcode/forms/:formId
 */
router.get('/forms/:formId', async (req, res) => {
    try {
        const { formId } = req.params;

        const { data: form } = await supabase
            .from('lowcode_forms')
            .select('*')
            .eq('id', formId)
            .single();

        if (!form) {
            return res.status(404).json({ error: '表单不存在' });
        }

        res.json({ success: true, data: { form } });
    } catch (error) {
        res.status(500).json({ error: '获取表单失败' });
    }
});

/**
 * 更新表单
 * PUT /api/lowcode/forms/:formId
 */
router.put('/forms/:formId', async (req, res) => {
    try {
        const { formId } = req.params;
        const userId = req.user.id;
        const { name, description, fields, settings, is_active } = req.body;

        const updates = { updated_at: new Date() };
        if (name) updates.name = name;
        if (description !== undefined) updates.description = description;
        if (fields) {
            updates.fields = fields.map((f, index) => ({
                id: f.id || uuidv4(),
                ...f,
                order: index
            }));
        }
        if (settings) updates.settings = settings;
        if (is_active !== undefined) updates.is_active = is_active;

        await supabase.from('lowcode_forms')
            .update(updates)
            .eq('id', formId)
            .eq('user_id', userId);

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: '更新表单失败' });
    }
});

/**
 * 提交表单
 * POST /api/lowcode/forms/:formId/submit
 */
router.post('/forms/:formId/submit', async (req, res) => {
    try {
        const { formId } = req.params;
        const { data } = req.body;
        const userId = req.user?.id;

        // 获取表单
        const { data: form } = await supabase
            .from('lowcode_forms')
            .select('*')
            .eq('id', formId)
            .single();

        if (!form || !form.is_active) {
            return res.status(404).json({ error: '表单不存在或已关闭' });
        }

        // 验证必填项
        for (const field of form.fields) {
            if (field.required && !data[field.id]) {
                return res.status(400).json({ error: `${field.label} 是必填项` });
            }
        }

        // 保存响应
        const response = {
            id: uuidv4(),
            form_id: formId,
            user_id: userId,
            data,
            ip: req.ip,
            user_agent: req.headers['user-agent'],
            created_at: new Date()
        };

        await supabase.from('lowcode_form_responses').insert(response);

        // 更新计数
        await supabase.rpc('increment_form_responses', { form_id: formId });

        // 触发工作流（如果有配置）
        await triggerFormWorkflow(form, data);

        res.json({
            success: true,
            data: {
                message: form.settings.successMessage,
                responseId: response.id
            }
        });
    } catch (error) {
        res.status(500).json({ error: '提交失败' });
    }
});

/**
 * 获取表单回复
 * GET /api/lowcode/forms/:formId/responses
 */
router.get('/forms/:formId/responses', async (req, res) => {
    try {
        const { formId } = req.params;
        const userId = req.user.id;
        const { page = 1, limit = 50 } = req.query;

        // 验证表单所有权
        const { data: form } = await supabase
            .from('lowcode_forms')
            .select('id')
            .eq('id', formId)
            .eq('user_id', userId)
            .single();

        if (!form) {
            return res.status(403).json({ error: '无权访问' });
        }

        const { data, count, error } = await supabase
            .from('lowcode_form_responses')
            .select('id, data, created_at, ip', { count: 'exact' })
            .eq('form_id', formId)
            .order('created_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        if (error) throw error;

        res.json({
            success: true,
            data: {
                responses: data,
                pagination: { page: parseInt(page), limit: parseInt(limit), total: count }
            }
        });
    } catch (error) {
        res.status(500).json({ error: '获取回复失败' });
    }
});

// ==================== 5.3 工作流引擎 ====================

/**
 * 获取工作流节点类型
 * GET /api/lowcode/workflow/nodes
 */
router.get('/workflow/nodes', async (req, res) => {
    try {
        res.json({
            success: true,
            data: WORKFLOW_NODES
        });
    } catch (error) {
        res.status(500).json({ error: '获取节点类型失败' });
    }
});

/**
 * 创建工作流
 * POST /api/lowcode/workflows
 */
router.post('/workflows', [
    body('name').trim().isLength({ min: 1, max: 50 }),
    body('trigger').isIn(['form_submit', 'schedule', 'webhook', 'manual']),
    validateRequest
], async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, description, trigger, triggerConfig = {}, nodes = [], connections = [] } = req.body;

        const workflowId = uuidv4();
        const workflow = {
            id: workflowId,
            user_id: userId,
            name,
            description: description || '',
            trigger,
            trigger_config: triggerConfig,
            nodes: nodes.map(n => ({
                id: n.id || uuidv4(),
                type: n.type,
                position: n.position || { x: 0, y: 0 },
                config: n.config || {}
            })),
            connections,
            is_active: false,
            run_count: 0,
            created_at: new Date(),
            updated_at: new Date()
        };

        await supabase.from('lowcode_workflows').insert(workflow);

        res.json({
            success: true,
            data: {
                workflowId,
                name,
                trigger
            }
        });
    } catch (error) {
        res.status(500).json({ error: '创建工作流失败' });
    }
});

/**
 * 获取工作流列表
 * GET /api/lowcode/workflows
 */
router.get('/workflows', async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20 } = req.query;

        const { data, count, error } = await supabase
            .from('lowcode_workflows')
            .select('id, name, trigger, is_active, run_count, created_at, updated_at', { count: 'exact' })
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        if (error) throw error;

        res.json({
            success: true,
            data: {
                workflows: data,
                pagination: { page: parseInt(page), limit: parseInt(limit), total: count }
            }
        });
    } catch (error) {
        res.status(500).json({ error: '获取工作流列表失败' });
    }
});

/**
 * 获取工作流详情
 * GET /api/lowcode/workflows/:workflowId
 */
router.get('/workflows/:workflowId', async (req, res) => {
    try {
        const { workflowId } = req.params;
        const userId = req.user.id;

        const { data: workflow } = await supabase
            .from('lowcode_workflows')
            .select('*')
            .eq('id', workflowId)
            .eq('user_id', userId)
            .single();

        if (!workflow) {
            return res.status(404).json({ error: '工作流不存在' });
        }

        // 获取执行历史
        const { data: executions } = await supabase
            .from('lowcode_workflow_executions')
            .select('id, status, started_at, completed_at, error')
            .eq('workflow_id', workflowId)
            .order('started_at', { ascending: false })
            .limit(10);

        res.json({
            success: true,
            data: {
                workflow,
                executions: executions || []
            }
        });
    } catch (error) {
        res.status(500).json({ error: '获取工作流失败' });
    }
});

/**
 * 更新工作流
 * PUT /api/lowcode/workflows/:workflowId
 */
router.put('/workflows/:workflowId', async (req, res) => {
    try {
        const { workflowId } = req.params;
        const userId = req.user.id;
        const updates = req.body;

        await supabase.from('lowcode_workflows')
            .update({
                ...updates,
                updated_at: new Date()
            })
            .eq('id', workflowId)
            .eq('user_id', userId);

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: '更新工作流失败' });
    }
});

/**
 * 启用/禁用工作流
 * POST /api/lowcode/workflows/:workflowId/toggle
 */
router.post('/workflows/:workflowId/toggle', async (req, res) => {
    try {
        const { workflowId } = req.params;
        const userId = req.user.id;
        const { active } = req.body;

        await supabase.from('lowcode_workflows')
            .update({ is_active: active, updated_at: new Date() })
            .eq('id', workflowId)
            .eq('user_id', userId);

        res.json({ success: true, data: { isActive: active } });
    } catch (error) {
        res.status(500).json({ error: '切换状态失败' });
    }
});

/**
 * 手动执行工作流
 * POST /api/lowcode/workflows/:workflowId/run
 */
router.post('/workflows/:workflowId/run', async (req, res) => {
    try {
        const { workflowId } = req.params;
        const userId = req.user.id;
        const { input = {} } = req.body;

        const { data: workflow } = await supabase
            .from('lowcode_workflows')
            .select('*')
            .eq('id', workflowId)
            .eq('user_id', userId)
            .single();

        if (!workflow) {
            return res.status(404).json({ error: '工作流不存在' });
        }

        // 创建工作流执行
        const execution = {
            id: uuidv4(),
            workflow_id: workflowId,
            status: 'running',
            input,
            started_at: new Date()
        };

        await supabase.from('lowcode_workflow_executions').insert(execution);

        // 异步执行工作流
        executeWorkflow(execution.id, workflow, input);

        res.json({
            success: true,
            data: {
                executionId: execution.id,
                status: 'running'
            }
        });
    } catch (error) {
        res.status(500).json({ error: '启动工作流失败' });
    }
});

// ==================== 5.4 自定义组件 ====================

/**
 * 创建自定义组件
 * POST /api/lowcode/components/custom
 */
router.post('/components/custom', [
    body('name').trim().isLength({ min: 1, max: 50 }),
    body('category').isIn(['basic', 'layout', 'form', 'data', 'advanced']),
    validateRequest
], async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, category, description, props = [], template, styles = '', scripts = '' } = req.body;

        const componentId = uuidv4();
        const component = {
            id: componentId,
            user_id: userId,
            name,
            category,
            description: description || '',
            props: props.map(p => ({
                name: p.name,
                type: p.type || 'string',
                default: p.default,
                label: p.label || p.name,
                required: p.required || false
            })),
            template,
            styles,
            scripts,
            is_public: false,
            use_count: 0,
            created_at: new Date(),
            updated_at: new Date()
        };

        await supabase.from('lowcode_custom_components').insert(component);

        res.json({
            success: true,
            data: {
                componentId,
                name,
                category
            }
        });
    } catch (error) {
        res.status(500).json({ error: '创建组件失败' });
    }
});

/**
 * 获取自定义组件列表
 * GET /api/lowcode/components/custom
 */
router.get('/components/custom', async (req, res) => {
    try {
        const userId = req.user.id;
        const { category, page = 1, limit = 20 } = req.query;

        let query = supabase
            .from('lowcode_custom_components')
            .select('id, name, category, description, props, is_public, use_count, created_at')
            .or(`user_id.eq.${userId},is_public.eq.true`)
            .order('use_count', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        if (category) {
            query = query.eq('category', category);
        }

        const { data, count, error } = await query;
        if (error) throw error;

        res.json({
            success: true,
            data: {
                components: data,
                pagination: { page: parseInt(page), limit: parseInt(limit), total: count }
            }
        });
    } catch (error) {
        res.status(500).json({ error: '获取组件失败' });
    }
});

// ==================== 辅助函数 ====================

function getTemplateComponents(template) {
    const templates = {
        blank: [],
        landing: [
            { id: uuidv4(), type: 'heading', props: { content: '欢迎来到我的页面', level: 1, align: 'center' }, position: { x: 0, y: 0 } },
            { id: uuidv4(), type: 'text', props: { content: '这是一个开始', align: 'center' }, position: { x: 0, y: 60 } },
            { id: uuidv4(), type: 'button', props: { text: '开始探索', type: 'primary' }, position: { x: 0, y: 120 } }
        ],
        blog: [
            { id: uuidv4(), type: 'container', props: { padding: 40 }, position: { x: 0, y: 0 }, children: [
                { id: uuidv4(), type: 'heading', props: { content: '最新文章', level: 2 } },
                { id: uuidv4(), type: 'list', props: { dataSource: [], itemLayout: 'vertical' } }
            ]}
        ]
    };
    return templates[template] || [];
}

function generatePageHTML(page, isPreview = false) {
    // 生成HTML模板
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${page.title}</title>
    <meta name="description" content="${page.settings?.seo?.description || ''}">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: ${page.styles?.backgroundColor || '#f5f5f5'};
        }
        .page-container {
            max-width: ${page.styles?.maxWidth || 1200}px;
            margin: 0 auto;
            padding: ${page.styles?.padding || 0}px;
        }
        ${generateComponentStyles()}
        ${page.styles?.custom || ''}
    </style>
</head>
<body>
    <div class="page-container">
        ${generateComponentsHTML(page.components || [])}
    </div>
    ${isPreview ? '<div class="preview-badge">预览模式</div>' : ''}
    <script>
        ${generateComponentScripts()}
        ${page.scripts?.join('\n') || ''}
    </script>
</body>
</html>`;
}

function generateComponentsHTML(components) {
    return components.map(c => {
        switch (c.type) {
            case 'text':
                return `<p style="font-size: ${c.props.fontSize}px; color: ${c.props.color}; text-align: ${c.props.align}">${c.props.content}</p>`;
            case 'heading':
                const tag = `h${c.props.level}`;
                return `<${tag} style="color: ${c.props.color}; text-align: ${c.props.align}">${c.props.content}</${tag}>`;
            case 'button':
                return `<button class="btn btn-${c.props.type}">${c.props.text}</button>`;
            case 'image':
                return `<img src="${c.props.src}" alt="${c.props.alt}" style="width: ${c.props.width}; border-radius: ${c.props.borderRadius}px">`;
            default:
                return `<div class="component-${c.type}"></div>`;
        }
    }).join('\n');
}

function generateComponentStyles() {
    return `
        .btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; }
        .btn-primary { background: #1890ff; color: white; }
        .btn-default { background: #fff; border: 1px solid #d9d9d9; }
        .preview-badge { 
            position: fixed; 
            top: 10px; 
            right: 10px; 
            background: #faad14; 
            color: white; 
            padding: 4px 12px; 
            border-radius: 4px;
            font-size: 12px;
        }
    `;
}

function generateComponentScripts() {
    return `
        document.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('click', function() {
                console.log('Button clicked');
            });
        });
    `;
}

async function triggerFormWorkflow(form, data) {
    // 查找关联的工作流
    const { data: workflows } = await supabase
        .from('lowcode_workflows')
        .select('*')
        .eq('trigger', 'form_submit')
        .eq('trigger_config->>formId', form.id)
        .eq('is_active', true);

    for (const workflow of workflows || []) {
        const execution = {
            id: uuidv4(),
            workflow_id: workflow.id,
            status: 'running',
            input: { formData: data },
            started_at: new Date()
        };
        await supabase.from('lowcode_workflow_executions').insert(execution);
        executeWorkflow(execution.id, workflow, { formData: data });
    }
}

async function executeWorkflow(executionId, workflow, input) {
    try {
        // 简化的工作流执行逻辑
        const nodeMap = new Map(workflow.nodes.map(n => [n.id, n]));
        const visited = new Set();
        const results = {};

        // 找到开始节点
        const startNode = workflow.nodes.find(n => n.type === 'start');
        if (!startNode) {
            throw new Error('No start node found');
        }

        // BFS执行
        const queue = [startNode.id];
        
        while (queue.length > 0) {
            const nodeId = queue.shift();
            if (visited.has(nodeId)) continue;
            visited.add(nodeId);

            const node = nodeMap.get(nodeId);
            results[nodeId] = await executeNode(node, input, results);

            // 找到下一个节点
            const connections = workflow.connections.filter(c => c.source === nodeId);
            for (const conn of connections) {
                if (!visited.has(conn.target)) {
                    queue.push(conn.target);
                }
            }
        }

        // 更新执行状态
        await supabase.from('lowcode_workflow_executions')
            .update({
                status: 'completed',
                completed_at: new Date(),
                output: results
            })
            .eq('id', executionId);

    } catch (error) {
        await supabase.from('lowcode_workflow_executions')
            .update({
                status: 'failed',
                completed_at: new Date(),
                error: error.message
            })
            .eq('id', executionId);
    }
}

async function executeNode(node, input, results) {
    switch (node.type) {
        case 'start':
            return input;
        case 'end':
            return { finished: true };
        case 'delay':
            await new Promise(r => setTimeout(r, (node.config?.delay || 1) * 1000));
            return { delayed: true };
        case 'webhook':
            // 调用webhook
            return { webhookCalled: true };
        case 'email':
            // 发送邮件
            return { emailSent: true };
        default:
            return { executed: true };
    }
}

module.exports = router;
