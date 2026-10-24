<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';
import { 
  Stethoscope, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  ShieldAlert, 
  KeyRound, 
  Sparkles,
  ArrowLeft,
  Activity
} from 'lucide-vue-next';
import { setAuth, isAuthenticated } from '../utils/auth';

const router = useRouter();
const route = useRoute();

const username = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const alertNotice = ref('');

onMounted(() => {
  // Jika sudah login, langsung alihkan ke dashboard
  if (isAuthenticated.value) {
    router.replace('/dashboard');
    return;
  }

  // Tampilkan pesan peringatan jika dialihkan karena mencoba akses menu dokter tanpa izin
  if (route.query.unauthorized) {
    alertNotice.value = 'Akses Ditolak: Halaman Dashboard Pemanggilan & Rekam Medis hanya diperuntukkan bagi Dokter yang bertugas. Pasien tidak memiliki izin akses.';
  } else if (route.query.sessionExpired) {
    alertNotice.value = 'Sesi dokter telah kedaluwarsa. Silakan login kembali untuk melanjutkan tugas medis.';
  }
});

const handleLogin = async () => {
  if (!username.value.trim() || !password.value) {
    errorMessage.value = 'Silakan masukkan username dan password dokter.';
    return;
  }

  loading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const response = await axios.post('/api/auth/login', {
      username: username.value.trim(),
      password: password.value
    });

    if (response.data.success) {
      successMessage.value = response.data.message || 'Login berhasil! Mengalihkan ke dashboard...';
      
      // Simpan sesi autentikasi dokter
      setAuth(response.data.token, response.data.user);

      // Arahkan ke rute tujuan atau dashboard dokter
      const redirectUrl = route.query.redirect || '/dashboard';
      setTimeout(() => {
        router.push(redirectUrl);
      }, 700);
    }
  } catch (error) {
    console.error('Error saat login dokter:', error);
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage.value = error.response.data.message;
    } else {
      errorMessage.value = 'Gagal menghubungi server. Pastikan backend aktif.';
    }
  } finally {
    loading.value = false;
  }
};

// Fungsi bantuan untuk mengisi akun demo dokter
const setDemoAccount = (user, pass) => {
  username.value = user;
  password.value = pass;
  errorMessage.value = '';
};
</script>

