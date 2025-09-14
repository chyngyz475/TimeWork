// Система кастомных интервалов
class CustomTimerManager {
    constructor() {
        this.customPresets = [
            { name: 'Deep Work', work: 50, break: 10, cycles: 4 },
            { name: 'Ultra Focus', work: 90, break: 20, cycles: 2 },
            { name: 'Quick Sprint', work: 10, break: 2, cycles: 6 },
            { name: 'Marathon', work: 120, break: 30, cycles: 1 }
        ];
        
        this.currentPreset = null;
        this.currentCycle = 0;
        this.isCustomMode = false;
        
        this.init();
    }
    
    init() {
        this.loadCustomPresets();
        this.createUI();
        this.setupEventListeners();
    }
    
    loadCustomPresets() {
        const saved = localStorage.getItem('customPresets');
        if (saved) {
            this.customPresets = JSON.parse(saved);
        }
    }
    
    saveCustomPresets() {
        localStorage.setItem('customPresets', JSON.stringify(this.customPresets));
    }
    
    createUI() {
        // Создаем модальное окно для кастомных интервалов
        const modal = document.createElement('div');
        modal.className = 'custom-timer-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Кастомные интервалы</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="presets-section">
                        <h4>Готовые пресеты</h4>
                        <div class="presets-grid" id="presetsGrid">
                            <!-- Пресеты будут добавлены динамически -->
                        </div>
                    </div>
                    
                    <div class="create-section">
                        <h4>Создать свой</h4>
                        <div class="form-group">
                            <label>Название:</label>
                            <input type="text" id="presetName" placeholder="Мой интервал">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Работа (мин):</label>
                                <input type="number" id="workTime" min="1" max="180" value="25">
                            </div>
                            <div class="form-group">
                                <label>Отдых (мин):</label>
                                <input type="number" id="breakTime" min="1" max="60" value="5">
                            </div>
                            <div class="form-group">
                                <label>Циклов:</label>
                                <input type="number" id="cycles" min="1" max="10" value="4">
                            </div>
                        </div>
                        <button class="create-preset-btn">Создать пресет</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.renderPresets();
    }
    
    renderPresets() {
        const presetsGrid = document.getElementById('presetsGrid');
        presetsGrid.innerHTML = '';
        
        this.customPresets.forEach((preset, index) => {
            const presetCard = document.createElement('div');
            presetCard.className = 'preset-card';
            presetCard.innerHTML = `
                <div class="preset-name">${preset.name}</div>
                <div class="preset-details">
                    <span>${preset.work}м работа</span>
                    <span>${preset.break}м отдых</span>
                    <span>${preset.cycles} циклов</span>
                </div>
                <div class="preset-actions">
                    <button class="use-preset-btn" data-index="${index}">Использовать</button>
                    <button class="delete-preset-btn" data-index="${index}">Удалить</button>
                </div>
            `;
            presetsGrid.appendChild(presetCard);
        });
    }
    
    setupEventListeners() {
        const modal = document.querySelector('.custom-timer-modal');
        const closeBtn = modal.querySelector('.modal-close');
        const createBtn = modal.querySelector('.create-preset-btn');
        
        // Закрытие модального окна
        closeBtn.addEventListener('click', () => {
            this.closeModal();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });
        
        // Создание нового пресета
        createBtn.addEventListener('click', () => {
            this.createPreset();
        });
        
        // Использование пресета
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('use-preset-btn')) {
                const index = parseInt(e.target.dataset.index);
                this.usePreset(index);
            }
            
