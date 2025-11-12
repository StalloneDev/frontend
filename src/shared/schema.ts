import { z } from "zod";

export const produitEnum = z.enum(["Gazoil", "Essence", "Jet A1"]);
export type Produit = z.infer<typeof produitEnum>;

export const statutEnum = z.enum(["En cours", "Livré", "Non livré"]);
export type Statut = z.infer<typeof statutEnum>;

export const insertCommandeSchema = z.object({
  client: z.string().min(1, "Le client est requis"),
  numeroBonCommande: z.string().min(1, "Le numéro de bon de commande est requis"),
  dateLivraison: z
    .string({ required_error: "La date de livraison est requise" })
    .refine((value) => !Number.isNaN(Date.parse(value)), "Date de livraison invalide"),
  depot: z.string().min(1, "Le dépôt est requis"),
  camion: z.string().min(1, "Le camion est requis"),
  quantite: z.coerce.number().positive("La quantité doit être positive"),
  produit: produitEnum,
  fournisseur: z.string().min(1, "Le fournisseur est requis"),
  dateChargement: z
    .string({ required_error: "La date de chargement est requise" })
    .refine((value) => !Number.isNaN(Date.parse(value)), "Date de chargement invalide"),
  statut: statutEnum,
  transporteur: z.string().min(1, "Le transporteur est requis"),
  destination: z.string().min(1, "La destination est requise"),
  tauxTransport: z.coerce.number().positive("Le taux de transport doit être positif"),
});

export type InsertCommande = z.infer<typeof insertCommandeSchema>;

export interface Commande {
  id: string;
  client: string;
  numeroBonCommande: string;
  dateLivraison: string;
  depot: string;
  camion: string;
  quantite: number | string;
  produit: "Gazoil" | "Essence" | "Jet A1";
  fournisseur: string;
  dateChargement: string;
  statut: "En cours" | "Livré" | "Non livré";
  transporteur: string;
  destination: string;
  tauxTransport: number | string;
  createdAt: string;
}


