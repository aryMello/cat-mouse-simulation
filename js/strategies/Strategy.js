/**
 * Strategy.js
 * Classe base abstrata para estratégias de perseguição
 * Define a interface que todas as estratégias devem implementar
 */

class Strategy {
    /**
     * Cria uma nova estratégia
     * @param {string} name - Nome da estratégia
     * @param {string} description - Descrição da estratégia
     */
    constructor(name, description) {
        this.name = name;
        this.description = description;
        this.active = true;
        
        logger.strategy(`Estratégia criada: ${this.name}`);
    }

    /**
     * Calcula a força de steering para o perseguidor
     * @param {Frajola} chaser - Agente perseguidor
     * @param {Ligeirinho} target - Agente alvo
     * @param {boolean} targetDetected - Se o alvo foi detectado
     * @returns {Vector2D} Força de steering a aplicar
     */
    calculate(chaser, target, targetDetected) {
        throw new Error('Método calculate() deve ser implementado pela subclasse');
    }

    /**
     * Ativa a estratégia
     */
    activate() {
        this.active = true;
        logger.strategy(`${this.name} ativada`);
    }

    /**
     * Desativa a estratégia
     */
    deactivate() {
        this.active = false;
        logger.strategy(`${this.name} desativada`);
    }

    /**
     * Retorna informações da estratégia
     * @returns {Object} Informações da estratégia
     */
    getInfo() {
        return {
            name: this.name,
            description: this.description,
            active: this.active
        };
    }

    /**
     * Calcula steering básico em direção a um ponto
     * @param {Vector2D} currentPos - Posição atual
     * @param {Vector2D} currentVel - Velocidade atual
     * @param {Vector2D} targetPos - Posição alvo
     * @param {number} maxSpeed - Velocidade máxima
     * @param {number} maxForce - Força máxima
     * @returns {Vector2D} Força de steering
     */
    static seek(currentPos, currentVel, targetPos, maxSpeed, maxForce) {
        const desired = Vector2D.subtract(targetPos, currentPos);
        desired.normalize().multiply(maxSpeed);
        
        const steer = Vector2D.subtract(desired, currentVel);
        steer.limit(maxForce);
        
        return steer;
    }

    /**
     * Calcula steering para fugir de um ponto
     * @param {Vector2D} currentPos - Posição atual
     * @param {Vector2D} currentVel - Velocidade atual
     * @param {Vector2D} threatPos - Posição da ameaça
     * @param {number} maxSpeed - Velocidade máxima
     * @param {number} maxForce - Força máxima
     * @returns {Vector2D} Força de steering
     */
    static flee(currentPos, currentVel, threatPos, maxSpeed, maxForce) {
        const desired = Vector2D.subtract(currentPos, threatPos);
        desired.normalize().multiply(maxSpeed);
        
        const steer = Vector2D.subtract(desired, currentVel);
        steer.limit(maxForce);
        
        return steer;
    }

    /**
     * Calcula steering para chegar a um ponto e desacelerar
     * @param {Vector2D} currentPos - Posição atual
     * @param {Vector2D} currentVel - Velocidade atual
     * @param {Vector2D} targetPos - Posição alvo
     * @param {number} maxSpeed - Velocidade máxima
     * @param {number} maxForce - Força máxima
     * @param {number} slowingRadius - Raio para começar a desacelerar
     * @returns {Vector2D} Força de steering
     */
    static arrive(currentPos, currentVel, targetPos, maxSpeed, maxForce, slowingRadius = 100) {
        const desired = Vector2D.subtract(targetPos, currentPos);
        const distance = desired.magnitude();
        
        desired.normalize();
        
        if (distance < slowingRadius) {
            // Desacelerar proporcionalmente à distância
            const speed = MathUtils.map(distance, 0, slowingRadius, 0, maxSpeed);
            desired.multiply(speed);
        } else {
            desired.multiply(maxSpeed);
        }
        
        const steer = Vector2D.subtract(desired, currentVel);
        steer.limit(maxForce);
        
        return steer;
    }

    /**
     * Calcula steering de perseguição (pursuit)
     * @param {Vector2D} chaserPos - Posição do perseguidor
     * @param {Vector2D} chaserVel - Velocidade do perseguidor
     * @param {Vector2D} targetPos - Posição do alvo
     * @param {Vector2D} targetVel - Velocidade do alvo
     * @param {number} maxSpeed - Velocidade máxima
     * @param {number} maxForce - Força máxima
     * @param {number} lookahead - Frames à frente para prever
     * @returns {Vector2D} Força de steering
     */
    static pursuit(chaserPos, chaserVel, targetPos, targetVel, maxSpeed, maxForce, lookahead = 10) {
        // Prever posição futura do alvo
        const futurePos = Vector2D.add(
            targetPos,
            Vector2D.multiply(targetVel, lookahead)
        );
        
        // Usar seek para a posição prevista
        return Strategy.seek(chaserPos, chaserVel, futurePos, maxSpeed, maxForce);
    }

    /**
     * Calcula steering de evasão (evade)
     * @param {Vector2D} evaderPos - Posição do evadido
     * @param {Vector2D} evaderVel - Velocidade do evadido
     * @param {Vector2D} pursuerPos - Posição do perseguidor
     * @param {Vector2D} pursuerVel - Velocidade do perseguidor
     * @param {number} maxSpeed - Velocidade máxima
     * @param {number} maxForce - Força máxima
     * @param {number} lookahead - Frames à frente para prever
     * @returns {Vector2D} Força de steering
     */
    static evade(evaderPos, evaderVel, pursuerPos, pursuerVel, maxSpeed, maxForce, lookahead = 10) {
        // Prever posição futura do perseguidor
        const futurePos = Vector2D.add(
            pursuerPos,
            Vector2D.multiply(pursuerVel, lookahead)
        );
        
        // Usar flee da posição prevista
        return Strategy.flee(evaderPos, evaderVel, futurePos, maxSpeed, maxForce);
    }

    /**
     * Calcula steering de wandering (vagar)
     * @param {Vector2D} currentVel - Velocidade atual
     * @param {number} wanderAngle - Ângulo atual de wandering
     * @param {number} maxSpeed - Velocidade máxima
     * @param {number} wanderDistance - Distância do círculo de wandering
     * @param {number} wanderRadius - Raio do círculo de wandering
     * @param {number} angleChange - Mudança máxima de ângulo
     * @returns {Object} { steer: Vector2D, newAngle: number }
     */
    static wander(currentVel, wanderAngle, maxSpeed, wanderDistance = 50, wanderRadius = 25, angleChange = 0.3) {
        // Calcular ponto no círculo de wandering
        const circleCenter = currentVel.clone().normalize().multiply(wanderDistance);
        const displacement = Vector2D.fromAngle(wanderAngle, wanderRadius);
        
        const wanderForce = Vector2D.add(circleCenter, displacement);
        wanderForce.setMagnitude(maxSpeed);
        
        // Atualizar ângulo aleatoriamente
        const newAngle = wanderAngle + (Math.random() - 0.5) * angleChange;
        
        return {
            steer: wanderForce,
            newAngle: newAngle
        };
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Strategy;
}