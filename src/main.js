import './style.css';
import './generar_tabla.js';

import MetodoRamificacionAcotacion from './MetodoRamificacionAcotacion.js';
import MetodoMixto from './MetodoMixto.js';
import DatosProblema from './DatosProblema.js';

// Escuchar evento cuando se presione el botón Calcular
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
    // Si alguna variable es continua, usamos método mixto
    const metodoMixto = new MetodoMixto(tipo, cantidadVariables, datos, esEntera);
    solucion = await metodoMixto.iniciar();
  } else {
    // Si todas son enteras, usamos método actual
    const ramificacion = new MetodoRamificacionAcotacion(tipo, cantidadVariables, datos);
    solucion = await ramificacion.iniciar();
  }

  mostrarSolucion(solucion);
}

function mostrarSolucion(solucion) {
  const contenedor = document.getElementById('resultado-container');
  contenedor.innerHTML = ''; // Limpiar resultados anteriores

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
    parrafo.textContent = `x${index + 1} = ${Math.round(valor * 1000) / 1000}`; // 3 decimales
    resultadoDiv.appendChild(parrafo);

    valoresXi.push(`x${index + 1} = ${Math.round(valor * 1000) / 1000}`);
  });

  const zParrafo = document.createElement('p');
  zParrafo.textContent = `Z = ${Math.round(z * 1000) / 1000}`;
  resultadoDiv.appendChild(zParrafo);

  // Interpretación
  interpretacion += valoresXi.join(', ') + `, dando el valor de Z = ${Math.round(z * 1000) / 1000}.`;

  const interpretacionParrafo = document.createElement('p');
  interpretacionParrafo.style.marginTop = '10px';
  interpretacionParrafo.style.fontStyle = 'italic';
  interpretacionParrafo.textContent = interpretacion;

  resultadoDiv.appendChild(interpretacionParrafo);
  contenedor.appendChild(resultadoDiv);
}