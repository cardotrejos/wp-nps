import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check, Star, BarChart3, Target, Gauge } from "lucide-react";
import type { SurveyTemplate } from "@wp-nps/db/schema/survey-template";

interface TemplateCardProps {
  template: SurveyTemplate;
  isSelected: boolean;
  onSelect: (templateId: string) => void;
}

const TYPE_CONFIG = {
  nps: {
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    icon: Star,
    label: "NPS",
  },
  csat: {
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    icon: BarChart3,
    label: "CSAT",
  },
  ces: {
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    icon: Gauge,
    label: "CES",
  },
} as const;

/**
 * Template Card Component (Story 1.5 - Task 3)
 *
 * Displays a survey template with:
 * - Type badge (NPS/CSAT/CES) with distinct colors
 * - "Recommended" badge for default template (NPS)
 * - Hover state showing question preview
 * - Selected state with border and checkmark
 */
export function TemplateCard({ template, isSelected, onSelect }: TemplateCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const typeConfig = TYPE_CONFIG[template.type as keyof typeof TYPE_CONFIG] ?? {
    color: "bg-gray-100 text-gray-800",
    icon: Target,
    label: template.type.toUpperCase(),
  };

  const Icon = typeConfig.icon;

  return (
    <Card
      className={cn(
        "relative cursor-pointer transition-all duration-200 hover:shadow-md",
        isSelected && "ring-2 ring-primary ring-offset-2",
      )}
      onClick={() => onSelect(template.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(template.id);
        }
      }}
      aria-selected={isSelected}
      aria-label={`Select ${template.name} template`}
    >
      {/* Selection checkmark */}
      {isSelected && (
        <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-4 w-4" />
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("text-xs", typeConfig.color)}>
            <Icon className="mr-1 h-3 w-3" />
            {typeConfig.label}
          </Badge>
          {template.isDefault && (
            <Badge variant="secondary" className="text-xs">
              Recommended
            </Badge>
          )}
        </div>
        <CardTitle className="mt-3 text-base">{template.name}</CardTitle>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-muted-foreground">{template.description}</p>

        {/* Question preview - shown on hover */}
        <div
          className={cn(
            "mt-4 overflow-hidden transition-all duration-200",
            isHovered ? "max-h-40 opacity-100" : "max-h-0 opacity-0",
          )}
        >
          <div className="rounded-md bg-muted/50 p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Sample Question:</p>
            <p className="text-sm italic">
              "{template.questions[0]?.text ?? "No questions defined"}"
            </p>
            {template.questions[0]?.scale && (
              <p className="mt-1 text-xs text-muted-foreground">
                Scale: {template.questions[0].scale.min} - {template.questions[0].scale.max}
              </p>
            )}
          </div>
        </div>

        {/* Question count - always visible */}
        <div className="mt-3 text-xs text-muted-foreground">
          {template.questions.length} question
          {template.questions.length !== 1 ? "s" : ""}
        </div>
      </CardContent>
    </Card>
  );
}
