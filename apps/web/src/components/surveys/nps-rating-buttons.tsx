import { cn } from "@/lib/utils";

interface NPSRatingButtonsProps {
  min: number;
  max: number;
  labels?: { min: string; max: string };
  className?: string;
}

export function NPSRatingButtons({ min, max, labels, className }: NPSRatingButtonsProps) {
  const ratings = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const range = max - min;

  /**
   * Color coding based on relative position in scale (works for any scale):
   * - Bottom ~60%: Detractors (red) - negative sentiment
   * - Middle ~20%: Passives (yellow) - neutral sentiment  
   * - Top ~20%: Promoters (green) - positive sentiment
   * 
   * For NPS 0-10: 0-6 red, 7-8 yellow, 9-10 green
   * For CSAT 1-5: 1-3 red, 4 yellow, 5 green
   * For CES 1-7: 1-4 red, 5 yellow, 6-7 green
   */
  const getButtonColor = (rating: number) => {
    const normalizedPosition = (rating - min) / range;
    
    if (normalizedPosition <= 0.6) {
      return "border-red-300 bg-red-100 text-red-700";
    }
    if (normalizedPosition <= 0.8) {
      return "border-yellow-300 bg-yellow-100 text-yellow-700";
    }
    return "border-green-300 bg-green-100 text-green-700";
  };

  return (
    <div className={cn("space-y-2", className)} role="group" aria-label="Rating scale">
      {/* Rating buttons grid */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {ratings.map((rating) => (
          <button
            key={rating}
            type="button"
            disabled
            aria-label={`Rating ${rating}`}
            className={cn(
              "h-8 w-8 rounded-md border text-sm font-medium",
              "cursor-default opacity-80",
              getButtonColor(rating),
            )}
          >
            {rating}
          </button>
        ))}
      </div>

      {/* Labels */}
      {labels && (
        <div className="flex justify-between px-1 text-xs text-gray-500">
          <span>{labels.min}</span>
          <span>{labels.max}</span>
        </div>
      )}
    </div>
  );
}
