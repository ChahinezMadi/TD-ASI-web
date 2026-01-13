<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import Swal from "sweetalert2";

import CustomInput from "@/presentation/components/forms/components/CustomInput.vue";
import CustomButton from "@/presentation/components/forms/components/CustomButton.vue";
import { BootstrapButtonEnum } from "@/types/BootstrapButtonEnum";

import { UeDAO } from "@/domain/daos/UeDAO";
import { ParcoursDAO } from "@/domain/daos/ParcoursDAO";

import type { UE } from "@/domain/entities/UE";
import type { Parcours } from "@/domain/entities/Parcours";

import vSelect from "vue-select";
import "vue-select/dist/vue-select.css";

type StudentRow = {
  ID: number;
  nom: string;
  prenom: string;
  email: string;
  note: number | null; // null => "__"
};

const route = useRoute();
const ueId = Number(route.params.id);

const ue = ref<UE | null>(null);

// Parcours
const allParcours = ref<Parcours[]>([]);
const ueParcours = ref<Parcours[]>([]);
const parcoursToAdd = ref<Parcours[]>([]);

// Etudiants + notes (front only)
const students = ref<StudentRow[]>([]);
const notesKey = computed(() => `ue_notes_${ueId}`);
const notes = ref<Record<number, number>>({}); // etudiantId -> note

// ---------------- NOTES (LOCAL STORAGE) ----------------
function loadNotes() {
  try {
    const raw = localStorage.getItem(notesKey.value);
    notes.value = raw ? JSON.parse(raw) : {};
  } catch {
    notes.value = {};
  }
}

function saveNotes() {
  localStorage.setItem(notesKey.value, JSON.stringify(notes.value));
}

function displayNote(n: number | null) {
  return n === null || Number.isNaN(n) ? "__" : String(n);
}

// ---------------- PARCOURS NORMALIZATION ----------------
function normalizeParcours(raw: any): Parcours[] {
  if (Array.isArray(raw)) return raw;

  if (raw?.parcours && Array.isArray(raw.parcours)) return raw.parcours;
  if (raw?.Parcours && Array.isArray(raw.Parcours)) return raw.Parcours;

  if (raw?.ue?.parcours && Array.isArray(raw.ue.parcours)) return raw.ue.parcours;
  if (raw?.ue?.Parcours && Array.isArray(raw.ue.Parcours)) return raw.ue.Parcours;

  return [];
}

async function reloadParcours() {
  const raw = await UeDAO.getInstance().getParcoursForUe(ueId);
  ueParcours.value = normalizeParcours(raw);
}

// ---------------- COMPUTED ----------------
const existingParcoursIds = computed(() => {
  const arr = Array.isArray(ueParcours.value) ? ueParcours.value : [];
  return new Set(arr.map((p) => p.ID!));
});

const availableParcoursToAdd = computed(() => {
  return allParcours.value.filter((p) => !existingParcoursIds.value.has(p.ID!));
});

// ---------------- REFRESH STUDENTS ----------------
async function refreshStudents() {
  const map = new Map<number, StudentRow>();
  const parcoursArr = Array.isArray(ueParcours.value) ? ueParcours.value : [];

  for (const p of parcoursArr) {
    const inscrits = await ParcoursDAO.getInstance().getInscrits(p.ID!);
    for (const s of inscrits) {
      map.set(s.ID, {
        ID: s.ID,
        nom: s.nom,
        prenom: s.prenom,
        email: s.email,
        note: notes.value[s.ID] ?? null,
      });
    }
  }

  const merged = Array.from(map.values());
  merged.sort((a, b) => (a.nom + a.prenom).localeCompare(b.nom + b.prenom));
  students.value = merged;
}

// ---------------- LOAD ALL ----------------
async function loadAll() {
  try {
    loadNotes();

    ue.value = await UeDAO.getInstance().get(ueId);
    allParcours.value = await ParcoursDAO.getInstance().list();

    await reloadParcours();
    await refreshStudents();
  } catch (e: any) {
    console.error(e);
    Swal.fire("Erreur", e?.message ?? "Impossible de charger la page UE", "error");
  }
}

// ---------------- ACTIONS ----------------
async function saveUeBasics() {
  if (!ue.value) return;
  try {
    ue.value = await UeDAO.getInstance().update(ueId, ue.value);
    Swal.fire("OK", "UE mise à jour", "success");
  } catch (e: any) {
    console.error(e);
    Swal.fire("Erreur", e?.message ?? "Impossible de modifier l'UE", "error");
  }
}

