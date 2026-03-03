// 1. 初始化
document.addEventListener('DOMContentLoaded', () => {
    initDate();
    initHealth();
    initTodos();
    initHoliday();
    initWord();
    initMood();
    initQuote();
});

function initDate() {
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('zh-CN', options);
}

// 全局提示函数
let toastTimeout;
function showToast(message, duration = 2500) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    // 清除之前的定时器
    if (toastTimeout) {
        clearTimeout(toastTimeout);
    }

    // 设置消息
    toastMessage.textContent = message;
    toast.classList.remove('hidden');

    // 自动隐藏
    toastTimeout = setTimeout(() => {
        toast.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => {
            toast.classList.add('hidden');
            toast.style.animation = '';
        }, 300);
    }, duration);
}

// 全局确认对话框
let confirmCallback = null;
function showConfirm(message) {
    return new Promise((resolve) => {
        const dialog = document.getElementById('confirm-dialog');
        const messageEl = document.getElementById('confirm-message');
        const okBtn = document.getElementById('confirm-ok-btn');

        messageEl.textContent = message;
        dialog.classList.remove('hidden');

        confirmCallback = resolve;

        okBtn.onclick = () => closeConfirmDialog(true);
    });
}

function closeConfirmDialog(result) {
    const dialog = document.getElementById('confirm-dialog');
    dialog.classList.add('hidden');

    if (confirmCallback) {
        confirmCallback(result);
        confirmCallback = null;
    }
}

// 2. 健康打卡 (Health Stats)
// 数据结构：{ "2026-02-28": { water: true, toilet: false, exercise: true } }
let healthRecords = {};
let currentHealthMonth = new Date();

function initHealth() {
    const saved = localStorage.getItem('healthRecords');
    if (saved) {
        healthRecords = JSON.parse(saved);
    }
    updateHealthUI();
}

function getTodayStr() {
    return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
}

function toggleHealth(type) {
    const today = getTodayStr();
    if (!healthRecords[today]) {
        healthRecords[today] = { water: false, toilet: false, exercise: false };
    }
    
    healthRecords[today][type] = !healthRecords[today][type];
    updateHealthUI();
    saveHealth();
}

function updateHealthUI() {
    const today = getTodayStr();
    const todayData = healthRecords[today] || { water: false, toilet: false, exercise: false };
    
    // Update Icons and Text
    const types = ['water', 'toilet', 'exercise'];
    types.forEach(type => {
        const isDone = todayData[type];
        const btn = document.getElementById(`btn-${type}`);
        const status = document.getElementById(`status-${type}`);
        
        if (isDone) {
            btn.style.opacity = '1';
            btn.innerHTML = '<i class="fas fa-check"></i>'; // Change icon to check
            status.textContent = '已打卡';
            status.classList.add('done');
        } else {
            btn.style.opacity = '0.5'; // Dim if not done
            // Restore original icons
            if (type === 'water') btn.innerHTML = '<i class="fas fa-glass-water"></i>';
            if (type === 'toilet') btn.innerHTML = '<i class="fas fa-restroom"></i>';
            if (type === 'exercise') btn.innerHTML = '<i class="fas fa-person-running"></i>';
            status.textContent = '未打卡';
            status.classList.remove('done');
        }
    });
}

function saveHealth() {
    localStorage.setItem('healthRecords', JSON.stringify(healthRecords));
}

// Health History Modal
function showHealthHistory() {
    document.getElementById('health-modal').classList.remove('hidden');
    renderHealthCalendar();
}

function closeHealthModal() {
    document.getElementById('health-modal').classList.add('hidden');
}

function changeHealthMonth(delta) {
    currentHealthMonth.setMonth(currentHealthMonth.getMonth() + delta);
    renderHealthCalendar();
}

function renderHealthCalendar() {
    const year = currentHealthMonth.getFullYear();
    const month = currentHealthMonth.getMonth();
    
    document.getElementById('health-calendar-month').textContent = `${year}年${month + 1}月`;
    
    const grid = document.getElementById('health-calendar');
    grid.innerHTML = '';
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let stats = { done: 0, partial: 0, none: 0 };

    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const dayData = healthRecords[dateStr];
        
        const div = document.createElement('div');
        div.className = 'health-day';
        
        // Day Number
        const numSpan = document.createElement('span');
        numSpan.className = 'health-day-num';
        numSpan.textContent = i;
        div.appendChild(numSpan);
        
        // Icons container
        const iconsDiv = document.createElement('div');
        iconsDiv.className = 'health-day-icons';
        
        const waterIcon = document.createElement('i');
        waterIcon.className = `mini-icon fas fa-glass-water ${dayData?.water ? 'done' : 'not-done'}`;
        
        const toiletIcon = document.createElement('i');
        toiletIcon.className = `mini-icon fas fa-restroom ${dayData?.toilet ? 'done' : 'not-done'}`;
        
        const exerciseIcon = document.createElement('i');
        exerciseIcon.className = `mini-icon fas fa-person-running ${dayData?.exercise ? 'done' : 'not-done'}`;
        
        iconsDiv.appendChild(waterIcon);
        iconsDiv.appendChild(toiletIcon);
        iconsDiv.appendChild(exerciseIcon);
        div.appendChild(iconsDiv);

        // Edit icon (shown on hover)
        const editIcon = document.createElement('div');
        editIcon.className = 'health-day-edit-icon';
        editIcon.innerHTML = '<i class="fas fa-pen"></i>';
        editIcon.onclick = (e) => {
            e.stopPropagation();
            openHealthEditModal(dateStr);
        };
        div.appendChild(editIcon);

        // Status Class & Stats Calculation
        if (dayData) {
            const doneCount = (dayData.water ? 1 : 0) + (dayData.toilet ? 1 : 0) + (dayData.exercise ? 1 : 0);
            if (doneCount === 3) {
                div.classList.add('completed');
                stats.done++;
            } else if (doneCount > 0) {
                div.classList.add('partial');
                stats.partial++;
            } else {
                div.classList.add('none');
                stats.none++;
            }
        } else {
             div.classList.add('none');
             stats.none++;
        }

        grid.appendChild(div);
    }

    // Render Stats
    const statsContainer = document.getElementById('health-month-stats');
    statsContainer.innerHTML = `
        <div class="stat-box"><strong>${stats.done}</strong>全部完成</div>
        <div class="stat-box"><strong>${stats.partial}</strong>部分完成</div>
        <div class="stat-box"><strong>${stats.none}</strong>未打卡</div>
    `;
}

