let timeLeft = 25 * 60; // 25 minutes in seconds
let timerId = null;
let isPomodoro = false;
let workTime = 25 * 60;
let breakTime = 5 * 60;
let currentPhase = "work";
let history = [];
let isPaused = false;
let sessionStartTime = null;
let totalSessionTime = 0;

const canvas = document.getElementById("particleCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const particles = [];

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 5 + 1;
        this.speedX = Math.random() * 3 - 1.5;
        this.speedY = Math.random() * 3 - 1.5;
        this.life = 60;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life--;
        this.size *= 0.95;
    }

    draw() {
        ctx.fillStyle = `rgba(0, 150, 255, ${this.life / 60})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function createParticles(x, y) {
    for (let i = 0; i < 10; i++) {
        particles.push(new Particle(x, y));
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();
        if (particles[i].life <= 0) particles.splice(i, 1);
    }
    requestAnimationFrame(animateParticles);
}

animateParticles();

function updateTimer() {
    if (timeLeft <= 0) {
        // Завершаем текущую сессию
        if (sessionStartTime && totalSessionTime > 0) {
            const sessionType = currentPhase === "work" ? "work" : "break";
            if (typeof addSession === 'function') {
                addSession(sessionType, totalSessionTime);
            }
        }
        
        // Показываем уведомление о завершении
        if (window.notificationManager) {
            window.notificationManager.notifyTimerEnd();
        }
        
        if (isPomodoro) {
            currentPhase = currentPhase === "work" ? "break" : "work";
            timeLeft = currentPhase === "work" ? workTime : breakTime;
            
            // Обновляем индикатор фазы
            updatePhaseIndicator();
            
            // Начинаем новую сессию
            sessionStartTime = Date.now();
            totalSessionTime = 0;
            
            // Показываем уведомление о смене фазы
            if (window.notificationManager) {
                if (currentPhase === "work") {
                    window.notificationManager.notifyWorkStart();
                } else {
                    window.notificationManager.notifyBreakStart();
                }
            }
            
            // Проверяем кастомные циклы
            if (window.customTimerManager && window.customTimerManager.isCustomMode) {
                window.customTimerManager.nextCycle();
            }
            
        } else {
            clearInterval(timerId);
            timerId = null;
            isPaused = false;
            sessionStartTime = null;
            totalSessionTime = 0;
            
            document.getElementById("startButton").innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                </svg>
                <span>Старт</span>
            `;
            document.getElementById("startButton").classList.remove("shifted");
            showHideableElements();
            updatePhaseIndicator();
            return;
        }
    }

    // Обновляем время сессии
    if (sessionStartTime) {
        totalSessionTime = Math.floor((Date.now() - sessionStartTime) / 1000);
    }

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    updateDigit("minutes", String(minutes).padStart(2, '0'));
    const secondsStr = String(seconds).padStart(2, '0');
    updateDigit("seconds1", secondsStr[0] || '0');
    updateDigit("seconds2", secondsStr[1] || '0');

    // Обновляем прогресс-кольцо
    updateProgressRing();

    timeLeft--;
    saveState();
}

function updateDigit(elementId, newValue) {
    const card = document.getElementById(elementId);
    const top = card.querySelector(".top");
    const bottom = card.querySelector(".bottom");
    const currentValue = top.textContent;

    if (currentValue !== newValue) {
        card.classList.add("flipping");
        const rect = card.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        createParticles(x, y);

        bottom.textContent = newValue;

        setTimeout(() => {
            top.textContent = newValue;
            card.classList.remove("flipping");
            card.classList.add("flipped");
        }, 600);

        setTimeout(() => {
            card.classList.remove("flipped");
        }, 1200);
    }
}

// Обновление индикатора текущей фазы
function updatePhaseIndicator() {
    const phaseElement = document.getElementById('currentPhase');
    if (!phaseElement) return;
    
    if (timerId) {
        if (isPomodoro) {
            phaseElement.textContent = currentPhase === "work" ? "Работа" : "Отдых";
        } else {
            phaseElement.textContent = "Работа";
        }
    } else {
        phaseElement.textContent = "Готов к работе";
    }
}

