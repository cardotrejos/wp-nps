import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Eye, EyeOff, Key, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { client, orpc } from "@/utils/orpc";
import { OnboardingGuard } from "@/components/onboarding/onboarding-guard";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/settings/api")({
  component: RouteComponent,
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
  const [newKey, setNewKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const currentKeyQuery = useQuery(orpc.apiKey.getCurrent.queryOptions());

  if (currentKeyQuery.isPending) {
    return (
      <OnboardingGuard>
        <Loader />
      </OnboardingGuard>
    );
  }

  const generateMutation = useMutation({
    mutationFn: () => client.apiKey.generate(),
    onSuccess: (data) => {
      setNewKey(data.key);
      setGenerateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["apiKey", "getCurrent"] });
      toast.success("New API key generated");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const revokeMutation = useMutation({
    mutationFn: () => client.apiKey.revoke(),
    onSuccess: () => {
      setNewKey(null);
      setRevokeDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["apiKey", "getCurrent"] });
      toast.success("API key revoked");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const copyToClipboard = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      toast.success("API key copied to clipboard");
    }
  };

  const currentKey = currentKeyQuery.data;

  return (
    <OnboardingGuard>
      <div className="container mx-auto max-w-2xl py-8 px-4">
        <h1 className="text-lg font-semibold mb-6">API Settings</h1>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="size-4" />
              API Key
            </CardTitle>
            <CardDescription>
              Use this key to authenticate API requests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {newKey ? (
              <div className="space-y-3">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-sm">
                  <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                    Copy this key now - it won&apos;t be shown again!
                  </p>
                </div>
                <div className="flex gap-2">
                  <Input
                    type={showKey ? "text" : "password"}
                    value={newKey}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </Button>
                  <Button variant="outline" size="icon" onClick={copyToClipboard}>
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>
            ) : currentKey ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Current key:</p>
                <code className="text-xs bg-muted px-2 py-1 rounded-sm">
                  fp_{currentKey.prefix}...
                </code>
                <p className="text-xs text-muted-foreground">
                  Created: {new Date(currentKey.createdAt).toLocaleDateString()}
                </p>
                {currentKey.lastUsedAt && (
                  <p className="text-xs text-muted-foreground">
                    Last used: {new Date(currentKey.lastUsedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No API key generated yet
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
                <DialogTrigger render={<Button />}>
                  <RefreshCw className="size-4 mr-1.5" />
                  {currentKey ? "Regenerate Key" : "Generate Key"}
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {currentKey ? "Regenerate API Key?" : "Generate API Key"}
                    </DialogTitle>
                    <DialogDescription>
                      {currentKey
                        ? "This will invalidate your current API key. Any applications using the old key will stop working."
                        : "Generate a new API key to authenticate your API requests."}
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setGenerateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => generateMutation.mutate()}
                      disabled={generateMutation.isPending}
                    >
                      {generateMutation.isPending ? "Generating..." : "Generate"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {currentKey && (
                <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
                  <DialogTrigger
                    render={<Button variant="destructive" />}
                  >
                    <Trash2 className="size-4 mr-1.5" />
                    Revoke Key
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Revoke API Key?</DialogTitle>
                      <DialogDescription>
                        This will permanently invalidate your API key. Any applications using this key will stop working immediately.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setRevokeDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => revokeMutation.mutate()}
                        disabled={revokeMutation.isPending}
                      >
                        {revokeMutation.isPending ? "Revoking..." : "Revoke"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </OnboardingGuard>
  );
}
