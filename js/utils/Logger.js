/**
 * Logger.js
 * Sistema de logging centralizado para debug e monitoramento
 */

class Logger {
    constructor() {
        this.logs = [];
        this.maxLogs = 100;
        this.enabled = true;
        this.debugMode = false;
        this.categories = {
            INFO: { color: '#00ff00', prefix: '[INFO]' },
            WARN: { color: '#ffff00', prefix: '[WARN]' },
            ERROR: { color: '#ff0000', prefix: '[ERROR]' },
            DEBUG: { color: '#00ffff', prefix: '[DEBUG]' },
            PHYSICS: { color: '#ff00ff', prefix: '[PHYSICS]' },
            DETECTION: { color: '#ffa500', prefix: '[DETECTION]' },
            STRATEGY: { color: '#00ff99', prefix: '[STRATEGY]' }
        };
    }

    /**
     * Ativa ou desativa o logger
     * @param {boolean} enabled - Estado do logger
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    /**
     * Ativa ou desativa o modo debug
     * @param {boolean} debug - Estado do modo debug
     */
    setDebugMode(debug) {
        this.debugMode = debug;
    }

    /**
     * Registra uma mensagem
     * @param {string} category - Categoria da mensagem
     * @param {string} message - Mensagem a registrar
     * @param {*} data - Dados adicionais (opcional)
     */
    log(category, message, data = null) {
        if (!this.enabled) return;

        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            category,
            message,
            data
        };

        this.logs.push(logEntry);

        // Limita o tamanho do array de logs
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // Console output com cor
        const categoryInfo = this.categories[category] || this.categories.INFO;
        console.log(
            `%c${categoryInfo.prefix} ${timestamp}%c ${message}`,
            `color: ${categoryInfo.color}; font-weight: bold`,
            'color: inherit',
            data || ''
        );

        // Atualiza painel de debug se existir
        this.updateDebugPanel();
    }

    /**
     * Log de informação
     * @param {string} message - Mensagem
     * @param {*} data - Dados adicionais
     */
    info(message, data) {
        this.log('INFO', message, data);
    }

    /**
     * Log de aviso
     * @param {string} message - Mensagem
     * @param {*} data - Dados adicionais
     */
    warn(message, data) {
        this.log('WARN', message, data);
    }

    /**
     * Log de erro
     * @param {string} message - Mensagem
     * @param {*} data - Dados adicionais
     */
    error(message, data) {
        this.log('ERROR', message, data);
    }

    /**
     * Log de debug (apenas se debugMode estiver ativo)
     * @param {string} message - Mensagem
     * @param {*} data - Dados adicionais
     */
    debug(message, data) {
        if (this.debugMode) {
            this.log('DEBUG', message, data);
        }
    }

    /**
     * Log de física
     * @param {string} message - Mensagem
     * @param {*} data - Dados adicionais
     */
    physics(message, data) {
        if (this.debugMode) {
            this.log('PHYSICS', message, data);
        }
    }

    /**
     * Log de detecção
     * @param {string} message - Mensagem
     * @param {*} data - Dados adicionais
     */
    detection(message, data) {
        if (this.debugMode) {
            this.log('DETECTION', message, data);
        }
    }

    /**
     * Log de estratégia
     * @param {string} message - Mensagem
     * @param {*} data - Dados adicionais
     */
    strategy(message, data) {
        if (this.debugMode) {
            this.log('STRATEGY', message, data);
        }
    }

    /**
     * Retorna todos os logs
     * @returns {Array} Array de logs
     */
    getLogs() {
        return [...this.logs];
    }

    /**
     * Retorna logs filtrados por categoria
     * @param {string} category - Categoria a filtrar
     * @returns {Array} Array de logs filtrados
     */
    getLogsByCategory(category) {
        return this.logs.filter(log => log.category === category);
    }

    /**
     * Limpa todos os logs
     */
    clear() {
        this.logs = [];
        this.updateDebugPanel();
        console.clear();
    }

    /**
     * Atualiza o painel de debug na interface
     */
    updateDebugPanel() {
        const debugPanel = document.getElementById('debugContent');
        if (!debugPanel || !this.debugMode) return;

        // Mostra apenas os últimos 20 logs
        const recentLogs = this.logs.slice(-20);
        
        debugPanel.innerHTML = recentLogs
            .map(log => {
                const time = new Date(log.timestamp).toLocaleTimeString();
                const dataStr = log.data ? JSON.stringify(log.data, null, 2) : '';
                return `${time} ${this.categories[log.category].prefix} ${log.message}${dataStr ? '\n' + dataStr : ''}`;
            })
            .join('\n\n');

        // Auto-scroll para o final
        debugPanel.scrollTop = debugPanel.scrollHeight;
    }

    /**
     * Exporta logs como JSON
     * @returns {string} Logs em formato JSON
     */
    exportJSON() {
        return JSON.stringify(this.logs, null, 2);
    }

    /**
     * Exporta logs como CSV
     * @returns {string} Logs em formato CSV
     */
    exportCSV() {
        const headers = 'Timestamp,Category,Message,Data\n';
        const rows = this.logs.map(log => {
            const data = log.data ? JSON.stringify(log.data).replace(/,/g, ';') : '';
            return `${log.timestamp},${log.category},${log.message},"${data}"`;
        }).join('\n');
        return headers + rows;
    }

    /**
     * Cria um timer para medir performance
     * @param {string} label - Nome do timer
     * @returns {Function} Função para parar o timer
     */
    startTimer(label) {
        const start = performance.now();
        return () => {
            const end = performance.now();
            const duration = (end - start).toFixed(2);
            this.debug(`Timer [${label}]: ${duration}ms`);
            return duration;
        };
    }

    /**
     * Agrupa logs relacionados
     * @param {string} label - Nome do grupo
     */
    group(label) {
        console.group(label);
    }

    /**
     * Fecha o grupo de logs
     */
    groupEnd() {
        console.groupEnd();
    }

    /**
     * Registra um objeto em formato tabular
     * @param {*} data - Dados a mostrar
     */
    table(data) {
        console.table(data);
    }
}

// Criar instância global
const logger = new Logger();

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Logger;
}