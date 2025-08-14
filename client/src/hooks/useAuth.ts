import { useEffect, useState } from "react";
import type { User } from "@shared/schema";

export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const res = await fetch("/api/auth/user", { credentials: "include" });
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    fetchCurrentUser().then((u) => {
      if (mounted) {
        setUser(u);
        setIsLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  return { user, isLoading };
}
