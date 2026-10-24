<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { 
  FileCheck2, 
  Search, 
  RefreshCw, 
  Clock, 
  Printer, 
  Edit3, 
  AlertCircle, 
  CheckCircle2, 
  Activity, 
  FileText, 
  X, 
  Trash2, 
  AlertTriangle 
} from 'lucide-vue-next';
import { currentUser } from '../utils/auth';

// State
const records = ref([]);

const loading = ref(false);
const searchQuery = ref('');
const notification = ref(null);

// Modal Edit / Detail Rekam Medis
const isModalOpen = ref(false);
const selectedRecord = ref(null);
const editForm = ref({
  diagnosa: '',
  tindakan_resep: ''
});
const isSaving = ref(false);

// Modal Print Rekam Medis
const isPrintModalOpen = ref(false);
const printData = ref(null);

// Modal Hapus Rekam Medis (Delete)
const deleteModal = ref({
  isOpen: false,
  record: null,
  isDeleting: false
});

const openDeleteModal = (record) => {
  deleteModal.value = {
    isOpen: true,
    record,
    isDeleting: false
  };
};

const confirmDelete = async () => {
  if (!deleteModal.value.record) return;
  deleteModal.value.isDeleting = true;
  try {
    const response = await axios.delete(`/api/rekam-medis/${deleteModal.value.record.id}`);
    if (response.data.success) {
      showToast('Data rekam medis berhasil dihapus.');
      deleteModal.value.isOpen = false;
      await fetchRecords();
    }
  } catch (err) {
    console.error('Gagal menghapus rekam medis:', err);
    showToast(err.response?.data?.message || 'Gagal menghapus rekam medis.', 'error');
  } finally {
    deleteModal.value.isDeleting = false;
  }
};

const showToast = (message, type = 'success') => {
  notification.value = { message, type };
  setTimeout(() => {
    notification.value = null;
  }, 3500);
};

// Ambil data pasien yang sudah selesai diperiksa
const fetchRecords = async () => {
  loading.value = true;
  try {
    const response = await axios.get('/api/rekam-medis');
    if (response.data.success) {
      records.value = response.data.data;
    }
  } catch (error) {
    console.error('Gagal mengambil rekam medis:', error);
    showToast('Gagal memuat daftar rekam medis.', 'error');
  } finally {
    loading.value = false;
  }
};

// Buka modal untuk melihat/mengedit diagnosa
const openEditModal = (record) => {
  selectedRecord.value = record;
  editForm.value = {
    diagnosa: record.diagnosa || '',
    tindakan_resep: record.tindakan_resep || ''
  };
  isModalOpen.value = true;
};

// Simpan perubahan diagnosa / resep
const handleSaveEdit = async () => {
  if (!selectedRecord.value) return;
  isSaving.value = true;

  try {
    const response = await axios.put(`/api/rekam-medis/${selectedRecord.value.id}`, {
      diagnosa: editForm.value.diagnosa.trim(),
      tindakan_resep: editForm.value.tindakan_resep.trim()
    });

    if (response.data.success) {
      showToast('Rekam medis berhasil diperbarui.');
      isModalOpen.value = false;
      await fetchRecords();
    }
  } catch (error) {
    console.error('Gagal memperbarui rekam medis:', error);
    showToast(error.response?.data?.message || 'Gagal menyimpan perubahan.', 'error');
  } finally {
    isSaving.value = false;
  }
};

// Buka modal cetak lembar resume medis
const openPrintModal = (record) => {
  printData.value = record;
  isPrintModalOpen.value = true;
};

const handlePrint = () => {
  window.print();
};

// Filter data berdasarkan search
const filteredRecords = computed(() => {
  if (!searchQuery.value.trim()) return records.value;
  const q = searchQuery.value.toLowerCase();
  return records.value.filter(item => 
    item.nomor_antrean.toLowerCase().includes(q) ||
    item.nama.toLowerCase().includes(q) ||
    item.nomor_identitas.toLowerCase().includes(q) ||
    (item.diagnosa && item.diagnosa.toLowerCase().includes(q)) ||
    (item.keluhan_utama && item.keluhan_utama.toLowerCase().includes(q))
  );
});

