import { useState, useEffect, createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";

interface AdminAuthContextType {
  isAdminAuthenticated: boolean;
  loading: boolean;
  checkAdminAuth: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  const { data: adminStatus, isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/status'],
    queryFn: async () => {
      const res = await fetch('/api/admin/status');
      if (!res.ok) throw new Error('Failed to check admin status');
      return res.json();
    },
    retry: false,
  });

  useEffect(() => {
    if (adminStatus?.isAuthenticated) {
      setIsAdminAuthenticated(true);
    } else {
      setIsAdminAuthenticated(false);
    }
  }, [adminStatus]);

  const checkAdminAuth = () => {
    refetch();
  };

  return (
    <AdminAuthContext.Provider
      value={{
        isAdminAuthenticated,
        loading: isLoading,
        checkAdminAuth,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}