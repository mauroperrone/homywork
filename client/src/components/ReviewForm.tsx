import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ReviewFormProps {
  propertyId: string;
  bookingId: string;
  onSuccess?: () => void;
}

export function ReviewForm({ propertyId, bookingId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const { toast } = useToast();

  const createReviewMutation = useMutation({
    mutationFn: (data: { propertyId: string; bookingId: string; rating: number; comment: string }) =>
      apiRequest("POST", "/api/reviews", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties", propertyId, "reviews"] });
      queryClient.invalidateQueries({ queryKey: [`/api/properties/${propertyId}`] });
      toast({
        title: "Recensione inviata!",
        description: "Grazie per aver condiviso la tua esperienza.",
      });
      setRating(0);
      setComment("");
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile inviare la recensione.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast({
        title: "Valutazione richiesta",
        description: "Seleziona un numero di stelle.",
        variant: "destructive",
      });
      return;
    }
    createReviewMutation.mutate({ propertyId, bookingId, rating, comment });
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Lascia una Recensione</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Valutazione</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110"
                data-testid={`button-star-${star}`}
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= (hoveredRating || rating)
                      ? "fill-primary text-primary"
                      : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Commento</label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Condividi la tua esperienza..."
            className="min-h-[120px]"
            data-testid="textarea-review-comment"
          />
        </div>

        <Button
          type="submit"
          disabled={createReviewMutation.isPending || rating === 0}
          data-testid="button-submit-review"
        >
          {createReviewMutation.isPending ? "Invio..." : "Invia Recensione"}
        </Button>
      </form>
    </Card>
  );
}
