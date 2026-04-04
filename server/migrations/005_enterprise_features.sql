-- ============================================
-- 第五轮企业级功能数据库迁移
-- 创建时间: 2026-04-04
-- 功能: RBAC权限、组织架构、审计日志、配置管理
-- ============================================

-- ============================================
-- 一、RBAC 权限管理
-- ============================================

-- 权限表
CREATE TABLE IF NOT EXISTS rbac_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(100) UNIQUE NOT NULL,
    module VARCHAR(50) NOT NULL,
    description TEXT,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 角色表
CREATE TABLE IF NOT EXISTS rbac_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    data_scope VARCHAR(20) DEFAULT 'all' CHECK (data_scope IN ('all', 'department', 'self')),
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 角色权限关联表
CREATE TABLE IF NOT EXISTS rbac_role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES rbac_roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES rbac_permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- 用户角色关联表
CREATE TABLE IF NOT EXISTS rbac_user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES rbac_roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

-- ============================================
-- 二、组织架构
-- ============================================

-- 部门表
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(100) UNIQUE,
    parent_id UUID REFERENCES departments(id),
    manager_id UUID REFERENCES auth.users(id),
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户部门关联表
CREATE TABLE IF NOT EXISTS user_departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    position VARCHAR(100),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, department_id)
);

-- ============================================
-- 三、审计日志
-- ============================================

-- 审计日志表
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(50) NOT NULL,
    resource VARCHAR(50) NOT NULL,
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    request_method VARCHAR(10),
    request_path TEXT,
    request_body JSONB,
    response_status INTEGER,
    execution_time INTEGER, -- 毫秒
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 审计日志归档表（分区表）
CREATE TABLE IF NOT EXISTS audit_logs_archive (
    LIKE audit_logs INCLUDING ALL,
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 四、系统配置
-- ============================================

-- 系统配置表
CREATE TABLE IF NOT EXISTS system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module VARCHAR(50) NOT NULL,
    key VARCHAR(100) NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT false,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(module, key)
);

-- 配置变更历史表
CREATE TABLE IF NOT EXISTS config_change_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module VARCHAR(50) NOT NULL,
    key VARCHAR(100) NOT NULL,
    old_value JSONB,
    new_value JSONB,
    changed_by UUID REFERENCES auth.users(id),
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 五、内容审核
-- ============================================

-- 内容审核表
CREATE TABLE IF NOT EXISTS content_moderation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('article', 'comment', 'user_profile')),
    content_id UUID NOT NULL,
    content_text TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
    
    -- 自动审核结果
    auto_check_result JSONB,
    auto_check_score DECIMAL(3,2),
    
    -- 人工审核
    reviewer_id UUID REFERENCES auth.users(id),
    review_reason TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    -- 提交者
    submitter_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 审核规则表
CREATE TABLE IF NOT EXISTS moderation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    rule_type VARCHAR(20) NOT NULL CHECK (rule_type IN ('keyword', 'regex', 'ml_model')),
    pattern TEXT NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('block', 'flag', 'replace')),
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 审核日志表
CREATE TABLE IF NOT EXISTS moderation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    moderation_id UUID REFERENCES content_moderation(id),
    reviewer_id UUID REFERENCES auth.users(id),
    action VARCHAR(20) NOT NULL,
    reason TEXT,
    content_type VARCHAR(20),
    content_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 六、批量操作日志
-- ============================================

CREATE TABLE IF NOT EXISTS batch_operation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID REFERENCES auth.users(id),
    action VARCHAR(50) NOT NULL,
    target VARCHAR(50) NOT NULL,
    item_count INTEGER NOT NULL,
    options JSONB DEFAULT '{}',
    result JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- 七、索引创建
-- ============================================

-- RBAC索引
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON rbac_role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_perm ON rbac_role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON rbac_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON rbac_user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_permissions_module ON rbac_permissions(module);
CREATE INDEX IF NOT EXISTS idx_permissions_resource_action ON rbac_permissions(resource, action);

