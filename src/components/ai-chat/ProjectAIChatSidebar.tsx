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
    <div className="h-full flex flex-col border-r bg-background">
      {/* Header */}
      <div className="p-4 border-b">
        <Button 
          onClick={handleNewChat}
          disabled={isCreating}
          className="w-full gap-2"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          Nieuwe Chat
        </Button>
      </div>

      {/* Chat History */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`group relative rounded-lg border transition-colors ${
                currentSessionId === session.id
                  ? 'bg-accent text-accent-foreground border-accent'
                  : 'hover:bg-accent/50 border-transparent'
              }`}
            >
              {editingSessionId === session.id ? (
                <div className="flex items-center gap-1 p-2">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEditSave();
                      if (e.key === 'Escape') handleEditCancel();
                    }}
                    className="h-6 text-xs"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleEditSave}
                    className="h-6 w-6 p-0"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleEditCancel}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2">
                  <Button
                    variant="ghost"
                    onClick={() => navigate(`/project/${projectId}/ai-chat/${session.id}`)}
                    className="flex-1 justify-start h-auto p-1 text-left"
                  >
                    <MessageSquare className="h-3 w-3 mr-2 flex-shrink-0" />
                    <span className="truncate text-xs">{session.title}</span>
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        onClick={() => handleEditStart(session.id, session.title)}
                      >
                        <Edit2 className="h-3 w-3 mr-2" />
                        Hernoemen
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(session.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-3 w-3 mr-2" />
                        Verwijderen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t text-xs text-muted-foreground">
        <p>AI Projectassistent</p>
        <p>Powered by GPT-5</p>
      </div>
    </div>
  );
};