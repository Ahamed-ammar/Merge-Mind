import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Home, 
  Users, 
  MessageSquare, 
  FileText, 
  User, 
  LogOut,
  Brain 
} from "lucide-react";

export function Navigation() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/communities", icon: Users, label: "Communities" },
    { href: "/messages", icon: MessageSquare, label: "Messages" },
    { href: "/articles", icon: FileText, label: "Articles" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="bg-card border-b border-border w-full flex-shrink-0">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Brain className="text-primary-foreground w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-card-foreground">MIND-MERGE</h1>
          </div>
          
          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.startsWith(item.href) && (item.href === "/" ? location === "/" : true);
              
              return (
                <Button
                  key={item.href}
                  variant={isActive ? "default" : "ghost"}
                  className="flex items-center space-x-2"
                  data-testid={`nav-${item.label.toLowerCase()}`}
                  asChild
                >
                  <Link href={item.href} {...(isActive && { "aria-current": "page" })}>
                    <Icon className="w-4 h-4" />
                    <span className="hidden lg:inline">{item.label}</span>
                  </Link>
                </Button>
              );
            })}
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user?.avatar || ""} />
              <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-card-foreground">
                {user?.name || "Unknown User"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-center space-x-1 pb-3 border-t border-border mt-3 pt-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Button
                key={item.href}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className="flex flex-col items-center space-y-1 h-12 px-3"
                data-testid={`nav-mobile-${item.label.toLowerCase()}`}
                asChild
              >
                <Link href={item.href} {...(isActive && { "aria-current": "page" })}>
                  <Icon className="w-4 h-4" />
                  <span className="text-xs">{item.label}</span>
                </Link>
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
