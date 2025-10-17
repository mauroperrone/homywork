import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { Review } from "@shared/schema";

interface ReviewCardProps {
  review: Review & {
    user: {
      firstName: string;
      lastName: string;
      profileImageUrl?: string | null;
    };
  };
}

export function ReviewCard({ review }: ReviewCardProps) {
  const userInitial = review.user.firstName?.charAt(0).toUpperCase() || "U";
  const userName = `${review.user.firstName} ${review.user.lastName?.charAt(0)}.`;

  return (
    <Card className="p-6" data-testid={`card-review-${review.id}`}>
      <div className="flex items-start gap-4">
        <Avatar>
          <AvatarImage src={review.user.profileImageUrl || undefined} />
          <AvatarFallback>{userInitial}</AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold" data-testid="text-reviewer-name">
                {userName}
              </p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(review.createdAt), "MMMM yyyy", { locale: it })}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < review.rating
                      ? "fill-primary text-primary"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
          </div>

          <p className="text-sm leading-relaxed" data-testid="text-review-content">
            {review.comment}
          </p>
        </div>
      </div>
    </Card>
  );
}
