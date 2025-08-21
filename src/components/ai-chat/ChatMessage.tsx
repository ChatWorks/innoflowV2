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
    <div className="mx-6 my-4">
      {isAI ? (
        // AI Message - Blue gradient card
        <div className="bg-gradient-to-br from-primary to-primary/80 text-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12 flex-shrink-0">
              <AvatarFallback className="bg-white/20 backdrop-blur-sm">
                <Bot className="h-6 w-6 text-white" />
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-3 min-w-0">
              <div className="flex items-center gap-3">
                <span className="font-bold text-lg text-white">
                  AI Assistent
                </span>
                <span className="text-sm text-white/80">
                  {new Date(message.created_at).toLocaleString('nl-NL', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: 'short'
                  })}
                </span>
              </div>
              
              <div className="text-base leading-relaxed text-white">
                <div className="prose prose-base max-w-none prose-invert">
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => <h1 className="text-2xl font-black text-white mb-4 mt-6 first:mt-0 leading-tight">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-xl font-bold text-white mb-3 mt-5 first:mt-0 leading-tight">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-lg font-bold text-white mb-2 mt-4 first:mt-0 leading-tight">{children}</h3>,
                      p: ({ children }) => <p className="mb-3 last:mb-0 text-white leading-relaxed">{children}</p>,
                      ul: ({ children }) => <ul className="mb-4 list-disc pl-5 space-y-2 text-white">{children}</ul>,
                      ol: ({ children }) => <ol className="mb-4 list-decimal pl-5 space-y-2 text-white">{children}</ol>,
                      li: ({ children }) => <li className="leading-relaxed font-medium">{children}</li>,
                      strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
                      em: ({ children }) => <em className="italic text-white/90 font-medium">{children}</em>,
                      code: ({ children }) => (
                        <code className="bg-white/20 px-2 py-1 rounded text-sm font-mono text-white">{children}</code>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-white/30 pl-4 py-2 my-4 bg-white/10 text-white/95 italic font-medium rounded-r">{children}</blockquote>
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
        // User Message - White card with subtle shadow
        <div className="ml-16">
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarFallback className="bg-muted">
                  <User className="h-5 w-5 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2 min-w-0">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-base text-foreground">
                    Jij
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(message.created_at).toLocaleString('nl-NL', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: 'short'
                    })}
                  </span>
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