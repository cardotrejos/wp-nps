import { useMemo } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface WhatsAppMessageProps {
  text: string;
  className?: string;
  /** Optional timestamp for deterministic rendering. Defaults to current time. */
  timestamp?: Date;
}

export function WhatsAppMessage({ text, className, timestamp: providedTimestamp }: WhatsAppMessageProps) {
  // Memoize timestamp to prevent re-renders - use provided or default to mount time
  const displayTimestamp = useMemo(() => {
    const date = providedTimestamp ?? new Date();
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }, [providedTimestamp]);

  return (
    <div className={cn("flex justify-start", className)} role="article" aria-label="Survey question message">
      <div className="relative max-w-[85%] rounded-lg rounded-tl-none bg-white p-3 pb-5 shadow-sm">
        {/* Message tail - triangle pointing to sender */}
        <div className="absolute -left-2 top-0 h-0 w-0 border-l-[8px] border-t-[8px] border-l-transparent border-t-white" aria-hidden="true" />

        {/* Message content */}
        <p className="whitespace-pre-wrap text-sm text-gray-800">{text}</p>

        {/* Timestamp and checkmarks */}
        <div className="absolute bottom-1 right-2 flex items-center gap-1" aria-label={`Sent at ${displayTimestamp}`}>
          <span className="text-[10px] text-gray-500">{displayTimestamp}</span>
          <div className="flex -space-x-1" aria-label="Message delivered">
            <Check className="h-3 w-3 text-blue-500" aria-hidden="true" />
            <Check className="h-3 w-3 text-blue-500" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
}
