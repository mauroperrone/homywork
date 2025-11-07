import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Check, Home, Calendar, Wifi, Shield } from "lucide-react";

export default function BecomeHost() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const becomeHostMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/become-host", {}),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Benvenuto tra gli Host!",
        description: "Ora puoi pubblicare la tua prima proprietà.",
      });
      navigate("/proprieta/nuova");
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore. Riprova tra qualche istante.",
        variant: "destructive",
      });
    },
  });

  if (!user) {
    navigate("/");
    return null;
  }

  if (user.role === "host" || user.role === "admin") {
    navigate("/proprieta/nuova");
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-serif mb-4" data-testid="text-become-host-title">
          Diventa Host su HomyWork
        </h1>
        <p className="text-xl text-muted-foreground">
          Condividi il tuo spazio con nomadi digitali e smartworker da tutto il mondo
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-12">
        <Card className="p-6 space-y-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Home className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Guadagno Extra</h3>
          <p className="text-muted-foreground">
            Trasforma il tuo spazio in una fonte di reddito passivo ospitando professionisti da remoto
          </p>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="h-12 w-12 rounded-full bg-chart-2/10 flex items-center justify-center">
            <Shield className="h-6 w-6 text-chart-2" />
          </div>
          <h3 className="text-lg font-semibold">Pagamenti Sicuri</h3>
          <p className="text-muted-foreground">
            Ricevi i pagamenti direttamente con Stripe. Protezione totale per le tue transazioni
          </p>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="h-12 w-12 rounded-full bg-chart-3/10 flex items-center justify-center">
            <Calendar className="h-6 w-6 text-chart-3" />
          </div>
          <h3 className="text-lg font-semibold">Gestione Calendario</h3>
          <p className="text-muted-foreground">
            Sincronizza con Airbnb, Booking.com e Google Calendar per evitare doppie prenotazioni
          </p>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="h-12 w-12 rounded-full bg-chart-4/10 flex items-center justify-center">
            <Wifi className="h-6 w-6 text-chart-4" />
          </div>
          <h3 className="text-lg font-semibold">WiFi Certificato</h3>
          <p className="text-muted-foreground">
            Mostra la velocità reale della tua connessione con il test integrato
          </p>
        </Card>
      </div>

      <Card className="p-8 space-y-6">
        <h2 className="text-2xl font-semibold text-center">Cosa Ottieni Come Host</h2>
        
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium">Profilo Host Verificato</h4>
              <p className="text-sm text-muted-foreground">
                Aumenta la fiducia degli ospiti con un profilo completo e verificato
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium">Dashboard Dedicata</h4>
              <p className="text-sm text-muted-foreground">
                Gestisci le tue proprietà, prenotazioni e guadagni in un unico posto
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium">Supporto Prioritario</h4>
              <p className="text-sm text-muted-foreground">
                Assistenza dedicata per aiutarti a massimizzare le tue prenotazioni
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium">Zero Commissioni di Iscrizione</h4>
              <p className="text-sm text-muted-foreground">
                Inizia a guadagnare subito, senza costi iniziali
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t text-center space-y-4">
          <Button
            size="lg"
            onClick={() => becomeHostMutation.mutate()}
            disabled={becomeHostMutation.isPending}
            className="min-w-[200px]"
            data-testid="button-confirm-become-host"
          >
            {becomeHostMutation.isPending ? "Attivazione..." : "Diventa Host Ora"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Cliccando accetti di diventare host e potrai pubblicare le tue proprietà
          </p>
        </div>
      </Card>
    </div>
  );
}
