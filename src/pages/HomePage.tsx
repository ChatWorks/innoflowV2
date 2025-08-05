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
            className="cursor-pointer transition-all duration-300 group hover:scale-[1.02]"
            spotlightColor="hsl(var(--primary) / 0.3)"
            onClick={() => navigate('/projecten')}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Briefcase className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold mb-2">Projecten</h3>
                  <p className="text-muted-foreground text-lg">
                    Beheer en volg de voortgang van al je projecten
                  </p>
                </div>
              </div>
              <ArrowRight className="h-6 w-6 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
            </div>
          </SpotlightCard>

          {/* Second Row: Leads + Project Stat */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Leads */}
            <SpotlightCard 
              className="cursor-pointer transition-all duration-300 group hover:scale-[1.02]"
              spotlightColor="hsl(142 76% 36% / 0.3)"
              onClick={() => navigate('/leads')}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Leads</h3>
                  <p className="text-muted-foreground">
                    Potentiële klanten beheren
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300 ml-auto" />
            </SpotlightCard>

            {/* Project Statistics */}
            <SpotlightCard className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-purple-700 dark:text-purple-300">Project Status</h3>
                  <p className="text-purple-600 dark:text-purple-400">
                    Huidige projectvoortgang
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/60 dark:bg-purple-900/30 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-purple-700 dark:text-purple-300">85%</div>
                  <div className="text-sm text-purple-600 dark:text-purple-400">Gemiddelde voortgang</div>
                </div>
                <div className="bg-white/60 dark:bg-purple-900/30 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-purple-700 dark:text-purple-300">12</div>
                  <div className="text-sm text-purple-600 dark:text-purple-400">Actieve projecten</div>
                </div>
              </div>
            </SpotlightCard>
          </div>

          {/* Third Row: Goals Stat + Leads Stat + Goals */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Goals Statistics */}
            <SpotlightCard className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50 border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-orange-700 dark:text-orange-300">Doel Voortgang</h4>
                  <p className="text-sm text-orange-600 dark:text-orange-400">Maandelijkse targets</p>
                </div>
              </div>
              <div className="bg-white/60 dark:bg-orange-900/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">67%</div>
                <div className="text-sm text-orange-600 dark:text-orange-400">Bereikt dit kwartaal</div>
              </div>
            </SpotlightCard>

            {/* Leads Statistics */}
            <SpotlightCard className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-green-700 dark:text-green-300">Lead Conversie</h4>
                  <p className="text-sm text-green-600 dark:text-green-400">Deze maand</p>
                </div>
              </div>
              <div className="bg-white/60 dark:bg-green-900/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">24</div>
                <div className="text-sm text-green-600 dark:text-green-400">Nieuwe prospects</div>
              </div>
            </SpotlightCard>

            {/* Goals */}
            <SpotlightCard 
              className="cursor-pointer transition-all duration-300 group hover:scale-[1.02]"
              spotlightColor="hsl(25 95% 53% / 0.3)"
              onClick={() => navigate('/goals')}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Doelen</h3>
                  <p className="text-muted-foreground text-sm">
                    Stel doelen in en track vooruitgang
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300 ml-auto" />
            </SpotlightCard>
          </div>
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