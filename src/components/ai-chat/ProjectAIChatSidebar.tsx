import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProjectChatSessions } from '@/hooks/useProjectChatSessions';
import { 
  Plus, 
  MessageSquare, 
  Edit2, 
  Trash2, 
  Check, 
  X,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate, useParams } from 'react-router-dom';

interface ProjectAIChatSidebarProps {
  projectId: string;
  currentSessionId?: string;
}

export const ProjectAIChatSidebar: React.FC<ProjectAIChatSidebarProps> = ({
  projectId,
  currentSessionId
}) => {
  const navigate = useNavigate();
  const { sessions, createSession, updateSession, deleteSession, isCreating } = useProjectChatSessions(projectId);
  
  // Debug logging
  console.log('ProjectAIChatSidebar - currentSessionId:', currentSessionId);
  console.log('ProjectAIChatSidebar - sessions:', sessions);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleNewChat = async () => {
    try {
      const newSession = await createSession('Nieuwe Chat');
      navigate(`/project/${projectId}/ai-chat/${newSession.id}`);
    } catch (error) {
      console.error('Failed to create new chat:', error);
    }
  };

  const handleEditStart = (sessionId: string, currentTitle: string) => {
    setEditingSessionId(sessionId);
    setEditTitle(currentTitle);
  };

  const handleEditSave = async () => {
    if (editingSessionId && editTitle.trim()) {
      try {
        await updateSession({ sessionId: editingSessionId, title: editTitle.trim() });
        setEditingSessionId(null);
        setEditTitle('');
      } catch (error) {
        console.error('Failed to update session title:', error);
      }
    }
  };

  const handleEditCancel = () => {
    setEditingSessionId(null);
    setEditTitle('');
  };

  const handleDelete = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      // If we deleted the current session, navigate to main chat page
      if (currentSessionId === sessionId) {
        navigate(`/project/${projectId}/ai-chat`);
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-primary to-primary/90">
      {/* Header */}
      <div className="p-6 border-b border-white/20">
        <Button 
          onClick={handleNewChat}
          disabled={isCreating}
          className="w-full gap-2 bg-white/20 hover:bg-white/30 text-white font-semibold backdrop-blur-sm border border-white/30 transition-all duration-200"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          Nieuwe Chat
        </Button>
      </div>

      {/* Chat History */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {sessions.length === 0 ? (
            <p className="text-sm text-white/70 text-center py-8">
              Nog geen gesprekken
            </p>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`group relative rounded-lg transition-all duration-200 ${
                  currentSessionId === session.id
                    ? 'bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg'
                    : 'hover:bg-white/10 border border-transparent'
                }`}
              >
                {editingSessionId === session.id ? (
                  <div className="flex items-center gap-2 p-4">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleEditSave();
                        if (e.key === 'Escape') handleEditCancel();
                      }}
                      className="h-8 text-sm bg-white/20 border-white/30 text-white placeholder:text-white/70 focus:border-white/50"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleEditSave}
                      className="h-7 w-7 p-0 text-green-300 hover:bg-green-500/20"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleEditCancel}
                      className="h-7 w-7 p-0 text-red-300 hover:bg-red-500/20"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-4">
                    <Button
                      variant="ghost"
                      onClick={() => navigate(`/project/${projectId}/ai-chat/${session.id}`)}
                      className="flex-1 justify-start h-auto p-0 text-left hover:bg-transparent"
                    >
                      <MessageSquare className="h-4 w-4 mr-3 flex-shrink-0 text-white/70" />
                      <span className="truncate text-sm font-medium text-white">{session.title}</span>
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-white/50 hover:text-white/80 hover:bg-white/10"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 bg-background/95 backdrop-blur-sm border-border/50">
                        <DropdownMenuItem
                          onClick={() => handleEditStart(session.id, session.title)}
                          className="text-foreground hover:bg-primary/10"
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Hernoemen
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(session.id)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Verwijderen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-6 border-t border-white/20 bg-white/10 backdrop-blur-sm">
        <div className="text-center">
          <p className="text-sm font-bold text-white">AI Projectassistent</p>
          <p className="text-xs text-white/70 mt-1">Powered by GPT-5</p>
        </div>
      </div>
    </div>
  );
};