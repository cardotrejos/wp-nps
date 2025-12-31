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
  ArrowUpRight,
  MoreHorizontal,
  Loader2,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

  // Keep the query to ensure we have data access, but we might not display the raw message
  useQuery(orpc.privateData.queryOptions());

  // Mock data for the dashboard
  const stats = [
    {
      title: "Total Surveys Sent",
      value: "1,234",
      change: "+12.5%",
      trend: "up",
      icon: Send,
    },
    {
      title: "Response Rate",
      value: "42.8%",
      change: "+4.1%",
      trend: "up",
      icon: MessageSquare,
    },
    {
      title: "NPS Score",
      value: "72",
      change: "+2.4",
      trend: "up",
      icon: TrendingUp,
      highlight: true,
    },
    {
      title: "Active Contacts",
      value: "892",
      change: "+45",
      trend: "up",
      icon: Users,
    },
  ];

  const recentResponses = [
    {
      id: 1,
      name: "Alice Freeman",
      score: 10,
      comment: "Love the new WhatsApp integration! So fast.",
      date: "2m ago",
      status: "Promoter",
    },
    {
      id: 2,
      name: "Bob Smith",
      score: 8,
      comment: "It's good, but I wish it had more templates.",
      date: "15m ago",
      status: "Passive",
    },
    {
      id: 3,
      name: "Charlie Davis",
      score: 9,
      comment: "Very smooth experience.",
      date: "1h ago",
      status: "Promoter",
    },
    {
      id: 4,
      name: "Diana Prince",
      score: 4,
      comment: "I didn't receive the first message.",
      date: "3h ago",
      status: "Detractor",
    },
    {
      id: 5,
      name: "Evan Wright",
      score: 10,
      comment: "Perfect for our needs.",
      date: "5h ago",
      status: "Promoter",
    },
  ];

  const getScoreColor = (score: number) => {
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
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <span className="text-green-500 flex items-center mr-1">
                    {stat.change} <ArrowUpRight className="h-3 w-3 ml-0.5" />
                  </span>
                  from last month
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
                  {recentResponses.map((response) => (
                    <TableRow key={response.id} className="group">
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`font-mono font-bold ${getScoreColor(response.score)}`}
                        >
                          {response.score}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{response.name}</span>
                          <span className="text-xs text-muted-foreground md:hidden truncate max-w-[120px]">
                            {response.comment}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground max-w-[200px] truncate">
                        "{response.comment}"
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        {response.date}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            className={cn(
                              buttonVariants({ variant: "ghost", size: "icon" }),
                              "opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8",
                            )}
                          >
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>View details</DropdownMenuItem>
                            <DropdownMenuItem>Archive response</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
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
