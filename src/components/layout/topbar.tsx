"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut, User } from "lucide-react";

interface TopbarProps {
  userName: string;
  userRole: string;
}

export function Topbar({ userName, userRole }: TopbarProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6 pl-16 lg:pl-6">
      <div>
        <h2 className="text-sm font-medium text-gray-500 capitalize">
          {userRole} Portal
        </h2>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <span className="text-sm font-medium text-gray-700">{userName}</span>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </header>
  );
}
