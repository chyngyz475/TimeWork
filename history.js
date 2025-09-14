// История сессий работы и отдыха
let sessionHistory = [];
let currentFilter = 'all';

// Инициализация страницы истории
document.addEventListener('DOMContentLoaded', function() {
    loadSessionHistory();
    updateCurrentDate();
    updateDailyStats();
    renderSessions();
    renderWeeklyChart();
    setupEventListeners();
});

// Загрузка истории сессий из localStorage
function loadSessionHistory() {
    const saved = localStorage.getItem('sessionHistory');
    if (saved) {
        sessionHistory = JSON.parse(saved);
    }
}

// Сохранение истории сессий в localStorage
function saveSessionHistory() {
    localStorage.setItem('sessionHistory', JSON.stringify(sessionHistory));
}

// Добавление новой сессии
function addSession(type, duration, completed = true) {
    const session = {
        id: Date.now(),
        type: type, // 'work' или 'break'
        duration: duration, // в секундах
        startTime: new Date(Date.now() - duration * 1000),
        endTime: new Date(),
        completed: completed
    };
    
    sessionHistory.push(session);
    saveSessionHistory();
    
    // Обновляем отображение если мы на странице истории
    if (window.location.pathname.includes('history.html')) {
        updateDailyStats();
        renderSessions();
        renderWeeklyChart();
    }
}

// Обновление текущей даты
function updateCurrentDate() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    document.getElementById('currentDate').textContent = now.toLocaleDateString('ru-RU', options);
}

// Обновление дневной статистики
function updateDailyStats() {
    const today = new Date().toDateString();
    const todaySessions = sessionHistory.filter(session => 
        new Date(session.startTime).toDateString() === today
    );
    
    const workSessions = todaySessions.filter(s => s.type === 'work');
    const breakSessions = todaySessions.filter(s => s.type === 'break');
    
    const totalWorkTime = workSessions.reduce((total, session) => total + session.duration, 0);
    const hours = Math.floor(totalWorkTime / 3600);
    const minutes = Math.floor((totalWorkTime % 3600) / 60);
    
    document.getElementById('workSessions').textContent = workSessions.length;
    document.getElementById('breakSessions').textContent = breakSessions.length;
    document.getElementById('totalWorkTime').textContent = `${hours}ч ${minutes}м`;
}

// Рендеринг списка сессий
function renderSessions() {
    const sessionsList = document.getElementById('sessionsList');
    const today = new Date().toDateString();
    
    let todaySessions = sessionHistory.filter(session => 
        new Date(session.startTime).toDateString() === today
    );
    
    // Фильтрация по типу
    if (currentFilter !== 'all') {
        todaySessions = todaySessions.filter(session => session.type === currentFilter);
    }
    
    // Сортировка по времени (новые сверху)
    todaySessions.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    
    if (todaySessions.length === 0) {
        sessionsList.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #94a3b8;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" style="margin-bottom: 1rem; opacity: 0.5;">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <p>Сегодня пока нет сессий</p>
                <p style="font-size: 0.875rem; margin-top: 0.5rem;">Начните работу с таймером!</p>
            </div>
        `;
        return;
    }
    
    sessionsList.innerHTML = todaySessions.map(session => {
        const startTime = new Date(session.startTime).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const duration = formatDuration(session.duration);
        const typeText = session.type === 'work' ? 'Работа' : 'Отдых';
        const typeClass = session.type === 'work' ? 'work-icon' : 'break-icon';
        
        return `
            <div class="session-item">
                <div class="session-info">
                    <div class="session-type" style="display: flex; align-items: center; gap: 0.5rem;">
                        <div class="stat-icon ${typeClass}" style="width: 24px; height: 24px;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                ${session.type === 'work' ? 
                                    '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>' :
                                    '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>'
                                }
                            </svg>
                        </div>
                        ${typeText}
                    </div>
                    <div class="session-time">${startTime}</div>
                </div>
                <div class="session-duration">${duration}</div>
            </div>
        `;
    }).join('');
}

// Рендеринг недельного графика
function renderWeeklyChart() {
    const weekChart = document.getElementById('weekChart');
    const today = new Date();
    const weekDays = [];
    
    // Получаем последние 7 дней
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        weekDays.push(date);
    }
    
    weekChart.innerHTML = weekDays.map(date => {
        const daySessions = sessionHistory.filter(session => 
            new Date(session.startTime).toDateString() === date.toDateString()
        );
        
        const workTime = daySessions
            .filter(s => s.type === 'work')
            .reduce((total, session) => total + session.duration, 0);
        
        const breakTime = daySessions
            .filter(s => s.type === 'break')
            .reduce((total, session) => total + session.duration, 0);
        
        const totalTime = workTime + breakTime;
        const workPercentage = totalTime > 0 ? (workTime / totalTime) * 100 : 0;
        const breakPercentage = totalTime > 0 ? (breakTime / totalTime) * 100 : 0;
        
        const dayName = date.toLocaleDateString('ru-RU', { weekday: 'short' });
        const isToday = date.toDateString() === today.toDateString();
        
        return `
            <div class="day-bar">
                <div class="day-label" style="color: ${isToday ? '#6366f1' : '#94a3b8'}; font-weight: ${isToday ? '600' : '500'}">
                    ${dayName}
                </div>
                <div class="day-progress">
                    ${workTime > 0 ? `<div class="day-work" style="height: ${workPercentage}%"></div>` : ''}
                    ${breakTime > 0 ? `<div class="day-break" style="height: ${breakPercentage}%"></div>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Форматирование длительности
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
        return `${hours}ч ${minutes}м`;
    } else {
        return `${minutes}м`;
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Фильтры
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            renderSessions();
        });
    });
}

// Инициализация частиц для страницы истории
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
    
    // Добавляем случайные частицы
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

// Экспорт функций для использования в основном скрипте
window.addSession = addSession;


