// Система уведомлений
class NotificationManager {
    constructor() {
        this.permission = 'default';
        this.sounds = {
            timerEnd: null,
            breakStart: null,
            workStart: null
        };
        
        this.init();
    }
    
    async init() {
        // Запрашиваем разрешение на уведомления
        if ('Notification' in window) {
            this.permission = Notification.permission;
            if (this.permission === 'default') {
                this.permission = await Notification.requestPermission();
            }
        }
        
        // Создаем звуки уведомлений
        this.createNotificationSounds();
    }
    
    createNotificationSounds() {
        // Создаем простые звуки уведомлений с помощью Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Звук окончания таймера
            this.sounds.timerEnd = this.createBeepSound(audioContext, 800, 0.5);
            
            // Звук начала перерыва
            this.sounds.breakStart = this.createBeepSound(audioContext, 600, 0.3);
            
            // Звук начала работы
            this.sounds.workStart = this.createBeepSound(audioContext, 1000, 0.3);
            
        } catch (error) {
            console.log('Web Audio API не поддерживается для звуков уведомлений');
        }
    }
    
    createBeepSound(audioContext, frequency, duration) {
        return () => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        };
    }
    
    showNotification(title, body, options = {}) {
        if (this.permission === 'granted') {
            const notification = new Notification(title, {
                body: body,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: options.tag || 'timer',
                requireInteraction: options.requireInteraction || false,
                silent: options.silent || false,
                ...options
            });
            
            // Автоматически закрываем уведомление через 5 секунд
            setTimeout(() => {
                notification.close();
            }, 5000);
            
            return notification;
        } else {
            // Fallback: показываем встроенное уведомление
            this.showInAppNotification(title, body, options);
        }
    }
    
    showInAppNotification(title, body, options = {}) {
        const notification = document.createElement('div');
        notification.className = 'in-app-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">${options.icon || '⏰'}</div>
                <div class="notification-text">
                    <div class="notification-title">${title}</div>
                    <div class="notification-body">${body}</div>
                </div>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Анимация появления
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Обработчик закрытия
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.closeInAppNotification(notification);
        });
        
        // Автоматическое закрытие
        setTimeout(() => {
            this.closeInAppNotification(notification);
        }, options.duration || 5000);
        
        return notification;
    }
    
    closeInAppNotification(notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
    
    playNotificationSound(soundType) {
        if (this.sounds[soundType]) {
            this.sounds[soundType]();
        }
    }
    
    // Специфичные методы для таймера
    notifyTimerEnd() {
        this.showNotification(
            'Таймер завершен!',
            'Время работы истекло. Пора сделать перерыв!',
            {
                tag: 'timer-end',
                requireInteraction: true,
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%236366f1"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'
            }
        );
        this.playNotificationSound('timerEnd');
    }
    
    notifyBreakStart() {
        this.showNotification(
            'Время перерыва!',
            'Отлично поработали! Теперь отдохните 5-15 минут.',
            {
                tag: 'break-start',
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23f59e0b"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'
            }
        );
        this.playNotificationSound('breakStart');
    }
    
    notifyWorkStart() {
        this.showNotification(
            'Время работать!',
            'Перерыв окончен. Возвращайтесь к работе!',
            {
                tag: 'work-start',
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2310b981"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>'
            }
        );
        this.playNotificationSound('workStart');
    }
    
    notifyTaskCompleted(taskName) {
        this.showNotification(
            'Задача выполнена!',
            `"${taskName}" завершена. Отличная работа!`,
            {
                tag: 'task-completed',
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2310b981"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>'
            }
        );
    }
    
    notifyLevelUp(level) {
        this.showNotification(
            'Повышение уровня!',
            `Поздравляем! Вы достигли ${level} уровня!`,
            {
                tag: 'level-up',
                requireInteraction: true,
                duration: 8000,
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23a855f7"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>'
            }
        );
    }
}

// Глобальный экземпляр менеджера уведомлений
window.notificationManager = new NotificationManager();

// Стили для встроенных уведомлений
const notificationStyles = `
.in-app-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    background: rgba(15, 15, 35, 0.95);
    border: 1px solid rgba(99, 102, 241, 0.3);
    border-radius: 12px;
    padding: 1rem;
    backdrop-filter: blur(20px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    max-width: 350px;
    transform: translateX(100%);
    transition: transform 0.3s ease;
}

.in-app-notification.show {
    transform: translateX(0);
}

.notification-content {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
}

.notification-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
}

.notification-text {
    flex: 1;
}

.notification-title {
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
    margin-bottom: 0.25rem;
}

.notification-body {
    font-size: 0.875rem;
    color: #e2e8f0;
    line-height: 1.4;
}

.notification-close {
    background: none;
    border: none;
    color: #94a3b8;
    font-size: 1.25rem;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s ease;
}

.notification-close:hover {
    background: rgba(99, 102, 241, 0.1);
    color: #6366f1;
}

@media (max-width: 600px) {
    .in-app-notification {
        top: 10px;
        right: 10px;
        left: 10px;
        max-width: none;
        transform: translateY(-100%);
    }
    
    .in-app-notification.show {
        transform: translateY(0);
    }
}
`;

// Добавляем стили в документ
const notificationStyleSheet = document.createElement('style');
notificationStyleSheet.textContent = notificationStyles;
document.head.appendChild(notificationStyleSheet);
