import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { setupAxiosAuth } from './utils/auth';
import './assets/style.css';

// Konfigurasi axios interceptor untuk Authorization token dan 401 handling
setupAxiosAuth(router);

const app = createApp(App);
app.use(router);
app.mount('#app');

