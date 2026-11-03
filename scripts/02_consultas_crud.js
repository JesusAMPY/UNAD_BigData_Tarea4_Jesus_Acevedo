// =====================================================================
// Tarea 4 - Big Data (UNAD) - Jesus Antonio Acevedo Montoya
// Script 02: consultas básicas (inserción, selección, actualización y eliminación)
// Ejecución:  mongosh --quiet scripts/02_consultas_crud.js
// =====================================================================

db = db.getSiblingDB("calidad_aire_aburra");

// Este script modifica los datos: debe ejecutarse una sola vez después del script 01
if (db.sensores.countDocuments({ codigo: "SEN-011" }) > 0) {
  print("El script 02 ya se ejecutó. Vuelva a correr primero: mongosh --quiet scripts/01_crear_bd_e_insertar.js");
  quit(1);
}

// ---------------------------- INSERCIÓN ------------------------------
print("=== 1. INSERCIÓN: insertOne() de un nuevo sensor ===");
const nuevo = db.sensores.insertOne({
  codigo: "SEN-011",
  nombre: "Estación Itagüí El Tablazo",
  municipio: "Itagüí",
  zona: "Suburbana",
  ubicacion: { type: "Point", coordinates: [-75.6250, 6.1580] },
  altitud_msnm: 1650,
  variables: ["pm25", "temperatura", "humedad", "ruido"],
  fabricante: "EcoMonitor",
  estado: "activo",
  fecha_instalacion: new Date(Date.UTC(2026, 10, 1))
});
printjson(nuevo);

print("\n=== 2. INSERCIÓN: insertMany() de lecturas del nuevo sensor ===");
const nuevas = db.lecturas.insertMany([
  { sensor_codigo: "SEN-011", municipio: "Itagüí", fecha_hora: new Date(Date.UTC(2026, 9, 1, 12)),
    mediciones: { pm25: 28.4, temperatura: 22.1, humedad: 70.2 }, categoria_ica: "Aceptable", estado_dato: "valido" },
  { sensor_codigo: "SEN-011", municipio: "Itagüí", fecha_hora: new Date(Date.UTC(2026, 9, 1, 13)),
    mediciones: { pm25: 41.7, temperatura: 23.5, humedad: 66.8 }, categoria_ica: "Dañina para grupos sensibles", estado_dato: "valido" }
]);
print("Lecturas insertadas: " + Object.keys(nuevas.insertedIds).length);

// ---------------------------- SELECCIÓN ------------------------------
print("\n=== 3. SELECCIÓN: find() con proyección (5 primeros sensores) ===");
db.sensores.find({}, { _id: 0, codigo: 1, nombre: 1, municipio: 1, zona: 1 })
  .sort({ codigo: 1 }).limit(5).forEach(printjson);

print("\n=== 4. SELECCIÓN: findOne() del sensor SEN-011 ===");
printjson(db.sensores.findOne({ codigo: "SEN-011" }, { _id: 0, ubicacion: 0 }));

print("\n=== 5. SELECCIÓN: últimas 3 lecturas de Itagüí ===");
db.lecturas.find({ municipio: "Itagüí" }, { _id: 0, sensor_codigo: 1, fecha_hora: 1, "mediciones.pm25": 1, categoria_ica: 1 })
  .sort({ fecha_hora: -1 }).limit(3).forEach(printjson);

// --------------------------- ACTUALIZACIÓN ---------------------------
print("\n=== 6. ACTUALIZACIÓN: updateOne() – SEN-007 pasa a mantenimiento ===");
printjson(db.sensores.updateOne(
  { codigo: "SEN-007" },
  { $set: { estado: "mantenimiento", ultima_revision: new Date() } }
));
printjson(db.sensores.findOne({ codigo: "SEN-007" }, { _id: 0, codigo: 1, municipio: 1, estado: 1 }));

print("\n=== 7. ACTUALIZACIÓN: updateMany() – alertas naranja de Medellín atendidas ===");
printjson(db.alertas.updateMany(
  { sensor_codigo: "SEN-001", nivel: "Naranja" },
  { $set: { atendida: true },
    $push: { acciones: { fecha: new Date(), detalle: "Aviso enviado a la Secretaría de Salud" } } }
));

print("\n=== 8. ACTUALIZACIÓN: $inc – ajuste de calibración (+0.5 °C) en SEN-004 ===");
printjson(db.lecturas.updateMany({ sensor_codigo: "SEN-004" }, { $inc: { "mediciones.temperatura": 0.5 } }));

// ---------------------------- ELIMINACIÓN ----------------------------
print("\n=== 9. ELIMINACIÓN: deleteMany() – lecturas con datos sospechosos ===");
print("Lecturas sospechosas antes: " + db.lecturas.countDocuments({ estado_dato: "sospechoso" }));
printjson(db.lecturas.deleteMany({ estado_dato: "sospechoso" }));

print("\n=== 10. ELIMINACIÓN: deleteOne() – lectura de prueba del SEN-011 ===");
printjson(db.lecturas.deleteOne({ sensor_codigo: "SEN-011", "mediciones.pm25": 28.4 }));

print("\n=== 11. ESTADO FINAL DE LAS COLECCIONES ===");
print("sensores : " + db.sensores.countDocuments({}));
print("lecturas : " + db.lecturas.countDocuments({}));
print("alertas  : " + db.alertas.countDocuments({}));
