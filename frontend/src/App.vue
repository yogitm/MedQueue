<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { UserPlus, Tv, LayoutDashboard, Stethoscope, FileCheck2 } from 'lucide-vue-next';

const route = useRoute();
// Sembunyikan navbar jika sedang di mode layar tunggu agar tampilan TV bersih maksimal
const isLayarTunggu = computed(() => route.path === '/layar-tunggu');
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-50 text-slate-800">
    <!-- Header / Navigation Bar (Hanya tampil di luar mode Layar Tunggu) -->
    <header v-if="!isLayarTunggu" class="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-200">
            <Stethoscope class="w-6 h-6" />
          </div>
          <div>
            <h1 class="text-lg font-bold text-slate-900 leading-tight">MedQueue</h1>
            <p class="text-xs text-slate-500 font-medium">Sistem Antrean Puskesmas & Klinik</p>
          </div>
        </div>

        <!-- Navigation Links -->
        <nav class="flex items-center space-x-1 sm:space-x-2">
          <router-link
            to="/daftar"
            class="flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            :class="route.path === '/daftar' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'"
          >
            <UserPlus class="w-4 h-4" />
            <span class="hidden sm:inline">Pendaftaran</span>
          </router-link>

          <router-link
            to="/dashboard"
            class="flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            :class="route.path === '/dashboard' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'"
          >
            <LayoutDashboard class="w-4 h-4" />
            <span class="hidden sm:inline">Dashboard Dokter</span>
          </router-link>

          <router-link
            to="/rekam-medis"
            class="flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            :class="route.path === '/rekam-medis' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'"
          >
            <FileCheck2 class="w-4 h-4" />
            <span class="hidden sm:inline">Rekam Medis</span>
          </router-link>

          <router-link
            to="/layar-tunggu"
            target="_blank"
            class="flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-sm"
          >
            <Tv class="w-4 h-4 text-emerald-400" />
            <span class="hidden sm:inline">Buka Layar TV</span>
          </router-link>
        </nav>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-1 flex flex-col">
      <router-view />
    </main>
  </div>
</template>
