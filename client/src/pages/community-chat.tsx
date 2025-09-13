import { useParams } from "wouter";
import { CommunityChat } from "@/components/communities/community-chat";

export default function CommunityChatPage() {
  const params = useParams();
  const communityId = params.id;

  if (!communityId) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Community not found</p>
      </div>
    );
  }

  return <CommunityChat communityId={communityId} />;
}
