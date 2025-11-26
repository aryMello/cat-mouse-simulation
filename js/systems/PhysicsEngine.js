/**
 * PhysicsEngine.js
 * Motor de física para a simulação
 * Gerencia movimento, colisões e limites
 */

class PhysicsEngine {
    /**
     * Cria um novo motor de física
     */
    constructor() {
        this.gravity = new Vector2D(0, 0); // Sem gravidade por padrão
        this.friction = CONFIG.physics.friction;
        this.canvasWidth = CONFIG.canvas.width;
        this.canvasHeight = CONFIG.canvas.height;
        this.boundaryMargin = CONFIG.physics.boundaryMargin;
        
        logger.info('Motor de física inicializado', {
            canvasSize: `${this.canvasWidth}x${this.canvasHeight}`,
            friction: this.friction
        });
    }

    /**
     * Atualiza todos os agentes
     * @param {Array<Agent>} agents - Array de agentes
     * @param {number} deltaTime - Tempo desde última atualização
     */
    updateAgents(agents, deltaTime = 1) {
        for (const agent of agents) {
            if (!agent.active) continue;
            
            // Aplicar gravidade (se houver)
            if (this.gravity.magnitude() > 0) {
                agent.applyForce(this.gravity);
            }
            
            // Aplicar fricção
            this.applyFriction(agent);
            
            // Atualizar agente
            agent.update(deltaTime);
            
            logger.physics(`Agente ${agent.id} atualizado`, {
                position: agent.position.toString(),
                velocity: agent.velocity.toString()
            });
        }
    }

    /**
     * Aplica fricção ao agente
     * @param {Agent} agent - Agente
     */
    applyFriction(agent) {
        if (this.friction >= 1) return;
        
        agent.velocity.multiply(this.friction);
    }

    /**
     * Verifica se o agente está fora dos limites
     * @param {Agent} agent - Agente a verificar
     * @returns {boolean} True se está fora dos limites
     */
    isOutOfBounds(agent) {
        return agent.position.x < -this.boundaryMargin ||
               agent.position.x > this.canvasWidth + this.boundaryMargin ||
               agent.position.y < -this.boundaryMargin ||
               agent.position.y > this.canvasHeight + this.boundaryMargin;
    }

    /**
     * Mantém o agente dentro dos limites (bounce)
     * @param {Agent} agent - Agente
     * @param {number} damping - Fator de amortecimento (0-1)
     */
    constrainToBounds(agent, damping = 0.8) {
        const halfSize = agent.size / 2;
        
        // Borda esquerda
        if (agent.position.x < halfSize) {
            agent.position.x = halfSize;
            agent.velocity.x *= -damping;
            logger.physics(`Agente ${agent.id} colidiu com borda esquerda`);
        }
        
        // Borda direita
        if (agent.position.x > this.canvasWidth - halfSize) {
            agent.position.x = this.canvasWidth - halfSize;
            agent.velocity.x *= -damping;
            logger.physics(`Agente ${agent.id} colidiu com borda direita`);
        }
        
        // Borda superior
        if (agent.position.y < halfSize) {
            agent.position.y = halfSize;
            agent.velocity.y *= -damping;
            logger.physics(`Agente ${agent.id} colidiu com borda superior`);
        }
        
        // Borda inferior
        if (agent.position.y > this.canvasHeight - halfSize) {
            agent.position.y = this.canvasHeight - halfSize;
            agent.velocity.y *= -damping;
            logger.physics(`Agente ${agent.id} colidiu com borda inferior`);
        }
    }

    /**
     * Mantém o agente dentro dos limites (wrap)
     * @param {Agent} agent - Agente
     */
    wrapAroundBounds(agent) {
        const margin = agent.size;
        
        // Wrap horizontal
        if (agent.position.x < -margin) {
            agent.position.x = this.canvasWidth + margin;
        } else if (agent.position.x > this.canvasWidth + margin) {
            agent.position.x = -margin;
        }
        
        // Wrap vertical
        if (agent.position.y < -margin) {
            agent.position.y = this.canvasHeight + margin;
        } else if (agent.position.y > this.canvasHeight + margin) {
            agent.position.y = -margin;
        }
    }

