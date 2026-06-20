import { User } from "@/types/user";

export class AuthService {
  static async login(username: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    return res.json();
  }

  static async me(): Promise<{ authenticated: boolean; user?: User }> {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        return res.json();
      }
    } catch (e) {
      console.error("AuthService.me failed:", e);
    }
    return { authenticated: false };
  }
}
