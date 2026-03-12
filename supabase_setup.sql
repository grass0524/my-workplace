-- Supabase 数据库架构设置
-- 请在 Supabase 项目的 SQL Editor 中执行以下SQL语句

-- ============================================
-- 用户数据表
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_data (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 启用RLS（行级安全）
ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能读写自己的数据
CREATE POLICY "用户可以查看自己的数据" ON public.user_data
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "用户可以插入自己的数据" ON public.user_data
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "用户可以更新自己的数据" ON public.user_data
    FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- 健康打卡记录表
-- ============================================
CREATE TABLE IF NOT EXISTS public.health_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    device_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id)
);

ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户可以查看自己的健康记录" ON public.health_records
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以插入自己的健康记录" ON public.health_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的健康记录" ON public.health_records
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的健康记录" ON public.health_records
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 待办事项表
-- ============================================
CREATE TABLE IF NOT EXISTS public.todos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    device_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id)
);

ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户可以查看自己的待办事项" ON public.todos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以插入自己的待办事项" ON public.todos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的待办事项" ON public.todos
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的待办事项" ON public.todos
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 词库表
-- ============================================
CREATE TABLE IF NOT EXISTS public.vocab_library (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    device_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id)
);

ALTER TABLE public.vocab_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户可以查看自己的词库" ON public.vocab_library
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以插入自己的词库" ON public.vocab_library
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的词库" ON public.vocab_library
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的词库" ON public.vocab_library
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 生词本表
-- ============================================
CREATE TABLE IF NOT EXISTS public.my_vocab (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    device_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id)
);

ALTER TABLE public.my_vocab ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户可以查看自己的生词本" ON public.my_vocab
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以插入自己的生词本" ON public.my_vocab
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的生词本" ON public.my_vocab
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的生词本" ON public.my_vocab
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 记账数据表
-- ============================================
CREATE TABLE IF NOT EXISTS public.accounting_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    device_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id)
);

ALTER TABLE public.accounting_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户可以查看自己的记账数据" ON public.accounting_data
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以插入自己的记账数据" ON public.accounting_data
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的记账数据" ON public.accounting_data
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的记账数据" ON public.accounting_data
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 创建索引以提高查询性能
-- ============================================
CREATE INDEX IF NOT EXISTS idx_health_records_user_id ON public.health_records(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON public.todos(user_id);
CREATE INDEX IF NOT EXISTS idx_vocab_library_user_id ON public.vocab_library(user_id);
CREATE INDEX IF NOT EXISTS idx_my_vocab_user_id ON public.my_vocab(user_id);
CREATE INDEX IF NOT EXISTS idx_accounting_data_user_id ON public.accounting_data(user_id);

-- ============================================
-- 创建自动更新 updated_at 的触发器
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_data_updated_at BEFORE UPDATE ON public.user_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_records_updated_at BEFORE UPDATE ON public.health_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_todos_updated_at BEFORE UPDATE ON public.todos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vocab_library_updated_at BEFORE UPDATE ON public.vocab_library
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_my_vocab_updated_at BEFORE UPDATE ON public.my_vocab
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounting_data_updated_at BEFORE UPDATE ON public.accounting_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 完成提示
-- ============================================
-- 执行完成后，在 Supabase 控制台中：
-- 1. 进入 Authentication > Settings
-- 2. 确保 "Enable email confirmations" 可以根据需要开启或关闭
-- 3. 将本项目的 URL 添加到 "Site URL"
-- 4. 将允许的重定向URL添加到 "Redirect URLs"
