/**
 * PredictiveStrategy.js
 * Estratégia de perseguição preditiva
 * Prevê a posição futura do alvo e tenta interceptá-lo
 */

class PredictiveStrategy extends Strategy {
    /**
     * Cria uma nova estratégia de perseguição preditiva
     */
    constructor() {
        super(
            CONFIG.strategies.predictive.name,
            CONFIG.strategies.predictive.description
        );
        
        this.lookahead = CONFIG.strategies.predictive.lookahead;
        this.adaptiveLookahead = true; // Ajusta lookahead baseado na distância
    }

    /**
     * Calcula a força de steering para perseguição preditiva
     * @param {Frajola} chaser - Agente perseguidor
     * @param {Ligeirinho} target - Agente alvo
     * @param {boolean} targetDetected - Se o alvo foi detectado
     * @returns {Vector2D} Força de steering a aplicar
     */
    calculate(chaser, target, targetDetected) {
        if (!this.active || !target) {
            return new Vector2D(0, 0);
        }

        // Calcular lookahead adaptativo baseado na distância
        const distance = chaser.distanceTo(target);
        let effectiveLookahead = this.lookahead;
        
        if (this.adaptiveLookahead) {
            // Quanto mais longe, maior o lookahead
            effectiveLookahead = this.calculateAdaptiveLookahead(distance);
        }

        // Se detectado, usar previsão; caso contrário, ir direto
        const targetPos = targetDetected ? 
            this.predictFuturePosition(target, effectiveLookahead) :
            target.position;

        // Calcular steering para a posição (prevista ou atual)
        const steering = Strategy.seek(
            chaser.position,
            chaser.velocity,
            targetPos,
            chaser.maxSpeed,
            chaser.maxForce
        );

        logger.strategy('PredictiveStrategy: Interceptando', {
            currentTargetPos: target.position.toString(),
            predictedPos: targetPos.toString(),
            lookahead: effectiveLookahead.toFixed(2),
            distance: distance.toFixed(2)
        });

        return steering;
    }

    /**
     * Calcula lookahead adaptativo baseado na distância
     * @param {number} distance - Distância até o alvo
     * @returns {number} Lookahead ajustado
     */
    calculateAdaptiveLookahead(distance) {
        // Mapear distância para lookahead
        // Perto (0-100): lookahead baixo
        // Longe (100-400): lookahead alto
        const minLookahead = 3;
        const maxLookahead = 20;
        const minDistance = 0;
        const maxDistance = 400;
        
        return MathUtils.map(
            MathUtils.clamp(distance, minDistance, maxDistance),
            minDistance,
            maxDistance,
            minLookahead,
            maxLookahead
        );
    }

    /**
     * Prevê a posição futura do alvo
     * @param {Ligeirinho} target - Alvo
     * @param {number} lookahead - Frames à frente
     * @returns {Vector2D} Posição futura prevista
     */
    predictFuturePosition(target, lookahead) {
        // Posição futura = posição atual + (velocidade * lookahead)
        const prediction = Vector2D.add(
            target.position,
            Vector2D.multiply(target.velocity, lookahead)
        );

        // Garantir que a previsão está dentro dos limites do canvas
        prediction.x = MathUtils.clamp(prediction.x, 0, CONFIG.canvas.width);
        prediction.y = MathUtils.clamp(prediction.y, 0, CONFIG.canvas.height);

        return prediction;
    }

    /**
     * Calcula ponto de interceptação ideal
     * @param {Frajola} chaser - Perseguidor
     * @param {Ligeirinho} target - Alvo
     * @returns {Vector2D} Ponto de interceptação
     */
    calculateInterceptionPoint(chaser, target) {
        // Algoritmo de interceptação mais preciso
        const toTarget = Vector2D.subtract(target.position, chaser.position);
        const distance = toTarget.magnitude();
        
        // Calcular tempo de interceptação
        const targetSpeed = target.velocity.magnitude();
        const chaserSpeed = chaser.maxSpeed;
        
        // Resolver equação de interceptação
        // Usando aproximação iterativa
        let t = distance / chaserSpeed;
        
        for (let i = 0; i < 3; i++) {
            const predictedPos = Vector2D.add(
                target.position,
                Vector2D.multiply(target.velocity, t)
            );
            
            const newDistance = Vector2D.distance(chaser.position, predictedPos);
            t = newDistance / chaserSpeed;
        }
        
        // Posição final de interceptação
        return Vector2D.add(
            target.position,
            Vector2D.multiply(target.velocity, t)
        );
    }

    /**
     * Ativa/desativa lookahead adaptativo
     * @param {boolean} adaptive - Se deve usar lookahead adaptativo
     */
    setAdaptiveLookahead(adaptive) {
        this.adaptiveLookahead = adaptive;
        logger.strategy(`Lookahead adaptativo: ${adaptive ? 'ON' : 'OFF'}`);
    }

    /**
     * Define o lookahead manualmente
     * @param {number} lookahead - Valor de lookahead
     */
    setLookahead(lookahead) {
        this.lookahead = MathUtils.clamp(lookahead, 1, 50);
        logger.strategy(`Lookahead definido para: ${this.lookahead}`);
    }

    /**
     * Retorna informações específicas da estratégia
     * @returns {Object} Informações da estratégia
     */
    getInfo() {
        return {
            ...super.getInfo(),
            type: 'Predictive Pursuit',
            complexity: 'Medium',
            computationalCost: 'Medium',
            effectiveness: 'High',
            lookahead: this.lookahead,
            adaptiveLookahead: this.adaptiveLookahead,
            bestFor: 'Fast targets, predictable movements',
            weaknesses: 'Vulnerable to sudden direction changes'
        };
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PredictiveStrategy;
}