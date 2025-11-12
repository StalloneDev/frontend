import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertCommandeSchema, type InsertCommande, type Commande } from "@/shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

interface CommandeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commande?: Commande;
}

const getDefaultValues = (commande?: Commande): InsertCommande => {
  if (commande) {
    return {
      client: commande.client,
      numeroBonCommande: (commande as any).numeroBonCommande,
      dateLivraison: format(new Date(commande.dateLivraison), "yyyy-MM-dd"),
      depot: commande.depot,
      camion: commande.camion,
      quantite: typeof commande.quantite === 'string' ? parseFloat(commande.quantite) : Number(commande.quantite),
      produit: commande.produit as "Gazoil" | "Essence" | "Jet A1",
      fournisseur: commande.fournisseur,
      dateChargement: format(new Date(commande.dateChargement), "yyyy-MM-dd"),
      statut: commande.statut as "En cours" | "Livré" | "Non livré",
      transporteur: commande.transporteur,
      destination: commande.destination,
      tauxTransport: typeof commande.tauxTransport === 'string' ? parseFloat(commande.tauxTransport) : Number(commande.tauxTransport),
    };
  }
  
  return {
    client: "",
    numeroBonCommande: "",
    dateLivraison: format(new Date(), "yyyy-MM-dd"),
    depot: "",
    camion: "",
    quantite: 0,
    produit: "Gazoil",
    fournisseur: "",
    dateChargement: format(new Date(), "yyyy-MM-dd"),
    statut: "En cours",
    transporteur: "",
    destination: "",
    tauxTransport: 0,
  };
};

export function CommandeFormDialog({ open, onOpenChange, commande }: CommandeFormDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!commande;

  const form = useForm<InsertCommande>({
    resolver: zodResolver(insertCommandeSchema),
    defaultValues: getDefaultValues(commande),
  });

  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues(commande));
    }
  }, [open, commande, form]);

  const mutation = useMutation({
    mutationFn: async (data: InsertCommande) => {
      if (isEditing) {
        return await apiRequest("PUT", `/api/commandes/${commande.id}`, data);
      } else {
        return await apiRequest("POST", "/api/commandes", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/commandes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: isEditing ? "Commande modifiée" : "Commande créée",
        description: `La commande a été ${isEditing ? "modifiée" : "créée"} avec succès`,
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertCommande) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Modifier la commande" : "Nouvelle commande"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Modifiez les informations de la commande" : "Remplissez les informations de la commande"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="client"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nom du client" data-testid="input-client" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="numeroBonCommande"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>N° bon de commande *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: BC-2025-001" data-testid="input-bon-commande" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fournisseur"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fournisseur *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nom du fournisseur" data-testid="input-fournisseur" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="produit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Produit *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-produit">
                          <SelectValue placeholder="Sélectionnez un produit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Gazoil">Gazoil</SelectItem>
                        <SelectItem value="Essence">Essence</SelectItem>
                        <SelectItem value="Jet A1">Jet A1</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantite"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantité (litres) *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        data-testid="input-quantite"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="depot"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dépôt *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nom du dépôt" data-testid="input-depot" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Lieu de destination" data-testid="input-destination" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="camion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Camion *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Immatriculation du camion" data-testid="input-camion" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="transporteur"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transporteur *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nom du transporteur" data-testid="input-transporteur" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dateChargement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de chargement *</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value)}
                        data-testid="input-date-chargement"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dateLivraison"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de livraison *</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value)}
                        data-testid="input-date-livraison"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="statut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-statut">
                          <SelectValue placeholder="Sélectionnez un statut" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="En cours">En cours</SelectItem>
                        <SelectItem value="Livré">Livré</SelectItem>
                        <SelectItem value="Non livré">Non livré</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tauxTransport"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taux de transport *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        data-testid="input-taux"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
                data-testid="button-cancel"
              >
                Annuler
              </Button>
              <Button type="submit" disabled={mutation.isPending} data-testid="button-save">
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Modifier" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
