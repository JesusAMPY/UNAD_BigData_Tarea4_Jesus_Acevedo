// =====================================================================
// Tarea 4 - Big Data (UNAD) - Jesus Antonio Acevedo Montoya
// Caso de uso: Monitoreo de la calidad del aire en el Valle de Aburrá
// Script 01: creación de la base de datos e inserción de datos de prueba
// Ejecución:  mongosh --quiet scripts/01_crear_bd_e_insertar.js
// =====================================================================

db = db.getSiblingDB("calidad_aire_aburra");

// Generador pseudoaleatorio con semilla fija: siempre produce los mismos datos
let semilla = 2026;
function aleatorio() {
  semilla = (semilla * 1103515245 + 12345) % 2147483648;
  return semilla / 2147483648;
}
function entre(min, max, decimales = 2) {
  return Number((min + aleatorio() * (max - min)).toFixed(decimales));
}

// Categoría del Índice de Calidad del Aire (ICA) para PM2.5 (µg/m³)
function categoriaICA(pm25) {
  if (pm25 <= 12) return "Buena";
  if (pm25 <= 37) return "Aceptable";
  if (pm25 <= 55) return "Dañina para grupos sensibles";
  return "Dañina para la salud";
}

print("=== 1. CREACIÓN DE LA BASE DE DATOS Y COLECCIONES ===");
db.dropDatabase();
db.createCollection("sensores");
db.createCollection("lecturas");
db.createCollection("alertas");
print("Base de datos: " + db.getName());
printjson(db.getCollectionNames());

// ---------------------------------------------------------------------
// Colección SENSORES (10 documentos): una estación por municipio
// ---------------------------------------------------------------------
const municipios = [
  ["SEN-001", "Medellín",    "Centro",           6.2518, -75.5636, 1495, "Urbana"],
  ["SEN-002", "Itagüí",      "Ditaires",         6.1719, -75.6114, 1550, "Urbana"],
  ["SEN-003", "Envigado",    "Zona Centro",      6.1709, -75.5866, 1575, "Urbana"],
  ["SEN-004", "Bello",       "Niquía",           6.3373, -75.5580, 1450, "Urbana"],
  ["SEN-005", "Sabaneta",    "Parque Principal", 6.1515, -75.6166, 1550, "Urbana"],
  ["SEN-006", "La Estrella", "Centro",           6.1576, -75.6431, 1775, "Suburbana"],
  ["SEN-007", "Caldas",      "Centro",           6.0911, -75.6357, 1750, "Suburbana"],
  ["SEN-008", "Copacabana",  "Centro",           6.3487, -75.5089, 1425, "Suburbana"],
  ["SEN-009", "Girardota",   "Centro",           6.3775, -75.4456, 1425, "Suburbana"],
  ["SEN-010", "Barbosa",     "Centro",           6.4383, -75.3313, 1300, "Rural"]
];

const sensores = municipios.map(([codigo, municipio, sector, lat, lon, altitud, zona], i) => ({
  codigo: codigo,
  nombre: "Estación " + municipio + " " + sector,
  municipio: municipio,
  zona: zona,
  ubicacion: { type: "Point", coordinates: [lon, lat] },   // formato GeoJSON
  altitud_msnm: altitud,
  variables: ["pm25", "temperatura", "humedad"],
  fabricante: i % 2 === 0 ? "AirSense" : "EcoMonitor",
  estado: "activo",
  fecha_instalacion: new Date(Date.UTC(2024, i, 10))
}));

const resSensores = db.sensores.insertMany(sensores);
print("\n=== 2. INSERCIÓN EN 'sensores' ===");
print("Documentos insertados: " + Object.keys(resSensores.insertedIds).length);

// ---------------------------------------------------------------------
// Colección LECTURAS (150 documentos): 15 lecturas por sensor, cada hora
// ---------------------------------------------------------------------
// Municipios del centro del valle con más tráfico: PM2.5 más alto
const factorZona = { "Urbana": 1.25, "Suburbana": 1.0, "Rural": 0.7 };
const lecturas = [];
// 1 de octubre de 2026 desde las 6:00 a. m. hora Colombia (11:00 UTC)

sensores.forEach((s) => {
  for (let h = 0; h < 15; h++) {
    const horaColombia = 6 + h;                       // 6:00 a 20:00
    const fecha = new Date(Date.UTC(2026, 9, 1, 11 + h, 0, 0));
    const horaPico = (horaColombia >= 6 && horaColombia <= 9) || (horaColombia >= 17 && horaColombia <= 19);
    const pm25 = entre(8, horaPico ? 62 : 40) * factorZona[s.zona];
    const valor = Number(Math.min(pm25, 95).toFixed(2));
    lecturas.push({
      sensor_codigo: s.codigo,
      municipio: s.municipio,
      fecha_hora: fecha,
      mediciones: {
        pm25: valor,
        temperatura: entre(16, 30),
        humedad: entre(45, 90)
      },
      categoria_ica: categoriaICA(valor),
      estado_dato: "valido"
    });
  }
});

// 6 lecturas con errores de calibración (se eliminarán en el script 02)
[3, 22, 47, 81, 109, 133].forEach((i) => {
  lecturas[i].estado_dato = "sospechoso";
  lecturas[i].mediciones.humedad = 104.5;
});

const resLecturas = db.lecturas.insertMany(lecturas);
print("\n=== 3. INSERCIÓN EN 'lecturas' ===");
print("Documentos insertados: " + Object.keys(resLecturas.insertedIds).length);

// ---------------------------------------------------------------------
// Colección ALERTAS: una alerta por cada lectura con PM2.5 > 37 µg/m³
// ---------------------------------------------------------------------
const criticas = db.lecturas.find({ "mediciones.pm25": { $gt: 37 }, estado_dato: "valido" }).toArray();
const alertas = criticas.map((l, i) => ({
  lectura_id: l._id,
  sensor_codigo: l.sensor_codigo,
  fecha_hora: l.fecha_hora,
  pm25: l.mediciones.pm25,
  nivel: l.mediciones.pm25 > 55 ? "Roja" : "Naranja",
  mensaje: "PM2.5 de " + l.mediciones.pm25 + " µg/m³ en " + l.municipio,
  atendida: false,
  acciones: []
}));
const resAlertas = db.alertas.insertMany(alertas);
print("\n=== 4. INSERCIÓN EN 'alertas' ===");
print("Documentos insertados: " + Object.keys(resAlertas.insertedIds).length);

// Índices para acelerar las consultas y el join
db.lecturas.createIndex({ sensor_codigo: 1, fecha_hora: 1 });
db.alertas.createIndex({ sensor_codigo: 1 });
db.sensores.createIndex({ codigo: 1 }, { unique: true });

print("\n=== 5. RESUMEN DE LA BASE DE DATOS ===");
print("sensores : " + db.sensores.countDocuments());
print("lecturas : " + db.lecturas.countDocuments());
print("alertas  : " + db.alertas.countDocuments());
print("TOTAL    : " + (db.sensores.countDocuments() + db.lecturas.countDocuments() + db.alertas.countDocuments()) + " documentos");
