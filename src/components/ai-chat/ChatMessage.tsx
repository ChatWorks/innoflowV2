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
    <div className="mx-3 my-3 animate-fade-in">
      {isAI ? (
        // AI Message - Clean white card with subtle border
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <Avatar className="h-9 w-9 flex-shrink-0 animate-scale-in">
              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-sm">
                <Bot className="h-5 w-5 text-white" />
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-slate-900 animate-slide-in-right">
                  AI Assistent
                </span>
                <div className="px-2 py-1 bg-emerald-50 rounded-full border border-emerald-200">
                  <span className="text-xs text-emerald-700 font-medium">
                    {new Date(message.created_at).toLocaleString('nl-NL', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: 'short'
                    })}
                  </span>
                </div>
              </div>
              
              <div className="text-sm leading-relaxed text-slate-700">
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => <h1 className="text-xl font-black text-slate-900 mb-3 mt-4 first:mt-0 leading-tight">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-lg font-bold text-slate-900 mb-2 mt-4 first:mt-0 leading-tight">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-base font-bold text-slate-900 mb-2 mt-3 first:mt-0 leading-tight">{children}</h3>,
                      p: ({ children }) => <p className="mb-2 last:mb-0 text-slate-700 leading-relaxed">{children}</p>,
                      ul: ({ children }) => <ul className="mb-3 list-disc pl-4 space-y-1 text-slate-700">{children}</ul>,
                      ol: ({ children }) => <ol className="mb-3 list-decimal pl-4 space-y-1 text-slate-700">{children}</ol>,
                      li: ({ children }) => <li className="leading-relaxed font-medium">{children}</li>,
                      strong: ({ children }) => <strong className="font-bold text-emerald-700">{children}</strong>,
                      em: ({ children }) => <em className="italic text-emerald-600 font-medium">{children}</em>,
                      code: ({ children }) => (
                        <code className="bg-slate-100 border border-slate-200 px-2 py-1 rounded-md text-xs font-mono text-emerald-700">{children}</code>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-emerald-300 pl-3 py-2 my-3 bg-emerald-50 text-slate-700 italic font-medium rounded-r border border-emerald-200">{children}</blockquote>
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
        // User Message - Clean white card
        <div className="ml-12 animate-slide-in-right">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8 flex-shrink-0 animate-scale-in">
                <AvatarFallback className="bg-slate-100 border border-slate-200">
                  <User className="h-4 w-4 text-slate-600" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">
                    Jij
                  </span>
                  <div className="px-2 py-1 bg-slate-50 rounded-full border border-slate-200">
                    <span className="text-xs text-slate-500 font-medium">
                      {new Date(message.created_at).toLocaleString('nl-NL', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: 'short'
                      })}
                    </span>
                  </div>
                </div>
                
                <div className="text-sm leading-relaxed text-slate-700">
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