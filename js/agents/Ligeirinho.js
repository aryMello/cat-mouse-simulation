/**
 * Ligeirinho.js
 * Implementação do agente alvo (Ligeirinho)
 * Responsável por escapar do perseguidor
 */

class Ligeirinho extends Agent {
    /**
     * Cria um novo Ligeirinho
     * @param {number} x - Posição X inicial
     * @param {number} y - Posição Y inicial
     * @param {number} speed - Velocidade do agente
     */
    constructor(x, y, speed = CONFIG.target.defaultSpeed) {
        super(x, y, {
            size: CONFIG.target.size,
            color: CONFIG.target.color,
            velocityColor: CONFIG.target.velocityColor,
            maxSpeed: speed
        });

        this.type = 'target';
        this.spawnEdge = null;
        this.escapeAttempts = 0;
        
        logger.info('Ligeirinho criado', {
            position: this.position.toString(),
            speed: this.maxSpeed
        });
    }

    /**
     * Spawna o Ligeirinho em uma borda aleatória
     * @param {number} canvasWidth - Largura do canvas
     * @param {number} canvasHeight - Altura do canvas
     */
    spawnAtRandomEdge(canvasWidth, canvasHeight) {
        const edge = Math.floor(Math.random() * 4);
        this.spawnEdge = ['top', 'right', 'bottom', 'left'][edge];
        
        let x, y, vx, vy;
        
        switch(edge) {
            case 0: // top
                x = Math.random() * canvasWidth;
                y = 0;
                vx = (Math.random() - 0.5) * 2;
                vy = 1;
                break;
                
            case 1: // right
                x = canvasWidth;
                y = Math.random() * canvasHeight;
                vx = -1;
                vy = (Math.random() - 0.5) * 2;
                break;
                
            case 2: // bottom
                x = Math.random() * canvasWidth;
                y = canvasHeight;
                vx = (Math.random() - 0.5) * 2;
                vy = -1;
                break;
                
            default: // left
                x = 0;
                y = Math.random() * canvasHeight;
                vx = 1;
                vy = (Math.random() - 0.5) * 2;
        }
        
        // Normalizar e aplicar velocidade
        const velocity = new Vector2D(vx, vy);
        velocity.normalize().multiply(this.maxSpeed);
        
        this.setPosition(x, y);
        this.setVelocity(velocity.x, velocity.y);
        
        logger.info(`Ligeirinho spawnou na borda ${this.spawnEdge}`, {
            position: this.position.toString(),
            velocity: this.velocity.toString()
        });
    }

    /**
     * Atualiza o Ligeirinho
     * @param {number} deltaTime - Tempo desde última atualização
     */
    update(deltaTime = 1) {
        super.update(deltaTime);
        
        // Manter velocidade constante
        this.velocity.setMagnitude(this.maxSpeed);
    }

    /**
     * Verifica se escapou do canvas
     * @param {number} canvasWidth - Largura do canvas
     * @param {number} canvasHeight - Altura do canvas
     * @param {number} margin - Margem além dos limites
     * @returns {boolean} True se escapou
     */
    hasEscaped(canvasWidth, canvasHeight, margin = 50) {
        const escaped = 
            this.position.x < -margin ||
            this.position.x > canvasWidth + margin ||
            this.position.y < -margin ||
            this.position.y > canvasHeight + margin;
            
        if (escaped) {
            this.escapeAttempts++;
            logger.info('Ligeirinho escapou!', {
                escapeAttempts: this.escapeAttempts,
                lastPosition: this.position.toString()
            });
        }
        
        return escaped;
    }

    /**
     * Faz o Ligeirinho tentar evadir do perseguidor
     * @param {Frajola} chaser - Perseguidor
     * @param {number} intensity - Intensidade da evasão (0-1)
     */
    evade(chaser, intensity = 0.3) {
        // Calcula vetor de direção oposta ao perseguidor
        const desired = Vector2D.subtract(this.position, chaser.position);
        desired.normalize().multiply(this.maxSpeed);
        
        // Aplica evasão com intensidade
        const evadeForce = Vector2D.subtract(desired, this.velocity);
        evadeForce.multiply(intensity);
        
        this.applyForce(evadeForce);
        
        logger.physics('Ligeirinho evadindo', {
            chaserDistance: this.distanceTo(chaser).toFixed(2)
        });
    }

    /**
     * Comportamento errático (mudanças aleatórias de direção)
     * @param {number} chance - Chance de mudar direção (0-1)
     * @param {number} maxAngle - Ângulo máximo de mudança em radianos
     */
    erraticBehavior(chance = 0.01, maxAngle = Math.PI / 4) {
        if (Math.random() < chance) {
            const angle = (Math.random() - 0.5) * maxAngle;
            this.velocity.rotate(angle);
            
            logger.physics('Ligeirinho mudou direção erraticamente', {
                angle: MathUtils.radToDeg(angle).toFixed(2) + '°'
            });
        }
    }

    /**
     * Desenha informações de debug
     * @param {CanvasRenderingContext2D} ctx - Contexto do canvas
     */
    drawDebug(ctx) {
        if (!CONFIG.simulation.debug) return;
        
        // Desenhar direção prevista
        const futurePos = Vector2D.add(
            this.position,
            Vector2D.multiply(this.velocity, 10)
        );
        
        ctx.strokeStyle = '#ffff0080';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(this.position.x, this.position.y);
        ctx.lineTo(futurePos.x, futurePos.y);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Desenhar informações
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.fillText(
            `v: ${this.velocity.magnitude().toFixed(1)}`,
            this.position.x + this.size,
            this.position.y - this.size
        );
    }

    /**
     * Retorna informações de debug específicas
     * @returns {Object} Informações de debug
     */
    getDebugInfo() {
        return {
            ...super.getDebugInfo(),
            type: 'Ligeirinho',
            spawnEdge: this.spawnEdge,
            escapeAttempts: this.escapeAttempts,
            speed: this.velocity.magnitude().toFixed(2)
        };
    }

    /**
     * Reseta o estado do Ligeirinho
     */
    reset() {
        this.active = true;
        this.visible = true;
        this.escapeAttempts = 0;
        this.clearTrail();
        
        logger.info('Ligeirinho resetado');
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Ligeirinho;
}