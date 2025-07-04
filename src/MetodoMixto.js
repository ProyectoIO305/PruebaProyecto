import MetodoSimplex from './MetodoSimplex';
import NodoArbol from './NodoArbol';

export default class MetodoMixto {
  constructor(tipo, cantidadVariables, datosOriginales, esEntera) {
    this.simplex = new MetodoSimplex();
    this.tipo = tipo;
    this.cantidadVariables = cantidadVariables;
    this.datosOriginales = datosOriginales;
    this.esEntera = esEntera;

    this.mejorZ = tipo === 'min' ? Infinity : -Infinity;
    this.mejorSolucion = null;

    this.contadorNodos = 1;
    this.raizArbol = null;
    this.idNodoSolucionFinal = null;
  }

  async iniciar() {
    const resultadoInicial = await this.simplex.metodoSimplexDesdeDatos(
      this.tipo,
      this.cantidadVariables,
      this.datosOriginales,
      []
    );

    if (resultadoInicial === null) {
      console.log('❌ No se encontró solución inicial.');
      return null;
    }

    this.raizArbol = new NodoArbol(
      `PL${this.contadorNodos++}`,
      this.datosOriginales.restriccionesBase,
      [],
      this.datosOriginales.coefObjetivo,
      resultadoInicial.slice(0, this.cantidadVariables),
      resultadoInicial[this.cantidadVariables],
      false,
      false
    );

    await this.ramificar(this.datosOriginales, [], this.raizArbol, 0);

    if (this.mejorSolucion !== null) {
      return { solucion: this.mejorSolucion, z: this.mejorZ, arbol: this.raizArbol, idNodoSolucionFinal: this.idNodoSolucionFinal };
    } else {
      return null;
    }
  }

  async ramificar(datos, restriccionesAdicionales, nodoActual, nivel) {
    const resultado = await this.simplex.metodoSimplexDesdeDatos(
      this.tipo,
      this.cantidadVariables,
      datos,
      restriccionesAdicionales
    );

    if (resultado === null) {
      console.log(`${' '.repeat(nivel * 4)}⛔ Solución no factible. Rama muerta.`);
      nodoActual.esInfeasible = true;
      return;
    }

    console.log(`${' '.repeat(nivel * 4)}🔎 Explorando nodo:`);

    for (let i = 0; i < this.cantidadVariables; i++) {
      console.log(`${' '.repeat(nivel * 4)}x${i + 1} = ${resultado[i].toFixed(4)}`);
    }
    console.log(`${' '.repeat(nivel * 4)}Z = ${resultado[this.cantidadVariables].toFixed(4)}`);

    let esEnteraSol = true;
    for (let i = 0; i < this.cantidadVariables; i++) {
      if (this.esEntera[i] && Math.abs(resultado[i] - Math.round(resultado[i])) > 1e-5) {
        esEnteraSol = false;
        break;
      }
    }

    nodoActual.solucion = resultado.slice(0, this.cantidadVariables);
    nodoActual.z = resultado[this.cantidadVariables];
    nodoActual.esEntera = esEnteraSol;

    if (esEnteraSol) {
      let mejora = false;
      if (this.tipo === 'max') {
        mejora = resultado[this.cantidadVariables] > this.mejorZ;
      } else if (this.tipo === 'min') {
        mejora = resultado[this.cantidadVariables] < this.mejorZ;
      }

      if (mejora) {
        this.mejorZ = resultado[this.cantidadVariables];
        this.mejorSolucion = resultado.slice(0, this.cantidadVariables);
        this.idNodoSolucionFinal = nodoActual.id;

        console.log(`${' '.repeat(nivel * 4)}✅ NUEVA mejor solución entera:`);
        for (let i = 0; i < this.cantidadVariables; i++) {
          if (this.esEntera[i]) {
            console.log(`${' '.repeat(nivel * 4)}x${i + 1} = ${Math.round(resultado[i])}`);
          } else {
            console.log(`${' '.repeat(nivel * 4)}x${i + 1} = ${resultado[i].toFixed(4)}`);
          }
        }
        console.log(`${' '.repeat(nivel * 4)}Z = ${this.mejorZ}`);
      } else {
        console.log(`${' '.repeat(nivel * 4)}ℹ️ Solución entera no mejora Z.`);
      }
      return;
    }

    let varFraccional = -1;
    let maxFrac = 0;
    for (let i = 0; i < this.cantidadVariables; i++) {
      if (!this.esEntera[i]) continue;

      let frac = resultado[i] - Math.floor(resultado[i]);
      frac = Math.min(frac, 1.0 - frac);

      if (frac > maxFrac + 1e-5) {
        maxFrac = frac;
        varFraccional = i;
      }
    }

    if (varFraccional === -1) {
      console.log(`${' '.repeat(nivel * 4)}⚠️ No hay variable fraccional entera. No se puede ramificar.`);
      return;
    }

    const varIndex = varFraccional;
    const valor = resultado[varIndex];

    console.log(`${' '.repeat(nivel * 4)}📌 Ramificando x${varIndex + 1} = ${valor.toFixed(4)}`);

    const ramaIzq = JSON.parse(JSON.stringify(restriccionesAdicionales));
    ramaIzq.push({
      coef: this.crearCoeficiente(varIndex),
      operador: '<=',
      valor: Math.floor(valor)
    });
    console.log(`${' '.repeat(nivel * 4)}↙️  Rama Izquierda: x${varIndex + 1} <= ${Math.floor(valor)}`);

    const nodoIzquierda = new NodoArbol(
      `PL${this.contadorNodos++}`,
      this.datosOriginales.restriccionesBase,
      ramaIzq,
      this.datosOriginales.coefObjetivo,
      [],
      0,
      false,
      false
    );

    nodoActual.ramaIzquierda = nodoIzquierda;
    await this.ramificar(datos, ramaIzq, nodoIzquierda, nivel + 1);

    const ramaDer = JSON.parse(JSON.stringify(restriccionesAdicionales));
    ramaDer.push({
      coef: this.crearCoeficiente(varIndex),
      operador: '>=',
      valor: Math.ceil(valor)
    });
    console.log(`${' '.repeat(nivel * 4)}↘️  Rama Derecha: x${varIndex + 1} >= ${Math.ceil(valor)}`);

    const nodoDerecha = new NodoArbol(
      `PL${this.contadorNodos++}`,
      this.datosOriginales.restriccionesBase,
      ramaDer,
      this.datosOriginales.coefObjetivo,
      [],
      0,
      false,
      false
    );

    nodoActual.ramaDerecha = nodoDerecha;
    await this.ramificar(datos, ramaDer, nodoDerecha, nivel + 1);
  }

  crearCoeficiente(index) {
    const coef = Array(this.cantidadVariables).fill(0);
    coef[index] = 1;
    return coef;
  }
}