// 3. 待办清单 (Todo List)
let todos = [];

function initTodos() {
    const saved = localStorage.getItem('todos');
    if (saved) {
        todos = JSON.parse(saved);
        // 兼容旧数据：如果缺少 date 字段，补全为创建时间或今天
        todos.forEach(todo => {
            if (!todo.date) {
                if (todo.createdAt) {
                    todo.date = todo.createdAt.substring(0, 10);
                } else {
                    todo.date = getTodayStr();
                }
            }
        });
    }
    // Set default date to today
    document.getElementById('new-todo-date').value = getTodayStr();
    renderTodos();
}

function handleTodoInput(event) {
    if (event.key === 'Enter') {
        addTodo();
    }
}

function addTodo() {
    const input = document.getElementById('new-todo-input');
    const dateInput = document.getElementById('new-todo-date');
    const text = input.value.trim();
    const date = dateInput.value;
    
    if (!text) return;

    const newTodo = {
        id: Date.now(),
        text: text,
        completed: false,
        date: date || getTodayStr(),
        createdAt: new Date().toISOString()
    };

    todos.push(newTodo);
    input.value = '';
    saveTodos();
    renderTodos();
}

function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        // 排序：未完成在前，已完成在后
        todos.sort((a, b) => a.completed - b.completed || b.id - a.id);
        saveTodos();
        renderTodos();
    }
}

function deleteTodo(id) {
    todos = todos.filter(t => t.id !== id);
    saveTodos();
    renderTodos();
}

function editTodo(id) {
    const viewEl = document.getElementById(`todo-view-${id}`);
    const editEl = document.getElementById(`todo-edit-${id}`);
    const inputEl = document.getElementById(`todo-edit-input-${id}`);

    viewEl.classList.add('hidden');
    editEl.classList.remove('hidden');
    inputEl.focus();
    inputEl.select();
}

function saveTodoEdit(id) {
    const inputEl = document.getElementById(`todo-edit-input-${id}`);
    const newText = inputEl.value.trim();

    if (!newText) {
        showToast('任务内容不能为空');
        return;
    }

    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.text = newText;
        saveTodos();
        renderTodos();
        showToast('任务已更新');
    }
}

function cancelTodoEdit(id) {
    const viewEl = document.getElementById(`todo-view-${id}`);
    const editEl = document.getElementById(`todo-edit-${id}`);
    const inputEl = document.getElementById(`todo-edit-input-${id}`);

    // Reset input to original value
    const todo = todos.find(t => t.id === id);
    if (todo) {
        inputEl.value = todo.text;
    }

    viewEl.classList.remove('hidden');
    editEl.classList.add('hidden');
}

function handleTodoEditKeypress(event, id) {
    if (event.key === 'Enter') {
        saveTodoEdit(id);
    } else if (event.key === 'Escape') {
        cancelTodoEdit(id);
    }
}

function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

function renderTodos() {
    const container = document.getElementById('todo-list-container');
    container.innerHTML = '';

    // If no todos, show empty placeholder
    if (todos.length === 0) {
        container.innerHTML = `
            <div class="todo-empty-placeholder">
                <span>想想今天做些什么呢？</span>
            </div>
        `;
        document.getElementById('todo-pending').textContent = '0';
        document.getElementById('todo-completed').textContent = '0';
        return;
    }

    // Sort by date (desc), then by completion status, then by ID desc (newest first)
    todos.sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date); // Descending
        if (a.completed !== b.completed) return a.completed - b.completed; // Uncompleted first
        return b.id - a.id; // Newest first (by ID timestamp)
    });

    // Group by date
    const groups = {};
    todos.forEach(todo => {
        const date = todo.date;
        if (!groups[date]) groups[date] = [];
        groups[date].push(todo);
    });
    
    let pendingCount = 0;
    let completedCount = 0;

    // Get sorted dates (desc)
    const dates = Object.keys(groups).sort().reverse();
    
    dates.forEach(date => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'todo-date-group';
        
        // Date Header
        const header = document.createElement('div');
        header.className = 'todo-date-header';
        
        // Format date: Today, Tomorrow, or Date string
        const today = getTodayStr();
        let dateLabel = date;
        if (date === today) dateLabel = '今天';
        
        header.textContent = dateLabel;
        groupDiv.appendChild(header);
        
        const list = document.createElement('ul');
        list.className = 'todo-list';
        
        groups[date].forEach(todo => {
            if (todo.completed) completedCount++; else pendingCount++;

            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            li.id = `todo-item-${todo.id}`;
            li.innerHTML = `
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} onchange="toggleTodo(${todo.id})">
                <div class="todo-content-wrapper">
                    <span class="todo-view" id="todo-view-${todo.id}">
                        <span class="todo-text">${todo.text}</span>
                        <div class="todo-actions">
                            <button class="btn-edit" onclick="editTodo(${todo.id})" title="编辑"><i class="fas fa-pen"></i></button>
                            <button class="btn-delete" onclick="deleteTodo(${todo.id})" title="删除"><i class="fas fa-trash"></i></button>
                        </div>
                    </span>
                    <span class="todo-edit hidden" id="todo-edit-${todo.id}">
                        <input type="text" class="neu-input-sm" id="todo-edit-input-${todo.id}" value="${todo.text}" onkeypress="handleTodoEditKeypress(event, ${todo.id})">
                        <div class="todo-actions">
                            <button class="btn-save" onclick="saveTodoEdit(${todo.id})" title="保存"><i class="fas fa-check"></i></button>
                            <button class="btn-cancel" onclick="cancelTodoEdit(${todo.id})" title="取消"><i class="fas fa-times"></i></button>
                        </div>
                    </span>
                </div>
            `;
            list.appendChild(li);
        });
        
        groupDiv.appendChild(list);
        container.appendChild(groupDiv);
    });

    // Update stats
    document.getElementById('todo-pending').textContent = pendingCount;
    document.getElementById('todo-completed').textContent = completedCount;
}

// 4. 放假倒计时 (Holiday Countdown)
// 模拟 2026 年部分节假日数据
const holidays = [
    { name: '元旦', date: '2026-01-01' },
    { name: '春节', date: '2026-02-17' },
    { name: '清明节', date: '2026-04-05' },
    { name: '劳动节', date: '2026-05-01' },
    { name: '端午节', date: '2026-06-19' },
    { name: '中秋节', date: '2026-09-25' },
    { name: '国庆节', date: '2026-10-01' }
];

