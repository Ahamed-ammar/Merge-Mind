import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileEditModal } from "@/components/profile/profile-edit-modal";
import { ArticleCard } from "@/components/articles/article-card";
import { CommunityCard } from "@/components/communities/community-card";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, FileText, Mail, Github, Linkedin, Users, Bookmark, Calendar, TrendingUp } from "lucide-react";
import type { ArticleWithAuthor, CommunityWithAuthor } from "@shared/schema";

export default function Profile() {
  const { user } = useAuth();
  const [editModalOpen, setEditModalOpen] = useState(false);

  const { data: userArticles = [] } = useQuery<ArticleWithAuthor[]>({
    queryKey: ['/api/articles/user'],
  });

  const { data: savedArticles = [] } = useQuery<ArticleWithAuthor[]>({
    queryKey: ['/api/articles/saved'],
  });

  const { data: userCommunities = [] } = useQuery<CommunityWithAuthor[]>({
    queryKey: ['/api/communities/user'],
  });

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  const recentActivities = [
    {
      type: "comment",
      description: "Posted in React Developers community",
      timestamp: "2 hours ago",
      icon: MessageSquare,
    },
    {
      type: "article",
      description: `Published article "${userArticles[0]?.title || 'Getting Started with React Hooks'}"`,
      timestamp: "1 day ago", 
      icon: FileText,
    },
  ];

  return (
    <div className="h-full overflow-y-auto">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-primary to-secondary p-8 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-6">
            <Avatar className="w-24 h-24 border-4 border-white">
              <AvatarImage src={user.avatar || ""} />
              <AvatarFallback className="text-2xl">
                {user.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold" data-testid="text-user-name">
                {user.name}
              </h1>
              {user.title && (
                <p className="text-primary-foreground/80" data-testid="text-user-title">
                  {user.title}
                </p>
              )}
              {user.location && (
                <p className="text-primary-foreground/60" data-testid="text-user-location">
                  {user.location}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 pb-20 lg:pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Profile Info */}
          <div className="lg:col-span-3 space-y-6">
            {/* About Section */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-card-foreground">About</h2>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditModalOpen(true)}
                    data-testid="button-edit-profile"
                  >
                    Edit Profile
                  </Button>
                </div>
                <p className="text-card-foreground" data-testid="text-user-bio">
                  {user.bio || "No bio added yet. Click edit to add information about yourself."}
                </p>
              </CardContent>
            </Card>

            {/* Skills Section */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-card-foreground mb-4">Skills & Expertise</h2>
                {user.skills && user.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.skills.map(skill => (
                      <Badge key={skill} variant="secondary" data-testid={`skill-${skill}`}>
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No skills added yet.</p>
                )}
              </CardContent>
            </Card>

            {/* Content Tabs */}
            <Card>
              <CardContent className="p-6">
                <Tabs defaultValue="posts" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="posts" data-testid="tab-posts">
                      My Posts ({userArticles.length})
                    </TabsTrigger>
                    <TabsTrigger value="saved" data-testid="tab-saved">
                      Saved Articles ({savedArticles.length})
                    </TabsTrigger>
                    <TabsTrigger value="communities" data-testid="tab-communities">
                      My Communities ({userCommunities.length})
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="posts" className="mt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Published Articles</h3>
                        <Badge variant="outline">{userArticles.length} articles</Badge>
                      </div>
                      {userArticles.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {userArticles.map(article => (
                            <ArticleCard key={article.id} article={article} />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>You haven't published any articles yet.</p>
                          <p className="text-sm">Share your knowledge with the community!</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="saved" className="mt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Saved Articles</h3>
                        <Badge variant="outline">{savedArticles.length} saved</Badge>
                      </div>
                      {savedArticles.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {savedArticles.map(article => (
                            <ArticleCard key={article.id} article={article} />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No saved articles yet.</p>
                          <p className="text-sm">Save articles you find interesting to read later!</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="communities" className="mt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Joined Communities</h3>
                        <Badge variant="outline">{userCommunities.length} communities</Badge>
                      </div>
                      {userCommunities.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {userCommunities.map(community => (
                            <CommunityCard key={community.id} community={community} />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No communities joined yet.</p>
                          <p className="text-sm">Join communities to connect with like-minded learners!</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Community Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span>Community Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Member Since</span>
                  <span className="font-medium" data-testid="stat-member-since">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      year: 'numeric' 
                    }) : 'Recently'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Communities Joined</span>
                  <span className="font-medium text-primary" data-testid="stat-communities-joined">
                    {userCommunities.length}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Articles Published</span>
                  <span className="font-medium text-primary" data-testid="stat-articles-published">
                    {userArticles.length}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Articles Saved</span>
                  <span className="font-medium text-primary" data-testid="stat-articles-saved">
                    {savedArticles.length}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-card-foreground" data-testid="text-user-email">
                    {user.email}
                  </span>
                </div>
                
                {user.github && (
                  <div className="flex items-center space-x-2">
                    <Github className="w-4 h-4 text-muted-foreground" />
                    <a 
                      href={`https://github.com/${user.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline" 
                      data-testid="link-user-github"
                    >
                      @{user.github}
                    </a>
                  </div>
                )}
                
                {user.linkedin && (
                  <div className="flex items-center space-x-2">
                    <Linkedin className="w-4 h-4 text-muted-foreground" />
                    <a 
                      href={user.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline" 
                      data-testid="link-user-linkedin"
                    >
                      LinkedIn Profile
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Learning Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span>Learning Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Study Streak</span>
                    <span className="text-card-foreground font-medium" data-testid="stat-study-streak">
                      25 days
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{width: '83%'}}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Learning Goal Progress</span>
                    <span className="text-card-foreground font-medium">67%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{width: '67%'}}></div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-4">
                  <Calendar className="w-4 h-4" />
                  <span>Active for {Math.floor(Math.random() * 30 + 1)} days this month</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ProfileEditModal 
        open={editModalOpen} 
        onClose={() => setEditModalOpen(false)} 
      />
    </div>
  );
}
