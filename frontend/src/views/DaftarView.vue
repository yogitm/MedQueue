<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { User, CreditCard, FileText, CheckCircle2, Printer, RefreshCw, AlertCircle } from 'lucide-vue-next';

// State Form Pasien
const form = ref({
  nama: '',
  nomor_identitas: '',
  keluhan: ''
});

const loading = ref(false);
const errorMessage = ref('');
const registeredQueue = ref(null); // Menyimpan response sukses untuk cetak kartu antrean

// Handle Submit Form Pendaftaran
const handleSubmit = async () => {
  errorMessage.value = '';
  
  if (!form.value.nama.trim() || !form.value.nomor_identitas.trim()) {
    errorMessage.value = 'Nama lengkap dan NIK/Nomor Identitas wajib diisi.';
    return;
  }

  loading.value = true;
  try {
    const response = await axios.post('/api/antrean', {
      nama: form.value.nama.trim(),
      nomor_identitas: form.value.nomor_identitas.trim(),
      keluhan: form.value.keluhan.trim()
    });

    if (response.data.success) {
      registeredQueue.value = response.data.data;
    }
  } catch (err) {
    console.error('Pendaftaran gagal:', err);
    errorMessage.value = err.response?.data?.message || 'Terjadi kesalahan saat mendaftarkan antrean. Silakan coba lagi.';
  } finally {
    loading.value = false;
  }
};

// Reset untuk pendaftaran berikutnya
const resetForm = () => {
  form.value = {
    nama: '',
    nomor_identitas: '',
    keluhan: ''
  };
  registeredQueue.value = null;
  errorMessage.value = '';
};

// Cetak Struk Antrean
const printTicket = () => {
  window.print();
};
</script>

<template>
  <div class="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
    <div class="w-full max-w-lg">

      <!-- TAMPILAN 1: MODAL/KARTU STRUK NOMOR ANTREAN (Setelah Berhasil Mendaftar) -->
      <div 
        v-if="registeredQueue" 
        class="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden text-center transition-all animate-fadeIn"
      >
        <div class="bg-emerald-600 px-6 py-6 text-white">
          <div class="inline-flex p-3 bg-emerald-500/30 rounded-full mb-3">
            <CheckCircle2 class="w-10 h-10 text-white" />
          </div>
          <h2 class="text-xl font-bold tracking-tight">Pendaftaran Berhasil!</h2>
          <p class="text-emerald-100 text-sm mt-1">Silakan ambil struk nomor antrean Anda</p>
        </div>

        <div class="p-8">
          <p class="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1">Nomor Antrean Anda</p>
          <div class="text-6xl sm:text-7xl font-extrabold text-emerald-600 font-mono-numbers my-4 tracking-wider">
            {{ registeredQueue.nomor_antrean }}
          </div>

          <!-- Rincian Pasien -->
          <div class="bg-slate-50 rounded-xl p-4 text-left text-sm space-y-2 border border-slate-100 mb-6">
            <div class="flex justify-between">
              <span class="text-slate-500">Nama Pasien:</span>
              <span class="font-semibold text-slate-800">{{ registeredQueue.nama }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">NIK:</span>
              <span class="font-mono text-slate-800">{{ registeredQueue.nomor_identitas }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Waktu Daftar:</span>
              <span class="text-slate-800">{{ registeredQueue.waktu_daftar }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Status:</span>
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                Menunggu
              </span>
            </div>
          </div>

          <p class="text-xs text-slate-400 mb-6">
            Mohon perhatikan layar monitor ruang tunggu saat nomor Anda dipanggil oleh petugas.
          </p>

          <!-- Aksi Struk -->
          <div class="flex flex-col sm:flex-row gap-3">
            <button
              @click="printTicket"
              type="button"
              class="flex-1 inline-flex items-center justify-center px-4 py-3 rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 font-semibold text-sm transition-colors shadow-sm"
            >
              <Printer class="w-4 h-4 mr-2" />
              Cetak Struk
            </button>
            <button
              @click="resetForm"
              type="button"
              class="flex-1 inline-flex items-center justify-center px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors shadow-md shadow-emerald-200"
            >
              <RefreshCw class="w-4 h-4 mr-2" />
              Daftar Pasien Baru
            </button>
          </div>
        </div>
      </div>

      <!-- TAMPILAN 2: FORM INPUT DATA PASIEN MANDIRI -->
      <div 
        v-else 
        class="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
      >
        <!-- Header Kartu -->
        <div class="px-6 py-6 border-b border-slate-100 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
          <h2 class="text-xl font-bold">Pendaftaran Pasien Mandiri</h2>
          <p class="text-emerald-100 text-sm mt-1">
            Masukkan data diri Anda untuk mengambil nomor antrean pemeriksaan.
          </p>
        </div>

        <!-- Body Form -->
        <form @submit.prevent="handleSubmit" class="p-6 sm:p-8 space-y-5">
          <!-- Pesan Error -->
          <div 
            v-if="errorMessage" 
            class="flex items-start p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm space-x-3"
          >
            <AlertCircle class="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Input Nama -->
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1.5" for="nama">
              Nama Lengkap <span class="text-rose-500">*</span>
            </label>
            <div class="relative rounded-xl shadow-sm">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User class="w-5 h-5" />
              </div>
              <input
                id="nama"
                v-model="form.nama"
                type="text"
                placeholder="Contoh: Budi Santoso"
                required
                class="block w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <!-- Input NIK -->
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1.5" for="nik">
              Nomor Identitas (NIK / KTP / Paspor) <span class="text-rose-500">*</span>
            </label>
            <div class="relative rounded-xl shadow-sm">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <CreditCard class="w-5 h-5" />
              </div>
              <input
                id="nik"
                v-model="form.nomor_identitas"
                type="text"
                maxlength="20"
                placeholder="Contoh: 3201234567890001"
                required
                class="block w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
            </div>
            <p class="text-xs text-slate-400 mt-1">NIK digunakan sebagai identifikasi unik pasien.</p>
          </div>

          <!-- Input Keluhan Utama -->
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1.5" for="keluhan">
              Keluhan Utama
            </label>
            <div class="relative rounded-xl shadow-sm">
              <div class="absolute top-3 left-3.5 pointer-events-none text-slate-400">
                <FileText class="w-5 h-5" />
              </div>
              <textarea
                id="keluhan"
                v-model="form.keluhan"
                rows="3"
                placeholder="Jelaskan secara singkat gejala atau keluhan yang dirasakan..."
                class="block w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition resize-none"
              ></textarea>
            </div>
          </div>

          <!-- Tombol Submit -->
          <div class="pt-2">
            <button
              type="submit"
              :disabled="loading"
              class="w-full flex items-center justify-center px-6 py-3.5 rounded-xl text-white font-bold text-base bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg 
                v-if="loading" 
                class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>{{ loading ? 'Memproses Pendaftaran...' : 'Ambil Nomor Antrean' }}</span>
            </button>
          </div>
        </form>
      </div>

    </div>
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}
.animate-fadeIn {
  animation: fadeIn 0.25s ease-out forwards;
}
</style>
