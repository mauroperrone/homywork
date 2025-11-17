import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, ExternalLink, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface StripeStatus {
  hasAccount: boolean;
  onboardingComplete: boolean;
  chargesEnabled: boolean;
  payoutsEnabled?: boolean;
}

export function StripeConnectOnboarding() {
  const { toast } = useToast();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const { data: stripeStatus, isLoading } = useQuery<StripeStatus>({
    queryKey: ["/api/host/stripe/status"],
    refetchOnWindowFocus: true,
  });

  const createAccountMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/host/stripe/create-account");
    },
    onSuccess: async () => {
      // Don't invalidate queries yet - do it after onboarding redirect
      // This prevents re-render that breaks the redirect flow
      toast({
        title: "Account Stripe Creato",
        description: "Reindirizzamento a Stripe...",
      });
      
      // Start onboarding immediately
      startOnboarding();
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante la creazione dell'account Stripe",
        variant: "destructive",
      });
    },
  });

  const startOnboarding = async (retryCount = 0) => {
    try {
      setIsRedirecting(true);
      const response = await apiRequest("POST", "/api/host/stripe/onboarding-link");
      
      if (response.url) {
        // Redirect to Stripe onboarding
        window.location.href = response.url;
      } else {
        throw new Error("No onboarding URL received");
      }
    } catch (error: any) {
      // Retry once after 1 second if account was just created
      if (retryCount === 0 && error.message?.includes("No Stripe account")) {
        setTimeout(() => startOnboarding(1), 1000);
        return;
      }
      
      setIsRedirecting(false);
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'apertura del processo di configurazione",
        variant: "destructive",
      });
    }
  };

  const openDashboard = async () => {
    try {
      setIsRedirecting(true);
      const response = await apiRequest("POST", "/api/host/stripe/dashboard-link");
      window.open(response.url, "_blank");
      setIsRedirecting(false);
    } catch (error: any) {
      setIsRedirecting(false);
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'apertura della dashboard Stripe",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p className="text-sm text-muted-foreground">Caricamento stato pagamenti...</p>
        </div>
      </Card>
    );
  }

  if (!stripeStatus?.hasAccount) {
    return (
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">Configura i Pagamenti</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Per ricevere pagamenti dai tuoi ospiti, devi collegare un account Stripe.
              Stripe gestirà in modo sicuro tutti i pagamenti e i trasferimenti.
            </p>
            <Button
              onClick={() => createAccountMutation.mutate()}
              disabled={createAccountMutation.isPending}
              data-testid="button-create-stripe-account"
            >
              {createAccountMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creazione...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Collega Account Stripe
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (!stripeStatus.onboardingComplete) {
    return (
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-yellow-500/10 rounded-full">
            <AlertCircle className="h-6 w-6 text-yellow-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold">Configurazione Incompleta</h3>
              <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                In Attesa
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Il tuo account Stripe è stato creato ma la configurazione non è completa.
              Completa i passaggi richiesti da Stripe per iniziare a ricevere pagamenti.
            </p>
            <Button
              onClick={() => startOnboarding()}
              disabled={isRedirecting}
              data-testid="button-complete-onboarding"
            >
              {isRedirecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Reindirizzamento...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Completa Configurazione
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-chart-2/10 rounded-full">
          <CheckCircle2 className="h-6 w-6 text-chart-2" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold">Pagamenti Attivi</h3>
            <Badge variant="default" className="bg-chart-2" data-testid="badge-stripe-active">
              Attivo
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Il tuo account Stripe è configurato e attivo. Puoi ricevere pagamenti dai tuoi ospiti.
            {stripeStatus.payoutsEnabled && " I trasferimenti sono abilitati."}
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={openDashboard}
              disabled={isRedirecting}
              data-testid="button-open-stripe-dashboard"
            >
              {isRedirecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Apertura...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Apri Dashboard Stripe
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