function initHoliday() {
    // 假设今天是 2026-02-28 (根据 <env> 上下文)
    // 但为了演示效果，我们使用系统当前时间，或者如果当前时间已过所有节日，就循环到明年
    const today = new Date(); 
    
    // 寻找下一个节日
    let nextHoliday = null;
    let minDiff = Infinity;

    // 修正：为了演示，如果是在真实环境运行，today 可能是 2025 年。
    // 我们这里强制把年份调整到当前或未来，确保能展示正数倒计时
    const currentYear = today.getFullYear();

    for (const h of holidays) {
        // 简单的日期解析，假设数据格式是 YYYY-MM-DD
        // 这里为了通用性，我们忽略年份，只看月日，找最近的未来节日
        const hDateStr = h.date.substring(5); // MM-DD
        let targetDate = new Date(`${currentYear}-${hDateStr}`);
        
        if (targetDate < today) {
            targetDate.setFullYear(currentYear + 1);
        }

        const diffTime = targetDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays < minDiff) {
            minDiff = diffDays;
            nextHoliday = { ...h, targetDate };
        }
    }

    if (nextHoliday) {
        document.getElementById('holiday-name').textContent = nextHoliday.name;
        document.getElementById('holiday-days').textContent = minDiff;
        document.getElementById('holiday-date-str').textContent = nextHoliday.targetDate.toLocaleDateString();
    }
}

// 5. 今日单词 (Daily Word)
const vocabLibrary = [
    { word: 'Resilience', phonetic: '/rɪˈzɪliəns/', meaning: 'n. 恢复力；弹力；顺应力' },
    { word: 'Procrastinate', phonetic: '/prəˈkræstɪneɪt/', meaning: 'v. 拖延，耽搁' },
    { word: 'Synergy', phonetic: '/ˈsɪnərdʒi/', meaning: 'n. 协同效应；增效作用' },
    { word: 'Ambiguous', phonetic: '/æmˈbɪɡjuəs/', meaning: 'adj. 模棱两可的；含糊不清的' },
    { word: 'Paradigm', phonetic: '/ˈpærədaɪm/', meaning: 'n. 范例；词形变化表' }
];

let currentWord = {};
let myVocab = [];

function initWord() {
    // 随机选一个 (实际应用按日期 Hash 选择)
    const index = Math.floor(Math.random() * vocabLibrary.length);
    currentWord = vocabLibrary[index];
    
    document.getElementById('word-spelling').textContent = currentWord.word;
    document.getElementById('word-phonetic').textContent = currentWord.phonetic;
    document.getElementById('word-meaning').textContent = currentWord.meaning;

    // Load vocab book
    const saved = localStorage.getItem('myVocab');
    if (saved) myVocab = JSON.parse(saved);
}

function playWordAudio() {
    // 使用浏览器原生 TTS
    const utterance = new SpeechSynthesisUtterance(currentWord.word);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
}

function addToVocab() {
    if (!myVocab.some(w => w.word === currentWord.word)) {
        myVocab.push(currentWord);
        localStorage.setItem('myVocab', JSON.stringify(myVocab));
        showToast('已加入生词本！');
        renderVocabList();
    } else {
        showToast('该单词已在生词本中');
    }
}

function refreshWord() {
    // Get a new random word, different from current
    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * vocabLibrary.length);
    } while (vocabLibrary[newIndex].word === currentWord.word && vocabLibrary.length > 1);

    currentWord = vocabLibrary[newIndex];

    // Update UI with animation
    const spellingEl = document.getElementById('word-spelling');
    const phoneticEl = document.getElementById('word-phonetic');
    const meaningEl = document.getElementById('word-meaning');

    // Add fade-out effect
    spellingEl.style.opacity = '0';
    phoneticEl.style.opacity = '0';
    meaningEl.style.opacity = '0';

    setTimeout(() => {
        spellingEl.textContent = currentWord.word;
        phoneticEl.textContent = currentWord.phonetic;
        meaningEl.textContent = currentWord.meaning;

        // Fade in
        spellingEl.style.opacity = '1';
        phoneticEl.style.opacity = '1';
        meaningEl.style.opacity = '1';
    }, 200);
}

function showVocabBook() {
    document.getElementById('vocab-modal').classList.remove('hidden');
    renderVocabList();
}

function closeVocabModal() {
    document.getElementById('vocab-modal').classList.add('hidden');
}

function renderVocabList() {
    const list = document.getElementById('vocab-list');
    list.innerHTML = '';
    
    if (myVocab.length === 0) {
        list.innerHTML = '<li style="text-align:center; color:#999; padding:20px;">生词本是空的</li>';
        return;
    }

    myVocab.forEach(w => {
        const li = document.createElement('li');
        li.className = 'vocab-item';
        li.innerHTML = `
            <div class="vocab-info">
                <span class="vocab-word">${w.word}</span>
                <span class="vocab-phonetic">${w.phonetic || ''}</span>
                <span class="vocab-meaning">${w.meaning}</span>
            </div>
            <div class="vocab-actions">
                <button class="btn-icon-sm" onclick="speakText('${w.word}')" title="朗读"><i class="fas fa-volume-high"></i></button>
                <button class="btn-icon-sm btn-delete-vocab" onclick="removeFromVocab('${w.word}')" title="删除"><i class="fas fa-trash"></i></button>
            </div>
        `;
        list.appendChild(li);
    });
}

async function removeFromVocab(word) {
    if (await showConfirm(`确定要将 "${word}" 移出生词本吗？`)) {
        myVocab = myVocab.filter(w => w.word !== word);
        localStorage.setItem('myVocab', JSON.stringify(myVocab));
        renderVocabList();
    }
}

function speakText(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
}

// 默写复习状态
let quizState = {
    isActive: false,
    words: [],
    currentIndex: 0,
    userAnswers: {}
};

function startQuiz() {
    if (myVocab.length === 0) {
        showToast('生词本是空的，先添加一些单词吧！');
        return;
    }

    // 打乱单词顺序
    quizState.words = [...myVocab].sort(() => Math.random() - 0.5);
    quizState.currentIndex = 0;
    quizState.userAnswers = {};
    quizState.isActive = true;

    renderQuiz();
}

