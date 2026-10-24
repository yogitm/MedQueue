import { ref, computed } from 'vue';
import axios from 'axios';

const TOKEN_KEY = 'medqueue_token';
const USER_KEY = 'medqueue_user';

// Reactive auth state
export const authToken = ref(localStorage.getItem(TOKEN_KEY) || '');
let parsedUser = null;
try {
  const storedUser = localStorage.getItem(USER_KEY);
  if (storedUser) {
    parsedUser = JSON.parse(storedUser);
  }
} catch (e) {
  console.error('Error parsing stored user:', e);
}
export const currentUser = ref(parsedUser);

export const isAuthenticated = computed(() => !!authToken.value);

/**
 * Simpan sesi login dokter
 */
export function setAuth(token, user) {
  authToken.value = token;
  currentUser.value = user;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

/**
 * Hapus sesi login dokter
 */
export function clearAuth() {
  authToken.value = '';
  currentUser.value = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  delete axios.defaults.headers.common['Authorization'];
}

/**
 * Konfigurasi Axios Interceptor untuk Autentikasi
 */
export function setupAxiosAuth(router) {
  // Pasang default Authorization header jika token sudah ada saat inisialisasi awal
  if (authToken.value) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken.value}`;
  }

  // Interceptor Request: pastikan selalu membawa header terbaru
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Interceptor Response: tangani error 401 Unauthorized
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 401) {
        // Jika token tidak valid / sesi habis, logout dan lempar ke halaman login
        if (router && router.currentRoute.value.path !== '/login') {
          clearAuth();
          router.push({
            path: '/login',
            query: {
              redirect: router.currentRoute.value.fullPath,
              sessionExpired: '1'
            }
          });
        }
      }
      return Promise.reject(error);
    }
  );
}