// Обновление прогресс-кольца
function updateProgressRing() {
    const progressCircle = document.getElementById('progressCircle');
    if (!progressCircle) return;
    
    const totalTime = isPomodoro ? (currentPhase === "work" ? workTime : breakTime) : timeLeft + totalSessionTime;
    const elapsed = totalTime - timeLeft;
    const progress = elapsed / totalTime;
    
    const circumference = 2 * Math.PI * 90; // радиус 90
    const offset = circumference - (progress * circumference);
    
    progressCircle.style.strokeDashoffset = offset;
}

// Функции для скрытия и показа элементов
function hideHideableElements() {
    document.querySelectorAll('.hideable').forEach(element => {
        element.classList.add('hidden');
    });
}

function showHideableElements() {
    document.querySelectorAll('.hideable').forEach(element => {
        element.classList.remove('hidden');
    });
}

document.getElementById("startButton").addEventListener("click", () => {
    if (!timerId && !isPaused) {
        // Старт таймера
        timerId = setInterval(updateTimer, 1000);
        sessionStartTime = Date.now();
        totalSessionTime = 0;
        
        document.getElementById("startButton").innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
            <span>Пауза</span>
        `;
        document.getElementById("startButton").classList.add("shifted");
        hideHideableElements();
        updatePhaseIndicator();
    } else if (timerId && !isPaused) {
        // Пауза
        clearInterval(timerId);
        timerId = null;
        isPaused = true;
        
        document.getElementById("startButton").innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
            </svg>
            <span>Продолжить</span>
        `;
        document.getElementById("startButton").classList.remove("shifted");
        showHideableElements(); // Показываем элементы при паузе
        updatePhaseIndicator();
    } else if (isPaused) {
        // Возобновление
        timerId = setInterval(updateTimer, 1000);
        isPaused = false;
        
        document.getElementById("startButton").innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
            <span>Пауза</span>
        `;
        document.getElementById("startButton").classList.add("shifted");
        hideHideableElements(); // Скрываем элементы при возобновлении
        updatePhaseIndicator();
    }
});

document.getElementById("pomodoroMode").addEventListener("click", () => {
    isPomodoro = !isPomodoro;
    timeLeft = isPomodoro ? workTime : timeLeft;
    currentPhase = "work";
    updateTimer();
    updatePhaseIndicator();
    
    const pomodoroBtn = document.getElementById("pomodoroMode");
    pomodoroBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        <span>${isPomodoro ? "Выключить Помодоро" : "Включить Помодоро"}</span>
    `;
});

document.querySelectorAll(".time-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".time-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        timeLeft = parseInt(btn.dataset.time, 10);
        updateTimer();
    });
});

document.getElementById("changeBackgroundBtn").addEventListener("click", () => {
    document.getElementById("backgroundUpload").click();
});

document.getElementById("backgroundUpload").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            document.querySelector(".background-glow").style.backgroundImage = `url(${event.target.result})`;
        };
        reader.readAsDataURL(file);
    }
});

const taskInput = document.getElementById("taskInput");
const addTaskButton = document.getElementById("addTaskButton");
const taskList = document.getElementById("taskList");

addTaskButton.addEventListener("click", () => {
    const taskText = taskInput.value.trim();
    if (taskText) {
        addTask(taskText);
        taskInput.value = "";
    }
});

taskInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        const taskText = taskInput.value.trim();
        if (taskText) {
            addTask(taskText);
            taskInput.value = "";
        }
    }
});

