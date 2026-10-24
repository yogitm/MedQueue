<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { 
  UserPlus, 
  Tv, 
  LayoutDashboard, 
  Stethoscope, 
  FileCheck2, 
  LogIn, 
  LogOut, 
  UserCheck, 
  AlertTriangle 
} from 'lucide-vue-next';
import { isAuthenticated, currentUser, clearAuth } from './utils/auth';

const route = useRoute();
const router = useRouter();

// Sembunyikan navbar jika sedang di mode layar tunggu agar tampilan TV bersih maksimal
const isLayarTunggu = computed(() => route.path === '/layar-tunggu');

// State modal logout
const showLogoutModal = ref(false);

const handleLogout = () => {
  clearAuth();
  showLogoutModal.value = false;
  router.push('/login');
};
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-50 text-slate-800">
    <!-- Header / Navigation Bar (Hanya tampil di luar mode Layar Tunggu) -->
    <header v-if="!isLayarTunggu" class="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        <!-- Logo MedQueue -->
        <router-link to="/" class="flex items-center space-x-3 group">
          <div class="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-200 group-hover:scale-105 transition-transform">
            <Stethoscope class="w-6 h-6" />
          </div>
          <div>
            <div class="flex items-center space-x-1.5">
              <h1 class="text-lg font-bold text-slate-900 leading-tight">MedQueue</h1>
              <span class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">Klinik</span>
            </div>
            <p class="text-xs text-slate-500 font-medium">Sistem Antrean & Rekam Medis</p>
          </div>
        </router-link>

        <!-- Navigation Links & Doctor Auth Controls -->
        <div class="flex items-center space-x-1 sm:space-x-3">
          
          <!-- Menu Pendaftaran (Bisa diakses siapapun) -->
          <router-link
            to="/daftar"
            class="flex items-center space-x-1.5 sm:space-x-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all"
            :class="route.path === '/daftar' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'"
          >
            <UserPlus class="w-4 h-4" />
            <span class="hidden md:inline">Pendaftaran</span>
          </router-link>

          <!-- Menu Khusus Dokter: Hanya muncul jika dokter telah login -->
          <template v-if="isAuthenticated">
            <router-link
              to="/dashboard"
              class="flex items-center space-x-1.5 sm:space-x-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all"
              :class="route.path === '/dashboard' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'"
            >
              <LayoutDashboard class="w-4 h-4" />
              <span class="hidden md:inline">Dashboard Dokter</span>
            </router-link>

            <router-link
              to="/rekam-medis"
              class="flex items-center space-x-1.5 sm:space-x-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all"
              :class="route.path === '/rekam-medis' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'"
            >
              <FileCheck2 class="w-4 h-4" />
              <span class="hidden md:inline">Rekam Medis</span>
            </router-link>
          </template>

          <!-- Buka Layar Monitor TV (Bisa diakses publik/staff) -->
          <router-link
            to="/layar-tunggu"
            target="_blank"
            class="flex items-center space-x-1.5 sm:space-x-2 px-3 py-2 rounded-lg text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-sm"
          >
            <Tv class="w-4 h-4 text-emerald-400" />
            <span class="hidden sm:inline">Layar TV</span>
          </router-link>

          <!-- Separator Vertikal -->
          <div class="h-6 w-px bg-slate-200 hidden sm:block"></div>

          <!-- Auth Actions: Belum Login vs Sudah Login -->
          <div v-if="!isAuthenticated" class="flex items-center">
            <router-link
              to="/login"
              class="flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm"
              :class="route.path === '/login' ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'"
            >
              <LogIn class="w-4 h-4" />
              <span>Login Dokter</span>
            </router-link>
          </div>

          <!-- Badge Dokter Login & Tombol Logout -->
          <div v-else class="flex items-center space-x-2">
            <!-- Info Profil Dokter -->
            <div class="hidden lg:flex items-center space-x-2 bg-emerald-50/70 border border-emerald-200/80 px-3 py-1.5 rounded-xl">
              <div class="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                {{ currentUser?.nama ? currentUser.nama.charAt(0) : 'D' }}
              </div>
              <div class="text-left">
                <div class="text-xs font-bold text-slate-800 leading-tight">
                  {{ currentUser?.nama || 'Dokter Bertugas' }}
                </div>
                <div class="text-[10px] text-emerald-700 font-semibold uppercase tracking-wider">
                  {{ currentUser?.role || 'Dokter' }}
                </div>
              </div>
            </div>

            <!-- Tombol Keluar (Logout) -->
            <button
              @click="showLogoutModal = true"
              title="Keluar dari sesi dokter"
              class="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
            >
              <LogOut class="w-4 h-4" />
              <span class="hidden sm:inline">Keluar</span>
            </button>
          </div>

        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-1 flex flex-col">
      <router-view />
    </main>

    <!-- Modal Konfirmasi Logout -->
    <div
      v-if="showLogoutModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div class="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
        <div class="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle class="w-6 h-6" />
        </div>
        <h3 class="text-lg font-bold text-slate-900 text-center mb-1">
          Konfirmasi Keluar
        </h3>
        <p class="text-xs text-slate-600 text-center mb-6 leading-relaxed">
          Apakah Anda yakin ingin keluar dari portal dokter? Dashboard pemanggilan dan rekam medis tidak dapat diakses tanpa login kembali.
        </p>
        <div class="flex space-x-3">
          <button
            @click="showLogoutModal = false"
            class="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
          >
            Batal
          </button>
          <button
            @click="handleLogout"
            class="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow-md shadow-rose-200 transition-all cursor-pointer"
          >
            Ya, Keluar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
