// src/router.js
import { createRouter, createWebHistory } from 'vue-router';
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
    props: true, // allows passing year as a prop
  },
  {
    path: '/:year/:id',
    name: 'PhotoPage',
    component: PhotoPage,
    props: true, // allows passing year and ID as props
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;