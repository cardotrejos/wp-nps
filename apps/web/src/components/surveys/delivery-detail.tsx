import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDelivery } from "@/hooks/use-deliveries";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { DeliveryStatusBadge } from "./delivery-status-badge";

interface DeliveryDetailProps {
  deliveryId: string;
  onClose: () => void;
  className?: string;
}

const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "medium",
  });
};

export function DeliveryDetail({ deliveryId, onClose, className }: DeliveryDetailProps) {
  const { data: delivery, isLoading, error } = useDelivery(deliveryId);

  if (isLoading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader>
          <div className="h-6 w-32 bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-4 w-3/4 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !delivery) {
    return (
      <Card className={cn("border-destructive/50", className)}>
        <CardContent className="pt-6">
          <p className="text-destructive">Failed to load delivery details.</p>
          <Button variant="outline" onClick={onClose} className="mt-4">
            Close
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <div className="absolute right-4 top-4">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      </div>
      
      <CardHeader>
        <div className="flex items-center gap-3">
          <CardTitle className="text-xl font-mono">
            {delivery.phoneNumberMasked}
          </CardTitle>
          <DeliveryStatusBadge 
            status={delivery.status} 
            retryCount={delivery.retryCount}
            maxRetries={delivery.maxRetries}
            errorMessage={delivery.errorMessage}
          />
        </div>
        <p className="text-xs text-muted-foreground font-mono mt-1">
          ID: {delivery.id}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs uppercase tracking-wider">Created</span>
            <p className="font-medium">
              {formatDate(delivery.createdAt)}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs uppercase tracking-wider">Delivered</span>
            <p className="font-medium">
              {delivery.deliveredAt 
                ? formatDate(delivery.deliveredAt)
                : "-"}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs uppercase tracking-wider">Responded</span>
            <p className="font-medium">
              {delivery.respondedAt 
                ? formatDate(delivery.respondedAt)
                : "-"}
            </p>
          </div>
        </div>

        {delivery.errorMessage && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 text-sm text-destructive">
            <p className="font-semibold mb-1">Error Message</p>
            <p className="font-mono">{delivery.errorMessage}</p>
          </div>
        )}

        {delivery.metadata && Object.keys(delivery.metadata).length > 0 && (
          <div className="space-y-2">
            <span className="text-muted-foreground text-xs uppercase tracking-wider">Metadata</span>
            <div className="bg-muted/50 rounded-md p-4 font-mono text-xs overflow-auto max-h-[200px] border">
              <pre>{JSON.stringify(delivery.metadata, null, 2)}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
