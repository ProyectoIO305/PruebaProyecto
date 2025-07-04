import './style.css';
import './generar_tabla.js';

import MetodoRamificacionAcotacion from './MetodoRamificacionAcotacion.js';
import MetodoMixto from './MetodoMixto.js';
import DatosProblema from './DatosProblema.js';


let idNodoSolucionFinalGlobal = null;

document.addEventListener('click', function (event) {
  if (event.target && event.target.id === 'calcularBtn') {
    procesarCalculo();
  }
});






async function procesarCalculo() {
  const tipo = document.querySelector('select').value;
  const coefObjetivoInputs = document.querySelectorAll('.coef-objetivo');
  const coefObjetivo = Array.from(coefObjetivoInputs).map(input => parseFloat(input.value));

  const tipoVariableSelects = document.querySelectorAll('.tipo-variable');
  const esEntera = Array.from(tipoVariableSelects).map(select => select.value === 'entera');

  const restricciones = [];
  const filasRestricciones = document.querySelectorAll('.fila-restriccion');

  for (let i = 1; i < filasRestricciones.length; i++) {
    const fila = filasRestricciones[i];

    const coefInputs = fila.querySelectorAll('.coef-restriccion');
    const coef = Array.from(coefInputs).map(input => parseFloat(input.value));

    const operador = fila.querySelector('select').value;

    const valor = parseFloat(fila.querySelector('.valor-restriccion').value);

    restricciones.push({ coef, operador, valor });
  }

  const datos = new DatosProblema();
  datos.coefObjetivo = coefObjetivo;
  datos.restriccionesBase = restricciones;

  const cantidadVariables = coefObjetivo.length;

  let solucion;

  if (esEntera.includes(false)) {
    const metodoMixto = new MetodoMixto(tipo, cantidadVariables, datos, esEntera);
    solucion = await metodoMixto.iniciar();
  } else {
    const ramificacion = new MetodoRamificacionAcotacion(tipo, cantidadVariables, datos);
    solucion = await ramificacion.iniciar();
    

  }

  idNodoSolucionFinalGlobal = solucion.idNodoSolucionFinal;

  mostrarSolucion(solucion);

  await enviarDatosAlBackend({
    tipo,
    coefObjetivo,
    restricciones,
    esEntera,
    arbol: solucion.arbol
  });
}

function mostrarSolucion(solucion) {
  const contenedor = document.getElementById('resultado-container');
  contenedor.innerHTML = '';

  if (!solucion || !solucion.solucion) {
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = '<h2>No se encontró solución entera factible.</h2>';
    contenedor.appendChild(errorDiv);
    return;
  }

  const { solucion: variables, z } = solucion;
  const tipo = document.querySelector('select').value;

  const resultadoDiv = document.createElement('div');
  resultadoDiv.innerHTML = '<h2>Mejor solución encontrada:</h2>';

  let interpretacion = 'Para que el valor de Z sea el más óptimo (' + (tipo === 'max' ? 'máximo' : 'mínimo') + '), los valores de Xi deben ser: ';
  let valoresXi = [];

  variables.forEach((valor, index) => {
    const parrafo = document.createElement('p');
    parrafo.textContent = `X${index + 1} = ${Math.round(valor * 1000) / 1000}`;
    resultadoDiv.appendChild(parrafo);

    valoresXi.push(`X${index + 1} = ${Math.round(valor * 1000) / 1000}`);
  });

  const zParrafo = document.createElement('p');
  zParrafo.textContent = `Z = ${Math.round(z * 1000) / 1000}`;
  resultadoDiv.appendChild(zParrafo);

  interpretacion += valoresXi.join(', ') + `, dando el valor de Z = ${Math.round(z * 1000) / 1000}.`;

  const interpretacionParrafo = document.createElement('p');
  interpretacionParrafo.style.marginTop = '10px';
  interpretacionParrafo.style.fontStyle = 'italic';
  interpretacionParrafo.textContent = interpretacion;

  resultadoDiv.appendChild(interpretacionParrafo);
  contenedor.appendChild(resultadoDiv);
}

async function enviarDatosAlBackend(datos) {
  try {
    const lhs = datos.restricciones.map(r => r.coef.map(Number));
    const rhs = datos.restricciones.map(r => Number(r.valor));

    const datosBackend = {
      tipo: datos.tipo,
      coef_objetivo: datos.coefObjetivo,
      lhs: lhs,
      rhs: rhs
    };

    console.log('🔵 Datos enviados al backend:', datosBackend);

    const response = await fetch('https://backend-python-sensibilidad-1.onrender.com/analisis-sensibilidad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datosBackend)
    });

    const resultado = await response.json();
    console.log('✅ Respuesta del backend:', resultado);
    alert('Datos enviados correctamente al backend');

    mostrarAnalisisSensibilidad(resultado);

    agregarBotonArbol(datos.arbol);

  } catch (error) {
    console.error('❌ Error al enviar los datos al backend:', error);
    alert('Ocurrió un error al conectarse con el backend');
  }
}

