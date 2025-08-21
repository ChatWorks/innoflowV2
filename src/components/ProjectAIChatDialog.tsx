import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, Loader2, Brain, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';
import { Project, Deliverable, Task, Phase, TimeEntry, Meeting } from '@/types/project';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface ProjectAIChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  deliverables: Deliverable[];
  tasks: Task[];
  phases: Phase[];
  timeEntries: TimeEntry[];
  meetings: Meeting[];
}

export function ProjectAIChatDialog({ 
  isOpen, 
  onClose, 
  project, 
  deliverables, 
  tasks, 
  phases, 
  timeEntries,
  meetings 
}: ProjectAIChatDialogProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load chat history from localStorage
  useEffect(() => {
    if (isOpen && project) {
      const savedMessages = localStorage.getItem(`project_chat_${project.id}`);
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        const messagesWithValidTimestamps = (parsed.messages || []).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp) // Convert string/number back to Date
        }));
        setMessages(messagesWithValidTimestamps);
      } else {
        // Welcome message
        setMessages([{
          id: '1',
          type: 'ai',
          content: `Hallo! Ik ben je AI Project Assistent voor "${project.name}". Ik heb toegang tot alle projectdata: fasen, deliverables, taken, tijdregistraties en voortgang. 

Ik kan je helpen met projectanalyses, efficiency optimalisatie, planning en concrete adviezen op basis van je huidige projectstatus.

Wat wil je weten over dit project?`,
          timestamp: new Date()
        }]);
      }
    }
  }, [isOpen, project]);

  // Save messages to localStorage
  const saveMessages = (newMessages: Message[]) => {
    if (project) {
      const dataToSave = {
        messages: newMessages.slice(-10), // Keep last 10 messages
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(`project_chat_${project.id}`, JSON.stringify(dataToSave));
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !project) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      console.log('Sending message to AI:', inputMessage);
      const { data, error } = await supabase.functions.invoke('project-ai-chat', {
        body: {
          message: inputMessage,
          projectId: project.id,
          projectContext: {
            project,
            deliverables,
            tasks,
            phases,
            timeEntries,
            meetings
          },
          chatHistory: newMessages.slice(-10) // Send last 10 messages for context
        }
      });

      console.log('AI Response data:', data);
      console.log('AI Response error:', error);

      if (error) {
        throw error;
      }

      if (!data?.response) {
        console.error('No response in data:', data);
        throw new Error('Geen response ontvangen van AI');
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: data.response,
        timestamp: new Date()
      };

      console.log('Adding AI message:', aiMessage);
      const finalMessages = [...newMessages, aiMessage];
      setMessages(finalMessages);
      saveMessages(finalMessages);

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Fout bij AI Project Assistent",
        description: "Er is een fout opgetreden bij het verwerken van je vraag.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Generate context-aware quick actions
  const getQuickActions = () => {
    if (!project) return [];
    
    const actions = ["Wat is de huidige projectstatus?"];
    
    // Progress-based suggestions
    if (project.progress < 25) {
      actions.push("Welke taken hebben prioriteit?");
    } else if (project.progress > 80) {
      actions.push("Wat moet ik nog afronden?");
    }

    // Time-based suggestions
    const overdueTasks = tasks.filter(task => !task.completed);
    if (overdueTasks.length > 0) {
      actions.push("Welke taken zijn nog niet af?");
    }

    actions.push("Analyseer de project efficiency");
    actions.push("Tips voor tijdmanagement");

    return actions.slice(0, 4); // Max 4 actions
  };

  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Project Assistent - {project.name}
            <div className="flex items-center gap-1 text-sm font-normal text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              {deliverables.length} deliverables • {tasks.length} taken
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 space-y-4">
          {/* Chat Messages */}
          <ScrollArea className="h-96 w-full border rounded-lg p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.type === 'ai' && (
                      <div className="flex items-center gap-2 mb-2">
                        <Bot className="h-4 w-4 text-primary" />
                        <span className="text-xs font-medium text-primary">AI Project Assistent</span>
                      </div>
                    )}
                    <div className="text-sm markdown-content">
                      <ReactMarkdown 
                        components={{
                          strong: ({ children }) => <strong className={`font-semibold ${message.type === 'user' ? 'text-primary-foreground' : 'text-foreground'}`}>{children}</strong>,
                          ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>,
                          li: ({ children }) => <li className={message.type === 'user' ? 'text-primary-foreground' : 'text-foreground'}>{children}</li>,
                          p: ({ children }) => <p className={`${message.type === 'user' ? 'text-primary-foreground' : 'text-foreground'} mb-2 last:mb-0`}>{children}</p>
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                    <span className="text-xs opacity-70 mt-1 block">
                      {new Date(message.timestamp).toLocaleTimeString('nl-NL', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm">AI Assistent analyseert je project...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            {getQuickActions().map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs h-auto py-2 px-3"
                onClick={() => setInputMessage(action)}
                disabled={isLoading}
              >
                {action}
              </Button>
            ))}
          </div>

          {/* Message Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Vraag iets over dit project..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={sendMessage} 
              disabled={isLoading || !inputMessage.trim()}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}