/**
 * StatsTracker.js
 * Rastreia e calcula estatísticas da simulação
 * Gerencia métricas de performance e resultados
 */

class StatsTracker {
    /**
     * Cria um novo rastreador de estatísticas
     */
    constructor() {
        this.attempts = 0;
        this.captures = 0;
        this.captureTimes = [];
        this.escapeTimes = [];
        this.currentAttemptStartTime = 0;
        this.totalSimulationTime = 0;
        this.sessionStartTime = Date.now();
        
        // Histórico detalhado
        this.attemptHistory = [];
        this.maxHistoryLength = CONFIG.analytics.historyMaxLength || 1000;
        
        logger.info('Stats Tracker inicializado');
    }

    /**
     * Inicia uma nova tentativa
     */
    startAttempt() {
        this.currentAttemptStartTime = performance.now();
        this.attempts++;
        
        logger.info(`Tentativa #${this.attempts} iniciada`);
    }

    /**
     * Registra uma captura bem-sucedida
     * @param {Object} details - Detalhes da captura
     */
    recordCapture(details = {}) {
        const captureTime = this.getCurrentAttemptTime();
        this.captures++;
        this.captureTimes.push(captureTime);
        
        // Registrar no histórico
        const record = {
            type: 'capture',
            attemptNumber: this.attempts,
            timestamp: Date.now(),
            duration: captureTime,
            strategy: details.strategy || 'unknown',
            targetSpeed: details.targetSpeed || 0,
            chaserSpeed: details.chaserSpeed || 0,
            detectionSensitivity: details.detectionSensitivity || 0,
            distance: details.distance || 0
        };
        
        this.attemptHistory.push(record);
        this.trimHistory();
        
        logger.info(`Captura #${this.captures} registrada`, {
            time: captureTime.toFixed(2) + 's',
            successRate: this.getSuccessRate() + '%'
        });
    }

    /**
     * Registra uma fuga (alvo escapou)
     * @param {Object} details - Detalhes da fuga
     */
    recordEscape(details = {}) {
        const escapeTime = this.getCurrentAttemptTime();
        this.escapeTimes.push(escapeTime);
        
        // Registrar no histórico
        const record = {
            type: 'escape',
            attemptNumber: this.attempts,
            timestamp: Date.now(),
            duration: escapeTime,
            strategy: details.strategy || 'unknown',
            targetSpeed: details.targetSpeed || 0,
            chaserSpeed: details.chaserSpeed || 0,
            detectionSensitivity: details.detectionSensitivity || 0
        };
        
        this.attemptHistory.push(record);
        this.trimHistory();
        
        logger.info(`Fuga registrada na tentativa #${this.attempts}`, {
            time: escapeTime.toFixed(2) + 's'
        });
    }

    /**
     * Calcula tempo da tentativa atual
     * @returns {number} Tempo em segundos
     */
    getCurrentAttemptTime() {
        return (performance.now() - this.currentAttemptStartTime) / 1000;
    }

    /**
     * Calcula taxa de sucesso
     * @returns {number} Porcentagem de capturas
     */
    getSuccessRate() {
        if (this.attempts === 0) return 0;
        return ((this.captures / this.attempts) * 100).toFixed(1);
    }

    /**
     * Calcula tempo médio de captura
     * @returns {number} Tempo médio em segundos
     */
    getAverageCaptureTime() {
        if (this.captureTimes.length === 0) return 0;
        return MathUtils.average(this.captureTimes);
    }

    /**
     * Calcula tempo médio de fuga
     * @returns {number} Tempo médio em segundos
     */
    getAverageEscapeTime() {
        if (this.escapeTimes.length === 0) return 0;
        return MathUtils.average(this.escapeTimes);
    }

    /**
     * Retorna estatísticas completas
     * @returns {Object} Estatísticas
     */
    getStats() {
        return {
            attempts: this.attempts,
            captures: this.captures,
            escapes: this.attempts - this.captures,
            successRate: parseFloat(this.getSuccessRate()),
            avgCaptureTime: this.getAverageCaptureTime(),
            avgEscapeTime: this.getAverageEscapeTime(),
            minCaptureTime: this.captureTimes.length > 0 ? Math.min(...this.captureTimes) : 0,
            maxCaptureTime: this.captureTimes.length > 0 ? Math.max(...this.captureTimes) : 0,
            totalSimulationTime: (Date.now() - this.sessionStartTime) / 1000,
            currentTime: this.getCurrentAttemptTime(),
            avgTime: this.getAverageCaptureTime() // Adicionar alias para compatibilidade
        };
    }

    /**
     * Filtra histórico por estratégia
     * @param {string} strategy - Nome da estratégia
     * @returns {Array} Histórico filtrado
     */
    getHistoryByStrategy(strategy) {
        return this.attemptHistory.filter(record => record.strategy === strategy);
    }

