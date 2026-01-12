<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Swal from 'sweetalert2';
import CustomModal from '@/presentation/components/modals/CustomModal.vue';
import CustomInput from '@/presentation/components/forms/components/CustomInput.vue';
import CustomButton from '@/presentation/components/forms/components/CustomButton.vue';
import { BootstrapButtonEnum } from '@/types/BootstrapButtonEnum';

// DAOs
import { UesDAO } from '@/domain/daos/UesDAO';
import { ParcoursDAO } from '@/domain/daos/ParcoursDAO';
import { EtudiantsDAO } from '@/domain/daos/EtudiantsDAO';

// Types
import type { UE } from '@/domain/entities/UE';
import type { Parcours } from '@/domain/entities/Parcours';
import type { Etudiants } from '@/domain/entities/Etudiants';

// route / router
const route = useRoute();
const router = useRouter();

// État local
const ueData = ref<Ue | null>(null);
const numeroUe = ref('');
const intituleUe = ref('');
const allParcours = ref<Parcours[]>([]);
const allEtudiants = ref<Etudiants[]>([]);
const notes = ref<{ [key: number]: number }>({});
const isLoading = ref(true);
const error = ref<string | null>(null);
const showParcoursModal = ref(false);
const newParcoursName = ref('');
const selectedParcoursId = ref<number[]>([]);

const loadData = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    const ueId = Number(route.params.id);

    // Charger l'UE
    const ue = await UesDAO.getInstance().get(ueId);
    if (!ue) {
      throw new Error('UE introuvable');
    }

    // S'assurer que Parcours existe
    ue.Parcours = ue.Parcours || [];
    ueData.value = ue;
    numeroUe.value = ue.Numero || '';
    intituleUe.value = ue.Intitulee || '';

    // Charger tous les parcours
    const parcours = await ParcoursDAO.getInstance().list();
    allParcours.value = parcours;

    // Charger tous les étudiants
    const etudiants = await EtudiantsDAO.getInstance().list();
    allEtudiants.value = etudiants;

  } catch (err) {
    console.error('Erreur détaillée:', err);
    error.value = 'Impossible de charger les données de l\'UE';
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadData();
});

const ueParcours = computed(() => {
  return ueData.value?.Parcours || [];
});

const ueEtudiants = computed(() => {
  if (!ueData.value?.Parcours?.length) return [];
  const parcoursIds = ueData.value.Parcours.map(p => p.ID);
  return allEtudiants.value.filter(etudiant =>
    etudiant.Parcours && parcoursIds.includes(etudiant.Parcours.ID)
  );
});

const openAddParcoursModal = () => {
  selectedParcoursId.value = []; // Initialiser comme tableau vide
  showParcoursModal.value = true;
};

const addParcours = async () => {
  if (!ueData.value || selectedParcoursId.value.length === 0) {
    await Swal.fire('Erreur', 'Veuillez sélectionner au moins un parcours', 'error');
    return;
  }

  try {
    // Convertir les IDs sélectionnés en objets Parcours
    const parcoursToAdd = selectedParcoursId.value
      .map(id => allParcours.value.find(p => p.ID === id))
      .filter(Boolean) as Parcours[];

    // Mettre à jour les parcours de l'UE
    ueData.value.Parcours = [...(ueData.value.Parcours || []), ...parcoursToAdd];

    // Sauvegarder les modifications
    await UesDAO.getInstance().update(ueData.value.ID!, ueData.value);

    // Réinitialiser et fermer le modal
    selectedParcoursId.value = [];
    closeParcoursModal();
  } catch (error) {
    console.error('Erreur lors de l\'ajout du parcours:', error);
    await Swal.fire('Erreur', 'Impossible d\'ajouter le(s) parcours', 'error');
  }
};

const closeParcoursModal = () => {
  showParcoursModal.value = false;
  selectedParcoursId.value = null;
};



const removeParcours = async (parcours: Parcours) => {
  if (!ueData.value?.Parcours) return;

  try {
    ueData.value.Parcours = ueData.value.Parcours.filter(p => p.ID !== parcours.ID);
    await UesDAO.getInstance().update(ueData.value.ID!, ueData.value);
  } catch (error) {
    console.error('Erreur lors du retrait du parcours:', error);
    await Swal.fire('Erreur', 'Impossible de retirer le parcours', 'error');
  }
};

const getNote = (etId: number) => {
  return notes.value[etId] !== undefined ? `${notes.value[etId]} / 20` : '__ / 20';
};

const changeNote = async (etId: number) => {
  const { value: raw } = await Swal.fire({
    title: 'Note sur 20',
    input: 'number',
    inputValidator: (value) => {
      if (!value || isNaN(Number(value)) || Number(value) < 0 || Number(value) > 20) {
        return 'Veuillez entrer une note valide entre 0 et 20';
      }
      return null;
    },
    showCancelButton: true
  });

  if (raw === undefined) return;
  const noteNum = Number(raw);
  notes.value[etId] = noteNum;
  await Swal.fire('Succès', 'Note enregistrée localement', 'success');
};

const availableParcours = computed(() => {
  // Filter out parcours that are already associated with the UE
  return allParcours.value.filter(p =>
    !ueData.value?.Parcours?.some(up => up.ID === p.ID)
  );
});

const saveUE = async () => {
  if (!ueData.value) return;
  ueData.value.Numero = numeroUe.value;
  ueData.value.Intitulee = intituleUe.value;
  try {
    await UesDAO.getInstance().update(ueData.value.ID!, ueData.value);
    await Swal.fire('Succès', 'UE enregistrée', 'success');
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de l\'UE:', error);
    await Swal.fire('Erreur', 'Impossible de sauvegarder l\'UE', 'error');
  }
}
</script>

