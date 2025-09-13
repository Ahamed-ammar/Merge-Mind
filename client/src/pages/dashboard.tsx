import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { CommunityCard } from "@/components/communities/community-card";
import { ArticleCard } from "@/components/articles/article-card";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus } from "lucide-react";
import type { CommunityWithAuthor, ArticleWithAuthor } from "@shared/schema";

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: userCommunities = [] } = useQuery<CommunityWithAuthor[]>({
    queryKey: ['/api/communities/user'],
  });

  const { data: recentArticles = [] } = useQuery<ArticleWithAuthor[]>({
    queryKey: ['/api/articles'],
    select: (data) => data.slice(0, 3), // Show only 3 recent articles
  });

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <header className="bg-card border-b border-border p-4 lg:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-card-foreground">Dashboard</h2>
            <p className="text-muted-foreground">Discover and join learning communities</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search communities..."
                className="pl-10 w-64"
                data-testid="input-search-communities"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6">
        {/* Quick Stats */}
        <DashboardStats />

        {/* Your Communities */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-card-foreground">Your Communities</h3>
          </div>
          
          {userCommunities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>You haven't joined any communities yet.</p>
              <p className="text-sm">Explore communities to connect with like-minded learners!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userCommunities.slice(0, 6).map(community => (
                <CommunityCard key={community.id} community={community} />
              ))}
            </div>
          )}
        </section>

        {/* Recent Articles */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-card-foreground">Recent Articles</h3>
          </div>
          
          {recentArticles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No articles available yet.</p>
              <p className="text-sm">Be the first to share knowledge with the community!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentArticles.map(article => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
