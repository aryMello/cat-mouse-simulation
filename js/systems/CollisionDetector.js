/**
 * CollisionDetector.js
 * Sistema de detecção de colisões
 * Verifica interações entre agentes
 */

class CollisionDetector {
    /**
     * Cria um novo detector de colisões
     */
    constructor() {
        this.captureDistance = CONFIG.physics.captureDistance;
        this.collisionHistory = [];
        this.maxHistoryLength = 100;
        
        logger.info('Detector de colisões inicializado', {
            captureDistance: this.captureDistance
        });
    }

    /**
     * Verifica se houve captura
     * @param {Frajola} chaser - Perseguidor
     * @param {Ligeirinho} target - Alvo
     * @returns {boolean} True se houve captura
     */
    checkCapture(chaser, target) {
        if (!chaser || !target || !target.active) {
            return false;
        }

        const distance = chaser.distanceTo(target);
        const captured = distance < this.captureDistance;

        if (captured) {
            this.recordCollision('capture', chaser, target, distance);
            
            logger.info('🎯 CAPTURA DETECTADA!', {
                distance: distance.toFixed(2),
                chaserPos: chaser.position.toString(),
                targetPos: target.position.toString()
            });
        }

        return captured;
    }

    /**
     * Verifica colisão circular entre dois agentes
     * @param {Agent} agent1 - Primeiro agente
     * @param {Agent} agent2 - Segundo agente
     * @returns {boolean} True se há colisão
     */
    checkCircleCollision(agent1, agent2) {
        if (!agent1 || !agent2 || !agent1.active || !agent2.active) {
            return false;
        }

        const distance = agent1.distanceTo(agent2);
        const minDistance = (agent1.size + agent2.size) / 2;
        
        const colliding = distance < minDistance;

        if (colliding) {
            this.recordCollision('circle', agent1, agent2, distance);
        }

        return colliding;
    }

    /**
     * Verifica colisão AABB (Axis-Aligned Bounding Box)
     * @param {Agent} agent1 - Primeiro agente
     * @param {Agent} agent2 - Segundo agente
     * @returns {boolean} True se há colisão
     */
    checkAABBCollision(agent1, agent2) {
        if (!agent1 || !agent2 || !agent1.active || !agent2.active) {
            return false;
        }

        const half1 = agent1.size / 2;
        const half2 = agent2.size / 2;

        const colliding = 
            agent1.position.x - half1 < agent2.position.x + half2 &&
            agent1.position.x + half1 > agent2.position.x - half2 &&
            agent1.position.y - half1 < agent2.position.y + half2 &&
            agent1.position.y + half1 > agent2.position.y - half2;

        if (colliding) {
            this.recordCollision('aabb', agent1, agent2);
        }

        return colliding;
    }

    /**
     * Verifica se um agente está próximo de outro
     * @param {Agent} agent1 - Primeiro agente
     * @param {Agent} agent2 - Segundo agente
     * @param {number} threshold - Distância de proximidade
     * @returns {boolean} True se estão próximos
     */
    checkProximity(agent1, agent2, threshold) {
        if (!agent1 || !agent2 || !agent1.active || !agent2.active) {
            return false;
        }

        const distance = agent1.distanceTo(agent2);
        return distance < threshold;
    }

    /**
     * Verifica colisão de um agente com um ponto
     * @param {Agent} agent - Agente
     * @param {number} x - Coordenada X do ponto
     * @param {number} y - Coordenada Y do ponto
     * @returns {boolean} True se há colisão
     */
    checkPointCollision(agent, x, y) {
        if (!agent || !agent.active) {
            return false;
        }

        const distance = Math.sqrt(
            Math.pow(agent.position.x - x, 2) +
            Math.pow(agent.position.y - y, 2)
        );

        return distance < agent.size / 2;
    }