function addTask(text) {
    const li = document.createElement("li");
    li.className = "task-item";
    li.draggable = true;
    li.innerHTML = `
        <input type="checkbox" id="task-${Date.now()}">
        <label for="task-${Date.now()}">${text}</label>
        <button class="delete-btn">Удалить</button>
    `;
    taskList.appendChild(li);

    const checkbox = li.querySelector("input[type='checkbox']");
    const deleteBtn = li.querySelector(".delete-btn");

    checkbox.addEventListener("change", () => {
        if (checkbox.checked && timerId) {
            li.classList.add("completed");
            setTimeout(() => {
                li.remove();
                updateTaskProgress();
                history.push({ text, completed: true, time: new Date().toLocaleString() });
                
                // Показываем уведомление о выполнении задачи
                if (window.notificationManager) {
                    window.notificationManager.notifyTaskCompleted(text);
                }
                
                // Обновляем статистику пользователя
                if (window.updateUserStats) {
                    window.updateUserStats();
                }
            }, 500);
        }
    });

    deleteBtn.addEventListener("click", () => {
        li.classList.add("completed");
        setTimeout(() => {
            li.remove();
            updateTaskProgress();
            history.push({ text, deleted: true, time: new Date().toLocaleString() });
        }, 500);
    });

    li.addEventListener("dragstart", (e) => e.dataTransfer.setData("text/plain", li.innerHTML));
    li.addEventListener("dragover", (e) => e.preventDefault());
    li.addEventListener("drop", (e) => {
        e.preventDefault();
        const data = e.dataTransfer.getData("text/plain");
        li.innerHTML = data;
        addTaskEventListeners(li);
    });

    updateTaskProgress();
}

function addTaskEventListeners(li) {
    const checkbox = li.querySelector("input[type='checkbox']");
    const deleteBtn = li.querySelector(".delete-btn");
    checkbox.addEventListener("change", () => {
        if (checkbox.checked && timerId) {
            li.classList.add("completed");
            setTimeout(() => {
                li.remove();
                updateTaskProgress();
                history.push({ text: li.querySelector("label").textContent, completed: true, time: new Date().toLocaleString() });
            }, 500);
        }
    });
    deleteBtn.addEventListener("click", () => {
        li.classList.add("completed");
        setTimeout(() => {
            li.remove();
            updateTaskProgress();
            history.push({ text: li.querySelector("label").textContent, deleted: true, time: new Date().toLocaleString() });
        }, 500);
    });
}

function updateTaskProgress() {
    const totalTasks = taskList.children.length;
    const completedTasks = Array.from(taskList.children).filter(li => li.querySelector("input[type='checkbox']").checked).length;
    const progress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
    document.getElementById("taskProgress").textContent = `Задачи: ${completedTasks}/${totalTasks} (${progress}%)`;
}

document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && document.activeElement.tagName !== "INPUT") {
        e.preventDefault();
        document.getElementById("startButton").click();
    } else if (e.code === "Enter" && document.getElementById("taskInput") === document.activeElement) {
        document.getElementById("addTaskButton").click();
    }
});

document.getElementById("helpBtn").addEventListener("click", () => {
    alert("Инструкции: Нажмите 'Start' для запуска таймера, добавляйте задачи в поле ввода и отмечайте их галочкой при выполнении. Используйте кнопки времени для выбора длительности, нажмите 'Поменять фон' для загрузки изображения, просмотрите историю задач.");
});

document.getElementById("historyBtn").addEventListener("click", () => {
    const historyPanel = document.getElementById("historyPanel");
    const historyList = document.getElementById("historyList");
    historyList.innerHTML = history.map(h => `<li>${h.text} - ${h.completed ? "Выполнена" : "Удалена"} в ${h.time}</li>`).join("");
    historyPanel.classList.remove("hidden");
});

document.getElementById("closeHistory").addEventListener("click", () => {
    document.getElementById("historyPanel").classList.add("hidden");
});

function saveState() {
    localStorage.setItem("timerState", JSON.stringify({ timeLeft, tasks: Array.from(taskList.children).map(li => li.querySelector("label").textContent), history }));
}

window.addEventListener("load", () => {
    const state = JSON.parse(localStorage.getItem("timerState"));
    if (state) {
        timeLeft = state.timeLeft;
        state.tasks.forEach(task => addTask(task));
        history = state.history || [];
        updateTimer();
    }
    
    // Инициализация индикатора фазы
    updatePhaseIndicator();
    
    // Инициализация прогресс-кольца
    updateProgressRing();
});

setInterval(saveState, 5000);

updateTimer();

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
        .then(() => console.log('Service Worker registered'))
        .catch((error) => console.error('Service Worker registration failed:', error));
}