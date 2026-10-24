const test = require('node:test');
const assert = require('node:assert');
const app = require('../src/server');
const { requireRole } = require('../src/middlewares/authMiddleware');

test('API Endpoints Verification & Doctor Authentication', async (t) => {
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  t.after(() => {
    server.close();
  });

  let doctorToken = '';

  await t.test('GET / should return server health status', async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.status, 'online');
  });

  await t.test('GET /unknown-route should return 404 handler', async () => {
    const res = await fetch(`${baseUrl}/api/non-existent-route`);
    assert.strictEqual(res.status, 404);
    const body = await res.json();
    assert.strictEqual(body.success, false);
  });

  await t.test('POST /api/auth/login validation error for missing fields', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'dokter' })
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
  });

  await t.test('POST /api/auth/login non-existent user should fail (401)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'nonexistentuser',
        password: 'password123'
      })
    });
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.success, false);
  });

  await t.test('POST /api/auth/login with wrong password should fail (401)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'dokter',
        password: 'wrongpassword'
      })
    });
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.success, false);
  });

  await t.test('POST /api/auth/login with valid doctor credentials should succeed (200)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'dokter',
        password: 'password123'
      })
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.token);
    assert.strictEqual(body.user.username, 'dokter');
    assert.strictEqual(body.user.role, 'dokter');
    doctorToken = body.token;
  });

  await t.test('GET /api/auth/me should return logged-in doctor profile with valid token', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${doctorToken}`
      }
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.username, 'dokter');
  });

  await t.test('POST /api/auth/logout should succeed with valid token', async () => {
    const res = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${doctorToken}`
      }
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
  });

  await t.test('Doctor routes should reject unauthenticated access (401)', async () => {
    // Unauthenticated GET /api/antrean
    const resQueues = await fetch(`${baseUrl}/api/antrean`);
    assert.strictEqual(resQueues.status, 401);

    // Header without Bearer prefix
    const resNoBearer = await fetch(`${baseUrl}/api/antrean`, {
      headers: { 'Authorization': 'Basic 123456' }
    });
    assert.strictEqual(resNoBearer.status, 401);

    // Invalid Token
    const resInvalidToken = await fetch(`${baseUrl}/api/antrean`, {
      headers: { 'Authorization': 'Bearer invalidtoken123' }
    });
    assert.strictEqual(resInvalidToken.status, 401);

    // Unauthenticated GET /api/rekam-medis
    const resRecords = await fetch(`${baseUrl}/api/rekam-medis`);
    assert.strictEqual(resRecords.status, 401);

    // Unauthenticated PUT /api/antrean/1/panggil
    const resCall = await fetch(`${baseUrl}/api/antrean/1/panggil`, { method: 'PUT' });
    assert.strictEqual(resCall.status, 401);
  });

  await t.test('requireRole middleware authorization check', async () => {
    const middleware = requireRole('admin');
    let statusSent = 0;
    const req = { user: { role: 'dokter' } };
    const res = {
      status(code) {
        statusSent = code;
        return {
          json(data) { return data; }
        };
      }
    };
    middleware(req, res, () => {});
    assert.strictEqual(statusSent, 403);

    let nextCalled = false;
    const reqDoctor = { user: { role: 'dokter' } };
    const middlewareDoctor = requireRole('dokter');
    middlewareDoctor(reqDoctor, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true);
  });

  await t.test('POST /api/antrean validation error for missing fields (Public route)', async () => {
    const res = await fetch(`${baseUrl}/api/antrean`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama: 'Only Name' })
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
  });

  await t.test('POST /api/antrean creates a queue successfully without doctor login (Public Patient Registration)', async () => {
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

    // Pendaftaran pasien berulang dengan NIK yang sama (Update data pasien yang sudah ada)
    const resRepeat = await fetch(`${baseUrl}/api/antrean`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nama: 'Siti Rahmawati Updated',
        nomor_identitas: testNik,
        keluhan: 'Pemeriksaan tensi lanjutan'
      })
    });
    assert.strictEqual(resRepeat.status, 201);

    // Layar Tunggu aktif dapat diakses tanpa login dokter (Public Monitor)
    const resActive = await fetch(`${baseUrl}/api/antrean/aktif`);
    assert.strictEqual(resActive.status, 200);

    // Dokter mengambil seluruh daftar antrean aktif dengan token (Dashboard Dokter)
    const resAllQueues = await fetch(`${baseUrl}/api/antrean`, {
      headers: {
        'Authorization': `Bearer ${doctorToken}`
      }
    });
    assert.strictEqual(resAllQueues.status, 200);
    const allQueuesBody = await resAllQueues.json();
    assert.strictEqual(allQueuesBody.success, true);
    assert.ok(Array.isArray(allQueuesBody.data));

    // Dokter memanggil antrean dengan token
    const resCall = await fetch(`${baseUrl}/api/antrean/${queueId}/panggil`, {

      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${doctorToken}`
      }
    });
    assert.strictEqual(resCall.status, 200);

    // Dokter menyelesaikan antrean dengan diagnosa & resep menggunakan token
    const resFinish = await fetch(`${baseUrl}/api/antrean/${queueId}/selesai`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${doctorToken}`
      },
      body: JSON.stringify({
        diagnosa: 'Hipertensi Ringan',
        tindakan_resep: 'Amlodipine 5mg 1x1 sehari'
      })
    });
    assert.strictEqual(resFinish.status, 200);

    // Dokter melihat rekam medis menggunakan token
    const resRecords = await fetch(`${baseUrl}/api/rekam-medis`, {
      headers: {
        'Authorization': `Bearer ${doctorToken}`
      }
    });
    assert.strictEqual(resRecords.status, 200);
    const recordsBody = await resRecords.json();
    assert.strictEqual(recordsBody.success, true);

    // Dokter memperbarui rekam medis
    const resUpdateRecord = await fetch(`${baseUrl}/api/rekam-medis/${queueId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${doctorToken}`
      },
      body: JSON.stringify({
        diagnosa: 'Hipertensi Ringan Terkontrol',
        tindakan_resep: 'Amlodipine 5mg 1x1'
      })
    });
    assert.strictEqual(resUpdateRecord.status, 200);

    // Dokter menghapus rekam medis dengan token
    const resDelRekam = await fetch(`${baseUrl}/api/rekam-medis/${queueId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${doctorToken}`
      }
    });
    assert.strictEqual(resDelRekam.status, 200);

    // Test Buat antrean kedua untuk diupdate & didelete oleh dokter
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

    // Dokter mengupdate data antrean aktif
    const resUpdate = await fetch(`${baseUrl}/api/antrean/${q2Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${doctorToken}`
      },
      body: JSON.stringify({
        nama: 'Ahmad Dahlan Updated',
        keluhan: 'Flu batuk dan sakit kepala'
      })
    });
    assert.strictEqual(resUpdate.status, 200);
    const updatedBody = await resUpdate.json();
    assert.strictEqual(updatedBody.data.nama, 'Ahmad Dahlan Updated');

    // Dokter menghapus antrean aktif
    const resDel = await fetch(`${baseUrl}/api/antrean/${q2Id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${doctorToken}`
      }
    });
    assert.strictEqual(resDel.status, 200);
  });

  await t.test('Handling non-existent items should return 404', async () => {
    // Call non-existent queue
    const resCall404 = await fetch(`${baseUrl}/api/antrean/999999/panggil`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${doctorToken}` }
    });
    assert.strictEqual(resCall404.status, 404);

    // Finish non-existent queue
    const resFinish404 = await fetch(`${baseUrl}/api/antrean/999999/selesai`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${doctorToken}` }
    });
    assert.strictEqual(resFinish404.status, 404);

    // Update non-existent queue
    const resUpdate404 = await fetch(`${baseUrl}/api/antrean/999999`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${doctorToken}`
      },
      body: JSON.stringify({ nama: 'Test' })
    });
    assert.strictEqual(resUpdate404.status, 404);

    // Delete non-existent queue
    const resDel404 = await fetch(`${baseUrl}/api/antrean/999999`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${doctorToken}` }
    });
    assert.strictEqual(resDel404.status, 404);

    // Update non-existent medical record
    const resUpdateRec404 = await fetch(`${baseUrl}/api/rekam-medis/999999`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${doctorToken}`
      },
      body: JSON.stringify({ diagnosa: 'None' })
    });
    assert.strictEqual(resUpdateRec404.status, 404);

    // Delete non-existent medical record
    const resDelRec404 = await fetch(`${baseUrl}/api/rekam-medis/999999`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${doctorToken}` }
    });
    assert.strictEqual(resDelRec404.status, 404);
  });
});
