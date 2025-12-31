import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  Check,
  Clock,
  MessageSquare,
  Send,
  X,
} from "lucide-react";

type DeliveryStatus =
  | "pending"
  | "queued"
  | "sent"
  | "delivered"
  | "failed"
  | "undeliverable"
  | "responded"
  | string;

interface DeliveryStatusBadgeProps {
  status: DeliveryStatus;
  retryCount?: number;
  maxRetries?: number;
  errorMessage?: string | null;
  className?: string;
}

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ElementType;
    className?: string;
  }
> = {
  pending: {
    label: "Pending",
    variant: "secondary",
    icon: Clock,
    className: "text-muted-foreground",
  },
  queued: {
    label: "Queued",
    variant: "secondary",
    icon: Clock,
    className: "text-muted-foreground",
  },
  sent: {
    label: "Sent",
    variant: "outline",
    icon: Send,
    className: "border-blue-200 text-blue-700 bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:bg-blue-900/20",
  },
  delivered: {
    label: "Delivered",
    variant: "default",
    icon: Check,
    className: "bg-green-600 hover:bg-green-700 border-transparent",
  },
  failed: {
    label: "Failed",
    variant: "destructive",
    icon: AlertCircle,
  },
  undeliverable: {
    label: "Undeliverable",
    variant: "destructive",
    icon: X,
  },
  responded: {
    label: "Responded",
    variant: "default",
    icon: MessageSquare,
    className: "bg-emerald-600 hover:bg-emerald-700 border-transparent",
  },
};

export function DeliveryStatusBadge({
  status,
  retryCount = 0,
  maxRetries = 2,
  errorMessage,
  className,
}: DeliveryStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;
  const isError = status === "failed" || status === "undeliverable";
  const showRetryInfo = isError && retryCount > 0;

  const badge = (
    <Badge
      variant={config.variant}
      className={cn("gap-1.5 pr-2.5", config.className, className)}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{config.label}</span>
      {showRetryInfo && (
        <span className="opacity-75 ml-0.5">
          ({retryCount}/{maxRetries} retries)
        </span>
      )}
    </Badge>
  );

  if (isError && errorMessage) {
    return (
      <Tooltip>
        <TooltipTrigger>{badge}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-[300px] text-wrap">
          <p>{errorMessage}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return badge;
}
