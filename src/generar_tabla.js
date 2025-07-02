document.getElementById("generarTabla").addEventListener("click", function () {
  const cantVariables = parseInt(document.getElementById("variables").value);
  const cantRestricciones = parseInt(document.getElementById("restricciones").value);

  if (isNaN(cantVariables) || isNaN(cantRestricciones)) {
    alert("Por favor ingrese valores válidos.");
    return;
  }

  const contenedor = document.getElementById("tabla-container");
  contenedor.innerHTML = ""; // Limpia lo anterior

  // ================= FUNCION OBJETIVO ==================
  const filaZ = document.createElement("div");
  filaZ.classList.add("fila-restriccion");

  const labelZ = document.createElement("span");
  labelZ.textContent = "Z ";
  filaZ.appendChild(labelZ);

  const tipoSelect = document.createElement("select");
  ["max", "min"].forEach(op => {
    const option = document.createElement("option");
    option.value = op;
    option.textContent = op;
    tipoSelect.appendChild(option);
  });
  filaZ.appendChild(tipoSelect);

  const igual = document.createElement("span");
  igual.textContent = " = ";
  filaZ.appendChild(igual);

  for (let j = 0; j < cantVariables; j++) {
    const input = document.createElement("input");
    input.type = "number";
    input.placeholder = `Coef`;
    input.classList.add("coef-objetivo");
    filaZ.appendChild(input);

    const label = document.createElement("span");
    label.textContent = `X${j + 1} `;
    filaZ.appendChild(label);
  }

  contenedor.appendChild(filaZ);

  // ================ RESTRICCIONES ==================
  for (let i = 0; i < cantRestricciones; i++) {
    const fila = document.createElement("div");
    fila.classList.add("fila-restriccion");

    for (let j = 0; j < cantVariables; j++) {
      const input = document.createElement("input");
      input.type = "number";
      input.placeholder = `Coef`;
      input.classList.add("coef-restriccion");
      fila.appendChild(input);

      const label = document.createElement("span");
      label.textContent = `X${j + 1} `;
      fila.appendChild(label);
    }

    const operador = document.createElement("select");
    ["<=", "=", ">="].forEach(op => {
      const option = document.createElement("option");
      option.value = op;
      option.textContent = op;
      operador.appendChild(option);
    });
    operador.classList.add("operador");
    fila.appendChild(operador);

    const rhs = document.createElement("input");
    rhs.type = "number";
    rhs.placeholder = "Valor";
    rhs.classList.add("valor-restriccion");
    fila.appendChild(rhs);

    contenedor.appendChild(fila);
  }

  // ================ COMBOBOX ENTERA/CONTINUA ==================
  const contenedorTipos = document.createElement("div");
  contenedorTipos.id = "tiposVariablesContainer";

  for (let i = 0; i < cantVariables; i++) {
    const filaTipo = document.createElement("div");
    filaTipo.classList.add("fila-tipo");

    const label = document.createElement("span");
    label.textContent = `X${i + 1} `;
    filaTipo.appendChild(label);

    const tipoVariable = document.createElement("select");
    tipoVariable.classList.add("tipo-variable");

    const opcionEntera = document.createElement("option");
    opcionEntera.value = "entera";
    opcionEntera.textContent = "Entera";

    const opcionContinua = document.createElement("option");
    opcionContinua.value = "continua";
    opcionContinua.textContent = "Continua";

    tipoVariable.appendChild(opcionEntera);
    tipoVariable.appendChild(opcionContinua);

    filaTipo.appendChild(tipoVariable);
    contenedorTipos.appendChild(filaTipo);
  }

  contenedor.appendChild(contenedorTipos);

  // ================ BOTON CALCULAR ==================
  const btnCalcular = document.createElement("button");
  btnCalcular.textContent = "Calcular";
  btnCalcular.id = "calcularBtn";
  contenedor.appendChild(btnCalcular);
});