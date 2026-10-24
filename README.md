# 🏥 Sistem Manajemen Antrean Puskesmas & Klinik (MedQueue)

Aplikasi berbasis web modern untuk mendigitalisasi proses antrean di fasilitas kesehatan (Puskesmas / Klinik Pratama). Sistem ini dirancang untuk mencegah penumpukan pasien dengan memisahkan 3 sudut pandang utama: pendaftaran mandiri (kiosk), layar monitor publik ruang tunggu (TV), serta dashboard pemeriksaan dokter.

---

## 🚀 Stack Teknologi

### 1. Backend (REST API)
- **Runtime & Framework**: [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/)
- **Database**: [SQLite](https://www.sqlite.org/) via `better-sqlite3` (cepat, aman, ACID-compliant, tanpa perlu instalasi server database eksternal)
- **Format Pertukaran Data**: Pure JSON REST API

### 2. Frontend (Single Page Application)
- **Framework**: [Vue.js 3](https://vuejs.org/) (Composition API: `<script setup>`)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Routing**: [Vue Router 4](https://router.vuejs.org/)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Fitur Tambahan**: Web Speech API Text-to-Speech (Panggilan suara otomatis bahasa Indonesia di layar TV)

### 3. CI/CD & Testing
- **Test Runner**: Node.js Native Test Runner (`node:test`, `node:assert`)
- **CI/CD Pipeline**: Declarative `Jenkinsfile`

---

## 📁 Struktur Direktori Proyek

```text
PROJECT 1/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js          # Inisialisasi SQLite & schema DDL
│   │   ├── controllers/
│   │   │   └── queueController.js   # Logika bisnis antrean & pasien
│   │   ├── routes/
│   │   │   └── queueRoutes.js       # Definisi endpoint Express
│   │   └── server.js                # Entry point server Express
│   ├── test/
│   │   └── api.test.js              # Automated unit/integration test
│   ├── database.sqlite              # File database lokal (auto-created)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   │   └── style.css            # Tailwind directives
│   │   ├── router/
│   │   │   └── index.js             # Konfigurasi Vue Router (/daftar, /layar-tunggu, /dashboard)
│   │   ├── views/
│   │   │   ├── DaftarView.vue       # Form pendaftaran mandiri & struk antrean
│   │   │   ├── LayarTungguView.vue  # Layar TV ruang tunggu (polling + TTS)
│   │   │   ├── DashboardView.vue    # Dashboard dokter (panggil & catat diagnosa/selesai)
│   │   │   └── RekamMedisView.vue   # Halaman daftar pasien selesai & rekam medis
│   │   ├── App.vue                  # Root component & navigation bar
│   │   └── main.js                  # Entry point Vue 3
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── Jenkinsfile                      # Pipeline CI/CD Jenkins
└── README.md                        # Dokumentasi proyek
```

---

## 🗄️ Skema Database (SQLite)

### Tabel `patients`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `INTEGER` | Primary Key, Auto Increment |
| `nama` | `TEXT` | Nama lengkap pasien (Wajib) |
| `nomor_identitas` | `TEXT` | NIK / KTP / Paspor (Wajib, Unik) |
| `keluhan_utama` | `TEXT` | Catatan keluhan/gejala pasien |
| `created_at` | `DATETIME` | Default: `CURRENT_TIMESTAMP` |

### Tabel `queues`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `INTEGER` | Primary Key, Auto Increment |
| `patient_id` | `INTEGER` | Foreign Key ke `patients(id)` |
| `nomor_antrean` | `TEXT` | Nomor antrean otomatis (Format: `A-001`, `A-002`, dst.) |
| `status` | `TEXT` | `CHECK(status IN ('menunggu', 'dipanggil', 'selesai'))`, default `'menunggu'` |
| `diagnosa` | `TEXT` | Catatan diagnosa medis dari dokter |
| `tindakan_resep` | `TEXT` | Catatan resep obat dan tindakan medis yang diberikan |
| `waktu_daftar` | `DATETIME` | Waktu registrasi antrean, default: `CURRENT_TIMESTAMP` |
| `waktu_selesai` | `DATETIME` | Waktu saat pemeriksaan pasien diselesaikan |

### Tabel `users` (Tenaga Medis & Dokter)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `INTEGER` | Primary Key, Auto Increment |
| `username` | `TEXT` | Username login unik (Wajib) |
| `password` | `TEXT` | Password terenkripsi Hash Bcrypt (Wajib) |
| `nama` | `TEXT` | Nama lengkap dokter beserta gelar |
| `role` | `TEXT` | `CHECK(role IN ('dokter', 'admin', 'petugas'))`, default `'dokter'` |
| `sip` | `TEXT` | Nomor Surat Izin Praktik (SIP) dokter |
| `created_at` | `DATETIME` | Default: `CURRENT_TIMESTAMP` |

---

## 🔒 Sistem Keamanan & Autentikasi Dokter

Untuk menjaga privasi medis dan mencegah pasien mengakses dashboard pemanggilan serta catatan rekam medis, sistem menerapkan **Role-Based Access Control (RBAC)** dan **JWT Token Authentication**:

1. **Rute Publik (Pasien & Monitor TV)**:
   - `POST /api/antrean` : Pendaftaran mandiri pasien untuk mengambil nomor antrean (tanpa login).
   - `GET /api/antrean/aktif` : Layar monitor TV ruang tunggu (tanpa login).
   - `POST /api/auth/login` : Endpoint autentikasi dokter/petugas.

2. **Rute Terproteksi Khusus Dokter & Petugas Medis**:
   - `GET /api/antrean` : Melihat seluruh antrean aktif (menunggu & dipanggil).
   - `PUT /api/antrean/:id/panggil` : Pemanggilan nomor antrean pasien ke layar TV.
   - `PUT /api/antrean/:id/selesai` : Menyelesaikan pemeriksaan dan mengisi diagnosa/resep.
   - `PUT /api/antrean/:id` : Mengubah data antrean aktif.
   - `DELETE /api/antrean/:id` : Membatalkan/menghapus antrean.
   - `GET /api/rekam-medis` : Melihat seluruh riwayat rekam medis pasien yang selesai diperiksa.
   - `PUT /api/rekam-medis/:id` : Memperbarui diagnosa & resep pasien.
   - `DELETE /api/rekam-medis/:id` : Menghapus data rekam medis.

3. **Frontend Navigation Guard**:
   - Pasien yang mencoba mengakses rute `/dashboard` atau `/rekam-medis` secara langsung akan otomatis diblokir dan dialihkan ke `/login?unauthorized=1` dengan banner peringatan.
   - Axios Request Interceptor otomatis menyisipkan token `Bearer <JWT>` pada setiap panggilan API dokter.

### 🔑 Kredensial Akun Default Dokter
| Akun | Username | Password | Keterangan |
|---|---|---|---|
| Dokter 1 | `dokter` | `password123` | dr. Budi Santoso, Sp.PD |
| Dokter 2 | `dr.siti` | `password123` | dr. Siti Aminah, Sp.A |



