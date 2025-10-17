import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Star,
  MapPin,
  Wifi,
  Users,
  Bed,
  Bath,
  Home,
  Calendar,
  Shield,
} from "lucide-react";
import type { PropertyWithHost } from "@shared/schema";
import { useState } from "react";
import { BookingWidget } from "@/components/BookingWidget";
import { ReviewCard } from "@/components/ReviewCard";

export default function PropertyDetail() {
  const [, params] = useRoute("/proprieta/:id");
  const propertyId = params?.id;

  const { data: property, isLoading } = useQuery<PropertyWithHost>({
    queryKey: [`/api/properties/${propertyId}`],
    enabled: !!propertyId,
  });

  const { data: reviews = [] } = useQuery<any[]>({
    queryKey: ["/api/properties", propertyId, "reviews"],
    enabled: !!propertyId,
  });

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        <Skeleton className="h-96 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Proprietà non trovata</h1>
        <p className="text-muted-foreground">La proprietà che stai cercando non esiste.</p>
      </div>
    );
  }

  const images = property.images || [];
  const mainImage = images[currentImageIndex] || images[0];

  return (
    <div className="min-h-screen pb-12">
      {/* Image Gallery */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-[500px]">
          <div className="md:col-span-3 relative rounded-lg overflow-hidden">
            <img
              src={mainImage}
              alt={property.title}
              className="w-full h-full object-cover"
              data-testid="img-property-main"
            />
          </div>
          <div className="hidden md:grid grid-rows-4 gap-2">
            {images.slice(1, 5).map((img, idx) => (
              <div
                key={idx}
                className="relative rounded-lg overflow-hidden cursor-pointer hover-elevate"
                onClick={() => setCurrentImageIndex(idx + 1)}
                data-testid={`img-gallery-${idx}`}
              >
                <img src={img} alt={`Foto ${idx + 2}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Property Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Location */}
            <div>
              <h1 className="text-3xl font-bold font-serif mb-3" data-testid="text-property-title">
                {property.title}
              </h1>
              <div className="flex items-center gap-4 text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span data-testid="text-property-location">{property.city}, {property.country}</span>
                </div>
                {property.averageRating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    <span className="font-medium" data-testid="text-property-rating">
                      {property.averageRating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="gap-1" data-testid="badge-property-type">
                  <Home className="h-3 w-3" />
                  {property.propertyType}
                </Badge>
                <Badge variant="outline" className="gap-1" data-testid="badge-guests">
                  <Users className="h-3 w-3" />
                  {property.maxGuests} ospiti
                </Badge>
                <Badge variant="outline" className="gap-1" data-testid="badge-bedrooms">
                  <Bed className="h-3 w-3" />
                  {property.bedrooms} camere
                </Badge>
                <Badge variant="outline" className="gap-1" data-testid="badge-bathrooms">
                  <Bath className="h-3 w-3" />
                  {property.bathrooms} bagni
                </Badge>
                {property.wifiSpeed && (
                  <Badge variant="default" className="gap-1 bg-chart-2" data-testid="badge-wifi-speed">
                    <Wifi className="h-3 w-3" />
                    {property.wifiSpeed} Mbps
                  </Badge>
                )}
              </div>
            </div>

            {/* Host Info */}
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={property.host?.avatar} />
                  <AvatarFallback>{property.host?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-muted-foreground">Ospitato da</p>
                  <h3 className="text-lg font-semibold" data-testid="text-host-name">
                    {property.host?.name}
                  </h3>
                </div>
              </div>
            </Card>

            {/* Description */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Descrizione</h2>
              <p className="text-muted-foreground leading-relaxed" data-testid="text-description">
                {property.description}
              </p>
            </Card>

            {/* Amenities */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Servizi</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {property.amenities.map((amenity, idx) => (
                  <div key={idx} className="flex items-center gap-2" data-testid={`amenity-${idx}`}>
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-sm">{amenity}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Trust Indicators */}
            <Card className="p-6 bg-muted/50">
              <div className="flex items-start gap-4">
                <Shield className="h-6 w-6 text-chart-2 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-2">Prenotazione Sicura</h3>
                  <p className="text-sm text-muted-foreground">
                    Pagamenti protetti con Stripe. Cancellazione flessibile. WiFi certificato.
                  </p>
                </div>
              </div>
            </Card>

            {/* Reviews */}
            {reviews.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    Recensioni ({reviews.length})
                  </h2>
                  {property.averageRating && (
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 fill-primary text-primary" />
                      <span className="font-semibold">
                        {property.averageRating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Booking Widget */}
          <div className="lg:sticky lg:top-24 self-start">
            <BookingWidget property={property} />
          </div>
        </div>
      </div>
    </div>
  );
}
