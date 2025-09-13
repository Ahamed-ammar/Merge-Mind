import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import type { CommunityWithAuthor } from "@shared/schema";
import { Link } from "wouter";

interface CommunityCardProps {
  community: CommunityWithAuthor;
}

export function CommunityCard({ community }: CommunityCardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const joinMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/communities/${community.id}/join`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/communities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/communities/user'] });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', `/api/communities/${community.id}/leave`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/communities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/communities/user'] });
    },
  });

  const handleToggleMembership = () => {
    if (community.isMember) {
      leaveMutation.mutate();
    } else {
      joinMutation.mutate();
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      {community.image && (
        <img 
          src={community.image} 
          alt={community.name}
          className="w-full h-32 object-cover"
        />
      )}
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-semibold text-card-foreground" data-testid={`community-name-${community.id}`}>
            {community.name}
          </h4>
          <Badge variant={community.isActive ? "default" : "secondary"}>
            {community.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
        
        <p className="text-muted-foreground text-sm mb-3" data-testid={`community-description-${community.id}`}>
          {community.description}
        </p>
        
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground" data-testid={`community-members-${community.id}`}>
            {community.memberCount} members
          </span>
          <Badge variant="outline">{community.category}</Badge>
        </div>

        <div className="flex gap-2">
          {community.isMember ? (
            <>
              <Button asChild size="sm" className="flex-1" data-testid={`button-enter-community-${community.id}`}>
                <Link href={`/communities/${community.id}`}>Enter</Link>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleToggleMembership}
                disabled={leaveMutation.isPending}
                data-testid={`button-leave-community-${community.id}`}
              >
                {leaveMutation.isPending ? "Leaving..." : "Leave"}
              </Button>
            </>
          ) : (
            <Button 
              onClick={handleToggleMembership}
              disabled={joinMutation.isPending}
              size="sm" 
              className="w-full"
              data-testid={`button-join-community-${community.id}`}
            >
              {joinMutation.isPending ? "Joining..." : "Join"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
