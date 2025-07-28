import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">I</span>
                </div>
                <span className="text-xl font-semibold">Innoflow</span>
              </div>
              
              <nav className="flex items-center gap-6">
                <Button variant="ghost" onClick={() => navigate('/')} className="text-gray-600 hover:text-gray-900">
                  Dashboard
                </Button>
                <span className="text-gray-400">Projecten</span>
                <span className="text-gray-400">Kosten</span>
                <span className="text-gray-400">Doelen</span>
                <span className="text-gray-400">AI Advies</span>
              </nav>
            </div>
            
            <Button variant="ghost" size="sm" className="text-gray-600">
              info
            </Button>
          </div>
        </div>
      </div>

      {/* Page Content */}
      {children}
    </div>
  );
}