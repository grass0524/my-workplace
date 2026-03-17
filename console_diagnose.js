// ===== 数据诊断脚本 =====
// 在主页面的控制台中执行此脚本

(async function diagnoseData() {
    console.log('========== 开始数据诊断 ==========');
    console.log('');

    // 1. 检查认证状态
    console.log('【步骤 1】检查认证状态');
    try {
        const isAuth = window.auth?.isAuthenticated();
        const syncReady = window.dataSync?.isReady;

        console.log('认证状态:', isAuth ? '✅ 已登录' : '❌ 未登录');
        console.log('同步引擎:', syncReady ? '✅ 就绪' : '❌ 未就绪');

        if (!isAuth) {
            console.error('❌ 请先登录！');
            return;
        }
    } catch (e) {
        console.error('❌ 认证检查失败:', e.message);
        return;
    }
    console.log('');

    // 2. 检查本地数据
    console.log('【步骤 2】检查本地数据');
    try {
        const localRaw = localStorage.getItem('accountingData');
        console.log('本地数据存在:', localRaw ? '✅ 是' : '❌ 否');

        if (localRaw) {
            const localData = JSON.parse(localRaw);
            console.log('本地数据类型:', typeof localData);
            console.log('本地数据内容:', localData);

            if (localData.records) {
                console.log('本地记录数:', localData.records.length);
                if (localData.records.length > 0) {
                    console.log('最新记录:', localData.records[0]);
                }
            }
        } else {
            console.warn('⚠️ localStorage 中没有 accountingData');
        }
    } catch (e) {
        console.error('❌ 本地数据检查失败:', e.message);
    }
    console.log('');

    // 3. 检查云端数据
    console.log('【步骤 3】检查云端数据');
    try {
        console.log('正在从云端下载...');
        const cloudResult = await window.dataSync.downloadData('accountingData');
        console.log('云端数据存在:', cloudResult.data ? '✅ 是' : '❌ 否');
        console.log('云端数据内容:', cloudResult);

        if (cloudResult.data) {
            if (Array.isArray(cloudResult.data)) {
                console.log('云端记录数 (数组):', cloudResult.data.length);
            } else if (cloudResult.data.records) {
                console.log('云端记录数 (对象):', cloudResult.data.records.length);
            }
        }
    } catch (e) {
        console.error('❌ 云端数据检查失败:', e.message);
    }
    console.log('');

    // 4. 检查当前页面数据
    console.log('【步骤 4】检查当前页面数据');
    try {
        console.log('accountingData 存在:', typeof accountingData !== 'undefined' ? '✅ 是' : '❌ 否');
        if (typeof accountingData !== 'undefined') {
            console.log('accountingData 内容:', accountingData);
            if (accountingData.records) {
                console.log('页面记录数:', accountingData.records.length);
            }
        }
    } catch (e) {
        console.error('❌ 页面数据检查失败:', e.message);
    }
    console.log('');

    // 5. 尝试恢复
    console.log('【步骤 5】尝试从云端恢复数据');
    console.log('如果云端有数据，将自动恢复并刷新页面...');
    try {
        const cloudResult = await window.dataSync.downloadData('accountingData');

        if (cloudResult.data) {
            let hasData = false;

            // 检查是否有有效数据
            if (Array.isArray(cloudResult.data) && cloudResult.data.length > 0) {
                hasData = true;
                console.log('✅ 云端找到', cloudResult.data.length, '条记录（数组格式）');

                // 恢复数据
                accountingData = { records: cloudResult.data };
                localStorage.setItem('accountingData', JSON.stringify(accountingData));
                console.log('✅ 已恢复到本地');

            } else if (cloudResult.data.records && cloudResult.data.records.length > 0) {
                hasData = true;
                console.log('✅ 云端找到', cloudResult.data.records.length, '条记录（对象格式）');

                // 恢复数据
                accountingData = cloudResult.data;
                localStorage.setItem('accountingData', JSON.stringify(accountingData));
                console.log('✅ 已恢复到本地');
            }

            if (hasData) {
                console.log('🔄 3秒后自动刷新页面...');
                setTimeout(() => location.reload(), 3000);
            } else {
                console.warn('⚠️ 云端也没有数据');
            }
        } else {
            console.warn('⚠️ 云端返回空数据');
        }
    } catch (e) {
        console.error('❌ 恢复失败:', e.message);
    }

    console.log('');
    console.log('========== 诊断完成 ==========');
    console.log('');
    console.log('💡 如果云端有数据，页面将自动刷新');
    console.log('💡 如果云端也没有数据，说明数据已永久丢失');
})();
