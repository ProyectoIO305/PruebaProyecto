import './style.css';
import './generar_tabla.js';

import MetodoRamificacionAcotacion from './MetodoRamificacionAcotacion.js';
import MetodoMixto from './MetodoMixto.js';
import DatosProblema from './DatosProblema.js';
import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';

let ultimaSolucion = null;

document.addEventListener('click', function (event) {
  if (event.target && event.target.id === 'calcularBtn') {
    procesarCalculo();
  }

  if (event.target && event.target.id === 'mostrarArbolBtn') {
    mostrarArbol();
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
    ultimaSolucion = solucion; // Guardamos el árbol
  }

  mostrarSolucion(solucion);
  await enviarDatosAlBackend({ tipo, coefObjetivo, restricciones, esEntera });

  // Mostrar botón después del cálculo
  if (document.getElementById('mostrarArbolBtn') === null) {
    const btnArbol = document.createElement('button');
    btnArbol.textContent = 'Mostrar Árbol';
    btnArbol.id = 'mostrarArbolBtn';

    const contenedor = document.getElementById('resultado-container');
    contenedor.appendChild(btnArbol);
  }
}

function mostrarSolucion(solucion) {
  const contenedor = document.getElementById('resultado-container');
  contenedor.innerHTML = '';

  if (!solucion) {
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
    parrafo.textContent = `x${index + 1} = ${Math.round(valor * 1000) / 1000}`;
    resultadoDiv.appendChild(parrafo);

    valoresXi.push(`x${index + 1} = ${Math.round(valor * 1000) / 1000}`);
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
    tablaVariables += `<tr><td>${v.variable}</td><td>${v.valorActual}</td><td>${v.comentario}</td></tr>`;
  });
  tablaVariables += '</table>';

  let tablaRestricciones = '<h3>Sensibilidad de Restricciones:</h3>';
  tablaRestricciones += '<table border="1"><tr><th>Restricción</th><th>Valor Actual</th><th>Valor Sombra</th><th>Comentario</th></tr>';

  resultado.sensibilidadRestricciones.forEach(r => {
    tablaRestricciones += `<tr><td>${r.restriccion}</td><td>${r.valorActual}</td><td>${r.valorSombra}</td><td>${r.comentario}</td></tr>`;
  });
  tablaRestricciones += '</table>';

  sensibilidadDiv.innerHTML += tablaVariables + tablaRestricciones;
  contenedor.appendChild(sensibilidadDiv);
}

function mostrarArbol() {
  if (!ultimaSolucion || !ultimaSolucion.arbol) {
    alert('No se ha calculado una solución aún.');
    return;
  }

  const arbolMermaid = generarDiagramaMermaid(ultimaSolucion.arbol);
  const contenedor = document.getElementById('resultado-container');

  const divArbol = document.createElement('div');
  divArbol.innerHTML = `<pre class="mermaid">${arbolMermaid}</pre>`;
  contenedor.appendChild(divArbol);

  mermaid.initialize({ startOnLoad: true });
  mermaid.contentLoaded();
}

function generarDiagramaMermaid(nodo) {
  let resultado = 'graph TD\n';
  let conexiones = [];

  function recorrer(n) {
    if (!n) return;

    let label = n.id + '<br/>';

    if (n.solucion) {
      n.solucion.forEach((v, i) => {
        label += `x${i + 1}=${v.toFixed(2)}<br/>`;
      });
      label += `Z=${n.z.toFixed(2)}`;
    } else {
      label += 'Infeasible';
    }

    resultado += `${n.id}["${label}"]\n`;

    if (n.ramaIzquierda) {
      conexiones.push(`${n.id} --> ${n.ramaIzquierda.id}`);
      recorrer(n.ramaIzquierda);
    }

    if (n.ramaDerecha) {
      conexiones.push(`${n.id} --> ${n.ramaDerecha.id}`);
      recorrer(n.ramaDerecha);
    }
  }

  recorrer(nodo);

  resultado += conexiones.join('\n');
  return resultado;
}
