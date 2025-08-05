import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Users, Briefcase, TrendingUp, ArrowRight } from 'lucide-react';
import Layout from '@/components/Layout';
import SpotlightCard from '@/components/ui/SpotlightCard';
import { InnoflowLogo } from '@/components/ui/InnoflowLogo';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-[hsl(240_25%_96%)] via-[hsl(250_30%_98%)] to-[hsl(240_35%_95%)]">
        <div className="container mx-auto px-6 py-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-white/60 backdrop-blur-sm border border-white/40 rounded-full text-sm text-muted-foreground mb-6">
              🎯 Beheer je tijd efficiënt
            </div>
            <div className="flex items-center justify-center gap-4 mb-6">
              <InnoflowLogo className="h-12 w-12" />
              <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Welkom bij Innoflow
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto mb-8">
              Probeer 30 dagen gratis zonder risico
            </p>
            
            {/* Tab Navigation */}
            <div className="flex justify-center mb-12">
              <div className="bg-white/80 backdrop-blur-sm rounded-full p-1 border border-white/40">
                <button className="px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  Navigatie
                </button>
                <button className="px-6 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground">
                  Overzicht
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Doelen - Links */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-white/40 hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer group"
                 onClick={() => navigate('/goals')}>
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
            </div>

            {/* Projecten - Midden (Highlighted) */}
            <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-8 text-white transform scale-105 shadow-2xl cursor-pointer group"
                 onClick={() => navigate('/projecten')}>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-2 text-sm font-medium border border-white/30">
                  Meest gebruikt
                </div>
              </div>
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
            </div>

            {/* Leads - Rechts */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-white/40 hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer group"
                 onClick={() => navigate('/leads')}>
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
            </div>
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

          {/* Quick Access Cards */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            <SpotlightCard 
              className="cursor-pointer transition-all duration-300 group hover:scale-[1.02] bg-white/60 backdrop-blur-sm border-white/40"
              spotlightColor="hsl(var(--primary) / 0.3)"
              onClick={() => navigate('/projecten')}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Briefcase className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold">Projecten</h3>
                  <p className="text-sm text-muted-foreground">Ga naar projecten</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
              </div>
            </SpotlightCard>

            <SpotlightCard 
              className="cursor-pointer transition-all duration-300 group hover:scale-[1.02] bg-white/60 backdrop-blur-sm border-white/40"
              spotlightColor="hsl(142 76% 36% / 0.3)"
              onClick={() => navigate('/leads')}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold">Leads</h3>
                  <p className="text-sm text-muted-foreground">Beheer leads</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
              </div>
            </SpotlightCard>

            <SpotlightCard 
              className="cursor-pointer transition-all duration-300 group hover:scale-[1.02] bg-white/60 backdrop-blur-sm border-white/40"
              spotlightColor="hsl(25 95% 53% / 0.3)"
              onClick={() => navigate('/goals')}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold">Doelen</h3>
                  <p className="text-sm text-muted-foreground">Track doelen</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
              </div>
            </SpotlightCard>
          </div>
        </div>
      </div>
    </Layout>
  );
}