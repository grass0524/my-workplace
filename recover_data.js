// 数据恢复脚本
// 在浏览器控制台中执行此脚本来恢复数据

(async function recoverData() {
    console.log('=== 开始数据恢复 ===');

    // 1. 检查认证状态
    if (!window.auth?.isAuthenticated()) {
        console.error('❌ 未登录，请先登录');
        return;
    }
    console.log('✅ 已登录');

    // 2. 检查本地数据
    const localData = localStorage.getItem('accountingData');
    console.log('📦 本地数据:', localData ? '存在' : '不存在');
    if (localData) {
        try {
            const parsed = JSON.parse(localData);
            console.log('本地数据结构:', typeof parsed);
            console.log('本地数据内容:', parsed);
        } catch (e) {
            console.error('本地数据解析失败:', e);
        }
    }

    // 3. 强制从云端同步
    console.log('⬇️ 正在从云端下载数据...');
    try {
        const cloudResult = await window.dataSync.downloadData('accountingData');
        console.log('云端数据:', cloudResult);

        if (cloudResult.data && cloudResult.data.length > 0) {
            console.log('✅ 云端找到', cloudResult.data.length, '条数据');

            // 恢复到本地
            if (Array.isArray(cloudResult.data)) {
                accountingData = { records: cloudResult.data };
            } else {
                accountingData = cloudResult.data;
            }

            // 保存到localStorage
            localStorage.setItem('accountingData', JSON.stringify(accountingData));
            console.log('✅ 数据已恢复到本地');

            // 刷新页面
            console.log('🔄 3秒后刷新页面...');
            setTimeout(() => location.reload(), 3000);
        } else {
            console.warn('⚠️ 云端也没有数据');
        }
    } catch (err) {
        console.error('❌ 云端同步失败:', err);
    }

    console.log('=== 数据恢复完成 ===');
})();
