import { cn } from "@/lib/utils";
import { TemplateCard } from "./template-card";
import type { SurveyTemplate } from "@wp-nps/db/schema/survey-template";

interface TemplateGalleryProps {
  templates: SurveyTemplate[];
  selectedId: string | null;
  onSelect: (templateId: string) => void;
  className?: string;
}

/**
 * Template Gallery Component (Story 1.5 - Task 3)
 *
 * Displays template cards in a responsive grid:
 * - Mobile (< 640px): Single column, full-width cards
 * - Tablet (640px-1024px): 2 columns
 * - Desktop (> 1024px): 3 columns
 */
export function TemplateGallery({
  templates,
  selectedId,
  onSelect,
  className,
}: TemplateGalleryProps) {
  if (templates.length === 0) {
    return (
      <div className={cn("py-8 text-center text-muted-foreground", className)}>
        No templates available
      </div>
    );
  }

  return (
    <div
      className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}
      role="listbox"
      aria-label="Survey templates"
    >
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          isSelected={selectedId === template.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
