import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPropertySchema, type InsertProperty, type Property } from "@shared/schema";
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
import { useState, useEffect } from "react";
import { Plus, X, Upload, ChevronUp, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useParams } from "wouter";
import type { UploadResult } from "@uppy/core";
import { Skeleton } from "@/components/ui/skeleton";

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
  const params = useParams();
  const propertyId = params.id;
  const isEditing = !!propertyId;

  const [wifiSpeed, setWifiSpeed] = useState<number>();
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  // Carica i dati della proprietà se stiamo modificando
  const { data: existingProperty, isLoading: isLoadingProperty, isError: isPropertyError } = useQuery<Property>({
    queryKey: ["/api/properties", propertyId],
    enabled: isEditing,
  });

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
      hostId: "",
    },
  });

  // Popola il form con i dati esistenti quando vengono caricati
  useEffect(() => {
    if (existingProperty) {
      form.reset({
        title: existingProperty.title,
        description: existingProperty.description || "",
        propertyType: existingProperty.propertyType,
        address: existingProperty.address,
        city: existingProperty.city,
        country: existingProperty.country,
        pricePerNight: existingProperty.pricePerNight,
        maxGuests: existingProperty.maxGuests,
        bedrooms: existingProperty.bedrooms,
        beds: existingProperty.beds,
        bathrooms: existingProperty.bathrooms,
        images: existingProperty.images,
        amenities: existingProperty.amenities,
        hostId: existingProperty.hostId,
      });
      setSelectedAmenities(existingProperty.amenities);
      setImageUrls(existingProperty.images);
      if (existingProperty.wifiSpeed !== null) {
        setWifiSpeed(existingProperty.wifiSpeed);
      }
    }
  }, [existingProperty, form]);

  const createPropertyMutation = useMutation({
    mutationFn: async (data: InsertProperty) => {
      const response = await apiRequest("POST", "/api/properties", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/host/properties"] });
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

  const updatePropertyMutation = useMutation({
    mutationFn: async (data: InsertProperty) => {
      const response = await apiRequest("PATCH", `/api/properties/${propertyId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties", propertyId] });
      queryClient.invalidateQueries({ queryKey: ["/api/host/properties"] });
      toast({
        title: "Proprietà aggiornata!",
        description: "Le modifiche sono state salvate con successo.",
      });
      navigate("/dashboard");
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'aggiornamento della proprietà.",
        variant: "destructive",
      });
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

  const moveImageUp = (index: number) => {
    if (index > 0) {
      const newUrls = [...imageUrls];
      [newUrls[index], newUrls[index - 1]] = [newUrls[index - 1], newUrls[index]];
      setImageUrls(newUrls);
    }
  };

  const moveImageDown = (index: number) => {
    if (index < imageUrls.length - 1) {
      const newUrls = [...imageUrls];
      [newUrls[index], newUrls[index + 1]] = [newUrls[index + 1], newUrls[index]];
      setImageUrls(newUrls);
    }
  };

  const handleGetUploadParameters = async (file: any) => {
    const response = await apiRequest("POST", "/api/objects/upload", {});
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    const uploadedUrls: string[] = [];
    let failedCount = 0;
    
    if (result.successful) {
      for (const file of result.successful) {
        try {
          // L'URL del file caricato è in file.uploadURL dopo upload con AwsS3 plugin
          const uploadURL = file.uploadURL;
          
          if (!uploadURL) {
            console.error("File upload missing URL:", file.name);
            failedCount++;
            continue;
          }
          
          const response = await apiRequest("POST", "/api/property-images", {
            imageURL: uploadURL,
          });
          const data = await response.json();
          uploadedUrls.push(data.objectPath);
        } catch (error) {
          console.error("Error setting image ACL:", error);
          failedCount++;
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
    
    if (failedCount > 0) {
      toast({
        title: "Attenzione",
        description: `${failedCount} ${failedCount === 1 ? 'immagine non è stata caricata' : 'immagini non sono state caricate'}. Riprova.`,
        variant: "destructive",
      });
    }
  };

  const onSubmit = (data: InsertProperty) => {
    const propertyData = {
      ...data,
      images: imageUrls,
      amenities: selectedAmenities,
      ...(wifiSpeed !== undefined && { wifiSpeed }),
    };
    
    if (isEditing) {
      updatePropertyMutation.mutate(propertyData);
    } else {
      createPropertyMutation.mutate(propertyData);
    }
  };

  // Mostra skeleton mentre carica i dati in modalità edit
  if (isEditing && isLoadingProperty) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Card className="p-6 space-y-6">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </Card>
      </div>
    );
  }

  // Mostra errore se la proprietà non viene trovata
  if (isEditing && isPropertyError) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="p-6">
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold mb-4">Proprietà Non Trovata</h2>
            <p className="text-muted-foreground mb-6">
              La proprietà che stai cercando di modificare non esiste o non hai i permessi per accedervi.
            </p>
            <Button onClick={() => navigate("/dashboard")}>
              Torna alla Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-serif mb-2" data-testid="text-form-title">
          {isEditing ? "Modifica Proprietà" : "Registra la tua Proprietà"}
        </h1>
        <p className="text-muted-foreground">
          {isEditing 
            ? "Aggiorna i dettagli della tua proprietà"
            : "Inserisci i dettagli del tuo alloggio per smartworker e inizia ad accogliere nomadi digitali"
          }
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
                <div key={idx} className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                  <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
                  
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-7 w-7 shadow-lg"
                      onClick={() => removeImage(url)}
                      aria-label="Rimuovi immagine"
                      data-testid={`button-remove-image-${idx}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="absolute bottom-2 left-2 flex gap-1">
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 shadow-lg"
                      onClick={() => moveImageUp(idx)}
                      disabled={idx === 0}
                      aria-label="Sposta immagine su"
                      data-testid={`button-move-up-${idx}`}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 shadow-lg"
                      onClick={() => moveImageDown(idx)}
                      disabled={idx === imageUrls.length - 1}
                      aria-label="Sposta immagine giù"
                      data-testid={`button-move-down-${idx}`}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  {idx === 0 && (
                    <div className="absolute top-2 left-2">
                      <Badge variant="default" className="text-xs shadow-lg">
                        Foto Principale
                      </Badge>
                    </div>
                  )}
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
              disabled={createPropertyMutation.isPending || updatePropertyMutation.isPending}
              data-testid="button-submit-property"
            >
              {isEditing 
                ? (updatePropertyMutation.isPending ? "Salvataggio..." : "Salva Modifiche")
                : (createPropertyMutation.isPending ? "Creazione..." : "Pubblica Proprietà")
              }
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
