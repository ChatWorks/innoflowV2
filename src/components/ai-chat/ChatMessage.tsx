import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '@/hooks/useProjectChatMessages';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isAI = message.message_type === 'ai';

  return (
    <div className="mx-6 my-4 animate-fade-in">
      {isAI ? (
        // AI Message - Clean dark card with subtle gradient
        <div className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 text-white rounded-2xl p-6 shadow-xl border border-slate-600/50 hover:shadow-2xl transition-all duration-500 hover:scale-[1.01]">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12 flex-shrink-0 animate-scale-in">
              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
                <Bot className="h-6 w-6 text-white animate-pulse" />
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-3 min-w-0">
              <div className="flex items-center gap-3">
                <span className="font-bold text-lg text-white animate-slide-in-right">
                  AI Assistent
                </span>
                <div className="px-2 py-1 bg-emerald-500/20 rounded-full">
                  <span className="text-xs text-emerald-300 font-medium">
                    {new Date(message.created_at).toLocaleString('nl-NL', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: 'short'
                    })}
                  </span>
                </div>
              </div>
              
              <div className="text-base leading-relaxed text-white">
                <div className="prose prose-base max-w-none prose-invert">
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => <h1 className="text-2xl font-black text-white mb-4 mt-6 first:mt-0 leading-tight hover:text-emerald-300 transition-colors">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-xl font-bold text-white mb-3 mt-5 first:mt-0 leading-tight hover:text-emerald-300 transition-colors">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-lg font-bold text-white mb-2 mt-4 first:mt-0 leading-tight hover:text-emerald-300 transition-colors">{children}</h3>,
                      p: ({ children }) => <p className="mb-3 last:mb-0 text-white/95 leading-relaxed">{children}</p>,
                      ul: ({ children }) => <ul className="mb-4 list-disc pl-5 space-y-2 text-white/95">{children}</ul>,
                      ol: ({ children }) => <ol className="mb-4 list-decimal pl-5 space-y-2 text-white/95">{children}</ol>,
                      li: ({ children }) => <li className="leading-relaxed font-medium hover:text-emerald-200 transition-colors">{children}</li>,
                      strong: ({ children }) => <strong className="font-bold text-emerald-300">{children}</strong>,
                      em: ({ children }) => <em className="italic text-emerald-200 font-medium">{children}</em>,
                      code: ({ children }) => (
                        <code className="bg-slate-900/80 border border-slate-600/50 px-3 py-1 rounded-md text-sm font-mono text-emerald-300 shadow-inner">{children}</code>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-emerald-400/50 pl-4 py-2 my-4 bg-slate-900/40 text-white/95 italic font-medium rounded-r border-r border-t border-b border-slate-600/30">{children}</blockquote>
                      )
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // User Message - Clean white card with hover effects
        <div className="ml-16 animate-slide-in-right">
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-border transition-all duration-300 hover:scale-[1.005]">
            <div className="flex items-start gap-4">
              <Avatar className="h-10 w-10 flex-shrink-0 animate-scale-in">
                <AvatarFallback className="bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300/50">
                  <User className="h-5 w-5 text-slate-600" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2 min-w-0">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-base text-foreground">
                    Jij
                  </span>
                  <div className="px-2 py-1 bg-muted/50 rounded-full">
                    <span className="text-xs text-muted-foreground font-medium">
                      {new Date(message.created_at).toLocaleString('nl-NL', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: 'short'
                      })}
                    </span>
                  </div>
                </div>
                
                <div className="text-base leading-relaxed text-foreground">
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};