import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../presentation/views/HomeView.vue';
import ParcoursListView from '@/presentation/views/ParcoursListView.vue'
import UEListView from "@/presentation/views/UEListView.vue"; 
import EtudiantsView from "@/presentation/views/EtudiantsView.vue";


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
    },
    {
        path: '/ue', 
        name: 'ue',
        component: UEListView
    },
    {
      path: "/etudiants",
      name: "etudiants",
      component: EtudiantsView,
    },
  ] 
});

export default router;