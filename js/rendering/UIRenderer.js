/**
 * UIRenderer.js
 * Gerencia atualização da interface do usuário
 * Sincroniza dados da simulação com elementos DOM
 */

class UIRenderer {
    /**
     * Cria um novo UI renderer
     */
    constructor() {
        this.elements = this.cacheElements();
        this.updateInterval = CONFIG.ui.updateInterval;
        this.lastUpdate = 0;
        
        logger.info('UI Renderer inicializado');
    }

    /**
     * Cacheia referências aos elementos DOM
     * @returns {Object} Mapa de elementos
     */
    cacheElements() {
        return {
            // Estatísticas
            statAttempts: document.getElementById('statAttempts'),
            statCaptures: document.getElementById('statCaptures'),
            statSuccessRate: document.getElementById('statSuccessRate'),
            statAvgTime: document.getElementById('statAvgTime'),
            statCurrentTime: document.getElementById('statCurrentTime'),
            detectionStatus: document.getElementById('detectionStatus'),
            
            // Controles
            playPauseBtn: document.getElementById('playPauseBtn'),
            playPauseIcon: document.getElementById('playPauseIcon'),
            playPauseText: document.getElementById('playPauseText'),
            resetBtn: document.getElementById('resetBtn'),
            configBtn: document.getElementById('configBtn'),
            exportBtn: document.getElementById('exportBtn'),
            
            // Configurações
            configPanel: document.getElementById('configPanel'),
            strategySelect: document.getElementById('strategySelect'),
            strategyDescription: document.getElementById('strategyDescription'),
            
            // Sliders
            targetSpeedSlider: document.getElementById('targetSpeedSlider'),
            targetSpeedValue: document.getElementById('targetSpeedValue'),
            chaserSpeedSlider: document.getElementById('chaserSpeedSlider'),
            chaserSpeedValue: document.getElementById('chaserSpeedValue'),
            detectionSlider: document.getElementById('detectionSlider'),
            detectionValue: document.getElementById('detectionValue'),
            fpsSlider: document.getElementById('fpsSlider'),
            fpsValue: document.getElementById('fpsValue'),
            
            // Debug
            debugPanel: document.getElementById('debugPanel'),
            debugContent: document.getElementById('debugContent')
        };
    }

    /**
     * Atualiza estatísticas na interface
     * @param {Object} stats - Estatísticas da simulação
     */
    updateStats(stats) {
        const now = Date.now();
        
        // Throttle de atualizações
        if (now - this.lastUpdate < this.updateInterval) {
            return;
        }
        
        this.lastUpdate = now;

        // Atualizar valores
        this.setText(this.elements.statAttempts, stats.attempts);
        this.setText(this.elements.statCaptures, stats.captures);
        this.setText(this.elements.statSuccessRate, 
            stats.attempts > 0 ? 
            `${((stats.captures / stats.attempts) * 100).toFixed(1)}%` : 
            '0%'
        );
        this.setText(this.elements.statAvgTime, `${stats.avgTime.toFixed(2)}s`);
        this.setText(this.elements.statCurrentTime, `${stats.currentTime.toFixed(2)}s`);

        // Animação de atualização
        this.flashElement(this.elements.statCurrentTime);
    }

    /**
     * Atualiza status de detecção
     * @param {boolean} detected - Se alvo está detectado
     */
    updateDetectionStatus(detected) {
        const statusElement = this.elements.detectionStatus;
        const indicator = statusElement.querySelector('.status-indicator');
        const text = statusElement.querySelector('.status-text');

        if (detected) {
            indicator.classList.add('detected');
            indicator.classList.remove('lost');
            text.textContent = '✓ Alvo Detectado';
        } else {
            indicator.classList.remove('detected');
            indicator.classList.add('lost');
            text.textContent = '⚠ Alvo Perdido';
        }
    }

    /**
     * Atualiza estado do botão play/pause
     * @param {boolean} isPlaying - Se simulação está rodando
     */
    updatePlayPauseButton(isPlaying) {
        if (isPlaying) {
            this.elements.playPauseIcon.textContent = '⏸';
            this.elements.playPauseText.textContent = 'Pausar';
        } else {
            this.elements.playPauseIcon.textContent = '▶';
            this.elements.playPauseText.textContent = 'Iniciar';
        }
    }

    /**
     * Atualiza descrição da estratégia
     * @param {string} strategyName - Nome da estratégia
     */
    updateStrategyDescription(strategyName) {
        const descriptions = {
            direct: 'Move diretamente em direção ao alvo atual',
            predictive: 'Prevê a posição futura do alvo e intercepta',
            patrol: 'Patrulha área quando não detecta, persegue quando detecta'
        };

        const description = descriptions[strategyName] || 'Estratégia desconhecida';
        
        // Animação de transição
        this.elements.strategyDescription.style.opacity = '0';
        
        setTimeout(() => {
            this.elements.strategyDescription.textContent = description;
            this.elements.strategyDescription.style.opacity = '1';
        }, 150);
    }

    /**
     * Atualiza valor de slider
     * @param {HTMLInputElement} slider - Elemento slider
     * @param {HTMLElement} valueDisplay - Elemento para mostrar valor
     * @param {string} suffix - Sufixo (ex: 'px/frame', '%')
     */
    updateSliderValue(slider, valueDisplay, suffix = '') {
        const value = slider.value;
        valueDisplay.textContent = value + suffix;
    }

