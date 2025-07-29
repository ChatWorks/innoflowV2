import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TimerProvider } from "@/contexts/TimerContext";
import FloatingTimer from "@/components/FloatingTimer";
import Index from "./pages/Index";
import ProjectDetail from "./pages/ProjectDetail";
import ProjectSetupWizard from "./components/ProjectSetupWizard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TimerProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/project/new" element={<ProjectSetupWizard />} />
            <Route path="/project/:id" element={<ProjectDetail />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <FloatingTimer />
      </TooltipProvider>
    </TimerProvider>
  </QueryClientProvider>
);

export default App;
