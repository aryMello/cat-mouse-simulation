/**
 * Frajola.js
 * Implementação do agente perseguidor (Frajola)
 * Responsável por detectar e capturar o Ligeirinho
 */

class Frajola extends Agent {
    /**
     * Cria um novo Frajola
     * @param {number} x - Posição X inicial
     * @param {number} y - Posição Y inicial
     * @param {number} speed - Velocidade do agente
     */
    constructor(x, y, speed = CONFIG.chaser.defaultSpeed) {
        super(x, y, {
            size: CONFIG.chaser.size,
            color: CONFIG.chaser.color,
            velocityColor: CONFIG.chaser.velocityColor,
            maxSpeed: speed
        });

        this.type = 'chaser';
        this.detectionRadius = CONFIG.chaser.detectionRadius;
        this.target = null;
        this.targetDetected = false;
        this.captureCount = 0;
        this.totalPursuitTime = 0;
        this.currentPursuitTime = 0;
        this.strategy = null;
        
        // Carregar imagem do Frajola
        this.loadImage('./assets/frajola.png');
        
        logger.info('Frajola criado', {
            position: this.position.toString(),
            speed: this.maxSpeed,
            detectionRadius: this.detectionRadius
        });
    }

    /**
     * Define a estratégia de perseguição
     * @param {Strategy} strategy - Estratégia a usar
     */
    setStrategy(strategy) {
        this.strategy = strategy;
        logger.strategy(`Estratégia alterada para: ${strategy.name}`);
    }

    /**
     * Define o alvo a perseguir
     * @param {Ligeirinho} target - Alvo a perseguir
     */
    setTarget(target) {
        this.target = target;
        logger.detection('Novo alvo definido', {
            targetId: target.id
        });
    }

    /**
     * Atualiza o Frajola
     * @param {number} deltaTime - Tempo desde última atualização
     * @param {DetectionSystem} detectionSystem - Sistema de detecção
     */
    update(deltaTime = 1, detectionSystem = null) {
        if (!this.active || !this.target) return;

        // Detectar alvo
        if (detectionSystem) {
            this.targetDetected = detectionSystem.detect(this, this.target);
        }

        // Executar estratégia se alvo detectado ou se estratégia funciona sem detecção
        if (this.strategy) {
            const steering = this.strategy.calculate(this, this.target, this.targetDetected);
            if (steering) {
                this.applyForce(steering);
            }
        }

        // Atualizar física
        super.update(deltaTime);

        // Atualizar tempo de perseguição
        if (this.targetDetected) {
            this.currentPursuitTime += deltaTime / CONFIG.simulation.defaultFPS;
        }

        logger.physics('Frajola atualizado', {
            position: this.position.toString(),
            velocity: this.velocity.toString(),
            targetDetected: this.targetDetected
        });
    }

    /**
     * Tenta capturar o alvo
     * @param {number} captureDistance - Distância mínima para captura
     * @returns {boolean} True se capturou
     */
    attemptCapture(captureDistance = CONFIG.physics.captureDistance) {
        if (!this.target || !this.targetDetected) return false;

        const distance = this.distanceTo(this.target);
        
        if (distance < captureDistance) {
            this.captureCount++;
            this.totalPursuitTime += this.currentPursuitTime;
            
            logger.info('🎯 Captura realizada!', {
                captureCount: this.captureCount,
                pursuitTime: this.currentPursuitTime.toFixed(2) + 's',
                distance: distance.toFixed(2)
            });
            
            this.currentPursuitTime = 0;
            return true;
        }
        
        return false;
    }

    /**
     * Move diretamente em direção ao alvo
     * @returns {Vector2D} Força de steering
     */
    seekTarget() {
        if (!this.target) return new Vector2D(0, 0);

        const desired = Vector2D.subtract(this.target.position, this.position);
        desired.normalize().multiply(this.maxSpeed);

        const steer = Vector2D.subtract(desired, this.velocity);
        steer.limit(this.maxForce);

        return steer;
    }

    /**
     * Prevê posição futura do alvo e intercepta
     * @param {number} lookahead - Frames à frente para prever
     * @returns {Vector2D} Força de steering
     */
    predictAndIntercept(lookahead = 10) {
        if (!this.target) return new Vector2D(0, 0);

        // Prever posição futura
        const futurePos = Vector2D.add(
            this.target.position,
            Vector2D.multiply(this.target.velocity, lookahead)
        );

        // Calcular steering para posição prevista
        const desired = Vector2D.subtract(futurePos, this.position);
        desired.normalize().multiply(this.maxSpeed);

        const steer = Vector2D.subtract(desired, this.velocity);
        steer.limit(this.maxForce);

        logger.strategy('Interceptação preditiva', {
            currentTargetPos: this.target.position.toString(),
            predictedPos: futurePos.toString()
        });

        return steer;
    }