            if (e.target.classList.contains('delete-preset-btn')) {
                const index = parseInt(e.target.dataset.index);
                this.deletePreset(index);
            }
        });
    }
    
    createPreset() {
        const name = document.getElementById('presetName').value.trim();
        const workTime = parseInt(document.getElementById('workTime').value);
        const breakTime = parseInt(document.getElementById('breakTime').value);
        const cycles = parseInt(document.getElementById('cycles').value);
        
        if (!name || !workTime || !breakTime || !cycles) {
            alert('Пожалуйста, заполните все поля');
            return;
        }
        
        const newPreset = {
            name: name,
            work: workTime,
            break: breakTime,
            cycles: cycles
        };
        
        this.customPresets.push(newPreset);
        this.saveCustomPresets();
        this.renderPresets();
        
        // Очищаем форму
        document.getElementById('presetName').value = '';
        document.getElementById('workTime').value = '25';
        document.getElementById('breakTime').value = '5';
        document.getElementById('cycles').value = '4';
    }
    
    usePreset(index) {
        this.currentPreset = this.customPresets[index];
        this.currentCycle = 0;
        this.isCustomMode = true;
        
        // Обновляем глобальные переменные таймера
        if (window.workTime !== undefined) {
            window.workTime = this.currentPreset.work * 60;
            window.breakTime = this.currentPreset.break * 60;
            window.isPomodoro = true;
            window.currentPhase = 'work';
        }
        
        // Обновляем отображение
        this.updateTimerDisplay();
        this.closeModal();
        
        // Показываем информацию о пресете
        this.showPresetInfo();
    }
    
    deletePreset(index) {
        if (confirm('Удалить этот пресет?')) {
            this.customPresets.splice(index, 1);
            this.saveCustomPresets();
            this.renderPresets();
        }
    }
    
    updateTimerDisplay() {
        // Обновляем кнопки времени
        const timeButtons = document.querySelectorAll('.time-btn');
        timeButtons.forEach(btn => btn.classList.remove('active'));
        
        // Добавляем активную кнопку для кастомного режима
        const customBtn = document.querySelector('.custom-time-btn');
        if (customBtn) {
            customBtn.classList.add('active');
        }
        
        // Обновляем индикатор фазы
        if (window.updatePhaseIndicator) {
            window.updatePhaseIndicator();
        }
    }
    
    showPresetInfo() {
        const info = document.createElement('div');
        info.className = 'preset-info';
        info.innerHTML = `
            <div class="preset-info-content">
                <h4>${this.currentPreset.name}</h4>
                <p>Цикл ${this.currentCycle + 1} из ${this.currentPreset.cycles}</p>
                <p>${this.currentPreset.work}м работа / ${this.currentPreset.break}м отдых</p>
            </div>
        `;
        
        document.querySelector('.container').insertBefore(info, document.querySelector('.timer-options'));
        
        // Автоматически скрываем через 3 секунды
        setTimeout(() => {
            if (info.parentNode) {
                info.parentNode.removeChild(info);
            }
        }, 3000);
    }
    
    nextCycle() {
        if (!this.isCustomMode || !this.currentPreset) return;
        
        this.currentCycle++;
        
        if (this.currentCycle >= this.currentPreset.cycles) {
            // Все циклы завершены
            this.completeCustomSession();
        } else {
            // Переходим к следующему циклу
            this.showPresetInfo();
        }
    }
    
    completeCustomSession() {
        this.isCustomMode = false;
        this.currentPreset = null;
        this.currentCycle = 0;
        
        // Показываем уведомление о завершении
        if (window.notificationManager) {
            window.notificationManager.showNotification(
                'Сессия завершена!',
                'Все циклы выполнены. Отличная работа!',
                { requireInteraction: true }
            );
        }
        
        // Убираем активную кнопку кастомного режима
        const customBtn = document.querySelector('.custom-time-btn');
        if (customBtn) {
            customBtn.classList.remove('active');
        }
    }
    
    openModal() {
        const modal = document.querySelector('.custom-timer-modal');
        modal.classList.add('show');
    }
    
    closeModal() {
        const modal = document.querySelector('.custom-timer-modal');
        modal.classList.remove('show');
    }
    
    // Добавляем кнопку для открытия модального окна
    addCustomButton() {
        const timerOptions = document.querySelector('.timer-options .time-presets');
        if (!timerOptions) return;
        
        const customBtn = document.createElement('button');
        customBtn.className = 'time-btn custom-time-btn';
        customBtn.innerHTML = `
            <span class="time-value">∞</span>
            <span class="time-label">Кастом</span>
        `;
        
        customBtn.addEventListener('click', () => {
            this.openModal();
        });
        
        timerOptions.appendChild(customBtn);
    }
}

