import { createRouter, createWebHistory } from 'vue-router';
import LandingPage from './components/LandingPage.vue';
import YearPage from './components/YearPage.vue';
import PhotoPage from './components/PhotoPage.vue';
import FAQ from './components/FAQ.vue';
import YearsPage from './components/YearsPage.vue';

const routes = [
  {
    path: '/',
    name: 'LandingPage',
    component: LandingPage,
    meta: { title: 'All Photos' },
  },
  {
    path: '/:year',
    name: 'YearPage',
    component: YearPage,
    props: true,
    meta: { title: 'Photos from :year' },
  },
  {
    path: '/years',
    name: 'Year',
    component: YearsPage,
    meta: { title: 'Years' },
  },
  {
    path: '/:year/:id',
    name: 'PhotoPage',
    component: PhotoPage,
    props: true,
    meta: { title: 'Photo :id from :year' },
  },
  {
    path: '/faq',
    name: 'FAQ',
    component: FAQ,
    meta: { title: 'Frequently Asked Questions' },
  },
];

const router = createRouter({
  history: createWebHistory('https://jws.pictures/'),
  routes,
});

export default router;
