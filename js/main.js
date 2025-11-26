/**
 * main.js
 * Ponto de entrada principal da simulação
 * Inicializa e orquestra todos os sistemas
 */

class Simulation {
    constructor() {
        // Estado
        this.isRunning = false;
        this.isPaused = false;
        this.frameCount = 0;
        this.lastFrameTime = 0;
        this.fps = 0;
        this.currentStrategy = 'direct';
        
        // Canvas e renderização
        this.canvas = document.getElementById('simulationCanvas');
        this.renderer = new Renderer(this.canvas);
        this.uiRenderer = new UIRenderer();
        
        // Sistemas
        this.physicsEngine = new PhysicsEngine();
        this.detectionSystem = new DetectionSystem();
        this.collisionDetector = new CollisionDetector();
        this.statsTracker = new StatsTracker();
        this.dataExporter = new DataExporter();
        
        // Agentes
        this.ligeirinho = null;
        this.frajola = null;
        
        // Estado de captura
        this.captureInProgress = false;
        this.escapeInProgress = false;
        
        // Áudio
        this.themeSong = new Audio('./assets/theme.mp3');
        this.themeSong.loop = true;
        this.themeSong.volume = 0.5; // Volume a 50%
        
        // Estratégias
        this.strategies = {
            direct: new DirectStrategy(),
            predictive: new PredictiveStrategy(),
            patrol: new PatrolStrategy()
        };
        
        // Configurações
        this.config = {
            targetSpeed: CONFIG.target.defaultSpeed,
            chaserSpeed: CONFIG.chaser.defaultSpeed,
            detectionSensitivity: CONFIG.detection.baseSensitivity,
            fps: CONFIG.simulation.defaultFPS
        };
        
        logger.info('Simulação inicializada');
        
        // Inicializar
        this.init();
    }

    /**
     * Inicializa a simulação
     */
    init() {
        // Criar agentes
        this.createAgents();
        
        // Configurar estratégia inicial
        this.setStrategy(this.currentStrategy);
        
        // Inicializar UI
        this.setupUI();
        
        // Renderizar frame inicial
        this.renderer.render(this.ligeirinho, this.frajola, this.detectionSystem);
        
        logger.info('Simulação pronta para iniciar');
    }

    /**
     * Cria os agentes
     */
    createAgents() {
        // Criar Ligeirinho
        this.ligeirinho = new Ligeirinho(0, 0, this.config.targetSpeed);
        this.ligeirinho.spawnAtRandomEdge(CONFIG.canvas.width, CONFIG.canvas.height);
        
        // Criar Frajola
        this.frajola = new Frajola(
            CONFIG.chaser.startX,
            CONFIG.chaser.startY,
            this.config.chaserSpeed
        );
        this.frajola.setTarget(this.ligeirinho);
        
        logger.info('Agentes criados');
    }

