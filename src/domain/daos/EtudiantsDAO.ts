import axios from "axios";
import type { Parcours } from "@/domain/entities/Parcours";
import { Etudiant } from "@/domain/entities/Etudiant";

export class EtudiantsDAO {
  private static instance: EtudiantsDAO;

  private constructor() {}

  public static getInstance(): EtudiantsDAO {
    if (!EtudiantsDAO.instance) EtudiantsDAO.instance = new EtudiantsDAO();
    return EtudiantsDAO.instance;
  }

  private baseUrl() {
    return `${import.meta.env.VITE_API_URL}/api/etudiants`;
  }

  public async list(): Promise<Etudiant[]> {
    const res = await axios.get(this.baseUrl());
    return (res.data as any[]).map((e) => {
      const parcours =
        e.parcours
          ? e.parcours
          : (e.parcours_id ? ({ ID: e.parcours_id } as Parcours) : null);

      return new Etudiant(e.ID, e.nom, e.prenom, e.email, parcours);
    });
  }

  public async create(data: Etudiant): Promise<Etudiant> {
    try {
      //attendu par le backend (et stable)
      const payload = {
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        parcours_id: data.parcours?.ID ?? null,
      };

      const res = await axios.post(this.baseUrl(), payload);

      // backend: { message, etudiant } ou parfois directement l'objet
      const e = res.data?.etudiant ?? res.data;

      const parcours =
        e.parcours
          ? e.parcours
          : (e.parcours_id ? ({ ID: e.parcours_id } as Parcours) : data.parcours ?? null);

      return new Etudiant(e.ID, e.nom, e.prenom, e.email, parcours);
    } catch (error: any) {
      const msg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Impossible de créer l'étudiant";
      throw new Error(msg);
    }
  }

  public async update(id: number, data: Etudiant): Promise<Etudiant> {
    try {
      //attendu par ton backend
      const payload = {
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        parcours_id: data.parcours?.ID ?? null,
      };

      const res = await axios.put(`${this.baseUrl()}/${id}`, payload);

      //backend: { message, etudiant }
      const e = res.data?.etudiant ?? res.data;

      const parcours =
        e.parcours
          ? e.parcours
          : (e.parcours_id ? ({ ID: e.parcours_id } as Parcours) : data.parcours ?? null);

      return new Etudiant(e.ID ?? id, e.nom ?? data.nom, e.prenom ?? data.prenom, e.email ?? data.email, parcours);
    } catch (error: any) {
      //pour diagnostiquer si c'est 400/404/etc
      console.error("EtudiantsDAO.update error:", error?.response?.status, error?.response?.data, error);

      const msg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Impossible de modifier l'étudiant";
      throw new Error(msg);
    }
  }

  public async delete(id: number): Promise<void> {
    try {
      await axios.delete(`${this.baseUrl()}/${id}`);
    } catch (error: any) {
      const msg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Impossible de supprimer l'étudiant";
      throw new Error(msg);
    }
  }
}
