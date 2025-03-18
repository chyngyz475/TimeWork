let timeLeft = 25 * 60; // 25 minutes in seconds
let timerId = null;
let isPomodoro = false;
let workTime = 25 * 60;
let breakTime = 5 * 60;
let currentPhase = "work";
let history = [];

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
        if (isPomodoro) {
            currentPhase = currentPhase === "work" ? "break" : "work";
            timeLeft = currentPhase === "work" ? workTime : breakTime;
            alert(`Перерыв! (${currentPhase === "work" ? "Работа" : "Отдых"} начинается)`);
        } else {
            clearInterval(timerId);
            alert("Таймер закончен!");
            return;
        }
    }

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    updateDigit("minutes", String(minutes).padStart(2, '0'));
    const secondsStr = String(seconds).padStart(2, '0');
    updateDigit("seconds1", secondsStr[0] || '0');
    updateDigit("seconds2", secondsStr[1] || '0');

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

document.getElementById("startButton").addEventListener("click", () => {
    if (!timerId) {
        timerId = setInterval(updateTimer, 1000);
        document.getElementById("startButton").textContent = "Stop";
    } else {
        clearInterval(timerId);
        timerId = null;
        document.getElementById("startButton").textContent = "Start";
    }
});

document.getElementById("pomodoroMode").addEventListener("click", () => {
    isPomodoro = !isPomodoro;
    timeLeft = isPomodoro ? workTime : timeLeft;
    currentPhase = "work";
    updateTimer();
    document.getElementById("pomodoroMode").textContent = isPomodoro ? "Выключить Помодоро" : "Включить Помодоро";
});

// Time selection buttons
document.querySelectorAll(".time-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".time-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        timeLeft = parseInt(btn.dataset.time, 10);
        updateTimer();
    });
});

// Change background button
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

// Task Management
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

// Hotkeys
document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && document.activeElement.tagName !== "INPUT") {
        e.preventDefault();
        document.getElementById("startButton").click();
    } else if (e.code === "Enter" && document.getElementById("taskInput") === document.activeElement) {
        document.getElementById("addTaskButton").click();
    }
});

// Help
document.getElementById("helpBtn").addEventListener("click", () => {
    alert("Инструкции: Нажмите 'Start' для запуска таймера, добавляйте задачи в поле ввода и отмечайте их галочкой при выполнении. Используйте кнопки времени для выбора длительности, нажмите 'Поменять фон' для загрузки изображения, просмотрите историю задач.");
});

// History
document.getElementById("historyBtn").addEventListener("click", () => {
    const historyPanel = document.getElementById("historyPanel");
    const historyList = document.getElementById("historyList");
    historyList.innerHTML = history.map(h => `<li>${h.text} - ${h.completed ? "Выполнена" : "Удалена"} в ${h.time}</li>`).join("");
    historyPanel.classList.remove("hidden");
});

document.getElementById("closeHistory").addEventListener("click", () => {
    document.getElementById("historyPanel").classList.add("hidden");
});

// Auto-save and restore
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
});

setInterval(saveState, 5000);

// Initial call
updateTimer();

// Resize
window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});