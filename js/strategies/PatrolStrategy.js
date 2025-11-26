/**
 * PatrolStrategy.js
 * Estratégia de patrulha + perseguição
 * Patrulha a área quando não detecta o alvo, persegue quando detecta
 */

class PatrolStrategy extends Strategy {
    /**
     * Cria uma nova estratégia de patrulha
     */
    constructor() {
        super(
            CONFIG.strategies.patrol.name,
            CONFIG.strategies.patrol.description
        );
        
        this.patrolSpeed = CONFIG.strategies.patrol.patrolSpeed;
        this.patrolRadius = CONFIG.strategies.patrol.patrolRadius;
        this.angularSpeed = CONFIG.strategies.patrol.patrolAngularSpeed;
        
        this.state = 'patrol'; // 'patrol' ou 'pursue'
        this.patrolTime = 0;
        this.centerX = CONFIG.canvas.width / 2;
        this.centerY = CONFIG.canvas.height / 2;
    }

    /**
     * Calcula a força de steering
     * @param {Frajola} chaser - Agente perseguidor
     * @param {Ligeirinho} target - Agente alvo
     * @param {boolean} targetDetected - Se o alvo foi detectado
     * @returns {Vector2D} Força de steering a aplicar
     */
    calculate(chaser, target, targetDetected) {
        if (!this.active) {
            return new Vector2D(0, 0);
        }

        // Atualizar estado
        this.updateState(targetDetected);

        let steering;

        if (target && (this.state === 'pursue' || targetDetected)) {
            // Modo de perseguição - busca direta (mesmo sem detecção)
            steering = this.pursueBehavior(chaser, target);
        } else {
            // Modo de patrulha - movimento circular
            steering = this.patrolBehavior(chaser);
            this.patrolTime += 1;
        }

        logger.strategy(`PatrolStrategy: Estado = ${this.state}`, {
            targetDetected: targetDetected,
            patrolTime: this.patrolTime
        });

        return steering;
    }

    /**
     * Atualiza o estado da estratégia
     * @param {boolean} targetDetected - Se o alvo foi detectado
     */
    updateState(targetDetected) {
        const previousState = this.state;
        
        if (targetDetected) {
            this.state = 'pursue';
        } else {
            this.state = 'patrol';
        }

        if (previousState !== this.state) {
            logger.strategy(`PatrolStrategy: Mudança de estado ${previousState} → ${this.state}`);
        }
    }

    /**
     * Comportamento de patrulha circular
     * @param {Frajola} chaser - Perseguidor
     * @returns {Vector2D} Força de steering
     */
    patrolBehavior(chaser) {
        // Calcular ponto alvo na circunferência de patrulha
        const angle = this.patrolTime * this.angularSpeed;
        const targetX = this.centerX + Math.cos(angle) * this.patrolRadius;
        const targetY = this.centerY + Math.sin(angle) * this.patrolRadius;
        const targetPos = new Vector2D(targetX, targetY);

        // Calcular steering para o ponto de patrulha
        const desired = Vector2D.subtract(targetPos, chaser.position);
        desired.normalize().multiply(chaser.maxSpeed * this.patrolSpeed);

        const steering = Vector2D.subtract(desired, chaser.velocity);
        steering.limit(chaser.maxForce);

        return steering;
    }

    /**
     * Comportamento de perseguição
     * @param {Frajola} chaser - Perseguidor
     * @param {Ligeirinho} target - Alvo
     * @returns {Vector2D} Força de steering
     */
    pursueBehavior(chaser, target) {
        // Perseguição direta ao alvo
        return Strategy.seek(
            chaser.position,
            chaser.velocity,
            target.position,
            chaser.maxSpeed,
            chaser.maxForce
        );
    }

    /**
     * Comportamento de patrulha em grid (alternativo)
     * @param {Frajola} chaser - Perseguidor
     * @returns {Vector2D} Força de steering
     */
    patrolGrid(chaser) {
        // Pontos de patrulha em grid
        const gridPoints = [
            { x: 200, y: 150 },
            { x: 600, y: 150 },
            { x: 600, y: 450 },
            { x: 200, y: 450 }
        ];

        // Determinar ponto atual baseado no tempo
        const pointIndex = Math.floor(this.patrolTime / 100) % gridPoints.length;
        const targetPoint = gridPoints[pointIndex];

        // Calcular steering para o ponto
        const targetPos = new Vector2D(targetPoint.x, targetPoint.y);
        
        return Strategy.arrive(
            chaser.position,
            chaser.velocity,
            targetPos,
            chaser.maxSpeed * this.patrolSpeed,
            chaser.maxForce,
            50
        );
    }

    /**
     * Define o centro da patrulha
     * @param {number} x - Coordenada X
     * @param {number} y - Coordenada Y
     */
    setPatrolCenter(x, y) {
        this.centerX = x;
        this.centerY = y;
        logger.strategy(`Centro de patrulha definido: (${x}, ${y})`);
    }

    /**
     * Define o raio de patrulha
     * @param {number} radius - Raio em pixels
     */
    setPatrolRadius(radius) {
        this.patrolRadius = MathUtils.clamp(radius, 50, 300);
        logger.strategy(`Raio de patrulha: ${this.patrolRadius}px`);
    }

    /**
     * Define a velocidade de patrulha
     * @param {number} speed - Multiplicador de velocidade (0-1)
     */
    setPatrolSpeed(speed) {
        this.patrolSpeed = MathUtils.clamp(speed, 0.1, 1);
        logger.strategy(`Velocidade de patrulha: ${this.patrolSpeed * 100}%`);
    }

    /**
     * Define a velocidade angular da patrulha
     * @param {number} angularSpeed - Velocidade angular
     */
    setAngularSpeed(angularSpeed) {
        this.angularSpeed = MathUtils.clamp(angularSpeed, 0.01, 0.2);
        logger.strategy(`Velocidade angular: ${this.angularSpeed}`);
    }

    /**
     * Reseta o tempo de patrulha
     */
    resetPatrolTime() {
        this.patrolTime = 0;
        logger.strategy('Tempo de patrulha resetado');
    }

    /**
     * Retorna informações específicas da estratégia
     * @returns {Object} Informações da estratégia
     */
    getInfo() {
        return {
            ...super.getInfo(),
            type: 'Patrol + Pursuit',
            complexity: 'Medium',
            computationalCost: 'Low',
            effectiveness: 'Medium-High',
            state: this.state,
            patrolRadius: this.patrolRadius,
            patrolSpeed: this.patrolSpeed,
            angularSpeed: this.angularSpeed,
            bestFor: 'Large areas, intermittent target visibility',
            weaknesses: 'Slower initial response time'
        };
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PatrolStrategy;
}