// =====================================================================
// Tarea 4 - Big Data (UNAD) - Jesus Antonio Acevedo Montoya
// Script 04: consultas de agregación (contar, sumar, promediar, máximos)
// Ejecución:  mongosh --quiet scripts/04_agregaciones.js
// =====================================================================

db = db.getSiblingDB("calidad_aire_aburra");

print("=== 1. CONTAR: lecturas por categoría del ICA ===");
db.lecturas.aggregate([
  { $group: { _id: "$categoria_ica", total: { $sum: 1 } } },
  { $sort: { total: -1 } }
]).forEach(printjson);

print("\n=== 2. PROMEDIAR: PM2.5, temperatura y humedad por municipio ===");
db.lecturas.aggregate([
  { $group: {
      _id: "$municipio",
      lecturas: { $sum: 1 },
      pm25_promedio: { $avg: "$mediciones.pm25" },
      temp_promedio: { $avg: "$mediciones.temperatura" },
      humedad_promedio: { $avg: "$mediciones.humedad" } } },
  { $project: { lecturas: 1,
      pm25_promedio: { $round: ["$pm25_promedio", 2] },
      temp_promedio: { $round: ["$temp_promedio", 2] },
      humedad_promedio: { $round: ["$humedad_promedio", 2] } } },
  { $sort: { pm25_promedio: -1 } }
]).forEach(printjson);

print("\n=== 3. MÁXIMOS Y MÍNIMOS: PM2.5 por tipo de zona (join + group) ===");
db.lecturas.aggregate([
  { $lookup: { from: "sensores", localField: "sensor_codigo", foreignField: "codigo", as: "s" } },
  { $unwind: "$s" },
  { $group: { _id: "$s.zona",
      pm25_max: { $max: "$mediciones.pm25" },
      pm25_min: { $min: "$mediciones.pm25" },
      pm25_prom: { $avg: "$mediciones.pm25" } } },
  { $project: { pm25_max: 1, pm25_min: 1, pm25_prom: { $round: ["$pm25_prom", 2] } } },
  { $sort: { pm25_prom: -1 } }
]).forEach(printjson);

print("\n=== 4. SUMAR: alertas por nivel y municipio ===");
db.alertas.aggregate([
  { $lookup: { from: "sensores", localField: "sensor_codigo", foreignField: "codigo", as: "s" } },
  { $unwind: "$s" },
  { $group: { _id: "$s.municipio",
      rojas: { $sum: { $cond: [{ $eq: ["$nivel", "Roja"] }, 1, 0] } },
      naranjas: { $sum: { $cond: [{ $eq: ["$nivel", "Naranja"] }, 1, 0] } },
      total: { $sum: 1 } } },
  { $sort: { total: -1 } }
]).forEach(printjson);

print("\n=== 5. PROMEDIO POR HORA DEL DÍA (hora de Colombia) ===");
db.lecturas.aggregate([
  { $group: { _id: { $hour: { date: "$fecha_hora", timezone: "America/Bogota" } },
      pm25_promedio: { $avg: "$mediciones.pm25" } } },
  { $project: { _id: 0, hora: "$_id", pm25_promedio: { $round: ["$pm25_promedio", 2] } } },
  { $sort: { hora: 1 } }
]).forEach(printjson);

print("\n=== 6. RANGOS ($bucket): distribución de lecturas por rango de PM2.5 ===");
db.lecturas.aggregate([
  { $bucket: {
      groupBy: "$mediciones.pm25",
      boundaries: [0, 12.01, 37.01, 55.01, 200],
      default: "Otro",
      output: { lecturas: { $sum: 1 }, promedio: { $avg: "$mediciones.pm25" } } } },
  { $project: { lecturas: 1, promedio: { $round: ["$promedio", 2] } } }
]).forEach(printjson);

print("\n=== 7. RESUMEN GENERAL ($facet) ===");
db.lecturas.aggregate([
  { $facet: {
      totales: [ { $group: { _id: null, lecturas: { $sum: 1 },
                             pm25_promedio: { $avg: "$mediciones.pm25" },
                             pm25_maximo: { $max: "$mediciones.pm25" } } },
                 { $project: { _id: 0, lecturas: 1, pm25_maximo: 1, pm25_promedio: { $round: ["$pm25_promedio", 2] } } } ],
      sobre_norma: [ { $match: { "mediciones.pm25": { $gt: 37 } } }, { $count: "lecturas_sobre_37" } ],
      municipio_mas_critico: [ { $group: { _id: "$municipio", p: { $avg: "$mediciones.pm25" } } },
                               { $sort: { p: -1 } }, { $limit: 1 }, { $project: { municipio: "$_id", _id: 0 } } ]
  } }
]).forEach(printjson);
