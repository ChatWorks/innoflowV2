import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function SmartAssistantTest() {
  const [checking, setChecking] = useState(false);
  const { toast } = useToast();

  const checkStaleLeads = async () => {
    setChecking(true);
    try {
      // Get user settings
      const { data: settings } = await supabase
        .from('lead_settings')
        .select('stale_lead_days, enable_stale_detector')
        .maybeSingle();

      const staleDays = settings?.stale_lead_days || 14;
      const isEnabled = settings?.enable_stale_detector !== false;

      if (!isEnabled) {
        toast({
          title: "Stilgevallen lead detector uitgeschakeld",
          description: "Activeer de detector in de instellingen.",
          variant: "destructive",
        });
        return;
      }

      // Calculate cutoff date
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - staleDays);

      // Find leads that haven't been updated recently
      const { data: leads, error } = await supabase
        .from('leads')
        .select('id, updated_at, status')
        .lt('updated_at', cutoffDate.toISOString())
        .eq('is_stale', false)
        .not('status', 'in', '("Gewonnen","Verloren")');

      if (error) {
        console.error('Error checking stale leads:', error);
        return;
      }

      if (leads && leads.length > 0) {
        // Mark leads as stale
        const { error: updateError } = await supabase
          .from('leads')
          .update({ is_stale: true })
          .in('id', leads.map(lead => lead.id));

        if (updateError) {
          console.error('Error updating stale leads:', updateError);
          return;
        }

        toast({
          title: "Stilgevallen leads gedetecteerd",
          description: `${leads.length} leads zijn gemarkeerd als stilgevallen.`,
        });
      } else {
        toast({
          title: "Geen stilgevallen leads",
          description: "Alle leads zijn recent bijgewerkt.",
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setChecking(false);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Smart Assistant Test
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Test de Smart Assistant functionaliteit door handmatig te controleren op stilgevallen leads.
          </p>
          <Button 
            onClick={checkStaleLeads} 
            disabled={checking}
            variant="outline"
            className="w-full"
          >
            {checking && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
            Controleer op Stilgevallen Leads
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}