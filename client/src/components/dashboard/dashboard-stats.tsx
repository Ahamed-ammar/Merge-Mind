import { Card, CardContent } from "@/components/ui/card";
import { Users, FileText, Flame } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { CommunityWithAuthor, ArticleWithAuthor } from "@shared/schema";

export function DashboardStats() {
  const { data: communities = [] } = useQuery<CommunityWithAuthor[]>({
    queryKey: ['/api/communities/user'],
  });

  const { data: articles = [] } = useQuery<ArticleWithAuthor[]>({
    queryKey: ['/api/articles/user'],
  });

  const stats = [
    {
      label: "Communities Joined",
      value: communities.length,
      icon: Users,
      color: "bg-primary/10 text-primary",
    },
    {
      label: "Articles Published", 
      value: articles.length,
      icon: FileText,
      color: "bg-secondary/10 text-secondary",
    },
    {
      label: "Study Streak",
      value: "25 days",
      icon: Flame,
      color: "bg-accent/10 text-accent",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">{stat.label}</p>
                  <p className="text-2xl font-semibold text-card-foreground" data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
