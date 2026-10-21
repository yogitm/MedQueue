const test = require('node:test');
const assert = require('node:assert');
const app = require('../src/server');

test('API Endpoints Verification', async (t) => {
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  t.after(() => {
    server.close();
  });

  await t.test('GET / should return server health status', async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.status, 'online');
  });

  await t.test('POST /api/antrean validation error for missing fields', async () => {
    const res = await fetch(`${baseUrl}/api/antrean`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama: 'Only Name' })
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
  });

  await t.test('POST /api/antrean creates a queue successfully', async () => {
    const testNik = '320101' + Date.now();
    const res = await fetch(`${baseUrl}/api/antrean`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nama: 'Siti Rahmawati',
        nomor_identitas: testNik,
        keluhan: 'Pemeriksaan tensi rutin'
      })
    });
    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.nomor_antrean.startsWith('A-'));
    const queueId = body.data.id;

    // Test Selesaikan antrean dengan diagnosa & resep
    const resFinish = await fetch(`${baseUrl}/api/antrean/${queueId}/selesai`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        diagnosa: 'Hipertensi Ringan',
        tindakan_resep: 'Amlodipine 5mg 1x1 sehari'
      })
    });
    assert.strictEqual(resFinish.status, 200);

    // Test DELETE /api/rekam-medis/:id
    const resDelRekam = await fetch(`${baseUrl}/api/rekam-medis/${queueId}`, { method: 'DELETE' });
    assert.strictEqual(resDelRekam.status, 200);

    // Test Buat antrean kedua untuk diupdate & didelete
    const res2 = await fetch(`${baseUrl}/api/antrean`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nama: 'Ahmad Dahlan',
        nomor_identitas: '330101' + Date.now(),
        keluhan: 'Flu batuk'
      })
    });
    assert.strictEqual(res2.status, 201);
    const q2Id = (await res2.json()).data.id;

    // Test PUT /api/antrean/:id (Update data)
    const resUpdate = await fetch(`${baseUrl}/api/antrean/${q2Id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nama: 'Ahmad Dahlan Updated',
        keluhan: 'Flu batuk dan sakit kepala'
      })
    });
    assert.strictEqual(resUpdate.status, 200);
    const updatedBody = await resUpdate.json();
    assert.strictEqual(updatedBody.data.nama, 'Ahmad Dahlan Updated');

    // Test DELETE /api/antrean/:id (Delete antrean aktif)
    const resDel = await fetch(`${baseUrl}/api/antrean/${q2Id}`, { method: 'DELETE' });
    assert.strictEqual(resDel.status, 200);
  });
});
