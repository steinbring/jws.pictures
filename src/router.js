import { createRouter, createWebHashHistory } from 'vue-router';
import LandingPage from './components/LandingPage.vue';
import YearPage from './components/YearPage.vue';
import PhotoPage from './components/PhotoPage.vue';

const routes = [
  {
    path: '/',
    name: 'LandingPage',
    component: LandingPage,
  },
  {
    path: '/:year',
    name: 'YearPage',
    component: YearPage,
    props: true,
  },
  {
    path: '/:year/:id',
    name: 'PhotoPage',
    component: PhotoPage,
    props: true,
  }
];

const router = createRouter({
  history: createWebHashHistory(), // Use hash mode for GitHub Pages
  routes,
});

export default router;