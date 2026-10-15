const { registros } = require("./datos");
const { generarReporte } = require("./analizador");

const encabezado = (texto) => `\n=== ${texto} ===`;

const mostrarValidacion = ({ validacion }) => {
  console.log("1) Validación de la colección");
  console.log(
    `   Total: ${validacion.total} | válidos: ${validacion.validos} | rechazados: ${validacion.rechazados.length}`
  );
  console.log(`   ¿Todos válidos?: ${validacion.todosValidos ? "sí" : "no"}`);
  for (const { indice, codigo, errores } of validacion.rechazados) {
    console.log(`   - Posición ${indice} (código: ${codigo ?? "sin código"}): ${errores.join("; ")}`);
  }
};

const mostrarTotales = ({ totalesPorMaterial }) => {
  console.log("2) Totales por material (Map)");
  if (totalesPorMaterial.size === 0) {
    console.log("   (sin registros aceptados)");
    return;
  }
  for (const [material, peso] of totalesPorMaterial) {
    console.log(`   ${material.padEnd(10)} ${peso.toFixed(2)} kg`);
  }
};

const mostrarCodigosYMateriales = ({ codigosUnicos, materialesDisponibles }) => {
  console.log(`3) Códigos únicos (Set): ${codigosUnicos.length}`);
  console.log(`   ${codigosUnicos.join(", ") || "(ninguno)"}`);
  console.log(`   Materiales disponibles: ${materialesDisponibles.join(", ") || "(ninguno)"}`);
};

const mostrarTarjetas = ({ tarjetas, configuracion }) => {
  console.log(
    `4) Tarjetas ordenadas por ${configuracion.campoOrden} (${configuracion.direccion}), sobre una copia`
  );
  if (tarjetas.length === 0) {
    console.log("   (sin tarjetas)");
    return;
  }
  tarjetas.forEach((tarjeta, posicion) => {
    console.log(`   [${posicion}] ${tarjeta.etiqueta}`);
  });
};

const mostrarChequeos = ({ hayContaminados, todasTarjetasConEtiqueta, resumen }) => {
  const vacia = resumen.total === 0;
  console.log("5) Comprobaciones");
  console.log(`   some  - ¿existe algún registro aceptado contaminado?: ${hayContaminados ? "sí" : "no"}`);
  console.log(
    `   every - ¿todas las tarjetas tienen etiqueta?: ${todasTarjetasConEtiqueta ? "sí" : "no"}` +
      (vacia ? " (colección vacía: every devuelve true por definición)" : "")
  );
};

const mostrarConsulta = ({ consulta, resumen }) => {
  console.log(`6) Consulta del material "${consulta.material}"`);
  const { primerRegistro, posicion } = consulta;
  const valorPrimer = primerRegistro === undefined ? "undefined" : `código ${primerRegistro.codigo}`;
  console.log(`   Primer registro aceptado (find): ${valorPrimer}`);
  console.log(`   Posición en tarjetas (findIndex): ${posicion}`);

  if (resumen.total === 0) {
    console.log("   Motivo: la colección no tiene registros (no es un error de búsqueda).");
  } else if (primerRegistro === undefined) {
    console.log("   Motivo: el material no existe entre los registros aceptados (sin coincidencia).");
  } else {
    console.log("   Motivo: coincidencia encontrada.");
  }
};

const ejecutarFlujo = (titulo, entrada, materialBuscado) => {
  console.log(encabezado(titulo));

  const antes = JSON.stringify(entrada);
  // Dos objetos de opciones: rest los recibe y spread los combina.
  const reporte = generarReporte(
    entrada,
    { campoOrden: "pesoKg" },
    { direccion: "desc", materialBuscado }
  );
  const despues = JSON.stringify(entrada);

  mostrarValidacion(reporte);
  mostrarTotales(reporte);
  mostrarCodigosYMateriales(reporte);
  mostrarTarjetas(reporte);
  mostrarChequeos(reporte);
  mostrarConsulta(reporte);

  const sinCambios = antes === despues;
  console.log(
    `7) ¿La entrada quedó sin cambios?: ${sinCambios ? "sí" : "NO"} (${entrada.length} registros comparados)`
  );
  return reporte;
};

ejecutarFlujo("Caso 1: flujo principal con datos de datos.js", registros, "PET");
ejecutarFlujo("Caso 2: colección vacía", [], "PET");
ejecutarFlujo("Caso 3: material inexistente", registros, "Metal");
