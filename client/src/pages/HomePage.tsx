import { SearchBar } from "@/components/SearchBar";
import { PropertyCard } from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import type { Property } from "@shared/schema";
import { Link } from "wouter";
import { MapPin, Shield, Calendar, Wifi } from "lucide-react";
import heroImage from "@assets/generated_images/Italian_coastal_villa_hero_bd619aa3.png";

export default function HomePage() {
  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const featuredProperties = properties?.slice(0, 6) || [];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center justify-center">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Villa italiana"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center text-white space-y-8">
          <h1 className="text-4xl md:text-6xl font-bold font-serif tracking-tight" data-testid="text-hero-title">
            Lavora da dove vuoi, vivi dove sogni
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto text-white/90" data-testid="text-hero-subtitle">
            Alloggi pensati per nomadi digitali e smartworkers con WiFi certificato e spazi perfetti per la produttività
          </p>
          
          <SearchBar variant="hero" />
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-12 border-b bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Pagamenti Sicuri</h3>
                <p className="text-sm text-muted-foreground">Transazioni protette con Stripe</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="p-3 bg-chart-2/10 rounded-full">
                <Wifi className="h-6 w-6 text-chart-2" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">WiFi Certificato</h3>
                <p className="text-sm text-muted-foreground">Velocità garantita per lavorare</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-chart-3/10 rounded-full">
                <Calendar className="h-6 w-6 text-chart-3" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Sincronizzazione Calendario</h3>
                <p className="text-sm text-muted-foreground">Integrato con Airbnb e Booking</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-chart-4/10 rounded-full">
                <MapPin className="h-6 w-6 text-chart-4" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Le Migliori Destinazioni</h3>
                <p className="text-sm text-muted-foreground">Case in tutta Italia</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold font-serif mb-2" data-testid="text-featured-title">
                Workation in Evidenza
              </h2>
              <p className="text-muted-foreground">
                Le destinazioni preferite dai nomadi digitali
              </p>
            </div>
            <Button variant="outline" asChild data-testid="button-view-all">
              <Link href="/cerca">Vedi tutte</Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-[4/3] w-full" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : featuredProperties.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground" data-testid="text-no-properties">
                Nessuna proprietà disponibile al momento
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold font-serif" data-testid="text-cta-title">
            Hai uno spazio perfetto per lo smartworking?
          </h2>
          <p className="text-lg max-w-2xl mx-auto opacity-90">
            Condividi il tuo alloggio con nomadi digitali e smartworkers. WiFi veloce certificato e guadagni sicuri
          </p>
          <Button
            size="lg"
            variant="secondary"
            asChild
            data-testid="button-become-host-cta"
          >
            <Link href="/diventa-host">Diventa Host Oggi</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
