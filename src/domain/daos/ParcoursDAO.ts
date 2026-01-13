import type { Parcours } from '../entities/Parcours'; 
import type { IDAO } from './IDAO'; 
import axios from 'axios';

export class ParcoursDAO implements IDAO<Parcours> { 
  private static instance: ParcoursDAO; 

  private parcours: Parcours[] = [];
  private idCounter: number = 1;
  
  private constructor() {} 

  public static getInstance(): ParcoursDAO { 
    if (!ParcoursDAO.instance) { 
      ParcoursDAO.instance = new ParcoursDAO(); 
    } 
    return ParcoursDAO.instance; 
  } 

  public async create(data: Parcours): Promise<Parcours> { 
    try { 
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/Parcours`, data); 
      return response.data; 
    } catch (error) { 
      throw new Error('Impossible de créer le nouveau parcours'); 
    } 
  } 

  public async get(id: number): Promise<Parcours> { 
    // Retrieve a Parcours document from the database 
    return { ID: id, NomParcours: 'Parcours 1', AnneeFormation: 2024 }; 
  } 
 
  public async update(id: number, data: Parcours): Promise<Parcours> { 
    // Update a Parcours document in the database 
    return data; 
  } 

public async delete(id: number): Promise<void> {
  try {
    await axios.delete(`${import.meta.env.VITE_API_URL}/api/Parcours/${id}`);
    const index = this.parcours.findIndex(p => p.ID === id);
if (index !== -1) this.parcours.splice(index, 1);
  } catch (error: any) {
    const msg =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      "Impossible de supprimer le parcours";
    throw new Error(msg);
  }
}
 
public async list(): Promise<Parcours[]> {
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/Parcours`);
    this.parcours = response.data;   
    return this.parcours;
  } catch {
    throw new Error('Impossible de récupérer les parcours');
  }
}

public async getInscrits(parcoursId: number): Promise<Array<{ID:number; nom:string; prenom:string; email:string;}>> {
  const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/Parcours/${parcoursId}/inscrits`);
  // res.data = { ...parcours, inscrits: [...] } selon ton service
  return res.data?.inscrits ?? [];
}
} 