function mostrarAnalisisSensibilidad(resultado) {
  const contenedor = document.getElementById('resultado-container');

  const sensibilidadDiv = document.createElement('div');
  sensibilidadDiv.innerHTML = '<h2>Análisis de Sensibilidad</h2>';

  let tablaVariables = '<h3>Sensibilidad de Variables:</h3>';
  tablaVariables += '<table border="1"><tr><th>Variable</th><th>Valor Actual</th><th>Comentario</th></tr>';

  resultado.sensibilidadVariables.forEach(v => {
    tablaVariables += `<tr>
      <td>${v.variable}</td>
      <td>${v.valorActual}</td>
      <td>${v.comentario}</td>
    </tr>`;
  });

  tablaVariables += '</table>';

  let tablaRestricciones = '<h3>Sensibilidad de Restricciones:</h3>';
  tablaRestricciones += '<table border="1"><tr><th>Restricción</th><th>Valor Actual</th><th>Valor Sombra</th><th>Comentario</th></tr>';

  resultado.sensibilidadRestricciones.forEach(r => {
    tablaRestricciones += `<tr>
      <td>${r.restriccion}</td>
      <td>${r.valorActual}</td>
      <td>${r.valorSombra}</td>
      <td>${r.comentario}</td>
    </tr>`;
  });

  tablaRestricciones += '</table>';

  sensibilidadDiv.innerHTML += tablaVariables + tablaRestricciones;
  contenedor.appendChild(sensibilidadDiv);
}

function agregarBotonArbol(arbol) {
  const contenedor = document.getElementById('resultado-container');

  const boton = document.createElement('button');
  boton.textContent = 'Mostrar Árbol de Ramificación';
  boton.style.marginTop = '15px';
  boton.addEventListener('click', () => mostrarArbolMermaid(arbol));

  contenedor.appendChild(boton);
}

function mostrarArbolMermaid(arbol) {
  const contenedor = document.getElementById('resultado-container');

  arbol.idSolucionFinal = idNodoSolucionFinalGlobal;

  const diagramaMermaid = generarDiagramaMermaid(arbol);

  const divMermaid = document.createElement('div');
  divMermaid.className = 'mermaid';
  divMermaid.style.marginTop = '20px';
  divMermaid.textContent = diagramaMermaid;

  contenedor.appendChild(divMermaid);

  if (window.mermaid) {
    window.mermaid.init(undefined, document.querySelectorAll('.mermaid'));
  }
}

function generarDiagramaMermaid(nodoRaiz) {
  let resultado = 'graph TD;\n';
  let conexiones = [];
  let estilos = [];

  const idSolucionFinal = nodoRaiz.idSolucionFinal;

  function recorrer(nodoActual) {
    if (!nodoActual) return;

    let funcionObjetivo = 'Z = ';
    nodoActual.coefObjetivo.forEach((coef, index) => {
      funcionObjetivo += `${coef}X${index + 1}`;
      if (index < nodoActual.coefObjetivo.length - 1) {
        funcionObjetivo += ' + ';
      }
    });

    let restriccionesTexto = '';
    nodoActual.restriccionesBase.forEach(r => {
      restriccionesTexto += `${formatearRestriccion(r)}\\n`;
    });

    nodoActual.restriccionesAdicionales.forEach(r => {
      restriccionesTexto += `${formatearRestriccion(r)}\\n`;
    });

    let solucionTexto = 'Solución: ';
    nodoActual.solucion.forEach((valor, index) => {
      solucionTexto += `X${index + 1} = ${Math.round(valor * 1000) / 1000}`;
      if (index < nodoActual.solucion.length - 1) {
        solucionTexto += ', ';
      }
    });

    solucionTexto += `, Z = ${Math.round(nodoActual.z * 1000) / 1000}`;

    let etiqueta = `${nodoActual.id}\\n${funcionObjetivo}\\n${restriccionesTexto}\\n${solucionTexto}`;

    if (nodoActual.esInfeasible) {
      etiqueta += '\\n⛔ Inviable';
    } else if (nodoActual.id === idSolucionFinal) {
      etiqueta += '\\n⭐ Solución Final';
      estilos.push(`style ${nodoActual.id} fill:#c6f6c6,stroke:#333,stroke-width:2px`);
    } else if (nodoActual.esEntera) {
      etiqueta += '\\n✅ Entera';
    } else {
      etiqueta += '\\n🌿 Fraccional';
    }

    resultado += `${nodoActual.id}["${etiqueta}"];\n`;

    if (nodoActual.ramaIzquierda) {
      const restriccionIzquierda = nodoActual.ramaIzquierda.restriccionesAdicionales.at(-1);
      const textoIzquierda = formatearRestriccion(restriccionIzquierda, true);
      conexiones.push(`${nodoActual.id} -->|"${textoIzquierda}"| ${nodoActual.ramaIzquierda.id};`);
      recorrer(nodoActual.ramaIzquierda);
    }

    if (nodoActual.ramaDerecha) {
      const restriccionDerecha = nodoActual.ramaDerecha.restriccionesAdicionales.at(-1);
      const textoDerecha = formatearRestriccion(restriccionDerecha, true);
      conexiones.push(`${nodoActual.id} -->|"${textoDerecha}"| ${nodoActual.ramaDerecha.id};`);
      recorrer(nodoActual.ramaDerecha);
    }
  }

  recorrer(nodoRaiz);
  resultado += conexiones.join('\n') + '\n' + estilos.join('\n');
  return resultado;
}

function formatearRestriccion(restriccion, soloLado = false) {
  let texto = '';
  restriccion.coef.forEach((coef, index) => {
    if (coef !== 0) {
      if (texto.length > 0 && coef > 0) texto += ' + ';
      if (coef < 0) texto += ' - ';
      texto += `${Math.abs(coef)}X${index + 1}`;
    }
  });

  let simbolo = restriccion.operador.replace('<=', '≤').replace('>=', '≥');

  if (soloLado) {
    return texto + ' ' + simbolo + ' ' + restriccion.valor;
  }

  return `${texto} ${simbolo} ${restriccion.valor}`;
}
