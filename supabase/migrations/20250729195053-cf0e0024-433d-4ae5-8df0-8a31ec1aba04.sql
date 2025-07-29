-- Create lead_settings table for Smart Assistant configuration
CREATE TABLE public.lead_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  enable_stale_detector BOOLEAN NOT NULL DEFAULT true,
  stale_lead_days INTEGER NOT NULL DEFAULT 14,
  enable_follow_up_reminders BOOLEAN NOT NULL DEFAULT true,
  notify_in_app BOOLEAN NOT NULL DEFAULT true,
  notify_by_email BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.lead_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own lead settings" 
ON public.lead_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lead settings" 
ON public.lead_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lead settings" 
ON public.lead_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lead settings" 
ON public.lead_settings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_lead_settings_updated_at
BEFORE UPDATE ON public.lead_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to ensure user_id is set correctly
CREATE TRIGGER ensure_lead_settings_user_id
BEFORE INSERT OR UPDATE ON public.lead_settings
FOR EACH ROW
EXECUTE FUNCTION public.ensure_user_id();