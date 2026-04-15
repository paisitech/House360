"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import type { Tenant } from "@/types";

interface TenantFormProps {
  tenant?: Tenant;
  action: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
}

export function TenantForm({ tenant, action }: TenantFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await action(formData);

    if (result.success) {
      toast(tenant ? "Tenant updated" : "Tenant added", "success");
      router.push("/landlord/tenants");
      router.refresh();
    } else {
      setError(result.error || "Something went wrong");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <Input
        id="full_name"
        name="full_name"
        label="Full Name"
        placeholder="Tenant's full name"
        defaultValue={tenant?.full_name}
        required
      />
      <Input
        id="phone"
        name="phone"
        label="Phone Number"
        placeholder="01XXXXXXXXX"
        defaultValue={tenant?.phone}
        required
      />
      <Input
        id="email"
        name="email"
        label="Email (Optional)"
        type="email"
        placeholder="tenant@example.com"
        defaultValue={tenant?.email || ""}
      />
      <Input
        id="nid_number"
        name="nid_number"
        label="NID Number (Optional)"
        placeholder="National ID number"
        defaultValue={tenant?.nid_number || ""}
      />
      <Input
        id="emergency_contact"
        name="emergency_contact"
        label="Emergency Contact (Optional)"
        placeholder="Emergency contact number"
        defaultValue={tenant?.emergency_contact || ""}
      />
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <div className="flex gap-3 pt-2">
        <Button type="submit" isLoading={loading}>
          {tenant ? "Update Tenant" : "Add Tenant"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
