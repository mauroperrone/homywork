import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPropertySchema, type InsertProperty } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WiFiSpeedTest } from "@/components/WiFiSpeedTest";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useState } from "react";
import { Plus, X, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { UploadResult } from "@uppy/core";

const AMENITIES_OPTIONS = [
  "WiFi", "Parcheggio", "Cucina", "Lavatrice", "Aria condizionata",
  "Riscaldamento", "TV", "Piscina", "Giardino", "Terrazza",
  "Barbecue", "Camino", "Scrivania", "Palestra"
];

const PROPERTY_TYPES = [
  { value: "apartment", label: "Appartamento" },
  { value: "house", label: "Casa" },
  { value: "villa", label: "Villa" },
  { value: "room", label: "Stanza" },
];

export default function PropertyForm() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [wifiSpeed, setWifiSpeed] = useState<number>();
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const form = useForm<InsertProperty>({
    resolver: zodResolver(insertPropertySchema),
    defaultValues: {
      title: "",
      description: "",
      propertyType: "apartment",
      address: "",
      city: "",
      country: "Italia",
      pricePerNight: 50,
      maxGuests: 2,
      bedrooms: 1,
      beds: 1,
      bathrooms: 1,
      images: [],
      amenities: [],
      hostId: "", // Will be set from user context
    },
  });

  const createPropertyMutation = useMutation({
    mutationFn: (data: InsertProperty) => apiRequest("POST", "/api/properties", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({
        title: "Proprietà creata!",
        description: "La tua proprietà è stata pubblicata con successo.",
      });
      navigate("/dashboard");
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "";
      const is403 = errorMessage.includes("403") || errorMessage.includes("Forbidden") || errorMessage.includes("Host role required");
      
      if (is403) {
        toast({
          title: "Accesso negato",
          description: "Devi essere un host per pubblicare proprietà. Vai su 'Diventa Host' per iniziare.",
          variant: "destructive",
        });
        navigate("/diventa-host");
      } else {
        toast({
          title: "Errore",
          description: "Si è verificato un errore durante la creazione della proprietà.",
          variant: "destructive",
        });
      }
    },
  });

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const removeImage = (url: string) => {
    setImageUrls(imageUrls.filter(img => img !== url));
  };

  const handleGetUploadParameters = async (file: any) => {
    const response: any = await apiRequest("POST", "/api/objects/upload", {});
    return {
      method: "PUT" as const,
      url: response.uploadURL,
    };
  };

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    const uploadedUrls: string[] = [];
    
    if (result.successful) {
      for (const file of result.successful) {
        try {
          const response: any = await apiRequest("POST", "/api/property-images", {
            imageURL: file.response.uploadURL,
          });
          uploadedUrls.push(response.objectPath);
        } catch (error) {
          console.error("Error setting image ACL:", error);
          toast({
            title: "Errore upload",
            description: "Impossibile completare il caricamento di alcune immagini.",
            variant: "destructive",
          });
        }
      }
    }
    
    if (uploadedUrls.length > 0) {
      setImageUrls(prev => [...prev, ...uploadedUrls]);
      toast({
        title: "Immagini caricate!",
        description: `${uploadedUrls.length} ${uploadedUrls.length === 1 ? 'immagine caricata' : 'immagini caricate'} con successo.`,
      });
    }
  };

  const onSubmit = (data: InsertProperty) => {
    const propertyData = {
      ...data,
      images: imageUrls,
      amenities: selectedAmenities,
      wifiSpeed,
    };
    createPropertyMutation.mutate(propertyData);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-serif mb-2" data-testid="text-form-title">
          Registra la tua Proprietà
        </h1>
        <p className="text-muted-foreground">
          Inserisci i dettagli del tuo alloggio per smartworker e inizia ad accogliere nomadi digitali
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Info */}
          <Card className="p-6 space-y-6">
            <h2 className="text-xl font-semibold">Informazioni di Base</h2>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titolo Annuncio</FormLabel>
                  <FormControl>
                    <Input placeholder="Villa con vista mare in Costiera Amalfitana" {...field} data-testid="input-title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrizione</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrivi la tua proprietà, i suoi punti di forza e cosa la rende speciale..."
                      className="min-h-[120px]"
                      {...field}
                      data-testid="textarea-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="propertyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo di Proprietà</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-property-type">
                          <SelectValue placeholder="Seleziona tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROPERTY_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pricePerNight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prezzo per Notte (€)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        data-testid="input-price"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Card>

          {/* Location */}
          <Card className="p-6 space-y-6">
            <h2 className="text-xl font-semibold">Ubicazione</h2>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Indirizzo</FormLabel>
                  <FormControl>
                    <Input placeholder="Via Roma, 123" {...field} data-testid="input-address" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Città</FormLabel>
                    <FormControl>
                      <Input placeholder="Roma" {...field} data-testid="input-city" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paese</FormLabel>
                    <FormControl>
                      <Input {...field} disabled data-testid="input-country" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Card>

          {/* Capacity */}
          <Card className="p-6 space-y-6">
            <h2 className="text-xl font-semibold">Capacità</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="maxGuests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ospiti</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        data-testid="input-guests"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bedrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Camere</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        data-testid="input-bedrooms"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="beds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Letti</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        data-testid="input-beds"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bathrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bagni</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        data-testid="input-bathrooms"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Card>

          {/* WiFi Speed Test */}
          <WiFiSpeedTest onSpeedMeasured={setWifiSpeed} currentSpeed={wifiSpeed} />

          {/* Amenities */}
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Servizi</h2>
            <div className="flex flex-wrap gap-2">
              {AMENITIES_OPTIONS.map((amenity) => (
                <Badge
                  key={amenity}
                  variant={selectedAmenities.includes(amenity) ? "default" : "outline"}
                  className="cursor-pointer hover-elevate"
                  onClick={() => toggleAmenity(amenity)}
                  data-testid={`badge-amenity-${amenity.toLowerCase()}`}
                >
                  {amenity}
                </Badge>
              ))}
            </div>
          </Card>

          {/* Images */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Foto della Proprietà</h2>
              <ObjectUploader
                maxNumberOfFiles={10}
                maxFileSize={10485760}
                allowedFileTypes={["image/*"]}
                onGetUploadParameters={handleGetUploadParameters}
                onComplete={handleUploadComplete}
                buttonClassName="gap-2"
              >
                <Upload className="h-4 w-4" />
                <span>Carica Immagini</span>
              </ObjectUploader>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {imageUrls.map((url, idx) => (
                <div key={idx} className="relative aspect-video rounded-lg overflow-hidden group">
                  <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(url)}
                    data-testid={`button-remove-image-${idx}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {imageUrls.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aggiungi almeno un'immagine della proprietà</p>
              </div>
            )}
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate("/dashboard")} data-testid="button-cancel">
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={createPropertyMutation.isPending}
              data-testid="button-submit-property"
            >
              {createPropertyMutation.isPending ? "Creazione..." : "Pubblica Proprietà"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
