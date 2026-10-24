<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import axios from 'axios';
import { 
  Users, 
  Megaphone, 
  CheckCircle, 
  Clock, 
  RefreshCw, 
  Search, 
  AlertCircle, 
  Stethoscope, 
  X, 
  Trash2, 
  Edit, 
  AlertTriangle 
} from 'lucide-vue-next';
import { currentUser } from '../utils/auth';

const queues = ref([]);

const loading = ref(false);
const actionLoading = ref({}); // Track loading per queue id
const searchQuery = ref('');
const notification = ref(null);

let refreshInterval = null;

// Tampilkan Toast Notifikasi
const showToast = (message, type = 'success') => {
  notification.value = { message, type };
  setTimeout(() => {
    notification.value = null;
  }, 3500);
};

// Ambil seluruh antrean aktif (menunggu & dipanggil)
const fetchQueues = async () => {
  loading.value = true;
  try {
    const response = await axios.get('/api/antrean');
    if (response.data.success) {
      queues.value = response.data.data;
    }
  } catch (error) {
    console.error('Gagal mengambil daftar antrean:', error);
    showToast('Gagal memuat daftar antrean.', 'error');
  } finally {
    loading.value = false;
  }
};

// Aksi: Panggil Pasien (PUT /api/antrean/:id/panggil)
const handleCall = async (id, nomorAntrean) => {
  actionLoading.value[id] = true;
  try {
    const response = await axios.put(`/api/antrean/${id}/panggil`);
    if (response.data.success) {
      showToast(`Antrean ${nomorAntrean} berhasil dipanggil ke layar TV.`);
      await fetchQueues();
    }
  } catch (error) {
    console.error('Gagal memanggil antrean:', error);
    showToast(error.response?.data?.message || 'Gagal memanggil antrean.', 'error');
  } finally {
    actionLoading.value[id] = false;
  }
};

// Modal Selesai Periksa & Rekam Medis
const finishModal = ref({
  isOpen: false,
  queue: null,
  diagnosa: '',
  tindakan_resep: '',
  isSaving: false
});

const openFinishModal = (item) => {
  finishModal.value = {
    isOpen: true,
    queue: item,
    diagnosa: '',
    tindakan_resep: '',
    isSaving: false
  };
};

const confirmFinish = async (withNotes = true) => {
  if (!finishModal.value.queue) return;
  const item = finishModal.value.queue;
  finishModal.value.isSaving = true;

  try {
    const payload = withNotes ? {
      diagnosa: finishModal.value.diagnosa.trim(),
      tindakan_resep: finishModal.value.tindakan_resep.trim()
    } : {};

    const response = await axios.put(`/api/antrean/${item.id}/selesai`, payload);
    if (response.data.success) {
      showToast(`Pemeriksaan antrean ${item.nomor_antrean} selesai dan tersimpan ke Rekam Medis.`);
      finishModal.value.isOpen = false;
      await fetchQueues();
    }
  } catch (error) {
    console.error('Gagal menyelesaikan antrean:', error);
    showToast(error.response?.data?.message || 'Gagal menyelesaikan antrean.', 'error');
  } finally {
    finishModal.value.isSaving = false;
  }
};

// Modal Edit Data Antrean / Pasien
const editModal = ref({
  isOpen: false,
  queue: null,
  nama: '',
  nomor_identitas: '',
  keluhan: '',
  isSaving: false
});

const openEditModal = (item) => {
  editModal.value = {
    isOpen: true,
    queue: item,
    nama: item.nama,
    nomor_identitas: item.nomor_identitas,
    keluhan: item.keluhan_utama || '',
    isSaving: false
  };
};

const confirmEdit = async () => {
  if (!editModal.value.queue) return;
  if (!editModal.value.nama.trim() || !editModal.value.nomor_identitas.trim()) {
    showToast('Nama dan NIK wajib diisi.', 'error');
    return;
  }

  const item = editModal.value.queue;
  editModal.value.isSaving = true;
  try {
    const response = await axios.put(`/api/antrean/${item.id}`, {
      nama: editModal.value.nama.trim(),
      nomor_identitas: editModal.value.nomor_identitas.trim(),
      keluhan: editModal.value.keluhan.trim()
    });
    if (response.data.success) {
      showToast(`Data antrean ${item.nomor_antrean} berhasil diperbarui.`);
      editModal.value.isOpen = false;
      await fetchQueues();
    }
  } catch (error) {
    console.error('Gagal memperbarui antrean:', error);
    showToast(error.response?.data?.message || 'Gagal memperbarui data antrean.', 'error');
  } finally {
    editModal.value.isSaving = false;
  }
};

