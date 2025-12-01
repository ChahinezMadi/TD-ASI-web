import { createRouter, createWebHistory } from 'vue-router';
import ParcoursListView from '@/presentation/views/ParcoursListView.vue' 
import HomeView from '../presentation/views/HomeView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    
    { 
      path: '/parcours', 
      name: 'parcours', 
      component: ParcoursListView 
    } 
  ]
});

export default router;
