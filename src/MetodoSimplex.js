import solver from 'javascript-lp-solver';

export default class MetodoSimplex {
  metodoSimplexDesdeDatos(tipo, cantVariables, datos, restriccionesExtras) {
    const model = {
      optimize: "Z",
      opType: tipo === 'min' ? "min" : "max",
      constraints: {},
      variables: {}
    };

    datos.restriccionesBase.forEach((restriccion, index) => {
      restriccion.coef.forEach((coef, varIndex) => {
        const varName = `x${varIndex + 1}`;
        if (!model.variables[varName]) {
          model.variables[varName] = { Z: datos.coefObjetivo[varIndex] };
        }
        model.variables[varName][`r${index + 1}`] = coef;
      });

      const constraintName = `r${index + 1}`;
      if (restriccion.operador === '<=') {
        model.constraints[constraintName] = { max: restriccion.valor };
      } else if (restriccion.operador === '>=') {
        model.constraints[constraintName] = { min: restriccion.valor };
      } else if (restriccion.operador === '=') {
        model.constraints[constraintName] = { equal: restriccion.valor };
      }
    });

    if (restriccionesExtras && restriccionesExtras.length > 0) {
      restriccionesExtras.forEach((restriccion, index) => {
        const idx = Object.keys(model.constraints).length + 1;

        restriccion.coef.forEach((coef, varIndex) => {
          const varName = `x${varIndex + 1}`;
          if (!model.variables[varName]) {
            model.variables[varName] = { Z: datos.coefObjetivo[varIndex] };
          }
          model.variables[varName][`r${idx}`] = coef;
        });

        const constraintName = `r${idx}`;
        if (restriccion.operador === '<=') {
          model.constraints[constraintName] = { max: restriccion.valor };
        } else if (restriccion.operador === '>=') {
          model.constraints[constraintName] = { min: restriccion.valor };
        } else if (restriccion.operador === '=') {
          model.constraints[constraintName] = { equal: restriccion.valor };
        }
      });
    }

    console.log("📋 Modelo a resolver:", model);

    try {
      const result = solver.Solve(model);

      if (!result.feasible) {
        console.log("⛔ No hay solución factible.");
        return null;
      }

      const listaResultado = [];
      for (let i = 0; i < cantVariables; i++) {
        const varName = `x${i + 1}`;
        listaResultado.push(result[varName] || 0);
      }
      listaResultado.push(result.result); // Z

      console.log("✅ Solución encontrada:", listaResultado);

      return listaResultado;
    } catch (error) {
      console.error("❌ Error resolviendo el modelo:", error);
      return null;
    }
  }
}