/**
 * Agent.js
 * Classe base para todos os agentes da simulação
 * Define comportamento e propriedades comuns
 */

class Agent {
    /**
     * Cria um novo agente
     * @param {number} x - Posição X inicial
     * @param {number} y - Posição Y inicial
     * @param {Object} options - Opções de configuração
     */
    constructor(x, y, options = {}) {
        // Posição
        this.position = new Vector2D(x, y);
        
        // Velocidade
        this.velocity = new Vector2D(0, 0);
        
        // Aceleração
        this.acceleration = new Vector2D(0, 0);
        
        // Propriedades físicas
        this.size = options.size || 20;
        this.mass = options.mass || 1;
        this.maxSpeed = options.maxSpeed || 10;
        this.maxForce = options.maxForce || 0.5;
        
        // Propriedades visuais
        this.color = options.color || '#ffffff';
        this.velocityColor = options.velocityColor || this.color;
        this.image = options.image || null; // Para renderização com PNG
        
        // Estado
        this.active = true;
        this.visible = true;
        
        // Histórico de posições (para análise)
        this.trail = [];
        this.maxTrailLength = options.maxTrailLength || 50;
        
        // ID único
        this.id = Agent.generateId();
        
        // Timestamp de criação
        this.createdAt = Date.now();
        
        logger.debug(`Agent criado: ${this.id}`, {
            position: this.position.toString(),
            size: this.size
        });
    }

    /**
     * Atualiza o agente
     * @param {number} deltaTime - Tempo desde última atualização
     */
    update(deltaTime = 1) {
        if (!this.active) return;
        
        // Atualizar velocidade com aceleração
        this.velocity.add(this.acceleration);
        
        // Limitar velocidade máxima
        this.velocity.limit(this.maxSpeed);
        
        // Atualizar posição
        this.position.add(Vector2D.multiply(this.velocity, deltaTime));
        
        // Resetar aceleração
        this.acceleration.multiply(0);
        
        // Atualizar histórico
        this.updateTrail();
    }

    /**
     * Aplica uma força ao agente
     * @param {Vector2D} force - Força a aplicar
     */
    applyForce(force) {
        // F = ma, então a = F/m
        const f = Vector2D.multiply(force, 1 / this.mass);
        this.acceleration.add(f);
    }

    /**
     * Move o agente para uma posição
     * @param {number} x - Coordenada X
     * @param {number} y - Coordenada Y
     */
    setPosition(x, y) {
        this.position.set(x, y);
        logger.physics(`Agent ${this.id} movido para (${x.toFixed(2)}, ${y.toFixed(2)})`);
    }

    /**
     * Define a velocidade do agente
     * @param {number} vx - Velocidade X
     * @param {number} vy - Velocidade Y
     */
    setVelocity(vx, vy) {
        this.velocity.set(vx, vy);
    }

    /**
     * Atualiza o histórico de posições
     */
    updateTrail() {
        this.trail.push(this.position.clone());
        
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
    }

    /**
     * Limpa o histórico de posições
     */
    clearTrail() {
        this.trail = [];
    }

