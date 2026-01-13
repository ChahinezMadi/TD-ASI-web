import axios from "axios";
import { UE } from "../entities/UE";
import type { Parcours } from "@/domain/entities/Parcours";

export class UeDAO {
  private static instance: UeDAO;

  private constructor() {}

  public static getInstance(): UeDAO {
    if (!UeDAO.instance) UeDAO.instance = new UeDAO();
    return UeDAO.instance;
  }

  async list(): Promise<UE[]> {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/Ue`);
    return (res.data as any[]).map(
      (ue) => new UE(ue.ID, ue.Intitule, ue.NumeroUe, ue.Parcours ?? [])
    );
  }

  async get(id: number): Promise<UE> {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/Ue/${id}`);
    const ue = res.data;
    return new UE(ue.ID, ue.Intitule, ue.NumeroUe, ue.Parcours ?? []);
  }

  async create(data: UE): Promise<UE> {
    const res = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/Ue`,
      data.toJSON()
    );
    const ue = res.data;
    return new UE(ue.ID, ue.Intitule, ue.NumeroUe, ue.Parcours ?? []);
  }

  async update(id: number, data: UE): Promise<UE> {
    try {
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/Ue/${id}`,
        data.toJSON()
      );
      const ue = res.data;
      return new UE(ue.ID, ue.Intitule, ue.NumeroUe, ue.Parcours ?? []);
    } catch (error: any) {
      throw new Error(error?.response?.data?.error || error?.response?.data?.message || "Impossible de modifier l'UE");
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/Ue/${id}`);
    } catch (error: any) {
      throw new Error(error?.response?.data?.error || error?.response?.data?.message || "Impossible de supprimer l'UE");
    }
  }

  // ✅ parcours associés à l'UE (GET /api/Ues/:id/parcours)
  async getParcoursForUe(ueId: number): Promise<Parcours[]> {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/Ues/${ueId}/parcours`);
    return res.data as Parcours[];
  }

  // ✅ définir la liste de parcours associés à l'UE (PUT /api/Ues/:id/parcours)
  async setParcoursForUe(ueId: number, parcoursIds: number[]): Promise<void> {
    await axios.put(`${import.meta.env.VITE_API_URL}/api/Ues/${ueId}/parcours`, { parcoursIds });
  }
}
