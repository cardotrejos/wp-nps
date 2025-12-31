import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, BarChart3, MessageSquare, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4 text-center">
      <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        {/* Badge/Pill */}
        <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary mb-4">
          <Zap className="mr-2 h-3.5 w-3.5" />
          <span>Feedback made simple</span>
        </div>

        {/* Hero Section */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
          Measure what matters with NPS
        </h1>

        <p className="text-xl text-muted-foreground md:text-2xl max-w-2xl mx-auto leading-relaxed">
          The easiest way to collect, analyze, and act on customer feedback. Get started in minutes,
          not hours.
        </p>

        {/* CTA Section */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link to="/login">
            <Button size="lg" className="h-12 px-8 text-base font-semibold rounded-full group">
              Get Started for Free
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="lg"
            className="h-12 px-8 text-base font-medium rounded-full"
          >
            View Live Demo
          </Button>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-20">
          <div className="flex flex-col items-center space-y-3">
            <div className="p-3 rounded-2xl bg-secondary/50">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold">Survey Builder</h3>
            <p className="text-sm text-muted-foreground text-center">
              Create beautiful surveys that match your brand perfectly.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-3">
            <div className="p-3 rounded-2xl bg-secondary/50">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold">Real-time Analytics</h3>
            <p className="text-sm text-muted-foreground text-center">
              Watch your NPS score evolve as feedback rolls in.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-3">
            <div className="p-3 rounded-2xl bg-secondary/50">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold">Automated Actions</h3>
            <p className="text-sm text-muted-foreground text-center">
              Set up webhooks and alerts for critical feedback.
            </p>
          </div>
        </div>
      </div>

      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl shadow-primary/20 transition-all duration-300 transform perspective-1000 hover:scale-110" />
      </div>
    </div>
  );
}
