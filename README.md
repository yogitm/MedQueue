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

---

## 📡 Dokumentasi REST API

Semua response dikembalikan dalam format murni JSON:

### 1. Pendaftaran Antrean Baru
- **Endpoint**: `POST /api/antrean`
- **Request Body**:
  ```json
  {
    "nama": "Budi Santoso",
    "nomor_identitas": "3201021234560001",
    "keluhan": "Demam tinggi dan sakit tenggorokan"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "message": "Nomor antrean berhasil didaftarkan.",
    "data": {
      "id": 1,
      "nomor_antrean": "A-001",
      "status": "menunggu",
      "waktu_daftar": "2026-10-21 08:30:00",
      "patient_id": 1,
      "nama": "Budi Santoso",
      "nomor_identitas": "3201021234560001",
      "keluhan_utama": "Demam tinggi dan sakit tenggorokan"
    }
  }
  ```

### 2. Ambil 1 Antrean Aktif (Layar TV Ruang Tunggu)
- **Endpoint**: `GET /api/antrean/aktif`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "nomor_antrean": "A-001",
      "status": "dipanggil",
      "nama": "Budi Santoso"
    },
    "message": "Antrean aktif berhasil diambil."
  }
  ```

### 3. Ambil Seluruh Daftar Antrean Hari Ini (Dashboard Dokter)
- **Endpoint**: `GET /api/antrean`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "count": 2,
    "data": [
      {
        "id": 1,
        "nomor_antrean": "A-001",
        "status": "dipanggil",
        "nama": "Budi Santoso",
        "nomor_identitas": "3201021234560001",
        "keluhan_utama": "Demam tinggi"
      },
      {
        "id": 2,
        "nomor_antrean": "A-002",
        "status": "menunggu",
        "nama": "Siti Aminah",
        "nomor_identitas": "3201029876540002",
        "keluhan_utama": "Pusing berputar"
      }
    ]
  }
  ```

### 4. Panggil Antrean ke Layar TV
- **Endpoint**: `PUT /api/antrean/:id/panggil`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Antrean A-001 berhasil dipanggil.",
    "data": { "id": 1, "nomor_antrean": "A-001", "status": "dipanggil" }
  }
  ```

### 5. Selesaikan Pemeriksaan Antrean & Catat Rekam Medis
- **Endpoint**: `PUT /api/antrean/:id/selesai`
- **Request Body (Opsional)**:
  ```json
  {
    "diagnosa": "Faringitis Akut (ISPA)",
    "tindakan_resep": "Paracetamol 500mg 3x1, Amoxicillin 500mg 3x1, istirahat cukup"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Antrean A-001 telah selesai diperiksa. Rekam medis tersimpan."
  }
  ```

### 6. Ambil Seluruh Data Rekam Medis Pasien Selesai
- **Endpoint**: `GET /api/rekam-medis`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "count": 1,
    "data": [
      {
        "id": 1,
        "nomor_antrean": "A-001",
        "status": "selesai",
        "diagnosa": "Faringitis Akut (ISPA)",
        "tindakan_resep": "Paracetamol 500mg 3x1",
        "waktu_daftar": "2026-10-21 08:30:00",
        "waktu_selesai": "2026-10-21 08:45:00",
        "nama": "Budi Santoso",
        "nomor_identitas": "3201021234560001",
        "keluhan_utama": "Demam dan sakit tenggorokan"
      }
    ]
  }
  ```

### 7. Perbarui Data Pasien / Antrean Aktif (CRUD: Update)
- **Endpoint**: `PUT /api/antrean/:id`
- **Request Body**:
  ```json
  {
    "nama": "Budi Santoso (Update)",
    "nomor_identitas": "3201021234560001",
    "keluhan": "Demam tinggi, batuk berdahak"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Data antrean A-001 berhasil diperbarui.",
    "data": { ... }
  }
  ```

