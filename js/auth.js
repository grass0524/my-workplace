/**
 * 认证模块 - 处理用户登录、注册、登出
 * 使用 Supabase 进行认证
 */

class Auth {
    constructor() {
        this.supabase = null;
        this.user = null;
        this.session = null;
        this.isInitialized = false;
    }

    /**
     * 初始化 Supabase 客户端
     * @param {string} url - Supabase URL
     * @param {string} key - Supabase匿名密钥
     */
    async initialize(url, key) {
        try {
            // 动态加载 Supabase 库
            if (typeof supabase === 'undefined') {
                throw new Error('Supabase 库未加载，请检查CDN链接');
            }

            this.supabase = supabase.createClient(url, key);
            this.isInitialized = true;

            // 检查现有会话
            const { data: { session } } = await this.supabase.auth.getSession();
            if (session) {
                this.user = session.user;
                this.session = session;
                console.log('[Auth] 已登录用户:', this.user.email);
            }

            // 监听认证状态变化
            this.supabase.auth.onAuthStateChange((event, session) => {
                console.log('[Auth] 认证状态变化:', event);
                if (event === 'SIGNED_IN') {
                    this.user = session.user;
                    this.session = session;
                    this.onLoginCallback?.(this.user);
                } else if (event === 'SIGNED_OUT') {
                    this.user = null;
                    this.session = null;
                    this.onLogoutCallback?.();
                }
            });

            return { error: null };
        } catch (error) {
            console.error('[Auth] 初始化失败:', error);
            return { error: { message: '认证服务初始化失败：' + error.message } };
        }
    }

    /**
     * 用户注册
     * @param {string} email - 邮箱地址
     * @param {string} password - 密码
     */
    async register(email, password) {
        if (!this.isInitialized) {
            return { error: { message: '认证服务未初始化' } };
        }

        try {
            console.log('[Auth] 尝试注册:', email);

            const { data, error } = await this.supabase.auth.signUp({
                email: email,
                password: password,
            });

            if (error) {
                console.error('[Auth] 注册失败:', error);
                return { error };
            }

            console.log('[Auth] 注册成功:', data);
            this.user = data.user;
            this.session = data.session;

            // 创建用户数据表记录
            if (data.user) {
                await this.createUserData(data.user.id);
            }

            return { data, error: null };
        } catch (error) {
            console.error('[Auth] 注册异常:', error);
            return { error: { message: '注册失败：' + error.message } };
        }
    }

