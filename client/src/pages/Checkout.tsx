import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { Property, Booking } from "@shared/schema";
import { Calendar, MapPin, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface CheckoutFormProps {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  clientSecret: string;
}

function CheckoutForm({ propertyId, checkIn, checkOut, guests, totalPrice, clientSecret }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/booking-success`,
        },
        redirect: "if_required",
      });

      if (error) {
        toast({
          title: "Pagamento Fallito",
          description: error.message,
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        // Create booking with payment confirmation
        const booking = (await apiRequest("POST", "/api/bookings", {
          propertyId,
          checkIn: new Date(checkIn),
          checkOut: new Date(checkOut),
          guests,
          totalPrice,
        })) as unknown as Booking;

        // Confirm booking with payment intent ID
        await apiRequest("POST", `/api/bookings/${booking.id}/confirm`, {
          paymentIntentId: paymentIntent.id,
        });

        queryClient.invalidateQueries({ queryKey: ["/api/guest/bookings"] });
        
        toast({
          title: "Prenotazione Confermata!",
          description: "La tua prenotazione è stata confermata con successo.",
        });

        navigate("/prenotazioni");
      }
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Si è verificato un errore durante la prenotazione.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={!stripe || !elements || isProcessing}
        data-testid="button-confirm-payment"
      >
        {isProcessing ? "Elaborazione..." : `Paga €${totalPrice}`}
      </Button>
    </form>
  );
}

export default function Checkout() {
  const [, params] = useRoute("/checkout");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Parse query params
  const urlParams = new URLSearchParams(window.location.search);
  const propertyId = urlParams.get("propertyId");
  const checkIn = urlParams.get("checkIn");
  const checkOut = urlParams.get("checkOut");
  const guests = parseInt(urlParams.get("guests") || "1");
  const totalPrice = parseInt(urlParams.get("total") || "0");

  const { data: property } = useQuery<Property>({
    queryKey: [`/api/properties/${propertyId}`],
    enabled: !!propertyId,
  });

  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Autenticazione Richiesta",
        description: "Devi effettuare il login per completare la prenotazione.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 1000);
      return;
    }

    if (!propertyId || !checkIn || !checkOut || totalPrice <= 0) {
      toast({
        title: "Dati Mancanti",
        description: "Informazioni di prenotazione non valide.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    // Create payment intent
    apiRequest("POST", "/api/create-payment-intent", {
      amount: totalPrice,
      propertyId,
    })
      .then((data: any) => {
        setClientSecret(data.clientSecret);
      })
      .catch(() => {
        toast({
          title: "Errore",
          description: "Impossibile inizializzare il pagamento.",
          variant: "destructive",
        });
        navigate("/");
      });
  }, [propertyId, checkIn, checkOut, totalPrice, isAuthenticated, authLoading]);

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!clientSecret || !property) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-96 w-full" data-testid="skeleton-checkout-loading" />
      </div>
    );
  }

  const checkInDate = new Date(checkIn!);
  const checkOutDate = new Date(checkOut!);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold font-serif mb-8" data-testid="text-checkout-title">
        Conferma e Paga
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Booking Summary */}
        <div className="lg:col-span-2">
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Il Tuo Soggiorno</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="font-medium">Check-in:</span>{" "}
                  {format(checkInDate, "d MMMM yyyy", { locale: it })}
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="font-medium">Check-out:</span>{" "}
                  {format(checkOutDate, "d MMMM yyyy", { locale: it })}
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="font-medium">Ospiti:</span> {guests}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Pagamento</h2>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm
                propertyId={propertyId!}
                checkIn={checkIn!}
                checkOut={checkOut!}
                guests={guests}
                totalPrice={totalPrice}
                clientSecret={clientSecret}
              />
            </Elements>
          </Card>
        </div>

        {/* Property Summary */}
        <div>
          <Card className="p-6 space-y-4 sticky top-24">
            <div className="aspect-video rounded-lg overflow-hidden">
              <img
                src={property.images[0]}
                alt={property.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-semibold mb-1" data-testid="text-property-name">
                {property.title}
              </h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{property.city}, {property.country}</span>
              </div>
            </div>
            <div className="pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span>Totale</span>
                <span className="font-semibold" data-testid="text-checkout-total">
                  €{totalPrice}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