### 8. Hapus Antrean Aktif (CRUD: Delete)
- **Endpoint**: `DELETE /api/antrean/:id`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Antrean A-001 berhasil dihapus dari sistem."
  }
  ```

### 9. Perbarui Diagnosa / Resep Rekam Medis (CRUD: Update)
- **Endpoint**: `PUT /api/rekam-medis/:id`
- **Request Body**:
  ```json
  {
    "diagnosa": "Update Diagnosa",
    "tindakan_resep": "Update Resep"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Rekam medis berhasil diperbarui."
  }
  ```

### 10. Hapus Catatan Rekam Medis (CRUD: Delete)
- **Endpoint**: `DELETE /api/rekam-medis/:id`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Rekam medis antrean A-001 berhasil dihapus."
  }
  ```

---

## 💻 Panduan Menjalankan Aplikasi Secara Lokal

### Prasyarat
- Pastikan telah terinstal **Node.js** (versi 18 ke atas disarankan) dan **npm**.
  ```bash
  node -v
  npm -v
  ```

### Langkah 1: Menjalankan Backend API

1. Buka terminal dan masuk ke folder `backend`:
   ```bash
   cd backend
   ```
2. Instal dependensi:
   ```bash
   npm install
   ```
3. Jalankan server:
   ```bash
   npm run dev
   # Atau: npm start
   ```
4. Server backend akan aktif di: **`http://localhost:5000`**  
   *(Database SQLite `database.sqlite` dan tabel-tabel akan dibuat secara otomatis saat pertama kali dijalankan).*

### Langkah 2: Menjalankan Frontend Vue.js

1. Buka tab/jendela terminal baru dan masuk ke folder `frontend`:
   ```bash
   cd frontend
   ```
2. Instal dependensi:
   ```bash
   npm install
   ```
3. Jalankan server development:
   ```bash
   npm run dev
   ```
4. Aplikasi frontend akan aktif di: **`http://localhost:5173`**

---

## 🌐 Navigasi Halaman Aplikasi

Buka browser dan akses URL berikut:

| Rute | Pengguna | Fungsi |
|---|---|---|
| **`http://localhost:5173/daftar`** | Pasien / Resepsionis | Formulir pendaftaran mandiri pasien dan mencetak struk nomor antrean. |
| **`http://localhost:5173/layar-tunggu`** | Publik / TV Ruang Tunggu | Layar penuh kontras tinggi berlatar gelap yang menampilkan nomor antrean raksasa yang sedang dipanggil beserta suara panggilan otomatis. |
| **`http://localhost:5173/dashboard`** | Dokter / Perawat | Dashboard manajemen antrean dengan tabel interaktif, filter pencarian, tombol hijau **Panggil**, dan tombol abu-abu **Selesai** (disertai modal diagnosa). |
| **`http://localhost:5173/rekam-medis`** | Dokter / Staf Medis | Halaman rekam medis berisi daftar pasien yang sudah selesai diperiksa, catatan diagnosa dokter, resep obat, serta fitur cetak resume medis. |

---

## 🧪 Menjalankan Automated Testing

Backend telah dilengkapi dengan pengujian otomatis menggunakan test runner bawaan Node.js:

```bash
cd backend
npm test
```

Hasil pengujian memvalidasi:
- Konektivitas dan kesehatan server API
- Validasi input pendaftaran antrean
- Pembuatan antrean baru dengan penomoran berurutan otomatis (A-001, A-002, dst.)
- Perubahan status antrean (dipanggil dan selesai)

---

## 🔄 Pipeline CI/CD (Jenkins)

File `Jenkinsfile` telah disediakan di root repositori dengan stage berikut:
1. **Environment Inspection**: Verifikasi runtime Node.js dan npm pada node Jenkins.
2. **Install Backend Dependencies**: Mengunduh paket `better-sqlite3`, `express`, dll.
3. **Backend Testing**: Menjalankan automated test suite `npm test`.
4. **Install Frontend Dependencies**: Mengunduh dependensi Vue 3 & Tailwind CSS.
5. **Frontend Production Build**: Mengompilasi kode frontend ke folder `frontend/dist/`.
6. **Deployment / Artifact Archiving**: Mengarsipkan artefak build untuk siap disebarkan ke web server (Nginx/Apache).
