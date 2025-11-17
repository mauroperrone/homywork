import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type User, type Property } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Shield, Users, Home, Trash2, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminPanel() {
  const { toast } = useToast();

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
  });

  const { data: properties, isLoading: propertiesLoading } = useQuery<Property[]>({
    queryKey: ['/api/admin/properties'],
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await apiRequest('PATCH', `/api/admin/users/${userId}/role`, { role });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Ruolo aggiornato",
        description: "Il ruolo dell'utente è stato modificato con successo.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Impossibile aggiornare il ruolo dell'utente.",
      });
    },
  });

  const updatePropertyStatusMutation = useMutation({
    mutationFn: async ({ propertyId, isActive }: { propertyId: string; isActive: boolean }) => {
      const res = await apiRequest('PATCH', `/api/admin/properties/${propertyId}/status`, { isActive });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/properties'] });
      toast({
        title: "Stato aggiornato",
        description: "Lo stato della proprietà è stato modificato con successo.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Impossibile aggiornare lo stato della proprietà.",
      });
    },
  });

  const deleteStripeAccountMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest('DELETE', `/api/admin/stripe/delete-account/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Account Stripe Eliminato",
        description: "L'account Stripe è stato eliminato con successo.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.message || "Impossibile eliminare l'account Stripe. L'account potrebbe avere un saldo non pari a zero.",
      });
    },
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-admin-title">Pannello Amministrazione</h1>
          <p className="text-muted-foreground">Gestisci utenti e proprietà della piattaforma</p>
        </div>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" data-testid="tab-users">
            <Users className="w-4 h-4 mr-2" />
            Utenti
          </TabsTrigger>
          <TabsTrigger value="properties" data-testid="tab-properties">
            <Home className="w-4 h-4 mr-2" />
            Proprietà
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestione Utenti</CardTitle>
              <CardDescription>
                Visualizza e modifica i ruoli degli utenti registrati
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <p className="text-center text-muted-foreground py-8">Caricamento utenti...</p>
              ) : users && users.length > 0 ? (
                <div className="space-y-3">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 border rounded-md"
                      data-testid={`user-card-${user.id}`}
                    >
                      <div className="flex items-center gap-4">
                        {user.profileImageUrl && (
                          <img
                            src={user.profileImageUrl}
                            alt={`${user.firstName} ${user.lastName}`}
                            className="w-10 h-10 rounded-full"
                            data-testid={`img-avatar-${user.id}`}
                          />
                        )}
                        <div>
                          <p className="font-medium" data-testid={`text-name-${user.id}`}>
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground" data-testid={`text-email-${user.id}`}>
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} data-testid={`badge-role-${user.id}`}>
                          {user.role === 'admin' ? 'Admin' : user.role === 'host' ? 'Host' : 'Guest'}
                        </Badge>
                        {user.stripeAccountId && (
                          <Badge variant="outline" className="text-xs" data-testid={`badge-stripe-${user.id}`}>
                            Stripe
                          </Badge>
                        )}
                        <Select
                          value={user.role}
                          onValueChange={(role) => updateUserRoleMutation.mutate({ userId: user.id, role })}
                          disabled={updateUserRoleMutation.isPending}
                        >
                          <SelectTrigger className="w-32" data-testid={`select-role-${user.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="guest">Guest</SelectItem>
                            <SelectItem value="host">Host</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        {user.stripeAccountId && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={deleteStripeAccountMutation.isPending}
                                data-testid={`button-delete-stripe-${user.id}`}
                              >
                                {deleteStripeAccountMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Eliminare account Stripe?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Sei sicuro di voler eliminare l'account Stripe di <strong>{user.firstName} {user.lastName}</strong>?
                                  <br /><br />
                                  Questa azione eliminerà definitivamente l'account Stripe Connect Express dell'utente.
                                  L'account deve avere un saldo pari a zero per poter essere eliminato.
                                  <br /><br />
                                  Questa azione non può essere annullata.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel data-testid={`button-cancel-delete-stripe-${user.id}`}>
                                  Annulla
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteStripeAccountMutation.mutate(user.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  data-testid={`button-confirm-delete-stripe-${user.id}`}
                                >
                                  Elimina Account Stripe
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nessun utente trovato</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="properties" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestione Proprietà</CardTitle>
              <CardDescription>
                Visualizza e modifica lo stato di attivazione delle proprietà
              </CardDescription>
            </CardHeader>
            <CardContent>
              {propertiesLoading ? (
                <p className="text-center text-muted-foreground py-8">Caricamento proprietà...</p>
              ) : properties && properties.length > 0 ? (
                <div className="space-y-3">
                  {properties.map((property) => (
                    <div
                      key={property.id}
                      className="flex items-center justify-between p-4 border rounded-md"
                      data-testid={`property-card-${property.id}`}
                    >
                      <div className="flex-1">
                        <p className="font-medium" data-testid={`text-title-${property.id}`}>
                          {property.title}
                        </p>
                        <p className="text-sm text-muted-foreground" data-testid={`text-location-${property.id}`}>
                          {property.city}, {property.country}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          €{property.pricePerNight}/notte
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={property.isActive ? 'default' : 'secondary'} data-testid={`badge-status-${property.id}`}>
                          {property.isActive ? 'Attiva' : 'Disattivata'}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Stato:</span>
                          <Switch
                            checked={property.isActive}
                            onCheckedChange={(isActive) =>
                              updatePropertyStatusMutation.mutate({ propertyId: property.id, isActive })
                            }
                            disabled={updatePropertyStatusMutation.isPending}
                            data-testid={`switch-status-${property.id}`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nessuna proprietà trovata</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
