import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Truck, Loader2 } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "L'utilisateur est requis"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const result = await apiRequest("POST", "/api/auth/login", data);
      return result;
    },
    onSuccess: (userData) => {
      queryClient.setQueryData(["/api/auth/me"], userData);
      toast({
        title: "Connexion réussie",
        description: "Bienvenue dans l'application de suivi des chargements",
      });
      setTimeout(() => {
        setLocation("/");
      }, 100);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de connexion",
        description: error.message || "Identifiants incorrects",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    await loginMutation.mutateAsync(data);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 px-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Truck className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold">Suivi des Chargements</CardTitle>
            <CardDescription className="text-base mt-2">
              Connectez-vous pour accéder au système de gestion
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Utilisateur</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Entrez votre nom d'utilisateur"
                        data-testid="input-username"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de passe</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Entrez votre mot de passe"
                        data-testid="input-password"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Se connecter
              </Button>
            </form>
          </Form>
          <div className="mt-6 p-4 bg-muted/50 rounded-md">
            <p className="text-xs text-muted-foreground text-center">
              Identifiants de démonstration :<br />
              <span className="font-medium text-foreground">Utilisateur: Superadmin</span><br />
              <span className="font-medium text-foreground">Mot de passe: Administrator</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
