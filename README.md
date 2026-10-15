# Analizador de jornadas de acopio

Analizador en JavaScript que convierte registros de jornadas de una estación comunitaria de reciclaje en un reporte confiable para planificar turnos. Valida los datos, agrupa resultados y genera una vista resumida **sin modificar** el arreglo de entrada ni sus objetos.

## Requisitos previos

- Node.js 18 o superior (probado con Node.js v22.22.0).
- No se requieren dependencias externas ni `npm install`.

## Ejecución

Desde la raíz del proyecto (`analizador-acopio/`):

```bash
node src/index.js
```

El programa ejecuta tres casos: el flujo principal con los datos de `src/datos.js`, una colección vacía y una búsqueda de un material inexistente.

## Estructura

```
analizador-acopio/
├── README.md
└── src/
    ├── datos.js      # Arreglo de registros de ejemplo (exportado)
    ├── analizador.js # Validación, agregación, tarjetas, consultas y generarReporte
    └── index.js      # Ejecución del flujo y salida legible
```

## Flujo

1. `datos.js` exporta 10 registros: 8 válidos y 2 inválidos (`A008` con peso negativo y `A010` con turno vacío y `contaminado` no booleano).
2. `validarColeccion` revisa cada registro y devuelve la posición, el código y el motivo de cada fallo. No lanza errores en silencio.
3. Solo los registros aceptados pasan a las etapas de agregación:
   - `calcularTotalesPorMaterial` usa `reduce` y un `Map`.
   - `obtenerCodigosUnicos` usa un `Set`.
   - `crearTarjetas` usa `map` con destructuring y una función flecha.
   - `ordenarTarjetas` ordena una copia con `spread` y `sort`, usando el campo como argumento con acceso `obj[campo]`.
4. `generarReporte(registros, ...opciones)` recibe las opciones con rest, las combina con spread y devuelve un objeto nuevo con `validacion`, `totalesPorMaterial`, `codigosUnicos`, `tarjetas`, `materialesDisponibles`, `hayContaminados` (`some`), `todasTarjetasConEtiqueta` (`every`) y `consulta` (`find` y `findIndex`).
5. `index.js` muestra cada resultado con una etiqueta y comprueba que la entrada no cambió comparando su representación antes y después de generar el reporte.

## Validación

Un registro es válido cuando:

- `codigo` y `material` son texto no vacío.
- `pesoKg` es un número finito mayor que cero.
- `turno` es texto no vacío.
- `contaminado` es booleano.

Cómo comprobar el comportamiento:

- **Casos normales:** el Caso 1 procesa 8 registros válidos.
- **Datos inválidos:** el Caso 1 rechaza `A008` y `A010` e indica los errores exactos.
- **Colección vacía:** el Caso 2 devuelve totales vacíos, tarjetas vacías, `find` igual a `undefined` y `findIndex` igual a `-1`, sin errores.
- **Búsqueda sin coincidencia:** el Caso 3 busca `"Metal"` y devuelve `undefined` y `-1`.
- **Inmutabilidad:** en cada caso se compara `JSON.stringify` de la entrada antes y después, y se muestra si quedó igual.

## Decisiones de estructuras

| Estructura | Uso en la solución | Por qué |
|---|---|---|
| `Array` | Registros, tarjetas, errores de validación | Orden estable y recorrido con `filter`, `map`, `reduce`, `find`, `some`, `every`, `sort`. |
| `Object` | Cada registro y cada tarjeta; `configuracion`; `totalesPorMaterialComoObjeto` | Representa entidades con campos nombrados; `Object.fromEntries` convierte el `Map` a un objeto JSON-friendly. |
| `Map` | Total por material | La operación principal asocia una clave (material) con un acumulado. Ver respuesta 1. |
| `Set` | Códigos únicos y materiales | Elimina duplicados sin escribir la lógica manualmente. |

Destructuring se usa en parámetros (`crearTarjetas`, `validarRegistro`), spread se usa para copias y combinar opciones, y rest se usa en `generarReporte(registros, ...opciones)`.

## Inmutabilidad

