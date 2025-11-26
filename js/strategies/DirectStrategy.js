/**
 * DirectStrategy.js
 * Estratégia de perseguição direta
 * Move-se diretamente em direção à posição atual do alvo
 */

class DirectStrategy extends Strategy {
    /**
     * Cria uma nova estratégia de perseguição direta
     */
    constructor() {
        super(
            CONFIG.strategies.direct.name,
            CONFIG.strategies.direct.description
        );
    }

    /**
     * Calcula a força de steering para perseguição direta
     * @param {Frajola} chaser - Agente perseguidor
     * @param {Ligeirinho} target - Agente alvo
     * @param {boolean} targetDetected - Se o alvo foi detectado
     * @returns {Vector2D} Força de steering a aplicar
     */
    calculate(chaser, target, targetDetected) {
        if (!this.active || !target) {
            return new Vector2D(0, 0);
        }

        // Calcular direção direta ao alvo (sempre, detectado ou não)
        const steering = Strategy.seek(
            chaser.position,
            chaser.velocity,
            target.position,
            chaser.maxSpeed,
            chaser.maxForce
        );

        logger.strategy('DirectStrategy: Perseguindo diretamente', {
            chaserPos: chaser.position.toString(),
            targetPos: target.position.toString(),
            distance: chaser.distanceTo(target).toFixed(2),
            detected: targetDetected
        });

        return steering;
    }

    /**
     * Retorna informações específicas da estratégia
     * @returns {Object} Informações da estratégia
     */
    getInfo() {
        return {
            ...super.getInfo(),
            type: 'Direct Pursuit',
            complexity: 'Low',
            computationalCost: 'Very Low',
            effectiveness: 'Moderate',
            bestFor: 'Slow targets, open spaces',
            weaknesses: 'Predictable, can be dodged easily'
        };
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DirectStrategy;
}