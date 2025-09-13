import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileEditModal } from "@/components/profile/profile-edit-modal";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, FileText, Mail, Github, Linkedin } from "lucide-react";
import type { ArticleWithAuthor } from "@shared/schema";

export default function Profile() {
  const { user } = useAuth();
  const [editModalOpen, setEditModalOpen] = useState(false);

  const { data: userArticles = [] } = useQuery<ArticleWithAuthor[]>({
    queryKey: ['/api/articles/user'],
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

      <div className="max-w-4xl mx-auto p-6 pb-20 lg:pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Info */}
          <div className="lg:col-span-2 space-y-6">
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
                    Edit
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
                <h2 className="text-xl font-semibold text-card-foreground mb-4">Skills</h2>
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

            {/* Recent Activity */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-card-foreground mb-4">Recent Activity</h2>
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => {
                    const Icon = activity.icon;
                    return (
                      <div key={index} className="flex items-start space-x-3" data-testid={`activity-${index}`}>
                        <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-accent" />
                        </div>
                        <div>
                          <p className="text-card-foreground">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-card-foreground mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-card-foreground" data-testid="text-user-email">
                      {user.email}
                    </span>
                  </div>
                  
                  {user.github && (
                    <div className="flex items-center space-x-2">
                      <Github className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-primary" data-testid="text-user-github">
                        @{user.github}
                      </span>
                    </div>
                  )}
                  
                  {user.linkedin && (
                    <div className="flex items-center space-x-2">
                      <Linkedin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-primary" data-testid="text-user-linkedin">
                        LinkedIn Profile
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Learning Stats */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-card-foreground mb-4">Learning Stats</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Articles Published</span>
                      <span className="text-card-foreground font-medium" data-testid="stat-articles-published">
                        {userArticles.length}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Study Streak</span>
                      <span className="text-card-foreground font-medium" data-testid="stat-study-streak">
                        25 days
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-accent h-2 rounded-full" style={{width: '83%'}}></div>
                    </div>
                  </div>
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
