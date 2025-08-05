import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Target, TrendingUp, Users, DollarSign, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreateGoalData, GoalType, GoalCategory, Goal } from '@/types/goal';

interface GoalCreationDialogProps {
  onGoalCreated: () => void;
  trigger?: React.ReactNode;
  goal?: Goal; // Optional goal for editing
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const goalTemplates = [
  {
    id: 'sales_revenue',
    title: 'Sales Revenue Target',
    description: 'Achieve specific revenue goal',
    category: 'sales' as GoalCategory,
    type: 'numeric' as GoalType,
    target_unit: 'euros',
    icon: DollarSign,
    color: 'bg-green-500'
  },
  {
    id: 'project_completion',
    title: 'Project Completion',
    description: 'Complete project by deadline',
    category: 'projects' as GoalCategory,
    type: 'boolean' as GoalType,
    icon: Target,
    color: 'bg-blue-500'
  },
  {
    id: 'leads_generation',
    title: 'Lead Generation',
    description: 'Generate new qualified leads',
    category: 'sales' as GoalCategory,
    type: 'numeric' as GoalType,
    target_unit: 'leads',
    icon: TrendingUp,
    color: 'bg-purple-500'
  },
  {
    id: 'team_goal',
    title: 'Team Performance',
    description: 'Achieve team milestone',
    category: 'team' as GoalCategory,
    type: 'percentage' as GoalType,
    target_unit: 'percent',
    icon: Users,
    color: 'bg-orange-500'
  },
  {
    id: 'personal_development',
    title: 'Personal Development',
    description: 'Personal growth objective',
    category: 'personal' as GoalCategory,
    type: 'milestone' as GoalType,
    icon: User,
    color: 'bg-indigo-500'
  }
];

export function GoalCreationDialog({ 
  onGoalCreated, 
  trigger, 
  goal, 
  open: externalOpen, 
  onOpenChange: externalOnOpenChange 
}: GoalCreationDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  
  // Use external state if provided, otherwise use internal state
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;
  
  const [formData, setFormData] = useState<CreateGoalData>(() => {
    if (goal) {
      // Initialize with existing goal data for editing
      return {
        title: goal.title,
        description: goal.description || '',
        goal_type: goal.goal_type,
        category: goal.category,
        target_value: goal.target_value || 0,
        target_unit: goal.target_unit || '',
        deadline: goal.deadline || ''
      };
    }
    return {
      title: '',
      description: '',
      goal_type: 'numeric',
      category: 'personal',
      target_value: 0,
      target_unit: '',
      deadline: ''
    };
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleTemplateSelect = (templateId: string) => {
    const template = goalTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setFormData({
        ...formData,
        title: template.title,
        description: template.description,
        goal_type: template.type,
        category: template.category,
        target_unit: template.target_unit || ''
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({
        title: 'Titel vereist',
        description: 'Voer een titel in voor je doel.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Gebruiker niet ingelogd');
      }

      if (goal) {
        // Update existing goal
        const { error } = await supabase
          .from('goals')
          .update({
            title: formData.title,
            description: formData.description,
            goal_type: formData.goal_type,
            category: formData.category,
            target_value: formData.target_value,
            target_unit: formData.target_unit,
            deadline: formData.deadline
          })
          .eq('id', goal.id);

        if (error) throw error;

        toast({
          title: 'Doel bijgewerkt',
          description: 'Je doel is succesvol bijgewerkt!',
        });
      } else {
        // Create new goal
        const { error } = await supabase
          .from('goals')
          .insert({
            ...formData,
            user_id: user.id,
            notification_settings: formData.notification_settings || {
              enabled: true,
              frequency: 'daily',
              time: '09:00'
            }
          });

        if (error) throw error;

        toast({
          title: 'Doel aangemaakt',
          description: 'Je nieuwe doel is succesvol aangemaakt!',
        });
      }

      setOpen(false);
      if (!goal) {
        // Only reset form when creating new goal
        setFormData({
          title: '',
          description: '',
          goal_type: 'numeric',
          category: 'personal',
          target_value: 0,
          target_unit: '',
          deadline: ''
        });
        setSelectedTemplate(null);
      }
      onGoalCreated();
    } catch (error) {
      console.error('Error saving goal:', error);
      toast({
        title: goal ? 'Fout bij bijwerken' : 'Fout bij aanmaken',
        description: goal 
          ? 'Er is een fout opgetreden bij het bijwerken van je doel.'
          : 'Er is een fout opgetreden bij het aanmaken van je doel.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nieuw Doel
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{goal ? 'Doel Bewerken' : 'Nieuw Doel Aanmaken'}</DialogTitle>
          <DialogDescription>
            {goal 
              ? 'Pas je doel aan om je vooruitgang beter te kunnen tracken.'
              : 'Kies een template of maak een aangepast doel om je voortgang te tracken.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Templates - Only show when creating new goal */}
          {!goal && (
            <div className="space-y-3">
              <Label className="text-base font-medium">Kies een Template</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {goalTemplates.map((template) => {
                const IconComponent = template.icon;
                return (
                  <Card 
                    key={template.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedTemplate === template.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <div className={`p-2 rounded-lg ${template.color} text-white`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        {template.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground">{template.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
              </div>
            </div>
          )}

          {/* Goal Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Bijv. €50.000 omzet deze maand"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beschrijving</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optionele beschrijving van je doel..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categorie</Label>
                <Select value={formData.category} onValueChange={(value: GoalCategory) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="projects">Projecten</SelectItem>
                    <SelectItem value="personal">Persoonlijk</SelectItem>
                    <SelectItem value="team">Team</SelectItem>
                    <SelectItem value="financial">Financieel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formData.goal_type} onValueChange={(value: GoalType) => setFormData({ ...formData, goal_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="numeric">Numeriek</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="boolean">Ja/Nee</SelectItem>
                    <SelectItem value="milestone">Mijlpaal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.goal_type !== 'boolean' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="target_value">Doelwaarde</Label>
                  <Input
                    id="target_value"
                    type="number"
                    value={formData.target_value || ''}
                    onChange={(e) => setFormData({ ...formData, target_value: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target_unit">Eenheid</Label>
                  <Input
                    id="target_unit"
                    value={formData.target_unit || ''}
                    onChange={(e) => setFormData({ ...formData, target_unit: e.target.value })}
                    placeholder="bijv. euros, leads, uur"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline || ''}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Annuleren
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading 
                ? (goal ? 'Bijwerken...' : 'Aanmaken...') 
                : (goal ? 'Doel Bijwerken' : 'Doel Aanmaken')
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}