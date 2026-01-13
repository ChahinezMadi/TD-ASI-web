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

public async list(): Promise<any[]> {
  const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/etudiants`);
  return res.data;
}

  public async create(data: Etudiant): Promise<Etudiant> {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/etudiants`,
        data.toJSON()
      );

      // ton backend renvoie { message, etudiant }
      const e = res.data?.etudiant ?? res.data;

      return new Etudiant(e.ID, e.nom, e.prenom, e.email, e.parcours ?? null);
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
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/etudiants/${id}`,
        data.toJSON()
      );

      // ton backend renvoie { message, etudiant }
      const e = res.data?.etudiant ?? res.data;

      return new Etudiant(e.ID, e.nom, e.prenom, e.email, e.parcours ?? null);
    } catch (error: any) {
      const msg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Impossible de modifier l'étudiant";
      throw new Error(msg);
    }
  }

  public async delete(id: number): Promise<void> {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/etudiants/${id}`);
    } catch (error: any) {
      const msg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Impossible de supprimer l'étudiant";
      throw new Error(msg);
    }
  }
}
