import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import 'leaflet/dist/leaflet.css';

const app = createApp(App);

// Use PrimeVue globally
app.use(PrimeVue, {
    theme: {
        preset: Aura
    }
});

app.use(router);

// Navigation guard to update the page title
router.afterEach((to) => {
  const defaultTitle = "JWS Pictures | The Photography of Joe Steinbring";
  let title = '';

  if (to.meta && to.meta.title) {
    title = to.meta.title;
    Object.keys(to.params).forEach((param) => {
      title = title.replace(`:${param}`, to.params[param]);
    });
  } else {
    title = defaultTitle;
  }

  document.title = `${defaultTitle} | ${title}`;
});

app.mount('#app');