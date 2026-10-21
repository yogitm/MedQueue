<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import axios from 'axios';
import { Volume2, VolumeX, Stethoscope, Clock, Calendar, CheckCircle2 } from 'lucide-vue-next';

// State antrean aktif
const activeQueue = ref(null);
const lastCalledNumber = ref('');
const currentTime = ref('');
const currentDate = ref('');
const isAudioEnabled = ref(false); // Suara panggilan otomatis
const isConnected = ref(true);

let pollInterval = null;
let clockInterval = null;

// Format Waktu & Tanggal Realtime
const updateClock = () => {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  currentDate.value = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

// Bunyikan Panggilan Suara (Web Speech API)
const announceQueue = (queueNumber, patientName) => {
  if (!isAudioEnabled.value || !('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel(); // Stop suara sebelumnya jika ada
  const text = `Nomor antrean, ${queueNumber.replace('-', ' ')}, atas nama ${patientName}, silakan menuju ruang pemeriksaan.`;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'id-ID';
  utterance.rate = 0.9; // Kecepatan bicara santai dan jelas
  window.speechSynthesis.speak(utterance);
};

// Fetch Antrean Aktif dari Backend
const fetchActiveQueue = async () => {
  try {
    const response = await axios.get('/api/antrean/aktif');
    if (response.data.success) {
      isConnected.value = true;
      const data = response.data.data;
      
      // Jika ada nomor baru yang berbeda dari nomor sebelumnya yang dipanggil
      if (data && data.nomor_antrean !== lastCalledNumber.value) {
        lastCalledNumber.value = data.nomor_antrean;
        announceQueue(data.nomor_antrean, data.nama);
      }
      
      activeQueue.value = data;
    }
  } catch (error) {
    console.error('Gagal mengambil antrean aktif:', error);
    isConnected.value = false;
  }
};

// Lifecycle Hooks
onMounted(() => {
  updateClock();
  clockInterval = setInterval(updateClock, 1000);
  
  // Ambil pertama kali, lalu pasang polling setiap 3 detik
  fetchActiveQueue();
  pollInterval = setInterval(fetchActiveQueue, 3000);
});

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval);
  if (clockInterval) clearInterval(clockInterval);
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
});

const toggleAudio = () => {
  isAudioEnabled.value = !isAudioEnabled.value;
  if (isAudioEnabled.value && activeQueue.value) {
    announceQueue(activeQueue.value.nomor_antrean, activeQueue.value.nama);
  }
};
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
    <!-- Top Bar Header -->
    <header class="px-8 py-5 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <div class="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
          <Stethoscope class="w-7 h-7" />
        </div>
        <div>
          <h1 class="text-2xl font-black tracking-wide text-slate-100 uppercase">
            Puskesmas / Klinik Sehat
          </h1>
          <p class="text-xs text-slate-400 font-medium tracking-wider uppercase">
            Sistem Informasi Monitor Ruang Tunggu
          </p>
        </div>
      </div>

      <!-- Jam, Tanggal & Kontrol Suara -->
      <div class="flex items-center space-x-6">
        <button
          @click="toggleAudio"
          class="flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all"
          :class="isAudioEnabled ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'"
          title="Nyalakan/Matikan Suara Panggilan Otomatis"
        >
          <Volume2 v-if="isAudioEnabled" class="w-4 h-4 text-emerald-400" />
          <VolumeX v-else class="w-4 h-4 text-slate-400" />
          <span>{{ isAudioEnabled ? 'Suara Aktif' : 'Suara Senyap' }}</span>
        </button>

        <div class="text-right hidden sm:block">
          <div class="flex items-center space-x-1.5 text-xs text-slate-400 justify-end">
            <Calendar class="w-3.5 h-3.5" />
            <span>{{ currentDate }}</span>
          </div>
          <div class="flex items-center space-x-2 text-2xl font-bold font-mono text-emerald-400 tracking-wider">
            <Clock class="w-5 h-5 text-slate-500" />
            <span>{{ currentTime }}</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Display: Nomor Antrean Aktif yang Sangat Besar -->
    <main class="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div class="w-full max-w-4xl mx-auto">
        <!-- Badge Status -->
        <div class="inline-flex items-center px-6 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm md:text-base font-bold uppercase tracking-widest mb-6 animate-pulse">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 mr-2.5 shadow-[0_0_8px_#34d399]"></span>
          Antrean Saat Ini
        </div>

        <!-- Nomor Antrean Raksasa (text-8xl atau lebih besar) -->
        <div 
          v-if="activeQueue"
          class="transition-all transform duration-300"
        >
          <div class="text-8xl sm:text-9xl md:text-[11rem] lg:text-[13rem] font-black font-mono-numbers text-emerald-400 tracking-widest leading-none drop-shadow-[0_0_50px_rgba(16,185,129,0.35)] select-none">
            {{ activeQueue.nomor_antrean }}
          </div>

          <!-- Informasi Pasien yang Dipanggil -->
          <div class="mt-8 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl mx-auto backdrop-blur-sm shadow-2xl">
            <p class="text-xs font-semibold uppercase tracking-widest text-slate-400">Atas Nama Pasien</p>
            <h2 class="text-2xl sm:text-4xl font-extrabold text-white mt-1 mb-3">
              {{ activeQueue.nama }}
            </h2>
            <div class="inline-flex items-center px-4 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-800/60 text-emerald-300 text-sm font-medium">
              <CheckCircle2 class="w-4 h-4 mr-2 text-emerald-400" />
              Silakan Menuju Ruang Pemeriksaan / Poli Umum
            </div>
          </div>
        </div>

        <!-- Tampilan Saat Belum Ada Antrean yang Dipanggil -->
        <div v-else class="py-16">
          <div class="text-7xl sm:text-8xl md:text-9xl font-black font-mono-numbers text-slate-700 tracking-widest select-none">
            ---
          </div>
          <p class="text-xl sm:text-2xl font-bold text-slate-400 mt-6">
            Belum ada antrean yang sedang dipanggil
          </p>
          <p class="text-sm text-slate-500 mt-2">
            Silakan tunggu petugas medis memanggil nomor antrean Anda.
          </p>
        </div>
      </div>
    </main>

    <!-- Bottom Running Text / Status Bar -->
    <footer class="border-t border-slate-800 bg-slate-900/70 px-8 py-4 flex items-center justify-between text-xs text-slate-400">
      <div class="flex items-center space-x-2">
        <span 
          class="w-2 h-2 rounded-full" 
          :class="isConnected ? 'bg-emerald-500' : 'bg-rose-500'"
        ></span>
        <span>Status Server: {{ isConnected ? 'Terhubung (Polling 3s)' : 'Terputus' }}</span>
      </div>

      <div class="text-right truncate max-w-lg hidden sm:block text-slate-400">
        📢 Harap siapkan KTP / Kartu BPJS saat nomor Anda dipanggil ke ruang periksa.
      </div>
    </footer>
  </div>
</template>