async function addParcours() {
  if (parcoursToAdd.value.length === 0) return;

  try {
    const current = Array.isArray(ueParcours.value) ? ueParcours.value : [];
    const newIds = [
      ...current.map((p) => p.ID!),
      ...parcoursToAdd.value.map((p) => p.ID!),
    ];

    await UeDAO.getInstance().setParcoursForUe(ueId, newIds);
    await reloadParcours();

    parcoursToAdd.value = [];
    await refreshStudents();
  } catch (e: any) {
    console.error(e);
    Swal.fire("Erreur", e?.message ?? "Impossible d'ajouter les parcours", "error");
  }
}

async function removeParcours(parcoursId: number) {
  try {
    const current = Array.isArray(ueParcours.value) ? ueParcours.value : [];
    const newIds = current.filter((p) => p.ID !== parcoursId).map((p) => p.ID!);

    await UeDAO.getInstance().setParcoursForUe(ueId, newIds);
    await reloadParcours();

    await refreshStudents();
  } catch (e: any) {
    console.error(e);
    Swal.fire("Erreur", e?.message ?? "Impossible de supprimer le parcours", "error");
  }
}

async function editNote(etudiantId: number) {
  const current = notes.value[etudiantId];

  const { value } = await Swal.fire({
    title: "Note sur 20",
    input: "number",
    inputValue: current ?? "",
    inputAttributes: { min: "0", max: "20", step: "0.5" },
    showCancelButton: true,
    inputValidator: (v) => {
      if (v === "") return null; // vide => "__"
      const num = Number(v);
      if (Number.isNaN(num) || num < 0 || num > 20) return "Note invalide (0 à 20)";
      return null;
    },
  });

  if (value === undefined) return; // cancel

  if (value === "") {
    delete notes.value[etudiantId];
  } else {
    notes.value[etudiantId] = Number(value);
  }

  saveNotes();
  await refreshStudents();
}

onMounted(loadAll);
</script>

<template>
  <div class="container-fluid mt-4" v-if="ue">
    <div class="row">
      <!-- COLONNE GAUCHE : UE + NOTES -->
      <div class="col-md-6">
        <!-- Modifier UE -->
        <div class="card p-3 mb-3">
          <h5>Modifier l'UE</h5>

          <div class="row align-items-end">
            <div class="col-4">
              <CustomInput
                id="numeroUe"
                v-model="ue.NumeroUe"
                libelle="Numéro"
                type="text"
                placeholder="UE1"
                :error="null"
              />
            </div>

            <div class="col">
              <CustomInput
                id="intituleUe"
                v-model="ue.Intitule"
                libelle="Intitulé"
                type="text"
                placeholder="..."
                :error="null"
              />
            </div>

            <div class="col-auto">
              <CustomButton
                :color="BootstrapButtonEnum.info"
                @click="saveUeBasics"
              >
                Enregistrer
              </CustomButton>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div class="card p-3">
          <h5>Notes</h5>

          <div v-if="students.length === 0" class="text-muted">
            Aucun étudiant (aucun parcours lié ou aucun inscrit).
          </div>

          <div
            v-for="s in students"
            :key="s.ID"
            class="d-flex justify-content-between align-items-center border rounded p-2 mb-2"
          >
            <div>
              {{ s.nom }} {{ s.prenom }}
            </div>

            <button
              class="btn btn-outline-dark"
              style="width: 90px"
              @click="editNote(s.ID)"
            >
              {{ displayNote(s.note) }} / 20
            </button>
          </div>
        </div>
      </div>

      <!-- COLONNE DROITE : PARCOURS -->
      <div class="col-md-6">
        <div class="card p-3 h-100">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h5 class="m-0">Parcours</h5>

            <div class="d-flex gap-2 align-items-center">
              <div style="min-width: 220px">
                <vSelect
                  multiple
                  label="NomParcours"
                  :options="availableParcoursToAdd"
                  v-model="parcoursToAdd"
                  placeholder="Ajouter..."
                />
              </div>

              <CustomButton
                :color="BootstrapButtonEnum.success"
                @click="addParcours"
              >
                +
              </CustomButton>
            </div>
          </div>

          <div v-if="ueParcours.length === 0" class="text-muted text-center">
            Aucun parcours associé
          </div>

          <div
            v-for="p in ueParcours"
            :key="p.ID"
            class="d-flex justify-content-between align-items-center border rounded p-2 mb-2"
          >
            <div>{{ p.NomParcours }}</div>

            <CustomButton
              :color="BootstrapButtonEnum.danger"
              @click="removeParcours(p.ID!)"
            >
              -
            </CustomButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
