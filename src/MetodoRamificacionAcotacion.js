import MetodoSimplex from './MetodoSimplex';
import NodoArbol from './NodoArbol';

export default class MetodoRamificacionAcotacion {
  constructor(tipo, cantidadVariables, datosOriginales) {
    this.simplex = new MetodoSimplex();
    this.mejorZ = -Infinity;
    this.mejorSolucion = null;

    this.tipo = tipo;
    this.cantidadVariables = cantidadVariables;
    this.datosOriginales = datosOriginales;

    this.contadorNodos = 1; // Para nombrar nodos como PL1, PL2, etc.
    this.arbol = null; // Aquí se guardará la raíz del árbol
  }

  async iniciar() {
    await this.ramificar(this.datosOriginales, [], null, true);

    if (this.mejorSolucion !== null) {
      return { solucion: this.mejorSolucion, z: this.mejorZ, arbol: this.arbol };
    } else {
      return null;
    }
  }

  async ramificar(datos, restriccionesAdicionales, nodoPadre = null, esRaiz = false) {
    const resultado = await this.simplex.metodoSimplexDesdeDatos(
      this.tipo,
      this.cantidadVariables,
      datos,
      restriccionesAdicionales
    );

    let idNodo = 'PL' + this.contadorNodos;
    this.contadorNodos++;

    let nodoActual;

    if (resultado === null) {
      console.log('⛔ Solución no factible. Rama muerta.');

      nodoActual = new NodoArbol(idNodo, JSON.parse(JSON.stringify(restriccionesAdicionales)), null, null, false, true);

      if (nodoPadre && !nodoPadre.ramaIzquierda) {
        nodoPadre.ramaIzquierda = nodoActual;
      } else if (nodoPadre) {
        nodoPadre.ramaDerecha = nodoActual;
      }

      if (esRaiz) this.arbol = nodoActual;
      return;
    }

    let solucion = resultado.slice(0, this.cantidadVariables);
    let z = resultado[this.cantidadVariables];

    let esEntera = true;
    for (let i = 0; i < this.cantidadVariables; i++) {
      if (Math.abs(solucion[i] - Math.round(solucion[i])) > 1e-5) {
        esEntera = false;
        break;
      }
    }

    nodoActual = new NodoArbol(idNodo, JSON.parse(JSON.stringify(restriccionesAdicionales)), solucion, z, esEntera, false);

    if (nodoPadre && !nodoPadre.ramaIzquierda) {
      nodoPadre.ramaIzquierda = nodoActual;
    } else if (nodoPadre) {
      nodoPadre.ramaDerecha = nodoActual;
    }

    if (esRaiz) this.arbol = nodoActual;

    if (esEntera) {
      if (z > this.mejorZ) {
        this.mejorZ = z;
        this.mejorSolucion = solucion;

        console.log('✅ NUEVA mejor solución entera encontrada:');
        console.log(`Z = ${this.mejorZ}`);
      } else {
        console.log('ℹ️ Solución entera no mejora Z.');
      }
      return;
    }

    let varFraccional = -1;
    let maxFrac = 0;

    for (let i = 0; i < this.cantidadVariables; i++) {
      let frac = solucion[i] - Math.floor(solucion[i]);
      frac = Math.min(frac, 1.0 - frac);
      if (frac > maxFrac + 1e-5) {
        maxFrac = frac;
        varFraccional = i;
      }
    }

    if (varFraccional === -1) {
      console.log('⚠️ No hay variable fraccional. Esto no debería ocurrir aquí.');
      return;
    }

    const varIndex = varFraccional;
    const valor = solucion[varIndex];

    console.log(`📌 Ramificando variable x${varIndex + 1} = ${valor.toFixed(4)}`);

    const ramaIzq = JSON.parse(JSON.stringify(restriccionesAdicionales));
    ramaIzq.push({
      coef: this.crearCoeficiente(varIndex),
      operador: '<=',
      valor: Math.floor(valor)
    });
    console.log(`↙️  Rama Izquierda: x${varIndex + 1} <= ${Math.floor(valor)}`);
    await this.ramificar(datos, ramaIzq, nodoActual, false);

    const ramaDer = JSON.parse(JSON.stringify(restriccionesAdicionales));
    ramaDer.push({
      coef: this.crearCoeficiente(varIndex),
      operador: '>=',
      valor: Math.ceil(valor)
    });
    console.log(`↘️  Rama Derecha: x${varIndex + 1} >= ${Math.ceil(valor)}`);
    await this.ramificar(datos, ramaDer, nodoActual, false);
  }

  crearCoeficiente(index) {
    const coef = Array(this.cantidadVariables).fill(0);
    coef[index] = 1;
    return coef;
  }
}
