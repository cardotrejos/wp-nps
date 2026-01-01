import { useQuery, useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import {
  BarChart3,
  Send,
  Settings,
  Users,
  MessageSquare,
  TrendingUp,
  Plus,
  MoreHorizontal,
  Loader2,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { orpc, client } from "@/utils/orpc";
import { OnboardingGuard } from "@/components/onboarding/onboarding-guard";

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
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
  const { session } = Route.useRouteContext();

  const { data: statsData, isLoading: statsLoading } = useQuery(
    orpc.dashboard.getStats.queryOptions(),
  );

  const { data: responsesData, isLoading: responsesLoading } = useQuery(
    orpc.dashboard.getRecentResponses.queryOptions({ limit: 10 }),
  );

  const stats = [
    {
      title: "Total Surveys Sent",
      value: statsLoading ? "..." : (statsData?.totalSent ?? 0).toLocaleString(),
      change: null,
      trend: "up" as const,
      icon: Send,
    },
    {
      title: "Response Rate",
      value: statsLoading ? "..." : statsData?.responseRate ?? "0%",
      change: null,
      trend: "up" as const,
      icon: MessageSquare,
    },
    {
      title: "NPS Score",
      value: statsLoading ? "..." : (statsData?.npsScore?.toString() ?? "—"),
      change: null,
      trend: "up" as const,
      icon: TrendingUp,
      highlight: true,
    },
    {
      title: "Active Contacts",
      value: statsLoading ? "..." : (statsData?.activeContacts ?? 0).toLocaleString(),
      change: null,
      trend: "up" as const,
      icon: Users,
    },
  ];

  const recentResponses = responsesData ?? [];

  const getScoreColor = (score: number | null) => {
    if (score === null) return "bg-muted text-muted-foreground";
    if (score >= 9)
      return "bg-green-500/15 text-green-600 dark:text-green-400 hover:bg-green-500/25 border-green-500/20";
    if (score >= 7)
      return "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/25 border-yellow-500/20";
    return "bg-red-500/15 text-red-600 dark:text-red-400 hover:bg-red-500/25 border-red-500/20";
  };

  return (
    <OnboardingGuard>
      <div className="min-h-screen bg-background p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/50 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back,{" "}
              <span className="font-semibold text-foreground">{session.data?.user.name}</span>.
              Here's your campaign overview.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" /> Settings
            </Button>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> New Survey
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="overflow-hidden border-border/50 shadow-sm transition-all hover:shadow-md"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon
                  className={`h-4 w-4 ${stat.highlight ? "text-primary" : "text-muted-foreground"}`}
                />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Last 30 days
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-7">
          {/* Recent Responses Table */}
          <Card className="col-span-1 md:col-span-4 lg:col-span-5 border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Responses</CardTitle>
                <CardDescription>Latest feedback from your active campaigns</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="hidden sm:flex">
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[100px]">Score</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="hidden md:table-cell">Comment</TableHead>
                    <TableHead className="text-right">Time</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {responsesLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : recentResponses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Inbox className="h-8 w-8" />
                          <p>No responses yet</p>
                          <p className="text-xs">Send your first survey to see responses here</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentResponses.map((response) => (
                      <TableRow key={response.id} className="group">
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`font-mono font-bold ${getScoreColor(response.score)}`}
                          >
                            {response.score ?? "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{response.customerPhone}</span>
                            <span className="text-xs text-muted-foreground md:hidden truncate max-w-[120px]">
                              {response.feedback ?? "No feedback"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground max-w-[200px] truncate">
                          {response.feedback ? `"${response.feedback}"` : "—"}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground text-sm">
                          {response.timeAgo}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                          >
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Quick Actions / Status Panel */}
          <Card className="col-span-1 md:col-span-3 lg:col-span-2 border-border/50 shadow-sm flex flex-col h-full">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your workflow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              <SendSurveyDialog />
              <Button
                variant="ghost"
                className="w-full justify-start h-10 border border-transparent hover:border-border"
              >
                <BarChart3 className="mr-2 h-4 w-4 text-muted-foreground" /> Analytics Report
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start h-10 border border-transparent hover:border-border"
              >
                <Users className="mr-2 h-4 w-4 text-muted-foreground" /> Import Contacts
              </Button>

              <div className="mt-8 pt-6 border-t border-border/50">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  System Status
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center text-foreground">
                      <div className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                      WhatsApp API
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">ONLINE</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center text-foreground">
                      <div className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                      Database
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">CONNECTED</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <div className="p-6 pt-0 mt-auto">
              <Card className="bg-primary/5 border-primary/20 shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-background rounded-full border border-border shrink-0">
                      <TrendingUp className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">NPS Tip</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Your response rate is high! Consider adding a follow-up question for
                        Promoters.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Card>
        </div>
      </div>
    </OnboardingGuard>
  );
}

function SendSurveyDialog() {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [flowId, setFlowId] = useState("");
  const [flowCta, setFlowCta] = useState("Start Survey");
  const [bodyText, setBodyText] = useState("Please complete this quick survey");

  const { mutate, isPending } = useMutation({
    mutationFn: (data: { phone: string; flowId: string; flowCta?: string; bodyText?: string }) =>
      client.survey.sendFlowDirect(data),
    onSuccess: () => {
      toast.success("Survey sent successfully");
      setOpen(false);
      setPhone("");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({
      phone,
      flowId,
      flowCta,
      bodyText,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(buttonVariants({ variant: "secondary" }), "w-full justify-start h-10")}
      >
        <Send className="mr-2 h-4 w-4 text-muted-foreground" /> Send Manual Survey
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Survey Flow</DialogTitle>
          <DialogDescription>Send a WhatsApp Flow directly to a phone number.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              placeholder="+5511999999999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">E.164 format required</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="flowId">Flow ID</Label>
            <Input
              id="flowId"
              placeholder="Enter Kapso Flow ID"
              value={flowId}
              onChange={(e) => setFlowId(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="flowCta">Button Text (Optional)</Label>
            <Input
              id="flowCta"
              placeholder="Start Survey"
              value={flowCta}
              onChange={(e) => setFlowCta(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bodyText">Message Body (Optional)</Label>
            <Input
              id="bodyText"
              placeholder="Please complete this quick survey"
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Survey
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
