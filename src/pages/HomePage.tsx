import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Users, Briefcase, TrendingUp, ArrowRight } from 'lucide-react';
import Layout from '@/components/Layout';
import SpotlightCard from '@/components/ui/SpotlightCard';
import { InnoflowLogo } from '@/components/ui/InnoflowLogo';
import SEO from '@/components/SEO';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <Layout>
      <SEO title="Dashboard – Innoflow" description="Overzicht van projecten, leads, doelen en financiën." />
      <div className="min-h-screen bg-gradient-to-br from-[hsl(240_25%_96%)] via-[hsl(250_30%_98%)] to-[hsl(240_35%_95%)]">
        <div className="container mx-auto px-6 py-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-white/60 backdrop-blur-sm border border-white/40 rounded-full text-sm text-muted-foreground mb-6">
              🎯 Beheer je tijd efficiënt
            </div>
            <h1 className="text-5xl font-bold tracking-tight leading-[1.2] mb-6 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Welkom bij Innoflow
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto mb-8">
              Probeer 30 dagen gratis zonder risico
            </p>
            
          </div>

          {/* Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Doelen - Links */}
            <SpotlightCard 
              className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-white/40 hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer group"
              spotlightColor="rgba(168, 85, 247, 0.2)"
              onClick={() => navigate('/goals')}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Doelen</h3>
                <p className="text-muted-foreground mb-8">
                  Stel doelen in en track je vooruitgang met gedetailleerde analytics
                </p>
                <Button 
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white font-medium group-hover:scale-105 transition-transform"
                  size="lg"
                >
                  Ga naar Doelen
                </Button>
              </div>
            </SpotlightCard>

            {/* Projecten - Midden (Highlighted) */}
            <SpotlightCard
              className="relative bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary-hover))] rounded-3xl p-8 text-white transform scale-115 shadow-2xl cursor-pointer group"
              spotlightColor="rgba(59, 130, 246, 0.3)"
              onClick={() => navigate('/projecten')}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Briefcase className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Projecten</h3>
                <p className="opacity-80 mb-8">
                  Beheer en volg al je projecten op één centrale plek
                </p>
                <Button 
                  className="w-full bg-white text-blue-600 hover:bg-gray-50 font-medium group-hover:scale-105 transition-transform"
                  size="lg"
                >
                  Ga naar Projecten
                </Button>
              </div>
            </SpotlightCard>

            {/* Leads - Rechts */}
            <SpotlightCard
              className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-white/40 hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer group"
              spotlightColor="rgba(34, 197, 94, 0.2)"
              onClick={() => navigate('/leads')}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Leads</h3>
                <p className="text-muted-foreground mb-8">
                  Converteer potentiële klanten naar succesvolle projecten
                </p>
                <Button 
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-medium group-hover:scale-105 transition-transform"
                  size="lg"
                >
                  Ga naar Leads
                </Button>
              </div>
            </SpotlightCard>
          </div>

          {/* Features Section */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Briefcase className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Project Management</h3>
              <p className="text-muted-foreground">
                Beheer en volg al je projecten op één centrale plek
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Lead Tracking</h3>
              <p className="text-muted-foreground">
                Converteer potentiële klanten naar succesvolle projecten
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Goal Setting</h3>
              <p className="text-muted-foreground">
                Stel doelen en track je vooruitgang met gedetailleerde analytics
              </p>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}