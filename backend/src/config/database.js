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

    -- Indexing untuk pencarian cepat
    CREATE INDEX IF NOT EXISTS idx_queues_status ON queues(status);
    CREATE INDEX IF NOT EXISTS idx_queues_waktu_daftar ON queues(waktu_daftar);
    CREATE INDEX IF NOT EXISTS idx_patients_nik ON patients(nomor_identitas);
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

  console.log('✅ SQLite Database & Tables initialized successfully.');
}

// Inisialisasi saat modul dimuat
initDatabase();

module.exports = db;
