import { createRouter, createWebHistory } from 'vue-router';
import DaftarView from '../views/DaftarView.vue';
import LayarTungguView from '../views/LayarTungguView.vue';
import DashboardView from '../views/DashboardView.vue';
import RekamMedisView from '../views/RekamMedisView.vue';
import LoginView from '../views/LoginView.vue';

const routes = [
  {
    path: '/',
    redirect: '/daftar'
  },
  {
    path: '/daftar',
    name: 'Daftar',
    component: DaftarView,
    meta: { title: 'Pendaftaran Pasien Mandiri' }
  },
  {
    path: '/layar-tunggu',
    name: 'LayarTunggu',
    component: LayarTungguView,
    meta: { title: 'Layar Monitor Ruang Tunggu' }
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { title: 'Portal Otentikasi Dokter' }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardView,
    meta: { 
      title: 'Dashboard Dokter & Pemanggilan',
      requiresAuth: true
    }
  },
  {
    path: '/rekam-medis',
    name: 'RekamMedis',
    component: RekamMedisView,
    meta: { 
      title: 'Rekam Medis Pasien',
      requiresAuth: true
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/daftar'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation Guard: Memastikan pasien tidak bisa mengakses dashboard pemanggilan & rekam medis
router.beforeEach((to, from, next) => {
  document.title = to.meta.title 
    ? `${to.meta.title} - MedQueue` 
    : 'MedQueue - Sistem Antrean Puskesmas';

  const token = localStorage.getItem('medqueue_token');

  // Jika rute membutuhkan otentikasi dokter tetapi token tidak ada
  if (to.meta.requiresAuth && !token) {
    next({
      path: '/login',
      query: {
        redirect: to.fullPath,
        unauthorized: '1'
      }
    });
  } 
  // Jika pengguna sudah login dokter dan membuka halaman login
  else if (to.path === '/login' && token) {
    next({ path: '/dashboard' });
  } 
  else {
    next();
  }
});

export default router;

