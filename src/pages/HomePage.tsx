import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Users, Briefcase, TrendingUp, ArrowRight } from 'lucide-react';
import Layout from '@/components/Layout';
import SpotlightCard from '@/components/ui/SpotlightCard';

export default function HomePage() {
  const navigate = useNavigate();

  const navigationCards = [
    {
      title: 'Projecten',
      description: 'Beheer en volg de voortgang van al je projecten',
      icon: Briefcase,
      href: '/projecten',
      color: 'bg-blue-500',
      stats: 'Project management'
    },
    {
      title: 'Leads',
      description: 'Volg potentiële klanten en zet ze om naar projecten',
      icon: Users,
      href: '/leads',
      color: 'bg-green-500',
      stats: 'Lead tracking'
    },
    {
      title: 'Doelen',
      description: 'Stel doelen in en track je vooruitgang',
      icon: Target,
      href: '/goals',
      color: 'bg-purple-500',
      stats: 'Goal tracking'
    }
  ];

  return (
    <Layout>
      <div className="container mx-auto p-6">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Welkom bij Innoflow
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Streamline je werkprocessen met onze geïntegreerde projectmanagement, 
            lead tracking en doelen dashboard.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Efficiëntie</h3>
              <p className="text-muted-foreground">
                Verhoog je productiviteit met geïntegreerde tools
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-4">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Focus</h3>
              <p className="text-muted-foreground">
                Houd je doelen in het vizier en bereik meer
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-4">
                <Briefcase className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Overzicht</h3>
              <p className="text-muted-foreground">
                Behoud het overzicht over al je projecten
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Cards */}
        <div className="space-y-6">
          {/* Projects - Full Width */}
          <SpotlightCard 
            className="cursor-pointer transition-all duration-200 group"
            spotlightColor="hsl(var(--primary) / 0.2)"
            onClick={() => navigate('/projecten')}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">Projecten</h3>
            <p className="text-muted-foreground mb-6">
              Beheer en volg de voortgang van al je projecten
            </p>
            <Button 
              variant="outline" 
              className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/projecten');
              }}
            >
              Ga naar Projecten
            </Button>
          </SpotlightCard>

          {/* Leads - Full Width with 1 Stat */}
          <SpotlightCard 
            className="cursor-pointer transition-all duration-200 group"
            spotlightColor="hsl(var(--primary) / 0.2)"
            onClick={() => navigate('/leads')}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">Leads</h3>
            <p className="text-muted-foreground mb-4">
              Volg potentiële klanten en zet ze om naar projecten
            </p>
            <div className="bg-background/50 rounded-lg p-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">Lead tracking</div>
                <div className="text-sm text-muted-foreground">Actieve leads beheer</div>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/leads');
              }}
            >
              Ga naar Leads
            </Button>
          </SpotlightCard>

          {/* Goals - Full Width with 2 Stats Side by Side */}
          <SpotlightCard 
            className="cursor-pointer transition-all duration-200 group"
            spotlightColor="hsl(var(--primary) / 0.2)"
            onClick={() => navigate('/goals')}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">Doelen</h3>
            <p className="text-muted-foreground mb-4">
              Stel doelen in en track je vooruitgang
            </p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-background/50 rounded-lg p-4 text-center">
                <div className="text-xl font-bold text-purple-600">Goal tracking</div>
                <div className="text-sm text-muted-foreground">Doelen beheer</div>
              </div>
              <div className="bg-background/50 rounded-lg p-4 text-center">
                <div className="text-xl font-bold text-purple-600">Voortgang</div>
                <div className="text-sm text-muted-foreground">Progress tracking</div>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/goals');
              }}
            >
              Ga naar Doelen
            </Button>
          </SpotlightCard>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="pt-6 pb-6">
              <h2 className="text-2xl font-bold mb-4">Klaar om te beginnen?</h2>
              <p className="text-lg mb-6 opacity-90">
                Start met het beheren van je projecten, leads en doelen in één centrale plek.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  variant="secondary" 
                  size="lg"
                  onClick={() => navigate('/projecten')}
                  className="gap-2"
                >
                  <Briefcase className="h-5 w-5" />
                  Bekijk Projecten
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => navigate('/leads')}
                  className="gap-2 bg-transparent border-white text-white hover:bg-white hover:text-primary"
                >
                  <Users className="h-5 w-5" />
                  Beheer Leads
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}