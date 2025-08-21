import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjectChatMessages } from '@/hooks/useProjectChatMessages';
import { ChatMessage } from './ChatMessage';
import { Send, Loader2, Sparkles, Search } from 'lucide-react';
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
  
  // Debug logging
  console.log('ProjectAIChatContent - sessionId:', sessionId);
  console.log('ProjectAIChatContent - messages:', messages);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem('preferred_ai_model') || 'gpt-5-mini';
  });
  const [useWebSearch, setUseWebSearch] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Save model preference to localStorage
  useEffect(() => {
    localStorage.setItem('preferred_ai_model', selectedModel);
  }, [selectedModel]);

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
    const webSearch = useWebSearch;
    setInputMessage('');
    setUseWebSearch(false); // Reset web search for next message
    try {
      await sendAIMessage({
        message,
        projectContext,
        model: selectedModel,
        useWebSearch: webSearch
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
    return <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-gradient-to-br from-background via-background/50 to-primary/5">
        <div className="max-w-lg space-y-8">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
            <Sparkles className="h-12 w-12 text-white" />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-foreground">AI Projectassistent</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Selecteer een bestaand gesprek of start een nieuwe chat om vragen te stellen over je project.
            </p>
          </div>
          <div className="bg-card/80 backdrop-blur-sm p-6 rounded-xl border border-border/50 shadow-sm">
            <p className="text-sm text-muted-foreground leading-relaxed">
              De AI assistent heeft toegang tot al je projectgegevens en kan helpen met <span className="font-semibold text-primary">analyse</span>, 
              <span className="font-semibold text-primary"> planning</span> en <span className="font-semibold text-primary">optimalisatie</span> van je workflow.
            </p>
          </div>
        </div>
      </div>;
  }
  return <div className="h-full flex flex-col bg-gradient-to-br from-background via-background/50 to-primary/5">
      {/* Messages Area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1">
        <div className="min-h-full flex flex-col">
          {messages.length === 0 ? <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="max-w-lg space-y-8">
                <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                  <Sparkles className="h-10 w-10 text-white" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-foreground">Start een gesprek</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Stel een vraag over je project. Ik kan helpen met <span className="font-semibold text-primary">status updates</span>, 
                    <span className="font-semibold text-primary"> planning</span>, <span className="font-semibold text-primary">risico-analyse</span> en <span className="font-semibold text-primary">optimalisatie tips</span>.
                  </p>
                </div>
                
                {/* Quick Actions */}
                <div className="space-y-6">
                  <p className="text-sm font-semibold text-foreground">Probeer een van deze vragen:</p>
                  <div className="grid grid-cols-1 gap-3 max-w-md mx-auto">
                    {getQuickActions().map((action, index) => 
                      <Button 
                        key={index} 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setInputMessage(action)} 
                        className="h-auto py-4 px-5 whitespace-normal text-left justify-start bg-card/80 backdrop-blur-sm border-border/50 hover:bg-primary/10 hover:border-primary/30 transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <span className="text-sm font-medium text-foreground">{action}</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div> : <div className="space-y-0">
              {messages.map(message => <ChatMessage key={message.id} message={message} />)}
              
              {/* Loading indicator */}
              {isSendingAI && <div className="mx-6 my-4">
                  <div className="bg-gradient-to-br from-primary to-primary/80 text-white rounded-2xl p-6 shadow-lg">
                    <div className="flex gap-4 items-center">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                        <Loader2 className="h-5 w-5 text-white animate-spin" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-lg mb-1">AI Assistent</div>
                        <div className="text-white/90">Bezig met analyseren van je projectgegevens...</div>
                      </div>
                    </div>
                  </div>
                </div>}
            </div>}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border/20 p-6 bg-card/30 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* AI Model Selection */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-foreground">AI Model:</span>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-56 bg-background/80 border-border/50 hover:border-primary/30 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background/95 backdrop-blur-sm border-border/50">
                  <SelectItem value="gpt-5-mini" className="hover:bg-primary/10">GPT-5 Mini</SelectItem>
                  <SelectItem value="o4-mini-deep-research" className="hover:bg-primary/10">O4 Mini Deep Research</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quick actions for empty chat */}
          {messages.length === 0 && <div className="flex flex-wrap gap-3 justify-center">
              {getQuickActions().slice(0, 3).map((action, index) => 
                <Button 
                  key={index} 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setInputMessage(action)} 
                  className="bg-background/80 border-border/50 hover:bg-primary/10 hover:border-primary/30 transition-all duration-200"
                >
                  <span className="text-sm font-medium">{action}</span>
                </Button>
              )}
            </div>}
          
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <Textarea 
                ref={textareaRef} 
                value={inputMessage} 
                onChange={e => setInputMessage(e.target.value)} 
                onKeyDown={handleKeyPress} 
                placeholder="Stel een vraag over je project..." 
                rows={1} 
                className="min-h-[52px] max-h-32 resize-none bg-background/80 border-border/50 focus:border-primary/50 focus:ring-primary/20 text-base backdrop-blur-sm shadow-sm"
              />
            </div>
            <Button 
              onClick={() => setUseWebSearch(!useWebSearch)} 
              size="icon" 
              variant={useWebSearch ? "default" : "outline"}
              className={`h-[52px] w-[52px] transition-all duration-200 ${
                useWebSearch 
                  ? 'bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg' 
                  : 'bg-background/80 border-border/50 hover:bg-primary/10 hover:border-primary/30'
              }`}
              title={useWebSearch ? "Web zoeken uitschakelen" : "Web zoeken inschakelen"}
            >
              <Search className="h-5 w-5" />
            </Button>
            <Button 
              onClick={handleSendMessage} 
              disabled={!inputMessage.trim() || isSendingAI} 
              size="icon" 
              className="h-[52px] w-[52px] bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSendingAI ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            AI antwoorden kunnen onjuist zijn. Controleer belangrijke informatie altijd.
            {useWebSearch && <span className="text-primary font-semibold"> • Web zoeken ingeschakeld</span>}
          </p>
        </div>
      </div>
    </div>;
};