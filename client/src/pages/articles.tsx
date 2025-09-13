import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArticleCard } from "@/components/articles/article-card";
import { CreateArticleModal } from "@/components/articles/create-article-modal";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus } from "lucide-react";
import type { ArticleWithAuthor } from "@shared/schema";

export default function Articles() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const { data: allArticles = [], isLoading } = useQuery<ArticleWithAuthor[]>({
    queryKey: ['/api/articles', searchTerm],
    queryFn: async () => {
      const url = searchTerm 
        ? `/api/articles?search=${encodeURIComponent(searchTerm)}`
        : '/api/articles';
      const res = await fetch(url, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch articles');
      return res.json();
    },
  });

  const { data: userArticles = [] } = useQuery<ArticleWithAuthor[]>({
    queryKey: ['/api/articles/user'],
    enabled: activeTab === "my",
  });

  const displayArticles = activeTab === "my" ? userArticles : allArticles;

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <header className="bg-card border-b border-border p-4 lg:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-card-foreground">Articles</h2>
            <p className="text-muted-foreground">Discover and share knowledge</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search articles..."
                className="pl-10 w-64"
                data-testid="input-search-articles"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            </div>
            <Button onClick={() => setCreateModalOpen(true)} data-testid="button-create-article">
              <Plus className="w-4 h-4 mr-2" />
              Write Article
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6">
        {/* Filter Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="all" data-testid="tab-all-articles">All Articles</TabsTrigger>
            <TabsTrigger value="my" data-testid="tab-my-articles">My Articles</TabsTrigger>
            <TabsTrigger value="bookmarked" data-testid="tab-bookmarked-articles">Bookmarked</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading articles...</p>
              </div>
            ) : displayArticles.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm ? "No articles found matching your search." : "No articles available yet."}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {searchTerm ? "Try adjusting your search terms." : "Be the first to share knowledge!"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayArticles.map(article => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="my" className="mt-6">
            {userArticles.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">You haven't published any articles yet.</p>
                <p className="text-sm text-muted-foreground mt-2">Share your knowledge with the community!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userArticles.map(article => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="bookmarked" className="mt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Bookmarked articles feature coming soon!</p>
              <p className="text-sm text-muted-foreground mt-2">Save articles to read them later.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <CreateArticleModal 
        open={createModalOpen} 
        onClose={() => setCreateModalOpen(false)} 
      />
    </div>
  );
}
