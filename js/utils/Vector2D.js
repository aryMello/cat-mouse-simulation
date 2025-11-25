/**
 * Vector2D.js
 * Classe utilitária para operações com vetores 2D
 * Facilita cálculos de física e geometria
 */

class Vector2D {
    /**
     * Cria um novo vetor 2D
     * @param {number} x - Componente X
     * @param {number} y - Componente Y
     */
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    /**
     * Define os valores do vetor
     * @param {number} x - Novo valor X
     * @param {number} y - Novo valor Y
     * @returns {Vector2D} Este vetor (para encadeamento)
     */
    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }

    /**
     * Copia valores de outro vetor
     * @param {Vector2D} v - Vetor a copiar
     * @returns {Vector2D} Este vetor (para encadeamento)
     */
    copy(v) {
        this.x = v.x;
        this.y = v.y;
        return this;
    }

    /**
     * Cria uma cópia deste vetor
     * @returns {Vector2D} Novo vetor com os mesmos valores
     */
    clone() {
        return new Vector2D(this.x, this.y);
    }

    /**
     * Adiciona outro vetor a este
     * @param {Vector2D} v - Vetor a adicionar
     * @returns {Vector2D} Este vetor (para encadeamento)
     */
    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    /**
     * Subtrai outro vetor deste
     * @param {Vector2D} v - Vetor a subtrair
     * @returns {Vector2D} Este vetor (para encadeamento)
     */
    subtract(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    /**
     * Multiplica o vetor por um escalar
     * @param {number} scalar - Valor a multiplicar
     * @returns {Vector2D} Este vetor (para encadeamento)
     */
    multiply(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    /**
     * Divide o vetor por um escalar
     * @param {number} scalar - Valor a dividir
     * @returns {Vector2D} Este vetor (para encadeamento)
     */
    divide(scalar) {
        if (scalar !== 0) {
            this.x /= scalar;
            this.y /= scalar;
        }
        return this;
    }

    /**
     * Calcula a magnitude (comprimento) do vetor
     * @returns {number} Magnitude do vetor
     */
    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    /**
     * Calcula a magnitude ao quadrado (mais eficiente)
     * @returns {number} Magnitude ao quadrado
     */
    magnitudeSquared() {
        return this.x * this.x + this.y * this.y;
    }

    /**
     * Normaliza o vetor (magnitude = 1)
     * @returns {Vector2D} Este vetor (para encadeamento)
     */
    normalize() {
        const mag = this.magnitude();
        if (mag > 0) {
            this.divide(mag);
        }
        return this;
    }

    /**
     * Define a magnitude do vetor mantendo a direção
     * @param {number} mag - Nova magnitude
     * @returns {Vector2D} Este vetor (para encadeamento)
     */
    setMagnitude(mag) {
        return this.normalize().multiply(mag);
    }

    /**
     * Limita a magnitude do vetor
     * @param {number} max - Magnitude máxima
     * @returns {Vector2D} Este vetor (para encadeamento)
     */
    limit(max) {
        const magSq = this.magnitudeSquared();
        if (magSq > max * max) {
            this.normalize().multiply(max);
        }
        return this;
    }

    /**
     * Calcula a distância até outro vetor
     * @param {Vector2D} v - Vetor destino
     * @returns {number} Distância
     */
    distanceTo(v) {
        const dx = v.x - this.x;
        const dy = v.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Calcula a distância ao quadrado (mais eficiente)
     * @param {Vector2D} v - Vetor destino
     * @returns {number} Distância ao quadrado
     */
    distanceSquaredTo(v) {
        const dx = v.x - this.x;
        const dy = v.y - this.y;
        return dx * dx + dy * dy;
    }

    /**
     * Calcula o produto escalar (dot product)
     * @param {Vector2D} v - Outro vetor
     * @returns {number} Produto escalar
     */
    dot(v) {
        return this.x * v.x + this.y * v.y;
    }

    /**
     * Calcula o ângulo do vetor em radianos
     * @returns {number} Ângulo em radianos
     */
    angle() {
        return Math.atan2(this.y, this.x);
    }

    /**
     * Rotaciona o vetor por um ângulo
     * @param {number} angle - Ângulo em radianos
     * @returns {Vector2D} Este vetor (para encadeamento)
     */
    rotate(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const x = this.x * cos - this.y * sin;
        const y = this.x * sin + this.y * cos;
        this.x = x;
        this.y = y;
        return this;
    }

    /**
     * Interpola linearmente entre este vetor e outro
     * @param {Vector2D} v - Vetor destino
     * @param {number} t - Fator de interpolação (0-1)
     * @returns {Vector2D} Este vetor (para encadeamento)
     */
    lerp(v, t) {
        this.x += (v.x - this.x) * t;
        this.y += (v.y - this.y) * t;
        return this;
    }

    /**
     * Converte o vetor para string (para debug)
     * @returns {string} Representação em string
     */
    toString() {
        return `Vector2D(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
    }

    // Métodos estáticos

    /**
     * Cria um vetor a partir de um ângulo
     * @param {number} angle - Ângulo em radianos
     * @param {number} magnitude - Magnitude do vetor
     * @returns {Vector2D} Novo vetor
     */
    static fromAngle(angle, magnitude = 1) {
        return new Vector2D(
            Math.cos(angle) * magnitude,
            Math.sin(angle) * magnitude
        );
    }

    /**
     * Cria um vetor aleatório
     * @param {number} magnitude - Magnitude do vetor
     * @returns {Vector2D} Novo vetor aleatório
     */
    static random(magnitude = 1) {
        const angle = Math.random() * Math.PI * 2;
        return Vector2D.fromAngle(angle, magnitude);
    }

    /**
     * Adiciona dois vetores sem modificá-los
     * @param {Vector2D} v1 - Primeiro vetor
     * @param {Vector2D} v2 - Segundo vetor
     * @returns {Vector2D} Novo vetor resultado
     */
    static add(v1, v2) {
        return new Vector2D(v1.x + v2.x, v1.y + v2.y);
    }

    /**
     * Subtrai dois vetores sem modificá-los
     * @param {Vector2D} v1 - Primeiro vetor
     * @param {Vector2D} v2 - Segundo vetor
     * @returns {Vector2D} Novo vetor resultado
     */
    static subtract(v1, v2) {
        return new Vector2D(v1.x - v2.x, v1.y - v2.y);
    }

    /**
     * Multiplica um vetor por um escalar sem modificá-lo
     * @param {Vector2D} v - Vetor
     * @param {number} scalar - Escalar
     * @returns {Vector2D} Novo vetor resultado
     */
    static multiply(v, scalar) {
        return new Vector2D(v.x * scalar, v.y * scalar);
    }

    /**
     * Calcula a distância entre dois vetores
     * @param {Vector2D} v1 - Primeiro vetor
     * @param {Vector2D} v2 - Segundo vetor
     * @returns {number} Distância
     */
    static distance(v1, v2) {
        return v1.distanceTo(v2);
    }
}

// Exportar se estiver em módulo ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Vector2D;
}