// Глобальный экземпляр менеджера кастомных таймеров
window.customTimerManager = new CustomTimerManager();

// Стили для кастомных таймеров
const customTimerStyles = `
.custom-timer-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
}

.custom-timer-modal.show {
    opacity: 1;
    visibility: visible;
}

.modal-content {
    background: rgba(15, 15, 35, 0.95);
    border: 1px solid rgba(99, 102, 241, 0.3);
    border-radius: 20px;
    padding: 2rem;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    backdrop-filter: blur(20px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.modal-header h3 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #fff;
    margin: 0;
}

.modal-close {
    background: none;
    border: none;
    color: #94a3b8;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 8px;
    transition: all 0.2s ease;
}

.modal-close:hover {
    background: rgba(99, 102, 241, 0.1);
    color: #6366f1;
}

.presets-section {
    margin-bottom: 2rem;
}

.presets-section h4 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #fff;
    margin-bottom: 1rem;
}

.presets-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
}

.preset-card {
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 12px;
    padding: 1rem;
    transition: all 0.3s ease;
}

.preset-card:hover {
    border-color: rgba(99, 102, 241, 0.5);
    transform: translateY(-2px);
}

.preset-name {
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
    margin-bottom: 0.5rem;
}

.preset-details {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-bottom: 1rem;
}

.preset-details span {
    font-size: 0.875rem;
    color: #94a3b8;
}

.preset-actions {
    display: flex;
    gap: 0.5rem;
}

.use-preset-btn,
.delete-preset-btn {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.use-preset-btn {
    background: linear-gradient(135deg, #6366f1, #a855f7);
    color: #fff;
    flex: 1;
}

.use-preset-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.delete-preset-btn {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.2);
}

.delete-preset-btn:hover {
    background: rgba(239, 68, 68, 0.2);
}

.create-section h4 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #fff;
    margin-bottom: 1rem;
}

.form-group {
    margin-bottom: 1rem;
}

.form-group label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #e2e8f0;
    margin-bottom: 0.5rem;
}

.form-group input {
    width: 100%;
    padding: 0.75rem;
    font-size: 0.875rem;
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 8px;
    background: rgba(30, 41, 59, 0.6);
    color: #e2e8f0;
    outline: none;
    transition: all 0.3s ease;
}

.form-group input:focus {
    border-color: rgba(99, 102, 241, 0.5);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 1rem;
}

.create-preset-btn {
    width: 100%;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: 600;
    background: linear-gradient(135deg, #6366f1, #a855f7);
    color: #fff;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.create-preset-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
}

.preset-info {
    background: rgba(15, 15, 35, 0.8);
    border: 1px solid rgba(99, 102, 241, 0.3);
    border-radius: 12px;
    padding: 1rem;
    margin-bottom: 1rem;
    backdrop-filter: blur(20px);
    animation: slideIn 0.3s ease;
}

.preset-info-content h4 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #6366f1;
    margin-bottom: 0.5rem;
}

.preset-info-content p {
    font-size: 0.875rem;
    color: #e2e8f0;
    margin-bottom: 0.25rem;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@media (max-width: 600px) {
    .modal-content {
        padding: 1rem;
        margin: 1rem;
    }
    
    .presets-grid {
        grid-template-columns: 1fr;
    }
    
    .form-row {
        grid-template-columns: 1fr;
    }
}
`;

// Добавляем стили в документ
const customTimerStyleSheet = document.createElement('style');
customTimerStyleSheet.textContent = customTimerStyles;
document.head.appendChild(customTimerStyleSheet);
