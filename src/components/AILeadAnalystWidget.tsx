import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Lead } from '@/types/lead';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Bot, Send, Loader2, Maximize2, X, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import { InnoflowLogo } from '@/components/ui/InnoflowLogo';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface AILeadAnalystWidgetProps {
  leads: Lead[];
}

export function AILeadAnalystWidget({ leads }: AILeadAnalystWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Add welcome message when component mounts
    setMessages([{
      id: '1',
      type: 'ai',
      content: `Hallo! 👋 Ik ben Inno, je AI Lead Analyst. Ik heb toegang tot alle ${leads.length} leads in je pipeline en kan je helpen met analyses, voorspellingen en strategische adviezen.

Wat wil je weten over je leads?`,
      timestamp: new Date()
    }]);
  }, [leads.length]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('lead-analyst', {
        body: {
          message: inputMessage,
          leads: leads
        }
      });

      if (error) {
        throw error;
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Fout bij AI Analyst",
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

  // Quick action buttons
  const quickActions = [
    "Welke leads hebben de hoogste prioriteit?",
    "Analyseer mijn stilgevallen leads",
    "Voorspel mijn omzet",
    "Welke leads moet ik deze week contacteren?"
  ];

  const ChatContent = ({ isFullscreenView = false }) => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-3">
          {isFullscreenView && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(false)}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Inno</h3>
            <p className="text-sm text-muted-foreground">AI AGENT</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isFullscreenView && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(true)}
              className="h-8 w-8"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-3 ${
                  message.type === 'user'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-muted text-foreground'
                }`}
              >
                <div className="text-sm">
                  <ReactMarkdown 
                    components={{
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>,
                      li: ({ children }) => <li>{children}</li>,
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl p-3 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Inno denkt na...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick Actions */}
      {!isFullscreenView && (
        <div className="p-4 pt-0">
          <div className="grid grid-cols-1 gap-2 mb-4">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs h-auto py-2 px-3 justify-start text-left whitespace-normal"
                onClick={() => setInputMessage(action)}
                disabled={isLoading}
              >
                {action}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 pt-0 border-t">
        <div className="flex gap-2 mb-3">
          <Input
            placeholder="Send us a message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="flex-1 rounded-full"
          />
          <Button 
            onClick={sendMessage} 
            disabled={isLoading || !inputMessage.trim()}
            size="icon"
            className="rounded-full bg-emerald-500 hover:bg-emerald-600"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {/* Powered by */}
        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
          <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center">
            <div className="w-2 h-2 bg-foreground rounded-sm"></div>
          </div>
          <span>Powered by</span>
          <InnoflowLogo size="sm" showText={true} className="ml-1" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Chat Widget Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 shadow-lg"
            size="icon"
          >
            <Bot className="h-6 w-6 text-white" />
          </Button>
        </div>
      )}

      {/* Chat Widget */}
      {isOpen && !isFullscreen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] z-50 shadow-2xl">
          <CardContent className="p-0 h-full">
            <ChatContent />
          </CardContent>
        </Card>
      )}

      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-4xl w-full h-[90vh] p-0">
          <ChatContent isFullscreenView={true} />
        </DialogContent>
      </Dialog>
    </>
  );
}