- Ninguna función modifica el arreglo de entrada ni sus objetos. Las funciones devuelven estructuras nuevas.
- `ordenarTarjetas` copia el arreglo con spread antes de llamar a `sort`. Ver respuesta 2 y explicación abajo.
- `generarReporte` no altera los resultados de etapas anteriores: el objeto final se construye con spread a partir de valores ya calculados.
- En `consulta.primerRegistro` se devuelve una copia (`{ ...encontrado }`), para no exponer la referencia del registro original.

### Por qué la copia antes de `sort` es necesaria

`Array.prototype.sort` ordena el arreglo **en el lugar** y devuelve ese mismo arreglo. Si se llamara directamente sobre la lista de tarjetas que se le pasó, esa lista se reordenaría para quien la tuviera, y cualquier otro uso posterior vería un orden inesperado. Con `[...tarjetas].sort(...)` el ordenamiento actúa sobre un arreglo nuevo y la lista original conserva su orden.

## Respuestas conceptuales

### 1. ¿Por qué el total por material se representa mejor con `Map` que con un arreglo?

Con un `Map` la clave es el material y el valor es el acumulado. Cada actualización es directa, sin buscar posiciones:

```js
// Con Map: acceso directo por clave
const totales = registros.reduce(
  (mapa, { material, pesoKg }) => mapa.set(material, (mapa.get(material) ?? 0) + pesoKg),
  new Map()
);
totales.get("PET"); // 26.9
```

Con un arreglo habría que buscar el índice del material en cada iteración y mantener pares manualmente:

```js
// Con Array: búsqueda lineal y pares manuales
const totales = [];
for (const { material, pesoKg } of registros) {
  const fila = totales.find(([nombre]) => nombre === material);
  if (fila) fila[1] += pesoKg;
  else totales.push([material, pesoKg]);
}
```

El `Map` expresa la intención (asociar clave y valor) y evita el recorrido adicional. Además acepta cualquier tipo de clave y mantiene el orden de inserción.

### 2. ¿Qué diferencia existe entre una referencia directa y una copia creada con spread?

Una **referencia directa** no crea un objeto nuevo: dos variables apuntan al mismo objeto, y un cambio en una se ve en la otra.

```js
const original = { codigo: "A001", pesoKg: 12.5 };
const referencia = original;     // misma memoria
const copia = { ...original };   // objeto nuevo

referencia === original; // true
copia === original;      // false
```

Un spread hace una copia **superficial**: las propiedades primitivas se copian por valor, pero los objetos anidados siguen compartidos. En este proyecto los registros solo tienen primitivos, así que la copia es completamente independiente. Esto se aplica en `consulta.primerRegistro` y en `[...tarjetas]` antes de ordenar.

### 3. ¿Qué operación justifica usar `filter`, `find`, `some` o `every` en la solución?

- **`filter`**: cuando se necesitan **todos** los elementos que cumplen una condición y se obtiene un arreglo nuevo. Se usa para obtener los registros aceptados.
- **`find`**: cuando se necesita **el primero** que cumple una condición. Se usa para el primer registro aceptado de un material; devuelve `undefined` si no existe.
- **`findIndex`**: cuando se necesita la **posición** del primero que cumple una condición. Se usa para la posición del material en la lista de tarjetas; devuelve `-1` si no existe.
- **`some`**: responde "¿existe al menos uno?". Se usa para saber si hay algún registro aceptado contaminado.
- **`every`**: responde "¿todos cumplen?". Se usa para comprobar que todas las tarjetas tienen etiqueta. Sobre una colección vacía devuelve `true` por definición, y el programa lo indica explícitamente.

## Salida reproducible

Comando usado y salida completa (Node.js v22.22.0):

```bash
cd analizador-acopio
node src/index.js
```

