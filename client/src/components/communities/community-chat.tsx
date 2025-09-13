import { useEffect, useState, useRef } from "react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/use-websocket";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, Send, Smile, Search, Info } from "lucide-react";
import { Link } from "wouter";
import type { MessageWithAuthor, User } from "@shared/schema";

interface CommunityChatProps {
  communityId: string;
}

export function CommunityChat({ communityId }: CommunityChatProps) {
  const { user } = useAuth();
  const { sendMessage, on, off } = useWebSocket();
  const [messages, setMessages] = useState<MessageWithAuthor[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: initialMessages = [] } = useQuery<MessageWithAuthor[]>({
    queryKey: ['/api/communities', communityId, 'messages'],
    enabled: !!communityId,
  });

  const { data: members = [] } = useQuery<User[]>({
    queryKey: ['/api/communities', communityId, 'members'],
    enabled: !!communityId,
  });

  const { data: community } = useQuery({
    queryKey: ['/api/communities', communityId],
    enabled: !!communityId,
  });

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    const handleNewMessage = (data: any) => {
      if (data.message.communityId === communityId) {
        setMessages(prev => [...prev, data.message]);
      }
    };

    on('community_message', handleNewMessage);
    return () => off('community_message', handleNewMessage);
  }, [communityId, on, off]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !user) return;

    sendMessage({
      type: 'community_message',
      content: newMessage.trim(),
      authorId: user.id,
      communityId,
    });

    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!community) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-full">
      {/* Members Sidebar */}
      <div className="w-64 bg-card border-r border-border flex-shrink-0 hidden lg:block">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-card-foreground" data-testid={`community-title-${communityId}`}>
            {community.name}
          </h3>
          <p className="text-sm text-muted-foreground" data-testid={`community-member-count-${communityId}`}>
            {community.memberCount} members
          </p>
        </div>
        <ScrollArea className="flex-1 p-4">
          <h4 className="text-sm font-medium text-card-foreground mb-3">
            Online - {members.length}
          </h4>
          <div className="space-y-2">
            {members.map(member => (
              <div key={member.id} className="flex items-center space-x-2" data-testid={`member-${member.id}`}>
                <Avatar className="w-6 h-6">
                  <AvatarImage src={member.avatar || ""} />
                  <AvatarFallback>{member.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-card-foreground">{member.name}</span>
                <div className="w-2 h-2 bg-accent rounded-full"></div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <header className="bg-card border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button asChild variant="ghost" size="sm" className="lg:hidden">
              <Link href="/communities">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <div>
              <h3 className="font-semibold text-card-foreground"># general</h3>
              <p className="text-sm text-muted-foreground">{community.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" data-testid="button-search-messages">
              <Search className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" data-testid="button-community-info">
              <Info className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4 chat-scroll">
          <div className="space-y-4">
            {messages.map(message => (
              <div key={message.id} className="flex items-start space-x-3" data-testid={`message-${message.id}`}>
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={message.author?.avatar || ""} />
                  <AvatarFallback>{message.author?.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-card-foreground text-sm" data-testid={`message-author-${message.id}`}>
                      {message.author?.name || "Unknown User"}
                    </span>
                    <span className="text-xs text-muted-foreground" data-testid={`message-time-${message.id}`}>
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-card-foreground" data-testid={`message-content-${message.id}`}>
                    {message.content}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 bg-card border-t border-border">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" data-testid="button-add-attachment">
              <span className="text-lg">+</span>
            </Button>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Message #general..."
              className="flex-1"
              data-testid="input-message"
            />
            <Button variant="ghost" size="sm" data-testid="button-emoji">
              <Smile className="w-4 h-4" />
            </Button>
            <Button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              data-testid="button-send-message"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
