// 一键修复嵌套数组 - 复制整段到控制台执行
(function(){
    const rawData = localStorage.getItem('accountingData');
    const parsed = JSON.parse(rawData);

    // 提取所有记录
    function extract(data){
        let records = [];
        if(Array.isArray(data)){
            data.forEach(item => {
                if(Array.isArray(item)){
                    records = records.concat(extract(item));
                }else if(item && item.id){
                    records.push(item);
                }
            });
        }
        return records;
    }

    const all = extract(parsed);
    console.log('提取到', all.length, '条记录');

    // 去重
    const unique = [];
    const seen = new Set();
    all.forEach(r => {
        if(!seen.has(r.id)){
            seen.add(r.id);
            unique.push(r);
        }
    });
    console.log('去重后', unique.length, '条');

    // 排序
    unique.sort((a,b) => new Date(b.date) - new Date(a.date));

    // 保存正确格式
    const fixed = {records: unique};
    localStorage.setItem('accountingData', JSON.stringify(fixed));
    console.log('✅ 已修复并保存！');
    console.log('记录列表:');
    unique.slice(0,10).forEach((r,i) => {
        console.log((i+1)+'. '+r.date.substring(0,10)+' - '+r.note+' - ¥'+r.amount);
    });

    // 刷新
    console.log('3秒后刷新...');
    setTimeout(() => location.reload(), 3000);
})();
