import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@/utils/orpc";

/**
 * Hook for managing WhatsApp connection via Kapso Setup Links
 *
 * Flow:
 * 1. Call createSetupLink() to get a Kapso URL
 * 2. Redirect user to the URL (external page)
 * 3. User completes Facebook login on Kapso's page
 * 4. Kapso redirects back with query params
 * 5. Call confirmConnection() with the params
 */
export function useWhatsAppConnection() {
  const queryClient = useQueryClient();

  // Get current connection status
  const connectionQuery = useQuery({
    queryKey: ["whatsapp", "connection"],
    queryFn: () => client.whatsapp.getConnection(),
  });

  // Create setup link mutation
  const createSetupLinkMutation = useMutation({
    mutationFn: (params: { successRedirectUrl: string; failureRedirectUrl: string }) =>
      client.whatsapp.createSetupLink(params),
  });

  // Confirm connection after redirect
  const confirmConnectionMutation = useMutation({
    mutationFn: (params: {
      setupLinkId: string;
      phoneNumberId: string;
      displayPhoneNumber: string;
      businessAccountId?: string;
    }) => client.whatsapp.confirmConnection(params),
    onSuccess: () => {
      // Refresh connection data
      queryClient.invalidateQueries({ queryKey: ["whatsapp", "connection"] });
    },
  });

  // Create a setup link and get the redirect URL
  const createSetupLink = async () => {
    const baseUrl = window.location.origin;
    const result = await createSetupLinkMutation.mutateAsync({
      successRedirectUrl: `${baseUrl}/onboarding/whatsapp/success`,
      failureRedirectUrl: `${baseUrl}/onboarding/whatsapp/failed`,
    });
    return result;
  };

  // Redirect user to Kapso's setup page
  const startConnection = async () => {
    const setupLink = await createSetupLink();
    // Store setup link ID for later confirmation
    sessionStorage.setItem("whatsapp_setup_link_id", setupLink.setupLinkId);
    // Redirect to Kapso
    window.location.href = setupLink.url;
  };

  const confirmConnection = async (params: {
    setupLinkId?: string;
    phoneNumberId?: string;
    displayPhoneNumber?: string;
    businessAccountId?: string;
  }) => {
    const storedSetupLinkId = sessionStorage.getItem("whatsapp_setup_link_id");
    const setupLinkId = params.setupLinkId ?? storedSetupLinkId;

    if (!setupLinkId) {
      throw new Error("No setup link ID found. Please start the connection process again.");
    }

    if (!params.phoneNumberId || !params.displayPhoneNumber) {
      throw new Error("Missing phone number details from WhatsApp. Please try connecting again.");
    }

    const result = await confirmConnectionMutation.mutateAsync({
      setupLinkId,
      phoneNumberId: params.phoneNumberId,
      displayPhoneNumber: params.displayPhoneNumber,
      businessAccountId: params.businessAccountId,
    });

    sessionStorage.removeItem("whatsapp_setup_link_id");

    return result;
  };

  return {
    // Connection status
    connection: connectionQuery.data,
    isConnected: connectionQuery.data?.status === "active",
    phoneNumber: connectionQuery.data?.phoneNumber,

    // Loading states
    isLoading: connectionQuery.isPending,
    isCreatingSetupLink: createSetupLinkMutation.isPending,
    isConfirming: confirmConnectionMutation.isPending,

    // Errors
    error:
      connectionQuery.error ?? createSetupLinkMutation.error ?? confirmConnectionMutation.error,

    // Actions
    startConnection,
    confirmConnection,

    // Setup link data (available after createSetupLink)
    setupLink: createSetupLinkMutation.data,

    // Refresh connection data
    refetch: () => queryClient.invalidateQueries({ queryKey: ["whatsapp", "connection"] }),
  };
}

/**
 * Parse WhatsApp connection success redirect params
 * Kapso redirects to success URL with these query params
 *
 * Note: Some params may be missing depending on the flow.
 * At minimum we need setup_link_id OR phone_number_id to proceed.
 */
export function parseWhatsAppSuccessParams(searchParams: URLSearchParams): {
  setupLinkId?: string;
  phoneNumberId?: string;
  displayPhoneNumber?: string;
  businessAccountId?: string;
} | null {
  const setupLinkId = searchParams.get("setup_link_id") ?? undefined;
  const phoneNumberId = searchParams.get("phone_number_id") ?? undefined;
  const displayPhoneNumber = searchParams.get("display_phone_number")
    ? decodeURIComponent(searchParams.get("display_phone_number")!)
    : undefined;
  const businessAccountId = searchParams.get("business_account_id") ?? undefined;

  // Need at least one identifier
  if (!setupLinkId && !phoneNumberId && !businessAccountId) {
    return null;
  }

  return {
    setupLinkId,
    phoneNumberId,
    displayPhoneNumber,
    businessAccountId,
  };
}

/**
 * Parse WhatsApp connection failure redirect params
 */
export function parseWhatsAppFailureParams(searchParams: URLSearchParams): {
  errorCode: string;
  errorMessage?: string;
} | null {
  const errorCode = searchParams.get("error_code") ?? searchParams.get("error");

  if (!errorCode) {
    return null;
  }

  return {
    errorCode,
    errorMessage:
      searchParams.get("error_message") ?? searchParams.get("error_description") ?? undefined,
  };
}
