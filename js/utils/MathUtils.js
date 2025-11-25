/**
 * MathUtils.js
 * Funções utilitárias matemáticas para a simulação
 */

const MathUtils = {
    /**
     * Limita um valor entre min e max
     * @param {number} value - Valor a limitar
     * @param {number} min - Valor mínimo
     * @param {number} max - Valor máximo
     * @returns {number} Valor limitado
     */
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    /**
     * Interpola linearmente entre dois valores
     * @param {number} start - Valor inicial
     * @param {number} end - Valor final
     * @param {number} t - Fator de interpolação (0-1)
     * @returns {number} Valor interpolado
     */
    lerp(start, end, t) {
        return start + (end - start) * t;
    },

    /**
     * Mapeia um valor de um intervalo para outro
     * @param {number} value - Valor a mapear
     * @param {number} inMin - Mínimo do intervalo de entrada
     * @param {number} inMax - Máximo do intervalo de entrada
     * @param {number} outMin - Mínimo do intervalo de saída
     * @param {number} outMax - Máximo do intervalo de saída
     * @returns {number} Valor mapeado
     */
    map(value, inMin, inMax, outMin, outMax) {
        return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
    },

    /**
     * Gera um número aleatório entre min e max
     * @param {number} min - Valor mínimo
     * @param {number} max - Valor máximo
     * @returns {number} Número aleatório
     */
    random(min = 0, max = 1) {
        return Math.random() * (max - min) + min;
    },

    /**
     * Gera um número inteiro aleatório entre min e max (inclusive)
     * @param {number} min - Valor mínimo
     * @param {number} max - Valor máximo
     * @returns {number} Inteiro aleatório
     */
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * Converte graus para radianos
     * @param {number} degrees - Ângulo em graus
     * @returns {number} Ângulo em radianos
     */
    degToRad(degrees) {
        return degrees * (Math.PI / 180);
    },

    /**
     * Converte radianos para graus
     * @param {number} radians - Ângulo em radianos
     * @returns {number} Ângulo em graus
     */
    radToDeg(radians) {
        return radians * (180 / Math.PI);
    },

    /**
     * Calcula a distância entre dois pontos
     * @param {number} x1 - Coordenada X do ponto 1
     * @param {number} y1 - Coordenada Y do ponto 1
     * @param {number} x2 - Coordenada X do ponto 2
     * @param {number} y2 - Coordenada Y do ponto 2
     * @returns {number} Distância
     */
    distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },

    /**
     * Calcula a distância ao quadrado (mais eficiente)
     * @param {number} x1 - Coordenada X do ponto 1
     * @param {number} y1 - Coordenada Y do ponto 1
     * @param {number} x2 - Coordenada X do ponto 2
     * @param {number} y2 - Coordenada Y do ponto 2
     * @returns {number} Distância ao quadrado
     */
    distanceSquared(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return dx * dx + dy * dy;
    },

    /**
     * Normaliza um ângulo para o intervalo [0, 2π]
     * @param {number} angle - Ângulo em radianos
     * @returns {number} Ângulo normalizado
     */
    normalizeAngle(angle) {
        while (angle < 0) angle += Math.PI * 2;
        while (angle >= Math.PI * 2) angle -= Math.PI * 2;
        return angle;
    },

    /**
     * Calcula a diferença angular mais curta
     * @param {number} angle1 - Primeiro ângulo em radianos
     * @param {number} angle2 - Segundo ângulo em radianos
     * @returns {number} Diferença angular (-π a π)
     */
    angleDifference(angle1, angle2) {
        let diff = angle2 - angle1;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        return diff;
    },

    /**
     * Verifica se um ponto está dentro de um retângulo
     * @param {number} px - X do ponto
     * @param {number} py - Y do ponto
     * @param {number} rx - X do retângulo
     * @param {number} ry - Y do retângulo
     * @param {number} rw - Largura do retângulo
     * @param {number} rh - Altura do retângulo
     * @returns {boolean} True se o ponto está dentro
     */
    pointInRect(px, py, rx, ry, rw, rh) {
        return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
    },

    /**
     * Verifica se um ponto está dentro de um círculo
     * @param {number} px - X do ponto
     * @param {number} py - Y do ponto
     * @param {number} cx - X do centro do círculo
     * @param {number} cy - Y do centro do círculo
     * @param {number} radius - Raio do círculo
     * @returns {boolean} True se o ponto está dentro
     */
    pointInCircle(px, py, cx, cy, radius) {
        return this.distanceSquared(px, py, cx, cy) <= radius * radius;
    },

    /**
     * Verifica se dois círculos estão colidindo
     * @param {number} x1 - X do centro do círculo 1
     * @param {number} y1 - Y do centro do círculo 1
     * @param {number} r1 - Raio do círculo 1
     * @param {number} x2 - X do centro do círculo 2
     * @param {number} y2 - Y do centro do círculo 2
     * @param {number} r2 - Raio do círculo 2
     * @returns {boolean} True se há colisão
     */
    circleCollision(x1, y1, r1, x2, y2, r2) {
        const minDist = r1 + r2;
        return this.distanceSquared(x1, y1, x2, y2) <= minDist * minDist;
    },

    /**
     * Arredonda um número para N casas decimais
     * @param {number} value - Valor a arredondar
     * @param {number} decimals - Número de casas decimais
     * @returns {number} Valor arredondado
     */
    round(value, decimals = 2) {
        const multiplier = Math.pow(10, decimals);
        return Math.round(value * multiplier) / multiplier;
    },

    /**
     * Calcula a média de um array de números
     * @param {number[]} values - Array de valores
     * @returns {number} Média
     */
    average(values) {
        if (values.length === 0) return 0;
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    },

    /**
     * Suaviza a transição entre dois valores
     * @param {number} current - Valor atual
     * @param {number} target - Valor alvo
     * @param {number} smoothing - Fator de suavização (0-1)
     * @returns {number} Valor suavizado
     */
    smoothDamp(current, target, smoothing) {
        return this.lerp(current, target, 1 - smoothing);
    },

    /**
     * Retorna o sinal de um número (-1, 0, ou 1)
     * @param {number} value - Valor
     * @returns {number} Sinal
     */
    sign(value) {
        return value > 0 ? 1 : value < 0 ? -1 : 0;
    },

    /**
     * Verifica se um número é aproximadamente igual a outro
     * @param {number} a - Primeiro número
     * @param {number} b - Segundo número
     * @param {number} epsilon - Margem de erro
     * @returns {boolean} True se aproximadamente igual
     */
    approximately(a, b, epsilon = 0.0001) {
        return Math.abs(a - b) < epsilon;
    }
};

// Exportar se estiver em módulo ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MathUtils;
}