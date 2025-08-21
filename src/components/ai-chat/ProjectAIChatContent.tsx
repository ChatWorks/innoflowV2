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
    return <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white">
        <div className="max-w-lg space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
            <Sparkles className="h-10 w-10 text-gray-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">AI Projectassistent</h2>
            <p className="text-base text-gray-600">
              Selecteer een bestaand gesprek of start een nieuwe chat om vragen te stellen over je project.
            </p>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            De AI assistent heeft toegang tot al je projectgegevens en kan helpen met **analyse**, 
            **planning** en **optimalisatie** van je workflow.
          </p>
        </div>
      </div>;
  }
  return <div className="h-full flex flex-col bg-white">
      {/* Messages Area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 bg-white">
        <div className="min-h-full flex flex-col">
          {messages.length === 0 ? <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white">
              <div className="max-w-lg space-y-6">
                <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center bg-gray-100">
                  <Sparkles className="h-8 w-8 text-gray-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-900">Start een gesprek</h3>
                  <p className="text-base text-gray-600 leading-relaxed">
                    Stel een vraag over je project. Ik kan helpen met **status updates**, 
                    **planning**, **risico-analyse** en **optimalisatie tips**.
                  </p>
                </div>
                
                {/* Quick Actions */}
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-gray-700">Probeer een van deze vragen:</p>
                  <div className="grid grid-cols-1 gap-3 max-w-md mx-auto">
                    {getQuickActions().map((action, index) => <Button key={index} variant="outline" size="sm" onClick={() => setInputMessage(action)} className="text-sm h-auto py-3 px-4 whitespace-normal text-left justify-start text-gray-700 border-gray-200 hover:bg-gray-50 font-medium">
                        {action}
                      </Button>)}
                  </div>
                </div>
              </div>
            </div> : <div className="space-y-0 bg-white">
              {messages.map(message => <ChatMessage key={message.id} message={message} />)}
              
              {/* Loading indicator */}
              {isSendingAI && <div className="flex gap-4 p-6 bg-gray-50 border-b border-gray-200">
                  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                    <Loader2 className="h-4 w-4 text-white animate-spin" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-base mb-1 text-gray-900">AI Assistent</div>
                    <div className="text-sm text-gray-600">Bezig met analyseren van je projectgegevens...</div>
                  </div>
                </div>}
            </div>}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-6 bg-white">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* AI Model Selection */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">AI Model:</span>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-5-mini">GPT-5 Mini</SelectItem>
                  <SelectItem value="o4-mini-deep-research">O4 Mini Deep Research</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quick actions for empty chat */}
          {messages.length === 0 && <div className="flex flex-wrap gap-2 justify-center">
              {getQuickActions().slice(0, 3).map((action, index) => <Button key={index} variant="outline" size="sm" onClick={() => setInputMessage(action)} className="text-sm border-gray-200 text-gray-700 hover:bg-gray-50">
                  {action}
                </Button>)}
            </div>}
          
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <Textarea ref={textareaRef} value={inputMessage} onChange={e => setInputMessage(e.target.value)} onKeyDown={handleKeyPress} placeholder="Stel een vraag over je project..." rows={1} className="min-h-[48px] max-h-32 resize-none border-gray-300 focus:border-gray-400 focus:ring-gray-400 text-base" />
            </div>
            <Button 
              onClick={() => {}} // Disabled
              size="icon" 
              variant="outline"
              disabled={true}
              className="h-[48px] w-[48px] opacity-50 cursor-not-allowed"
              title="Web zoeken is tijdelijk niet beschikbaar"
            >
              <Search className="h-5 w-5" />
            </Button>
            <Button onClick={handleSendMessage} disabled={!inputMessage.trim() || isSendingAI} size="icon" className="h-[48px] w-[48px] bg-gray-900 hover:bg-gray-800">
              {isSendingAI ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 text-center">
            AI antwoorden kunnen onjuist zijn. Controleer belangrijke informatie altijd.
          </p>
        </div>
      </div>
    </div>;
};