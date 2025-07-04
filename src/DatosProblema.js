export default class DatosProblema {
    constructor() {
        this.coefObjetivo = [];
        this.restriccionesBase = [];
    }

    agregarRestriccion(coef, operador, valor) {
        this.restriccionesBase.push({ coef, operador, valor });
    }
}