onMounted(() => {
  fetchRecords();
});
</script>

<template>
  <div class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
    <!-- Toast Notifikasi -->
    <div 
      v-if="notification"
      class="fixed top-20 right-6 z-50 flex items-center p-4 rounded-xl shadow-lg border transition-all text-sm font-semibold space-x-3"
      :class="notification.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-800'"
    >
      <AlertCircle v-if="notification.type === 'error'" class="w-5 h-5 flex-shrink-0" />
      <CheckCircle2 v-else class="w-5 h-5 flex-shrink-0 text-emerald-600" />
      <span>{{ notification.message }}</span>
    </div>

    <!-- Header Section -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <div class="inline-flex items-center px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
          <FileCheck2 class="w-4 h-4 mr-1.5" />
          Arsip & Rekam Medis Pasien
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <h2 class="text-2xl font-bold text-slate-900 tracking-tight">
            Riwayat Pasien Selesai Periksa
          </h2>
          <span v-if="currentUser" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs">
            🩺 {{ currentUser.nama }}
          </span>
        </div>
        <p class="text-sm text-slate-500 mt-1">
          Daftar seluruh pasien yang telah selesai menjalani pemeriksaan medis beserta diagnosa dan resepnya.
        </p>
      </div>


      <div class="flex items-center space-x-3">
        <!-- Input Search -->
        <div class="relative">
          <Search class="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input 
            v-model="searchQuery"
            type="text"
            placeholder="Cari pasien / NIK / diagnosa..."
            class="pl-9 pr-4 py-2 w-64 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
        </div>

        <!-- Tombol Refresh -->
        <button
          @click="fetchRecords"
          :disabled="loading"
          class="inline-flex items-center px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold shadow-sm transition disabled:opacity-50"
        >
          <RefreshCw class="w-4 h-4 mr-2" :class="{ 'animate-spin': loading }" />
          <span>Refresh</span>
        </button>
      </div>
    </div>

    <!-- KPI Statistik -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center space-x-4">
        <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <CheckCircle2 class="w-6 h-6" />
        </div>
        <div>
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Pasien Selesai</p>
          <p class="text-2xl font-bold text-slate-900">{{ records.length }} Pasien</p>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center space-x-4">
        <div class="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <Activity class="w-6 h-6" />
        </div>
        <div>
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Telah Memiliki Diagnosa</p>
          <p class="text-2xl font-bold text-slate-900">
            {{ records.filter(r => r.diagnosa && r.diagnosa.trim().length > 0).length }} Pasien
          </p>
        </div>
      </div>
    </div>

    <!-- Tabel Rekam Medis Pasien -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-slate-800 text-base">Daftar Pasien Berstatus Selesai</h3>
        <span class="text-xs text-slate-400 font-medium">Total: {{ filteredRecords.length }} Pasien</span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse" aria-label="Daftar Rekam Medis Pasien">
          <caption class="sr-only">Tabel Rekam Medis Pasien Berstatus Selesai</caption>
          <thead>
            <tr class="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <th class="px-6 py-3.5">No. Antrean</th>
              <th class="px-6 py-3.5">Pasien</th>
              <th class="px-6 py-3.5">Keluhan Awal</th>
              <th class="px-6 py-3.5">Diagnosa Dokter</th>
              <th class="px-6 py-3.5">Tindakan / Resep</th>
              <th class="px-6 py-3.5">Status</th>
              <th class="px-6 py-3.5 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-sm">
            <tr 
              v-for="item in filteredRecords" 
              :key="item.id"
              class="hover:bg-slate-50/70 transition-colors"
            >
              <!-- Nomor Antrean & Waktu -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="inline-flex items-center px-3 py-1 rounded-lg text-sm font-extrabold font-mono tracking-wider bg-slate-100 text-slate-800 mb-1">
                  {{ item.nomor_antrean }}
                </div>
                <div class="text-xs text-slate-400 flex items-center">
                  <Clock class="w-3 h-3 mr-1" />
                  {{ item.waktu_selesai || item.waktu_daftar }}
                </div>
              </td>

              <!-- Data Pasien -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="font-bold text-slate-900">{{ item.nama }}</div>
                <div class="text-xs text-slate-400 font-mono">NIK: {{ item.nomor_identitas }}</div>
              </td>

              <!-- Keluhan Awal -->
              <td class="px-6 py-4">
                <span class="text-slate-600 line-clamp-2 max-w-xs text-xs">
                  {{ item.keluhan_utama || '-' }}
                </span>
              </td>

              <!-- Diagnosa Dokter -->
              <td class="px-6 py-4">
                <div v-if="item.diagnosa" class="text-slate-800 font-semibold text-xs bg-slate-50 p-2 rounded-lg border border-slate-200/60 max-w-xs">
                  {{ item.diagnosa }}
                </div>
                <span v-else class="text-xs text-slate-400 italic">
                  Belum dicatat
                </span>
              </td>

              <!-- Tindakan / Resep -->
              <td class="px-6 py-4">
                <div v-if="item.tindakan_resep" class="text-slate-700 text-xs bg-emerald-50/50 p-2 rounded-lg border border-emerald-100 max-w-xs">
                  {{ item.tindakan_resep }}
                </div>
                <span v-else class="text-xs text-slate-400 italic">
                  -
                </span>
              </td>

              <!-- Status -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 class="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Selesai
                </span>
              </td>

              <!-- Aksi -->
              <td class="px-6 py-4 whitespace-nowrap text-center">
                <div class="inline-flex items-center space-x-1.5">
                  <button
                    @click="openEditModal(item)"
                    class="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-emerald-600 hover:bg-slate-50 transition"
                    title="Edit Diagnosa & Resep"
                  >
                    <Edit3 class="w-4 h-4" />
                  </button>
                  <button
                    @click="openPrintModal(item)"
                    class="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition"
                    title="Cetak Resume Medis"
                  >
                    <Printer class="w-4 h-4" />
                  </button>
                  <button
                    @click="openDeleteModal(item)"
                    class="p-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
                    title="Hapus Rekam Medis"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>

            <!-- Jika tidak ada data -->
            <tr v-if="filteredRecords.length === 0">
              <td colspan="7" class="px-6 py-12 text-center text-slate-400">
                <FileCheck2 class="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p class="font-semibold text-slate-600">Belum ada pasien yang berstatus selesai</p>
                <p class="text-xs text-slate-400 mt-1">
                  Pasien yang ditandai "Selesai" dari Dashboard Dokter akan otomatis masuk ke rekam medis ini.
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL EDIT DIAGNOSA & RESEP -->
    <div 
      v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn"
    >
      <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center space-x-2">
            <div class="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <FileText class="w-5 h-5" />
            </div>
            <div>
              <h3 class="font-bold text-slate-900">Catatan Rekam Medis</h3>
              <p class="text-xs text-slate-400">
                Pasien: <span class="font-bold text-slate-700">{{ selectedRecord?.nama }}</span> ({{ selectedRecord?.nomor_antrean }})
              </p>
            </div>
          </div>
          <button 
            @click="isModalOpen = false" 
            class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="space-y-4">
          <!-- Info Keluhan Awal -->
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <span class="text-slate-400 font-semibold block mb-0.5">Keluhan Awal Pasien:</span>
            <span class="text-slate-700">{{ selectedRecord?.keluhan_utama || 'Tidak ada catatan keluhan.' }}</span>
          </div>

          <!-- Input Diagnosa -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Diagnosa Dokter
            </label>
            <textarea
              v-model="editForm.diagnosa"
              rows="3"
              placeholder="Contoh: ISPA / Pharyngitis Akut, Demam Tifoid..."
              class="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition resize-none"
            ></textarea>
          </div>

          <!-- Input Resep / Tindakan -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tindakan Medis & Resep Obat
            </label>
            <textarea
              v-model="editForm.tindakan_resep"
              rows="3"
              placeholder="Contoh: Paracetamol 500mg 3x1 setelah makan, istirahat cukup..."
              class="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition resize-none"
            ></textarea>
          </div>
        </div>

        <div class="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
          <button
            @click="isModalOpen = false"
            type="button"
            class="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            @click="handleSaveEdit"
            :disabled="isSaving"
            type="button"
            class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-200 transition disabled:opacity-50"
          >
            {{ isSaving ? 'Menyimpan...' : 'Simpan Perubahan' }}
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL CETAK RESUME MEDIS -->
    <div 
      v-if="isPrintModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
    >
      <div class="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl space-y-6">
        <!-- Header Dokumen Resume -->
        <div class="text-center border-b border-slate-200 pb-4">
          <h2 class="text-lg font-black tracking-wide text-slate-900 uppercase">PUSKESMAS / KLINIK SEHAT</h2>
          <p class="text-xs text-slate-500">Lembar Resume Rawat Jalan & Catatan Rekam Medis</p>
        </div>

        <!-- Rincian Resume -->
        <div class="space-y-3 text-sm">
          <div class="flex justify-between py-1 border-b border-slate-100">
            <span class="text-slate-500">Nomor Antrean:</span>
            <span class="font-bold font-mono">{{ printData?.nomor_antrean }}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-slate-100">
            <span class="text-slate-500">Nama Pasien:</span>
            <span class="font-bold">{{ printData?.nama }}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-slate-100">
            <span class="text-slate-500">NIK:</span>
            <span class="font-mono">{{ printData?.nomor_identitas }}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-slate-100">
            <span class="text-slate-500">Waktu Periksa:</span>
            <span>{{ printData?.waktu_selesai || printData?.waktu_daftar }}</span>
          </div>
          <div class="py-2 border-b border-slate-100">
            <span class="text-slate-500 block mb-1">Keluhan:</span>
            <span class="font-medium text-slate-800">{{ printData?.keluhan_utama || '-' }}</span>
          </div>
          <div class="py-2 border-b border-slate-100">
            <span class="text-slate-500 block mb-1">Diagnosa:</span>
            <span class="font-bold text-slate-900">{{ printData?.diagnosa || 'Pemeriksaan umum selesai.' }}</span>
          </div>
          <div class="py-2 border-b border-slate-100">
            <span class="text-slate-500 block mb-1">Tindakan / Resep Obat:</span>
            <span class="font-medium text-emerald-800">{{ printData?.tindakan_resep || '-' }}</span>
          </div>
        </div>

        <!-- Tombol Aksi -->
        <div class="flex justify-end space-x-3 pt-2">
          <button
            @click="isPrintModalOpen = false"
            class="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50"
          >
            Tutup
          </button>
          <button
            @click="handlePrint"
            class="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold inline-flex items-center hover:bg-slate-800"
          >
            <Printer class="w-4 h-4 mr-2" />
            Cetak Dokumen
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL KONFIRMASI HAPUS REKAM MEDIS (DELETE) -->
    <div 
      v-if="deleteModal.isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
    >
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
        <div class="flex items-center space-x-3 text-rose-600">
          <div class="p-2.5 rounded-xl bg-rose-50 border border-rose-100">
            <AlertTriangle class="w-6 h-6" />
          </div>
          <div>
            <h3 class="font-bold text-slate-900 text-base">Hapus Data Rekam Medis?</h3>
            <p class="text-xs text-slate-400">Data riwayat pasien ini akan dihapus secara permanen.</p>
          </div>
        </div>

        <p class="text-sm text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
          Apakah Anda yakin ingin menghapus rekam medis pasien 
          <span class="font-bold text-slate-900">{{ deleteModal.record?.nama }}</span> 
          (Nomor Antrean: <span class="font-mono font-bold text-slate-900">{{ deleteModal.record?.nomor_antrean }}</span>)?
        </p>

        <div class="flex items-center justify-end space-x-3 pt-2">
          <button
            @click="deleteModal.isOpen = false"
            type="button"
            class="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition"
          >
            Batal
          </button>
          <button
            @click="confirmDelete"
            :disabled="deleteModal.isDeleting"
            type="button"
            class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow-md shadow-rose-200 transition disabled:opacity-50 inline-flex items-center"
          >
            <Trash2 class="w-4 h-4 mr-1.5" />
            <span>{{ deleteModal.isDeleting ? 'Menghapus...' : 'Ya, Hapus Data' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
