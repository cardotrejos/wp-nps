import { useQuery } from "@tanstack/react-query";
import { client } from "@/utils/orpc";

export const deliveryKeys = {
  all: ["deliveries"] as const,
  lists: () => [...deliveryKeys.all, "list"] as const,
  list: (surveyId: string, filters?: { page?: number; status?: string }) =>
    [...deliveryKeys.lists(), surveyId, filters] as const,
  details: () => [...deliveryKeys.all, "detail"] as const,
  detail: (id: string) => [...deliveryKeys.details(), id] as const,
};

interface UseDeliveriesOptions {
  surveyId: string;
  page?: number;
  pageSize?: number;
  status?: string;
  enabled?: boolean;
}

export function useDeliveries(options: UseDeliveriesOptions) {
  const { surveyId, page = 1, pageSize = 20, status, enabled = true } = options;

  return useQuery({
    queryKey: deliveryKeys.list(surveyId, { page, status }),
    queryFn: () =>
      client.delivery.list({
        surveyId,
        page,
        pageSize,
        status: status as
          | "pending"
          | "queued"
          | "sent"
          | "delivered"
          | "failed"
          | "undeliverable"
          | "responded"
          | undefined,
      }),
    enabled: enabled && !!surveyId,
    staleTime: 1000 * 30,
  });
}

export function useDelivery(id: string, enabled = true) {
  return useQuery({
    queryKey: deliveryKeys.detail(id),
    queryFn: () => client.delivery.getById({ id }),
    enabled: enabled && !!id,
    staleTime: 1000 * 30,
  });
}