    /**
     * Calcula estatísticas por estratégia
     * @param {string} strategy - Nome da estratégia
     * @returns {Object} Estatísticas da estratégia
     */
    getStrategyStats(strategy) {
        const records = this.getHistoryByStrategy(strategy);
        const captures = records.filter(r => r.type === 'capture');
        const escapes = records.filter(r => r.type === 'escape');
        
        return {
            strategy: strategy,
            totalAttempts: records.length,
            captures: captures.length,
            escapes: escapes.length,
            successRate: records.length > 0 ? 
                ((captures.length / records.length) * 100).toFixed(1) : 0,
            avgCaptureTime: captures.length > 0 ?
                MathUtils.average(captures.map(c => c.duration)) : 0,
            avgEscapeTime: escapes.length > 0 ?
                MathUtils.average(escapes.map(e => e.duration)) : 0
        };
    }

    /**
     * Retorna comparativo de todas as estratégias
     * @returns {Array} Array com estatísticas de cada estratégia
     */
    getStrategyComparison() {
        const strategies = [...new Set(this.attemptHistory.map(r => r.strategy))];
        return strategies.map(strategy => this.getStrategyStats(strategy));
    }

    /**
     * Calcula tendências ao longo do tempo
     * @param {number} windowSize - Tamanho da janela de análise
     * @returns {Object} Tendências
     */
    getTrends(windowSize = 10) {
        if (this.attemptHistory.length < windowSize) {
            return {
                successRateTrend: 'insufficient_data',
                avgTimeTrend: 'insufficient_data'
            };
        }

        const recent = this.attemptHistory.slice(-windowSize);
        const previous = this.attemptHistory.slice(-windowSize * 2, -windowSize);

        const recentCaptures = recent.filter(r => r.type === 'capture').length;
        const previousCaptures = previous.filter(r => r.type === 'capture').length;

        const recentSuccessRate = (recentCaptures / recent.length) * 100;
        const previousSuccessRate = previous.length > 0 ? 
            (previousCaptures / previous.length) * 100 : 0;

        return {
            successRateTrend: recentSuccessRate > previousSuccessRate ? 'improving' : 
                              recentSuccessRate < previousSuccessRate ? 'declining' : 'stable',
            recentSuccessRate: recentSuccessRate.toFixed(1),
            previousSuccessRate: previousSuccessRate.toFixed(1)
        };
    }

    /**
     * Calcula desvio padrão dos tempos de captura
     * @returns {number} Desvio padrão
     */
    getCaptureTimeStdDev() {
        if (this.captureTimes.length < 2) return 0;

        const mean = this.getAverageCaptureTime();
        const squaredDiffs = this.captureTimes.map(time => Math.pow(time - mean, 2));
        const variance = MathUtils.average(squaredDiffs);
        
        return Math.sqrt(variance);
    }

    /**
     * Limita tamanho do histórico
     */
    trimHistory() {
        if (this.attemptHistory.length > this.maxHistoryLength) {
            const excess = this.attemptHistory.length - this.maxHistoryLength;
            this.attemptHistory.splice(0, excess);
        }
    }

    /**
     * Reseta todas as estatísticas
     */
    reset() {
        this.attempts = 0;
        this.captures = 0;
        this.captureTimes = [];
        this.escapeTimes = [];
        this.currentAttemptStartTime = 0;
        this.attemptHistory = [];
        this.sessionStartTime = Date.now();
        
        logger.info('Estatísticas resetadas');
    }

    /**
     * Reseta apenas a sessão atual mantendo histórico
     */
    resetSession() {
        this.attempts = 0;
        this.captures = 0;
        this.captureTimes = [];
        this.escapeTimes = [];
        this.currentAttemptStartTime = 0;
        this.sessionStartTime = Date.now();
        
        logger.info('Sessão resetada, histórico mantido');
    }

    /**
     * Exporta estatísticas como objeto
     * @returns {Object} Dados de exportação
     */
    export() {
        return {
            summary: this.getStats(),
            captureTimes: [...this.captureTimes],
            escapeTimes: [...this.escapeTimes],
            attemptHistory: [...this.attemptHistory],
            strategyComparison: this.getStrategyComparison(),
            trends: this.getTrends(),
            metadata: {
                exportDate: new Date().toISOString(),
                sessionDuration: (Date.now() - this.sessionStartTime) / 1000,
                totalAttempts: this.attempts
            }
        };
    }

    /**
     * Importa estatísticas de um objeto
     * @param {Object} data - Dados a importar
     */
    import(data) {
        try {
            this.attempts = data.summary.attempts || 0;
            this.captures = data.summary.captures || 0;
            this.captureTimes = data.captureTimes || [];
            this.escapeTimes = data.escapeTimes || [];
            this.attemptHistory = data.attemptHistory || [];
            
            logger.info('Estatísticas importadas com sucesso');
            return true;
        } catch (error) {
            logger.error('Erro ao importar estatísticas', error);
            return false;
        }
    }

    /**
     * Retorna informações de debug
     * @returns {Object} Informações de debug
     */
    getDebugInfo() {
        return {
            attempts: this.attempts,
            captures: this.captures,
            historyLength: this.attemptHistory.length,
            sessionDuration: ((Date.now() - this.sessionStartTime) / 1000).toFixed(2) + 's',
            avgCaptureTime: this.getAverageCaptureTime().toFixed(2) + 's'
        };
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StatsTracker;
}