// Система фоновых звуков
class SoundManager {
    constructor() {
        this.audioContext = null;
        this.currentSound = null;
        this.isPlaying = false;
        this.volume = 0.3;
        this.sounds = {
            whiteNoise: null,
            cafe: null,
            rain: null,
            focus: null
        };
        
        this.init();
    }
    
    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            await this.createSounds();
        } catch (error) {
            console.log('Web Audio API не поддерживается');
        }
    }
    
    async createSounds() {
        // Создаем белый шум
        this.sounds.whiteNoise = this.createWhiteNoise();
        
        // Создаем звук кафе (имитация)
        this.sounds.cafe = this.createCafeSound();
        
        // Создаем звук дождя
        this.sounds.rain = this.createRainSound();
        
        // Создаем фокусную музыку
        this.sounds.focus = this.createFocusMusic();
    }
    
    createWhiteNoise() {
        const bufferSize = this.audioContext.sampleRate * 2;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        return buffer;
    }
    
    createCafeSound() {
        const bufferSize = this.audioContext.sampleRate * 2;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            // Имитация звуков кафе: низкочастотный гул + случайные всплески
            const baseFreq = Math.sin(2 * Math.PI * 200 * i / this.audioContext.sampleRate) * 0.1;
            const noise = (Math.random() * 2 - 1) * 0.05;
            const spike = Math.random() < 0.01 ? (Math.random() * 2 - 1) * 0.3 : 0;
            
            output[i] = baseFreq + noise + spike;
        }
        
        return buffer;
    }
    
    createRainSound() {
        const bufferSize = this.audioContext.sampleRate * 2;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            // Имитация дождя: высокочастотный шум с фильтрацией
            const noise = (Math.random() * 2 - 1) * 0.3;
            const filtered = noise * Math.sin(2 * Math.PI * 1000 * i / this.audioContext.sampleRate);
            output[i] = filtered;
        }
        
        return buffer;
    }
    
    createFocusMusic() {
        const bufferSize = this.audioContext.sampleRate * 2;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            // Простая мелодия для фокуса
            const freq1 = 440; // A4
            const freq2 = 554.37; // C#5
            const freq3 = 659.25; // E5
            
            const t = i / this.audioContext.sampleRate;
            const note1 = Math.sin(2 * Math.PI * freq1 * t) * 0.1;
            const note2 = Math.sin(2 * Math.PI * freq2 * t) * 0.1;
            const note3 = Math.sin(2 * Math.PI * freq3 * t) * 0.1;
            
            output[i] = note1 + note2 + note3;
        }
        
        return buffer;
    }
    
    playSound(soundType) {
        if (!this.audioContext || !this.sounds[soundType]) return;
        
        this.stopSound();
        
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = this.sounds[soundType];
        source.loop = true;
        
        gainNode.gain.value = this.volume;
        
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        source.start();
        this.currentSound = source;
        this.isPlaying = true;
    }
    
    stopSound() {
        if (this.currentSound) {
            this.currentSound.stop();
            this.currentSound = null;
            this.isPlaying = false;
        }
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }
    
    toggleSound(soundType) {
        if (this.isPlaying) {
            this.stopSound();
        } else {
            this.playSound(soundType);
        }
    }
}

// Глобальный экземпляр менеджера звуков
window.soundManager = new SoundManager();

// UI для управления звуками
class SoundUI {
    constructor() {
        this.currentSoundType = 'whiteNoise';
        this.isEnabled = false;
        this.createUI();
        this.setupEventListeners();
    }
    
    createUI() {
        // Создаем панель звуков
        const soundPanel = document.createElement('div');
        soundPanel.className = 'sound-panel';
        soundPanel.innerHTML = `
            <div class="sound-controls">
                <button class="sound-toggle" id="soundToggle">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                </button>
                <div class="sound-options" id="soundOptions">
                    <button class="sound-option active" data-sound="whiteNoise">Белый шум</button>
                    <button class="sound-option" data-sound="cafe">Кафе</button>
                    <button class="sound-option" data-sound="rain">Дождь</button>
                    <button class="sound-option" data-sound="focus">Фокус</button>
                </div>
                <div class="volume-control">
                    <input type="range" id="volumeSlider" min="0" max="100" value="30">
                </div>
            </div>
        `;
        
        document.body.appendChild(soundPanel);
    }
    
    setupEventListeners() {
        const soundToggle = document.getElementById('soundToggle');
        const soundOptions = document.querySelectorAll('.sound-option');
        const volumeSlider = document.getElementById('volumeSlider');
        
        soundToggle.addEventListener('click', () => {
            this.toggleSound();
        });
        
        soundOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                this.selectSound(e.target.dataset.sound);
            });
        });
        
        volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            window.soundManager.setVolume(volume);
        });
    }
    
    toggleSound() {
        this.isEnabled = !this.isEnabled;
        const toggle = document.getElementById('soundToggle');
        
        if (this.isEnabled) {
            window.soundManager.playSound(this.currentSoundType);
            toggle.classList.add('active');
        } else {
            window.soundManager.stopSound();
            toggle.classList.remove('active');
        }
    }
    
    selectSound(soundType) {
        this.currentSoundType = soundType;
        
        // Обновляем активную кнопку
        document.querySelectorAll('.sound-option').forEach(option => {
            option.classList.remove('active');
        });
        document.querySelector(`[data-sound="${soundType}"]`).classList.add('active');
        
        // Если звук включен, переключаем на новый
        if (this.isEnabled) {
            window.soundManager.playSound(soundType);
        }
    }
}

// Инициализация UI звуков
document.addEventListener('DOMContentLoaded', () => {
    new SoundUI();
});

// Добавляем стили для панели звуков
const soundStyles = `
.sound-panel {
    position: fixed;
    top: 80px;
    right: 20px;
    z-index: 1000;
    background: rgba(15, 15, 35, 0.9);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 12px;
    padding: 1rem;
    backdrop-filter: blur(20px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    transform: translateX(100%);
    transition: transform 0.3s ease;
}

.sound-panel.show {
    transform: translateX(0);
}

.sound-controls {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    align-items: center;
}

.sound-toggle {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(99, 102, 241, 0.2);
    color: #e2e8f0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
}

.sound-toggle:hover,
.sound-toggle.active {
    background: linear-gradient(135deg, #6366f1, #a855f7);
    color: #fff;
    border-color: rgba(99, 102, 241, 0.5);
}

.sound-options {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.sound-option {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 8px;
    color: #e2e8f0;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;
}

.sound-option:hover,
.sound-option.active {
    background: linear-gradient(135deg, #6366f1, #a855f7);
    color: #fff;
    border-color: rgba(99, 102, 241, 0.5);
}

.volume-control {
    width: 100%;
}

.volume-control input[type="range"] {
    width: 100%;
    height: 4px;
    border-radius: 2px;
    background: rgba(30, 41, 59, 0.6);
    outline: none;
    -webkit-appearance: none;
}

.volume-control input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366f1, #a855f7);
    cursor: pointer;
}

.volume-control input[type="range"]::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366f1, #a855f7);
    cursor: pointer;
    border: none;
}
`;

// Добавляем стили в документ
const styleSheet = document.createElement('style');
styleSheet.textContent = soundStyles;
document.head.appendChild(styleSheet);
