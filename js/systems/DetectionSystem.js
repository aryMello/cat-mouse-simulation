/**
 * DetectionSystem.js
 * Sistema de detecção de alvos
 * Implementa diferentes métodos de detecção
 */

class DetectionSystem {
    /**
     * Cria um novo sistema de detecção
     */
    constructor() {
        this.sensitivity = CONFIG.detection.baseSensitivity;
        this.detectionMethod = 'radius'; // 'radius', 'cone', 'raycast'
        this.detectionHistory = [];
        this.maxHistoryLength = 60; // 1 segundo a 60 FPS
        
        logger.info('Sistema de detecção inicializado', {
            sensitivity: this.sensitivity,
            method: this.detectionMethod
        });
    }

    /**
     * Detecta se o alvo está visível para o perseguidor
     * @param {Frajola} chaser - Perseguidor
     * @param {Ligeirinho} target - Alvo
     * @returns {boolean} True se alvo foi detectado
     */
    detect(chaser, target) {
        if (!chaser || !target || !target.active) {
            return false;
        }

        let detected = false;

        switch (this.detectionMethod) {
            case 'radius':
                detected = this.radiusDetection(chaser, target);
                break;
            case 'cone':
                detected = this.coneDetection(chaser, target);
                break;
            case 'raycast':
                detected = this.raycastDetection(chaser, target);
                break;
            default:
                detected = this.radiusDetection(chaser, target);
        }

        // Atualizar histórico
        this.updateDetectionHistory(detected);

        logger.detection(`Detecção: ${detected ? 'POSITIVA' : 'NEGATIVA'}`, {
            method: this.detectionMethod,
            distance: chaser.distanceTo(target).toFixed(2)
        });

        return detected;
    }

    /**
     * Detecção baseada em raio
     * @param {Frajola} chaser - Perseguidor
     * @param {Ligeirinho} target - Alvo
     * @returns {boolean} True se detectado
     */
    radiusDetection(chaser, target) {
        const distance = chaser.distanceTo(target);
        const effectiveRadius = chaser.detectionRadius * this.sensitivity;
        
        return distance <= effectiveRadius;
    }

    /**
     * Detecção baseada em cone de visão
     * @param {Frajola} chaser - Perseguidor
     * @param {Ligeirinho} target - Alvo
     * @param {number} coneAngle - Ângulo do cone em radianos (padrão: 120°)
     * @returns {boolean} True se detectado
     */
    coneDetection(chaser, target, coneAngle = Math.PI * 2 / 3) {
        // Primeiro verificar raio
        if (!this.radiusDetection(chaser, target)) {
            return false;
        }

        // Calcular direção do perseguidor
        const chaserDirection = chaser.velocity.angle();
        
        // Calcular direção para o alvo
        const toTarget = Vector2D.subtract(target.position, chaser.position);
        const targetDirection = toTarget.angle();
        
        // Calcular diferença angular
        const angleDiff = Math.abs(MathUtils.angleDifference(chaserDirection, targetDirection));
        
        // Verificar se está dentro do cone
        return angleDiff <= coneAngle / 2;
    }

    /**
     * Detecção baseada em raycast (linha de visão)
     * @param {Frajola} chaser - Perseguidor
     * @param {Ligeirinho} target - Alvo
     * @param {Array} obstacles - Array de obstáculos (não implementado)
     * @returns {boolean} True se detectado
     */
    raycastDetection(chaser, target, obstacles = []) {
        // Primeiro verificar raio
        if (!this.radiusDetection(chaser, target)) {
            return false;
        }

        // TODO: Verificar se há obstáculos entre o perseguidor e o alvo
        // Por enquanto, apenas retorna true se estiver no raio
        return true;
    }

    /**
     * Define a sensibilidade de detecção
     * @param {number} sensitivity - Valor de sensibilidade (0.3 a 1.5)
     */
    setSensitivity(sensitivity) {
        this.sensitivity = MathUtils.clamp(sensitivity, 
            CONFIG.detection.minSensitivity, 
            CONFIG.detection.maxSensitivity
        );
        
        logger.detection('Sensibilidade atualizada', {
            sensitivity: this.sensitivity
        });
    }

    /**
     * Define o método de detecção
     * @param {string} method - Método ('radius', 'cone', 'raycast')
     */
    setDetectionMethod(method) {
        const validMethods = ['radius', 'cone', 'raycast'];
        
        if (validMethods.includes(method)) {
            this.detectionMethod = method;
            logger.detection('Método de detecção alterado', {
                method: this.detectionMethod
            });
        } else {
            logger.warn('Método de detecção inválido', { method });
        }
    }

    /**
     * Atualiza o histórico de detecção
     * @param {boolean} detected - Se foi detectado neste frame
     */
    updateDetectionHistory(detected) {
        this.detectionHistory.push(detected);
        
        if (this.detectionHistory.length > this.maxHistoryLength) {
            this.detectionHistory.shift();
        }
    }

    /**
     * Calcula a taxa de detecção recente
     * @param {number} frames - Número de frames para analisar
     * @returns {number} Taxa de detecção (0-1)
     */
    getRecentDetectionRate(frames = 60) {
        const recentHistory = this.detectionHistory.slice(-frames);
        
        if (recentHistory.length === 0) {
            return 0;
        }
        
        const detections = recentHistory.filter(d => d).length;
        return detections / recentHistory.length;
    }

    /**
     * Verifica se houve perda recente de detecção
     * @param {number} frames - Número de frames para verificar
     * @returns {boolean} True se perdeu detecção recentemente
     */
    hasRecentLoss(frames = 10) {
        const recentHistory = this.detectionHistory.slice(-frames);
        
        // Verificar se tinha detecção e perdeu
        const hadDetection = recentHistory.slice(0, frames / 2).some(d => d);
        const lostDetection = recentHistory.slice(-frames / 2).every(d => !d);
        
        return hadDetection && lostDetection;
    }

    /**
     * Calcula distância efetiva de detecção considerando sensibilidade
     * @param {Frajola} chaser - Perseguidor
     * @returns {number} Distância efetiva em pixels
     */
    getEffectiveDetectionRange(chaser) {
        return chaser.detectionRadius * this.sensitivity;
    }

    /**
     * Retorna estatísticas de detecção
     * @returns {Object} Estatísticas
     */
    getStats() {
        const totalFrames = this.detectionHistory.length;
        const detectedFrames = this.detectionHistory.filter(d => d).length;
        const detectionRate = totalFrames > 0 ? detectedFrames / totalFrames : 0;
        
        return {
            totalFrames,
            detectedFrames,
            detectionRate: (detectionRate * 100).toFixed(2) + '%',
            currentlyDetected: this.detectionHistory[this.detectionHistory.length - 1] || false,
            recentDetectionRate: (this.getRecentDetectionRate() * 100).toFixed(2) + '%'
        };
    }

    /**
     * Reseta o sistema de detecção
     */
    reset() {
        this.detectionHistory = [];
        logger.detection('Sistema de detecção resetado');
    }

    /**
     * Retorna informações de debug
     * @returns {Object} Informações de debug
     */
    getDebugInfo() {
        return {
            sensitivity: this.sensitivity,
            method: this.detectionMethod,
            historyLength: this.detectionHistory.length,
            stats: this.getStats()
        };
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DetectionSystem;
}