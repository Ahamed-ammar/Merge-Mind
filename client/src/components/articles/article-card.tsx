import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, Bookmark } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { ArticleWithAuthor } from "@shared/schema";

interface ArticleCardProps {
  article: ArticleWithAuthor;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/articles/${article.id}/like`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/articles'] });
    },
  });

  const handleLike = () => {
    likeMutation.mutate();
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
      {article.image && (
        <img 
          src={article.image} 
          alt={article.title}
          className="w-full h-48 object-cover"
        />
      )}
      <CardContent className="p-6">
        <div className="flex items-center space-x-2 mb-3">
          <Badge variant="secondary" data-testid={`article-category-${article.id}`}>
            {article.category}
          </Badge>
          <span className="text-xs text-muted-foreground" data-testid={`article-read-time-${article.id}`}>
            {article.readTime} min read
          </span>
        </div>
        
        <h3 className="font-semibold text-card-foreground mb-2" data-testid={`article-title-${article.id}`}>
          {article.title}
        </h3>
        
        <p className="text-muted-foreground text-sm mb-4" data-testid={`article-excerpt-${article.id}`}>
          {article.excerpt}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src={article.author?.avatar || ""} />
              <AvatarFallback>{article.author?.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground" data-testid={`article-author-${article.id}`}>
              {article.author?.name || "Unknown Author"}
            </span>
          </div>
          
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleLike}
              disabled={likeMutation.isPending}
              className="hover:text-red-500"
              data-testid={`button-like-article-${article.id}`}
            >
              <Heart className="w-4 h-4" />
              <span className="text-xs ml-1" data-testid={`article-likes-${article.id}`}>
                {article.likes}
              </span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="hover:text-blue-500"
              data-testid={`button-bookmark-article-${article.id}`}
            >
              <Bookmark className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
