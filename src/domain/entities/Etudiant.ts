import type { Parcours } from "./Parcours";

export interface IEtudiant {
  ID: number | null;
  nom: string | null;
  prenom: string | null;
  email: string | null;
  parcours: Parcours | null;

  toJSON(): object;
}

export class Etudiant implements IEtudiant {
  constructor(
    public ID: number | null,
    public nom: string | null,
    public prenom: string | null,
    public email: string | null,
    public parcours: Parcours | null
  ) {}

  toJSON(): object {
    return {
      nom: this.nom,
      prenom: this.prenom,
      email: this.email,
      parcours_id: this.parcours?.ID ?? null,
    };
  }
}
