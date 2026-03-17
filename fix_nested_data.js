// ===== 修复嵌套数组数据 =====
// 在主页面的控制台中执行

(function fixNestedData() {
    console.log('========== 开始修复数据 ==========');
    console.log('');

    // 1. 获取原始数据
    const rawData = localStorage.getItem('accountingData');
    console.log('1. 原始数据类型:', Array.isArray(JSON.parse(rawData)) ? '嵌套数组 ❌' : '其他');

    if (!rawData) {
        console.error('❌ 没有找到数据');
        return;
    }

    try {
        const parsed = JSON.parse(rawData);

        // 2. 递归提取所有记录
        function extractAllRecords(data) {
            let records = [];

            if (Array.isArray(data)) {
                data.forEach(item => {
                    if (Array.isArray(item)) {
                        // 递归处理嵌套数组
                        records = records.concat(extractAllRecords(item));
                    } else if (item && typeof item === 'object' && item.id) {
                        // 这是一个记录对象
                        records.push(item);
                    }
                });
            } else if (data && typeof data === 'object') {
                if (Array.isArray(data.records)) {
                    return data.records;
                }
            }

            return records;
        }

        console.log('2. 正在提取所有记录...');
        const allRecords = extractAllRecords(parsed);
        console.log('   提取到', allRecords.length, '条记录');

        // 3. 去重（按 id）
        const uniqueRecords = [];
        const seenIds = new Set();

        allRecords.forEach(record => {
            if (!seenIds.has(record.id)) {
                seenIds.add(record.id);
                uniqueRecords.push(record);
            }
        });

        console.log('3. 去重后剩余', uniqueRecords.length, '条唯一记录');

        // 4. 按日期排序（最新的在前）
        uniqueRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

        // 5. 转换为正确的格式
        const fixedData = { records: uniqueRecords };

        console.log('4. 数据格式已修复为: {records: [...]}');
        console.log('');
        console.log('修复后的数据:');
        console.log(fixedData);
        console.log('');

        // 6. 保存到 localStorage
        localStorage.setItem('accountingData', JSON.stringify(fixedData));
        console.log('✅ 数据已保存到 localStorage');

        // 7. 更新当前页面的数据（如果页面已加载）
        if (typeof accountingData !== 'undefined') {
            accountingData = fixedData;
            console.log('✅ 已更新页面数据');
        }

        console.log('');
        console.log('========== 修复完成 ==========');
        console.log('');
        console.log('💡 记录列表:');
        fixedData.records.forEach((r, i) => {
            console.log(`   ${i + 1}. ${r.date.substring(0, 10)} - ${r.note} - ¥${r.amount}`);
        });

        console.log('');
        console.log('🔄 3秒后刷新页面...');
        setTimeout(() => location.reload(), 3000);

    } catch (e) {
        console.error('❌ 修复失败:', e.message);
        console.error('错误详情:', e);
    }
})();