function renderQuiz() {
    const modal = document.getElementById('vocab-modal');
    const modalHeader = document.getElementById('vocab-modal-header');
    const modalBody = document.getElementById('vocab-modal-body');
    const floatBtn = document.getElementById('quiz-start-btn');
    const modalContent = modal.querySelector('.modal-content');

    // 直接设置弹窗宽度和样式
    if (modalContent) {
        modalContent.style.width = '1000px';
        modalContent.style.maxWidth = '1000px';
        modalContent.classList.add('quiz-mode');
    }

    // 隐藏悬浮按钮
    floatBtn.style.display = 'none';

    // 修改标题为退出默写模式
    modalHeader.innerHTML = `
        <h3>默写复习</h3>
        <button class="btn-text" onclick="exitQuiz()">
            <i class="fas fa-sign-out-alt"></i> 退出默写模式
        </button>
    `;

    renderCurrentWord();
}

function renderCurrentWord() {
    const modalBody = document.getElementById('vocab-modal-body');
    const currentWord = quizState.words[quizState.currentIndex];
    const answerKey = String(quizState.currentIndex);
    const userAnswer = quizState.userAnswers[answerKey] || {};

    // 检查是否全部正确
    const isComplete = checkWordComplete(currentWord, userAnswer);

    // 生成字母输入框
    const wordLetters = currentWord.word.split('');
    const letterInputs = wordLetters.map((letter, index) => {
        const userInput = userAnswer[index] || '';
        const isCorrect = userInput.toUpperCase() === letter.toUpperCase();
        const isFilled = userInput !== '';

        let inputClass = 'quiz-letter-input';
        if (isFilled) {
            inputClass += isCorrect ? ' correct' : ' incorrect';
        }

        const returnVal = `<input type="text" class="${inputClass}" maxlength="1" data-index="${index}" value="${userInput}" oninput="handleLetterInput(this, ${index})" onkeydown="handleLetterKeypress(event, this)" autocomplete="off">`;
        return returnVal;
    }).join('');

    modalBody.innerHTML = `
        <div class="quiz-container">
            <div class="quiz-word-card">
                <div class="quiz-meaning">${currentWord.meaning}</div>
                <button class="quiz-audio-btn" onclick="speakText('${currentWord.word}')" title="朗读">
                    <i class="fas fa-volume-high"></i>
                </button>
                ${isComplete ? '<div class="quiz-complete-icon">✅</div>' : ''}
                <div class="quiz-input-area">
                    ${letterInputs}
                </div>
            </div>
        </div>
        ${renderQuizActions()}
    `;
}

function handleLetterInput(input, index) {
    const value = input.value;
    const answerKey = String(quizState.currentIndex);

    if (!quizState.userAnswers[answerKey]) {
        quizState.userAnswers[answerKey] = {};
    }

    quizState.userAnswers[answerKey][index] = value;

    // 实时检查并更新样式
    const currentWord = quizState.words[quizState.currentIndex];
    const letter = currentWord.word[index];
    const isCorrect = value.toUpperCase() === letter.toUpperCase();

    input.classList.remove('correct', 'incorrect');
    if (value !== '') {
        input.classList.add(isCorrect ? 'correct' : 'incorrect');

        // 自动跳到下一个输入框（无论对错）
        const inputs = document.querySelectorAll('.quiz-letter-input');
        if (index + 1 < inputs.length) {
            inputs[index + 1].focus();
        }
    }

    // 检查是否完成
    const userAnswer = quizState.userAnswers[answerKey];
    if (checkWordComplete(currentWord, userAnswer)) {
        renderCurrentWord();
    }
}

function handleLetterKeypress(event, input) {
    if (event.key === 'Backspace') {
        event.preventDefault();
        const index = parseInt(input.dataset.index);
        const answerKey = String(quizState.currentIndex);
        const inputs = document.querySelectorAll('.quiz-letter-input');

        // 如果当前输入框有内容，清空它
        if (input.value !== '') {
            input.value = '';
            input.classList.remove('correct', 'incorrect');
            if (quizState.userAnswers[answerKey]) {
                delete quizState.userAnswers[answerKey][index];
            }
        }
        // 跳到前一个输入框（如果不是第一个）
        else if (index > 0) {
            const prevInput = inputs[index - 1];
            prevInput.focus();

            // 清空前一个输入框
            prevInput.value = '';
            prevInput.classList.remove('correct', 'incorrect');
            if (quizState.userAnswers[answerKey]) {
                delete quizState.userAnswers[answerKey][index - 1];
            }
        }
    }
}

function checkWordComplete(word, userAnswer) {
    const letters = word.word.split('');
    for (let i = 0; i < letters.length; i++) {
        const userInput = userAnswer[i] || '';
        if (userInput.toUpperCase() !== letters[i].toUpperCase()) {
            return false;
        }
    }
    return true;
}

function renderQuizActions() {
    const isFirst = quizState.currentIndex === 0;
    const isLast = quizState.currentIndex === quizState.words.length - 1;

    let actionsHtml = '<div class="quiz-actions">';
    if (!isFirst) {
        actionsHtml += '<button class="btn-secondary" onclick="prevWord()">上一个</button>';
    }
    actionsHtml += '<button class="btn-secondary" onclick="removeCurrentWord()">移出生词本</button>';
    if (!isLast) {
        actionsHtml += '<button class="btn-primary" onclick="nextWord()">下一个</button>';
    }
    actionsHtml += '</div>';

    return actionsHtml;
}

function nextWord() {
    if (quizState.currentIndex < quizState.words.length - 1) {
        quizState.currentIndex++;
        renderCurrentWord();
    }
}

function prevWord() {
    if (quizState.currentIndex > 0) {
        quizState.currentIndex--;
        renderCurrentWord();
    }
}

async function removeCurrentWord() {
    const currentWord = quizState.words[quizState.currentIndex];

    if (await showConfirm('确定要将 "' + currentWord.word + '" 移出生词本吗？')) {
        // 从生词本中删除
        myVocab = myVocab.filter(w => w.word !== currentWord.word);
        localStorage.setItem('myVocab', JSON.stringify(myVocab));

        // 从默写列表中删除
        quizState.words.splice(quizState.currentIndex, 1);

        if (quizState.words.length === 0) {
            showToast('生词本已清空！');
            exitQuiz();
        } else {
            // 如果删除的是最后一个，移动到前一个
            if (quizState.currentIndex >= quizState.words.length) {
                quizState.currentIndex = quizState.words.length - 1;
            }
            renderCurrentWord();
        }
    }
}