<template>
  <div class="container mt-4">
    <!-- Loading State -->
    <div v-if="isLoading" class="d-flex justify-content-center align-items-center" style="min-height: 400px;">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Chargement...</span>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="d-flex align-items-center justify-content-center" style="min-height: 400px;">
      <div class="text-center">
        <div class="d-flex justify-content-center mb-4">
          <div class="text-danger" style="width: 48px; height: 48px;">
            <svg xmlns="http://www.w3.org/2000/svg
SVG namespace - World Wide Web Consortium (W3C)
http://www.w3.org/2000/svg is an XML namespace, first defined in the Scalable Vector Graphics (SVG) 1.0 Specification and subsequently added to by SVG 1.1, SVG 1.2 ...
www.w3.org" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" fill="#FEE2E2"/>
              <path fill="#DC2626" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 11.41L8.59 17 7 15.41 10.41 12 7 8.59 8.59 7 12 10.41 15.41 7 17 8.59 13.59 12 17 15.41 15.41 17 12 13.59z"/>
            </svg>
          </div>
        </div>
        <h4 class="mb-3">Erreur</h4>
        <p class="text-muted mb-4">{{ error }}</p>
        <div class="d-flex justify-content-center gap-2">
          <button class="btn btn-primary px-4" @click="loadData">
            Réessayer
          </button>
          <button class="btn btn-outline-secondary px-4" @click="router.push('/ues')">
            Retour
          </button>
        </div>
      </div>
    </div>

    <!-- Content (only shown when not loading and no error) -->
    <template v-else>
      <!-- Formulaire Numéro / Intitulé -->
      <div class="card p-3 mb-3">
        <h5>Modifier l'UE</h5>
        <div class="row">
          <div class="col-3">
            <label>Numéro :</label>
            <input v-model="numeroUe" type="text" class="form-control"/>
          </div>
          <div class="col">
            <label>Intitulé :</label>
            <input v-model="intituleUe" type="text" class="form-control"/>
          </div>
          <div class="col-12 d-flex justify-content-end mt-2">
            <button class="btn btn-info" @click="saveUE">Enregistrer</button>
          </div>
        </div>
      </div>

      <div class="row">
        <!-- Etudiants + Note -->
        <div class="col-md-8">
          <div class="card p-3">
            <h5>Notes</h5>
            <table class="table  table-striped">
              <tbody>
              <tr v-for="etudiant in ueEtudiants" :key="etudiant.ID">
                <td>{{ etudiant.Nom }} {{ etudiant.Prenom }}</td>

                <td class="text-end">
                  <input
                    type="text"
                    :value="getNote(etudiant.ID)"
                    @click="changeNote(etudiant.ID)"
                    class="note-input"
                    readonly
                  />
                </td>
              </tr>
              <tr v-if="ueEtudiants.length === 0">
                <td colspan="4" class="text-center text-muted">
                  Aucun étudiant trouvé dans les parcours associés
                </td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Parcours associés -->
        <div class="col-md-4">
          <div class="card">
            <div class="card-header bg-white d-flex justify-content-between align-items-center">
              <h5 class="mb-0">Parcours</h5>
              <button class="btn btn-success btn-sm" @click="openAddParcoursModal">
                <i class="bi bi-plus-lg"></i>
              </button>
            </div>
            <div class="list-group list-group-flush">
              <div v-for="parcours in ueParcours"
                   :key="parcours.ID"
                   class="list-group-item d-flex justify-content-between align-items-center">
                {{ parcours.NomParcours }}
                <button class="btn btn-danger btn-sm" @click="removeParcours(parcours)">
                  <i class="bi bi-dash-lg"></i>
                </button>
              </div>
              <div v-if="ueParcours.length === 0" class="list-group-item text-muted text-center">
                Aucun parcours associé
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Modal Ajout de parcours -->
    <CustomModal :isOpen="showParcoursModal">
      <template v-slot:title>
        Ajout de parcours
      </template>
      <template v-slot:body>
        <div class="mb-3">
          <div v-if="availableParcours.length === 0" class="text-center text-muted py-3">
            Tous les parcours sont déjà associés à cette UE
          </div>
          <div v-else class="list-group">
            <v-select
              multiple
              label="NomParcours"
              v-model="selectedParcoursId"
              :options="availableParcours"
              :reduce="parcours => parcours.ID"
              placeholder="Sélectionnez un ou plusieurs parcours"
            ></v-select>
          </div>
        </div>
        <div class="d-flex justify-content-end gap-2">
          <CustomButton
            :color="BootstrapButtonEnum.secondary"
            @click="closeParcoursModal"
          >
            Annuler
          </CustomButton>
          <CustomButton
            :color="BootstrapButtonEnum.primary"
            @click="addParcours"
            :disabled="selectedParcoursId.length === 0"
          >
            Ajouter
          </CustomButton>
        </div>
      </template>
    </CustomModal>
  </div>
</template>

<style scoped>
.card {
  background-color: #fff;
  border: 1px solid #ccc;
}

.spinner-border {
  width: 3rem;
  height: 3rem;
}

.list-group-item {
  border-left: none;
  border-right: none;
  cursor: pointer;
  transition: background-color 0.2s;
}
.list-group-item:nth-child(odd) {
  background-color: #f8f9fa; /* Gris clair pour les éléments impairs */
}


.list-group-item:hover {
  background-color: #f8f9fa;
}
.note-input {
  border: 1px solid black;
  border-radius: 4px;
  padding: 0;
  width: 80px;
  text-align: center;
  background-color: white;
  cursor: pointer;
}
.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.form-check-input {
  cursor: pointer;
}
tr:nth-child(odd) {
  background-color: #273656; /* Change la couleur de fond des lignes impaires */
}
</style>