<template>
  <div class="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 via-emerald-50/20 to-teal-50/30">
    <div class="w-full max-w-xl">
      
      <!-- Peringatan Akses Pasien / Sesi Habis -->
      <div 
        v-if="alertNotice" 
        class="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 shadow-sm flex items-start space-x-3 transition-all animate-in fade-in"
      >
        <ShieldAlert class="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
        <div class="flex-1 text-sm">
          <p class="font-bold text-amber-950">Perhatian Keamanan Sistem</p>
          <p class="mt-0.5 text-amber-800 leading-relaxed">{{ alertNotice }}</p>
        </div>
      </div>

      <!-- Main Login Card -->
      <div class="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200 overflow-hidden">
        
        <!-- Header Card -->
        <div class="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 sm:px-8 py-8 text-white relative overflow-hidden">
          <div class="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div class="relative z-10 flex items-center space-x-4">
            <div class="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
              <Stethoscope class="w-8 h-8 text-white" />
            </div>
            <div>
              <div class="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/40 text-emerald-100 text-xs font-semibold uppercase tracking-wider mb-1">
                <Activity class="w-3.5 h-3.5" />
                <span>Portal Tenaga Medis</span>
              </div>
              <h2 class="text-2xl font-extrabold tracking-tight">Otentikasi Dokter</h2>
              <p class="text-emerald-100 text-sm mt-0.5">Masuk untuk mengelola pemanggilan antrean & rekam medis</p>
            </div>
          </div>
        </div>

        <!-- Body Form -->
        <div class="p-6 sm:p-8 space-y-6">
          
          <!-- Notifikasi Error -->
          <div 
            v-if="errorMessage" 
            class="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start space-x-3"
          >
            <AlertCircle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div class="font-medium">{{ errorMessage }}</div>
          </div>

          <!-- Notifikasi Success -->
          <div 
            v-if="successMessage" 
            class="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start space-x-3"
          >
            <CheckCircle2 class="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div class="font-medium">{{ successMessage }}</div>
          </div>

          <form @submit.prevent="handleLogin" class="space-y-5">
            <!-- Input Username -->
            <div>
              <label for="username" class="block text-sm font-semibold text-slate-700 mb-1.5">
                Username Dokter
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User class="w-5 h-5" />
                </div>
                <input
                  id="username"
                  v-model="username"
                  type="text"
                  placeholder="Masukkan username dokter (misal: dokter)"
                  required
                  autocomplete="username"
                  class="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 placeholder-slate-400 text-sm transition-all shadow-sm"
                />
              </div>
            </div>

            <!-- Input Password -->
            <div>
              <label for="password" class="block text-sm font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock class="w-5 h-5" />
                </div>
                <input
                  id="password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Masukkan password akun dokter"
                  required
                  autocomplete="current-password"
                  class="w-full pl-11 pr-12 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 placeholder-slate-400 text-sm transition-all shadow-sm"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  tabindex="-1"
                >
                  <EyeOff v-if="showPassword" class="w-5 h-5" />
                  <Eye v-else class="w-5 h-5" />
                </button>
              </div>
            </div>

            <!-- Tombol Masuk -->
            <button
              type="submit"
              :disabled="loading"
              class="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-lg shadow-emerald-200 transition-all flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer"
            >
              <span v-if="!loading" class="flex items-center space-x-2">
                <span>Masuk ke Dashboard Dokter</span>
                <ArrowRight class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
              <span v-else class="flex items-center space-x-2">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Memverifikasi Kredensial...</span>
              </span>
            </button>
          </form>

          <!-- Kotak Akses Cepat Akun Demo (Dokter) -->
          <div class="pt-4 border-t border-slate-100">
            <div class="flex items-center space-x-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              <Sparkles class="w-3.5 h-3.5 text-amber-500" />
              <span>Akun Demo Dokter Terdaftar</span>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                @click="setDemoAccount('dokter', 'password123')"
                class="text-left p-3 rounded-xl border border-slate-200 hover:border-emerald-400 bg-slate-50/70 hover:bg-emerald-50/40 transition-all group"
              >
                <div class="flex items-center justify-between">
                  <span class="font-bold text-xs text-slate-800 group-hover:text-emerald-700">dr. Budi Santoso</span>
                  <KeyRound class="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
                </div>
                <div class="text-[11px] text-slate-500 mt-0.5">Spesialis Penyakit Dalam</div>
                <div class="text-[10px] text-slate-400 font-mono mt-1">user: dokter | pass: password123</div>
              </button>

              <button
                type="button"
                @click="setDemoAccount('dr.siti', 'password123')"
                class="text-left p-3 rounded-xl border border-slate-200 hover:border-emerald-400 bg-slate-50/70 hover:bg-emerald-50/40 transition-all group"
              >
                <div class="flex items-center justify-between">
                  <span class="font-bold text-xs text-slate-800 group-hover:text-emerald-700">dr. Siti Aminah</span>
                  <KeyRound class="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
                </div>
                <div class="text-[11px] text-slate-500 mt-0.5">Spesialis Anak</div>
                <div class="text-[10px] text-slate-400 font-mono mt-1">user: dr.siti | pass: password123</div>
              </button>
            </div>
          </div>

          <!-- Bagian Pasien (Pengingat) -->
          <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
            <p class="text-xs text-slate-600">
              Apakah Anda adalah <span class="font-semibold text-slate-800">Pasien</span>? Pasien tidak perlu login di sini.
            </p>
            <router-link
              to="/daftar"
              class="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              <ArrowLeft class="w-3.5 h-3.5" />
              <span>Kembali ke Halaman Pendaftaran Mandiri Pasien</span>
            </router-link>
          </div>

        </div>
      </div>

      <!-- Footer Info -->
      <div class="mt-6 text-center text-xs text-slate-400">
        MedQueue Sistem Manajemen Antrean & Rekam Medis © 2026
      </div>
    </div>
  </div>
</template>
