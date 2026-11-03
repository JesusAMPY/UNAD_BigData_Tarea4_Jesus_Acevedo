// =====================================================================
// Tarea 4 - Big Data (UNAD) - Jesus Antonio Acevedo Montoya
// Script 03: consultas con filtros, operadores y join ($lookup)
// Ejecución:  mongosh --quiet scripts/03_filtros_operadores_join.js
// =====================================================================

db = db.getSiblingDB("calidad_aire_aburra");

print("=== 1. COMPARACIÓN ($gt, $lte): lecturas con PM2.5 entre 55 y 95 µg/m³ ===");
const filtro1 = { "mediciones.pm25": { $gt: 55, $lte: 95 } };
print("Total: " + db.lecturas.countDocuments(filtro1));
db.lecturas.find(filtro1, { _id: 0, municipio: 1, fecha_hora: 1, "mediciones.pm25": 1 })
  .sort({ "mediciones.pm25": -1 }).limit(5).forEach(printjson);

print("\n=== 2. LÓGICOS ($and, $or): calor (> 28 °C) o humedad alta (> 85 %) en zona urbana ===");
const filtro2 = {
  $and: [
    { municipio: { $in: ["Medellín", "Itagüí", "Envigado", "Bello", "Sabaneta"] } },
    { $or: [{ "mediciones.temperatura": { $gt: 28 } }, { "mediciones.humedad": { $gt: 85 } }] }
  ]
};
print("Total: " + db.lecturas.countDocuments(filtro2));
db.lecturas.find(filtro2, { _id: 0, municipio: 1, "mediciones.temperatura": 1, "mediciones.humedad": 1 })
  .limit(5).forEach(printjson);

print("\n=== 3. CONJUNTOS ($in, $nin): sensores fuera de la zona urbana ===");
db.sensores.find({ zona: { $nin: ["Urbana"] } }, { _id: 0, codigo: 1, municipio: 1, zona: 1 }).forEach(printjson);

print("\n=== 4. TEXTO ($regex): estaciones cuyo nombre contiene 'Centro' ===");
db.sensores.find({ nombre: { $regex: /centro/i } }, { _id: 0, nombre: 1 }).forEach(printjson);

print("\n=== 5. ARREGLOS ($all, $size) y EXISTENCIA ($exists) ===");
print("Sensores que miden pm25 y ruido:");
db.sensores.find({ variables: { $all: ["pm25", "ruido"] } }, { _id: 0, codigo: 1, variables: 1 }).forEach(printjson);
print("Sensores con fecha de última revisión registrada:");
db.sensores.find({ ultima_revision: { $exists: true } }, { _id: 0, codigo: 1, estado: 1 }).forEach(printjson);
print("Alertas con exactamente 1 acción registrada: " + db.alertas.countDocuments({ acciones: { $size: 1 } }));

print("\n=== 6. GEOESPACIAL ($near): estaciones a menos de 8 km de Itagüí ===");
db.sensores.createIndex({ ubicacion: "2dsphere" });
db.sensores.find({
  ubicacion: { $near: { $geometry: { type: "Point", coordinates: [-75.6114, 6.1719] }, $maxDistance: 8000 } }
}, { _id: 0, codigo: 1, municipio: 1 }).forEach(printjson);

print("\n=== 7. JOIN ($lookup): alertas rojas con los datos de su sensor ===");
db.alertas.aggregate([
  { $match: { nivel: "Roja" } },
  { $lookup: { from: "sensores", localField: "sensor_codigo", foreignField: "codigo", as: "sensor" } },
  { $unwind: "$sensor" },
  { $project: { _id: 0, pm25: 1, fecha_hora: 1, "sensor.nombre": 1, "sensor.zona": 1, "sensor.estado": 1 } },
  { $sort: { pm25: -1 } },
  { $limit: 5 }
]).forEach(printjson);

print("\n=== 8. JOIN ($lookup con pipeline): sensores con su número de alertas pendientes ===");
db.sensores.aggregate([
  { $lookup: {
      from: "alertas",
      let: { cod: "$codigo" },
      pipeline: [
        { $match: { $expr: { $and: [ { $eq: ["$sensor_codigo", "$$cod"] }, { $eq: ["$atendida", false] } ] } } }
      ],
      as: "pendientes" } },
  { $project: { _id: 0, codigo: 1, municipio: 1, alertas_pendientes: { $size: "$pendientes" } } },
  { $sort: { alertas_pendientes: -1, codigo: 1 } }
]).forEach(printjson);

print("\n=== 9. JOIN DOBLE: alerta + lectura original + sensor ===");
db.alertas.aggregate([
  { $sort: { pm25: -1 } },
  { $limit: 1 },
  { $lookup: { from: "lecturas", localField: "lectura_id", foreignField: "_id", as: "lectura" } },
  { $lookup: { from: "sensores", localField: "sensor_codigo", foreignField: "codigo", as: "sensor" } },
  { $project: { _id: 0, nivel: 1, mensaje: 1,
      lectura: { $arrayElemAt: ["$lectura.mediciones", 0] },
      estacion: { $arrayElemAt: ["$sensor.nombre", 0] } } }
]).forEach(printjson);
