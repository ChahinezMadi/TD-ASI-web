<script setup lang="ts">
import { ref, onBeforeMount, defineExpose, defineProps, toRaw } from 'vue';
import { BootstrapButtonEnum } from '@/types/BootstrapButtonEnum';
import { Parcours } from '@/domain/entities/Parcours';
import CustomInput from '@/presentation/components/forms/components/CustomInput.vue';
import CustomButton from '@/presentation/components/forms/components/CustomButton.vue';
import { ParcoursDAO } from '@/domain/daos/ParcoursDAO'; 
import { watch } from 'vue';
import CustomModal from '@/presentation/components/modals/CustomModal.vue'; 

const currentParcours = ref<Parcours>(new Parcours(null, null, null));
const isOpen = ref(false);

const openForm = (parcours: Parcours | null = null) => {
    isOpen.value = true;

    if (parcours) {
        currentParcours.value = structuredClone(toRaw(parcours));
    }
};

const closeForm = () => {
    isOpen.value = false;
    currentParcours.value = new Parcours(null, null, null);
};

const props = defineProps({
    parcours: {
        type: Object as () => Parcours | null,
        required: false,
        default: null,
    },
});

const emit = defineEmits(['create:parcours', 'update:parcours']);

const formErrors = ref<{ 

  NomParcours: string | null; 

  AnneeFormation: string | null; 

}>({ 

  NomParcours: null, 

  AnneeFormation: null, 

}); 

watch(() => currentParcours.value.NomParcours, () => { 

  if (!currentParcours.value.NomParcours || currentParcours.value.NomParcours.trim() === '' || currentParcours.value.NomParcours.length < 3) { 

    formErrors.value.NomParcours = 'Le nom du parcours doit faire au moins 3 caractères'; 

  } else { 

    formErrors.value.NomParcours = null; 

  } 

}); 

watch(() => currentParcours.value.AnneeFormation, () => {
  const raw = currentParcours.value.AnneeFormation;

  //champ vide
  if (raw === null || raw === undefined || raw === '') {
    formErrors.value.AnneeFormation = "L'année de formation est obligatoire";
    return;
  }

  const year = Number(raw);
  const currentYear = new Date().getFullYear();
  const min = currentYear - 20; // ou 2000
  const max = currentYear + 20; // ou 2100

  //pas un nombre ou pas un entier
  if (!Number.isInteger(year)) {
    formErrors.value.AnneeFormation = "L'année doit être un nombre entier";
    return;
  }

  if (year < min || year > max) {
    formErrors.value.AnneeFormation =
      `L'année doit être comprise entre ${min} et ${max}`;
    return;
  }

  // OK
  formErrors.value.AnneeFormation = null;
});

onBeforeMount(() => {
    if (props.parcours) {
        currentParcours.value = props.parcours;
    }
});

defineExpose({
    openForm,
    closeForm,
});


const saveParcours = () => { 

  if (formErrors.value.NomParcours || formErrors.value.AnneeFormation) { 

    return; 

  } 

 

  if (currentParcours.value.ID) { 
      // Mise à jour d'un parcours existant
    ParcoursDAO.getInstance()
      .update(currentParcours.value.ID, currentParcours.value)
      .then((updatedParcours) => {
        alert('Parcours mis à jour avec succès');

        // Émettre l'événement de mise à jour
        emit('update:parcours', updatedParcours);

        closeForm();
      })
      .catch((ex) => {
        alert(ex.message);
      });

  } else { 

    ParcoursDAO.getInstance().create(currentParcours.value).then((newParcours) => { 

      alert('Parcours créé avec succès'); 

      emit('create:parcours', newParcours); 

      closeForm(); 

    }).catch((ex) => { 

      alert(ex.message); 

    }); 

  } 

}; 

</script>
<template> 

  <CustomModal :isOpen="isOpen"> 

    <template v-slot:title> 

      <template v-if="parcours && parcours.ID"> Modification du parcours </template> 

      <template v-else> Nouveau parcours </template> 

    </template> 

    <template v-slot:body> 

      <div class="text-start mt-1 mb-1"> 

        <form> 

          <CustomInput v-model="currentParcours.NomParcours" id="intitule" libelle="Intitulé" type="text" 

            placeholder="Intitulé du parcours" :error="formErrors.NomParcours" /> 

          <CustomInput v-model="currentParcours.AnneeFormation" class="mt-2" id="annee" libelle="Année" type="number" 

            placeholder="Année de formation" /> 

        </form> 

      </div> 

      <CustomButton class="mt-1" style="margin-left: 5px" :color="BootstrapButtonEnum.danger" @click="closeForm"> 

        Annuler 

      </CustomButton> 

      <CustomButton class="mt-1" style="margin-left: 5px" :color="BootstrapButtonEnum.primary" @click="saveParcours"> 

        Enregistrer 

      </CustomButton> 

    </template> 

  </CustomModal> 

</template> 
<style scoped> 
.custom-modal { 
  position: absolute; 
  left: 0; 
  top: 0; 
  height: 100%; 
  width: 100%; 
  background-color: rgba(87, 86, 86, 0.5); 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  justify-content: center; 
  text-align: center; 
} 

.custom-modal .card { 
  width: 250px; 
} 

.card-header { 
  background: #273656; 
  color: white; 
  text-align: left; 
} 

.card-text { 
  text-align: left; 
} 
</style> 