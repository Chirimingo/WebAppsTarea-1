// Registros de ejemplo de jornadas de acopio.
// Incluye materiales repetidos (PET, Cartón, Vidrio), dos turnos distintos
// y registros inválidos para probar la validación.
const registros = [
  { codigo: "A001", material: "PET", pesoKg: 12.5, turno: "Mañana", contaminado: false },
  { codigo: "A002", material: "Cartón", pesoKg: 8.2, turno: "Mañana", contaminado: false },
  { codigo: "A003", material: "PET", pesoKg: 5.0, turno: "Tarde", contaminado: true },
  { codigo: "A004", material: "Vidrio", pesoKg: 20.3, turno: "Tarde", contaminado: false },
  { codigo: "A005", material: "Cartón", pesoKg: 6.7, turno: "Tarde", contaminado: false },
  { codigo: "A006", material: "Aluminio", pesoKg: 1.9, turno: "Mañana", contaminado: false },
  { codigo: "A007", material: "PET", pesoKg: 9.4, turno: "Mañana", contaminado: false },
  // Inválido: pesoKg no es mayor que cero.
  { codigo: "A008", material: "Papel", pesoKg: -3, turno: "Tarde", contaminado: false },
  { codigo: "A009", material: "Vidrio", pesoKg: 14.1, turno: "Mañana", contaminado: true },
  // Inválido: turno vacío y contaminado no es booleano.
  { codigo: "A010", material: "Papel", pesoKg: 4.4, turno: "", contaminado: "sí" },
];

module.exports = { registros };
