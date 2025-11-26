/**
 * DataExporter.js
 * Exporta dados da simulação em diferentes formatos
 * Suporta JSON, CSV e geração de relatórios
 */

class DataExporter {
    /**
     * Cria um novo exportador de dados
     */
    constructor() {
        this.format = CONFIG.analytics.exportFormat || 'json';
        
        logger.info('Data Exporter inicializado', {
            format: this.format
        });
    }

    /**
     * Exporta dados da simulação
     * @param {StatsTracker} statsTracker - Rastreador de estatísticas
     * @param {string} format - Formato ('json' ou 'csv')
     */
    export(statsTracker, format = this.format) {
        const data = statsTracker.export();
        
        let content, filename, mimeType;
        
        switch (format.toLowerCase()) {
            case 'json':
                content = this.toJSON(data);
                filename = `ligeirinho-stats-${this.getTimestamp()}.json`;
                mimeType = 'application/json';
                break;
                
            case 'csv':
                content = this.toCSV(data);
                filename = `ligeirinho-stats-${this.getTimestamp()}.csv`;
                mimeType = 'text/csv';
                break;
                
            default:
                logger.error('Formato de exportação inválido', { format });
                return;
        }
        
        this.downloadFile(content, filename, mimeType);
        
        logger.info('Dados exportados', {
            format: format,
            filename: filename
        });
    }

    /**
     * Converte dados para JSON formatado
     * @param {Object} data - Dados a converter
     * @returns {string} JSON formatado
     */
    toJSON(data) {
        return JSON.stringify(data, null, 2);
    }

    /**
     * Converte dados para CSV
     * @param {Object} data - Dados a converter
     * @returns {string} CSV formatado
     */
    toCSV(data) {
        const rows = [];
        
        // Cabeçalho
        rows.push('Tipo,Tentativa,Timestamp,Duração (s),Estratégia,Velocidade Alvo,Velocidade Perseguidor,Sensibilidade,Distância');
        
        // Dados do histórico
        data.attemptHistory.forEach(record => {
            const row = [
                record.type,
                record.attemptNumber,
                new Date(record.timestamp).toISOString(),
                record.duration.toFixed(2),
                record.strategy,
                record.targetSpeed,
                record.chaserSpeed,
                record.detectionSensitivity,
                record.distance || ''
            ];
            rows.push(row.join(','));
        });
        
        // Adicionar sumário no final
        rows.push('');
        rows.push('SUMÁRIO');
        rows.push(`Total de Tentativas,${data.summary.attempts}`);
        rows.push(`Capturas,${data.summary.captures}`);
        rows.push(`Fugas,${data.summary.escapes}`);
        rows.push(`Taxa de Sucesso,${data.summary.successRate}%`);
        rows.push(`Tempo Médio de Captura,${data.summary.avgCaptureTime.toFixed(2)}s`);
        rows.push(`Tempo Mínimo de Captura,${data.summary.minCaptureTime.toFixed(2)}s`);
        rows.push(`Tempo Máximo de Captura,${data.summary.maxCaptureTime.toFixed(2)}s`);
        
        return rows.join('\n');
    }

