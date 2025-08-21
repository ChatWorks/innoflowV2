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
        // AI Message - Clean white card with subtle border
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12 flex-shrink-0 animate-scale-in">
              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-sm">
                <Bot className="h-6 w-6 text-white" />
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-3 min-w-0">
              <div className="flex items-center gap-3">
                <span className="font-bold text-lg text-slate-900 animate-slide-in-right">
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
              
              <div className="text-base leading-relaxed text-slate-700">
                <div className="prose prose-base max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => <h1 className="text-2xl font-black text-slate-900 mb-4 mt-6 first:mt-0 leading-tight">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-xl font-bold text-slate-900 mb-3 mt-5 first:mt-0 leading-tight">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-lg font-bold text-slate-900 mb-2 mt-4 first:mt-0 leading-tight">{children}</h3>,
                      p: ({ children }) => <p className="mb-3 last:mb-0 text-slate-700 leading-relaxed">{children}</p>,
                      ul: ({ children }) => <ul className="mb-4 list-disc pl-5 space-y-2 text-slate-700">{children}</ul>,
                      ol: ({ children }) => <ol className="mb-4 list-decimal pl-5 space-y-2 text-slate-700">{children}</ol>,
                      li: ({ children }) => <li className="leading-relaxed font-medium">{children}</li>,
                      strong: ({ children }) => <strong className="font-bold text-emerald-700">{children}</strong>,
                      em: ({ children }) => <em className="italic text-emerald-600 font-medium">{children}</em>,
                      code: ({ children }) => (
                        <code className="bg-slate-100 border border-slate-200 px-3 py-1 rounded-md text-sm font-mono text-emerald-700">{children}</code>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-emerald-300 pl-4 py-2 my-4 bg-emerald-50 text-slate-700 italic font-medium rounded-r border border-emerald-200">{children}</blockquote>
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
        <div className="ml-16 animate-slide-in-right">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <Avatar className="h-10 w-10 flex-shrink-0 animate-scale-in">
                <AvatarFallback className="bg-slate-100 border border-slate-200">
                  <User className="h-5 w-5 text-slate-600" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2 min-w-0">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-base text-slate-900">
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
                
                <div className="text-base leading-relaxed text-slate-700">
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