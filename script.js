// 1. 初始化
// 聚合数据今日头条API配置
const JUHE_API_KEY = '03d1da64823d24414d7b6bab4b8390a2'; // 聚合数据API密钥
const JUHE_BASE_URL = 'http://v.juhe.cn/toutiao';

const CORS_PROXY = 'https://api.codetabs.com/v1/proxy?quest=';

// 新闻类型映射（前端分类 → 聚合数据API type参数）
const NEWS_TYPE_MAP = {
    'tech': 'keji',
    'finance': 'caijing',
    'general': 'guonei',
    'international': 'guoji'
};


// 自动清除旧版本新闻缓存
if (localStorage.getItem('newsData') && !JSON.parse(localStorage.getItem('newsData')).version) {
    localStorage.removeItem('newsData');
    console.log('已清除旧版本新闻缓存');
}

document.addEventListener('DOMContentLoaded', () => {
    initDate();
    initHealth();
    initTodos();
    initHoliday();
    initMood();
    initQuote();
    initAccounting();
    setTimeout(initNews, 1000);;
    setTimeout(initWord, 1500);;
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

// Loading遮罩
function showLoading(text = '处理中...') {
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');
    loadingText.textContent = text;
    loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    loadingOverlay.classList.add('hidden');
}

// 全局确认对话框
let confirmCallback = null;
function showConfirm(message) {
    return new Promise((resolve) => {
        const dialog = document.getElementById('confirm-dialog');
        const messageEl = document.getElementById('confirm-dialog-message');
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
        const healthItem = btn.closest('.health-item');

        if (isDone) {
            healthItem.classList.add('active');
            btn.style.opacity = '1';
            btn.innerHTML = '<i class="fas fa-check"></i>';
            status.textContent = '已打卡';
            status.classList.add('done');
        } else {
            healthItem.classList.remove('active');
            btn.style.opacity = '1';
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
    autoResizeTextarea(inputEl);
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
                        <div class="edit-container">
                            <textarea class="edit-textarea" id="todo-edit-input-${todo.id}" rows="1" oninput="autoResizeTextarea(this)" onkeypress="handleTodoEditKeypress(event, ${todo.id})">${todo.text}</textarea>
                            <div class="edit-actions-inline">
                                <button class="btn-save" onclick="saveTodoEdit(${todo.id})" title="保存"><i class="fas fa-check"></i></button>
                                <button class="btn-cancel" onclick="cancelTodoEdit(${todo.id})" title="取消"><i class="fas fa-times"></i></button>
                            </div>
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
let vocabLibrary = [
    { word: 'Resilience', phonetic: '/rɪˈzɪliəns/', meaning: 'n. 恢复力；弹力；顺应力' },
    { word: 'Procrastinate', phonetic: '/prəˈkræstɪneɪt/', meaning: 'v. 拖延，耽搁' },
    { word: 'Synergy', phonetic: '/ˈsɪnərdʒi/', meaning: 'n. 协同效应；增效作用' },
    { word: 'Ambiguous', phonetic: '/æmˈbɪɡjuəs/', meaning: 'adj. 模棱两可的；含糊不清的' },
    { word: 'Paradigm', phonetic: '/ˈpærədaɪm/', meaning: 'n. 范例；词形变化表' }
];

let currentWord = {};
let myVocab = [];

async function initWord() {
    // 从localStorage加载词库
    const savedLibrary = localStorage.getItem('vocabLibrary');
    if (savedLibrary) {
        const parsedLibrary = JSON.parse(savedLibrary);
        // 合并到当前词库，避免重复
        const existingWords = new Set(vocabLibrary.map(w => w.word.toLowerCase()));
        parsedLibrary.forEach(item => {
            if (!existingWords.has(item.word.toLowerCase())) {
                vocabLibrary.push(item);
            }
        });
    }

    // 随机选一个 (实际应用按日期 Hash 选择)
    const index = Math.floor(Math.random() * vocabLibrary.length);
    currentWord = vocabLibrary[index];

    // 如果音标为空，从字典API获取
    if (!currentWord.phonetic || currentWord.phonetic.trim() === '') {
        const fetchedPhonetic = await fetchPhoneticFromDictionary(currentWord.word);
        if (fetchedPhonetic) {
            currentWord.phonetic = fetchedPhonetic;
            // 更新vocabLibrary中的音标
            vocabLibrary[index].phonetic = fetchedPhonetic;
            // 保存到localStorage
            localStorage.setItem('vocabLibrary', JSON.stringify(vocabLibrary));
        }
    }

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

async function refreshWord() {
    // Get a new random word, different from current
    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * vocabLibrary.length);
    } while (vocabLibrary[newIndex].word === currentWord.word && vocabLibrary.length > 1);

    currentWord = vocabLibrary[newIndex];

    // 如果音标为空，从字典API获取
    if (!currentWord.phonetic || currentWord.phonetic.trim() === '') {
        const fetchedPhonetic = await fetchPhoneticFromDictionary(currentWord.word);
        if (fetchedPhonetic) {
            currentWord.phonetic = fetchedPhonetic;
            // 更新vocabLibrary中的音标
            vocabLibrary[newIndex].phonetic = fetchedPhonetic;
            // 保存到localStorage
            localStorage.setItem('vocabLibrary', JSON.stringify(vocabLibrary));
        }
    }

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

    // 修改标题
    modalHeader.innerHTML = `
        <h3>默写复习</h3>
        <button class="btn-close" onclick="exitQuiz()"><i class="fas fa-times"></i></button>
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

    // 检查是否完成且正确
    const userAnswer = quizState.userAnswers[answerKey];
    if (checkWordComplete(currentWord, userAnswer)) {
        // 检查是否全部正确
        const allCorrect = currentWord.word.split('').every((letter, idx) => {
            const userInput = userAnswer[idx] || '';
            return userInput.toUpperCase() === letter.toUpperCase();
        });

        if (allCorrect) {
            // 延迟500ms后自动进入下一个
            setTimeout(() => {
                nextWord();
            }, 500);
        } else {
            renderCurrentWord();
        }
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

    // 添加退出按钮在最下面
    actionsHtml += '<div class="quiz-exit-container">';
    actionsHtml += '<button class="btn-text-quiz" onclick="exitQuiz()">退出默写模式</button>';
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

// 获取已导入的词库列表
function getImportedLibraries() {
    const imported = localStorage.getItem('importedVocabLibraries');
    return imported ? JSON.parse(imported) : [];
}

// 保存已导入的词库列表
function saveImportedLibraries(libraries) {
    localStorage.setItem('importedVocabLibraries', JSON.stringify(libraries));
}

// 从词库中删除指定词库的所有单词
function removeLibraryWords(libraryKey) {
    const library = VOCAB_LIBRARIES[libraryKey];
    if (!library) {
        console.error('找不到词库:', libraryKey);
        showToast('操作失败：找不到词库');
        return;
    }

    console.log('开始移除词库:', libraryKey, '词库名称:', library.name, '当前词库大小:', vocabLibrary.length);

    // 显示loading（延迟500ms，如果操作很快就不显示）
    let loadingTimer = null;
    let loadingShown = false;

    const startTime = Date.now();

    loadingTimer = setTimeout(() => {
        showLoading(`正在移除"${library.name}"...`);
        loadingShown = true;
        console.log('显示loading，已耗时:', Date.now() - startTime, 'ms');
    }, 500);

    try {
        // 统计有多少单词属于这个词库
        const wordsInLibrary = vocabLibrary.filter(word => word.libraryKey === libraryKey);
        console.log(`找到${wordsInLibrary.length}个属于${library.name}的单词`);

        // 过滤掉属于该词库的单词
        const originalLength = vocabLibrary.length;
        vocabLibrary = vocabLibrary.filter(word => {
            // 如果单词有libraryKey属性，直接比较
            if (word.libraryKey) {
                return word.libraryKey !== libraryKey;
            }
            // 如果没有libraryKey（旧数据），保留该单词
            return true;
        });

        const removedCount = originalLength - vocabLibrary.length;
        console.log('实际移除了', removedCount, '个单词，剩余:', vocabLibrary.length);

        // 保存到本地存储（无论是否有单词被移除都要保存）
        localStorage.setItem('vocabLibrary', JSON.stringify(vocabLibrary));
        console.log('已保存到localStorage');

        // 从已导入列表中移除该词库
        const importedLibs = getImportedLibraries();
        const updatedLibs = importedLibs.filter(key => key !== libraryKey);
        saveImportedLibraries(updatedLibs);
        console.log('已更新已导入词库列表:', updatedLibs);

        const endTime = Date.now();
        const duration = endTime - startTime;
        console.log('移除操作完成，耗时:', duration, 'ms');

        // 清除loading定时器
        if (loadingTimer) {
            clearTimeout(loadingTimer);
            loadingTimer = null;
        }

        // 如果显示了loading，隐藏它
        if (loadingShown) {
            // 确保至少显示500ms，避免闪烁
            const minDisplayTime = 500;
            const remainingTime = Math.max(0, minDisplayTime - (endTime - startTime - 500));
            setTimeout(() => {
                hideLoading();
                showResultToast(removedCount, library);
            }, remainingTime);
        } else {
            // 没有显示loading，直接显示结果
            showResultToast(removedCount, library);
        }

        // 显示结果的辅助函数
        function showResultToast(removedCount, library) {
            // 显示反馈
            if (removedCount > 0) {
                showToast(`已移除"${library.name}"的${removedCount}个单词`);

                // 取消卡片的勾选状态
                const card = document.querySelector(`.vocab-import-card[data-library="${libraryKey}"]`);
                if (card) {
                    card.classList.remove('selected');
                    console.log(`已取消词库${libraryKey}的勾选状态`);
                }

                // 如果当前单词被删除了，刷新显示
                if (currentWord && currentWord.word && currentWord.libraryKey === libraryKey) {
                    console.log('当前单词被移除，刷新显示');
                    // 检查是否还有单词可用
                    if (vocabLibrary.length > 0) {
                        // refreshWord是async函数，需要处理
                        refreshWord().catch(err => {
                            console.error('刷新单词失败:', err);
                        });
                    } else {
                        // 没有单词了，清空显示
                        document.getElementById('word-spelling').textContent = '暂无单词';
                        document.getElementById('word-phonetic').textContent = '';
                        document.getElementById('word-meaning').textContent = '请先导入词库';
                    }
                }
            } else {
                showToast(`"${library.name}"没有可移除的单词`);
                console.log('没有单词被移除');
            }
        }
    } catch (error) {
        console.error('移除词库时出错:', error);

        // 清除loading定时器
        if (loadingTimer) {
            clearTimeout(loadingTimer);
            loadingTimer = null;
        }

        // 隐藏loading
        if (loadingShown) {
            hideLoading();
        }

        showToast('操作失败，请重试');
    }
}

function showVocabImportModal() {
    console.log('=== 打开导入弹窗 ===');
    console.log('当前vocabLibrary大小:', vocabLibrary.length);

    // 先显示弹窗
    document.getElementById('vocab-import-modal').classList.remove('hidden');

    // 使用setTimeout确保DOM已渲染
    setTimeout(() => {
        // 清除所有选中状态
        const allCards = document.querySelectorAll('.vocab-import-card');
        console.log('找到', allCards.length, '个词库卡片');

        // 打印所有卡片的data-library属性
        allCards.forEach(card => {
            console.log(`卡片: ${card.dataset.library}, 元素:`, card);
        });

        allCards.forEach(card => {
            card.classList.remove('selected');
        });

        // 基于实际存在的单词来判断哪些词库已导入
        const importedLibraryKeys = new Set();
        vocabLibrary.forEach(word => {
            if (word.libraryKey) {
                importedLibraryKeys.add(word.libraryKey);
            }
        });

        console.log('检测到的已导入词库:', Array.from(importedLibraryKeys));

        // 为有单词的词库添加选中状态
        let selectedCount = 0;
        allCards.forEach(card => {
            const libraryKey = card.dataset.library;
            console.log(`检查卡片 ${libraryKey}, 是否在已导入列表中:`, importedLibraryKeys.has(libraryKey));
            if (importedLibraryKeys.has(libraryKey)) {
                card.classList.add('selected');
                selectedCount++;
                console.log(`✓ 勾选词库: ${libraryKey}`);
            }
        });

        console.log(`总共勾选了 ${selectedCount} 个词库`);

        // 验证：重新检查哪些卡片有selected类
        const selectedCards = document.querySelectorAll('.vocab-import-card.selected');
        console.log('验证：实际有selected类的卡片数量:', selectedCards.length);
        selectedCards.forEach(card => {
            console.log('  -', card.dataset.library);
        });

        console.log('=== 导入弹窗打开完成 ===');
    }, 50);
}

function closeVocabImportModal() {
    document.getElementById('vocab-import-modal').classList.add('hidden');
}

// 确认弹窗相关
let pendingConfirmAction = null;

function showConfirmModal(title, message, onConfirm) {
    console.log('=== 显示确认弹窗 ===');
    console.log('标题参数:', title);
    console.log('消息参数:', message);

    const modal = document.getElementById('confirm-modal');
    const titleEl = document.getElementById('confirm-title');
    const messageEl = document.getElementById('confirm-message');

    console.log('Modal元素:', modal);
    console.log('Title元素:', titleEl, '初始内容:', titleEl ? titleEl.textContent : 'N/A');
    console.log('Message元素:', messageEl);

    // 设置标题
    if (titleEl) {
        titleEl.textContent = title;
        console.log('✓ 标题已设置为:', titleEl.textContent);
    } else {
        console.error('✗ 找不到confirm-title元素');
    }

    // 设置消息
    if (messageEl) {
        messageEl.innerHTML = message;
        console.log('✓ 消息已设置为:', messageEl.innerHTML);
    } else {
        console.error('✗ 找不到confirm-message元素');
    }

    pendingConfirmAction = onConfirm;

    // 显示弹窗
    if (modal) {
        modal.classList.remove('hidden');
        console.log('✓ 弹窗已显示');
    } else {
        console.error('✗ 找不到confirm-modal元素');
    }

    console.log('=== 确认弹窗设置完成 ===');
}

function closeConfirmModal(confirmed) {
    const modal = document.getElementById('confirm-modal');
    modal.classList.add('hidden');

    if (confirmed && pendingConfirmAction) {
        pendingConfirmAction();
    }
    pendingConfirmAction = null;
}

// 从字典API获取音标
async function fetchPhoneticFromDictionary(word) {
    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        if (!response.ok) {
            return '';
        }
        const data = await response.json();
        if (data && data.length > 0 && data[0].phonetics) {
            // 优先使用有文本的音标
            const phoneticWithText = data[0].phonetics.find(p => p.text);
            if (phoneticWithText) {
                return phoneticWithText.text;
            }
        }
        return '';
    } catch (error) {
        console.warn(`获取${word}音标失败:`, error);
        return '';
    }
}

function toggleVocabLibrary(card) {
    const libraryKey = card.dataset.library;
    const library = VOCAB_LIBRARIES[libraryKey];
    const wasSelected = card.classList.contains('selected');

    // 检查该词库是否真的已经导入（vocabLibrary中有该词库的单词）
    const isImported = vocabLibrary.some(word => word.libraryKey === libraryKey);
    console.log(`词库${libraryKey}: wasSelected=${wasSelected}, isImported=${isImported}`);

    // 如果是从选中变为未选中
    if (wasSelected) {
        if (library) {
            // 如果词库已经导入，需要确认移除
            if (isImported) {
                showConfirmModal(
                    '移除词库',
                    `确认移除"${library.name}"吗？`,
                    () => {
                        // 用户确认，执行移除
                        console.log('用户确认移除已导入的词库:', libraryKey);
                        removeLibraryWords(libraryKey);
                    }
                );
            } else {
                // 词库还没导入，只是取消选择，不需要移除
                console.log('词库尚未导入，仅取消选择');
                card.classList.remove('selected');
            }
        }
    } else {
        // 从未选中变为选中，直接添加选中状态
        card.classList.add('selected');
    }
}

async function importSelectedVocabLibraries() {
    console.log('=== importSelectedVocabLibraries 开始 ===');
    const selectedCards = document.querySelectorAll('.vocab-import-card.selected');
    console.log('选中的卡片数量:', selectedCards.length);

    if (selectedCards.length === 0) {
        console.log('没有选中任何词库');
        showToast('请至少选择一个词库');
        return;
    }

    console.log('准备调用showLoading...');
    // 显示loading
    try {
        showLoading('正在导入词库...');
        console.log('showLoading调用成功');
    } catch (e) {
        console.error('showLoading调用失败:', e);
    }

    let totalImported = 0;
    let totalSkipped = 0;  // 总共跳过的单词数
    const importedLibraries = getImportedLibraries();
    console.log('已导入的词库列表:', importedLibraries);

    const importResults = [];  // 记录每个词库的导入结果

    try {
        let libraryIndex = 0;
        for (const card of selectedCards) {
            const libraryKey = card.dataset.library;
            const library = VOCAB_LIBRARIES[libraryKey];

            if (!library) continue;

            libraryIndex++;
            console.log(`开始导入${library.name}...`);

            // 显示当前进度
            showLoading(
                `正在导入"${library.name}"...\n` +
                `词库进度: ${libraryIndex}/${selectedCards.length}`
            );
            showToast(`正在导入${library.name} (${libraryIndex}/${selectedCards.length})...`);

            try {
                // 添加超时控制（60秒超时，处理大词库需要更长时间）
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 60000);

                const response = await fetch(library.url, {
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                console.log(`${library.name}获取到${data.length}个单词`);

                // 更新loading提示
                showLoading(`正在导入"${library.name}"...\n获取到 ${data.length} 个单词`);

                // 转换格式并过滤已存在的单词
                const existingWords = new Set(vocabLibrary.map(w => w.word.toLowerCase()));
                let importedCount = 0;
                let skippedCount = 0;  // 新增：记录跳过的单词数

                // 每处理500个单词更新一次进度
                const updateInterval = 500;
                let lastUpdate = 0;

                data.forEach((item, index) => {
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

                        // 获取音标（优先使用美式音标，其次是英式，最后使用phonetic字段）
                        const phonetic = item.phonetic || item.ph_am || item.ph_en || '';

                        vocabLibrary.push({
                            word: item.word,
                            phonetic: phonetic,
                            meaning: meaning,
                            libraryKey: libraryKey  // 记录单词来自哪个词库
                        });

                        existingWords.add(wordLower);
                        importedCount++;
                    } else {
                        skippedCount++;  // 单词已存在，跳过
                    }

                    // 定期更新进度
                    if (index - lastUpdate >= updateInterval || index === data.length - 1) {
                        const processed = index + 1;
                        const progress = Math.round((processed / data.length) * 100);
                        showLoading(
                            `正在导入"${library.name}"...\n` +
                            `处理进度: ${processed}/${data.length} (${progress}%)\n` +
                            `新导入: ${importedCount} | 跳过: ${skippedCount}`
                        );
                        lastUpdate = index;
                    }
                });

                totalImported += importedCount;
                totalSkipped += skippedCount;
                console.log(`${library.name}: 总共${data.length}个单词，已存在${skippedCount}个，新导入${importedCount}个`);

                // 记录结果
                importResults.push({
                    name: library.name,
                    total: data.length,
                    imported: importedCount,
                    skipped: skippedCount
                });

                // 记录已导入的词库
                if (!importedLibraries.includes(libraryKey)) {
                    importedLibraries.push(libraryKey);
                }

            } catch (error) {
                if (error.name === 'AbortError') {
                    console.error(`导入${library.name}超时`);
                    showToast(`导入${library.name}超时，请稍后重试`);
                } else {
                    console.error(`导入${library.name}失败:`, error);
                    showToast(`导入${library.name}失败: ${error.message}`);
                }
            }
        }

        console.log(`导入完成: 总共导入${totalImported}个新单词，跳过${totalSkipped}个已存在单词`);

        // 保存词库到本地存储
        localStorage.setItem('vocabLibrary', JSON.stringify(vocabLibrary));

        // 保存已导入的词库列表
        saveImportedLibraries(importedLibraries);

        // 隐藏loading
        hideLoading();

        // 显示详细的导入结果
        let resultMessage = `成功导入 ${totalImported} 个新单词`;
        if (totalSkipped > 0) {
            resultMessage += `（跳过 ${totalSkipped} 个已存在单词）`;
        }
        showToast(resultMessage);
        console.log('导入完成，显示成功提示');

        closeVocabImportModal();

        // 刷新今日单词
        refreshWord().catch(err => {
            console.error('刷新单词失败:', err);
        });

    } catch (error) {
        console.error('导入过程发生错误:', error);
        hideLoading();
        showToast('导入失败，请重试');
    }
}

async function importVocabLibrary(libraryKey) {
    // 这个函数保留用于向后兼容，但不再使用
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

                // 获取音标
                const phonetic = item.phonetic || item.ph_am || item.ph_en || '';

                myVocab.push({
                    word: item.word,
                    phonetic: phonetic,
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
                    <div class="edit-container">
                        <textarea class="edit-textarea" id="home-edit-input-${entry.id}" rows="1" oninput="autoResizeTextarea(this)">${entry.note}</textarea>
                        <div class="edit-actions-inline">
                            <button class="btn-save" onclick="saveMoodEdit(${entry.id}, 'home')" title="提交"><i class="fas fa-check"></i></button>
                            <button class="btn-cancel" onclick="cancelMoodEdit(${entry.id}, 'home')" title="取消"><i class="fas fa-times"></i></button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="mood-actions">
                <div class="action-view">
                    <button class="btn-action-mood btn-edit-mood" onclick="editMood(${entry.id}, 'home')" title="编辑"><i class="fas fa-pen"></i></button>
                    <button class="btn-action-mood btn-delete-mood" onclick="deleteMood(${entry.id})" title="删除"><i class="fas fa-trash"></i></button>
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

    // 聚焦输入框并调整高度
    inputEl.focus();
    inputEl.select();
    autoResizeTextarea(inputEl);
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

// 自动调整textarea高度
function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 200);
    textarea.style.height = newHeight + 'px';
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
                    <div class="edit-container">
                        <textarea class="edit-textarea" id="modal-timeline-edit-input-${entry.id}" rows="1" oninput="autoResizeTextarea(this)">${entry.note}</textarea>
                        <div class="edit-actions-inline">
                            <button class="btn-save" onclick="saveMoodEdit(${entry.id}, 'modal-timeline')" title="提交"><i class="fas fa-check"></i></button>
                            <button class="btn-cancel" onclick="cancelMoodEdit(${entry.id}, 'modal-timeline')" title="取消"><i class="fas fa-times"></i></button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="mood-actions">
                <div class="action-view">
                    <button class="btn-action-mood btn-edit-mood" onclick="editMood(${entry.id}, 'modal-timeline')" title="编辑"><i class="fas fa-pen"></i></button>
                    <button class="btn-action-mood btn-delete-mood" onclick="deleteMood(${entry.id})" title="删除"><i class="fas fa-trash"></i></button>
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
                        <div class="edit-container">
                            <textarea class="edit-textarea" id="modal-day-edit-input-${entry.id}" rows="1" oninput="autoResizeTextarea(this)">${entry.note}</textarea>
                            <div class="edit-actions-inline">
                                <button class="btn-save" onclick="saveMoodEdit(${entry.id}, 'modal-day')" title="提交"><i class="fas fa-check"></i></button>
                                <button class="btn-cancel" onclick="cancelMoodEdit(${entry.id}, 'modal-day')" title="取消"><i class="fas fa-times"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="mood-actions">
                    <div class="action-view">
                        <button class="btn-action-mood btn-edit-mood" onclick="editMood(${entry.id}, 'modal-day')" title="编辑"><i class="fas fa-pen"></i></button>
                        <button class="btn-action-mood btn-delete-mood" onclick="deleteMood(${entry.id})" title="删除"><i class="fas fa-trash"></i></button>
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

// ==================== 记账功能 ====================

// 记账数据存储
let accountingData = {
    records: []
};

// 分类关键词映射（智能归类）
const categoryKeywords = {
    '餐饮': ['午餐', '晚餐', '早餐', '奶茶', '咖啡', '外卖', '聚餐', '吃饭', '餐厅', '食堂', '小吃', '零食', '饮料'],
    '交通': ['打车', '滴滴', '地铁', '公交', '油费', '停车', '高速', '出租车', '单车', '共享'],
    '购物': ['买菜', '衣服', '淘宝', '京东', '拼多多', '日用品', '超市', '商场', '网购', '快递'],
    '投资': ['股票', '基金', '理财', '债券', '期货', '其他'],
    '居住': ['房租', '水电', '物业', '燃气', '宽带', '话费', '网费', '维修', '装修'],
    '娱乐': ['电影', '游戏', 'KTV', '健身', '运动', '旅游', '票', '演出', '音乐', '视频'],
    '教育': ['书', '课程', '培训', '学费', '学习'],
    '工资': ['工资', '薪水', '奖金', '提成', '兼职'],
    '理财': ['理财', '基金', '股票', '收益', '利息']
};
let currentAccountingType = 'expense';

// 收入分类
const incomeCategories = ['工资', '理财', '其他收入'];

// 支出分类
const expenseCategories = ['餐饮', '交通', '购物', '娱乐', '居住', '投资', '教育', '其他'];

// 分类图标映射
const categoryIcons = {
    '餐饮': 'utensils', '交通': 'car', '购物': 'shopping-bag', '娱乐': 'gamepad-2',
    '居住': 'home', '投资': 'trending-up', '教育': 'book-open', '其他': 'more-horizontal',
    '工资': 'briefcase', '理财': 'trending-up', '其他收入': 'plus-circle'
};

let currentAccountingCategory = null;

// 初始化记账功能
function initAccounting() {
    loadAccountingData();
    updateAccountingSummary();
    renderRecentRecords();
    // 初始化分类按钮
    renderAccountingCategories('expense');
}

// 加载记账数据
function loadAccountingData() {
    const saved = localStorage.getItem('accountingData');
    if (saved) {
        accountingData = JSON.parse(saved);
    }
}

// 保存记账数据
function saveAccountingData() {
    localStorage.setItem('accountingData', JSON.stringify(accountingData));
}

// 智能解析用户输入
function parseAccountingInput(input) {
    const trimmed = input.trim();
    
    // 提取金额（支持多种格式：35元、¥35、35）
    const amountMatch = trimmed.match(/(\d+(?:\.\d+)?)/);
    if (!amountMatch) {
        return null;
    }
    const amount = parseFloat(amountMatch[1]);
    
    // 判断是收入还是支出
    let type = 'expense'; // 默认为支出
    if (trimmed.includes('收入') || trimmed.includes('工资') || trimmed.includes('奖金') || 
        trimmed.includes('理财') || trimmed.includes('兼职') || trimmed.includes('收益')) {
        type = 'income';
    }
    
    // 智能识别分类
    let category = '其他';
    if (type === 'income') {
        for (const cat of incomeCategories) {
            if (trimmed.includes(cat)) {
                category = cat;
                break;
            }
        }
    } else {
        for (const [cat, keywords] of Object.entries(categoryKeywords)) {
            if (keywords.some(kw => trimmed.includes(kw))) {
                category = cat;
                break;
            }
        }
    }
    
    // 提取备注（去掉金额和分类关键词）
    let note = trimmed
        .replace(amountMatch[0], '')
        .replace(/[元¥收入支出工资奖金理财兼职]/g, '')
        .trim();
    
    return {
        type,
        category,
        amount,
        note: note || category,
        date: new Date().toISOString(),
        id: Date.now()
    };
}

// 处理快速智能输入
function handleAccountingInput(event) {
    if (event.key === 'Enter') {
        addAccounting();
    }
}

// 添加记账（带确认弹窗）
let pendingAccounting = null;

function addAccounting() {
    const input = document.getElementById('accounting-input');
    const value = input.value.trim();
    
    if (!value) {
        showToast('请输入记账内容');
        return;
    }
    
    const parsed = parseAccountingInput(value);
    if (!parsed) {
        showToast('无法识别金额，请重新输入');
        return;
    }
    
    pendingAccounting = parsed;
    showAccountingConfirmModal(parsed);
    input.value = '';
}

// 显示记账确认弹窗
function showAccountingConfirmModal(data) {
    const modal = document.getElementById('accounting-confirm-modal');
    const typeSelect = document.getElementById('confirm-type');
    const categorySelect = document.getElementById('confirm-category');
    const amountInput = document.getElementById('confirm-amount');
    const noteInput = document.getElementById('confirm-note');
    
    // 填充数据
    typeSelect.value = data.type;
    amountInput.value = data.amount;
    noteInput.value = data.note;
    
    // 根据类型填充分类选项
    updateCategoryOptions(data.type, data.category);
    
    // 监听类型变化
    typeSelect.onchange = () => {
        updateCategoryOptions(typeSelect.value, categorySelect.value);
    };
    
    modal.classList.remove('hidden');
}

// 更新分类选项
function updateCategoryOptions(type, selectedCategory) {
    const categorySelect = document.getElementById('confirm-category');
    const categories = type === 'income' ? incomeCategories : expenseCategories;
    
    categorySelect.innerHTML = categories.map(cat => 
        '<option value="' + cat + '" ' + (cat === selectedCategory ? 'selected' : '') + '>' + cat + '</option>'
    ).join('');
}

// 关闭确认弹窗
function closeAccountingConfirmModal() {
    document.getElementById('accounting-confirm-modal').classList.add('hidden');
    pendingAccounting = null;
}

// 确认保存记账
function saveAccountingConfirm() {
    if (!pendingAccounting) return;
    
    const type = document.getElementById('confirm-type').value;
    const category = document.getElementById('confirm-category').value;
    const amount = parseFloat(document.getElementById('confirm-amount').value);
    const note = document.getElementById('confirm-note').value;
    
    if (amount <= 0) {
        showToast('金额必须大于0');
        return;
    }
    
    const record = {
        ...pendingAccounting,
        type,
        category,
        amount,
        note,
        id: Date.now()
    };
    
    accountingData.records.unshift(record);
    saveAccountingData();
    updateAccountingSummary();
    renderRecentRecords();
    
    closeAccountingConfirmModal();
    showToast('记账成功！');
}

// 选择记账类型
function selectAccountingType(type) {
    currentAccountingType = type;
    currentAccountingCategory = null;
    
    // 更新按钮状态
    document.querySelectorAll('.type-toggle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === type);
    });

    // 切换收入模式类到容器
    const accountingContainer = document.querySelector('.accounting-top-container');
    if (accountingContainer) {
        if (type === 'income') {
            accountingContainer.classList.add('income-mode');
        } else {
            accountingContainer.classList.remove('income-mode');
        }
    }    
    // 渲染分类按钮
    renderAccountingCategories(type);
    
    // 重置输入框
    const detailInput = document.getElementById('accounting-amount-input');
    detailInput.placeholder = '选择分类后输入金额';
    detailInput.value = '';
    document.getElementById('accounting-note-input').value = '';
}

// 渲染分类按钮
function renderAccountingCategories(type) {
    const container = document.getElementById('accounting-categories');
    const categories = type === 'income' ? incomeCategories : expenseCategories;
    
    container.innerHTML = categories.map(cat => 
        '<button class="category-item' + (currentAccountingCategory === cat ? ' active' : '') + '" ' +
        'onclick="selectAccountingCategory(\'' + cat + '\')">' +
        '<i data-lucide="' + (categoryIcons[cat] || 'circle') + '"></i>' +
        '<span>' + cat + '</span>' +
        '</button>'
    ).join('');
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}
function selectAccountingCategory(category) {
    currentAccountingCategory = category;
    
    // 更新按钮状态
    document.querySelectorAll('.category-item').forEach(btn => {
        btn.classList.toggle('active', btn.textContent === category);
    });
    
    // 更新输入框提示
    const placeholder = currentAccountingType === 'income' ? '输入收入金额' : '输入' + category + '金额';
    const detailInput = document.getElementById('accounting-amount-input');
    detailInput.placeholder = placeholder;
    detailInput.focus();
}

// 处理明细输入回车
function handleAccountingDetailInput(event) {
    if (event.key === 'Enter') {
        addAccountingRecord();
    }
}

// 添加记账记录
function addAccountingRecord() {
    if (!currentAccountingCategory) {
        showToast('请先选择分类');
        return;
    }
    
    const amountInput = document.getElementById('accounting-amount-input');
    const noteInput = document.getElementById('accounting-note-input');
    
    const amountStr = amountInput.value.trim();
    if (!amountStr) {
        showToast('请输入金额');
        return;
    }
    
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
        showToast('请输入有效的金额');
        return;
    }
    
    const note = noteInput.value.trim() || currentAccountingCategory;
    
    const record = {
        type: currentAccountingType,
        category: currentAccountingCategory,
        amount: amount,
        note: note,
        date: new Date().toISOString(),
        id: Date.now()
    };
    
    accountingData.records.unshift(record);
    saveAccountingData();
    updateAccountingSummary();
    renderRecentRecords();
    
    // 重置输入
    amountInput.value = '';
    noteInput.value = '';
    currentAccountingCategory = null;
    renderAccountingCategories(currentAccountingType);
    amountInput.placeholder = '选择分类后输入金额';
    
    showToast('记账成功！');
}

// 更新今日收支概览
function updateAccountingSummary() {
    const today = new Date().toDateString();
    const todayRecords = accountingData.records.filter(r => 
        new Date(r.date).toDateString() === today
    );
    
    const todayExpense = todayRecords
        .filter(r => r.type === 'expense')
        .reduce((sum, r) => sum + r.amount, 0);
    
    const todayExpenseEl = document.getElementById('today-expense-inline');
    if (todayExpenseEl) {
        todayExpenseEl.textContent = '¥' + todayExpense.toFixed(2);
    }
}
function renderRecentRecords() {
    const container = document.getElementById('accounting-records-list');
    const recentRecords = accountingData.records.slice(0, 5);
    
    if (recentRecords.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 20px;">暂无记账记录</p>';
        return;
    }
    
    container.innerHTML = recentRecords.map(record => {
        const recordDate = new Date(record.date);
        const timeStr = recordDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        const dateStr = recordDate.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
        const categoryIcon = categoryIcons[record.category] || 'circle';
        
        return '<div class="accounting-record ' + record.type + '">' +
            '<div class="accounting-record-left">' +
            '<div class="accounting-record-icon-wrapper">' +
            '<i data-lucide="' + categoryIcon + '"></i>' +
            '</div>' +
            '<div class="accounting-record-content">' +
            '<div class="accounting-record-category">' + record.category + '</div>' +
            '<div class="accounting-record-note">' + record.note + '</div>' +
            '</div>' +
            '</div>' +
            '<div class="accounting-record-right">' +
            '<div class="accounting-record-amount-time">' +
            '<span class="accounting-record-amount ' + record.type + '">' +
            (record.type === 'income' ? '+' : '-') + '¥' + record.amount.toFixed(2) +
            '</span>' +
            '<div class="accounting-record-time">' + dateStr + ' ' + timeStr + '</div>' +
            '</div>' +
            '<button class="accounting-record-edit" onclick="editAccountingRecord(' + record.id + ')">' +
            '<i class="fas fa-edit"></i>' +
            '</button>' +
            '<button class="accounting-record-delete" onclick="deleteAccountingRecord(' + record.id + ')">' +
            '<i class="fas fa-trash"></i>' +
            '</button>' +
            '</div>' +
            '</div>';
    }).join('');
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}
function deleteAccountingRecord(id) {
    showConfirmModal(
        '确认删除',
        '确定要删除这条记账记录吗？',
        () => {
            // 从数据中删除
            const index = accountingData.records.findIndex(r => r.id === id);
            if (index !== -1) {
                accountingData.records.splice(index, 1);
                saveAccountingData();
                
                // 更新UI
                updateAccountingSummary();
                renderRecentRecords();
                
                showToast('删除成功！');
            }
        }
    );
}

function editAccountingRecord(id) {
    const record = accountingData.records.find(r => r.id === id);
    if (!record) return;
    
    // 使用快速记账确认弹窗的结构
    const modal = document.getElementById('quick-accounting-modal');
    const timeInput = document.getElementById('qa-confirm-time');
    const categorySelect = document.getElementById('qa-confirm-category');
    const detailInput = document.getElementById('qa-confirm-detail');
    const amountInput = document.getElementById('qa-confirm-amount');
    
    // 设置为编辑模式
    window.editingAccountId = id;
    
    // 填充数据
    const recordDate = new Date(record.date);
    const year = recordDate.getFullYear();
    const month = String(recordDate.getMonth() + 1).padStart(2, '0');
    const day = String(recordDate.getDate()).padStart(2, '0');
    const hours = String(recordDate.getHours()).padStart(2, '0');
    const minutes = String(recordDate.getMinutes()).padStart(2, '0');
    timeInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    // 监听时间变化
    timeInput.onchange = function() {
        pendingQuickAccounting.customTime = this.value;
    };
    
    // 设置分类选项
    const categories = record.type === 'income' ? incomeCategories : expenseCategories;
    categorySelect.innerHTML = categories.map(cat => 
        `<option value="${cat}" ${cat === record.category ? 'selected' : ''}>${cat}</option>`
    ).join('');
    
    // 监听分类变化
    categorySelect.onchange = function() {
        pendingQuickAccounting.category = this.value;
    };
    
    // 设置类型按钮状态
    const typeExpenseBtn = document.getElementById('qa-confirm-type-expense');
    const typeIncomeBtn = document.getElementById('qa-confirm-type-income');
    
    if (record.type === 'expense') {
        typeExpenseBtn.classList.add('active');
        typeIncomeBtn.classList.remove('active');
    } else {
        typeIncomeBtn.classList.add('active');
        typeExpenseBtn.classList.remove('active');
    }
    
    // 设置明细和金额
    detailInput.value = record.note;
    amountInput.value = record.amount.toFixed(2);
    
    // 存储当前编辑状态
    pendingQuickAccounting = {
        type: record.type,
        category: record.category,
        detail: record.note,
        amount: record.amount,
        customTime: record.date
    };
    
    // 修改标题为"编辑记账"
    const titleElement = modal.querySelector('.modal-header h3');
    if (titleElement) {
        titleElement.textContent = '编辑记账';
    }
    
    // 修改确认按钮文本
    const confirmBtn = modal.querySelector('.btn-confirm');
    if (confirmBtn) {
        const btnSpan = confirmBtn.querySelector('span');
        if (btnSpan) {
            btnSpan.textContent = '保存修改';
        }
    }
    
    // 显示弹窗
    modal.classList.remove('hidden');
    modal.setAttribute('tabindex', '0');
    modal.focus();
    
    // 添加键盘事件监听
    modal.removeEventListener('keydown', handleEnterKeyForQuickAccounting);
    modal.addEventListener('keydown', handleEnterKeyForQuickAccounting);
    
    // 初始化图标
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}


// 显示记账统计弹窗
let currentStatsPeriod = 'day';

function showAccountingStats() {
    const modal = document.getElementById('accounting-modal');
    modal.classList.remove('hidden');
    switchAccountingPeriod('day');
}

// 关闭记账统计弹窗
function closeAccountingModal() {
    document.getElementById('accounting-modal').classList.add('hidden');
}

// 切换统计周期
function switchAccountingPeriod(period) {
    currentStatsPeriod = period;
    
    // 更新按钮状态
    document.querySelectorAll('.stats-period-switch .btn-icon').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.period === period);
    });
    
    // 渲染统计数据
    renderAccountingStats(period);
}

// 渲染统计数据
function renderAccountingStats(period) {
    const now = new Date();
    let startDate, endDate, title;
    
    switch (period) {
        case 'day':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            endDate = new Date(now.setHours(23, 59, 59, 999));
            title = '今日';
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            title = '本月';
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31);
            title = '本年';
            break;
    }
    
    const periodRecords = accountingData.records.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate >= startDate && recordDate <= endDate;
    });
    
    const totalIncome = periodRecords
        .filter(r => r.type === 'income')
        .reduce((sum, r) => sum + r.amount, 0);
    
    const totalExpense = periodRecords
        .filter(r => r.type === 'expense')
        .reduce((sum, r) => sum + r.amount, 0);
    
    const balance = totalIncome - totalExpense;
    
    // 渲染概览
    document.getElementById('accounting-stats-overview').innerHTML = 
        '<div class="accounting-stat-card total">' +
        '<span class="label">收支结余</span>' +
        '<span class="value">¥' + balance.toFixed(2) + '</span>' +
        '</div>' +
        '<div class="accounting-stat-card income">' +
        '<span class="label">总收入</span>' +
        '<span class="value">¥' + totalIncome.toFixed(2) + '</span>' +
        '</div>' +
        '<div class="accounting-stat-card expense">' +
        '<span class="label">总支出</span>' +
        '<span class="value">¥' + totalExpense.toFixed(2) + '</span>' +
        '</div>';
    
    // 按分类统计
    const categoryStats = {};
    periodRecords.forEach(r => {
        if (!categoryStats[r.category]) {
            categoryStats[r.category] = { type: r.type, amount: 0, records: [] };
        }
        categoryStats[r.category].amount += r.amount;
        categoryStats[r.category].records.push(r);
    });
    
    // 渲染分类详情
    const sortedCategories = Object.entries(categoryStats)
        .sort((a, b) => b[1].amount - a[1].amount);
    
    if (sortedCategories.length === 0) {
        document.getElementById('accounting-stats-detail').innerHTML = 
            '<p style="text-align: center; color: var(--text-light); padding: 40px;">暂无记录</p>';
    } else {
        document.getElementById('accounting-stats-detail').innerHTML = sortedCategories.map(([cat, data]) => 
            '<div class="accounting-stats-category">' +
            '<div class="accounting-stats-category-header">' +
            '<span class="accounting-stats-category-name">' + cat + '</span>' +
            '<span class="accounting-stats-category-amount ' + data.type + '">' +
            (data.type === 'income' ? '+' : '-') + '¥' + data.amount.toFixed(2) +
            '</span>' +
            '</div>' +
            '<div class="accounting-stats-category-records">' +
            data.records.slice(0, 3).map(r => 
                '<div style="display: flex; justify-content: space-between; font-size: 13px; color: var(--text-light); padding: 8px 0;">' +
                '<span>' + r.note + '</span>' +
                '<span>' + new Date(r.date).toLocaleDateString('zh-CN') + '</span>' +
                '</div>'
            ).join('') +
            '</div>' +
            '</div>'
        ).join('');
    }
}


// ==================== 热点新闻功能 ====================

// 新闻数据存储
let newsData = {
    tech: [],
    finance: [],
    general: [],
    international: [],
    lastFetch: null
};

// 新闻缓存过期时间（1小时）
const NEWS_CACHE_DURATION = 60 * 60 * 1000;

// 当前选中的新闻分类
let currentNewsCategory = 'tech';

// 初始化新闻功能
async function initNews() {
    await loadNewsData();
    await fetchAndRenderNews();
}

// 加载新闻数据（从缓存）
async function loadNewsData() {
    const saved = localStorage.getItem('newsData');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // 检查缓存版本，清除旧版本缓存
            if (!parsed.version || parsed.version < 2) {
                console.log('检测到旧版本新闻缓存，已清除');
                localStorage.removeItem('newsData');
                return false;
            }
            newsData = parsed;
            // 检查缓存是否过期
            if (newsData.lastFetch) {
                const age = Date.now() - new Date(newsData.lastFetch).getTime();
                if (age < NEWS_CACHE_DURATION) {
                    // 缓存未过期，直接使用
                    return true;
                }
            }
        } catch (error) {
            console.error('加载新闻缓存失败:', error);
        }
    }
    return false;
}

// 保存新闻数据到缓存
function saveNewsData() {
    newsData.lastFetch = new Date().toISOString();
    newsData.version = 2; // 设置缓存版本
    localStorage.setItem('newsData', JSON.stringify(newsData));
}

// 获取并渲染新闻
async function fetchAndRenderNews() {
    const loadingEl = document.getElementById('news-loading');
    const contentEl = document.getElementById('news-content');
    
    try {
        // 显示加载状态
        loadingEl.classList.remove('hidden');
        contentEl.classList.add('hidden');
        
        // 尝试从缓存加载
        const hasCache = await loadNewsData();
        if (hasCache && newsData[currentNewsCategory] && newsData[currentNewsCategory].length > 0) {
            renderCurrentNewsList();
            loadingEl.classList.add('hidden');
            contentEl.classList.remove('hidden');
            return;
        }
        
        // 只加载当前分类的新闻
        newsData[currentNewsCategory] = await fetchAllNews(currentNewsCategory);
        renderCurrentNewsList();
        saveNewsData();
        
        loadingEl.classList.add('hidden');
        contentEl.classList.remove('hidden');
        
    } catch (error) {
        console.error('获取新闻失败:', error);
        loadingEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> 加载失败，点击刷新重试';
        loadingEl.onclick = refreshNews;
        loadingEl.style.cursor = 'pointer';
    }
}

// 获取所有新闻
// 获取指定分类的新闻
async function fetchAllNews(category = 'tech') {
    // 如果没有配置API Key，使用模拟数据
    if (!JUHE_API_KEY) {
        console.warn('未配置聚合数据API Key，使用模拟数据');
        return generateMockNews(category, 8);
    }

    try {
        // 获取对应的type参数
        const newsType = NEWS_TYPE_MAP[category] || 'keji';
        
        // 使用聚合数据今日头条API获取新闻（通过CORS代理）
        const apiUrl = `${JUHE_BASE_URL}/index?key=${JUHE_API_KEY}&type=${newsType}`;
        const proxyUrl = `${CORS_PROXY}${encodeURIComponent(apiUrl)}`;
        const response = await fetch(proxyUrl);
        const data = await response.json();

        if (data.error_code === 0 && data.result && data.result.data) {
            const articles = data.result.data;
            
            // 调试：打印第一条数据结构
            console.log(`API返回数据示例 (${category}, type=${newsType}):`, articles[0]);
            
            const newsList = articles.slice(0, 8).map(item => ({
                title: item.title || '无标题',
                source: item.author_name || item.source || '聚合数据',
                url: item.url,
                time: formatNewsTime(item.date || item.ctime || item.pubdate || new Date().toISOString()),
                date: item.date || item.ctime || item.pubdate || new Date().toISOString()
            }));
            
            // 调试：查看原始date和处理后的time
            console.log(`时间处理示例 (${category}):`, {
                原始date: articles[0].date,
                显示time: newsList[0].time
            });

            console.log(`新闻数据获取成功（聚合数据API - ${category}, type=${newsType})`);
            return newsList;
        } else {
            console.warn('聚合数据API返回错误，使用模拟数据:', data);
            return generateMockNews(category, 8);
        }
    } catch (error) {
        console.error('获取新闻失败，使用模拟数据:', error);
        // 失败时使用模拟数据
        return generateMockNews(category, 8);
    }
}

// 格式化新闻时间
function formatNewsTime(timestamp) {
    // 去掉时区标识Z，避免时区转换
    const localTimestamp = timestamp ? timestamp.replace('Z', '').replace('z', '') : new Date().toISOString();
    
    const now = new Date();
    const newsTime = new Date(localTimestamp);
    const diff = Math.floor((now - newsTime) / 1000 / 60); // 分钟
    
    // 调试日志
    console.log('formatNewsTime - 原始:', timestamp, '处理后:', localTimestamp, 'diff:', diff);
    
    if (diff < 60) return `${diff}分钟前`;
    if (diff < 1440) return `${Math.floor(diff / 60)}小时前`;
    return `${Math.floor(diff / 1440)}天前`;
}

// 生成模拟新闻数据
function generateMockNews(category, count) {
    const newsTemplates = {
        tech: [
            { title: 'AI技术新突破：大模型应用场景持续扩展', source: '科技日报' },
            { title: '国产芯片获得重大进展，性能提升50%', source: '36氪' },
            { title: '新能源汽车销量创新高，智能驾驶成新焦点', source: '第一财经' },
            { title: '5G网络覆盖率突破90%，6G研发启动', source: '通信世界' },
            { title: '云计算市场规模持续扩大，企业数字化转型加速', source: 'TechWeb' },
            { title: '量子计算实验取得重大突破，计算速度提升千倍', source: '量子科技' },
            { title: '元宇宙概念持续升温，虚拟现实应用加速落地', source: 'VR产业网' },
            { title: '区块链技术在金融领域应用加速，数字货币监管完善', source: '区块链日报' }
        ],
        finance: [
            { title: '央行降准释放流动性，市场反应积极', source: '财联社' },
            { title: 'A股三大指数集体上涨，成交额破万亿', source: '东方财富' },
            { title: '人民币汇率保持稳定，外汇储备充足', source: '新浪财经' },
            { title: '房地产市场迎来政策利好，多地出台新措施', source: '证券时报' },
            { title: '数字人民币试点扩容，应用场景不断丰富', source: '金融界' },
            { title: '债券市场持续活跃，绿色债券发行量创新高', source: '中国证券报' },
            { title: '保险行业数字化转型加快，智能投保成趋势', source: '保观' },
            { title: '私募基金规模持续增长，量化投资策略受追捧', source: '私募排排网' }
        ],
        general: [
            { title: '全国两会召开，多项民生政策引关注', source: '人民日报' },
            { title: '教育改革深化，职业教育迎来新发展', source: '新华网' },
            { title: '医疗卫生体系建设提速，基层医疗服务改善', source: '健康报' },
            { title: '生态文明建设取得新成效，绿色发展理念深入人心', source: '光明日报' },
            { title: '文化事业繁荣发展，优秀作品不断涌现', source: '中国文化报' },
            { title: '体育事业发展迅速，全民健身活动广泛开展', source: '体育总局' },
            { title: '科技创新推动产业升级，新兴业态不断涌现', source: '经济日报' },
            { title: '国际合作不断深化，共建一带一路倡议取得新进展', source: '新华社' }
        ]
    };
    
    const templates = newsTemplates[category] || newsTemplates.general;
    const now = new Date();
    
    return templates.slice(0, count).map((item, index) => ({
        title: item.title,
        source: item.source,
        time: Math.floor(index / 2) + '小时前',
        date: new Date(now.getTime() - index * 30 * 60 * 1000).toISOString()
    }));
}

// 切换新闻分类
async function switchNewsCategory(category) {
    currentNewsCategory = category;
    
    // 更新标签状态
    document.querySelectorAll('.news-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.category === category);
    });
    
    // 显示加载状态
    const loadingEl = document.getElementById('news-loading');
    const contentEl = document.getElementById('news-content');
    loadingEl.classList.remove('hidden');
    contentEl.classList.add('hidden');
    
    try {
        // 如果该分类还没加载过，则获取数据
        if (!newsData[category] || newsData[category].length === 0) {
            newsData[category] = await fetchAllNews(category);
            saveNewsData();
        }
        
        // 重新渲染新闻列表
        renderCurrentNewsList();
        
        loadingEl.classList.add('hidden');
        contentEl.classList.remove('hidden');
    } catch (error) {
        console.error('切换新闻分类失败:', error);
        loadingEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> 加载失败，点击刷新重试';
        loadingEl.onclick = () => switchNewsCategory(category);
        loadingEl.style.cursor = 'pointer';
    }
}

// 渲染当前选中分类的新闻列表
function renderCurrentNewsList() {
    const container = document.getElementById('news-list');
    const newsList = newsData[currentNewsCategory] || [];
    
    if (!newsList || newsList.length === 0) {
        container.innerHTML = '<li style="text-align: center; color: var(--text-light); padding: 20px;">暂无新闻</li>';
        return;
    }
    
    container.innerHTML = newsList.slice(0, 8).map((item, index) => 
        '<li class="news-item" onclick="openNewsLink(' + index + ')">' +
        '<div class="news-item-title">' + item.title + '</div>' +
        '<div class="news-item-meta">' +
        '<span class="news-item-source">' + item.source + '</span>' +
        '<span class="news-item-time">' + item.time + '</span>' +
        '</div>' +
        '</li>'
    ).join('');
}

// 打开新闻链接（在新标签页）
function openNewsLink(index) {
    const newsList = newsData[currentNewsCategory] || [];
    const item = newsList[index];
    
    if (item && item.url) {
        // 使用API返回的真实URL
        window.open(item.url, '_blank');
    } else {
        // 如果没有URL，跳转到搜索页面
        const searchUrl = 'https://www.baidu.com/s?wd=' + encodeURIComponent(item.title);
        window.open(searchUrl, '_blank');
    }
}

// 刷新新闻
async function refreshNews() {
    const loadingEl = document.getElementById('news-loading');
    loadingEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 加载中...';
    loadingEl.style.cursor = 'default';
    loadingEl.onclick = null;
    
    // 清除缓存
    newsData = {
        tech: [],
        finance: [],
        general: [],
        lastFetch: null
    };
    localStorage.removeItem('newsData');
    
    await fetchAndRenderNews();
}


// ==================== 记账统计图表功能 ====================

// 图表实例
let expensePieChart = null;
let incomeExpenseBarChart = null;

// 打开记账统计弹窗
function showAccountingStats() {
    const modal = document.getElementById('accounting-stats-modal');
    modal.classList.remove('hidden');
    currentStatsPeriod = 'day';
    updateStatsButtons();
    renderAccountingStats();
}

// 关闭记账统计弹窗
function closeAccountingStats() {
    document.getElementById('accounting-stats-modal').classList.add('hidden');
    // 销毁图表实例
    if (expensePieChart) {
        expensePieChart.destroy();
        expensePieChart = null;
    }
    if (incomeExpenseBarChart) {
        incomeExpenseBarChart.destroy();
        incomeExpenseBarChart = null;
    }
}

// 切换统计周期
function switchStatsPeriod(period) {
    currentStatsPeriod = period;
    updateStatsButtons();
    renderAccountingStats();
}

// 更新统计周期按钮状态
function updateStatsButtons() {
    document.querySelectorAll('.stats-period-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.period === currentStatsPeriod);
    });
}

// 渲染统计数据
function renderAccountingStats() {
    const now = new Date();
    let startDate, endDate;
    
    switch (currentStatsPeriod) {
        case 'day':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
            break;
    }
    
    // 筛选当前周期的记录
    const periodRecords = accountingData.records.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate >= startDate && recordDate <= endDate;
    });
    
    // 计算总收入和总支出
    const totalIncome = periodRecords
        .filter(r => r.type === 'income')
        .reduce((sum, r) => sum + r.amount, 0);
    
    const totalExpense = periodRecords
        .filter(r => r.type === 'expense')
        .reduce((sum, r) => sum + r.amount, 0);
    
    const balance = totalIncome - totalExpense;
    
    // 更新概览卡片
    document.getElementById('stats-balance').textContent = '¥' + balance.toFixed(2);
    document.getElementById('stats-total-income').textContent = '¥' + totalIncome.toFixed(2);
    document.getElementById('stats-total-expense').textContent = '¥' + totalExpense.toFixed(2);
    
    // 渲染图表
    renderCharts(periodRecords);
    
    // 渲染分类统计列表
    renderCategoryList(periodRecords);
    
    // 渲染详细记录列表
    renderRecordsList(periodRecords);
}

// 渲染图表
function renderCharts(records) {
    const expenseRecords = records.filter(r => r.type === 'expense');
    const incomeRecords = records.filter(r => r.type === 'income');
    
    // 按分类统计支出
    const categoryStats = {};
    expenseRecords.forEach(r => {
        if (!categoryStats[r.category]) {
            categoryStats[r.category] = 0;
        }
        categoryStats[r.category] += r.amount;
    });
    
    // 渲染支出饼图
    renderPieChart(categoryStats);
    
    // 渲染收支柱状图
    const totalIncome = incomeRecords.reduce((sum, r) => sum + r.amount, 0);
    const totalExpense = expenseRecords.reduce((sum, r) => sum + r.amount, 0);
    renderBarChart(totalIncome, totalExpense);
}

// 渲染支出饼图
function renderPieChart(categoryStats) {
    const ctx = document.getElementById('expense-pie-chart').getContext('2d');
    
    // 销毁旧图表
    if (expensePieChart) {
        expensePieChart.destroy();
    }
    
    const categories = Object.keys(categoryStats);
    const amounts = Object.values(categoryStats);
    
    if (categories.length === 0) {
        // 如果没有数据，显示空状态
        document.getElementById('pie-chart-legend').innerHTML = 
            '<p style="color: var(--text-light); text-align: center; width: 100%;">暂无支出数据</p>';
        expensePieChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['无数据'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['rgba(163, 177, 198, 0.3)'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: false
                    }
                }
            }
        });
        return;
    }
    
    // 定义颜色方案
    const colors = [
        '#e74c3c', '#e67e22', '#f39c12', '#27ae60', '#3498db',
        '#9b59b6', '#1abc9c', '#34495e', '#16a085', '#d35400'
    ];
    
    expensePieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: amounts,
                backgroundColor: colors.slice(0, categories.length),
                borderWidth: 2,
                borderColor: '#e0e5ec'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return label + ': ¥' + value.toFixed(2) + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
    
    // 渲染自定义图例
    const legendContainer = document.getElementById('pie-chart-legend');
    legendContainer.innerHTML = categories.map((cat, index) => {
        const amount = categoryStats[cat];
        const total = amounts.reduce((a, b) => a + b, 0);
        const percentage = ((amount / total) * 100).toFixed(1);
        return `
            <div class="chart-legend-item">
                <div class="chart-legend-color" style="background-color: ${colors[index]}"></div>
                <span>${cat}: ¥${amount.toFixed(2)} (${percentage}%)</span>
            </div>
        `;
    }).join('');
}

// 渲染收支柱状图
function renderBarChart(income, expense) {
    const ctx = document.getElementById('income-expense-bar-chart').getContext('2d');
    
    // 销毁旧图表
    if (incomeExpenseBarChart) {
        incomeExpenseBarChart.destroy();
    }
    
    incomeExpenseBarChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['收入', '支出'],
            datasets: [{
                data: [income, expense],
                backgroundColor: [
                    'rgba(39, 174, 96, 0.8)',
                    'rgba(231, 76, 60, 0.8)'
                ],
                borderColor: [
                    '#27ae60',
                    '#e74c3c'
                ],
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed.y || 0;
                            return label + ': ¥' + value.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '¥' + value;
                        }
                    },
                    grid: {
                        color: 'rgba(163, 177, 198, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// 渲染分类统计列表
function renderCategoryList(records) {
    const categoryList = document.getElementById('stats-category-list');
    
    if (records.length === 0) {
        categoryList.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 20px;">暂无记录</p>';
        return;
    }
    
    // 按分类统计
    const categoryStats = {};
    records.forEach(r => {
        if (!categoryStats[r.category]) {
            categoryStats[r.category] = {
                type: r.type,
                amount: 0,
                count: 0
            };
        }
        categoryStats[r.category].amount += r.amount;
        categoryStats[r.category].count += 1;
    });
    
    // 排序
    const sortedCategories = Object.entries(categoryStats)
        .sort((a, b) => b[1].amount - a[1].amount);
    
    categoryList.innerHTML = sortedCategories.map(([category, data]) => `
        <div class="stats-category-item">
            <div style="flex: 1;">
                <div class="stats-category-name">${category}</div>
                <div class="stats-category-count">${data.count} 笔</div>
            </div>
            <div class="stats-category-amount ${data.type}">
                ${data.type === 'income' ? '+' : '-'}¥${data.amount.toFixed(2)}
            </div>
        </div>
    `).join('');
}

// 渲染详细记录列表
function renderRecordsList(records) {
    const recordsList = document.getElementById('stats-records-list');
    
    if (records.length === 0) {
        recordsList.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 20px;">暂无记录</p>';
        return;
    }
    
    // 按日期倒序排序
    const sortedRecords = [...records].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    recordsList.innerHTML = sortedRecords.map(r => `
        <div class="stats-record-item">
            <div class="record-date">${new Date(r.date).toLocaleDateString('zh-CN')}</div>
            <div class="record-category">${r.category}</div>
            <div class="record-note">${r.note}</div>
            <div class="record-amount ${r.type}">
                ${r.type === 'income' ? '+' : '-'}¥${r.amount.toFixed(2)}
            </div>
        </div>
    `).join('');
}

// ==================== 快速记账相关变量 ====================
let pendingQuickAccounting = null;

// 解析快速记账输入
function parseQuickAccountingInput(text) {
    text = text.trim();
    if (!text) return null;
    
    const amountMatch = text.match(/(\d+\.?\d*)/);
    if (!amountMatch) return null;
    
    const amount = parseFloat(amountMatch[1]);
    if (isNaN(amount) || amount <= 0) return null;
    
    let detail = text.replace(amountMatch[1], '').trim();
    if (!detail) detail = '其他';
    
    let type = 'expense';
    const incomeKeywords = ['工资', '奖金', '理财', '收益', '退款', '报销'];
    for (const keyword of incomeKeywords) {
        if (text.includes(keyword)) {
            type = 'income';
            break;
        }
    }
    
    let category = null;
    const categories = type === 'income' ? incomeCategories : expenseCategories;
    
    for (const [cat, keywords] of Object.entries(categoryKeywords)) {
        if (categories.includes(cat)) {
            for (const keyword of keywords) {
                if (detail.includes(keyword)) {
                    category = cat; break;
                }
            }
            if (category) break;
        }
    }
    
    if (!category) {
        category = categories[0];
    }
    
    return {
        type,
        category,
        detail,
        amount,
        customTime: null
    };
}

// 处理快速记账输入回车
function handleAccountingQuickInput(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        addQuickAccounting();
    }
}

// 添加快速记账
function addQuickAccounting() {
    const input = document.getElementById('accounting-quick-input');
    const text = input.value.trim();
    
    if (!text) return;
    
    const parsed = parseQuickAccountingInput(text);
    if (!parsed) {
        alert('请输入有效的记账内容，例如：午餐35');
        return;
    }
    
    showQuickAccountingModal(parsed);
    input.value = '';
}

// 显示快速记账确认弹窗
function showQuickAccountingModal(data) {
    const modal = document.getElementById('quick-accounting-modal');
    const timeInput = document.getElementById('qa-confirm-time');
    const categorySelect = document.getElementById('qa-confirm-category');
    const detailInput = document.getElementById('qa-confirm-detail');
    const amountInput = document.getElementById('qa-confirm-amount');
    
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    timeInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    timeInput.onchange = function() {
        if (pendingQuickAccounting) {
            pendingQuickAccounting.customTime = this.value;
        }
    };
    
    const categories = data.type === 'income' ? incomeCategories : expenseCategories;
    categorySelect.innerHTML = categories.map(cat => 
        `<option value="${cat}" ${cat === data.category ? 'selected' : ''}>${cat}</option>`
    ).join('');
    
    categorySelect.onchange = function() {
        if (pendingQuickAccounting) {
            pendingQuickAccounting.category = this.value;
        }
    };
    
    const typeExpenseBtn = document.getElementById('qa-confirm-type-expense');
    const typeIncomeBtn = document.getElementById('qa-confirm-type-income');
    
    if (data.type === 'expense') {
        typeExpenseBtn.classList.add('active');
        typeIncomeBtn.classList.remove('active');
    } else {
        typeIncomeBtn.classList.add('active');
        typeExpenseBtn.classList.remove('active');
    }
    
    detailInput.value = data.detail;
    amountInput.value = data.amount.toFixed(2);
    
    pendingQuickAccounting = {
        ...data
    };
    
    const titleElement = modal.querySelector('.modal-header h3');
    if (titleElement) {
        titleElement.textContent = '确认记账';
    }
    
    const confirmBtn = modal.querySelector('.btn-confirm');
    if (confirmBtn) {
        const btnSpan = confirmBtn.querySelector('span');
        if (btnSpan) {
            btnSpan.textContent = '确认添加';
        }
    }
    modal.classList.remove('hidden');
    modal.setAttribute('tabindex', '0');
    modal.focus();
    
    // 添加键盘事件监听 - 支持Enter提交
    modal.removeEventListener('keydown', handleEnterKeyForQuickAccounting);
    modal.addEventListener('keydown', handleEnterKeyForQuickAccounting);
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// 关闭快速记账确认弹窗
function closeQuickAccountingModal() {
    const modal = document.getElementById('quick-accounting-modal');
    modal.classList.add('hidden');
    pendingQuickAccounting = null;
    window.editingAccountId = null;
}

// 处理快速记账弹窗中的回车键
function handleEnterKeyForQuickAccounting(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        confirmQuickAccounting();
    }
}

// 选择快速记账弹窗中的类型
function selectQuickConfirmType(type) {
    const typeExpenseBtn = document.getElementById('qa-confirm-type-expense');
    const typeIncomeBtn = document.getElementById('qa-confirm-type-income');
    
    if (type === 'expense') {
        typeExpenseBtn.classList.add('active');
        typeIncomeBtn.classList.remove('active');
    } else {
        typeIncomeBtn.classList.add('active');
        typeExpenseBtn.classList.remove('active');
    }
    
    const categorySelect = document.getElementById('qa-confirm-category');
    const categories = type === 'income' ? incomeCategories : expenseCategories;
    const currentCategory = categorySelect.value;
    
    categorySelect.innerHTML = categories.map(cat => 
        `<option value="${cat}">${cat}</option>`
    ).join('');
    
    if (categories.includes(currentCategory)) {
        categorySelect.value = currentCategory;
    }
    
    if (pendingQuickAccounting) {
        pendingQuickAccounting.type = type;
        pendingQuickAccounting.category = categorySelect.value;
    }
}

// 确认快速记账
function confirmQuickAccounting() {
    const timeInput = document.getElementById('qa-confirm-time');
    const categorySelect = document.getElementById('qa-confirm-category');
    const detailInput = document.getElementById('qa-confirm-detail');
    const amountInput = document.getElementById('qa-confirm-amount');
    
    const amount = parseFloat(amountInput.value);
    if (isNaN(amount) || amount <= 0) {
        alert('请输入有效的金额');
        return;
    }
    
    if (window.editingAccountId) {
        // 编辑模式
        const record = accountingData.records.find(r => r.id === window.editingAccountId);
        if (record) {
            const typeExpenseBtn = document.getElementById('qa-confirm-type-expense');
            const isExpense = typeExpenseBtn.classList.contains('active');
            
            record.type = isExpense ? 'expense' : 'income';
            record.category = categorySelect.value;
            record.note = detailInput.value.trim() || '无备注';
            record.amount = amount;
            record.date = timeInput.value ? new Date(timeInput.value).toISOString() : new Date().toISOString();
            
            saveAccountingData();
            updateAccountingSummary();
            renderRecentRecords();
            
            closeQuickAccountingModal();
            showToast('修改成功！');
        }
    } else {
        // 添加模式
        if (!pendingQuickAccounting) return;
        
        const record = {
            id: Date.now(),
            type: pendingQuickAccounting.type,
            category: categorySelect.value,
            note: detailInput.value.trim() || '无备注',
            amount: amount,
            date: timeInput.value ? new Date(timeInput.value).toISOString() : new Date().toISOString()
        };
        
        accountingData.records.unshift(record);
        saveAccountingData();
        
        updateAccountingSummary();
        renderRecentRecords();
        
        closeQuickAccountingModal();
        showToast('记账成功！');
    }
}

// 显示通知提示
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #27ae60;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 2000);
}

// 确保收入分类选中时显示绿色背景
function ensureIncomeCategoryGreenBackground() {
    const container = document.getElementById('accounting-categories');
    if (!container) return;
    
    const activeBtns = container.querySelectorAll('.category-item.active');
    activeBtns.forEach(btn => {
        const btnText = btn.textContent || btn.innerText;
        if (container.classList.contains('income-mode')) {
            btn.style.setProperty('background', '#27ae60', 'important');
            btn.style.setProperty('background-color', '#27ae60', 'important');
            btn.style.setProperty('color', 'white', 'important');
        }
    });
}

// 使用MutationObserver监听DOM变化
const observer = new MutationObserver(() => {
    ensureIncomeCategoryGreenBackground();
});

// 开始观察整个document
observer.observe(document.body, {
    childList: true,
    subtree: true
});

// 页面加载完成后立即执行一次
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureIncomeCategoryGreenBackground);
} else {
    ensureIncomeCategoryGreenBackground();
}

// 定时检查（每100ms）
setInterval(ensureIncomeCategoryGreenBackground, 100);

// 强制修复收入分类背景色 - 调试版本
function forceFixIncomeCategoryBackground() {
    const container = document.getElementById('accounting-categories');
    if (!container) {
        console.log('Container not found!');
        return;
    }
    
    console.log('Container classes:', container.classList.toString());
    console.log('Has income-mode:', container.classList.contains('income-mode'));
    
    const activeBtns = container.querySelectorAll('.category-item.active');
    console.log('Active buttons found:', activeBtns.length);
    
    activeBtns.forEach((btn, index) => {
        console.log(`Button ${index} classes:`, btn.classList.toString());
        console.log(`Button ${index} current background:`, window.getComputedStyle(btn).backgroundColor);
        
        if (container.classList.contains('income-mode')) {
            console.log(`Setting button ${index} to green...`);
            btn.style.setProperty('background', '#27ae60', 'important');
            btn.style.setProperty('background-color', '#27ae60', 'important');
            btn.style.background = '#27ae60';
            btn.style.backgroundColor = '#27ae60';
            console.log(`Button ${index} new background:`, window.getComputedStyle(btn).backgroundColor);
        }
    });
}

// 暴露到全局作用域以便在控制台调用
window.debugIncomeCategory = forceFixIncomeCategoryBackground;
window.fixIncomeCategory = forceFixIncomeCategoryBackground;

console.log('Debug function loaded! Call window.fixIncomeCategory() in console to test');

const HD2026 = {
    '2026-01-01':{n:'元旦',r:'01-01至01-03'},'2026-01-02':{n:'元旦',r:'01-01至01-03'},'2026-01-03':{n:'元旦',r:'01-01至01-03'},
    '2026-02-15':{n:'春节',r:'02-15至02-21'},'2026-02-16':{n:'春节',r:'02-15至02-21'},'2026-02-17':{n:'春节',r:'02-15至02-21'},'2026-02-18':{n:'春节',r:'02-15至02-21'},'2026-02-19':{n:'春节',r:'02-15至02-21'},'2026-02-20':{n:'春节',r:'02-15至02-21'},'2026-02-21':{n:'春节',r:'02-15至02-21'},
    '2026-04-04':{n:'清明',r:'04-04至04-06'},'2026-04-05':{n:'清明',r:'04-04至04-06'},'2026-04-06':{n:'清明',r:'04-04至04-06'},
    '2026-05-01':{n:'劳动节',r:'05-01至05-05'},'2026-05-02':{n:'劳动节',r:'05-01至05-05'},'2026-05-03':{n:'劳动节',r:'05-01至05-05'},'2026-05-04':{n:'劳动节',r:'05-01至05-05'},'2026-05-05':{n:'劳动节',r:'05-01至05-05'},
    '2026-06-19':{n:'端午',r:'06-19至06-21'},'2026-06-20':{n:'端午',r:'06-19至06-21'},'2026-06-21':{n:'端午',r:'06-19至06-21'},
    '2026-09-25':{n:'中秋',r:'09-25至09-27'},'2026-09-26':{n:'中秋',r:'09-25至09-27'},'2026-09-27':{n:'中秋',r:'09-25至09-27'},
    '2026-10-01':{n:'国庆节',r:'10-01至10-07'},'2026-10-02':{n:'国庆节',r:'10-01至10-07'},'2026-10-03':{n:'国庆节',r:'10-01至10-07'},'2026-10-04':{n:'国庆节',r:'10-01至10-07'},'2026-10-05':{n:'国庆节',r:'10-01至10-07'},'2026-10-06':{n:'国庆节',r:'10-01至10-07'},'2026-10-07':{n:'国庆节',r:'10-01至10-07'}
};
const MD2026 = {'2026-01-04':'元旦补班','2026-02-14':'春节补班','2026-02-22':'春节补班','2026-04-12':'清明补班','2026-05-09':'五一补班','2026-09-27':'中秋补班','2026-10-10':'国庆补班'};
let curHMonth = new Date();

function openHolidayModal(){
    console.log('[DEBUG] openHolidayModal called');
    const m=document.getElementById('holiday-calendar-modal');
    if(m){
        console.log('[DEBUG] Modal found, opening...');
        m.classList.remove('hidden');
        m.classList.add('active');
        curHMonth=new Date();
        RHCal();
//         // 自动显示今天的放假信息
    } else {
        console.log('[DEBUG] Modal not found!');
    }
}
function closeHolidayModal(){
    const m=document.getElementById('holiday-calendar-modal');
    if(m){
        m.classList.add('hidden');
        m.classList.remove('active');
    }
}
function changeHolidayMonth(d){
    curHMonth.setMonth(curHMonth.getMonth()+d);
    RHCal();
}
function RHCal(){
    console.log('[DEBUG] RHCal called');
    const g=document.getElementById('holiday-calendar');
    const l=document.getElementById('holiday-calendar-month');
    if(!g)return;
    const y=curHMonth.getFullYear();
    const mo=curHMonth.getMonth();
    if(l)l.textContent=y+'年'+(mo+1)+'月';
    const fd=new Date(y,mo,1);
    const ld=new Date(y,mo+1,0);
    const sd=fd.getDay();
    const days=ld.getDate();
    
    g.innerHTML='';
    
    // 生成空白格子
    for(let i=0;i<sd;i++){
        const div=document.createElement('div');
        div.className='holiday-day empty';
        div.style.cssText='width: 90px; height: 65px; display: flex; flex-direction: column; justify-content: center; align-items: center; border-radius: 10px; font-size: 12px; background: transparent; box-shadow: none; cursor: default;';
        g.appendChild(div);
    }
    
    // 生成日期格子
    for(let d=1;d<=days;d++){
        const ds=y+'-'+String(mo+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
        const hd=HD2026[ds];
        const md=MD2026[ds];
        const iw=new Date(y,mo,d).getDay()===0||new Date(y,mo,d).getDay()===6;
        
        const div=document.createElement('div');
        let cls='holiday-day';
        if(hd){
            cls+=' holiday';
        }else if(md){
            cls+=' makeup';
        }else if(iw){
            cls+=' weekend';
        }
        div.className=cls;
        
        // 基础样式
        let styles='width: 90px; height: 65px; display: flex; flex-direction: column; justify-content: center; align-items: center; border-radius: 10px; font-size: 12px; cursor: pointer; position: relative; background: var(--bg-color); padding: 4px; box-shadow: var(--neu-shadow-sm); transition: all 0.3s ease;';
        
        // 假期/补班背景色
        if(hd){
            styles+=' background: rgba(72, 187, 120, 0.2);';
        }else if(md){
            styles+=' background: rgba(236, 201, 75, 0.2);';
        }
        
        div.style.cssText=styles;
        
        // 日期数字
        const numSpan=document.createElement('span');
        numSpan.className='holiday-day-num';
        numSpan.style.cssText='font-weight: bold; z-index: 1; position: relative;';
        numSpan.textContent=d;
        div.appendChild(numSpan);
        
        // 假期/补班标签
        if(hd||md){
            const label=document.createElement('span');
            label.className='holiday-day-label';
            label.style.cssText='font-size: 12px; padding: 2px 4px; border-radius: 3px; margin-top: 2px; font-weight: 600; z-index: 1; position: relative;';
            label.style.background=hd ? 'rgba(72, 187, 120, 0.3)' : 'rgba(236, 201, 75, 0.3)';
            label.textContent=hd?'假':'班';
            div.appendChild(label);
        }
        
        g.appendChild(div);
    }
    showMonthHolidays();
}
function showHInfo(ds){
    console.log('[DEBUG] showHInfo called for:', ds);
    const d=new Date(ds);
    const wd=['周日','周一','周二','周三','周四','周五','周六'][d.getDay()];
    const hd=HD2026[ds];
    const md=MD2026[ds];
    const iw=d.getDay()===0||d.getDay()===6;
    
    const infoDiv=document.getElementById('holiday-day-info');
    console.log('[DEBUG] infoDiv found:', !!infoDiv);
    if(!infoDiv)return;
    
    let html=`<div class="info-date">${ds} ${wd}</div>`;
    html+='<div class="info-content">';
    
    if(hd){
        html+=`<div class="info-holiday">${hd.n}</div>`;
        html+=`<div>放假时间：${hd.r}</div>`;
    }else if(md){
        html+=`<div class="info-makeup">${md}</div>`;
    }else if(iw){
        html+='<div class="info-weekend">正常休息</div>';
    }else{
        html+='<div class="info-workday">正常上班</div>';
    }
    
    html+='</div>';
    console.log('[DEBUG] Setting innerHTML');
    infoDiv.innerHTML=html;
}
function showMonthHolidays(){
    console.log('[DEBUG] showMonthHolidays called');
    const y=curHMonth.getFullYear();
    const mo=curHMonth.getMonth();
    const ld=new Date(y,mo+1,0).getDate();
    
    // 收集当月所有假期（去重，按假期名称分组）
    const holidays=new Map();
    for(let d=1;d<=ld;d++){
        const ds=y+'-'+String(mo+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
        const hd=HD2026[ds];
        if(hd && !holidays.has(hd.n)){
            holidays.set(hd.n, hd.r);
        }
    }
    
    // 收集当月所有补班日期
    const makeupDays=[];
    for(let d=1;d<=ld;d++){
        const ds=y+'-'+String(mo+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
        const md=MD2026[ds];
        if(md){
            const monthDay = (mo+1)+'月'+d+'日';
            makeupDays.push({date: monthDay, name: md});
        }
    }
    
    const infoDiv=document.getElementById('holiday-day-info');
    if(!infoDiv)return;
    
    console.log('[DEBUG] Found holidays:', holidays.size, 'makeup days:', makeupDays.length);
    
    let html='';
    if(holidays.size>0 || makeupDays.length>0){
        html='<div style="margin-top:20px;">';
        for(const [name, range] of holidays){
            html+='<div style="padding:10px 12px;margin:3px 0;font-size:14px;color:#718096;">';
            html+='<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#48bb78;margin-right:8px;"></span>';
            html+='<span style="font-weight:700;color:#718096;">'+name+'</span>：'+range;
            html+='</div>';
        }
        for(const md of makeupDays){
            html+='<div style="padding:10px 12px;margin:3px 0;font-size:14px;color:#718096;">';
            html+='<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#ecb94b;margin-right:8px;"></span>';
            html+='<span style="font-weight:700;color:#718096;">'+md.name+'</span>：'+md.date;
            html+='</div>';
        }
        html+='</div>';
    }else{
        html='<div style="font-size:14px;color:var(--text-light);padding:30px;text-align:center;margin-top:20px;">😢 本月无放假安排</div>';
    }
    
    console.log('[DEBUG] Setting month holidays HTML');
    infoDiv.innerHTML=html;
}
