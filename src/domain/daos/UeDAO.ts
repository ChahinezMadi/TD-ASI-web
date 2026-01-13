import axios from 'axios';
import type {Parcours} from "@/domain/entities/Parcours";
import { UE } from '../entities/UE';


export class UeDAO {
    private static instance: UeDAO;

    private constructor() {}

    public static getInstance(): UeDAO {
        if (!UeDAO.instance) {
            UeDAO.instance = new UeDAO();
        }
        return UeDAO.instance;
    }

    async list(): Promise<UE[]> {
        const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/Ue`
        );

        return response.data.map(
            (ue: any) =>
                new UE(
                    ue.ID,
                    ue.Intitule,
                    ue.NumeroUe,
                    ue.Parcours ?? []
                )
        );
    }

    async create(data: UE): Promise<UE> {const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/Ue`, data.toJSON());

        const ue = response.data;

        return new UE(
            ue.ID,
            ue.Intitule,
            ue.NumeroUe,
            ue.Parcours ?? []
        );
    }


    public async update(id: number, data: UE): Promise<UE> {
        try {
            const response = await axios.put(
                `${import.meta.env.VITE_API_URL}/api/Ue/${id}`,
                data.toJSON()
            );
            const ue = response.data;
            return new UE(
                ue.ID,
                ue.Intitule,
                ue.NumeroUe,
                ue.Parcours ?? []
            );
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Impossible de modifier l\'UE');
        }
    }
    public async delete(id: number): Promise<void> {
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/Ue/${id}`);
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Impossible de supprimer l\'UE');
        }
    }
}