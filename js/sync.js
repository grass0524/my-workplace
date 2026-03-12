/**
 * 数据同步引擎 - 处理本地数据与云端数据的双向同步
 * 采用时间戳+最后写入优先策略
 */

class DataSync {
    constructor(auth) {
        this.auth = auth;
        this.supabase = null;
        this.isSyncing = false;
        this.syncInterval = 30000; // 30秒自动同步一次
        this.syncTimer = null;
        this.offlineQueue = []; // 离线操作队列
        this.lastSyncTime = null;

        // 数据类型配置
        this.dataTypes = {
            healthRecords: {
                tableName: 'health_records',
                localKey: 'healthRecords',
                mergeStrategy: 'append' // 列表数据采用追加合并
            },
            todos: {
                tableName: 'todos',
                localKey: 'todos',
                mergeStrategy: 'append'
            },
            vocabLibrary: {
                tableName: 'vocab_library',
                localKey: 'vocabLibrary',
                mergeStrategy: 'replace' // 词库数据采用替换
            },
            myVocab: {
                tableName: 'my_vocab',
                localKey: 'myVocab',
                mergeStrategy: 'append'
            },
            accountingData: {
                tableName: 'accounting_data',
                localKey: 'accountingData',
                mergeStrategy: 'append'
            }
        };
    }

    /**
     * 初始化同步引擎
     */
    async initialize() {
        if (!this.auth || !this.auth.supabase) {
            console.error('[Sync] 认证服务未初始化');
            return false;
        }

        this.supabase = this.auth.supabase;
        console.log('[Sync] 同步引擎初始化成功');

        // 启动自动同步
        this.startAutoSync();

        // 监听在线状态
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());

