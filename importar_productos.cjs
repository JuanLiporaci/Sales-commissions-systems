const admin = require('firebase-admin');
const fs = require('fs');
const csv = require('csv-parser');

// Cambia estos nombres de archivo si los tuyos son diferentes
const serviceAccount = require('./firebase-credentials.json');
const csvFilePath = './hoja de costos  - costo 042025.csv';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const productos = [];

fs.createReadStream(csvFilePath)
  .pipe(csv())
  .on('data', (row) => {
    const code = (row['Product/Service'] || '').trim();
    const description = (row['Memo/Description'] || '').trim();
    const costo_falcon = parseFloat((row['COSTO FALCON'] || '0').replace(',', '.'));
    const costo_jesus = row['costo jesus'] ? parseFloat((row['costo jesus'] || '0').replace(',', '.')) : null;

    const producto = {
      code,
      description,
      costo_falcon,
    };
    if (!isNaN(costo_jesus) && costo_jesus > 0) {
      producto.costo_jesus = costo_jesus;
    }
    productos.push(producto);
  })
  .on('end', async () => {
    console.log(`Leídos ${productos.length} productos. Subiendo a Firestore...`);
    const batch = db.batch();
    productos.forEach((producto) => {
      const docRef = db.collection('productos').doc(producto.code || undefined);
      batch.set(docRef, producto);
    });
    await batch.commit();
    console.log('¡Importación completada!');
    process.exit(0);
  });