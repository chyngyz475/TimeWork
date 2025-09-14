// Профиль пользователя и статистика
let userProfile = {
    name: 'Пользователь',
    email: 'user@example.com',
    level: 1,
    experience: 0,
    totalSessions: 0,
    totalHours: 0,
    totalTasks: 0,
    currentStreak: 0,
    settings: {
        sounds: true,
        notifications: true,
        sync: false
    }
};

let weeklyStats = {
    focusHours: 0,
    completedTasks: 0,
    sessions: []
};

let garden = {
    trees: [],
    level: 1,
    totalTrees: 0
};

// Инициализация профиля
document.addEventListener('DOMContentLoaded', function() {
    loadUserProfile();
    loadWeeklyStats();
    loadGarden();
    updateProfileDisplay();
    updateWeeklyStats();
    updateGarden();
    setupEventListeners();
    generateAIMessage();
});

// Загрузка профиля пользователя
function loadUserProfile() {
    const saved = localStorage.getItem('userProfile');
    if (saved) {
        userProfile = { ...userProfile, ...JSON.parse(saved) };
    }
    
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
        userProfile.settings = { ...userProfile.settings, ...JSON.parse(savedSettings) };
    }
}

// Сохранение профиля
function saveUserProfile() {
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    localStorage.setItem('userSettings', JSON.stringify(userProfile.settings));
}

// Загрузка недельной статистики
function loadWeeklyStats() {
    const saved = localStorage.getItem('weeklyStats');
    if (saved) {
        weeklyStats = JSON.parse(saved);
    }
    
    // Обновляем статистику на основе истории сессий
    updateWeeklyStatsFromHistory();
}

// Обновление статистики из истории сессий
function updateWeeklyStatsFromHistory() {
    const sessionHistory = JSON.parse(localStorage.getItem('sessionHistory') || '[]');
    const taskHistory = JSON.parse(localStorage.getItem('taskHistory') || '[]');
    
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Фильтруем сессии за последнюю неделю
    const weekSessions = sessionHistory.filter(session => 
        new Date(session.startTime) >= weekAgo
    );
    
    // Подсчитываем время в фокусе (только работа)
    const focusTime = weekSessions
        .filter(s => s.type === 'work')
        .reduce((total, session) => total + session.duration, 0);
    
    // Подсчитываем выполненные задачи
    const completedTasks = taskHistory.filter(task => 
        task.completed && new Date(task.completedAt) >= weekAgo
    ).length;
    
    weeklyStats = {
        focusHours: focusTime,
        completedTasks: completedTasks,
        sessions: weekSessions
    };
    
    // Обновляем общую статистику пользователя
    userProfile.totalSessions = sessionHistory.length;
    userProfile.totalHours = sessionHistory
        .filter(s => s.type === 'work')
        .reduce((total, session) => total + session.duration, 0);
    userProfile.totalTasks = taskHistory.filter(t => t.completed).length;
    
    // Вычисляем уровень и опыт
    updateUserLevel();
    
    saveUserProfile();
    localStorage.setItem('weeklyStats', JSON.stringify(weeklyStats));
}

// Обновление уровня пользователя
function updateUserLevel() {
    const totalMinutes = Math.floor(userProfile.totalHours / 60);
    const newLevel = Math.floor(totalMinutes / 100) + 1; // 100 минут = 1 уровень
    
    if (newLevel > userProfile.level) {
        userProfile.level = newLevel;
        showLevelUpNotification();
    }
    
    userProfile.experience = totalMinutes % 100;
}

