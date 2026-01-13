<script setup lang="ts">
console.log("EtudiantsForm chargé");
import { ref, onBeforeMount, defineExpose, defineProps, watch } from "vue";
import Swal from "sweetalert2";

import { BootstrapButtonEnum } from "@/types/BootstrapButtonEnum";
import CustomInput from "@/presentation/components/forms/components/CustomInput.vue";
import CustomButton from "@/presentation/components/forms/components/CustomButton.vue";
import CustomModal from "@/presentation/components/modals/CustomModal.vue";

import { Etudiant } from "@/domain/entities/Etudiant";
import { EtudiantsDAO } from "@/domain/daos/EtudiantsDAO";
import { ParcoursDAO } from "@/domain/daos/ParcoursDAO";
import type { Parcours } from "@/domain/entities/Parcours";

// si tu utilises vue-select :
import vSelect from "vue-select";
import "vue-select/dist/vue-select.css";

const currentEtudiant = ref<Etudiant>(new Etudiant(null, null, null, null, null));
const isOpen = ref(false);

const formErrors = ref({
  nom: null as string | null,
  prenom: null as string | null,
  email: null as string | null,
  parcours: null as string | null,
});

const parcoursOptions = ref<Parcours[]>([]);

const props = defineProps({
  etudiant: {
    type: Object as () => Etudiant | null,
    required: false,
    default: null,
  },
});

const emit = defineEmits<{
  (e: "create:etudiant", etudiant: Etudiant): void;
  (e: "update:etudiant", etudiant: Etudiant): void;
}>();

const openForm = (etudiant: Etudiant | null = null) => {
  console.log("openForm appelé");
  isOpen.value = true;
  currentEtudiant.value = etudiant
    ? etudiant
    : new Etudiant(null, null, null, null, null);
};

const closeForm = () => {
  isOpen.value = false;
  currentEtudiant.value = new Etudiant(null, null, null, null, null);
};

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const saveEtudiant = async () => {
  // validations simples
  if (formErrors.value.nom || formErrors.value.prenom || formErrors.value.email) return;

  try {
    if (currentEtudiant.value.ID) {
      const updated = await EtudiantsDAO.getInstance().update(
        currentEtudiant.value.ID,
        currentEtudiant.value
      );
      emit("update:etudiant", updated);
      Swal.fire("OK", "Étudiant mis à jour", "success");
      closeForm();
    } else {
      const created = await EtudiantsDAO.getInstance().create(currentEtudiant.value);
      emit("create:etudiant", created);
      Swal.fire("OK", "Étudiant créé", "success");
      closeForm();
    }
  } catch (e: any) {
    console.error(e);
    Swal.fire("Erreur", e?.message ?? "Erreur lors de l'enregistrement", "error");
  }
};

onBeforeMount(async () => {
  parcoursOptions.value = await ParcoursDAO.getInstance().list();
  if (props.etudiant) openForm(props.etudiant);
});

defineExpose({ openForm, closeForm });

watch(() => props.etudiant, (v) => {
  if (v) openForm(v);
});

watch(() => currentEtudiant.value.nom, () => {
  const v = currentEtudiant.value.nom ?? "";
  formErrors.value.nom = v.trim().length < 3 ? "Le nom doit faire au moins 3 caractères" : null;
});

watch(() => currentEtudiant.value.prenom, () => {
  const v = currentEtudiant.value.prenom ?? "";
  formErrors.value.prenom = v.trim().length < 3 ? "Le prénom doit faire au moins 3 caractères" : null;
});

watch(() => currentEtudiant.value.email, () => {
  const v = currentEtudiant.value.email ?? "";
  formErrors.value.email = !isValidEmail(v) ? "Email invalide" : null;
});
</script>

<template>
  <CustomModal :isOpen="isOpen">
    <template #title>
      <template v-if="currentEtudiant.ID">Modification de l'étudiant</template>
      <template v-else>Enregistrer un étudiant</template>
    </template>

    <template #body>
      <div class="text-start mt-1 mb-1">
        <form @submit.prevent="saveEtudiant">
          <CustomInput
            v-model="currentEtudiant.nom"
            class="mt-2"
            id="nom"
            libelle="Nom"
            type="text"
            placeholder="Nom de l'étudiant"
            :error="formErrors.nom"
          />

          <CustomInput
            v-model="currentEtudiant.prenom"
            id="prenom"
            libelle="Prénom"
            type="text"
            placeholder="Prénom de l'étudiant"
            :error="formErrors.prenom"
          />

          <CustomInput
            v-model="currentEtudiant.email"
            id="email"
            libelle="Email"
            type="email"
            placeholder="Email de l'étudiant"
            :error="formErrors.email"
          />

          <div class="form-group mt-2">
            <label>Parcours :</label>

            <!-- PAS multiple : un étudiant = un seul parcours -->
            <vSelect
              label="NomParcours"
              v-model="currentEtudiant.parcours"
              :options="parcoursOptions"
            />

            <div v-if="formErrors.parcours" class="invalid-feedback">
              {{ formErrors.parcours }}
            </div>
          </div>

          <div class="mt-3">
            <CustomButton :color="BootstrapButtonEnum.danger" @click="closeForm">
              Annuler
            </CustomButton>

            <CustomButton class="ms-2" :color="BootstrapButtonEnum.primary" type="submit">
              Enregistrer
            </CustomButton>
          </div>
        </form>
      </div>
    </template>
  </CustomModal>
</template>
