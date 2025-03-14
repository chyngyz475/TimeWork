let timeLeft = 25 * 60; // 25 minutes in seconds
let timerId = null;

// Particle System
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
        this.life = 60; // Frames to live
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
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }
    requestAnimationFrame(animateParticles);
}

animateParticles();

function updateTimer() {
    if (timeLeft <= 0) {
        clearInterval(timerId);
        alert("Timer finished!");
        return;
    }

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    // Update minutes
    updateDigit("minutes", String(minutes).padStart(2, '0'));

    // Split seconds into two digits for individual flip cards
    const secondsStr = String(seconds).padStart(2, '0');
    updateDigit("seconds1", secondsStr[0] || '0'); // Tens digit
    updateDigit("seconds2", secondsStr[1] || '0'); // Ones digit

    timeLeft--;
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
    li.innerHTML = `
        <input type="checkbox" id="task-${Date.now()}">
        <label for="task-${Date.now()}">${text}</label>
        <button class="delete-btn">Delete</button>
    `;
    taskList.appendChild(li);

    const checkbox = li.querySelector("input[type='checkbox']");
    const deleteBtn = li.querySelector(".delete-btn");

    checkbox.addEventListener("change", () => {
        if (checkbox.checked && timerId) {
            li.classList.add("completed");
            setTimeout(() => {
                li.remove();
            }, 500); // Match the fade-out animation duration
        }
    });

    deleteBtn.addEventListener("click", () => {
        li.classList.add("completed");
        setTimeout(() => {
            li.remove();
        }, 500); // Match the fade-out animation duration
    });
}

// Initial call to set the display
updateTimer();

// Resize canvas on window resize
window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});