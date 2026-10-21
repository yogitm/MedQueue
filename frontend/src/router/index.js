import { createRouter, createWebHistory } from 'vue-router';
import DaftarView from '../views/DaftarView.vue';
import LayarTungguView from '../views/LayarTungguView.vue';
import DashboardView from '../views/DashboardView.vue';
import RekamMedisView from '../views/RekamMedisView.vue';

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
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardView,
    meta: { title: 'Dashboard Dokter & Petugas' }
  },
  {
    path: '/rekam-medis',
    name: 'RekamMedis',
    component: RekamMedisView,
    meta: { title: 'Rekam Medis Pasien' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  document.title = to.meta.title 
    ? `${to.meta.title} - Antrean Puskesmas` 
    : 'Antrean Puskesmas';
  next();
});

export default router;