    /**
     * Gera relatório HTML
     * @param {Object} data - Dados da simulação
     * @returns {string} HTML do relatório
     */
    generateHTMLReport(data) {
        const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Relatório - Ligeirinho vs Frajola</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; }
        .stat-label { font-size: 14px; color: #666; margin-bottom: 5px; }
        .stat-value { font-size: 32px; font-weight: bold; color: #333; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #3b82f6; color: white; }
        tr:hover { background: #f8f9fa; }
        .success { color: #22c55e; font-weight: bold; }
        .escape { color: #ef4444; font-weight: bold; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 Relatório de Simulação - Ligeirinho vs Frajola</h1>
        <p><strong>Data:</strong> ${new Date(data.metadata.exportDate).toLocaleString('pt-BR')}</p>
        <p><strong>Duração da Sessão:</strong> ${data.metadata.sessionDuration.toFixed(2)}s</p>
        
        <h2>Sumário</h2>
        <div class="summary">
            <div class="stat-card">
                <div class="stat-label">Total de Tentativas</div>
                <div class="stat-value">${data.summary.attempts}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Capturas</div>
                <div class="stat-value" style="color: #22c55e;">${data.summary.captures}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Fugas</div>
                <div class="stat-value" style="color: #ef4444;">${data.summary.escapes}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Taxa de Sucesso</div>
                <div class="stat-value">${data.summary.successRate}%</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Tempo Médio de Captura</div>
                <div class="stat-value">${data.summary.avgCaptureTime.toFixed(2)}s</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Tempo Mínimo</div>
                <div class="stat-value">${data.summary.minCaptureTime.toFixed(2)}s</div>
            </div>
        </div>
        
        <h2>Comparação de Estratégias</h2>
        <table>
            <thead>
                <tr>
                    <th>Estratégia</th>
                    <th>Tentativas</th>
                    <th>Capturas</th>
                    <th>Taxa de Sucesso</th>
                    <th>Tempo Médio</th>
                </tr>
            </thead>
            <tbody>
                ${data.strategyComparison.map(s => `
                    <tr>
                        <td><strong>${s.strategy}</strong></td>
                        <td>${s.totalAttempts}</td>
                        <td>${s.captures}</td>
                        <td>${s.successRate}%</td>
                        <td>${s.avgCaptureTime.toFixed(2)}s</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <h2>Histórico Detalhado</h2>
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Resultado</th>
                    <th>Duração</th>
                    <th>Estratégia</th>
                    <th>Velocidades</th>
                </tr>
            </thead>
            <tbody>
                ${data.attemptHistory.map(r => `
                    <tr>
                        <td>${r.attemptNumber}</td>
                        <td class="${r.type}">${r.type === 'capture' ? '✓ Captura' : '✗ Fuga'}</td>
                        <td>${r.duration.toFixed(2)}s</td>
                        <td>${r.strategy}</td>
                        <td>A: ${r.targetSpeed} | P: ${r.chaserSpeed}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <div class="footer">
            <p>Gerado por Simulação Ligeirinho vs Frajola</p>
            <p>Projeto: O Rato Mais Rápido de Todo o México</p>
        </div>
    </div>
</body>
</html>`;
        
        return html;
    }

    /**
     * Exporta relatório HTML
     * @param {StatsTracker} statsTracker - Rastreador de estatísticas
     */
    exportHTMLReport(statsTracker) {
        const data = statsTracker.export();
        const html = this.generateHTMLReport(data);
        const filename = `relatorio-ligeirinho-${this.getTimestamp()}.html`;
        
        this.downloadFile(html, filename, 'text/html');
        
        logger.info('Relatório HTML exportado', { filename });
    }

    /**
     * Cria e baixa um arquivo
     * @param {string} content - Conteúdo do arquivo
     * @param {string} filename - Nome do arquivo
     * @param {string} mimeType - Tipo MIME
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Liberar URL
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }

    /**
     * Gera timestamp para nomes de arquivo
     * @returns {string} Timestamp formatado
     */
    getTimestamp() {
        const now = new Date();
        return now.toISOString()
            .replace(/:/g, '-')
            .replace(/\..+/, '')
            .replace('T', '_');
    }

    /**
     * Copia dados para clipboard
     * @param {Object} data - Dados a copiar
     * @param {string} format - Formato ('json' ou 'csv')
     */
    copyToClipboard(data, format = 'json') {
        let content;
        
        if (format === 'json') {
            content = this.toJSON(data);
        } else if (format === 'csv') {
            content = this.toCSV(data);
        } else {
            logger.error('Formato inválido para clipboard');
            return;
        }
        
        navigator.clipboard.writeText(content)
            .then(() => {
                logger.info('Dados copiados para clipboard', { format });
            })
            .catch(err => {
                logger.error('Erro ao copiar para clipboard', err);
            });
    }

    /**
     * Define formato padrão de exportação
     * @param {string} format - Formato ('json' ou 'csv')
     */
    setFormat(format) {
        if (['json', 'csv'].includes(format.toLowerCase())) {
            this.format = format.toLowerCase();
            logger.info('Formato de exportação alterado', { format: this.format });
        } else {
            logger.error('Formato inválido', { format });
        }
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataExporter;
}