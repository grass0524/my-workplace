// 快速修复：强制显示用户词库单词
// 在控制台执行此脚本

(function() {
    console.log('=== 开始强制修复 ===');

    // 1. 检查词库状态
    console.log('1. 当前词库数量:', vocabLibrary.length);
    console.log('2. 前5个单词:', vocabLibrary.slice(0, 5).map(w => w.word));
    console.log('3. 检查内置单词位置:');
    const builtinWords = ['Resilience', 'Procrastinate', 'Synergy', 'Ambiguous', 'Paradigm'];
    builtinWords.forEach(word => {
        const idx = vocabLibrary.findIndex(w => w.word === word);
        console.log(`   ${word} 在索引 ${idx}`);
    });

    // 2. 找到用户词库的起始位置（第一个非内置单词）
    let userVocabStart = -1;
    for (let i = 0; i < vocabLibrary.length; i++) {
        if (!builtinWords.includes(vocabLibrary[i].word)) {
            userVocabStart = i;
            break;
        }
    }

    console.log('4. 用户词库起始索引:', userVocabStart);

    // 3. 强制选择用户词库的第一个单词
    if (userVocabStart >= 0) {
        currentWordIndex = userVocabStart;
        currentWord = vocabLibrary[currentWordIndex];

        // 保存索引
        const today = new Date();
        const todayDate = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
        localStorage.setItem('currentWordIndex', currentWordIndex.toString());
        localStorage.setItem('currentWordDate', todayDate);

        console.log('5. 已选择用户词库单词:', currentWord.word);
        console.log('6. 已保存索引:', currentWordIndex);

        // 更新UI
        document.getElementById('word-spelling').textContent = currentWord.word;
        document.getElementById('word-phonetic').textContent = currentWord.phonetic || currentWord.phonetic;
        document.getElementById('word-meaning').textContent = currentWord.meaning;

        console.log('✅ 修复完成！当前显示:', currentWord.word);
    } else {
        console.log('❌ 未找到用户词库，词库可能被覆盖了');
    }

    console.log('=== 修复完成，3秒后刷新页面 ===');
    setTimeout(() => location.reload(), 3000);
})();
