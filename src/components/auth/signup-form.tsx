"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SignupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"landlord" | "tenant">("landlord");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push(role === "landlord" ? "/landlord" : "/tenant");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="fullName"
        label="Full Name"
        type="text"
        placeholder="Enter your full name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
      />
      <Input
        id="email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        id="password"
        label="Password"
        type="password"
        placeholder="Create a password (min 6 characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={6}
        required
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          I am a
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole("landlord")}
            className={`rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
              role === "landlord"
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            Landlord
          </button>
          <button
            type="button"
            onClick={() => setRole("tenant")}
            className={`rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
              role === "tenant"
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            Tenant
          </button>
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" isLoading={loading}>
        Create account
      </Button>
      <p className="text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="text-blue-600 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
