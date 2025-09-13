import { useAuth } from "@/hooks/use-auth";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Home, 
  Users, 
  MessageSquare, 
  FileText, 
  Bell,
  Search,
  ChevronDown,
  Brain,
  User,
  LogOut
} from "lucide-react";
import { useState } from "react";

export function Navigation() {
  const { user, logout } = useAuth();
  const { isAdminAuthenticated } = useAdminAuth();
  const [location] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Create a unified user object that works for both regular users and admin
  const currentUser = user || (isAdminAuthenticated ? { name: "Admin", avatar: null } : null);
  
  const handleLogout = async () => {
    if (isAdminAuthenticated) {
      // Admin logout
      try {
        await fetch('/api/admin/logout', { method: 'POST' });
        window.location.href = '/';
      } catch (error) {
        console.error('Admin logout error:', error);
      }
    } else {
      // Regular user logout
      logout();
    }
  };

  const navItems = [
    { href: "/", icon: Home, label: "Home", hasNotification: true },
    { href: "/communities", icon: Users, label: "My Network" },
    { href: "/articles", icon: FileText, label: "Articles" },
    { href: "/messages", icon: MessageSquare, label: "Messaging" },
    { href: "/notifications", icon: Bell, label: "Notifications", notificationCount: 16 },
  ];

  return (
    <nav className="bg-zinc-900 border-b border-zinc-800 w-full flex-shrink-0">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Left Side - Brand + Search */}
          <div className="flex items-center space-x-4">
            {/* Brand */}
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                <Brain className="text-white w-5 h-5" />
              </div>
            </div>
            
            {/* Search */}
            <div className="relative hidden sm:block">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search"
                className="pl-10 w-64 bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-400 focus:border-blue-500 focus:ring-blue-500"
                data-testid="input-search-navbar"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            </div>
          </div>
          
          {/* Right Side - Navigation Items */}
          <div className="hidden md:flex items-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.startsWith(item.href) && (item.href === "/" ? location === "/" : true);
              
              return (
                <Link key={item.href} href={item.href} className="relative">
                  <div
                    className={`flex flex-col items-center px-3 py-2 mx-1 transition-colors hover:bg-zinc-800 rounded-t-lg ${
                      isActive ? 'text-white' : 'text-zinc-300'
                    }`}
                    data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                  >
                    <div className="relative">
                      <Icon className="w-6 h-6" />
                      {/* Notification Dot */}
                      {item.hasNotification && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                      )}
                      {/* Notification Count Badge */}
                      {item.notificationCount && (
                        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                          {item.notificationCount > 99 ? '99+' : item.notificationCount}
                        </div>
                      )}
                    </div>
                    <span className="text-xs mt-1 font-medium">{item.label}</span>
                    {/* Active underline */}
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
                    )}
                  </div>
                </Link>
              );
            })}
            
            {/* User Profile Menu */}
            <div className="relative ml-2 group">
              <div
                className="flex flex-col items-center px-3 py-2 mx-1 transition-colors hover:bg-zinc-800 rounded-t-lg text-zinc-300 hover:text-white cursor-pointer"
                data-testid="button-user-menu"
              >
                <Avatar className="w-6 h-6">
                  <AvatarImage src={currentUser?.avatar || ""} />
                  <AvatarFallback className="bg-zinc-600 text-white text-xs">
                    {currentUser?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center mt-1">
                  <span className="text-xs font-medium">Me</span>
                  <ChevronDown className="w-3 h-3 ml-1" />
                </div>
              </div>
              
              {/* Dropdown menu */}
              <div className="absolute right-0 top-full mt-1 w-48 bg-zinc-800 rounded-md shadow-lg border border-zinc-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <Link href="/profile">
                  <div className="px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700 flex items-center cursor-pointer" data-testid="menu-profile">
                    <User className="w-4 h-4 mr-2" />
                    View Profile
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-700 flex items-center"
                  data-testid="button-logout"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-around pb-3 border-t border-zinc-800 mt-3 pt-3">
          {navItems.slice(0, 4).map((item) => { // Show only first 4 items on mobile
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex flex-col items-center py-2 px-3 transition-colors ${
                    isActive ? 'text-white' : 'text-zinc-400'
                  }`}
                  data-testid={`nav-mobile-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  <div className="relative">
                    <Icon className="w-5 h-5" />
                    {item.hasNotification && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                    )}
                    {item.notificationCount && (
                      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium">
                        {item.notificationCount > 9 ? '9+' : item.notificationCount}
                      </div>
                    )}
                  </div>
                  <span className="text-xs mt-1 font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
          
          {/* Mobile User Profile */}
          <Link href="/profile">
            <div className="flex flex-col items-center py-2 px-3 text-zinc-400 cursor-pointer" data-testid="button-mobile-profile">
              <Avatar className="w-5 h-5">
                <AvatarImage src={currentUser?.avatar || ""} />
                <AvatarFallback className="bg-zinc-600 text-white text-xs">
                  {currentUser?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs mt-1 font-medium">Me</span>
            </div>
          </Link>
          
          {/* Mobile Logout */}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center py-2 px-3 text-zinc-400"
            data-testid="button-mobile-logout"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-xs mt-1 font-medium">Exit</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
