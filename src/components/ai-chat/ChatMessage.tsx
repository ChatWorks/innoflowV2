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
    <div className={`flex gap-4 p-6 border-b border-gray-100 ${isAI ? 'bg-gray-50' : 'bg-white'}`}>
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarFallback className={isAI ? 'bg-gray-700' : 'bg-gray-500'}>
          {isAI ? (
            <Bot className="h-5 w-5 text-white" />
          ) : (
            <User className="h-5 w-5 text-white" />
          )}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 space-y-3 min-w-0">
        <div className="flex items-center gap-3">
          <span className="font-bold text-base text-gray-900">
            {isAI ? 'AI Assistent' : 'Jij'}
          </span>
          <span className="text-sm text-gray-500">
            {new Date(message.created_at).toLocaleString('nl-NL', {
              hour: '2-digit',
              minute: '2-digit',
              day: '2-digit',
              month: 'short'
            })}
          </span>
        </div>
        
        <div className="text-base leading-relaxed text-gray-800">
          {isAI ? (
            <div className="prose prose-base max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 className="text-2xl font-bold text-gray-900 mb-4 mt-6 first:mt-0">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-xl font-bold text-gray-900 mb-3 mt-5 first:mt-0">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-lg font-bold text-gray-900 mb-2 mt-4 first:mt-0">{children}</h3>,
                  p: ({ children }) => <p className="mb-4 last:mb-0 text-gray-800 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="mb-4 list-disc pl-6 space-y-2 text-gray-800">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-4 list-decimal pl-6 space-y-2 text-gray-800">{children}</ol>,
                  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                  strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
                  em: ({ children }) => <em className="italic text-gray-800">{children}</em>,
                  code: ({ children }) => (
                    <code className="bg-gray-200 px-2 py-1 rounded text-sm font-mono text-gray-800">{children}</code>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-gray-300 pl-4 py-2 my-4 bg-gray-100 text-gray-700 italic">{children}</blockquote>
                  )
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-gray-800 leading-relaxed">{message.content}</p>
          )}
        </div>
      </div>
    </div>
  );
};