// Показ уведомления о повышении уровня
function showLevelUpNotification() {
    const notification = document.createElement('div');
    notification.className = 'level-up-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <h3>🎉 Поздравляем!</h3>
            <p>Вы достигли ${userProfile.level} уровня!</p>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Загрузка сада
function loadGarden() {
    const saved = localStorage.getItem('garden');
    if (saved) {
        garden = JSON.parse(saved);
    }
    
    // Генерируем деревья на основе сессий
    generateTreesFromSessions();
}

// Генерация деревьев из сессий
function generateTreesFromSessions() {
    const sessionHistory = JSON.parse(localStorage.getItem('sessionHistory') || '[]');
    const workSessions = sessionHistory.filter(s => s.type === 'work');
    
    garden.trees = workSessions.map((session, index) => ({
        id: session.id,
        type: getTreeType(session.duration),
        size: getTreeSize(session.duration),
        position: { x: (index % 5) * 20 + 10, y: Math.floor(index / 5) * 20 + 10 },
        createdAt: session.startTime
    }));
    
    garden.totalTrees = garden.trees.length;
    garden.level = Math.floor(garden.totalTrees / 10) + 1;
    
    localStorage.setItem('garden', JSON.stringify(garden));
}

// Определение типа дерева по длительности сессии
function getTreeType(duration) {
    if (duration < 900) return 'small'; // < 15 мин
    if (duration < 1800) return 'medium'; // < 30 мин
    if (duration < 3600) return 'large'; // < 60 мин
    return 'huge'; // > 60 мин
}

// Определение размера дерева
function getTreeSize(duration) {
    return Math.min(100, Math.max(20, duration / 30)); // 20-100px
}

// Обновление отображения профиля
function updateProfileDisplay() {
    document.getElementById('userName').textContent = userProfile.name;
    document.getElementById('userEmail').textContent = userProfile.email;
    document.getElementById('userLevel').textContent = getLevelName(userProfile.level);
    document.getElementById('levelBadge').textContent = userProfile.level;
    document.getElementById('userInitials').textContent = userProfile.name.charAt(0).toUpperCase();
    
    document.getElementById('totalSessions').textContent = userProfile.totalSessions;
    document.getElementById('totalHours').textContent = formatDuration(userProfile.totalHours);
    document.getElementById('totalTasks').textContent = userProfile.totalTasks;
    
    // Обновляем переключатели настроек
    updateSettingToggles();
}

// Обновление недельной статистики
function updateWeeklyStats() {
    document.getElementById('weeklyFocusHours').textContent = formatDuration(weeklyStats.focusHours);
    document.getElementById('weeklyCompletedTasks').textContent = weeklyStats.completedTasks;
    document.getElementById('currentStreak').textContent = calculateStreak();
}

// Обновление сада
function updateGarden() {
    const gardenGrid = document.getElementById('gardenGrid');
    gardenGrid.innerHTML = '';
    
    garden.trees.forEach(tree => {
        const treeElement = document.createElement('div');
        treeElement.className = `tree tree-${tree.type}`;
        treeElement.style.left = `${tree.position.x}%`;
        treeElement.style.top = `${tree.position.y}%`;
        treeElement.style.width = `${tree.size}px`;
        treeElement.style.height = `${tree.size}px`;
        treeElement.title = `Сессия ${formatDuration(tree.size * 30)}`;
        
        treeElement.innerHTML = getTreeEmoji(tree.type);
        gardenGrid.appendChild(treeElement);
    });
    
    document.getElementById('totalTrees').textContent = garden.totalTrees;
    document.getElementById('forestLevel').textContent = garden.level;
}

// Получение эмодзи дерева
function getTreeEmoji(type) {
    const emojis = {
        small: '🌱',
        medium: '🌿',
        large: '🌳',
        huge: '🌲'
    };
    return emojis[type] || '🌱';
}

// Генерация сообщения AI
function generateAIMessage() {
    const messages = [
        "Привет! Я проанализировал твою активность. Рекомендую сделать 15-минутный перерыв после следующей сессии.",
        "Отличная работа! Ты уже провел " + formatDuration(weeklyStats.focusHours) + " в фокусе на этой неделе.",
        "Заметил, что ты работаешь лучше в утренние часы. Попробуй планировать сложные задачи на это время.",
        "Твоя серия дней подряд: " + calculateStreak() + ". Продолжай в том же духе!",
        "Рекомендую сделать длинный перерыв (30+ минут) - ты уже работал " + formatDuration(weeklyStats.focusHours) + " сегодня.",
        "Отличный баланс работы и отдыха! Твоя продуктивность растет."
    ];
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    document.getElementById('aiMessage').textContent = randomMessage;
}

// Анализ паттернов AI
function analyzePatterns() {
    const sessionHistory = JSON.parse(localStorage.getItem('sessionHistory') || '[]');
    
    if (sessionHistory.length < 5) {
        document.getElementById('aiMessage').textContent = "Нужно больше данных для анализа. Продолжай работать!";
        return;
    }
    
    // Анализ времени дня
    const hourStats = {};
    sessionHistory.forEach(session => {
        const hour = new Date(session.startTime).getHours();
        hourStats[hour] = (hourStats[hour] || 0) + session.duration;
    });
    
    const bestHour = Object.keys(hourStats).reduce((a, b) => 
        hourStats[a] > hourStats[b] ? a : b
    );
    
    // Анализ длительности сессий
    const avgDuration = sessionHistory.reduce((sum, s) => sum + s.duration, 0) / sessionHistory.length;
    
    let analysis = `Анализ твоих паттернов:\n`;
    analysis += `• Лучшее время для работы: ${bestHour}:00\n`;
    analysis += `• Средняя длительность сессии: ${formatDuration(avgDuration)}\n`;
    analysis += `• Всего сессий: ${sessionHistory.length}\n`;
    
    if (avgDuration > 3600) {
        analysis += `\n💡 Рекомендация: Попробуй более короткие сессии (25-30 мин) для лучшего фокуса.`;
    } else if (avgDuration < 900) {
        analysis += `\n💡 Рекомендация: Увеличь длительность сессий до 25+ минут для глубокой работы.`;
    }
    
    document.getElementById('aiMessage').textContent = analysis;
}

// Настройка обработчиков событий
function setupEventListeners() {
    // AI кнопки
    document.getElementById('askAI').addEventListener('click', generateAIMessage);
    document.getElementById('analyzePattern').addEventListener('click', analyzePatterns);
    
    // Переключатели настроек
    document.getElementById('soundToggle').addEventListener('click', () => {
        userProfile.settings.sounds = !userProfile.settings.sounds;
        updateSettingToggles();
        saveUserProfile();
    });
    
    document.getElementById('notificationToggle').addEventListener('click', () => {
        userProfile.settings.notifications = !userProfile.settings.notifications;
        updateSettingToggles();
        saveUserProfile();
        
        if (userProfile.settings.notifications) {
            requestNotificationPermission();
        }
    });
    
    document.getElementById('syncToggle').addEventListener('click', () => {
        userProfile.settings.sync = !userProfile.settings.sync;
        updateSettingToggles();
        saveUserProfile();
        
        if (userProfile.settings.sync) {
            syncWithServer();
        }
    });
}

// Обновление переключателей настроек
function updateSettingToggles() {
    const toggles = {
        soundToggle: userProfile.settings.sounds,
        notificationToggle: userProfile.settings.notifications,
        syncToggle: userProfile.settings.sync
    };
    
    Object.entries(toggles).forEach(([id, isActive]) => {
        const toggle = document.getElementById(id);
        toggle.classList.toggle('active', isActive);
    });
}

// Запрос разрешения на уведомления
function requestNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('Уведомления разрешены');
            }
        });
    }
}

