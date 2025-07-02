import MetodoSimplex from './MetodoSimplex';
import NodoArbol from './NodoArbol';
import DatosProblema from './DatosProblema';

export default class MetodoRamificacionAcotacion {
  constructor(tipo, cantidadVariables, datosOriginales) {
    this.simplex = new MetodoSimplex();
    this.mejorZ = -Infinity;
    this.mejorSolucion = null;
    this.tipo = tipo;
    this.cantidadVariables = cantidadVariables;
    this.datosOriginales = datosOriginales;

    this.contadorNodos = 1; // Para asignar IDs únicos
    this.raizArbol = null;  // Nodo raíz del árbol
    this.idNodoSolucionFinal = null; // 👉 Aquí guardaremos el ID de la mejor solución
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

    console.log('✅ Solución inicial relajada:');
    for (let i = 0; i < this.cantidadVariables; i++) {
      console.log(`x${i + 1} = ${resultadoInicial[i]}`);
    }
    console.log(`Z = ${resultadoInicial[this.cantidadVariables]}`);

    // Crear nodo raíz
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

    await this.ramificar(this.datosOriginales, [], this.raizArbol);

    if (this.mejorSolucion !== null) {
      console.log('\n✅ Mejor solución entera encontrada:');
      for (let i = 0; i < this.cantidadVariables; i++) {
        console.log(`x${i + 1} = ${this.mejorSolucion[i]}`);
      }
      console.log(`Z = ${this.mejorZ}`);

      return { solucion: this.mejorSolucion, z: this.mejorZ, arbol: this.raizArbol, idNodoSolucionFinal: this.idNodoSolucionFinal }; // 👉 Incluimos el ID
    } else {
      console.log('\n❌ No se encontró solución entera factible.');
      return null;
    }
  }

  async ramificar(datos, restriccionesAdicionales, nodoActual) {
    const resultado = await this.simplex.metodoSimplexDesdeDatos(
      this.tipo,
      this.cantidadVariables,
      datos,
      restriccionesAdicionales
    );

    if (resultado === null) {
      console.log('⛔ Solución no factible. Rama muerta.');

      nodoActual.esInfeasible = true;
      return;
    }

    console.log('🔎 Explorando nodo con solución relajada:');
    for (let i = 0; i < this.cantidadVariables; i++) {
      console.log(`x${i + 1} = ${resultado[i].toFixed(4)}`);
    }
    console.log(`Z = ${resultado[this.cantidadVariables].toFixed(4)}`);

    let esEntera = true;
    for (let i = 0; i < this.cantidadVariables; i++) {
      if (Math.abs(resultado[i] - Math.round(resultado[i])) > 1e-5) {
        esEntera = false;
        break;
      }
    }

    nodoActual.solucion = resultado.slice(0, this.cantidadVariables);
    nodoActual.z = resultado[this.cantidadVariables];
    nodoActual.esEntera = esEntera;

    if (esEntera) {
      if (resultado[this.cantidadVariables] > this.mejorZ) {
        this.mejorZ = resultado[this.cantidadVariables];
        this.mejorSolucion = resultado.slice(0, this.cantidadVariables);
        this.idNodoSolucionFinal = nodoActual.id; // 👉 Guardamos el ID de la mejor solución

        console.log('✅ NUEVA mejor solución entera encontrada:');
        for (let i = 0; i < this.cantidadVariables; i++) {
          console.log(`x${i + 1} = ${Math.round(resultado[i])}`);
        }
        console.log(`Z = ${this.mejorZ}`);
      } else {
        console.log('ℹ️ Solución entera no mejora Z.');
      }
      return;
    }

    let varFraccional = -1;
    let maxFrac = 0;
    for (let i = 0; i < this.cantidadVariables; i++) {
      let frac = resultado[i] - Math.floor(resultado[i]);
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
    const valor = resultado[varIndex];

    if (Math.abs(valor - Math.floor(valor)) < 1e-5 || Math.abs(valor - Math.ceil(valor)) < 1e-5) {
      console.log('🛑 Valor demasiado cercano a entero. No se puede dividir más.');
      return;
    }

    console.log(`📌 Ramificando variable x${varIndex + 1} = ${valor.toFixed(4)}`);

    const ramaIzqRestricciones = JSON.parse(JSON.stringify(restriccionesAdicionales));
    ramaIzqRestricciones.push({
      coef: this.crearCoeficiente(varIndex),
      operador: '<=',
      valor: Math.floor(valor)
    });

    const nodoIzquierda = new NodoArbol(
      `PL${this.contadorNodos++}`,
      this.datosOriginales.restriccionesBase,
      ramaIzqRestricciones,
      this.datosOriginales.coefObjetivo,
      [],
      0,
      false,
      false
    );

    nodoActual.ramaIzquierda = nodoIzquierda;

    console.log(`↙️  Rama Izquierda: x${varIndex + 1} <= ${Math.floor(valor)}`);
    await this.ramificar(datos, ramaIzqRestricciones, nodoIzquierda);

    const ramaDerRestricciones = JSON.parse(JSON.stringify(restriccionesAdicionales));
    ramaDerRestricciones.push({
      coef: this.crearCoeficiente(varIndex),
      operador: '>=',
      valor: Math.ceil(valor)
    });

    const nodoDerecha = new NodoArbol(
      `PL${this.contadorNodos++}`,
      this.datosOriginales.restriccionesBase,
      ramaDerRestricciones,
      this.datosOriginales.coefObjetivo,
      [],
      0,
      false,
      false
    );

    nodoActual.ramaDerecha = nodoDerecha;

    console.log(`↘️  Rama Derecha: x${varIndex + 1} >= ${Math.ceil(valor)}`);
    await this.ramificar(datos, ramaDerRestricciones, nodoDerecha);
  }

  crearCoeficiente(index) {
    const coef = Array(this.cantidadVariables).fill(0);
    coef[index] = 1;
    return coef;
  }
}
