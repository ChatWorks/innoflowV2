import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TimerProvider } from "@/contexts/TimerContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import FloatingTimer from "@/components/FloatingTimer";
import Index from "./pages/Index";
import ProjectDetail from "./pages/ProjectDetail";
import ProjectSetupWizard from "./components/ProjectSetupWizard";
import Leads from "./pages/Leads";
import LeadDetail from "./pages/LeadDetail";
import Auth from "./pages/Auth";
import ClientPortal from "./pages/ClientPortal";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TimerProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              <Route path="/project/new" element={
                <ProtectedRoute>
                  <ProjectSetupWizard />
                </ProtectedRoute>
              } />
              <Route path="/project/:id" element={
                <ProtectedRoute>
                  <ProjectDetail />
                </ProtectedRoute>
              } />
              <Route path="/leads" element={
                <ProtectedRoute>
                  <Leads />
                </ProtectedRoute>
              } />
              <Route path="/leads/:id" element={
                <ProtectedRoute>
                  <LeadDetail />
                </ProtectedRoute>
              } />
              {/* Public route for client portal - no auth required */}
              <Route path="/portal/:hash" element={<ClientPortal />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <FloatingTimer />
        </TooltipProvider>
      </TimerProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
