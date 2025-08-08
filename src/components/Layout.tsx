import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User } from 'lucide-react';
import { InnoflowLogo } from '@/components/ui/InnoflowLogo';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Deadline Banner */}
      <div className="bg-primary text-primary-foreground text-center py-2 text-sm font-medium">
        12 AUGUSTUS MOET HET AF ZIJN
      </div>
      
      {/* Navigation Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <InnoflowLogo size="md" showText={true} />
              
              <nav className="flex items-center gap-6">
                <Button variant="ghost" onClick={() => navigate('/')} className="text-gray-600 hover:text-gray-900">
                  Dashboard
                </Button>
                <Button variant="ghost" onClick={() => navigate('/projecten')} className="text-gray-600 hover:text-gray-900">
                  Projecten
                </Button>
                <Button variant="ghost" onClick={() => navigate('/leads')} className="text-gray-600 hover:text-gray-900">
                  Leads
                </Button>
                <Button variant="ghost" onClick={() => navigate('/financien')} className="text-gray-600 hover:text-gray-900">
                  Financiën
                </Button>
                <Button variant="ghost" onClick={() => navigate('/goals')} className="text-gray-600 hover:text-gray-900">
                  Doelen
                </Button>
                <span className="text-gray-400">AI Advies</span>
              </nav>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                {user?.email}
              </div>
              <Button variant="ghost" size="sm" onClick={signOut} className="text-gray-600 hover:text-red-600 gap-2">
                <LogOut className="h-4 w-4" />
                Uitloggen
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Page Content */}
      {children}
    </div>
  );
}