    /**
     * 用户登录
     * @param {string} email - 邮箱地址
     * @param {string} password - 密码
     */
    async login(email, password) {
        if (!this.isInitialized) {
            return { error: { message: '认证服务未初始化' } };
        }

        try {
            console.log('[Auth] 尝试登录:', email);

            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                console.error('[Auth] 登录失败:', error);
                return { error };
            }

            console.log('[Auth] 登录成功:', data);
            this.user = data.user;
            this.session = data.session;

            return { data, error: null };
        } catch (error) {
            console.error('[Auth] 登录异常:', error);
            return { error: { message: '登录失败：' + error.message } };
        }
    }

    /**
     * 用户登出
     */
    async logout() {
        if (!this.isInitialized) {
            return { error: { message: '认证服务未初始化' } };
        }

        try {
            console.log('[Auth] 尝试登出');

            const { error } = await this.supabase.auth.signOut();

            if (error) {
                console.error('[Auth] 登出失败:', error);
                return { error };
            }

            console.log('[Auth] 登出成功');
            this.user = null;
            this.session = null;

            return { error: null };
        } catch (error) {
            console.error('[Auth] 登出异常:', error);
            return { error: { message: '登出失败：' + error.message } };
        }
    }

    /**
     * 发送密码重置邮件
     * @param {string} email - 邮箱地址
     */
    async resetPassword(email) {
        if (!this.isInitialized) {
            return { error: { message: '认证服务未初始化' } };
        }

        try {
            console.log('[Auth] 发送密码重置邮件:', email);

            // 检测当前协议，file:// 使用相对路径，http(s):// 使用完整路径
            let resetUrl;
            if (window.location.protocol === 'file:') {
                // file:// 协议，使用相对路径
                resetUrl = 'reset-password.html';
            } else {
                // http:// 或 https://，使用完整路径
                resetUrl = window.location.origin + '/reset-password.html';
            }

            const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: resetUrl,
            });

            if (error) {
                console.error('[Auth] 发送重置邮件失败:', error);
                return { error };
            }

            console.log('[Auth] 重置邮件发送成功，跳转地址:', resetUrl);
            return { error: null };
        } catch (error) {
            console.error('[Auth] 发送重置邮件异常:', error);
            return { error: { message: '发送重置邮件失败：' + error.message } };
        }
    }

    /**
     * 更新密码
     * @param {string} newPassword - 新密码
     */
    async updatePassword(newPassword) {
        if (!this.isInitialized) {
            return { error: { message: '认证服务未初始化' } };
        }

        try {
            console.log('[Auth] 更新密码');

            const { error } = await this.supabase.auth.updateUser({
                password: newPassword
            });

            if (error) {
                console.error('[Auth] 更新密码失败:', error);
                return { error };
            }

            console.log('[Auth] 密码更新成功');
            return { error: null };
        } catch (error) {
            console.error('[Auth] 更新密码异常:', error);
            return { error: { message: '更新密码失败：' + error.message } };
        }
    }

    /**
     * 获取当前用户
     */
    getCurrentUser() {
        return this.user;
    }

    /**
     * 检查是否已登录
     */
    isAuthenticated() {
        return !!this.user;
    }

    /**
     * 创建用户数据记录
     * @param {string} userId - 用户ID
     */
    async createUserData(userId) {
        try {
            const { error } = await this.supabase
                .from('user_data')
                .insert({
                    id: userId,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                });

            if (error && error.code !== '23505') { // 忽略唯一性约束错误
                console.error('[Auth] 创建用户数据失败:', error);
            }
        } catch (error) {
            console.error('[Auth] 创建用户数据异常:', error);
        }
    }

    /**
     * 设置登录回调
     */
    onLogin(callback) {
        this.onLoginCallback = callback;
    }

    /**
     * 设置登出回调
     */
    onLogout(callback) {
        this.onLogoutCallback = callback;
    }
}

// 创建全局认证实例
const auth = new Auth();

// 从配置文件或window对象加载 Supabase 配置
async function loadConfig() {
    // 优先从window对象读取（支持file://协议）
    if (window.supabaseConfig) {
        console.log('[Auth] 使用内联配置');
        return window.supabaseConfig;
    }

    // 尝试从配置文件加载
    try {
        const response = await fetch('/config/supabase.json');
        if (!response.ok) {
            throw new Error('无法加载配置文件');
        }
        const config = await response.json();
        return config;
    } catch (error) {
        console.error('[Auth] 加载配置失败:', error);
        // 返回默认配置（需要用户替换）
        return {
            url: 'YOUR_SUPABASE_URL',
            key: 'YOUR_SUPABASE_ANON_KEY'
        };
    }
}

// 初始化认证服务
async function initAuth() {
    const config = await loadConfig();

    if (config.url === 'YOUR_SUPABASE_URL') {
        console.warn('[Auth] 请配置 Supabase URL 和密钥');
        return { error: { message: '请先配置 Supabase' } };
    }

    return await auth.initialize(config.url, config.key);
}

// 页面加载时自动初始化
if (typeof window !== 'undefined') {
    window.auth = auth;
    window.initAuth = initAuth;

    // 如果在登录/注册页面，自动初始化
    if (window.location.pathname.includes('login.html') ||
        window.location.pathname.includes('register.html')) {
        initAuth();
    }
}