// Синхронизация с сервером (заглушка)
function syncWithServer() {
    // Здесь будет реальная синхронизация с сервером
    console.log('Синхронизация с сервером...');
    
    // Имитация синхронизации
    setTimeout(() => {
        alert('Данные синхронизированы с облаком!');
    }, 1000);
}

// Вспомогательные функции
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
        return `${hours}ч ${minutes}м`;
    } else {
        return `${minutes}м`;
    }
}

function getLevelName(level) {
    const names = ['Новичок', 'Ученик', 'Специалист', 'Эксперт', 'Мастер', 'Гуру'];
    return names[Math.min(level - 1, names.length - 1)] || 'Легенда';
}

function calculateStreak() {
    const sessionHistory = JSON.parse(localStorage.getItem('sessionHistory') || '[]');
    if (sessionHistory.length === 0) return 0;
    
    const dates = [...new Set(sessionHistory.map(s => 
        new Date(s.startTime).toDateString()
    ))].sort((a, b) => new Date(b) - new Date(a));
    
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < dates.length; i++) {
        const date = new Date(dates[i]);
        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - i);
        
        if (date.toDateString() === expectedDate.toDateString()) {
            streak++;
        } else {
            break;
        }
    }
    
    return streak;
}

// Инициализация частиц
const canvas = document.getElementById("particleCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const particles = [];

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * 2 - 1;
        this.life = 120;
        this.maxLife = 120;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life--;
        this.size *= 0.98;
    }

    draw() {
        const alpha = this.life / this.maxLife;
        ctx.fillStyle = `rgba(99, 102, 241, ${alpha * 0.3})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function createParticles(x, y) {
    for (let i = 0; i < 5; i++) {
        particles.push(new Particle(x, y));
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (Math.random() < 0.1) {
        createParticles(
            Math.random() * canvas.width,
            Math.random() * canvas.height
        );
    }
    
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();
        if (particles[i].life <= 0) particles.splice(i, 1);
    }
    requestAnimationFrame(animateParticles);
}

animateParticles();

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Экспорт функций для использования в других скриптах
window.updateUserStats = function() {
    updateWeeklyStatsFromHistory();
    updateProfileDisplay();
    updateWeeklyStats();
    updateGarden();
};
