import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthService } from "@/services/auth.service";
import { User } from "@/types/user";

interface UseAuthOptions {
  requiredRole?: string | string[];
  redirectIfNotAuth?: string;
}

export function useAuth(options: UseAuthOptions = {}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      try {
        const data = await AuthService.me();
        if (!isMounted) return;

        if (data.authenticated && data.user) {
          setUser(data.user);
          setAuthenticated(true);

          if (options.requiredRole) {
            const roles = Array.isArray(options.requiredRole)
              ? options.requiredRole
              : [options.requiredRole];
            if (!roles.includes(data.user.role)) {
              // Redirect to complaints if wrong role
              router.push("/complaints");
            }
          }
        } else {
          setUser(null);
          setAuthenticated(false);
          if (options.redirectIfNotAuth) {
            const redirectUrl = `/login?redirect=${encodeURIComponent(options.redirectIfNotAuth)}`;
            router.push(redirectUrl);
          }
        }
      } catch (err) {
        console.error("useAuth error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    checkAuth();
    return () => {
      isMounted = false;
    };
  }, [options.requiredRole, options.redirectIfNotAuth, router]);

  return { user, loading, authenticated, role: user?.role, constituency: user?.constituency };
}
