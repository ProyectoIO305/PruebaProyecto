export default class NodoArbol {
  constructor(id, restriccionesBase, restriccionesAdicionales, coefObjetivo, solucion, z, esEntera, esInfeasible = false) {
    this.id = id;

    this.coefObjetivo = coefObjetivo;
    this.restriccionesBase = restriccionesBase;
    this.restriccionesAdicionales = restriccionesAdicionales;

    this.solucion = solucion;
    this.z = z;

    this.esEntera = esEntera;
    this.esInfeasible = esInfeasible;

    this.ramaIzquierda = null;
    this.ramaDerecha = null;
  }
}