function exitQuiz() {
    quizState.isActive = false;
    quizState.words = [];
    quizState.currentIndex = 0;
    quizState.userAnswers = {};

    // 恢复弹窗为生词本列表
    const modal = document.getElementById('vocab-modal');
    const modalHeader = document.getElementById('vocab-modal-header');
    const modalBody = document.getElementById('vocab-modal-body');
    const floatBtn = document.getElementById('quiz-start-btn');
    const modalContent = modal.querySelector('.modal-content');

    // 移除quiz-mode类并重置宽度
    if (modalContent) {
        modalContent.classList.remove('quiz-mode');
        modalContent.style.width = '';
        modalContent.style.maxWidth = '';
    }

    modalHeader.innerHTML = `
        <h3>我的生词本</h3>
        <button class="btn-close" onclick="closeVocabModal()"><i class="fas fa-times"></i></button>
    `;

    // 恢复生词本列表结构
    modalBody.innerHTML = '<ul class="vocab-list" id="vocab-list"></ul>';

    renderVocabList();

    // 显示悬浮按钮
    floatBtn.style.display = 'block';
}

// 词库导入功能
const VOCAB_LIBRARIES = {
    'middle-school': {
        url: 'https://raw.githubusercontent.com/KyleBing/english-vocabulary/master/json/1-初中-顺序.json',
        name: '初中词汇'
    },
    'high-school': {
        url: 'https://raw.githubusercontent.com/KyleBing/english-vocabulary/master/json/2-高中-顺序.json',
        name: '高中词汇'
    },
    'cet4': {
        url: 'https://raw.githubusercontent.com/KyleBing/english-vocabulary/master/json/3-CET4-顺序.json',
        name: '四级词汇'
    },
    'cet6': {
        url: 'https://raw.githubusercontent.com/KyleBing/english-vocabulary/master/json/4-CET6-顺序.json',
        name: '六级词汇'
    },
    'graduate': {
        url: 'https://raw.githubusercontent.com/KyleBing/english-vocabulary/master/json/5-考研-顺序.json',
        name: '考研词汇'
    },
    'toefl': {
        url: 'https://raw.githubusercontent.com/KyleBing/english-vocabulary/master/json/6-托福-顺序.json',
        name: '托福词汇'
    },
    'sat': {
        url: 'https://raw.githubusercontent.com/KyleBing/english-vocabulary/master/json/7-SAT-顺序.json',
        name: 'SAT词汇'
    }
};

function showVocabImportModal() {
    document.getElementById('vocab-import-modal').classList.remove('hidden');
}

function closeVocabImportModal() {
    document.getElementById('vocab-import-modal').classList.add('hidden');
}

async function importVocabLibrary(libraryKey) {
    const library = VOCAB_LIBRARIES[libraryKey];
    if (!library) {
        showToast('词库不存在');
        return;
    }

    showToast(`正在导入${library.name}...`);

    try {
        const response = await fetch(library.url);
        if (!response.ok) {
            throw new Error('网络请求失败');
        }

        const data = await response.json();

        // 转换格式并过滤已存在的单词
        const existingWords = new Set(myVocab.map(w => w.word.toLowerCase()));
        let importedCount = 0;

        data.forEach(item => {
            const wordLower = item.word.toLowerCase();
            if (!existingWords.has(wordLower)) {
                // 获取第一个释义
                const translation = item.translations && item.translations.length > 0
                    ? item.translations[0].translation
                    : '';

                // 获取词性
                const wordType = item.translations && item.translations.length > 0
                    ? item.translations[0].type
                    : '';

                // 组合释义和词性
                const meaning = wordType ? `${translation} (${wordType})` : translation;

                myVocab.push({
                    word: item.word,
                    phonetic: '',
                    meaning: meaning
                });

                existingWords.add(wordLower);
                importedCount++;
            }
        });

        // 保存到本地存储
        localStorage.setItem('myVocab', JSON.stringify(myVocab));

        showToast(`成功导入 ${importedCount} 个新单词`);
        closeVocabImportModal();
        renderVocabList();

    } catch (error) {
        console.error('导入词库失败:', error);
        showToast('导入失败，请检查网络连接');
    }
}

// 6. 心情日记 (Mood Diary)
let moodEntries = [];
let currentMoodMonth = new Date();
let selectedMoodDay = null; // 记录日历中选中的日期

function initMood() {
    const saved = localStorage.getItem('moodEntries');
    if (saved) {
        moodEntries = JSON.parse(saved);
    }
    renderMoodRecent();
}

function saveMood() {
    const moodInput = document.querySelector('input[name="mood"]:checked');
    const noteInput = document.getElementById('mood-note');
    
    if (!moodInput) return;
    
    // 如果今天已经记录了，询问是否覆盖或新增
    // 这里简单处理：允许一天多条
    
    const newEntry = {
        id: Date.now(),
        mood: moodInput.value,
        note: noteInput.value || '无备注',
        date: new Date().toISOString()
    };

    moodEntries.unshift(newEntry);
    localStorage.setItem('moodEntries', JSON.stringify(moodEntries));
    
    noteInput.value = '';
    renderMoodRecent();
}

function renderMoodRecent() {
    const list = document.getElementById('mood-recent-list');
    list.innerHTML = '';

    // Get today's date string (YYYY-MM-DD format for comparison)
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Filter today's mood entries only (using local timezone)
    const todayEntries = moodEntries.filter(entry => {
        // Parse the ISO date string and get local date parts
        const entryDate = new Date(entry.date);
        const entryYear = entryDate.getFullYear();
        const entryMonth = entryDate.getMonth() + 1; // Months are 0-indexed
        const entryDay = entryDate.getDate();
        const entryStr = `${entryYear}-${String(entryMonth).padStart(2, '0')}-${String(entryDay).padStart(2, '0')}`;
        return entryStr === todayStr;
    });

    // If no entries today, show placeholder
    if (todayEntries.length === 0) {
        list.innerHTML = `
            <div class="mood-empty-placeholder">
                <span>写写您今天的感受吧~</span>
            </div>
        `;
        return;
    }

    // Show maximum 2 entries for today
    const recent = todayEntries.slice(0, 2);

    recent.forEach(entry => {
        const date = new Date(entry.date);
        const div = document.createElement('div');
        div.className = 'mood-entry';
        div.id = `home-mood-entry-${entry.id}`;
        div.innerHTML = `
            <div class="entry-icon" style="color: ${getMoodColor(entry.mood)}">
                <i class="fas ${getMoodIconClass(entry.mood)}"></i>
            </div>
            <div class="entry-content">
                <div class="entry-view">
                    <div class="entry-text">${entry.note}</div>
                    <div class="entry-date">${date.toLocaleString()}</div>
                </div>
                <div class="entry-edit hidden">
                    <input type="text" class="neu-input-sm" id="home-edit-input-${entry.id}" value="${entry.note}">
                </div>
            </div>
            <div class="mood-actions">
                <div class="action-view">
                    <button class="btn-action-mood btn-edit-mood" onclick="editMood(${entry.id}, 'home')" title="编辑"><i class="fas fa-pen"></i></button>
                    <button class="btn-action-mood btn-delete-mood" onclick="deleteMood(${entry.id})" title="删除"><i class="fas fa-trash"></i></button>
                </div>
                <div class="action-edit hidden">
                    <button class="btn-action-mood btn-submit-mood" onclick="saveMoodEdit(${entry.id}, 'home')" title="提交"><i class="fas fa-check"></i></button>
                    <button class="btn-action-mood btn-cancel-mood" onclick="cancelMoodEdit(${entry.id}, 'home')" title="取消"><i class="fas fa-times"></i></button>
                </div>
            </div>
        `;
        list.appendChild(div);
    });
}

