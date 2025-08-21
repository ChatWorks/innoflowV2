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
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <Button 
          onClick={handleNewChat}
          disabled={isCreating}
          className="w-full gap-2 bg-gray-900 hover:bg-gray-800 text-white font-medium"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          Nieuwe Chat
        </Button>
      </div>

      {/* Chat History */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {sessions.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              Nog geen gesprekken
            </p>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`group relative rounded-md transition-colors ${
                  currentSessionId === session.id
                    ? 'bg-gray-100 border border-gray-200'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                {editingSessionId === session.id ? (
                  <div className="flex items-center gap-2 p-3">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleEditSave();
                        if (e.key === 'Escape') handleEditCancel();
                      }}
                      className="h-8 text-sm border-gray-300 focus:border-gray-400"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleEditSave}
                      className="h-7 w-7 p-0 text-green-600 hover:bg-green-50"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleEditCancel}
                      className="h-7 w-7 p-0 text-red-600 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3">
                    <Button
                      variant="ghost"
                      onClick={() => navigate(`/project/${projectId}/ai-chat/${session.id}`)}
                      className="flex-1 justify-start h-auto p-0 text-left hover:bg-transparent"
                    >
                      <MessageSquare className="h-4 w-4 mr-3 flex-shrink-0 text-gray-500" />
                      <span className="truncate text-sm font-medium text-gray-800">{session.title}</span>
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 border-gray-200">
                        <DropdownMenuItem
                          onClick={() => handleEditStart(session.id, session.title)}
                          className="text-gray-700 hover:bg-gray-50"
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Hernoemen
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(session.id)}
                          className="text-red-600 hover:bg-red-50"
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
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-800">AI Projectassistent</p>
          <p className="text-xs text-gray-500 mt-1">Powered by GPT-5</p>
        </div>
      </div>
    </div>
  );
};