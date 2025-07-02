export default class NodoArbol {
  constructor(id, restriccionesBase, restriccionesAdicionales, coefObjetivo, solucion, z, esEntera, esInfeasible = false) {
    this.id = id; // Nombre como "PL1", "PL2", etc.

    // Guardamos la función objetivo y todas las restricciones activas
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