    /**
     * Desenha o agente
     * @param {CanvasRenderingContext2D} ctx - Contexto do canvas
     */
    draw(ctx) {
        if (!this.visible) return;
        
        // Se tem imagem, desenhar imagem em vez de círculo
        if (this.image && this.image.complete) {
            ctx.save();
            ctx.translate(this.position.x, this.position.y);
            
            // Calcular rotação baseada na velocidade
            if (this.velocity.magnitude() > 0.1) {
                const angle = this.velocity.angle();
                ctx.rotate(angle);
            }
            
            // Desenhar imagem centralizada
            ctx.drawImage(
                this.image,
                -this.size / 2,
                -this.size / 2,
                this.size,
                this.size
            );
            
            ctx.restore();
        } else {
            // Fallback: desenhar círculo se imagem não estiver disponível
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Desenhar vetor de velocidade se configurado
        if (CONFIG.visualization.showVelocityVectors && this.velocity.magnitude() > 0.1) {
            this.drawVelocityVector(ctx);
        }
    }

    /**
     * Carrega uma imagem para o agente
     * @param {string} imagePath - Caminho da imagem
     */
    loadImage(imagePath) {
        const img = new Image();
        img.src = imagePath;
        img.onload = () => {
            this.image = img;
            logger.debug(`Imagem carregada para agente ${this.id}`, { src: imagePath });
        };
        img.onerror = () => {
            logger.warn(`Erro ao carregar imagem para agente ${this.id}`, { src: imagePath });
        };
    }

    /**
     * Desenha o vetor de velocidade
     * @param {CanvasRenderingContext2D} ctx - Contexto do canvas
     */
    drawVelocityVector(ctx) {
        const scale = CONFIG.visualization.velocityVectorScale;
        const endX = this.position.x + this.velocity.x * scale;
        const endY = this.position.y + this.velocity.y * scale;
        
        ctx.strokeStyle = this.velocityColor;
        ctx.lineWidth = CONFIG.visualization.velocityVectorWidth;
        ctx.beginPath();
        ctx.moveTo(this.position.x, this.position.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        // Desenhar ponta da seta
        const angle = this.velocity.angle();
        const arrowSize = 8;
        
        ctx.fillStyle = this.velocityColor;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - arrowSize * Math.cos(angle - Math.PI / 6),
            endY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            endX - arrowSize * Math.cos(angle + Math.PI / 6),
            endY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
    }

    /**
     * Desenha o rastro do agente
     * @param {CanvasRenderingContext2D} ctx - Contexto do canvas
     */
    drawTrail(ctx) {
        if (this.trail.length < 2) return;
        
        ctx.strokeStyle = this.color + '40';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.trail[0].x, this.trail[0].y);
        
        for (let i = 1; i < this.trail.length; i++) {
            ctx.lineTo(this.trail[i].x, this.trail[i].y);
        }
        
        ctx.stroke();
    }

    /**
     * Calcula a distância até outro agente
     * @param {Agent} other - Outro agente
     * @returns {number} Distância
     */
    distanceTo(other) {
        return this.position.distanceTo(other.position);
    }

    /**
     * Calcula a distância ao quadrado (mais eficiente)
     * @param {Agent} other - Outro agente
     * @returns {number} Distância ao quadrado
     */
    distanceSquaredTo(other) {
        return this.position.distanceSquaredTo(other.position);
    }

    /**
     * Verifica se está colidindo com outro agente
     * @param {Agent} other - Outro agente
     * @returns {boolean} True se há colisão
     */
    isCollidingWith(other) {
        const minDist = (this.size + other.size) / 2;
        return this.distanceTo(other) < minDist;
    }

    /**
     * Verifica se está dentro dos limites
     * @param {number} minX - Limite mínimo X
     * @param {number} minY - Limite mínimo Y
     * @param {number} maxX - Limite máximo X
     * @param {number} maxY - Limite máximo Y
     * @returns {boolean} True se está dentro
     */
    isWithinBounds(minX, minY, maxX, maxY) {
        return this.position.x >= minX &&
               this.position.x <= maxX &&
               this.position.y >= minY &&
               this.position.y <= maxY;
    }

    /**
     * Retorna informações de debug
     * @returns {Object} Informações do agente
     */
    getDebugInfo() {
        return {
            id: this.id,
            position: this.position.toString(),
            velocity: this.velocity.toString(),
            speed: this.velocity.magnitude().toFixed(2),
            active: this.active,
            age: ((Date.now() - this.createdAt) / 1000).toFixed(2) + 's'
        };
    }

    /**
     * Gera um ID único
     * @returns {string} ID único
     */
    static generateId() {
        return 'agent_' + Math.random().toString(36).substr(2, 9);
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Agent;
}