// src/utils/firestoreUtils.js
import { db } from "../lib/firebase";
import { doc, runTransaction, setDoc, updateDoc } from "firebase/firestore";

// Forecast amigable
export async function crearForecastAmigable(forecastData) {
  const counterRef = doc(db, "counters", "forecasts");
  let nuevoId = "";
  await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    let next = 1;
    if (counterDoc.exists()) {
      next = (counterDoc.data().count || 0) + 1;
    }
    nuevoId = `forecast${String(next).padStart(5, "0")}`;
    transaction.set(counterRef, { count: next });
  });
  await setDoc(doc(db, "forecasts", nuevoId), { ...forecastData, id: nuevoId });
  return nuevoId;
}

// Venta amigable
export async function crearVentaAmigable(ventaData) {
  const counterRef = doc(db, "counters", "ventas");
  let nuevoId = "";
  await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    let next = 1;
    if (counterDoc.exists()) {
      next = (counterDoc.data().count || 0) + 1;
    }
    nuevoId = `venta${String(next).padStart(6, "0")}`;
    transaction.set(counterRef, { count: next });
  });
  const pago = ventaData.tipoPago === 'Contado' ? true : false;
  await setDoc(doc(db, "ventas", nuevoId), { ...ventaData, id: nuevoId, pago });
  return nuevoId;
}

// Actualiza el streak de un forecast (solo actualiza el documento)
export async function actualizarForecast(forecast) {
  await updateDoc(doc(db, "forecasts", forecast.id), {
    streak: (forecast.streak || 0) + 1,
    periodStart: new Date().toISOString(),
    lastChecked: new Date().toISOString()
  });
}