import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TimerProvider } from "@/contexts/TimerContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import ProtectedRoute from "@/components/ProtectedRoute";
import FloatingTimer from "@/components/FloatingTimer";
import HomePage from "./pages/HomePage";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import ProjectSetupWizard from "./components/ProjectSetupWizard";
import TodoLists from "./pages/TodoLists";
import TodoDetail from "./pages/TodoDetail";
import Leads from "./pages/Leads";
import LeadDetail from "./pages/LeadDetail";
import Goals from "./pages/Goals";
import Auth from "./pages/Auth";
import ClientPortal from "./pages/ClientPortal";
import NotFound from "./pages/NotFound";
import Financien from "./pages/Financien";

const queryClient = new QueryClient();

function App() {
  useDocumentTitle();
  
  return (
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
                  <HomePage />
                </ProtectedRoute>
              } />
              <Route path="/projecten" element={
                <ProtectedRoute>
                  <Projects />
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
              <Route path="/todo" element={
                <ProtectedRoute>
                  <TodoLists />
                </ProtectedRoute>
              } />
              <Route path="/todo/:id" element={
                <ProtectedRoute>
                  <TodoDetail />
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
              <Route path="/goals" element={
                <ProtectedRoute>
                  <Goals />
                </ProtectedRoute>
              } />
              <Route path="/financien" element={
                <ProtectedRoute>
                  <Financien />
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
}

export default App;
