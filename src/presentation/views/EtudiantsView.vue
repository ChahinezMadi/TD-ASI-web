<script setup lang="ts">
console.log("EtudiantsView chargé");
const openCreate = () => {
  console.log("click");
  console.log("ref etudiantsForm =", etudiantsForm.value);
  etudiantsForm.value?.openForm();
};

import { ref, onMounted } from "vue";
import Swal from "sweetalert2";

import { BootstrapButtonEnum } from "@/types/BootstrapButtonEnum";
import CustomButton from "@/presentation/components/forms/components/CustomButton.vue";
import CustomTable from "@/presentation/components/tables/CustomTable.vue";

import EtudiantsForm from "@/presentation/components/forms/EtudiantsForm.vue";
import { Etudiant } from "@/domain/entities/Etudiant";
import { EtudiantsDAO } from "@/domain/daos/EtudiantsDAO";

const etudiantsForm = ref<InstanceType<typeof EtudiantsForm> | null>(null);

const etudiantsList = ref<Etudiant[]>([]);

const formatterEdition = () => '<i class="bi bi-pen-fill text-primary"></i>';
const formatterSuppression = () => '<i class="bi bi-trash-fill text-danger"></i>';


const formatterParcours = (e: Etudiant) => e.parcours?.NomParcours ?? "";

const onEtudiantCreated = (e: Etudiant) => etudiantsList.value.unshift(e);

const onEtudiantUpdated = (e: Etudiant) => {
  const idx = etudiantsList.value.findIndex(x => x.ID === e.ID);
  if (idx !== -1) etudiantsList.value[idx] = e;
};

const onDeleteEtudiant = (e: Etudiant) => {
  Swal.fire({
    title: "Êtes-vous sûr de vouloir supprimer cet étudiant ?",
    showCancelButton: true,
    confirmButtonText: "Supprimer",
    cancelButtonText: "Annuler",
  }).then(async (result) => {
    if (!result.isConfirmed) return;

    try {
      await EtudiantsDAO.getInstance().delete(e.ID!);
      etudiantsList.value = await EtudiantsDAO.getInstance().list();
      Swal.fire("Supprimé", "Étudiant supprimé", "success");
    } catch (err: any) {
      Swal.fire("Erreur", err?.message ?? "Suppression impossible", "error");
    }
  });
};



const columns = [
  {
    field: "EditionEtudiant",
    label: "Édition",
    formatter: formatterEdition,
    onClick: (e: Etudiant) => etudiantsForm.value?.openForm(e),
    style: "width: 32px;text-align:center;",
  },
  { field: "ID", label: "ID", formatter: null, onClick: null, style: null },
  { field: "nom", label: "Nom", formatter: null, onClick: null, style: null },
  { field: "prenom", label: "Prénom", formatter: null, onClick: null, style: null },
  { field: "email", label: "Email", formatter: null, onClick: null, style: null },
  { field: "parcours", label: "Parcours", formatter: formatterParcours, onClick: null, style: null },
  {
    field: "DeleteEtudiant",
    label: "Suppression",
    formatter: formatterSuppression,
    onClick: onDeleteEtudiant,
    style: "width: 32px;text-align:center;",
  },
];

import { ParcoursDAO } from "@/domain/daos/ParcoursDAO";

onMounted(async () => {
  console.log("EtudiantsView mounted");
  try {
    //Charger les parcours
    const parcoursList = await ParcoursDAO.getInstance().list();
    const parcoursById = new Map<number, string>();

    parcoursList.forEach(p => {
      if (p.ID && p.NomParcours) {
        parcoursById.set(p.ID, p.NomParcours);
      }
    });

    //Charger les étudiants
    const etudiants = await EtudiantsDAO.getInstance().list();
    console.log("data etudiants =", etudiants);

    //Injecter le NomParcours dans chaque étudiant
    etudiantsList.value = etudiants.map(e => ({
      ...e,
      parcours: e.parcours_id
        ? { ID: e.parcours_id, NomParcours: parcoursById.get(e.parcours_id) ?? "" }
        : null,
    }));

  } catch (e: any) {
    console.error("list etudiants erreur", e);
    Swal.fire("Erreur", e?.message ?? "Impossible de charger", "error");
  }
});


</script>

<template>
  <div class="container-fluid">
    <div class="card mt-5">
      <div class="card-header d-flex justify-content-between align-items-center">
        <div class="card-title">
          <h4>Liste des Étudiants</h4>
        </div>
            <CustomButton :color="BootstrapButtonEnum.info" @click="openCreate">
                Ajouter un étudiant
            </CustomButton>
      </div>

      <div class="card-body">
        <CustomTable idAttribute="ID" :columns="columns" :data="etudiantsList" />
      </div>
    </div>

    <EtudiantsForm
      ref="etudiantsForm"
      @create:etudiant="onEtudiantCreated"
      @update:etudiant="onEtudiantUpdated"
    />
  </div>
</template>
