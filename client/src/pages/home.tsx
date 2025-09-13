import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { CommunityCard } from "@/components/communities/community-card";
import { ArticleCard } from "@/components/articles/article-card";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Search, Plus, ArrowRight, BookOpen, Users } from "lucide-react";
import { Link } from "wouter";
import type { CommunityWithAuthor, ArticleWithAuthor } from "@shared/schema";

export default function Home() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: userCommunities = [] } = useQuery<CommunityWithAuthor[]>({
    queryKey: ['/api/communities/user'],
  });

  const { data: recentArticles = [] } = useQuery<ArticleWithAuthor[]>({
    queryKey: ['/api/articles'],
    select: (data) => data.slice(0, 3),
  });

  return (
    <div className="h-full overflow-y-auto">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b border-border">
        <div className="container mx-auto px-4 lg:px-6 py-12">
          <div className="max-w-4xl">
            <Badge variant="secondary" className="mb-4">
              👋 Welcome back, {user?.name?.split(' ')[0] || 'Learner'}!
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
              Your Learning Hub
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              Discover new communities, engage in discussions, and share your knowledge with learners worldwide.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="relative flex-1 max-w-md">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search communities, articles, or topics..."
                  className="pl-10 h-12 text-base"
                  data-testid="input-search-global"
                />
                <Search className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
              </div>
              <Button asChild size="lg" className="h-12 px-6" data-testid="button-explore-communities">
                <Link href="/communities">
                  <Users className="w-4 h-4 mr-2" />
                  Explore Communities
                </Link>
              </Button>
            </div>

            {/* Quick Stats */}
            <DashboardStats />
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 lg:px-6 py-8">
        {/* Your Communities Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-card-foreground">Your Communities</h2>
              <p className="text-muted-foreground">Stay connected with your learning groups</p>
            </div>
            <Button asChild variant="outline" data-testid="button-view-all-communities">
              <Link href="/communities">
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
          
          {userCommunities.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent className="pt-6">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Communities Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Join your first community to start connecting with like-minded learners!
                </p>
                <Button asChild data-testid="button-find-communities">
                  <Link href="/communities">
                    <Plus className="w-4 h-4 mr-2" />
                    Find Communities
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userCommunities.slice(0, 6).map(community => (
                <CommunityCard key={community.id} community={community} />
              ))}
            </div>
          )}
        </section>

        {/* Recent Articles Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-card-foreground">Latest Articles</h2>
              <p className="text-muted-foreground">Fresh knowledge from the community</p>
            </div>
            <Button asChild variant="outline" data-testid="button-view-all-articles">
              <Link href="/articles">
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
          
          {recentArticles.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent className="pt-6">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Articles Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Be the first to share your knowledge and insights with the community!
                </p>
                <Button asChild data-testid="button-write-article">
                  <Link href="/articles">
                    <Plus className="w-4 h-4 mr-2" />
                    Write Article
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentArticles.map(article => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-2xl font-semibold text-card-foreground mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="card-join-community">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2 text-primary" />
                  Join a Community
                </CardTitle>
                <CardDescription>
                  Find and connect with learning communities that match your interests
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="card-start-discussion">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-primary" />
                  Share Knowledge
                </CardTitle>
                <CardDescription>
                  Write articles and share your expertise with the community
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="card-update-profile">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2 text-primary" />
                  Update Profile
                </CardTitle>
                <CardDescription>
                  Customize your profile and showcase your skills and interests
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}