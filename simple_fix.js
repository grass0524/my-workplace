// 简化版修复脚本 - 分步执行

// 步骤1: 读取数据
console.log('步骤1: 读取数据...');
const rawData = localStorage.getItem('accountingData');
console.log('原始数据存在:', rawData ? '✅' : '❌');

// 步骤2: 解析数据
console.log('\n步骤2: 解析数据...');
const parsed = JSON.parse(rawData);
console.log('数据是数组:', Array.isArray(parsed) ? '✅' : '❌');
console.log('数组长度:', parsed.length);

// 步骤3: 提取所有记录
console.log('\n步骤3: 提取记录...');
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

const allRecords = extractAllRecords(parsed);
console.log('提取到记录数:', allRecords.length);

// 步骤4: 去重
console.log('\n步骤4: 去重...');
const uniqueRecords = [];
const seenIds = new Set();
allRecords.forEach(record => {
    if (!seenIds.has(record.id)) {
        seenIds.add(record.id);
        uniqueRecords.push(record);
    }
});
console.log('去重后记录数:', uniqueRecords.length);

// 步骤5: 排序
console.log('\n步骤5: 排序...');
uniqueRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
console.log('排序完成 ✅');

// 步骤6: 保存
console.log('\n步骤6: 保存...');
const fixedData = { records: uniqueRecords };
localStorage.setItem('accountingData', JSON.stringify(fixedData));
console.log('保存成功 ✅');

// 步骤7: 显示结果
console.log('\n========== 修复结果 ==========');
console.log('唯一记录数:', uniqueRecords.length);
console.log('\n记录列表:');
uniqueRecords.slice(0, 10).forEach((r, i) => {
    console.log(`${i + 1}. ${r.date.substring(0, 10)} - ${r.note} - ¥${r.amount}`);
});

console.log('\n✅ 数据已修复！');
console.log('💡 如需刷新页面，执行: location.reload()');
