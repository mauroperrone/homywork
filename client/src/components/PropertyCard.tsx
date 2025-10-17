import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Star, Wifi } from "lucide-react";
import { Link } from "wouter";
import type { Property } from "@shared/schema";

interface PropertyCardProps {
  property: Property & {
    averageRating?: number;
    reviewCount?: number;
  };
  onFavoriteClick?: () => void;
  isFavorited?: boolean;
}

export function PropertyCard({ property, onFavoriteClick, isFavorited = false }: PropertyCardProps) {
  const mainImage = property.images[0] || "";

  return (
    <Card className="overflow-hidden hover-elevate transition-all duration-300 group" data-testid={`card-property-${property.id}`}>
      <Link href={`/proprieta/${property.id}`}>
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={mainImage}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            data-testid={`img-property-${property.id}`}
          />
          
          {/* Favorite Button */}
          {onFavoriteClick && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-background"
              onClick={(e) => {
                e.preventDefault();
                onFavoriteClick();
              }}
              data-testid={`button-favorite-${property.id}`}
            >
              <Heart className={`h-4 w-4 ${isFavorited ? "fill-primary text-primary" : ""}`} />
            </Button>
          )}

          {/* Price Badge */}
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm" data-testid={`badge-price-${property.id}`}>
              €{property.pricePerNight}/notte
            </Badge>
          </div>

          {/* WiFi Speed Badge */}
          {property.wifiSpeed && property.wifiSpeed >= 50 && (
            <div className="absolute bottom-2 left-2">
              <Badge variant="default" className="gap-1 bg-chart-2/90 backdrop-blur-sm" data-testid={`badge-wifi-${property.id}`}>
                <Wifi className="h-3 w-3" />
                {property.wifiSpeed} Mbps
              </Badge>
            </div>
          )}
        </div>

        <div className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg line-clamp-1" data-testid={`text-title-${property.id}`}>
              {property.title}
            </h3>
            {property.averageRating && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <span className="text-sm font-medium" data-testid={`text-rating-${property.id}`}>
                  {property.averageRating.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          <p className="text-sm text-muted-foreground line-clamp-1" data-testid={`text-location-${property.id}`}>
            {property.city}, {property.country}
          </p>

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span data-testid={`text-guests-${property.id}`}>{property.maxGuests} ospiti</span>
            <span>•</span>
            <span data-testid={`text-bedrooms-${property.id}`}>{property.bedrooms} camere</span>
            <span>•</span>
            <span data-testid={`text-bathrooms-${property.id}`}>{property.bathrooms} bagni</span>
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            {property.amenities.slice(0, 3).map((amenity, index) => (
              <Badge key={index} variant="outline" className="text-xs" data-testid={`badge-amenity-${property.id}-${index}`}>
                {amenity}
              </Badge>
            ))}
            {property.amenities.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{property.amenities.length - 3}
              </Badge>
            )}
          </div>
        </div>
      </Link>
    </Card>
  );
}