-- 组织架构索引
CREATE INDEX IF NOT EXISTS idx_departments_parent ON departments(parent_id);
CREATE INDEX IF NOT EXISTS idx_user_departments_user ON user_departments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_departments_dept ON user_departments(department_id);

-- 审计日志索引
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip ON audit_logs(ip_address);

-- 内容审核索引
CREATE INDEX IF NOT EXISTS idx_content_moderation_status ON content_moderation(status);
CREATE INDEX IF NOT EXISTS idx_content_moderation_type ON content_moderation(content_type);
CREATE INDEX IF NOT EXISTS idx_content_moderation_reviewer ON content_moderation(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_content_moderation_created ON content_moderation(created_at);

-- ============================================
-- 八、初始权限数据
-- ============================================

INSERT INTO rbac_permissions (name, code, module, description, resource, action) VALUES
-- 用户管理
('用户查看', 'user:read', 'user', '查看用户列表和详情', 'user', 'read'),
('用户创建', 'user:create', 'user', '创建新用户', 'user', 'create'),
('用户更新', 'user:update', 'user', '更新用户信息', 'user', 'update'),
('用户删除', 'user:delete', 'user', '删除用户', 'user', 'delete'),

-- 内容管理
('文章查看', 'article:read', 'article', '查看文章', 'article', 'read'),
('文章创建', 'article:create', 'article', '创建文章', 'article', 'create'),
('文章更新', 'article:update', 'article', '更新文章', 'article', 'update'),
('文章删除', 'article:delete', 'article', '删除文章', 'article', 'delete'),

-- 系统管理
('角色管理', 'rbac:manage', 'rbac', '管理角色和权限', 'rbac', '*'),
('部门管理', 'department:manage', 'department', '管理部门架构', 'department', '*'),
('系统配置', 'config:manage', 'config', '管理系统配置', 'config', '*'),
('审计日志', 'audit:read', 'audit', '查看审计日志', 'audit', 'read'),

-- 数据管理
('数据导出', 'data:export', 'data', '导出数据', 'data', 'export'),
('数据导入', 'data:import', 'data', '导入数据', 'data', 'import'),
('数据备份', 'data:backup', 'data', '备份数据', 'data', 'backup')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 九、初始角色数据
-- ============================================

INSERT INTO rbac_roles (name, code, description, data_scope, is_system) VALUES
('超级管理员', 'super_admin', '系统超级管理员，拥有所有权限', 'all', true),
('管理员', 'admin', '系统管理员', 'all', true),
('部门主管', 'dept_manager', '部门主管，管理部门内数据', 'department', true),
('普通用户', 'user', '普通用户，只能操作自己的数据', 'self', true)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 十、函数和触发器
-- ============================================

-- 审计日志记录函数
CREATE OR REPLACE FUNCTION log_audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        user_id,
        action,
        resource,
        resource_id,
        details,
        created_at
    ) VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        jsonb_build_object('old', OLD, 'new', NEW),
        NOW()
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 更新时间戳函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为角色表添加更新时间触发器
CREATE TRIGGER update_rbac_roles_updated_at
    BEFORE UPDATE ON rbac_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 为部门表添加更新时间触发器
CREATE TRIGGER update_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 十一、RLS 策略
-- ============================================

-- 审计日志RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit logs"
    ON audit_logs FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM rbac_user_roles ur
        JOIN rbac_roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        AND r.code IN ('super_admin', 'admin')
    ));

-- 配置表RLS
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Configs are readable by all authenticated users"
    ON system_config FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can modify configs"
    ON system_config FOR ALL
    USING (EXISTS (
        SELECT 1 FROM rbac_user_roles ur
        JOIN rbac_roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        AND r.code IN ('super_admin', 'admin')
    ));

-- ============================================
-- 迁移完成
-- ============================================
