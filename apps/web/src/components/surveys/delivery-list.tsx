import { useState } from "react";
import { useDeliveries } from "@/hooks/use-deliveries";
import { DeliveryStatusBadge } from "./delivery-status-badge";
import { DeliveryDetail } from "./delivery-detail";
import Loader from "@/components/loader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button, buttonVariants } from "@/components/ui/button";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeliveryListProps {
  surveyId: string;
}

const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function DeliveryList({ surveyId }: DeliveryListProps) {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const pageSize = 20;

  const { data, isLoading } = useDeliveries({
    surveyId,
    page,
    pageSize,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setSelectedId(null);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value === "all" ? undefined : value);
    setPage(1);
    setSelectedId(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader />
      </div>
    );
  }

  const getStatusLabel = (status?: string) => {
    if (!status || status === "all") return "Filter by status";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-medium">Deliveries</h3>
          {data && <p className="text-sm text-muted-foreground">{data.total} total deliveries</p>}
        </div>
        <div className="w-full sm:w-[200px]">
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                buttonVariants({ variant: "outline" }),
                "w-full justify-between cursor-pointer",
              )}
            >
              {getStatusLabel(statusFilter)}
              <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuItem onClick={() => handleStatusChange("all")}>
                All Statuses
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange("pending")}>
                Pending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange("queued")}>
                Queued
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange("sent")}>Sent</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange("delivered")}>
                Delivered
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange("failed")}>
                Failed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange("undeliverable")}>
                Undeliverable
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange("responded")}>
                Responded
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sent At</TableHead>
              <TableHead>Customer</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!data?.items.length ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No deliveries found.
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((delivery) => (
                <TableRow
                  key={delivery.id}
                  className={`cursor-pointer transition-colors ${
                    selectedId === delivery.id ? "bg-muted/50" : ""
                  }`}
                  onClick={() => setSelectedId(selectedId === delivery.id ? null : delivery.id)}
                >
                  <TableCell className="font-mono text-xs">{delivery.phoneNumberMasked}</TableCell>
                  <TableCell>
                    <DeliveryStatusBadge
                      status={delivery.status}
                      errorMessage={delivery.errorMessage}
                      retryCount={delivery.retryCount}
                      maxRetries={delivery.maxRetries}
                    />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(delivery.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {((delivery.metadata as Record<string, unknown>)?.customer_name as string) ??
                      "-"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(delivery.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {((delivery.metadata as Record<string, unknown>)?.customer_name as string) ??
                      "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.total > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Page {data.page} of {Math.ceil(data.total / data.pageSize)}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={!data.hasMore}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next</span>
            </Button>
          </div>
        </div>
      )}

      {selectedId && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <DeliveryDetail deliveryId={selectedId} onClose={() => setSelectedId(null)} />
        </div>
      )}
    </div>
  );
}
