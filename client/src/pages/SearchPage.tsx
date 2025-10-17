import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PropertyCard } from "@/components/PropertyCard";
import { SearchBar, type SearchParams } from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { SlidersHorizontal, X } from "lucide-react";
import type { Property } from "@shared/schema";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function SearchPage() {
  const [filters, setFilters] = useState<SearchParams>({
    location: "",
    guests: 1,
  });
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [minWifiSpeed, setMinWifiSpeed] = useState(0);
  const [propertyType, setPropertyType] = useState<string>("all");

  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties", filters],
  });

  const filteredProperties = properties?.filter(property => {
    if (filters.location && !property.city.toLowerCase().includes(filters.location.toLowerCase())) {
      return false;
    }
    if (property.maxGuests < filters.guests) return false;
    if (property.pricePerNight < priceRange[0] || property.pricePerNight > priceRange[1]) return false;
    if (minWifiSpeed > 0 && (!property.wifiSpeed || property.wifiSpeed < minWifiSpeed)) return false;
    if (propertyType !== "all" && property.propertyType !== propertyType) return false;
    return true;
  }) || [];

  const clearFilters = () => {
    setFilters({ location: "", guests: 1 });
    setPriceRange([0, 500]);
    setMinWifiSpeed(0);
    setPropertyType("all");
  };

  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-3">Tipo di Proprietà</h3>
        <Select value={propertyType} onValueChange={setPropertyType}>
          <SelectTrigger data-testid="select-property-type-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti</SelectItem>
            <SelectItem value="apartment">Appartamento</SelectItem>
            <SelectItem value="house">Casa</SelectItem>
            <SelectItem value="villa">Villa</SelectItem>
            <SelectItem value="room">Stanza</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Fascia di Prezzo</h3>
        <div className="space-y-3">
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            max={500}
            step={10}
            className="w-full"
            data-testid="slider-price"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>€{priceRange[0]}</span>
            <span>€{priceRange[1]}</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Velocità WiFi Minima</h3>
        <Select value={minWifiSpeed.toString()} onValueChange={(v) => setMinWifiSpeed(parseInt(v))}>
          <SelectTrigger data-testid="select-wifi-speed-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Qualsiasi</SelectItem>
            <SelectItem value="30">30+ Mbps</SelectItem>
            <SelectItem value="50">50+ Mbps</SelectItem>
            <SelectItem value="100">100+ Mbps</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button variant="outline" onClick={clearFilters} className="w-full" data-testid="button-clear-filters">
        <X className="h-4 w-4 mr-2" />
        Cancella Filtri
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <SearchBar onSearch={setFilters} variant="compact" />
          </div>
          
          {/* Mobile Filters */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="md:hidden" data-testid="button-mobile-filters">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filtri</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterPanel />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-muted-foreground" data-testid="text-results-count">
            {filteredProperties.length} {filteredProperties.length === 1 ? "proprietà trovata" : "proprietà trovate"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Desktop Filters Sidebar */}
        <aside className="hidden md:block">
          <Card className="p-6 sticky top-24">
            <h2 className="text-lg font-semibold mb-4">Filtri</h2>
            <FilterPanel />
          </Card>
        </aside>

        {/* Property Grid */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-[4/3] w-full" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-4" data-testid="text-no-results">
                Nessuna proprietà trovata con questi criteri
              </p>
              <Button variant="outline" onClick={clearFilters} data-testid="button-clear-all">
                Cancella tutti i filtri
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