// Modal Hapus Antrean (Delete)
const deleteModal = ref({
  isOpen: false,
  queue: null,
  isDeleting: false
});

const openDeleteModal = (item) => {
  deleteModal.value = {
    isOpen: true,
    queue: item,
    isDeleting: false
  };
};

const confirmDelete = async () => {
  if (!deleteModal.value.queue) return;
  const item = deleteModal.value.queue;
  deleteModal.value.isDeleting = true;

  try {
    const response = await axios.delete(`/api/antrean/${item.id}`);
    if (response.data.success) {
      showToast(`Antrean ${item.nomor_antrean} berhasil dihapus.`);
      deleteModal.value.isOpen = false;
      await fetchQueues();
    }
  } catch (error) {
    console.error('Gagal menghapus antrean:', error);
    showToast(error.response?.data?.message || 'Gagal menghapus antrean.', 'error');
  } finally {
    deleteModal.value.isDeleting = false;
  }
};

// Filter Antrean Berdasarkan Pencarian
const filteredQueues = computed(() => {
  if (!searchQuery.value.trim()) return queues.value;
  const q = searchQuery.value.toLowerCase();
  return queues.value.filter(item => 
    item.nomor_antrean.toLowerCase().includes(q) ||
    item.nama.toLowerCase().includes(q) ||
    (item.keluhan_utama && item.keluhan_utama.toLowerCase().includes(q))
  );
});

// Metrik Ringkasan
const totalAktif = computed(() => queues.value.length);
const totalDipanggil = computed(() => queues.value.filter(q => q.status === 'dipanggil').length);
const totalMenunggu = computed(() => queues.value.filter(q => q.status === 'menunggu').length);

onMounted(() => {
  fetchQueues();
  // Auto refresh setiap 5 detik agar dokter mendapatkan update real-time pasien yang baru daftar
  refreshInterval = setInterval(fetchQueues, 5000);
});

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval);
});
</script>