    /**
     * Patrulha em círculo
     * @param {number} radius - Raio da patrulha
     * @param {number} angularSpeed - Velocidade angular
     * @param {number} time - Tempo atual
     * @returns {Vector2D} Força de steering
     */
    patrol(radius, angularSpeed, time) {
        const centerX = CONFIG.canvas.width / 2;
        const centerY = CONFIG.canvas.height / 2;

        const angle = time * angularSpeed;
        const targetX = centerX + Math.cos(angle) * radius;
        const targetY = centerY + Math.sin(angle) * radius;

        const desired = new Vector2D(targetX - this.position.x, targetY - this.position.y);
        desired.normalize().multiply(this.maxSpeed * 0.5);

        const steer = Vector2D.subtract(desired, this.velocity);
        steer.limit(this.maxForce);

        return steer;
    }

    /**
     * Desenha o Frajola e elementos visuais
     * @param {CanvasRenderingContext2D} ctx - Contexto do canvas
     */
    draw(ctx) {
        super.draw(ctx);

        // Desenhar raio de detecção
        if (CONFIG.visualization.showDetectionRadius) {
            this.drawDetectionRadius(ctx);
        }

        // Desenhar linha de perseguição
        if (CONFIG.visualization.showPursuitLine && this.targetDetected && this.target) {
            this.drawPursuitLine(ctx);
        }
    }

    /**
     * Desenha o raio de detecção
     * @param {CanvasRenderingContext2D} ctx - Contexto do canvas
     */
    drawDetectionRadius(ctx) {
        const effectiveRadius = this.detectionRadius * CONFIG.detection.baseSensitivity;
        
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, effectiveRadius, 0, Math.PI * 2);
        ctx.strokeStyle = this.targetDetected ? 
            CONFIG.detection.detectedColor : 
            CONFIG.detection.lostColor;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    /**
     * Desenha linha de perseguição até o alvo
     * @param {CanvasRenderingContext2D} ctx - Contexto do canvas
     */
    drawPursuitLine(ctx) {
        if (!this.target) return;

        ctx.beginPath();
        ctx.moveTo(this.position.x, this.position.y);
        ctx.lineTo(this.target.position.x, this.target.position.y);
        ctx.strokeStyle = CONFIG.detection.lineColor;
        ctx.lineWidth = CONFIG.detection.lineWidth;
        ctx.setLineDash(CONFIG.detection.lineDash);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    /**
     * Desenha informações de debug
     * @param {CanvasRenderingContext2D} ctx - Contexto do canvas
     */
    drawDebug(ctx) {
        if (!CONFIG.simulation.debug) return;

        // Desenhar distância até o alvo
        if (this.target) {
            const distance = this.distanceTo(this.target);
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px monospace';
            ctx.fillText(
                `dist: ${distance.toFixed(1)}`,
                this.position.x + this.size,
                this.position.y + this.size
            );
        }

        // Desenhar status de detecção
        ctx.fillStyle = this.targetDetected ? '#00ff00' : '#ff0000';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(
            this.targetDetected ? 'DET' : 'LOST',
            this.position.x - this.size,
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
            type: 'Frajola',
            targetDetected: this.targetDetected,
            captureCount: this.captureCount,
            avgPursuitTime: this.captureCount > 0 ? 
                (this.totalPursuitTime / this.captureCount).toFixed(2) + 's' : 'N/A',
            currentPursuitTime: this.currentPursuitTime.toFixed(2) + 's',
            strategy: this.strategy ? this.strategy.name : 'None'
        };
    }

    /**
     * Reseta o estado do Frajola
     */
    reset() {
        this.position.set(CONFIG.chaser.startX, CONFIG.chaser.startY);
        this.velocity.set(0, 0);
        this.acceleration.set(0, 0);
        this.targetDetected = false;
        this.currentPursuitTime = 0;
        this.clearTrail();
        
        logger.info('Frajola resetado');
    }

    /**
     * Reseta estatísticas
     */
    resetStats() {
        this.captureCount = 0;
        this.totalPursuitTime = 0;
        this.currentPursuitTime = 0;
        
        logger.info('Estatísticas do Frajola resetadas');
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Frajola;
}