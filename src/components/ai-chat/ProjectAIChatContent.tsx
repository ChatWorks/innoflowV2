import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProjectChatMessages } from '@/hooks/useProjectChatMessages';
import { ChatMessage } from './ChatMessage';
import { Send, Loader2, Sparkles } from 'lucide-react';
interface ProjectAIChatContentProps {
  sessionId?: string;
  projectContext: any;
}
export const ProjectAIChatContent: React.FC<ProjectAIChatContentProps> = ({
  sessionId,
  projectContext
}) => {
  const {
    messages,
    sendAIMessage,
    isSendingAI
  } = useProjectChatMessages(sessionId);
  const [inputMessage, setInputMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  // Focus textarea on session change
  useEffect(() => {
    if (sessionId && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [sessionId]);
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !sessionId || isSendingAI) return;
    const message = inputMessage.trim();
    setInputMessage('');
    try {
      await sendAIMessage({
        message,
        projectContext
      });
    } catch (error) {
      console.error('Failed to send AI message:', error);
    }
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Quick action suggestions based on project context
  const getQuickActions = () => {
    const actions = ["Wat is de huidige projectstatus?", "Welke taken zijn nog open?", "Hoe loopt dit project qua tijd en budget?", "Wat zijn de grootste risico's?", "Welke deliverables zijn voltooid?"];

    // Add context-specific actions
    if (projectContext?.tasks?.some((t: any) => !t.completed)) {
      actions.push("Welke taken kan ik het beste eerst oppakken?");
    }
    if (projectContext?.deliverables?.some((d: any) => d.status === 'Overdue')) {
      actions.push("Welke deliverables zijn achterstallig?");
    }
    return actions.slice(0, 4); // Show max 4 quick actions
  };
  if (!sessionId) {
    return <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white">
        <div className="max-w-md space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">AI Projectassistent</h3>
          <p className="text-sm text-muted-foreground">
            Selecteer een bestaand gesprek of start een nieuwe chat om vragen te stellen over je project.
          </p>
          <p className="text-xs text-muted-foreground">
            De AI assistent heeft toegang tot al je projectgegevens en kan helpen met analyse, 
            planning en optimalisatie van je workflow.
          </p>
        </div>
      </div>;
  }
  return <div className="h-full flex flex-col">
      {/* Messages Area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1">
        <div className="min-h-full flex flex-col">
          {messages.length === 0 ? <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="max-w-md space-y-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-medium">Start een gesprek</h4>
                <p className="text-sm text-muted-foreground">
                  Stel een vraag over je project. Ik kan helpen met status updates, 
                  planning, risico-analyse en optimalisatie tips.
                </p>
                
                {/* Quick Actions */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Probeer een van deze vragen:</p>
                  <div className="grid grid-cols-1 gap-2">
                    {getQuickActions().map((action, index) => <Button key={index} variant="outline" size="sm" onClick={() => setInputMessage(action)} className="text-xs h-auto py-2 px-3 whitespace-normal text-left justify-start">
                        {action}
                      </Button>)}
                  </div>
                </div>
              </div>
            </div> : <div className="space-y-0">
              {messages.map(message => <ChatMessage key={message.id} message={message} />)}
              
              {/* Loading indicator */}
              {isSendingAI && <div className="flex gap-3 p-4 bg-muted/50">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Loader2 className="h-4 w-4 text-primary-foreground animate-spin" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm mb-2">AI Assistent</div>
                    <div className="text-sm text-muted-foreground">Bezig met analyseren...</div>
                  </div>
                </div>}
            </div>}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="max-w-4xl mx-auto space-y-3">
          {/* Quick actions for empty chat */}
          {messages.length === 0 && <div className="flex flex-wrap gap-2">
              {getQuickActions().slice(0, 3).map((action, index) => <Button key={index} variant="secondary" size="sm" onClick={() => setInputMessage(action)} className="text-xs">
                  {action}
                </Button>)}
            </div>}
          
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <Textarea ref={textareaRef} value={inputMessage} onChange={e => setInputMessage(e.target.value)} onKeyDown={handleKeyPress} placeholder="Stel een vraag over je project..." className="min-h-[44px] max-h-32 resize-none pr-12" rows={1} />
            </div>
            <Button onClick={handleSendMessage} disabled={!inputMessage.trim() || isSendingAI} size="icon" className="h-[44px] w-[44px]">
              {isSendingAI ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            AI antwoorden kunnen onjuist zijn. Controleer belangrijke informatie altijd.
          </p>
        </div>
      </div>
    </div>;
};