    /**
     * Mostra/esconde painel de configuração
     * @param {boolean} show - Se deve mostrar
     */
    toggleConfigPanel(show) {
        this.elements.configPanel.style.display = show ? 'block' : 'none';
    }

    /**
     * Mostra/esconde painel de debug
     * @param {boolean} show - Se deve mostrar
     */
    toggleDebugPanel(show) {
        this.elements.debugPanel.style.display = show ? 'block' : 'none';
    }

    /**
     * Atualiza conteúdo de debug
     * @param {Object} debugInfo - Informações de debug
     */
    updateDebugInfo(debugInfo) {
        if (!this.elements.debugContent) return;

        const lines = [];
        
        for (const [key, value] of Object.entries(debugInfo)) {
            if (typeof value === 'object') {
                lines.push(`${key}:`);
                for (const [subKey, subValue] of Object.entries(value)) {
                    lines.push(`  ${subKey}: ${subValue}`);
                }
            } else {
                lines.push(`${key}: ${value}`);
            }
        }

        this.elements.debugContent.textContent = lines.join('\n');
    }

    /**
     * Mostra notificação
     * @param {string} message - Mensagem
     * @param {string} type - Tipo ('success', 'warning', 'error')
     */
    showNotification(message, type = 'info') {
        // Criar elemento de notificação
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            border-radius: 8px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Remover após 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    /**
     * Define texto de um elemento
     * @param {HTMLElement} element - Elemento
     * @param {string|number} text - Texto
     */
    setText(element, text) {
        if (element) {
            element.textContent = text;
        }
    }

    /**
     * Adiciona efeito de flash a um elemento
     * @param {HTMLElement} element - Elemento
     */
    flashElement(element) {
        if (!element) return;

        element.classList.add('flash');
        setTimeout(() => {
            element.classList.remove('flash');
        }, 500);
    }

    /**
     * Ativa/desativa botão
     * @param {HTMLButtonElement} button - Botão
     * @param {boolean} enabled - Se deve estar ativo
     */
    setButtonEnabled(button, enabled) {
        if (!button) return;

        button.disabled = !enabled;
        button.style.opacity = enabled ? '1' : '0.5';
        button.style.cursor = enabled ? 'pointer' : 'not-allowed';
    }

    /**
     * Inicializa event listeners dos sliders
     */
    initializeSliderListeners() {
        // Target Speed
        if (this.elements.targetSpeedSlider) {
            this.elements.targetSpeedSlider.addEventListener('input', (e) => {
                this.updateSliderValue(e.target, this.elements.targetSpeedValue, 'px/frame');
            });
        }

        // Chaser Speed
        if (this.elements.chaserSpeedSlider) {
            this.elements.chaserSpeedSlider.addEventListener('input', (e) => {
                this.updateSliderValue(e.target, this.elements.chaserSpeedValue, 'px/frame');
            });
        }

        // Detection Sensitivity
        if (this.elements.detectionSlider) {
            this.elements.detectionSlider.addEventListener('input', (e) => {
                this.updateSliderValue(e.target, this.elements.detectionValue, '%');
            });
        }

        // FPS
        if (this.elements.fpsSlider) {
            this.elements.fpsSlider.addEventListener('input', (e) => {
                this.updateSliderValue(e.target, this.elements.fpsValue, ' FPS');
            });
        }
    }

    /**
     * Obtém valores atuais dos sliders de configuração
     * @returns {Object} Configurações
     */
    getConfigValues() {
        return {
            targetSpeed: parseInt(this.elements.targetSpeedSlider?.value || CONFIG.target.defaultSpeed),
            chaserSpeed: parseInt(this.elements.chaserSpeedSlider?.value || CONFIG.chaser.defaultSpeed),
            detectionSensitivity: parseFloat(this.elements.detectionSlider?.value || 80) / 100,
            fps: parseInt(this.elements.fpsSlider?.value || CONFIG.simulation.defaultFPS)
        };
    }

    /**
     * Define valores dos sliders de configuração
     * @param {Object} config - Configurações
     */
    setConfigValues(config) {
        if (config.targetSpeed && this.elements.targetSpeedSlider) {
            this.elements.targetSpeedSlider.value = config.targetSpeed;
            this.updateSliderValue(this.elements.targetSpeedSlider, 
                this.elements.targetSpeedValue, 'px/frame');
        }

        if (config.chaserSpeed && this.elements.chaserSpeedSlider) {
            this.elements.chaserSpeedSlider.value = config.chaserSpeed;
            this.updateSliderValue(this.elements.chaserSpeedSlider, 
                this.elements.chaserSpeedValue, 'px/frame');
        }

        if (config.detectionSensitivity && this.elements.detectionSlider) {
            this.elements.detectionSlider.value = config.detectionSensitivity * 100;
            this.updateSliderValue(this.elements.detectionSlider, 
                this.elements.detectionValue, '%');
        }

        if (config.fps && this.elements.fpsSlider) {
            this.elements.fpsSlider.value = config.fps;
            this.updateSliderValue(this.elements.fpsSlider, 
                this.elements.fpsValue, ' FPS');
        }
    }

    /**
     * Retorna informações de debug
     * @returns {Object} Informações do UI renderer
     */
    getDebugInfo() {
        return {
            updateInterval: this.updateInterval,
            lastUpdate: this.lastUpdate,
            elementsCount: Object.keys(this.elements).length
        };
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIRenderer;
}