const Database = require('better-sqlite3');
const path = require('path');

// Simpan file database di folder backend
const dbPath = path.resolve(__dirname, '../../database.sqlite');
const db = new Database(dbPath, {
  // verbose: console.log // uncomment jika ingin debug query SQL
});

// Aktifkan Foreign Key constraint & WAL mode untuk performa konkurensi optimal
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');


// Script Inisialisasi Tabel
function initDatabase() {
  const schemaSQL = `
    -- Tabel Pasien
    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama TEXT NOT NULL,
      nomor_identitas TEXT NOT NULL UNIQUE,
      keluhan_utama TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabel Antrean
    CREATE TABLE IF NOT EXISTS queues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      nomor_antrean TEXT NOT NULL,
      status TEXT CHECK(status IN ('menunggu', 'dipanggil', 'selesai')) DEFAULT 'menunggu',
      diagnosa TEXT,
      tindakan_resep TEXT,
      waktu_daftar DATETIME DEFAULT CURRENT_TIMESTAMP,
      waktu_selesai DATETIME,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    -- Tabel Pengguna / Tenaga Medis (Dokter)
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      nama TEXT NOT NULL,
      role TEXT CHECK(role IN ('dokter', 'admin', 'petugas')) DEFAULT 'dokter',
      sip TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexing untuk pencarian cepat
    CREATE INDEX IF NOT EXISTS idx_queues_status ON queues(status);
    CREATE INDEX IF NOT EXISTS idx_queues_waktu_daftar ON queues(waktu_daftar);
    CREATE INDEX IF NOT EXISTS idx_patients_nik ON patients(nomor_identitas);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  `;

  db.exec(schemaSQL);

  // Migrasi otomatis jika database sudah terbentuk sebelumnya
  const tableInfo = db.pragma('table_info(queues)').map(col => col.name);
  if (!tableInfo.includes('diagnosa')) {
    db.exec('ALTER TABLE queues ADD COLUMN diagnosa TEXT;');
  }
  if (!tableInfo.includes('tindakan_resep')) {
    db.exec('ALTER TABLE queues ADD COLUMN tindakan_resep TEXT;');
  }
  if (!tableInfo.includes('waktu_selesai')) {
    db.exec('ALTER TABLE queues ADD COLUMN waktu_selesai DATETIME;');
  }

  // Seed default dokter jika tabel users masih kosong
  const bcrypt = require('bcryptjs');
  const userCount = db.prepare('SELECT COUNT(*) as total FROM users').get().total;
  if (userCount === 0) {
    const defaultPasswordHash = bcrypt.hashSync('password123', 10);
    const insertUser = db.prepare(`
      INSERT INTO users (username, password, nama, role, sip)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertUser.run('dokter', defaultPasswordHash, 'dr. Budi Santoso, Sp.PD', 'dokter', 'SIP.503/442/SIP-D/2024');
    insertUser.run('dr.siti', defaultPasswordHash, 'dr. Siti Aminah, Sp.A', 'dokter', 'SIP.503/443/SIP-D/2024');
    console.log('🩺 Default Akun Dokter berhasil dibuat (username: dokter / password: password123)');
  }

  console.log('✅ SQLite Database & Tables initialized successfully.');
}

// Inisialisasi saat modul dimuat
initDatabase();

module.exports = db;

