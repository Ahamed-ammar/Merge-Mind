import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Navigation } from "@/components/layout/navigation";
import { MobileNav } from "@/components/layout/mobile-nav";
import { AuthModal } from "@/components/auth/auth-modal";
import { useState, useEffect } from "react";

// Pages
import Dashboard from "@/pages/dashboard";
import Communities from "@/pages/communities";
import CommunityChatPage from "@/pages/community-chat";
import Articles from "@/pages/articles";
import Profile from "@/pages/profile";
import DirectMessages from "@/pages/direct-messages";
import NotFound from "@/pages/not-found";

function AppContent() {
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      setShowAuthModal(true);
    } else {
      setShowAuthModal(false);
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold">M</span>
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-screen bg-background">
        {user && <Navigation />}
        
        <main className="flex-1 overflow-hidden">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/communities" component={Communities} />
            <Route path="/communities/:id" component={CommunityChatPage} />
            <Route path="/articles" component={Articles} />
            <Route path="/profile" component={Profile} />
            <Route path="/messages" component={DirectMessages} />
            <Route component={NotFound} />
          </Switch>
        </main>

        {user && <MobileNav />}
      </div>

      <AuthModal 
        open={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <AppContent />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
