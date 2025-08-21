-- Create project chat sessions table
CREATE TABLE public.project_chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Nieuwe Chat',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project chat messages table  
CREATE TABLE public.project_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  user_id UUID NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('user', 'ai')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.project_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_chat_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for project_chat_sessions
CREATE POLICY "Users can view their own chat sessions"
ON public.project_chat_sessions
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own chat sessions"
ON public.project_chat_sessions
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own chat sessions"
ON public.project_chat_sessions
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own chat sessions"
ON public.project_chat_sessions
FOR DELETE
USING (user_id = auth.uid());

-- Create RLS policies for project_chat_messages
CREATE POLICY "Users can view their own chat messages"
ON public.project_chat_messages
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own chat messages"
ON public.project_chat_messages
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own chat messages"
ON public.project_chat_messages
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own chat messages"
ON public.project_chat_messages
FOR DELETE
USING (user_id = auth.uid());

-- Add foreign key constraint for session_id
ALTER TABLE public.project_chat_messages
ADD CONSTRAINT fk_session_id
FOREIGN KEY (session_id) REFERENCES public.project_chat_sessions(id) ON DELETE CASCADE;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_chat_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates on sessions
CREATE TRIGGER update_chat_sessions_updated_at
BEFORE UPDATE ON public.project_chat_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_chat_session_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_project_chat_sessions_project_user ON public.project_chat_sessions(project_id, user_id);
CREATE INDEX idx_project_chat_messages_session ON public.project_chat_messages(session_id);
CREATE INDEX idx_project_chat_messages_created_at ON public.project_chat_messages(created_at);