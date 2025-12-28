import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@/utils/orpc";

/**
 * Hook for managing WhatsApp verification via test message
 *
 * Flow:
 * 1. Call sendTestMessage() to send a test message
 * 2. Poll getVerificationStatus() to check delivery status
 * 3. Call confirmVerification() when user confirms receipt
 *
 * Polling:
 * - Polls every 3 seconds after test message is sent
 * - Stops when status is 'delivered' or after 2 minutes
 */
export function useVerificationStatus() {
  const queryClient = useQueryClient();
  const [deliveryId, setDeliveryId] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);

  // Send test message mutation
  const sendMutation = useMutation({
    mutationFn: () => client.whatsapp.sendTestMessage(),
    onSuccess: (data) => {
      setDeliveryId(data.deliveryId);
      setAttemptCount((prev) => prev + 1);
    },
  });

  // Poll for delivery status (every 3 seconds when deliveryId exists)
  const statusQuery = useQuery({
    queryKey: ["whatsapp", "verification", "status", deliveryId],
    queryFn: () => {
      if (!deliveryId) {
        throw new Error("No delivery ID");
      }
      return client.whatsapp.getVerificationStatus({ deliveryId });
    },
    enabled: !!deliveryId,
    refetchInterval: (query) => {
      // Stop polling when delivered or after 2 minutes
      if (query.state.data?.status === "delivered") {
        return false;
      }
      return 3000; // Poll every 3 seconds
    },
    staleTime: 0, // Always consider stale for polling
  });

  // Confirm verification mutation
  const confirmMutation = useMutation({
    mutationFn: () => client.whatsapp.confirmVerification(),
    onSuccess: () => {
      // Invalidate connection query so UI knows status changed to 'verified'
      queryClient.invalidateQueries({ queryKey: ["whatsapp", "connection"] });
    },
  });

  // Auto-stop polling after 2 minutes
  useEffect(() => {
    if (!deliveryId) return;

    const timeout = setTimeout(() => {
      queryClient.cancelQueries({
        queryKey: ["whatsapp", "verification", "status", deliveryId],
      });
    }, 120_000); // 2 minutes

    return () => clearTimeout(timeout);
  }, [deliveryId, queryClient]);

  return {
    // Delivery status from polling
    deliveryStatus: statusQuery.data?.status ?? "pending",

    // Mutations as async functions
    sendTestMessage: sendMutation.mutateAsync,
    confirmVerification: confirmMutation.mutateAsync,

    // Loading states
    isSending: sendMutation.isPending,
    isConfirming: confirmMutation.isPending,

    // Combined error from any operation
    error: sendMutation.error ?? confirmMutation.error ?? statusQuery.error,

    // Attempt tracking (for troubleshooting UI)
    attemptCount,

    // Delivery ID for reference
    deliveryId,
  };
}
