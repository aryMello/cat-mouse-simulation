/**
 * Renderer.js
 * Sistema de renderização do canvas
 * Responsável por desenhar todos os elementos visuais
 */

class Renderer {
    /**
     * Cria um novo renderer
     * @param {HTMLCanvasElement} canvas - Elemento canvas
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = CONFIG.canvas.width;
        this.height = CONFIG.canvas.height;
        this.backgroundColor = CONFIG.canvas.backgroundColor;
        this.showGrid = CONFIG.visualization.showGrid;
        this.captureFlashTime = 0;
        this.captureFlashDuration = CONFIG.visualization.captureFlashDuration;
        
        // Configurar canvas
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        logger.info('Renderer inicializado', {
            canvasSize: `${this.width}x${this.height}`
        });
    }

    /**
     * Limpa o canvas
     */
    clear() {
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    /**
     * Desenha o grid de fundo
     */
    drawGrid() {
        if (!this.showGrid) return;

        const gridSize = CONFIG.canvas.gridSize;
        this.ctx.strokeStyle = CONFIG.canvas.gridColor;
        this.ctx.lineWidth = 1;

        // Linhas verticais
        for (let x = 0; x <= this.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }

        // Linhas horizontais
        for (let y = 0; y <= this.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }

    /**
     * Renderiza frame completo
     * @param {Ligeirinho} target - Alvo
     * @param {Frajola} chaser - Perseguidor
     * @param {DetectionSystem} detectionSystem - Sistema de detecção
     * @param {boolean} captured - Se houve captura
     */
    render(target, chaser, detectionSystem, captured = false) {
        // Limpar canvas
        this.clear();

        // Desenhar grid
        this.drawGrid();

        // Desenhar agentes
        if (target && target.active) {
            target.draw(this.ctx);
            if (CONFIG.simulation.debug) {
                target.drawDebug(this.ctx);
            }
        }

        if (chaser && chaser.active) {
            chaser.draw(this.ctx);
            if (CONFIG.simulation.debug) {
                chaser.drawDebug(this.ctx);
            }
        }

        // Efeito de captura
        if (captured) {
            this.drawCaptureEffect();
        }

        // Atualizar flash de captura
        if (this.captureFlashTime > 0) {
            this.captureFlashTime -= 16; // ~60 FPS
        }
    }

    /**
     * Desenha efeito visual de captura
     */
    drawCaptureEffect() {
        this.captureFlashTime = this.captureFlashDuration;

        // Overlay verde semi-transparente
        this.ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Texto de captura
        this.ctx.fillStyle = '#22c55e';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Sombra do texto
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetX = 3;
        this.ctx.shadowOffsetY = 3;
        
        this.ctx.fillText('CAPTURADO!', this.width / 2, this.height / 2);
        
        // Resetar sombra
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
    }

    /**
     * Desenha informações de debug na tela
     * @param {Object} debugInfo - Informações de debug
     */
    drawDebugInfo(debugInfo) {
        if (!CONFIG.simulation.debug) return;

        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'left';

        let y = 20;
        const lineHeight = 16;

        for (const [key, value] of Object.entries(debugInfo)) {
            this.ctx.fillText(`${key}: ${value}`, 10, y);
            y += lineHeight;
        }
    }

    /**
     * Desenha FPS contador
     * @param {number} fps - FPS atual
     */
    drawFPS(fps) {
        this.ctx.fillStyle = fps < 30 ? '#ef4444' : fps < 50 ? '#fbbf24' : '#22c55e';
        this.ctx.font = 'bold 14px monospace';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`FPS: ${fps}`, this.width - 10, 20);
    }

    /**
     * Desenha indicador de pausa
     */
    drawPauseIndicator() {
        // Overlay escuro
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Ícone de pausa
        this.ctx.fillStyle = '#ffffff';
        const barWidth = 20;
        const barHeight = 60;
        const spacing = 15;
        const centerX = this.width / 2;
        const centerY = this.height / 2;

        // Barra esquerda
        this.ctx.fillRect(
            centerX - spacing - barWidth,
            centerY - barHeight / 2,
            barWidth,
            barHeight
        );

        // Barra direita
        this.ctx.fillRect(
            centerX + spacing,
            centerY - barHeight / 2,
            barWidth,
            barHeight
        );

        // Texto
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSADO', centerX, centerY + 60);
    }

    /**
     * Desenha trajetória de um agente
     * @param {Agent} agent - Agente
     * @param {string} color - Cor da trajetória
     * @param {number} alpha - Transparência (0-1)
     */
    drawTrail(agent, color = '#ffffff', alpha = 0.3) {
        if (!agent || agent.trail.length < 2) return;

        this.ctx.strokeStyle = color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        
        this.ctx.moveTo(agent.trail[0].x, agent.trail[0].y);
        
        for (let i = 1; i < agent.trail.length; i++) {
            this.ctx.lineTo(agent.trail[i].x, agent.trail[i].y);
        }
        
        this.ctx.stroke();
    }

    /**
     * Desenha linha entre dois pontos
     * @param {Vector2D} start - Ponto inicial
     * @param {Vector2D} end - Ponto final
     * @param {string} color - Cor da linha
     * @param {number} width - Largura da linha
     * @param {Array} dash - Padrão de tracejado
     */
    drawLine(start, end, color = '#ffffff', width = 2, dash = []) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.setLineDash(dash);
        
        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
    }

    /**
     * Desenha círculo
     * @param {Vector2D} position - Posição do centro
     * @param {number} radius - Raio
     * @param {string} fillColor - Cor de preenchimento
     * @param {string} strokeColor - Cor da borda
     * @param {number} lineWidth - Largura da borda
     */
    drawCircle(position, radius, fillColor = null, strokeColor = null, lineWidth = 1) {
        this.ctx.beginPath();
        this.ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
        
        if (fillColor) {
            this.ctx.fillStyle = fillColor;
            this.ctx.fill();
        }
        
        if (strokeColor) {
            this.ctx.strokeStyle = strokeColor;
            this.ctx.lineWidth = lineWidth;
            this.ctx.stroke();
        }
    }

    /**
     * Desenha texto
     * @param {string} text - Texto a desenhar
     * @param {number} x - Posição X
     * @param {number} y - Posição Y
     * @param {Object} options - Opções de estilo
     */
    drawText(text, x, y, options = {}) {
        this.ctx.fillStyle = options.color || '#ffffff';
        this.ctx.font = options.font || '16px Arial';
        this.ctx.textAlign = options.align || 'left';
        this.ctx.textBaseline = options.baseline || 'top';
        
        if (options.shadow) {
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 5;
        }
        
        this.ctx.fillText(text, x, y);
        
        if (options.shadow) {
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
        }
    }

    /**
     * Ativa/desativa grid
     * @param {boolean} show - Se deve mostrar grid
     */
    toggleGrid(show) {
        this.showGrid = show;
    }

    /**
     * Captura screenshot do canvas
     * @returns {string} Data URL da imagem
     */
    screenshot() {
        return this.canvas.toDataURL('image/png');
    }

    /**
     * Redimensiona o canvas
     * @param {number} width - Nova largura
     * @param {number} height - Nova altura
     */
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
        
        logger.info('Canvas redimensionado', {
            size: `${width}x${height}`
        });
    }

    /**
     * Retorna informações de debug
     * @returns {Object} Informações do renderer
     */
    getDebugInfo() {
        return {
            canvasSize: `${this.width}x${this.height}`,
            showGrid: this.showGrid,
            captureFlash: this.captureFlashTime > 0
        };
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Renderer;
}