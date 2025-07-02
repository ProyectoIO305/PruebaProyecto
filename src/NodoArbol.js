export default class NodoArbol {
  constructor(id, restricciones, solucion, z, esEntera, esInfeasible = false) {
    this.id = id; // Nombre como "PL1", "PL2", etc.
    this.restricciones = restricciones; // Las restricciones acumuladas hasta este nodo
    this.solucion = solucion; // Array con los valores de las variables
    this.z = z; // Valor de la función objetivo
    this.esEntera = esEntera;
    this.esInfeasible = esInfeasible;
    this.ramaIzquierda = null; // Nodo hijo izquierdo
    this.ramaDerecha = null;   // Nodo hijo derecho
  }
}
