import { useEffect, useState } from "react";

export async function fetchCurrentUser() {
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
  const [user, setUser] = useState(null);
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
