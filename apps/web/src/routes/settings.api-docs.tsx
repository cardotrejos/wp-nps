import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, Link, useSearch } from "@tanstack/react-router";
import { ApiReferenceReact } from "@scalar/api-reference-react";
import "@scalar/api-reference-react/style.css";
import { ArrowLeft, Key } from "lucide-react";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";
import { OnboardingGuard } from "@/components/onboarding/onboarding-guard";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const apiDocsSearchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/settings/api-docs")({
  component: RouteComponent,
  validateSearch: apiDocsSearchSchema,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({
        to: "/login",
        throw: true,
      });
    }
    return { session };
  },
});

function RouteComponent() {
  const { token: urlToken } = useSearch({ from: "/settings/api-docs" });
  const [manualToken, setManualToken] = useState("");
  const currentKeyQuery = useQuery(orpc.apiKey.getCurrent.queryOptions());

  // Use URL token (from API settings after generation) or manual entry
  const activeToken = urlToken ?? manualToken;

  // Clear URL token from history after reading (security)
  useEffect(() => {
    if (urlToken) {
      window.history.replaceState({}, "", "/settings/api-docs");
    }
  }, [urlToken]);

  if (currentKeyQuery.isPending) {
    return (
      <OnboardingGuard>
        <div className="h-full flex items-center justify-center" data-testid="api-docs-loading">
          <Loader />
        </div>
      </OnboardingGuard>
    );
  }

  const currentKey = currentKeyQuery.data;
  const apiKeyPrefix = currentKey?.prefix ? `fp_${currentKey.prefix}...` : undefined;

  return (
    <OnboardingGuard>
      <div className="h-full flex flex-col" data-testid="api-docs-page">
        <div className="border-b bg-background px-4 py-3 flex items-center gap-4 flex-wrap">
          <Link to="/settings/api" data-testid="back-to-api-settings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="size-4 mr-2" />
              Back to API Settings
            </Button>
          </Link>
          {apiKeyPrefix && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Your API Key:</span>
              <code className="bg-muted px-2 py-0.5 rounded text-xs" data-testid="api-key-prefix">
                {apiKeyPrefix}
              </code>
            </div>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <Key className="size-4 text-muted-foreground" />
            <Input
              type="password"
              placeholder="Enter API key for Try It"
              value={activeToken}
              onChange={(e) => setManualToken(e.target.value)}
              className="w-64 h-8 text-xs font-mono"
              data-testid="api-key-input"
            />
            {activeToken && (
              <span className="text-xs text-green-600 dark:text-green-400" data-testid="api-key-active">
                ✓ Key active
              </span>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-hidden" data-testid="api-reference-container">
          <ApiReferenceReact
            configuration={{
              url: `${import.meta.env.VITE_SERVER_URL}/api/openapi.json`,
              darkMode: true,
              hideModels: false,
              layout: "modern",
              authentication: activeToken ? {
                preferredSecurityScheme: "bearerAuth",
                securitySchemes: {
                  bearerAuth: {
                    token: activeToken,
                  },
                },
              } : {
                preferredSecurityScheme: "bearerAuth",
              },
              hiddenClients: ["php", "ruby", "csharp", "java", "kotlin", "objc", "swift", "c", "clojure", "powershell", "r"],
            }}
          />
        </div>
      </div>
    </OnboardingGuard>
  );
}