async function deleteMood(id) {
    if (await showConfirm('确定要删除这条心情日记吗？')) {
        moodEntries = moodEntries.filter(e => e.id !== id);
        localStorage.setItem('moodEntries', JSON.stringify(moodEntries));
        renderMoodRecent();

        // If modal is open, re-render modal views
        if (!document.getElementById('mood-modal').classList.contains('hidden')) {
            if (document.getElementById('modal-view-timeline').classList.contains('active')) {
                renderModalMoodTimeline();
            } else {
                // 重新渲染日历并更新选中日期的详情
                renderModalMoodCalendar();
                if (selectedMoodDay) {
                    // 保持选中状态并重新渲染详情
                    const dayIndex = selectedMoodDay.day;
                    const dayDivs = document.querySelectorAll('.calendar-day');
                    if (dayDivs[dayIndex - 1]) {
                        dayDivs[dayIndex - 1].classList.add('selected');
                    }
                    renderMoodDayDetail(selectedMoodDay.year, selectedMoodDay.month, selectedMoodDay.day);
                }
            }
        }
    }
}

function editMood(id, location = 'home') {
    const entryDiv = document.getElementById(`${location}-mood-entry-${id}`);
    const viewContent = entryDiv.querySelector('.entry-view');
    const editContent = entryDiv.querySelector('.entry-edit');
    const viewActions = entryDiv.querySelector('.action-view');
    const editActions = entryDiv.querySelector('.action-edit');
    const inputEl = document.getElementById(`${location}-edit-input-${id}`);

    // 显示编辑状态
    viewContent.classList.add('hidden');
    editContent.classList.remove('hidden');
    viewActions.classList.add('hidden');
    editActions.classList.remove('hidden');

    // 聚焦输入框
    inputEl.focus();
    inputEl.select();
}

function cancelMoodEdit(id, location = 'home') {
    const entryDiv = document.getElementById(`${location}-mood-entry-${id}`);
    const viewContent = entryDiv.querySelector('.entry-view');
    const editContent = entryDiv.querySelector('.entry-edit');
    const viewActions = entryDiv.querySelector('.action-view');
    const editActions = entryDiv.querySelector('.action-edit');

    // 恢复显示状态
    viewContent.classList.remove('hidden');
    editContent.classList.add('hidden');
    viewActions.classList.remove('hidden');
    editActions.classList.add('hidden');
}

function saveMoodEdit(id, location = 'home') {
    const inputEl = document.getElementById(`${location}-edit-input-${id}`);
    const newNote = inputEl.value.trim();

    if (!newNote) {
        showToast('请输入内容');
        return;
    }

    const entry = moodEntries.find(e => e.id === id);
    if (entry) {
        entry.note = newNote;
        localStorage.setItem('moodEntries', JSON.stringify(moodEntries));
        renderMoodRecent();

        // If modal is open, re-render modal views
        if (!document.getElementById('mood-modal').classList.contains('hidden')) {
            if (document.getElementById('modal-view-timeline').classList.contains('active')) {
                renderModalMoodTimeline();
            } else {
                // 重新渲染日历并更新选中日期的详情
                renderModalMoodCalendar();
                if (selectedMoodDay) {
                    // 保持选中状态并重新渲染详情
                    const dayIndex = selectedMoodDay.day;
                    const dayDivs = document.querySelectorAll('.calendar-day');
                    if (dayDivs[dayIndex - 1]) {
                        dayDivs[dayIndex - 1].classList.add('selected');
                    }
                    renderMoodDayDetail(selectedMoodDay.year, selectedMoodDay.month, selectedMoodDay.day);
                }
            }
        }
    }
}

// Modal Logic
function showMoodStats() {
    document.getElementById('mood-modal').classList.remove('hidden');
    switchMoodModalView('timeline');
}

function closeMoodModal() {
    document.getElementById('mood-modal').classList.add('hidden');
}

function switchMoodModalView(view) {
    document.getElementById('modal-view-timeline').classList.toggle('active', view === 'timeline');
    document.getElementById('modal-view-calendar').classList.toggle('active', view === 'calendar');
    
    if (view === 'timeline') {
        document.getElementById('modal-mood-timeline').classList.remove('hidden');
        document.getElementById('modal-mood-calendar').classList.add('hidden');
        renderModalMoodTimeline();
    } else {
        document.getElementById('modal-mood-timeline').classList.add('hidden');
        document.getElementById('modal-mood-calendar').classList.remove('hidden');
        renderModalMoodCalendar();
    }
}

function changeMoodMonth(delta) {
    currentMoodMonth.setMonth(currentMoodMonth.getMonth() + delta);
    renderModalMoodCalendar();
}

function renderModalMoodTimeline() {
    const list = document.getElementById('modal-mood-list');
    list.innerHTML = '';

    moodEntries.forEach(entry => {
        const date = new Date(entry.date);
        const li = document.createElement('li');
        li.className = 'mood-entry';
        li.id = `modal-timeline-mood-entry-${entry.id}`;
        li.innerHTML = `
            <div class="entry-icon" style="color: ${getMoodColor(entry.mood)}">
                <i class="fas ${getMoodIconClass(entry.mood)}"></i>
            </div>
            <div class="entry-content">
                <div class="entry-view">
                    <div class="entry-text">${entry.note}</div>
                    <div class="entry-date">${date.toLocaleString()}</div>
                </div>
                <div class="entry-edit hidden">
                    <input type="text" class="neu-input-sm" id="modal-timeline-edit-input-${entry.id}" value="${entry.note}">
                </div>
            </div>
            <div class="mood-actions">
                <div class="action-view">
                    <button class="btn-action-mood btn-edit-mood" onclick="editMood(${entry.id}, 'modal-timeline')" title="编辑"><i class="fas fa-pen"></i></button>
                    <button class="btn-action-mood btn-delete-mood" onclick="deleteMood(${entry.id})" title="删除"><i class="fas fa-trash"></i></button>
                </div>
                <div class="action-edit hidden">
                    <button class="btn-action-mood btn-submit-mood" onclick="saveMoodEdit(${entry.id}, 'modal-timeline')" title="提交"><i class="fas fa-check"></i></button>
                    <button class="btn-action-mood btn-cancel-mood" onclick="cancelMoodEdit(${entry.id}, 'modal-timeline')" title="取消"><i class="fas fa-times"></i></button>
                </div>
            </div>
        `;
        list.appendChild(li);
    });
}

