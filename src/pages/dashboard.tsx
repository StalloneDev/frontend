import { useState, useMemo } from "react";
import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { type Commande } from "@/shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { StatCard } from "@/components/stat-card";
import { CommandeFormDialog } from "@/components/commande-form-dialog";
import {
  Plus,
  LogOut,
  Package,
  TrendingUp,
  Users,
  Truck,
  Download,
  Upload,
  Pencil,
  Trash2,
  FileSpreadsheet,
  Search,
  BarChart3,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import * as XLSX from "xlsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))"];

export default function Dashboard() {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCommande, setEditingCommande] = useState<Commande | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commandeToDelete, setCommandeToDelete] = useState<string | null>(null);
  const [filterStatut, setFilterStatut] = useState<string>("all");
  const [filterProduit, setFilterProduit] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: commandes = [], isLoading } = useQuery<Commande[]>({
    queryKey: ["/api/commandes"],
  });

  const { data: stats } = useQuery<any>({
    queryKey: ["/api/stats"],
  });

  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/commandes/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/commandes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Commande supprimée",
        description: "La commande a été supprimée avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    },
  });

  const filteredCommandes = useMemo(() => {
    const result = commandes.filter((cmd) => {
      const matchesStatut = filterStatut === "all" || cmd.statut === filterStatut;
      const matchesProduit = filterProduit === "all" || cmd.produit === filterProduit;
      const matchesSearch =
        searchQuery === "" ||
        cmd.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmd.transporteur.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmd.depot.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatut && matchesProduit && matchesSearch;
    });
    return result;
  }, [commandes, filterStatut, filterProduit, searchQuery]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredCommandes.length / pageSize));
  }, [filteredCommandes.length, pageSize]);

  const paginatedCommandes = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCommandes.slice(start, start + pageSize);
  }, [filteredCommandes, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [filterStatut, filterProduit, searchQuery]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const monthlyData = useMemo(() => {
    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(new Date(), 11 - i);
      return {
        month: format(date, "MMM yyyy", { locale: fr }),
        start: startOfMonth(date),
        end: endOfMonth(date),
      };
    });

    return last12Months.map(({ month, start, end }) => {
      const monthCommandes = commandes.filter((cmd) => {
        const date = new Date(cmd.dateChargement);
        return !Number.isNaN(date.getTime()) && date >= start && date <= end;
      });

      const gazoil = monthCommandes
        .filter((c) => c.produit === "Gazoil")
        .reduce((sum, c) => {
          const qty = typeof c.quantite === 'string' ? parseFloat(c.quantite) : Number(c.quantite);
          return sum + (isNaN(qty) ? 0 : qty);
        }, 0);
      const essence = monthCommandes
        .filter((c) => c.produit === "Essence")
        .reduce((sum, c) => {
          const qty = typeof c.quantite === 'string' ? parseFloat(c.quantite) : Number(c.quantite);
          return sum + (isNaN(qty) ? 0 : qty);
        }, 0);
      const jetA1 = monthCommandes
        .filter((c) => c.produit === "Jet A1")
        .reduce((sum, c) => {
          const qty = typeof c.quantite === 'string' ? parseFloat(c.quantite) : Number(c.quantite);
          return sum + (isNaN(qty) ? 0 : qty);
        }, 0);

      return {
        month,
        Gazoil: Math.round(gazoil),
        Essence: Math.round(essence),
        "Jet A1": Math.round(jetA1),
      };
    });
  }, [commandes]);

  const productData = useMemo(() => {
    const gazoil = commandes
      .filter((c) => c.produit === "Gazoil")
      .reduce((sum, c) => {
        const qty = typeof c.quantite === 'string' ? parseFloat(c.quantite) : Number(c.quantite);
        return sum + (isNaN(qty) ? 0 : qty);
      }, 0);
    const essence = commandes
      .filter((c) => c.produit === "Essence")
      .reduce((sum, c) => {
        const qty = typeof c.quantite === 'string' ? parseFloat(c.quantite) : Number(c.quantite);
        return sum + (isNaN(qty) ? 0 : qty);
      }, 0);
    const jetA1 = commandes
      .filter((c) => c.produit === "Jet A1")
      .reduce((sum, c) => {
        const qty = typeof c.quantite === 'string' ? parseFloat(c.quantite) : Number(c.quantite);
        return sum + (isNaN(qty) ? 0 : qty);
      }, 0);

    return [
      { name: "Gazoil", value: Math.round(gazoil) },
      { name: "Essence", value: Math.round(essence) },
      { name: "Jet A1", value: Math.round(jetA1) },
    ].filter((item) => item.value > 0);
  }, [commandes]);

  const handleEdit = (commande: Commande) => {
    setEditingCommande(commande);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setCommandeToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (commandeToDelete) {
      deleteMutation.mutate(commandeToDelete);
      setDeleteDialogOpen(false);
      setCommandeToDelete(null);
    }
  };

  const handleExport = () => {
    const exportData = filteredCommandes.map((cmd) => ({
      "N° Bon de commande": (cmd as any).numeroBonCommande,
      Client: cmd.client,
      "Date de livraison": format(new Date(cmd.dateLivraison), "dd/MM/yyyy"),
      Dépôt: cmd.depot,
      Camion: cmd.camion,
      "Quantité (L)": cmd.quantite,
      Produit: cmd.produit,
      Fournisseur: cmd.fournisseur,
      "Date de chargement": format(new Date(cmd.dateChargement), "dd/MM/yyyy"),
      Statut: cmd.statut,
      Transporteur: cmd.transporteur,
      Destination: cmd.destination,
      "Taux de transport": cmd.tauxTransport,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Commandes");
    XLSX.writeFile(wb, `commandes_${format(new Date(), "yyyy-MM-dd")}.xlsx`);

    toast({
      title: "Export réussi",
      description: `${exportData.length} commande(s) exportée(s) avec succès`,
    });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const parseExcelDate = (value: any) => {
          const parsed = new Date(value);
          return Number.isNaN(parsed.getTime()) ? "" : format(parsed, "yyyy-MM-dd");
        };

        for (const row of jsonData) {
          const cmd: any = row;
          const commandeData = {
            numeroBonCommande: cmd["N° Bon de commande"] || cmd["Numero bon de commande"] || cmd["Numero Bon de commande"] || "",
            client: cmd.Client || "",
            dateLivraison: parseExcelDate(cmd["Date de livraison"]),
            depot: cmd.Dépôt || "",
            camion: cmd.Camion || "",
            quantite: Number(cmd["Quantité (L)"] || 0),
            produit: cmd.Produit || "Gazoil",
            fournisseur: cmd.Fournisseur || "",
            dateChargement: parseExcelDate(cmd["Date de chargement"]),
            statut: cmd.Statut || "En cours",
            transporteur: cmd.Transporteur || "",
            destination: cmd.Destination || "",
            tauxTransport: Number(cmd["Taux de transport"] || 0),
          };

          await apiRequest("POST", "/api/commandes", commandeData);
        }

        queryClient.invalidateQueries({ queryKey: ["/api/commandes"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });

        toast({
          title: "Import réussi",
          description: `${jsonData.length} commande(s) importée(s) avec succès`,
        });

        event.target.value = "";
      } catch (error) {
        toast({
          title: "Erreur d'import",
          description: "Vérifiez le format du fichier Excel",
          variant: "destructive",
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const getStatutBadgeVariant = (statut: string) => {
    switch (statut) {
      case "Livré":
        return "default";
      case "En cours":
        return "secondary";
      case "Non livré":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Suivi des Chargements</h1>
                <p className="text-sm text-muted-foreground">Gestion des marchandises</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                title={theme === "dark" ? "Passer en mode clair" : "Passer en mode bleu nuit"}
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <div className="text-right">
                <p className="text-sm font-medium">{user?.username}</p>
                <p className="text-xs text-muted-foreground">Administrateur</p>
              </div>
              <Button variant="outline" size="icon" onClick={logout} data-testid="button-logout">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-8">
      <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Quantité du mois par produit
            </CardTitle>
            <CardDescription>Somme des quantités pour le mois courant</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard title="Gazoil" value={`${Math.round(stats?.quantiteParProduit?.["Gazoil"] || 0)} L`} icon={BarChart3} />
              <StatCard title="Essence" value={`${Math.round(stats?.quantiteParProduit?.["Essence"] || 0)} L`} icon={BarChart3} />
              <StatCard title="Jet A1" value={`${Math.round(stats?.quantiteParProduit?.["Jet A1"] || 0)} L`} icon={BarChart3} />
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Total Commandes"
            value={stats?.totalCommandes || 0}
            icon={Package}
            description="Ce mois"
            tone="orange"
          />
          <StatCard
            title="Quantité Totale"
            value={`${stats?.totalQuantite || 0} L`}
            icon={TrendingUp}
            description="Tous produits confondus"
            tone="brown"
          />
          <StatCard
            title="Meilleur Client"
            value={stats?.meilleurClient || "N/A"}
            icon={Users}
            description={`${stats?.meilleurClientCommandes || 0} commandes`}
            tone="blue"
          />
          <StatCard
            title="Client le moins actif"
            value={stats?.moinsClient || "N/A"}
            icon={Users}
            description={`${stats?.moinsClientCommandes || 0} commandes`}
            tone="black"
          />
          <StatCard
            title="Meilleur Transporteur"
            value={stats?.meilleurTransporteur || "N/A"}
            icon={Truck}
            description={`${stats?.meilleurTransporteurLivraisons || 0} livraisons (ce mois)`}
            tone="orange"
          />
          <StatCard
            title="Dépôt le plus actif"
            value={stats?.depotPlusActif || "N/A"}
            icon={Package}
            description={`${stats?.depotPlusActifQuantite || 0} L (ce mois)`}
            tone="brown"
          />
        </div>

        

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Évolution Mensuelle
              </CardTitle>
              <CardDescription>Quantités par produit sur 12 mois</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" interval={0} angle={-30} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Gazoil" fill="hsl(var(--chart-1))" />
                  <Bar dataKey="Essence" fill="hsl(var(--chart-2))" />
                  <Bar dataKey="Jet A1" fill="hsl(var(--chart-3))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Répartition par Produit
              </CardTitle>
              <CardDescription>Distribution totale des quantités</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={productData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {productData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Liste des Commandes</CardTitle>
                <CardDescription>Gérez toutes vos commandes de marchandises</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label htmlFor="import-file">
                  <Button variant="outline" size="sm" asChild data-testid="button-import">
                    <span>
                      <Upload className="mr-2 h-4 w-4" />
                      Importer
                    </span>
                  </Button>
                </label>
                <input
                  id="import-file"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImport}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  data-testid="button-export"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exporter
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingCommande(undefined);
                    setDialogOpen(true);
                  }}
                  data-testid="button-new-commande"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle Commande
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par client, transporteur, dépôt..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
              <Select value={filterStatut} onValueChange={setFilterStatut}>
                <SelectTrigger className="w-full md:w-[180px]" data-testid="select-filter-statut">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="En cours">En cours</SelectItem>
                  <SelectItem value="Livré">Livré</SelectItem>
                  <SelectItem value="Non livré">Non livré</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterProduit} onValueChange={setFilterProduit}>
                <SelectTrigger className="w-full md:w-[180px]" data-testid="select-filter-produit">
                  <SelectValue placeholder="Produit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les produits</SelectItem>
                  <SelectItem value="Gazoil">Gazoil</SelectItem>
                  <SelectItem value="Essence">Essence</SelectItem>
                  <SelectItem value="Jet A1">Jet A1</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Bon</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead>Quantité</TableHead>
                    <TableHead>Transporteur</TableHead>
                    <TableHead>Dépôt</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date Livraison</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        Chargement...
                      </TableCell>
                    </TableRow>
                  ) : filteredCommandes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        Aucune commande trouvée
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedCommandes.map((commande) => (
                      <TableRow key={commande.id} data-testid={`row-commande-${commande.id}`}>
                        <TableCell className="font-medium">{(commande as any).numeroBonCommande}</TableCell>
                        <TableCell className="font-medium">{commande.client}</TableCell>
                        <TableCell>{commande.produit}</TableCell>
                        <TableCell>{Number(commande.quantite).toLocaleString()} L</TableCell>
                        <TableCell>{commande.transporteur}</TableCell>
                        <TableCell>{commande.depot}</TableCell>
                        <TableCell>{commande.destination}</TableCell>
                        <TableCell>
                          <Badge variant={getStatutBadgeVariant(commande.statut)}>
                            {commande.statut}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(commande.dateLivraison), "dd/MM/yyyy", { locale: fr })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(commande)}
                              data-testid={`button-edit-${commande.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(commande.id)}
                              data-testid={`button-delete-${commande.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
              <div className="text-sm text-muted-foreground">
                Page {page} sur {totalPages} • {filteredCommandes.length} commande(s)
              </div>
              <div className="flex items-center gap-2">
                <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Taille" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 / page</SelectItem>
                    <SelectItem value="10">10 / page</SelectItem>
                    <SelectItem value="20">20 / page</SelectItem>
                    <SelectItem value="50">50 / page</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                    Précédent
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                    Suivant
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <CommandeFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingCommande(undefined);
        }}
        commande={editingCommande}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette commande ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} data-testid="button-confirm-delete">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