        return true;
    }

    /**
     * 上传本地数据到云端
     */
    async uploadData(dataType) {
        if (!this.auth.isAuthenticated()) {
            console.warn('[Sync] 用户未登录，跳过上传');
            return { error: { message: '用户未登录' } };
        }

        const config = this.dataTypes[dataType];
        if (!config) {
            return { error: { message: '未知的数据类型' } };
        }

        try {
            // 从localStorage读取本地数据，根据数据类型使用正确的默认值
            const defaultValues = {
                'healthRecords': [],
                'todos': [],
                'accountingData': [],
                'vocabLibrary': {},
                'myVocab': {}
            };
            const defaultValue = JSON.stringify(defaultValues[config.localKey] || '{}');
            const localData = JSON.parse(localStorage.getItem(config.localKey) || defaultValue);

            // 添加同步元数据
            const syncData = {
                user_id: this.auth.user.id,
                data: localData,
                updated_at: new Date().toISOString(),
                device_id: this.getDeviceId()
            };

            console.log('[Sync] 上传数据:', dataType, syncData);

            // 上传到Supabase
            const { data, error } = await this.supabase
                .from(config.tableName)
                .upsert(syncData, { onConflict: 'user_id' });

            if (error) {
                console.error('[Sync] 上传失败:', error);
                // 如果离线，加入队列
                if (!navigator.onLine) {
                    this.addToOfflineQueue('upload', dataType, localData);
                }
                return { error };
            }

            console.log('[Sync] 上传成功:', dataType);
            return { data, error: null };
        } catch (error) {
            console.error('[Sync] 上传异常:', error);
            return { error: { message: '上传失败：' + error.message } };
        }
    }

    /**
     * 从云端下载数据
     */
    async downloadData(dataType) {
        if (!this.auth.isAuthenticated()) {
            console.warn('[Sync] 用户未登录，跳过下载');
            return { error: { message: '用户未登录' } };
        }

        const config = this.dataTypes[dataType];
        if (!config) {
            return { error: { message: '未知的数据类型' } };
        }

        try {
            console.log('[Sync] 下载数据:', dataType);

            const { data, error } = await this.supabase
                .from(config.tableName)
                .select('data, updated_at')
                .eq('user_id', this.auth.user.id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // 没有数据，这是正常的
                    console.log('[Sync] 云端无数据:', dataType);
                    return { data: null, error: null };
                }
                console.error('[Sync] 下载失败:', error);
                return { error };
            }

            console.log('[Sync] 下载成功:', dataType, data);
            return { data, error: null };
        } catch (error) {
            console.error('[Sync] 下载异常:', error);
            return { error: { message: '下载失败：' + error.message } };
        }
    }

    /**
     * 双向同步：合并本地和云端数据
     */
    async syncData(dataType) {
        if (this.isSyncing) {
            console.warn('[Sync] 正在同步中，跳过');
            return;
        }

        this.isSyncing = true;
        console.log('[Sync] 开始同步:', dataType);

        try {
            const config = this.dataTypes[dataType];

            // 1. 下载云端数据
            const { data: cloudData, error: downloadError } = await this.downloadData(dataType);

            if (downloadError) {
                console.error('[Sync] 同步失败（下载）:', downloadError);
                return { error: downloadError };
            }

            // 2. 读取本地数据
            const localDataRaw = localStorage.getItem(config.localKey);
            const localData = localDataRaw ? JSON.parse(localDataRaw) : {};

            // 3. 根据合并策略处理数据
            let mergedData;
            let needUpload = false;

            if (!cloudData || !cloudData.data) {
                // 云端无数据，直接上传本地数据
                mergedData = localData;
                needUpload = true;
            } else if (!localDataRaw) {
                // 本地无数据，直接使用云端数据
                mergedData = cloudData.data;
                this.saveToLocal(config.localKey, mergedData);
            } else {
                // 两边都有数据，需要合并
                const cloudTimestamp = new Date(cloudData.updated_at).getTime();
                const localTimestamp = this.getLocalDataTimestamp(config.localKey);

                if (config.mergeStrategy === 'append') {
                    // 追加合并策略（用于列表数据）
                    mergedData = this.mergeAppendData(localData, cloudData.data);
                    needUpload = true;
                } else if (config.mergeStrategy === 'replace') {
                    // 替换策略（时间戳比较）
                    if (cloudTimestamp > localTimestamp) {
                        mergedData = cloudData.data;
                        this.saveToLocal(config.localKey, mergedData);
                    } else {
                        mergedData = localData;
                        needUpload = true;
                    }
                }
            }

            // 4. 如果需要，上传合并后的数据
            if (needUpload && this.auth.isAuthenticated()) {
                await this.uploadData(dataType);
            }

            // 更新同步时间
            this.lastSyncTime = new Date();
            this.saveSyncTimestamp(dataType);

            console.log('[Sync] 同步完成:', dataType);
            return { error: null };
        } catch (error) {
            console.error('[Sync] 同步异常:', error);
            return { error: { message: '同步失败：' + error.message } };
        } finally {
            this.isSyncing = false;
        }
    }

    /**
     * 同步所有数据
     */
    async syncAll() {
        if (!this.auth.isAuthenticated()) {
            console.warn('[Sync] 用户未登录，跳过同步');
            return;
        }

        console.log('[Sync] 开始同步所有数据');

        for (const dataType of Object.keys(this.dataTypes)) {
            await this.syncData(dataType);
        }

        console.log('[Sync] 所有数据同步完成');

        // 触发自定义事件
        window.dispatchEvent(new CustomEvent('syncComplete', {
            detail: { timestamp: this.lastSyncTime }
        }));
    }

    /**
     * 追加合并策略：合并两个数据集，去重
     */
    mergeAppendData(localData, cloudData) {
        // 处理数组类型数据
        if (Array.isArray(localData) && Array.isArray(cloudData)) {
            // 使用ID去重，如果没有ID则使用整个对象比较
            const merged = [...localData];
            const localIds = new Set();

            localData.forEach(item => {
                if (item.id) localIds.add(item.id);
            });

            cloudData.forEach(item => {
                if (item.id) {
                    if (!localIds.has(item.id)) {
                        merged.push(item);
                    }
                } else {
                    // 没有ID，检查是否已存在
                    const exists = merged.some(localItem =>
                        JSON.stringify(localItem) === JSON.stringify(item)
                    );
                    if (!exists) {
                        merged.push(item);
                    }
                }
            });

            return merged;
        }

        // 处理对象类型数据
        if (typeof localData === 'object' && typeof cloudData === 'object') {
            return { ...localData, ...cloudData };
        }

        // 其他情况，返回本地数据（本地优先）
        return localData;
    }

    /**
     * 保存数据到localStorage
     */
    saveToLocal(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            localStorage.setItem(key + '_timestamp', Date.now().toString());
        } catch (error) {
            console.error('[Sync] 保存到本地失败:', error);
        }
    }

    /**
     * 获取本地数据时间戳
     */
    getLocalDataTimestamp(key) {
        const timestamp = localStorage.getItem(key + '_timestamp');
        return timestamp ? parseInt(timestamp) : 0;
    }

    /**
     * 保存同步时间戳
     */
    saveSyncTimestamp(dataType) {
        const key = 'sync_timestamp_' + dataType;
        localStorage.setItem(key, Date.now().toString());
    }

    /**
     * 获取设备ID
     */
    getDeviceId() {
        let deviceId = localStorage.getItem('device_id');
        if (!deviceId) {
            deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('device_id', deviceId);
        }
        return deviceId;
    }

    /**
     * 启动自动同步
     */
    startAutoSync() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
        }

        this.syncTimer = setInterval(() => {
            if (this.auth.isAuthenticated() && navigator.onLine) {
                this.syncAll();
            }
        }, this.syncInterval);

        console.log('[Sync] 自动同步已启动，间隔:', this.syncInterval, 'ms');
    }

    /**
     * 停止自动同步
     */
    stopAutoSync() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
            console.log('[Sync] 自动同步已停止');
        }
    }

    /**
     * 处理离线状态
     */
    handleOffline() {
        console.log('[Sync] 网络断开，进入离线模式');
        this.stopAutoSync();
    }

    /**
     * 处理在线状态
     */
    async handleOnline() {
        console.log('[Sync] 网络恢复，处理离线队列');
        await this.processOfflineQueue();
        this.startAutoSync();
        await this.syncAll();
    }

    /**
     * 添加到离线队列
     */
    addToOfflineQueue(action, dataType, data) {
        this.offlineQueue.push({
            action,
            dataType,
            data,
            timestamp: Date.now()
        });
        console.log('[Sync] 添加到离线队列:', { action, dataType });
        this.saveOfflineQueue();
    }

    /**
     * 处理离线队列
     */
    async processOfflineQueue() {
        if (this.offlineQueue.length === 0) {
            return;
        }

        console.log('[Sync] 处理离线队列，待处理:', this.offlineQueue.length);

        const queue = [...this.offlineQueue];
        this.offlineQueue = [];

        for (const item of queue) {
            try {
                if (item.action === 'upload') {
                    await this.uploadData(item.dataType);
                }
            } catch (error) {
                console.error('[Sync] 处理离线队列失败:', error);
                // 失败的重新加入队列
                this.offlineQueue.push(item);
            }
        }

        this.saveOfflineQueue();
        console.log('[Sync] 离线队列处理完成');
    }

    /**
     * 保存离线队列到localStorage
     */
    saveOfflineQueue() {
        localStorage.setItem('offline_queue', JSON.stringify(this.offlineQueue));
    }

    /**
     * 从localStorage加载离线队列
     */
    loadOfflineQueue() {
        const saved = localStorage.getItem('offline_queue');
        if (saved) {
            try {
                this.offlineQueue = JSON.parse(saved);
            } catch (error) {
                console.error('[Sync] 加载离线队列失败:', error);
            }
        }
    }
}

// 创建全局同步实例
let dataSync = null;

// 初始化同步引擎
async function initDataSync() {
    if (dataSync) {
        return dataSync;
    }

    dataSync = new DataSync(window.auth);
    const initialized = await dataSync.initialize();

    if (initialized) {
        // 加载离线队列
        dataSync.loadOfflineQueue();

        // 如果在线，立即同步一次
        if (navigator.onLine && window.auth.isAuthenticated()) {
            await dataSync.syncAll();
        }

        console.log('[Sync] 数据同步引擎已就绪');
    }

    return dataSync;
}

// 导出到全局
if (typeof window !== 'undefined') {
    window.DataSync = DataSync;
    window.initDataSync = initDataSync;
}
