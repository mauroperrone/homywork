import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/Navbar";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

import HomePage from "@/pages/HomePage";
import SearchPage from "@/pages/SearchPage";
import PropertyDetail from "@/pages/PropertyDetail";
import PropertyForm from "@/pages/PropertyForm";
import Dashboard from "@/pages/Dashboard";
import Checkout from "@/pages/Checkout";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/cerca" component={SearchPage} />
      <Route path="/proprieta/:id" component={PropertyDetail} />
      <Route path="/proprieta/nuova" component={PropertyForm} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/diventa-host" component={PropertyForm} />
      <Route path="/checkout" component={Checkout} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        user={user}
        onAuthClick={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
      />
      <Router />
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