```
=== Caso 1: flujo principal con datos de datos.js ===
1) Validación de la colección
   Total: 10 | válidos: 8 | rechazados: 2
   ¿Todos válidos?: no
   - Posición 7 (código: A008): pesoKg debe ser un número mayor que cero
   - Posición 9 (código: A010): turno debe ser texto no vacío; contaminado debe ser booleano
2) Totales por material (Map)
   PET        26.90 kg
   Cartón     14.90 kg
   Vidrio     34.40 kg
   Aluminio   1.90 kg
3) Códigos únicos (Set): 8
   A001, A002, A003, A004, A005, A006, A007, A009
   Materiales disponibles: PET, Cartón, Vidrio, Aluminio
4) Tarjetas ordenadas por pesoKg (desc), sobre una copia
   [0] Vidrio · 20.3 kg · turno Tarde
   [1] Vidrio · 14.1 kg · turno Mañana
   [2] PET · 12.5 kg · turno Mañana
   [3] PET · 9.4 kg · turno Mañana
   [4] Cartón · 8.2 kg · turno Mañana
   [5] Cartón · 6.7 kg · turno Tarde
   [6] PET · 5.0 kg · turno Tarde
   [7] Aluminio · 1.9 kg · turno Mañana
5) Comprobaciones
   some  - ¿existe algún registro aceptado contaminado?: sí
   every - ¿todas las tarjetas tienen etiqueta?: sí
6) Consulta del material "PET"
   Primer registro aceptado (find): código A001
   Posición en tarjetas (findIndex): 2
   Motivo: coincidencia encontrada.
7) ¿La entrada quedó sin cambios?: sí (10 registros comparados)

=== Caso 2: colección vacía ===
1) Validación de la colección
   Total: 0 | válidos: 0 | rechazados: 0
   ¿Todos válidos?: sí
2) Totales por material (Map)
   (sin registros aceptados)
3) Códigos únicos (Set): 0
   (ninguno)
   Materiales disponibles: (ninguno)
4) Tarjetas ordenadas por pesoKg (desc), sobre una copia
   (sin tarjetas)
5) Comprobaciones
   some  - ¿existe algún registro aceptado contaminado?: no
   every - ¿todas las tarjetas tienen etiqueta?: sí (colección vacía: every devuelve true por definición)
6) Consulta del material "PET"
   Primer registro aceptado (find): undefined
   Posición en tarjetas (findIndex): -1
   Motivo: la colección no tiene registros (no es un error de búsqueda).
7) ¿La entrada quedó sin cambios?: sí (0 registros comparados)

=== Caso 3: material inexistente ===
1) Validación de la colección
   Total: 10 | válidos: 8 | rechazados: 2
   ¿Todos válidos?: no
   - Posición 7 (código: A008): pesoKg debe ser un número mayor que cero
   - Posición 9 (código: A010): turno debe ser texto no vacío; contaminado debe ser booleano
2) Totales por material (Map)
   PET        26.90 kg
   Cartón     14.90 kg
   Vidrio     34.40 kg
   Aluminio   1.90 kg
3) Códigos únicos (Set): 8
   A001, A002, A003, A004, A005, A006, A007, A009
   Materiales disponibles: PET, Cartón, Vidrio, Aluminio
4) Tarjetas ordenadas por pesoKg (desc), sobre una copia
   [0] Vidrio · 20.3 kg · turno Tarde
   [1] Vidrio · 14.1 kg · turno Mañana
   [2] PET · 12.5 kg · turno Mañana
   [3] PET · 9.4 kg · turno Mañana
   [4] Cartón · 8.2 kg · turno Mañana
   [5] Cartón · 6.7 kg · turno Tarde
   [6] PET · 5.0 kg · turno Tarde
   [7] Aluminio · 1.9 kg · turno Mañana
5) Comprobaciones
   some  - ¿existe algún registro aceptado contaminado?: sí
   every - ¿todas las tarjetas tienen etiqueta?: sí
6) Consulta del material "Metal"
   Primer registro aceptado (find): undefined
   Posición en tarjetas (findIndex): -1
   Motivo: el material no existe entre los registros aceptados (sin coincidencia).
7) ¿La entrada quedó sin cambios?: sí (10 registros comparados)
```

Las tres variaciones muestran por separado: `undefined` y `-1` por búsqueda sin coincidencia (Caso 3), y `undefined` y `-1` por colección vacía, explicada como ausencia de datos y no como error (Caso 2).