    /**
     * Verifica colisão com linha (usado para raycast)
     * @param {Agent} agent - Agente
     * @param {Vector2D} lineStart - Início da linha
     * @param {Vector2D} lineEnd - Fim da linha
     * @returns {boolean} True se há colisão
     */
    checkLineCollision(agent, lineStart, lineEnd) {
        if (!agent || !agent.active) {
            return false;
        }

        // Calcular distância do centro do agente até a linha
        const lineVec = Vector2D.subtract(lineEnd, lineStart);
        const agentVec = Vector2D.subtract(agent.position, lineStart);
        
        const lineLength = lineVec.magnitude();
        lineVec.normalize();
        
        const projection = agentVec.dot(lineVec);
        
        // Verificar se a projeção está dentro do segmento
        if (projection < 0 || projection > lineLength) {
            return false;
        }
        
        // Calcular ponto mais próximo na linha
        const closestPoint = Vector2D.add(
            lineStart,
            Vector2D.multiply(lineVec, projection)
        );
        
        // Verificar distância
        const distance = Vector2D.distance(agent.position, closestPoint);
        return distance < agent.size / 2;
    }

    /**
     * Registra uma colisão no histórico
     * @param {string} type - Tipo de colisão
     * @param {Agent} agent1 - Primeiro agente
     * @param {Agent} agent2 - Segundo agente
     * @param {number} distance - Distância (opcional)
     */
    recordCollision(type, agent1, agent2, distance = null) {
        const collision = {
            type,
            timestamp: Date.now(),
            agent1Id: agent1.id,
            agent2Id: agent2.id,
            distance: distance,
            position: agent1.position.clone()
        };

        this.collisionHistory.push(collision);

        // Limitar tamanho do histórico
        if (this.collisionHistory.length > this.maxHistoryLength) {
            this.collisionHistory.shift();
        }

        logger.debug('Colisão registrada', collision);
    }

    /**
     * Define a distância de captura
     * @param {number} distance - Nova distância
     */
    setCaptureDistance(distance) {
        this.captureDistance = MathUtils.clamp(distance, 10, 100);
        logger.info('Distância de captura atualizada', {
            captureDistance: this.captureDistance
        });
    }

    /**
     * Retorna colisões recentes de um tipo específico
     * @param {string} type - Tipo de colisão
     * @param {number} timeWindow - Janela de tempo em ms
     * @returns {Array} Array de colisões
     */
    getRecentCollisions(type = null, timeWindow = 1000) {
        const now = Date.now();
        const cutoff = now - timeWindow;

        return this.collisionHistory.filter(collision => {
            const timeMatch = collision.timestamp >= cutoff;
            const typeMatch = type === null || collision.type === type;
            return timeMatch && typeMatch;
        });
    }

    /**
     * Conta capturas em um período
     * @param {number} timeWindow - Janela de tempo em ms
     * @returns {number} Número de capturas
     */
    countCapturesInPeriod(timeWindow = 60000) {
        const captures = this.getRecentCollisions('capture', timeWindow);
        return captures.length;
    }

    /**
     * Calcula taxa de colisão
     * @param {number} timeWindow - Janela de tempo em ms
     * @returns {number} Colisões por segundo
     */
    getCollisionRate(timeWindow = 10000) {
        const collisions = this.getRecentCollisions(null, timeWindow);
        return (collisions.length / timeWindow) * 1000;
    }

    /**
     * Limpa o histórico de colisões
     */
    clearHistory() {
        this.collisionHistory = [];
        logger.info('Histórico de colisões limpo');
    }

    /**
     * Retorna estatísticas de colisões
     * @returns {Object} Estatísticas
     */
    getStats() {
        const totalCollisions = this.collisionHistory.length;
        const captures = this.collisionHistory.filter(c => c.type === 'capture').length;
        const others = totalCollisions - captures;

        return {
            total: totalCollisions,
            captures: captures,
            others: others,
            captureRate: totalCollisions > 0 ? 
                ((captures / totalCollisions) * 100).toFixed(2) + '%' : '0%',
            recentRate: this.getCollisionRate().toFixed(2) + '/s'
        };
    }

    /**
     * Retorna informações de debug
     * @returns {Object} Informações de debug
     */
    getDebugInfo() {
        return {
            captureDistance: this.captureDistance,
            historyLength: this.collisionHistory.length,
            stats: this.getStats()
        };
    }

    /**
     * Reseta o detector
     */
    reset() {
        this.clearHistory();
        logger.info('Detector de colisões resetado');
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CollisionDetector;
}