"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Detects recovery/reset links that land on "/" with hash tokens
 * (e.g. http://localhost:3000/#access_token=...&type=recovery)
 * and forwards them to /update-password preserving the hash.
 */
export function HashRedirector() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const { hash, pathname } = window.location;
    if (pathname === "/" && hash.includes("access_token") && hash.includes("type=recovery")) {
      router.replace(`/update-password${hash}`);
    }
  }, [router]);

  return null;
}
