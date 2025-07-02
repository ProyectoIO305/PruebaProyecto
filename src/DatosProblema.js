export default class DatosProblema {
    constructor() {
        this.coefObjetivo = []; // Ejemplo: [3, 2, 5]
        this.restriccionesBase = []; // Cada restricción es: { coef: [], operador: '<=', valor: 10 }
    }

    agregarRestriccion(coef, operador, valor) {
        this.restriccionesBase.push({ coef, operador, valor });
    }
}