"use client";

import { useRouter } from "next/navigation";
import { LogoutIcon } from "@/components/Icon";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      className="md-icon-button"
      onClick={handleSignOut}
      aria-label="Sign out"
      title="Sign out"
    >
      <LogoutIcon />
    </button>
  );
}