    /**
     * Configura a interface do usuário
     */
    setupUI() {
        // Inicializar listeners de sliders
        this.uiRenderer.initializeSliderListeners();
        
        // Botão Play/Pause
        const playPauseBtn = document.getElementById('playPauseBtn');
        playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        
        // Botão Reset
        const resetBtn = document.getElementById('resetBtn');
        resetBtn.addEventListener('click', () => this.reset());
        
        // Botão Config
        const configBtn = document.getElementById('configBtn');
        let configOpen = false;
        configBtn.addEventListener('click', () => {
            configOpen = !configOpen;
            this.uiRenderer.toggleConfigPanel(configOpen);
        });
        
        // Botão Export
        const exportBtn = document.getElementById('exportBtn');
        exportBtn.addEventListener('click', () => this.exportData());
        
        // Seletor de estratégia
        const strategySelect = document.getElementById('strategySelect');
        strategySelect.addEventListener('change', (e) => {
            this.setStrategy(e.target.value);
        });
        
        // Sliders de configuração
        this.setupConfigSliders();
        
        // Tecla de debug (D)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'd' || e.key === 'D') {
                CONFIG.simulation.debug = !CONFIG.simulation.debug;
                logger.setDebugMode(CONFIG.simulation.debug);
                this.uiRenderer.toggleDebugPanel(CONFIG.simulation.debug);
            }
        });
        
        logger.info('Interface configurada');
    }

    /**
     * Configura listeners dos sliders
     */
    setupConfigSliders() {
        // Target Speed
        const targetSpeedSlider = document.getElementById('targetSpeedSlider');
        targetSpeedSlider.addEventListener('change', (e) => {
            this.config.targetSpeed = parseInt(e.target.value);
            if (this.ligeirinho) {
                this.ligeirinho.maxSpeed = this.config.targetSpeed;
            }
            logger.info('Velocidade do Ligeirinho alterada', { speed: this.config.targetSpeed });
        });
        
        // Chaser Speed
        const chaserSpeedSlider = document.getElementById('chaserSpeedSlider');
        chaserSpeedSlider.addEventListener('change', (e) => {
            this.config.chaserSpeed = parseInt(e.target.value);
            if (this.frajola) {
                this.frajola.maxSpeed = this.config.chaserSpeed;
            }
            logger.info('Velocidade do Frajola alterada', { speed: this.config.chaserSpeed });
        });
        
        // Detection Sensitivity
        const detectionSlider = document.getElementById('detectionSlider');
        detectionSlider.addEventListener('change', (e) => {
            this.config.detectionSensitivity = parseFloat(e.target.value) / 100;
            this.detectionSystem.setSensitivity(this.config.detectionSensitivity);
            logger.info('Sensibilidade de detecção alterada', { 
                sensitivity: this.config.detectionSensitivity 
            });
        });
        
        // FPS
        const fpsSlider = document.getElementById('fpsSlider');
        fpsSlider.addEventListener('change', (e) => {
            this.config.fps = parseInt(e.target.value);
            logger.info('FPS alterado', { fps: this.config.fps });
        });
    }

    /**
     * Define a estratégia de perseguição
     * @param {string} strategyName - Nome da estratégia
     */
    setStrategy(strategyName) {
        const strategy = this.strategies[strategyName];
        
        if (!strategy) {
            logger.error('Estratégia não encontrada', { strategyName });
            return;
        }
        
        this.currentStrategy = strategyName;
        this.frajola.setStrategy(strategy);
        this.uiRenderer.updateStrategyDescription(strategyName);
        
        logger.strategy(`Estratégia alterada para: ${strategyName}`);
    }

    /**
     * Alterna entre play e pause
     */
    togglePlayPause() {
        if (!this.isRunning) {
            this.start();
        } else {
            this.pause();
        }
    }

    /**
     * Inicia a simulação
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.isPaused = false;
        this.statsTracker.startAttempt();
        this.uiRenderer.updatePlayPauseButton(true);
        
        // Tocar música tema
        if (this.themeSong.paused) {
            this.themeSong.currentTime = 0;
            this.themeSong.play().catch(err => {
                logger.warn('Erro ao tocar música tema', err.message);
            });
        }
        
        this.lastFrameTime = performance.now();
        this.loop();
        
        logger.info('Simulação iniciada');
    }

    /**
     * Pausa a simulação
     */
    pause() {
        this.isPaused = true;
        this.isRunning = false;
        this.uiRenderer.updatePlayPauseButton(false);
        
        // Pausar música
        this.themeSong.pause();
        
        // Desenhar indicador de pausa
        this.renderer.drawPauseIndicator();
        
        logger.info('Simulação pausada');
    }

    /**
     * Reseta a simulação
     */
    reset() {
        this.pause();
        
        // Parar música
        this.themeSong.currentTime = 0;
        this.themeSong.pause();
        
        // Resetar agentes
        this.createAgents();
        
        // Resetar estatísticas
        this.statsTracker.reset();
        
        // Resetar sistemas
        this.detectionSystem.reset();
        this.collisionDetector.reset();
        
        // Atualizar UI
        this.uiRenderer.updateStats(this.statsTracker.getStats());
        
        // Renderizar
        this.renderer.render(this.ligeirinho, this.frajola, this.detectionSystem);
        
        logger.info('Simulação resetada');
    }

    /**
     * Loop principal da simulação
     */
    loop() {
        if (!this.isRunning) return;
        
        // Calcular deltaTime
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;
        
        // Calcular FPS
        this.fps = Math.round(1 / deltaTime);
        
        // Atualizar
        this.update(deltaTime);
        
        // Renderizar
        this.render();
        
        // Próximo frame
        requestAnimationFrame(() => this.loop());
        
        this.frameCount++;
    }

    /**
     * Atualiza a lógica da simulação
     * @param {number} deltaTime - Tempo desde último frame
     */
    update(deltaTime) {
        // Se está em captura ou fuga, não atualizar física
        if (this.captureInProgress || this.escapeInProgress) {
            return;
        }

        // Usar deltaTime fixo para simulação consistente
        const fixedDelta = 1.0;
        
        // Atualizar Frajola
        this.frajola.update(fixedDelta, this.detectionSystem);
        
        // Atualizar Ligeirinho
        this.ligeirinho.update(fixedDelta);
        
        // Manter Frajola dentro dos limites
        this.physicsEngine.constrainToBounds(this.frajola);
        
        // Verificar captura
        const captured = this.collisionDetector.checkCapture(this.frajola, this.ligeirinho);
        
        if (captured) {
            this.captureInProgress = true;
            this.handleCapture();
            return;
        }
        
        // Verificar se Ligeirinho escapou
        const escaped = this.ligeirinho.hasEscaped(
            CONFIG.canvas.width,
            CONFIG.canvas.height,
            CONFIG.physics.boundaryMargin
        );
        
        if (escaped) {
            this.escapeInProgress = true;
            this.handleEscape();
            return;
        }
        
        // Atualizar UI periodicamente
        if (this.frameCount % 10 === 0) {
            this.updateUI();
        }
    }

    /**
     * Renderiza a simulação
     */
    render() {
        this.renderer.render(
            this.ligeirinho,
            this.frajola,
            this.detectionSystem,
            this.captureInProgress
        );
        
        // Desenhar FPS em modo debug
        if (CONFIG.simulation.debug) {
            this.renderer.drawFPS(this.fps);
            this.updateDebugInfo();
        }
    }

    /**
     * Manipula captura bem-sucedida
     */
    handleCapture() {
        logger.info('🎯 CAPTURA!');
        
        // Registrar captura
        this.statsTracker.recordCapture({
            strategy: this.currentStrategy,
            targetSpeed: this.config.targetSpeed,
            chaserSpeed: this.config.chaserSpeed,
            detectionSensitivity: this.config.detectionSensitivity,
            distance: this.frajola.distanceTo(this.ligeirinho)
        });
        
        // Atualizar UI
        this.updateUI();
        
        // Reiniciar após delay
        setTimeout(() => {
            this.createAgents();
            this.setStrategy(this.currentStrategy);
            this.statsTracker.startAttempt();
            this.captureInProgress = false;
        }, CONFIG.simulation.captureDelay);
    }

    /**
     * Manipula fuga do alvo
     */
    handleEscape() {
        logger.info('💨 Ligeirinho escapou!');
        
        // Registrar fuga
        this.statsTracker.recordEscape({
            strategy: this.currentStrategy,
            targetSpeed: this.config.targetSpeed,
            chaserSpeed: this.config.chaserSpeed,
            detectionSensitivity: this.config.detectionSensitivity
        });
        
        // Atualizar UI
        this.updateUI();
        
        // Reiniciar
        setTimeout(() => {
            this.createAgents();
            this.setStrategy(this.currentStrategy);
            this.statsTracker.startAttempt();
            this.escapeInProgress = false;
        }, 500); // Pequeno delay para visualização
    }

    /**
     * Atualiza interface do usuário
     */
    updateUI() {
        const stats = this.statsTracker.getStats();
        this.uiRenderer.updateStats(stats);
        this.uiRenderer.updateDetectionStatus(this.frajola.targetDetected);
    }

    /**
     * Atualiza informações de debug
     */
    updateDebugInfo() {
        const debugInfo = {
            FPS: this.fps,
            Frame: this.frameCount,
            Strategy: this.currentStrategy,
            Target: this.ligeirinho.getDebugInfo(),
            Chaser: this.frajola.getDebugInfo(),
            Detection: this.detectionSystem.getDebugInfo(),
            Physics: this.physicsEngine.getDebugInfo()
        };
        
        this.uiRenderer.updateDebugInfo(debugInfo);
    }

    /**
     * Exporta dados
     */
    exportData() {
        const format = prompt('Formato de exportação (json/csv/html):', 'json');
        
        if (!format) return;
        
        if (format.toLowerCase() === 'html') {
            this.dataExporter.exportHTMLReport(this.statsTracker);
        } else {
            this.dataExporter.export(this.statsTracker, format);
        }
        
        this.uiRenderer.showNotification(`Dados exportados em ${format.toUpperCase()}!`, 'success');
    }
}

// Inicializar simulação quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    logger.info('DOM carregado, iniciando aplicação');
    
    // Criar instância global da simulação
    window.simulation = new Simulation();
    
    logger.info('Aplicação pronta! Pressione "Iniciar" para começar.');
    logger.info('Pressione "D" para ativar modo debug.');
});

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Simulation;
}