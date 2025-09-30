// hoc/withAuth.tsx
'use client'

import { Suspense } from "react";


import React, { useEffect, useState, ComponentType } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// Componente de carga
const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 bg-indigo-600 rounded-full animate-pulse"></div>
        </div>
      </div>
      <div className="text-center">
        <p className="text-gray-700 font-medium">Verificando autenticación...</p>
        <p className="text-gray-500 text-sm mt-1">Por favor espera un momento</p>
      </div>
    </div>
  </div>
);

interface WithAuthOptions {
  redirectTo?: string;
  requiredRole?: string;
  requiredRoles?: string[];
}

interface WithAuthProps {
  [key: string]: any;
}

const withAuth = <P extends WithAuthProps>(
  WrappedComponent: ComponentType<P>,
  options: WithAuthOptions = {}
) => {
  const { redirectTo = '/login', requiredRole, requiredRoles } = options;

  const ProtectedRoute: React.FC<P> = (props) => {
    return (
      <Suspense fallback={<div>Cargando autenticación...</div>}>
        <InnerProtectedRoute {...props} />
      </Suspense>
    );
  };

  // extraemos la lógica a un componente interno
  const InnerProtectedRoute: React.FC<P> = (props) => {
    const { user, loading, isAuthenticated } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);

    useEffect(() => {
      if (!mounted) return;
      if (!loading && !isAuthenticated()) {
        const currentUrl = searchParams.toString()
          ? `${pathname}?${searchParams.toString()}`
          : pathname;
        const loginUrl = `${redirectTo}?redirect=${encodeURIComponent(currentUrl)}`;
        router.replace(loginUrl);
        return;
      }

      if (mounted && user && (requiredRole || requiredRoles)) {
        const userRoles = user.roles?.map(r => r.name) || [];
        let hasRequiredRole = false;

        if (requiredRole) {
          hasRequiredRole = userRoles.includes(requiredRole);
        }
        if (requiredRoles && requiredRoles.length > 0) {
          hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
        }

        if (!hasRequiredRole) {
          router.replace('/unauthorized');
        }
      }
    }, [loading, user, isAuthenticated, router, pathname, searchParams, mounted]);

    if (!mounted || loading) return <LoadingSpinner />;
    if (!isAuthenticated()) return <LoadingSpinner />;

    return <WrappedComponent {...props} />;
  };

  ProtectedRoute.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name})`;
  return ProtectedRoute;
};


export default withAuth;

// Hook personalizado para verificar permisos
export const usePermissions = () => {
  const { user } = useAuth();

  const hasRole = (role: string): boolean => {
    return user?.roles?.some(r => r.name === role) || false;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    const userRoles = user?.roles?.map(r => r.name) || [];
    return roles.some(role => userRoles.includes(role));
  };

  const hasAllRoles = (roles: string[]): boolean => {
    const userRoles = user?.roles?.map(r => r.name) || [];
    return roles.every(role => userRoles.includes(role));
  };

  return {
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isAdmin: hasRole('ADMIN'),
    isUser: hasRole('USER'),
    isModerator: hasRole('MODERATOR')
  };
};