/**
 * config.js
 * Configurações centralizadas da simulação
 * Todos os parâmetros ajustáveis em um único local
 */

const CONFIG = {
    // Canvas
    canvas: {
        width: 1400,
        height: 900,
        backgroundColor: '#1f2937',
        gridColor: '#374151',
        gridSize: 50
    },

    // Ligeirinho (Alvo)
    target: {
        size: 80,
        color: '#ef4444',
        velocityColor: '#ef4444',
        speedMin: 8,
        speedMax: 15,
        defaultSpeed: 8,
        // Porcentagem do tamanho em relação ao canvas
        sizePercentage: 2.5
    },

    // Frajola (Perseguidor)
    chaser: {
        size: 150,
        color: '#3b82f6',
        velocityColor: '#3b82f6',
        speedMin: 3,
        speedMax: 15,
        defaultSpeed: 9,
        detectionRadius: 300,
        startX: 700, // Centro do canvas
        startY: 450
    },

    // Sistema de Detecção
    detection: {
        baseSensitivity: 0.9,
        minSensitivity: 0.3,
        maxSensitivity: 1.5,
        detectedColor: '#22c55e40',
        lostColor: '#ef444440',
        lineColor: '#fbbf2480',
        lineWidth: 2,
        lineDash: [5, 5]
    },

    // Sistema de Física
    physics: {
        captureDistance: 60,
        boundaryMargin: 100,
        friction: 0.98,
        maxVelocity: 20
    },

    // Simulação
    simulation: {
        defaultFPS: 60,
        minFPS: 30,
        maxFPS: 120,
        captureDelay: 2000, // ms antes de reiniciar após captura
        debug: false
    },

    // Estratégias
    strategies: {
        direct: {
            name: 'Perseguição Direta',
            description: 'Move diretamente em direção ao alvo atual'
        },
        predictive: {
            name: 'Perseguição Preditiva',
            description: 'Prevê a posição futura do alvo e intercepta',
            lookahead: 10 // frames à frente
        },
        patrol: {
            name: 'Patrulha + Perseguição',
            description: 'Patrulha área quando não detecta, persegue quando detecta',
            patrolSpeed: 0.5, // multiplicador da velocidade
            patrolRadius: 100,
            patrolAngularSpeed: 0.05
        }
    },

    // Visualização
    visualization: {
        showVelocityVectors: true,
        velocityVectorScale: 3,
        velocityVectorWidth: 3,
        showDetectionRadius: true,
        showPursuitLine: true,
        showGrid: true,
        captureFlashDuration: 1000 // ms
    },

    // Analytics
    analytics: {
        trackHistory: true,
        historyMaxLength: 1000,
        exportFormat: 'json' // 'json' ou 'csv'
    },

    // UI
    ui: {
        updateInterval: 100, // ms
        animationDuration: 300,
        successColor: '#22c55e',
        warningColor: '#fbbf24',
        dangerColor: '#ef4444'
    }
};

/**
 * Valida as configurações
 * @returns {boolean} True se configurações são válidas
 */
function validateConfig() {
    try {
        // Validar dimensões do canvas
        if (CONFIG.canvas.width <= 0 || CONFIG.canvas.height <= 0) {
            throw new Error('Dimensões do canvas inválidas');
        }

        // Validar tamanhos dos agentes
        if (CONFIG.target.size <= 0 || CONFIG.chaser.size <= 0) {
            throw new Error('Tamanhos dos agentes inválidos');
        }

        // Validar velocidades
        if (CONFIG.target.defaultSpeed <= 0 || CONFIG.chaser.defaultSpeed <= 0) {
            throw new Error('Velocidades inválidas');
        }

        // Validar FPS
        if (CONFIG.simulation.defaultFPS < CONFIG.simulation.minFPS ||
            CONFIG.simulation.defaultFPS > CONFIG.simulation.maxFPS) {
            throw new Error('FPS fora do intervalo permitido');
        }

        logger.info('Configurações validadas com sucesso');
        return true;
    } catch (error) {
        logger.error('Erro na validação de configurações', error.message);
        return false;
    }
}

/**
 * Atualiza uma configuração dinamicamente
 * @param {string} path - Caminho da configuração (ex: 'target.speed')
 * @param {*} value - Novo valor
 */
function updateConfig(path, value) {
    const keys = path.split('.');
    let obj = CONFIG;
    
    for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) {
            logger.warn(`Caminho de configuração inválido: ${path}`);
            return false;
        }
        obj = obj[keys[i]];
    }
    
    const lastKey = keys[keys.length - 1];
    const oldValue = obj[lastKey];
    obj[lastKey] = value;
    
    logger.debug(`Configuração atualizada: ${path}`, { 
        old: oldValue, 
        new: value 
    });
    
    return true;
}

/**
 * Retorna uma cópia profunda das configurações
 * @returns {Object} Cópia das configurações
 */
function getConfig() {
    return JSON.parse(JSON.stringify(CONFIG));
}

/**
 * Reseta configurações para valores padrão
 */
function resetConfig() {
    updateConfig('target.defaultSpeed', CONFIG.target.speedMin + 
        (CONFIG.target.speedMax - CONFIG.target.speedMin) * 0.4);
    updateConfig('chaser.defaultSpeed', CONFIG.chaser.speedMin + 
        (CONFIG.chaser.speedMax - CONFIG.chaser.speedMin) * 0.5);
    updateConfig('detection.baseSensitivity', 0.8);
    updateConfig('simulation.defaultFPS', 60);
    
    logger.info('Configurações resetadas para valores padrão');
}

/**
 * Exporta configurações como JSON
 * @returns {string} JSON das configurações
 */
function exportConfig() {
    return JSON.stringify(CONFIG, null, 2);
}

/**
 * Importa configurações de JSON
 * @param {string} jsonString - String JSON com configurações
 * @returns {boolean} True se importação foi bem-sucedida
 */
function importConfig(jsonString) {
    try {
        const newConfig = JSON.parse(jsonString);
        Object.assign(CONFIG, newConfig);
        
        if (validateConfig()) {
            logger.info('Configurações importadas com sucesso');
            return true;
        }
        return false;
    } catch (error) {
        logger.error('Erro ao importar configurações', error.message);
        return false;
    }
}

// Validar configurações ao carregar
validateConfig();

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CONFIG,
        validateConfig,
        updateConfig,
        getConfig,
        resetConfig,
        exportConfig,
        importConfig
    };
}