function renderModalMoodCalendar() {
    const year = currentMoodMonth.getFullYear();
    const month = currentMoodMonth.getMonth();
    
    document.getElementById('mood-calendar-month').textContent = `${year}年${month + 1}月`;
    
    const grid = document.getElementById('modal-calendar-grid');
    grid.innerHTML = '';
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let i = 1; i <= daysInMonth; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        dayDiv.innerHTML = `<span class="cal-date">${i}</span>`;
        
        // Find entries for this day
        const dayEntries = moodEntries.filter(e => {
            const d = new Date(e.date);
            return d.getFullYear() === year && d.getMonth() === month && d.getDate() === i;
        });
        
        if (dayEntries.length > 0) {
            // Show first mood icon
            const entry = dayEntries[0];
            dayDiv.innerHTML += `
                <i class="fas ${getMoodIconClass(entry.mood)}" style="color: ${getMoodColor(entry.mood)}; font-size: 16px;"></i>
            `;
            if (dayEntries.length > 1) {
                dayDiv.innerHTML += `<span style="font-size:8px; position:absolute; top:2px; right:2px;">+${dayEntries.length - 1}</span>`;
                dayDiv.style.position = 'relative';
            }
        }
        
        dayDiv.onclick = () => {
             // Remove selected class from others
             document.querySelectorAll('.calendar-day').forEach(el => el.classList.remove('selected'));
             dayDiv.classList.add('selected');
             selectedMoodDay = { year, month, day: i }; // 记录选中的日期
             renderMoodDayDetail(year, month, i);
        };

        grid.appendChild(dayDiv);
    }
}

function renderMoodDayDetail(year, month, day) {
    const list = document.getElementById('mood-day-list');
    const container = document.getElementById('mood-day-detail');
    list.innerHTML = '';

    // Filter entries for this day
    const dayEntries = moodEntries.filter(e => {
        const d = new Date(e.date);
        return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });

    if (dayEntries.length === 0) {
        container.innerHTML = '<div class="detail-placeholder">该日无心情记录</div>';
    } else {
        container.innerHTML = `<ul class="mood-list" id="mood-day-list"></ul>`;
        const newList = document.getElementById('mood-day-list');

        dayEntries.forEach(entry => {
            const date = new Date(entry.date);
            const li = document.createElement('li');
            li.className = 'mood-entry';
            li.id = `modal-day-mood-entry-${entry.id}`;
            li.innerHTML = `
                <div class="entry-icon" style="color: ${getMoodColor(entry.mood)}">
                    <i class="fas ${getMoodIconClass(entry.mood)}"></i>
                </div>
                <div class="entry-content">
                    <div class="entry-view">
                        <div class="entry-text">${entry.note}</div>
                        <div class="entry-date">${date.toLocaleTimeString()}</div>
                    </div>
                    <div class="entry-edit hidden">
                        <input type="text" class="neu-input-sm" id="modal-day-edit-input-${entry.id}" value="${entry.note}">
                    </div>
                </div>
                <div class="mood-actions">
                    <div class="action-view">
                        <button class="btn-action-mood btn-edit-mood" onclick="editMood(${entry.id}, 'modal-day')" title="编辑"><i class="fas fa-pen"></i></button>
                        <button class="btn-action-mood btn-delete-mood" onclick="deleteMood(${entry.id})" title="删除"><i class="fas fa-trash"></i></button>
                    </div>
                    <div class="action-edit hidden">
                        <button class="btn-action-mood btn-submit-mood" onclick="saveMoodEdit(${entry.id}, 'modal-day')" title="提交"><i class="fas fa-check"></i></button>
                        <button class="btn-action-mood btn-cancel-mood" onclick="cancelMoodEdit(${entry.id}, 'modal-day')" title="取消"><i class="fas fa-times"></i></button>
                    </div>
                </div>
            `;
            newList.appendChild(li);
        });
    }
}

function getMoodIconClass(mood) {
    const map = {
        happy: 'fa-face-laugh-beam',
        normal: 'fa-face-meh',
        sad: 'fa-face-frown',
        angry: 'fa-face-angry',
        tired: 'fa-face-tired'
    };
    return map[mood] || 'fa-face-smile';
}

function getMoodColor(mood) {
    const map = {
        happy: '#f1c40f',
        normal: '#3498db',
        sad: '#95a5a6',
        angry: '#e74c3c',
        tired: '#9b59b6'
    };
    return map[mood] || '#ccc';
}

// Health Edit Modal (补打卡功能)
let editingHealthDate = null;

function openHealthEditModal(dateStr) {
    editingHealthDate = dateStr;

    // Format date for display
    const date = new Date(dateStr);
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    document.getElementById('health-edit-date').textContent = date.toLocaleDateString('zh-CN', options);

    // Load current data
    const dayData = healthRecords[dateStr] || { water: false, toilet: false, exercise: false };

    // Set checkbox states
    document.getElementById('edit-water').checked = dayData.water;
    document.getElementById('edit-toilet').checked = dayData.toilet;
    document.getElementById('edit-exercise').checked = dayData.exercise;

    // Show modal
    document.getElementById('health-edit-modal').classList.remove('hidden');
}

function closeHealthEditModal() {
    document.getElementById('health-edit-modal').classList.add('hidden');
    editingHealthDate = null;
}

function saveHealthEdit() {
    if (!editingHealthDate) return;

    const water = document.getElementById('edit-water').checked;
    const toilet = document.getElementById('edit-toilet').checked;
    const exercise = document.getElementById('edit-exercise').checked;

    // If all unchecked, remove the record
    if (!water && !toilet && !exercise) {
        delete healthRecords[editingHealthDate];
    } else {
        healthRecords[editingHealthDate] = { water, toilet, exercise };
    }

    saveHealth();
    renderHealthCalendar();

    // If editing today's date, also update main UI
    if (editingHealthDate === getTodayStr()) {
        updateHealthUI();
    }

    closeHealthEditModal();
}

