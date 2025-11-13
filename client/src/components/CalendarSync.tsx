import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Loader2, Plus, Trash2, Link as LinkIcon, Calendar } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface CalendarSyncProps {
  propertyId: string;
}

interface CalendarSync {
  id: string;
  propertyId: string;
  platform: string;
  icalUrl: string | null;
  syncEnabled: boolean;
  lastSyncedAt: string | null;
  createdAt: string;
}

export function CalendarSync({ propertyId }: CalendarSyncProps) {
  const [platform, setPlatform] = useState<string>("");
  const [icalUrl, setIcalUrl] = useState("");
  const { toast } = useToast();

  // Fetch calendar syncs for property
  const { data: syncs = [], isLoading } = useQuery<CalendarSync[]>({
    queryKey: ['/api/properties', propertyId, 'calendar-syncs'],
    queryFn: async () => {
      const res = await fetch(`/api/properties/${propertyId}/calendar-syncs`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error('Failed to fetch calendar syncs');
      }
      return res.json();
    },
    enabled: !!propertyId,
  });

  // Create calendar sync mutation
  const createSyncMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/properties/${propertyId}/calendar-syncs`, {
        platform,
        icalUrl,
        syncEnabled: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/properties', propertyId, 'calendar-syncs'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/properties', propertyId, 'availability'] 
      });
      setPlatform("");
      setIcalUrl("");
      toast({
        title: "Sincronizzazione aggiunta",
        description: "Il calendario esterno è stato collegato con successo.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.message || "Impossibile aggiungere la sincronizzazione.",
      });
    },
  });

  // Delete calendar sync mutation
  const deleteSyncMutation = useMutation({
    mutationFn: async (syncId: string) => {
      return apiRequest('DELETE', `/api/calendar-syncs/${syncId}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/properties', propertyId, 'calendar-syncs'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/properties', propertyId, 'availability'] 
      });
      toast({
        title: "Sincronizzazione rimossa",
        description: "Il collegamento al calendario esterno è stato rimosso.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.message || "Impossibile rimuovere la sincronizzazione.",
      });
    },
  });

  const handleAddSync = () => {
    if (!platform || !icalUrl.trim()) {
      toast({
        variant: "destructive",
        title: "Campi mancanti",
        description: "Seleziona una piattaforma e inserisci l'URL iCal.",
      });
      return;
    }

    createSyncMutation.mutate();
  };

  const handleDeleteSync = (syncId: string) => {
    if (confirm("Sei sicuro di voler rimuovere questa sincronizzazione?")) {
      deleteSyncMutation.mutate(syncId);
    }
  };

  const getPlatformLabel = (platform: string) => {
    switch (platform) {
      case 'airbnb': return 'Airbnb';
      case 'booking': return 'Booking.com';
      case 'google': return 'Google Calendar';
      default: return platform;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'airbnb': return 'bg-chart-1';
      case 'booking': return 'bg-chart-2';
      case 'google': return 'bg-chart-3';
      default: return 'bg-muted';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Sincronizzazione Calendari Esterni
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Sync Form */}
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Sincronizza il tuo calendario con Airbnb, Booking.com o altri servizi per evitare doppie prenotazioni.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Piattaforma</label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger data-testid="select-platform-sync">
                  <SelectValue placeholder="Seleziona piattaforma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="airbnb">Airbnb</SelectItem>
                  <SelectItem value="booking">Booking.com</SelectItem>
                  <SelectItem value="google">Google Calendar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">URL iCal</label>
              <Input
                type="url"
                placeholder="https://..."
                value={icalUrl}
                onChange={(e) => setIcalUrl(e.target.value)}
                data-testid="input-ical-url"
              />
            </div>
          </div>

          <Button
            onClick={handleAddSync}
            disabled={createSyncMutation.isPending}
            className="w-full sm:w-auto"
            data-testid="button-add-sync"
          >
            {createSyncMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Aggiungi Sincronizzazione
          </Button>
        </div>

        {/* Existing Syncs List */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Calendari Sincronizzati</h3>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : syncs.length > 0 ? (
            <div className="space-y-2">
              {syncs.map((sync) => (
                <div
                  key={sync.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                  data-testid={`sync-item-${sync.id}`}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className={getPlatformColor(sync.platform)} data-testid={`badge-platform-${sync.id}`}>
                        {getPlatformLabel(sync.platform)}
                      </Badge>
                      {sync.syncEnabled ? (
                        <Badge variant="outline" className="bg-chart-2/20" data-testid={`badge-status-${sync.id}`}>Attivo</Badge>
                      ) : (
                        <Badge variant="outline" data-testid={`badge-status-${sync.id}`}>Disattivo</Badge>
                      )}
                    </div>
                    {sync.icalUrl && (
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1" data-testid={`text-ical-url-${sync.id}`}>
                        <LinkIcon className="h-3 w-3 flex-shrink-0" />
                        {sync.icalUrl}
                      </p>
                    )}
                    {sync.lastSyncedAt && (
                      <p className="text-xs text-muted-foreground" data-testid={`text-last-synced-${sync.id}`}>
                        Ultima sincronizzazione: {format(new Date(sync.lastSyncedAt), 'dd MMM yyyy HH:mm', { locale: it })}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteSync(sync.id)}
                    disabled={deleteSyncMutation.isPending}
                    data-testid={`button-delete-sync-${sync.id}`}
                  >
                    {deleteSyncMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-destructive" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border rounded-lg bg-muted/20">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground" data-testid="text-no-syncs">
                Nessun calendario sincronizzato
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