    /**
     * Resolve colisão entre dois agentes
     * @param {Agent} agent1 - Primeiro agente
     * @param {Agent} agent2 - Segundo agente
     * @param {number} restitution - Coeficiente de restituição (0-1)
     */
    resolveCollision(agent1, agent2, restitution = 0.8) {
        // Calcular vetor de colisão
        const collision = Vector2D.subtract(agent2.position, agent1.position);
        const distance = collision.magnitude();
        
        // Verificar se há colisão
        const minDistance = (agent1.size + agent2.size) / 2;
        if (distance >= minDistance) return;
        
        // Normalizar vetor de colisão
        collision.normalize();
        
        // Calcular overlap
        const overlap = minDistance - distance;
        
        // Separar agentes
        const separation = Vector2D.multiply(collision, overlap / 2);
        agent1.position.subtract(separation);
        agent2.position.add(separation);
        
        // Calcular velocidades relativas
        const relativeVel = Vector2D.subtract(agent2.velocity, agent1.velocity);
        const velAlongCollision = relativeVel.dot(collision);
        
        // Não resolver se objetos estão se separando
        if (velAlongCollision > 0) return;
        
        // Calcular impulso
        const impulse = -(1 + restitution) * velAlongCollision;
        const impulseVec = Vector2D.multiply(collision, impulse);
        
        // Aplicar impulso
        agent1.velocity.subtract(Vector2D.multiply(impulseVec, 1 / agent1.mass));
        agent2.velocity.add(Vector2D.multiply(impulseVec, 1 / agent2.mass));
        
        logger.physics('Colisão resolvida', {
            agent1: agent1.id,
            agent2: agent2.id,
            overlap: overlap.toFixed(2)
        });
    }

    /**
     * Aplica força de separação entre agentes
     * @param {Agent} agent - Agente
     * @param {Array<Agent>} others - Outros agentes
     * @param {number} separationRadius - Raio de separação
     * @param {number} separationForce - Força de separação
     */
    applySeparation(agent, others, separationRadius = 50, separationForce = 0.5) {
        const steering = new Vector2D(0, 0);
        let count = 0;
        
        for (const other of others) {
            if (other === agent || !other.active) continue;
            
            const distance = agent.distanceTo(other);
            
            if (distance > 0 && distance < separationRadius) {
                // Calcular força de repulsão
                const diff = Vector2D.subtract(agent.position, other.position);
                diff.normalize();
                diff.divide(distance); // Peso baseado na distância
                steering.add(diff);
                count++;
            }
        }
        
        if (count > 0) {
            steering.divide(count);
            steering.normalize();
            steering.multiply(agent.maxSpeed);
            steering.subtract(agent.velocity);
            steering.limit(separationForce);
            
            agent.applyForce(steering);
        }
    }

    /**
     * Define a gravidade
     * @param {number} x - Componente X da gravidade
     * @param {number} y - Componente Y da gravidade
     */
    setGravity(x, y) {
        this.gravity.set(x, y);
        logger.physics('Gravidade definida', {
            gravity: this.gravity.toString()
        });
    }

    /**
     * Define a fricção
     * @param {number} friction - Valor de fricção (0-1)
     */
    setFriction(friction) {
        this.friction = MathUtils.clamp(friction, 0, 1);
        logger.physics('Fricção definida', { friction: this.friction });
    }

    /**
     * Define as dimensões do canvas
     * @param {number} width - Largura
     * @param {number} height - Altura
     */
    setCanvasDimensions(width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;
        logger.physics('Dimensões do canvas atualizadas', {
            width: this.canvasWidth,
            height: this.canvasHeight
        });
    }

    /**
     * Calcula energia cinética de um agente
     * @param {Agent} agent - Agente
     * @returns {number} Energia cinética
     */
    calculateKineticEnergy(agent) {
        // KE = 0.5 * m * v²
        return 0.5 * agent.mass * agent.velocity.magnitudeSquared();
    }

    /**
     * Calcula momentum de um agente
     * @param {Agent} agent - Agente
     * @returns {Vector2D} Momentum
     */
    calculateMomentum(agent) {
        // p = m * v
        return Vector2D.multiply(agent.velocity, agent.mass);
    }

    /**
     * Retorna informações de debug
     * @returns {Object} Informações de debug
     */
    getDebugInfo() {
        return {
            gravity: this.gravity.toString(),
            friction: this.friction,
            canvasSize: `${this.canvasWidth}x${this.canvasHeight}`,
            boundaryMargin: this.boundaryMargin
        };
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PhysicsEngine;
}