// 7. 每日一言 (Daily Quote)
const quotes = [
    { text: "成功不是将来才有的，而是从决定去做的那一刻起，持续累积而成。", author: "俞敏洪" },
    { text: "不要等待机会，而要创造机会。", author: "佚名" },
    { text: "每天进步一点点，成功的路上不拥挤。", author: "佚名" },
    { text: "今天的努力，是为了明天的选择更多。", author: "佚名" },
    { text: "种一棵树最好的时间是十年前，其次是现在。", author: "丹比萨·莫约" },
    { text: "人生没有白走的路，每一步都算数。", author: "李宗盛" },
    { text: "你若盛开，蝴蝶自来；你若精彩，天自安排。", author: "佚名" },
    { text: "生活不是等待风暴过去，而是学会在雨中翩翩起舞。", author: "佚名" },
    { text: "愿你走出半生，归来仍是少年。", author: "佚名" },
    { text: "不忘初心，方得始终。", author: "佚名" },
    { text: "与其感慨路难行，不如马上出发。", author: "佚名" },
    { text: "梦想不会逃跑，会逃跑的永远都是自己。", author: "佚名" },
    { text: "努力的意义，就是以后的日子里，放眼望去，全部都是自己喜欢的人和事。", author: "佚名" },
    { text: "与其诅咒黑暗，不如点亮蜡烛。", author: "佚名" },
    { text: "所有的惊艳，都来自长久的准备。", author: "佚名" },
    { text: "世界上只有一种英雄主义，就是在认清生活真相之后依然热爱生活。", author: "罗曼·罗兰" },
    { text: "生活不止眼前的苟且，还有诗和远方的田野。", author: "高晓松" },
    { text: "所谓无底深渊，下去，也是前程万里。", author: "木心" },
    { text: "我们终此一生，就是要摆脱他人的期待，找到真正的自己。", author: "伍绮诗" },
    { text: "当你的才华还撑不起你的野心时，你就应该静下心来学习。", author: "莫言" },
    { text: "时间会告诉你一切真相。", author: "佚名" },
    { text: "你若不想做，总会找到借口；你若想做，总会找到方法。", author: "佚名" },
    { text: "星光不问赶路人，时光不负有心人。", author: "佚名" },
    { text: "愿你眼中总有光芒，活成你想要的模样。", author: "佚名" },
    { text: "每一个不曾起舞的日子，都是对生命的辜负。", author: "尼采" },
    { text: "向着月亮出发，即使不能到达，也能站在群星之中。", author: "莱斯·布朗" },
    { text: "做自己的太阳，无需凭借谁的光。", author: "佚名" },
    { text: "你不需要很厉害才能开始，但你需要开始才能变厉害。", author: "佚名" },
    { text: "没有白费的努力，也没有碰巧的成功。", author: "佚名" },
    { text: "认真生活，就能找到被人生偷藏起来的糖。", author: "佚名" },
    { text: "保持热爱，奔赴山海。", author: "佚名" }
];

let currentQuote = {};

function initQuote() {
    const today = getTodayStr();
    const savedQuote = localStorage.getItem('dailyQuote');

    if (savedQuote) {
        const quoteData = JSON.parse(savedQuote);
        // Check if it's from today
        if (quoteData.date === today) {
            currentQuote = quoteData.quote;
            displayQuote(currentQuote);
            return;
        }
    }

    // Get a new quote for today
    refreshQuote();
}

function refreshQuote() {
    // Get a random quote different from current
    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * quotes.length);
    } while (quotes[newIndex].text === currentQuote.text && quotes.length > 1);

    currentQuote = quotes[newIndex];
    displayQuote(currentQuote);

    // Save with today's date
    const today = getTodayStr();
    localStorage.setItem('dailyQuote', JSON.stringify({
        date: today,
        quote: currentQuote
    }));
}

function displayQuote(quote) {
    const textEl = document.getElementById('quote-text');
    const authorEl = document.getElementById('quote-author');

    // Add fade-out effect
    textEl.style.opacity = '0';
    authorEl.style.opacity = '0';

    setTimeout(() => {
        textEl.textContent = quote.text;
        authorEl.textContent = `—— ${quote.author}`;

        // Fade in
        textEl.style.opacity = '1';
        authorEl.style.opacity = '1';
    }, 200);
}

// ==================== 数据导出/导入功能 ====================

function exportData() {
    const data = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        data: {
            healthRecords: JSON.parse(localStorage.getItem('healthRecords') || '[]'),
            todos: JSON.parse(localStorage.getItem('todos') || '[]'),
            myVocab: JSON.parse(localStorage.getItem('myVocab') || '[]'),
            moodEntries: JSON.parse(localStorage.getItem('moodEntries') || '[]'),
            dailyQuote: JSON.parse(localStorage.getItem('dailyQuote') || '{}')
        }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `worker-desktop-backup-${getTodayStr()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('数据导出成功！');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);

            // Validate data structure
            if (!imported.data) {
                showToast('导入失败：文件格式不正确');
                return;
            }

            // Confirm import
            showConfirm('导入数据将覆盖当前所有数据，确定要继续吗？').then(confirmed => {
                if (confirmed) {
                    // Import all data
                    if (imported.data.healthRecords) {
                        localStorage.setItem('healthRecords', JSON.stringify(imported.data.healthRecords));
                    }
                    if (imported.data.todos) {
                        localStorage.setItem('todos', JSON.stringify(imported.data.todos));
                    }
                    if (imported.data.myVocab) {
                        localStorage.setItem('myVocab', JSON.stringify(imported.data.myVocab));
                    }
                    if (imported.data.moodEntries) {
                        localStorage.setItem('moodEntries', JSON.stringify(imported.data.moodEntries));
                    }
                    if (imported.data.dailyQuote) {
                        localStorage.setItem('dailyQuote', JSON.stringify(imported.data.dailyQuote));
                    }

                    showToast('数据导入成功！页面即将刷新...');
                    setTimeout(() => {
                        location.reload();
                    }, 1500);
                }
            });
        } catch (error) {
            showToast('导入失败：文件格式错误');
            console.error('Import error:', error);
        }
    };
    reader.readAsText(file);

    // Reset input
    event.target.value = '';
}