<template>
  <div class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
    <!-- Toast Notification -->
    <div 
      v-if="notification"
      class="fixed top-20 right-6 z-50 flex items-center p-4 rounded-xl shadow-lg border transition-all text-sm font-semibold space-x-3"
      :class="notification.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-800'"
    >
      <AlertCircle v-if="notification.type === 'error'" class="w-5 h-5 flex-shrink-0" />
      <CheckCircle v-else class="w-5 h-5 flex-shrink-0 text-emerald-600" />
      <span>{{ notification.message }}</span>
    </div>

    <!-- Header & Action Bar -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <div class="flex flex-wrap items-center gap-2">
          <h2 class="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Dashboard Pemanggilan Dokter</span>
          </h2>
          <span v-if="currentUser" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs">
            🩺 {{ currentUser.nama }}
          </span>
        </div>
        <p class="text-sm text-slate-500 mt-1">
          Kelola antrean dan rekam medis pasien di ruang periksa dokter.
        </p>
      </div>


      <div class="flex items-center space-x-3">
        <!-- Input Search -->
        <div class="relative">
          <Search class="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input 
            v-model="searchQuery"
            type="text"
            placeholder="Cari nomor / nama..."
            class="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
        </div>

        <!-- Tombol Refresh Manual -->
        <button
          @click="fetchQueues"
          :disabled="loading"
          class="inline-flex items-center px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold shadow-sm transition disabled:opacity-50"
          title="Segarkan Data"
        >
          <RefreshCw class="w-4 h-4 mr-2" :class="{ 'animate-spin': loading }" />
          <span>Refresh</span>
        </button>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center space-x-4">
        <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <Users class="w-6 h-6" />
        </div>
        <div>
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Antrean Aktif</p>
          <p class="text-2xl font-bold text-slate-900">{{ totalAktif }} Pasien</p>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center space-x-4">
        <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <Megaphone class="w-6 h-6" />
        </div>
        <div>
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sedang Dipanggil</p>
          <p class="text-2xl font-bold text-emerald-600">{{ totalDipanggil }} Pasien</p>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center space-x-4">
        <div class="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <Clock class="w-6 h-6" />
        </div>
        <div>
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dalam Antrean (Menunggu)</p>
          <p class="text-2xl font-bold text-amber-600">{{ totalMenunggu }} Pasien</p>
        </div>
      </div>
    </div>

    <!-- Tabel Antrean Pasien -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-slate-800 text-base">Daftar Antrean Pasien</h3>
        <span class="text-xs text-slate-400 font-medium">Auto-refresh setiap 5 detik</span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse" aria-label="Daftar Antrean Pasien">
          <caption class="sr-only">Tabel Daftar Antrean Pasien Puskesmas</caption>
          <thead>
            <tr class="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <th class="px-6 py-3.5">Nomor Antrean</th>
              <th class="px-6 py-3.5">Nama Pasien</th>
              <th class="px-6 py-3.5">Keluhan</th>
              <th class="px-6 py-3.5">Status</th>
              <th class="px-6 py-3.5 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-sm">
            <tr 
              v-for="item in filteredQueues" 
              :key="item.id"
              class="hover:bg-slate-50/70 transition-colors"
              :class="item.status === 'dipanggil' ? 'bg-emerald-50/30' : ''"
            >
              <!-- Kolom: Nomor Antrean -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-3 py-1 rounded-lg text-base font-extrabold font-mono tracking-wider"
                  :class="item.status === 'dipanggil' ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200' : 'bg-slate-100 text-slate-800'"
                >
                  {{ item.nomor_antrean }}
                </span>
              </td>

              <!-- Kolom: Nama -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="font-bold text-slate-900">{{ item.nama }}</div>
                <div class="text-xs text-slate-400 font-mono">NIK: {{ item.nomor_identitas }}</div>
              </td>

              <!-- Kolom: Keluhan -->
              <td class="px-6 py-4">
                <span class="text-slate-600 line-clamp-2 max-w-xs">
                  {{ item.keluhan_utama || '-' }}
                </span>
              </td>

              <!-- Kolom: Status -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span 
                  v-if="item.status === 'dipanggil'"
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 animate-pulse"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5"></span>
                  Dipanggil
                </span>
                <span 
                  v-else
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-600 mr-1.5"></span>
                  Menunggu
                </span>
              </td>

              <!-- Kolom: Aksi (Panggil, Selesai, Edit, Hapus) -->
              <td class="px-6 py-4 whitespace-nowrap text-center">
                <div class="inline-flex items-center space-x-1.5">
                  <!-- Tombol Hijau: Panggil -->
                  <button
                    @click="handleCall(item.id, item.nomor_antrean)"
                    :disabled="actionLoading[item.id]"
                    class="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm transition disabled:opacity-50"
                    title="Panggil pasien ini ke layar TV"
                  >
                    <Megaphone class="w-3.5 h-3.5 mr-1" />
                    <span>Panggil</span>
                  </button>

                  <!-- Tombol Abu-abu: Selesai -->
                  <button
                    @click="openFinishModal(item)"
                    :disabled="actionLoading[item.id]"
                    class="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-700 transition disabled:opacity-50"
                    title="Tandai pasien telah selesai diperiksa"
                  >
                    <CheckCircle class="w-3.5 h-3.5 mr-1 text-slate-500" />
                    <span>Selesai</span>
                  </button>

                  <!-- Tombol Edit: Edit Data Pasien -->
                  <button
                    @click="openEditModal(item)"
                    class="inline-flex items-center p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition"
                    title="Edit Data Pasien / Antrean"
                  >
                    <Edit class="w-3.5 h-3.5" />
                  </button>

                  <!-- Tombol Merah: Hapus Antrean -->
                  <button
                    @click="openDeleteModal(item)"
                    class="inline-flex items-center p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
                    title="Hapus / Batalkan Antrean"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>

            <!-- Jika tidak ada antrean -->
            <tr v-if="filteredQueues.length === 0">
              <td colspan="5" class="px-6 py-12 text-center text-slate-400">
                <Users class="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p class="font-semibold text-slate-600">Tidak ada antrean aktif saat ini</p>
                <p class="text-xs text-slate-400 mt-1">
                  Pasien baru yang mendaftar akan otomatis muncul di sini.
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL SELESAIKAN PEMERIKSAAN & CATAT REKAM MEDIS -->
    <div 
      v-if="finishModal.isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
    >
      <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center space-x-2">
            <div class="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Stethoscope class="w-5 h-5" />
            </div>
            <div>
              <h3 class="font-bold text-slate-900">Selesaikan Pemeriksaan</h3>
              <p class="text-xs text-slate-500">
                Pasien: <span class="font-bold text-slate-800">{{ finishModal.queue?.nama }}</span> ({{ finishModal.queue?.nomor_antrean }})
              </p>
            </div>
          </div>
          <button 
            @click="finishModal.isOpen = false" 
            class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Keluhan Awal -->
        <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
          <span class="text-slate-400 font-semibold block mb-0.5">Keluhan Awal:</span>
          <span class="text-slate-700">{{ finishModal.queue?.keluhan_utama || 'Tidak ada keluhan tertulis.' }}</span>
        </div>

        <!-- Input Diagnosa -->
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Diagnosa Dokter (Opsional)
          </label>
          <textarea
            v-model="finishModal.diagnosa"
            rows="2"
            placeholder="Contoh: Faringitis Akut / ISPA..."
            class="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition resize-none"
          ></textarea>
        </div>

        <!-- Input Tindakan / Resep -->
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Tindakan & Resep Obat (Opsional)
          </label>
          <textarea
            v-model="finishModal.tindakan_resep"
            rows="2"
            placeholder="Contoh: Paracetamol 500mg 3x1 tablet, Amoxicillin 500mg..."
            class="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition resize-none"
          ></textarea>
        </div>

        <!-- Aksi Modal -->
        <div class="flex items-center justify-between pt-3 border-t border-slate-100">
          <button
            @click="finishModal.isOpen = false"
            type="button"
            class="px-4 py-2 rounded-xl text-slate-600 text-sm font-semibold hover:bg-slate-100 transition"
          >
            Batal
          </button>
          
          <div class="flex items-center space-x-2">
            <button
              @click="confirmFinish(false)"
              :disabled="finishModal.isSaving"
              type="button"
              class="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
            >
              Selesai Tanpa Catatan
            </button>
            <button
              @click="confirmFinish(true)"
              :disabled="finishModal.isSaving"
              type="button"
              class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 transition disabled:opacity-50"
            >
              {{ finishModal.isSaving ? 'Menyimpan...' : 'Simpan ke Rekam Medis' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL EDIT DATA PASIEN / ANTREAN -->
    <div 
      v-if="editModal.isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
    >
      <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center space-x-2">
            <div class="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Edit class="w-5 h-5" />
            </div>
            <div>
              <h3 class="font-bold text-slate-900">Edit Data Pasien</h3>
              <p class="text-xs text-slate-500">
                Antrean: <span class="font-bold font-mono text-slate-800">{{ editModal.queue?.nomor_antrean }}</span>
              </p>
            </div>
          </div>
          <button 
            @click="editModal.isOpen = false" 
            class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nama Lengkap Pasien <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="editModal.nama"
              type="text"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              required
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nomor Identitas (NIK) <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="editModal.nomor_identitas"
              type="text"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              required
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Keluhan Pasien
            </label>
            <textarea
              v-model="editModal.keluhan"
              rows="3"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
            ></textarea>
          </div>
        </div>

        <div class="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
          <button
            @click="editModal.isOpen = false"
            type="button"
            class="px-4 py-2 rounded-xl text-slate-600 text-sm font-semibold hover:bg-slate-100 transition"
          >
            Batal
          </button>
          <button
            @click="confirmEdit"
            :disabled="editModal.isSaving"
            type="button"
            class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-200 transition disabled:opacity-50"
          >
            {{ editModal.isSaving ? 'Menyimpan...' : 'Simpan Perubahan' }}
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL KONFIRMASI HAPUS ANTREAN (DELETE) -->
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
            <h3 class="font-bold text-slate-900 text-base">Hapus Antrean Pasien?</h3>
            <p class="text-xs text-slate-400">Tindakan ini tidak dapat dibatalkan.</p>
          </div>
        </div>

        <p class="text-sm text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
          Apakah Anda yakin ingin membatalkan dan menghapus nomor antrean 
          <span class="font-bold font-mono text-slate-900">{{ deleteModal.queue?.nomor_antrean }}</span> 
          atas nama <span class="font-bold text-slate-900">{{ deleteModal.queue?.nama }}</span>?
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
            <span>{{ deleteModal.isDeleting ? 'Menghapus...' : 'Ya, Hapus Antrean' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
