/**
 * 数据同步引擎 - 处理本地数据与云端数据的双向同步
 * 采用时间戳+最后写入优先策略
 */

class DataSync {
    constructor(auth) {
        this.auth = auth;
        this.supabase = null;
        this.isSyncing = false;
        this.syncInterval = 300000; // 5分钟自动同步一次
        this.syncTimer = null;
        this.offlineQueue = []; // 离线操作队列
        this.lastSyncTime = null;

        // 数据类型配置
        this.dataTypes = {
            healthRecords: {
                tableName: 'health_records',
                localKey: 'healthRecords',
                mergeStrategy: 'replace'
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
            },
            moodEntries: {
                tableName: 'mood_entries',
                localKey: 'moodEntries',
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

        this.isReady = true; // 标记同步引擎已准备就绪
        console.log('[Sync] 同步引擎已就绪');

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
                'healthRecords': {},
                'todos': [],
                'accountingData': {records: []},  // 修复：accountingData 是对象格式
                'vocabLibrary': {},
                'myVocab': {},
                'moodEntries': []
            };
            const defaultValue = JSON.stringify(defaultValues[config.localKey] || '{}');
            let localData = JSON.parse(localStorage.getItem(config.localKey) || defaultValue);

            // 检查 healthRecords 格式，确保是对象而不是数组
            if (dataType === 'healthRecords' && Array.isArray(localData)) {
                console.error('[Sync] 检测到 healthRecords 是数组格式，拒绝上传');
                return { error: { message: 'healthRecords 格式错误：应该是对象而不是数组' } };
            }

            // 检查 accountingData 格式，确保是对象 {records: [...]}
            if (dataType === 'accountingData') {
                if (Array.isArray(localData)) {
                    // 如果是数组，包装成对象
                    console.warn('[Sync] 检测到 accountingData 是数组格式，自动转换为对象');
                    localData = { records: localData };
                }
                if (!localData.records || !Array.isArray(localData.records)) {
                    console.warn('[Sync] accountingData 格式错误，使用默认值');
                    localData = { records: [] };
                }
            }

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
            
            // 特殊处理：修复 healthRecords 的错误格式（数组 -> 对象）
            if (dataType === 'healthRecords' && data && data.data && Array.isArray(data.data)) {
                console.warn('[Sync] 检测到 healthRecords 云端数据格式错误（数组），需要修复');

                // 清空云端错误数据（保留本地数据）
                const { error: deleteError } = await this.supabase
                    .from(config.tableName)
                    .delete()
                    .eq('user_id', this.auth.user.id);

                if (deleteError) {
                    console.error('[Sync] 清空云端错误数据失败:', deleteError);
                } else {
                    console.log('[Sync] 已清空云端的错误格式数据');
                }

                // 返回空数据，让本地数据作为主数据
                return { data: null, error: null };
            }

            // 特殊处理：修复 accountingData 的嵌套数组格式
            if (dataType === 'accountingData' && data && data.data) {
                const cloudData = data.data;

                // 检测是否为嵌套数组
                if (Array.isArray(cloudData) && cloudData.length > 0) {
                    const isNestedArray = cloudData.some(item => Array.isArray(item));

                    if (isNestedArray) {
                        console.warn('[Sync] 检测到 accountingData 云端数据为嵌套数组格式，正在修复...');

                        // 递归提取所有记录
                        function extractAllRecords(data) {
                            let records = [];
                            if (Array.isArray(data)) {
                                data.forEach(item => {
                                    if (Array.isArray(item)) {
                                        records = records.concat(extractAllRecords(item));
                                    } else if (item && typeof item === 'object' && item.id) {
                                        records.push(item);
                                    }
                                });
                            }
                            return records;
                        }

                        const allRecords = extractAllRecords(cloudData);
                        console.log('[Sync] 提取到', allRecords.length, '条记录');

                        // 去重（按 id）
                        const uniqueRecords = [];
                        const seenIds = new Set();
                        allRecords.forEach(record => {
                            if (!seenIds.has(record.id)) {
                                seenIds.add(record.id);
                                uniqueRecords.push(record);
                            }
                        });

                        console.log('[Sync] 去重后剩余', uniqueRecords.length, '条唯一记录');

                        // 按日期排序（最新的在前）
                        uniqueRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

                        // 转换为正确的格式
                        const fixedData = { records: uniqueRecords };

                        console.log('[Sync] ✅ 已修复云端数据格式为 {records: [...]}');

                        // 立即上传修复后的数据到云端
                        const { error: uploadError } = await this.supabase
                            .from(config.tableName)
                            .upsert({
                                user_id: this.auth.user.id,
                                data: fixedData,
                                updated_at: new Date().toISOString()
                            }, { onConflict: 'user_id' });

                        if (uploadError) {
                            console.error('[Sync] 上传修复后的数据失败:', uploadError);
                        } else {
                            console.log('[Sync] ✅ 已将修复后的数据上传到云端');
                        }

                        // 返回修复后的数据
                        return { data: { data: fixedData, updated_at: data.updated_at }, error: null };
                    }
                }
            }
            
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
            this.currentDataType = config.localKey;

            // 1. 下载云端数据
            const { data: cloudData, error: downloadError } = await this.downloadData(dataType);

            if (downloadError) {
                console.error('[Sync] 同步失败（下载）:', downloadError);
                return { error: downloadError };
            }

            // 2. 读取本地数据
            const localDataRaw = localStorage.getItem(config.localKey);
            const localData = localDataRaw ? JSON.parse(localDataRaw) : {};

            // 检查本地数据是否为空（对象无键或数组长度为0）
            const isLocalEmpty = Array.isArray(localData) 
                ? localData.length === 0 
                : Object.keys(localData).length === 0;

            console.log(`[Sync] ${dataType} - 本地数据:`, localDataRaw ? `(${Array.isArray(localData) ? localData.length : Object.keys(localData).length}项)` : '空');
            console.log(`[Sync] ${dataType} - 云端数据:`, cloudData ? `(${Array.isArray(cloudData.data) ? cloudData.data.length : Object.keys(cloudData.data || {}).length}项)` : '无');

            // 3. 根据合并策略处理数据
            let mergedData;
            let needUpload = false;

            if (!cloudData || !cloudData.data) {
                // 云端无数据，直接上传本地数据
                mergedData = localData;
                needUpload = true;
                console.log(`[Sync] ${dataType} - 云端无数据，将上传本地数据`);
            } else if (!localDataRaw || isLocalEmpty) {
                // 本地无数据或数据为空
                if (localDataRaw && isLocalEmpty) {
                    // 本地显式为空数组/对象，说明用户删除了所有数据
                    // 应该用空数据覆盖云端，而不是使用云端数据
                    mergedData = localData;
                    console.log(`[Sync] ${dataType} - 本地数据已清空，将清空云端数据`);
                    needUpload = true;
                } else {
                    // 本地根本没有数据（新设备），使用云端数据
                    mergedData = cloudData.data;
                    this.saveToLocal(config.localKey, mergedData);
                    console.log(`[Sync] ${dataType} - 本地无数据（新设备），使用云端数据`);
                }
            } else {
                // 两边都有数据，需要合并
                const cloudTimestamp = new Date(cloudData.updated_at).getTime();
                const localTimestamp = this.getLocalDataTimestamp(config.localKey);

                if (config.mergeStrategy === 'append') {
                    // 追加合并策略（用于列表数据）
                    // 改进：比较ID集合而不是简单比较数量

                    // 特殊处理 accountingData：它是 {records: [...]} 格式
                    let localArray = localData;
                    let cloudArray = cloudData.data;

                    if (dataType === 'accountingData') {
                        // accountingData 格式：{records: [...]}
                        localArray = localData && localData.records ? localData.records : [];
                        cloudArray = cloudData.data && cloudData.data.records ? cloudData.data.records : [];
                    }

                    // 确保数据是数组
                    if (!Array.isArray(localArray) || !Array.isArray(cloudArray)) {
                        console.warn(`[Sync] ${dataType} - 数据类型错误，强制使用合并逻辑`);
                        mergedData = this.mergeAppendData(
                            Array.isArray(localArray) ? localArray : [],
                            Array.isArray(cloudArray) ? cloudArray : []
                        );

                        // 如果是 accountingData，需要包装回对象格式
                        if (dataType === 'accountingData') {
                            mergedData = { records: mergedData };
                        }

                        this.saveToLocal(config.localKey, mergedData);
                        needUpload = true;
                    } else {
                        const localIds = new Set(localArray.map(item => item.id).filter(id => id));
                        const cloudIds = new Set(cloudArray.map(item => item.id).filter(id => id));

                    // 找出差异
                    const localOnly = [...localIds].filter(id => !cloudIds.has(id));
                    const cloudOnly = [...cloudIds].filter(id => !localIds.has(id));

                    if (localOnly.length > 0 && cloudOnly.length === 0) {
                        // 本地有独有的ID，可能是：
                        // 1. 本地真的有新增
                        // 2. 云端删除了这些ID
                        // 比较时间戳决定
                        const cloudTimestamp = new Date(cloudData.updated_at).getTime();
                        const localTimestamp = this.getLocalDataTimestamp(config.localKey);

                        if (localTimestamp > cloudTimestamp) {
                            // 本地更新，使用本地数据（可能是新增或删除）
                            console.log(`[Sync] ${dataType} - 本地有变更(${localOnly.length}项独有)，本地更新(${new Date(localTimestamp).toLocaleTimeString()}) > 云端(${new Date(cloudTimestamp).toLocaleTimeString()})，使用本地数据`);
                            mergedData = dataType === 'accountingData' ? { records: localArray } : localArray;
                            this.saveToLocal(config.localKey, mergedData);
                            needUpload = true;
                        } else {
                            // 云端更新，使用云端数据
                            console.log(`[Sync] ${dataType} - 本地有变更(${localOnly.length}项独有)，但云端更新(${new Date(cloudTimestamp).toLocaleTimeString()}) >= 本地(${new Date(localTimestamp).toLocaleTimeString()})，使用云端数据`);
                            mergedData = dataType === 'accountingData' ? { records: cloudArray } : cloudArray;
                            this.saveToLocal(config.localKey, mergedData);
                        }
                    } else if (cloudOnly.length > 0 && localOnly.length === 0) {
                        // 云端有独有的，说明云端有新增，使用云端数据
                        console.log(`[Sync] ${dataType} - 云端有新增(${cloudOnly.length}项)，使用云端数据`);
                        mergedData = dataType === 'accountingData' ? { records: cloudArray } : cloudArray;
                        this.saveToLocal(config.localKey, mergedData);
                        needUpload = true;
                    } else if (localOnly.length === 0 && cloudOnly.length === 0 && localArray.length < cloudArray.length) {
                        // 双方都没有独有的，但本地数量更少，说明发生了删除，使用本地数据
                        console.log(`[Sync] ${dataType} - 检测到删除操作，本地数量(${localArray.length}) < 云端数量(${cloudArray.length})，使用本地数据`);
                        mergedData = dataType === 'accountingData' ? { records: localArray } : localArray;
                        this.saveToLocal(config.localKey, mergedData);
                        needUpload = true;
                    } else {
                        // 其他情况，进行合并
                        console.log(`[Sync] ${dataType} - 双方都有变化或数量相同，进行合并（本地独有:${localOnly.length}，云端独有:${cloudOnly.length}）`);
                        const mergedArray = this.mergeAppendData(localArray, cloudArray);
                        mergedData = dataType === 'accountingData' ? { records: mergedArray } : mergedArray;
                        this.saveToLocal(config.localKey, mergedData);
                        needUpload = true;
                    }
                    console.log(`[Sync] ${dataType} - 合并结果: ${Array.isArray(mergedData) ? mergedData.length : mergedData.records?.length || 0}项`);
                    }
                } else if (config.mergeStrategy === 'replace') {
                    // 替换策略：对于对象数据，合并键；对于时间戳比较，使用更新的一方
                    if (typeof localData === 'object' && typeof cloudData.data === 'object' && !Array.isArray(localData) && !Array.isArray(cloudData.data)) {
                        // 对象合并策略（如健康打卡记录）
                        mergedData = { ...localData };
                        for (const key of Object.keys(cloudData.data)) {
                            if (!mergedData[key] || cloudTimestamp > localTimestamp) {
                                mergedData[key] = cloudData.data[key];
                            }
                        }
                        this.saveToLocal(config.localKey, mergedData);
                        needUpload = true;
                        console.log(`[Sync] ${dataType} - 对象合并，结果: ${Object.keys(mergedData).length}项`);
                    } else {
                        // 时间戳比较策略（用于其他替换类型数据）
                        if (cloudTimestamp > localTimestamp) {
                            mergedData = cloudData.data;
                            
                            // 额外检查：healthRecords 必须是对象格式
                            if (dataType === 'healthRecords' && Array.isArray(mergedData)) {
                                console.error('[Sync] 拒绝保存数组格式的 healthRecords，清空云端数据');
                                
                                // 清空云端错误数据
                                await this.supabase
                                    .from(config.tableName)
                                    .delete()
                                    .eq('user_id', this.auth.user.id);
                                
                                // 使用本地数据
                                mergedData = localData;
                                needUpload = true;
                            } else {
                                this.saveToLocal(config.localKey, mergedData);
                            }
                            console.log(`[Sync] ${dataType} - 云端数据更新，使用云端数据`);
                        } else {
                            mergedData = localData;
                            needUpload = true;
                            console.log(`[Sync] ${dataType} - 本地数据更新，使用本地数据`);
                        }
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
     * @param {string[]} [dataTypesToSync] - 指定要同步的数据类型，不传则同步所有
     */
    async syncAll(dataTypesToSync = null) {
        if (!this.auth.isAuthenticated()) {
            console.warn('[Sync] 用户未登录，跳过同步');
            return;
        }

        const typesToSync = dataTypesToSync || Object.keys(this.dataTypes);
        console.log('[Sync] 开始同步:', typesToSync);

        for (const dataType of typesToSync) {
            await this.syncData(dataType);
        }

        console.log('[Sync] 数据同步完成');
        console.log('[Sync] 准备触发syncComplete事件，时间戳:', this.lastSyncTime);

        // 触发自定义事件
        const event = new CustomEvent('syncComplete', {
            detail: { timestamp: this.lastSyncTime }
        });
        window.dispatchEvent(event);
        console.log('[Sync] syncComplete事件已触发');
    }

    /**
     * 追加合并策略：合并两个数据集，去重
     */
    mergeAppendData(localData, cloudData) {
        // 确保 healthRecords 是对象格式
        if (this.currentDataType === 'healthRecords') {
            console.warn('[Sync] healthRecords 不应使用 mergeAppendData，使用对象合并');
            // 强制转换为对象
            if (Array.isArray(localData)) {
                console.warn('[Sync] localData 是数组，转换为空对象');
                localData = {};
            }
            if (Array.isArray(cloudData)) {
                console.warn('[Sync] cloudData 是数组，转换为空对象');
                cloudData = {};
            }
            return { ...localData, ...cloudData };
        }
        
        // 确保数据类型正确
        const arrayTypes = ['todos', 'accountingData', 'myVocab', 'moodEntries'];
        const currentDataType = Object.keys(this.dataTypes).find(key => this.dataTypes[key].localKey === this.currentDataType);
        
        // 如果应该是数组但localData不是数组，尝试修复
        if (arrayTypes.includes(this.currentDataType) && !Array.isArray(localData)) {
            console.warn('[Sync] localData类型错误，自动修复:', this.currentDataType);
            if (typeof localData === 'object' && localData !== null) {
                localData = Object.values(localData).filter(v => typeof v === 'object' && v !== null);
                console.log('[Sync] 已修复localData为数组，共', localData.length, '项');
            } else {
                localData = [];
            }
        }
        
        // 如果应该是数组但cloudData不是数组，尝试修复
        if (arrayTypes.includes(this.currentDataType) && !Array.isArray(cloudData)) {
            console.warn('[Sync] cloudData类型错误，自动修复:', this.currentDataType);
            if (typeof cloudData === 'object' && cloudData !== null) {
                cloudData = Object.values(cloudData).filter(v => typeof v === 'object' && v !== null);
                console.log('[Sync] 已修复cloudData为数组，共', cloudData.length, '项');
            } else {
                cloudData = [];
            }
        }
        
        // 处理数组类型数据
        if (Array.isArray(localData) && Array.isArray(cloudData)) {
            // 优先使用云端数据，合并ID去重
            const merged = [];
            const allIds = new Set();
            
            // 先添加云端数据（云端优先）
            cloudData.forEach(item => {
                if (item.id) {
                    allIds.add(item.id);
                    merged.push(item);
                } else {
                    merged.push(item);
                }
            });
            
            // 再添加本地独有的数据（不在云端的）
            localData.forEach(item => {
                if (item.id) {
                    if (!allIds.has(item.id)) {
                        merged.push(item);
                    }
                    // 如果ID已存在，跳过本地数据（使用云端的新数据）
                } else {
                    // 没有ID，检查是否已存在
                    const exists = merged.some(cloudItem =>
                        JSON.stringify(cloudItem) === JSON.stringify(item)
                    );
                    if (!exists) {
                        merged.push(item);
                    }
                }
            });

            console.log(`[Sync] mergeAppendData: 云端${cloudData.length}项 + 本地独有${localData.length}项 = 合并${merged.length}项`);
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
async function initDataSync(autoSync = false) {
    if (dataSync) {
        return dataSync;
    }

    dataSync = new DataSync(window.auth);
    const initialized = await dataSync.initialize();

    if (initialized) {
        // 加载离线队列
        dataSync.loadOfflineQueue();

        // 默认不自动同步，让调用者决定何时同步
        // 如果需要自动同步，传入 autoSync = true
        if (autoSync && navigator.onLine && window.auth.isAuthenticated()) {
            console.log('[Sync] initDataSync: 自动同步已启用');
            await dataSync.syncAll();
        } else {
            console.log('[Sync] initDataSync: 等待手动触发同步');
        }

        console.log('[Sync] 数据同步引擎已就绪');

        // 将 dataSync 实例暴露到全局，供 triggerSync() 使用
        window.dataSync = dataSync;
    }

    return dataSync;
}

// 导出到全局
if (typeof window !== 'undefined') {
    window.DataSync = DataSync;
    window.initDataSync = initDataSync;
}
