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
    <div className={`flex gap-3 p-4 ${isAI ? 'bg-muted/50' : ''}`}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback className={isAI ? 'bg-primary' : 'bg-secondary'}>
          {isAI ? (
            <Bot className="h-4 w-4 text-primary-foreground" />
          ) : (
            <User className="h-4 w-4 text-secondary-foreground" />
          )}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">
            {isAI ? 'AI Assistent' : 'Jij'}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(message.created_at).toLocaleString('nl-NL', {
              hour: '2-digit',
              minute: '2-digit',
              day: '2-digit',
              month: 'short'
            })}
          </span>
        </div>
        
        <div className={`text-sm ${isAI ? 'text-foreground' : 'text-foreground'}`}>
          {isAI ? (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="mb-2 list-disc pl-4">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-2 list-decimal pl-4">{children}</ol>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  code: ({ children }) => (
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{children}</code>
                  )
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}
        </div>
      </div>
    </div>
  );
};