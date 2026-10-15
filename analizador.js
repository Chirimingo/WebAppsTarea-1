// Funciones puras: ninguna modifica la colección recibida ni sus objetos.

// ---------- Validación ----------

const esTextoNoVacio = (valor) => typeof valor === "string" && valor.trim() !== "";

const esPesoValido = (valor) =>
  typeof valor === "number" && Number.isFinite(valor) && valor > 0;

// Devuelve si el registro es válido y la lista explícita de errores.
const validarRegistro = (registro) => {
  const { codigo, material, pesoKg, turno, contaminado } = registro ?? {};
  const reglas = [
    [esTextoNoVacio(codigo), "codigo debe ser texto no vacío"],
    [esTextoNoVacio(material), "material debe ser texto no vacío"],
    [esPesoValido(pesoKg), "pesoKg debe ser un número mayor que cero"],
    [esTextoNoVacio(turno), "turno debe ser texto no vacío"],
    [typeof contaminado === "boolean", "contaminado debe ser booleano"],
  ];
  const errores = reglas.filter(([cumple]) => !cumple).map(([, mensaje]) => mensaje);
  return { valido: errores.length === 0, errores };
};

// Valida toda la colección y conserva qué registros fallaron y por qué.
const validarColeccion = (registros) => {
  const detalles = registros.map((registro, indice) => ({
    indice,
    codigo: registro?.codigo,
    ...validarRegistro(registro),
  }));
  const rechazados = detalles.filter(({ valido }) => !valido);
  return {
    todosValidos: rechazados.length === 0,
    total: registros.length,
    validos: registros.length - rechazados.length,
    rechazados: rechazados.map(({ indice, codigo, errores }) => ({ indice, codigo, errores })),
  };
};

// ---------- Selección y agregación ----------

const obtenerRegistrosAceptados = (registros) =>
  registros.filter((registro) => validarRegistro(registro).valido);

// Map: la operación principal asocia cada material con su acumulado.
// El Map inicial es nuevo; no se toca ningún registro de entrada.
const calcularTotalesPorMaterial = (registrosAceptados) =>
  registrosAceptados.reduce(
    (totales, { material, pesoKg }) =>
      totales.set(material, (totales.get(material) ?? 0) + pesoKg),
    new Map()
  );

// Set: elimina códigos repetidos.
const obtenerCodigosUnicos = (registrosAceptados) =>
  new Set(registrosAceptados.map(({ codigo }) => codigo));

// ---------- Tarjetas del reporte ----------

// Destructuring en el parámetro y función flecha; devuelve objetos nuevos.
const crearTarjetas = (registrosAceptados) =>
  registrosAceptados.map(({ codigo, material, turno, pesoKg }) => ({
    codigo,
    material,
    turno,
    pesoKg,
    etiqueta: `${material} · ${pesoKg.toFixed(1)} kg · turno ${turno}`,
  }));

// Ordena una COPIA de las tarjetas. El spread crea un arreglo nuevo,
// así sort no reordena la lista que recibe la función.
// El campo se accede dinámicamente con corchetes.
const ordenarTarjetas = (tarjetas, campo = "pesoKg", direccion = "asc") => {
  const copia = [...tarjetas];
  const signo = direccion === "desc" ? -1 : 1;
  return copia.sort((a, b) => {
    const valorA = a[campo];
    const valorB = b[campo];
    const comparacion =
      typeof valorA === "number"
        ? valorA - valorB
        : String(valorA).localeCompare(String(valorB), "es");
    return signo * comparacion;
  });
};

// ---------- Consultas ----------

// find: primer registro aceptado del material. Sin coincidencia -> undefined.
const buscarPrimerAceptadoPorMaterial = (registrosAceptados, material) =>
  registrosAceptados.find((registro) => registro.material === material);

// findIndex: posición en la lista de tarjetas. Sin coincidencia -> -1.
const posicionEnTarjetas = (tarjetas, material) =>
  tarjetas.findIndex((tarjeta) => tarjeta.material === material);

// some: ¿existe algún registro aceptado contaminado?
const hayContaminados = (registrosAceptados) =>
  registrosAceptados.some(({ contaminado }) => contaminado === true);

// every: ¿todas las tarjetas tienen etiqueta? (sobre colección vacía devuelve true)
const todasTarjetasConEtiqueta = (tarjetas) =>
  tarjetas.every(({ etiqueta }) => typeof etiqueta === "string" && etiqueta.length > 0);

// ---------- Reporte público ----------

const OPCIONES_POR_DEFECTO = Object.freeze({
  campoOrden: "pesoKg",
  direccion: "asc",
  materialBuscado: null,
});

// generarReporte(registros, ...opciones): las opciones se combinan con spread.
// Ninguna etapa modifica el resultado de las anteriores; el objeto final
// se construye con spread a partir de resultados ya calculados.
const generarReporte = (registros, ...opciones) => {
  if (!Array.isArray(registros)) {
    throw new TypeError("generarReporte espera un arreglo de registros.");
  }

  const configuracion = opciones.reduce(
    (acumulado, opcion) => ({ ...acumulado, ...opcion }),
    { ...OPCIONES_POR_DEFECTO }
  );

  const validacion = validarColeccion(registros);
  const aceptados = obtenerRegistrosAceptados(registros);
  const totalesPorMaterial = calcularTotalesPorMaterial(aceptados);
  const codigos = obtenerCodigosUnicos(aceptados);
  const tarjetas = ordenarTarjetas(
    crearTarjetas(aceptados),
    configuracion.campoOrden,
    configuracion.direccion
  );

  const consulta =
    configuracion.materialBuscado === null
      ? null
      : {
          material: configuracion.materialBuscado,
          primerRegistro: (() => {
            const encontrado = buscarPrimerAceptadoPorMaterial(
              aceptados,
              configuracion.materialBuscado
            );
            // Copia para no exponer la referencia al registro de entrada.
            return encontrado === undefined ? undefined : { ...encontrado };
          })(),
          posicion: posicionEnTarjetas(tarjetas, configuracion.materialBuscado),
        };

  const base = {
    validacion,
    totalesPorMaterial,
    totalesPorMaterialComoObjeto: Object.fromEntries(totalesPorMaterial),
    codigosUnicos: [...codigos],
    materialesDisponibles: [...totalesPorMaterial.keys()],
    tarjetas,
  };

  return {
    ...base,
    hayContaminados: hayContaminados(aceptados),
    todasTarjetasConEtiqueta: todasTarjetasConEtiqueta(tarjetas),
    consulta,
    resumen: {
      total: registros.length,
      aceptados: aceptados.length,
      rechazados: validacion.rechazados.length,
    },
    configuracion,
  };
};

module.exports = {
  validarRegistro,
  validarColeccion,
  obtenerRegistrosAceptados,
  calcularTotalesPorMaterial,
  obtenerCodigosUnicos,
  crearTarjetas,
  ordenarTarjetas,
  buscarPrimerAceptadoPorMaterial,
  posicionEnTarjetas,
  hayContaminados,
  todasTarjetasConEtiqueta,
  generarReporte,
};
