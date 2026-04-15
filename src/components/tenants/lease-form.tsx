"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

interface VacantUnit {
  id: string;
  unit_number: string;
  monthly_rent: number;
  property_name: string;
}

interface TenantOption {
  id: string;
  full_name: string;
  phone: string;
}

interface LeaseFormProps {
  tenantId?: string;
  unitId?: string;
  vacantUnits?: VacantUnit[];
  tenants?: TenantOption[];
  defaultRent?: number;
  action: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
}

export function LeaseForm({
  tenantId,
  unitId,
  vacantUnits,
  tenants,
  defaultRent,
  action,
}: LeaseFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedRent, setSelectedRent] = useState<number>(defaultRent ?? 0);

  function handleUnitChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const unit = vacantUnits?.find((u) => u.id === e.target.value);
    if (unit) setSelectedRent(unit.monthly_rent);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await action(formData);

    if (result.success) {
      toast("Lease created successfully", "success");
      router.back();
      router.refresh();
    } else {
      setError(result.error || "Something went wrong");
    }
    setLoading(false);
  }

  // Group vacant units by property
  const grouped = vacantUnits?.reduce<Record<string, VacantUnit[]>>(
    (acc, unit) => {
      const key = unit.property_name;
      if (!acc[key]) acc[key] = [];
      acc[key].push(unit);
      return acc;
    },
    {}
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      {/* Tenant selector (when coming from unit context) */}
      {tenantId ? (
        <input type="hidden" name="tenant_id" value={tenantId} />
      ) : (
        <div className="w-full">
          <label
            htmlFor="tenant_id"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Tenant
          </label>
          <select
            id="tenant_id"
            name="tenant_id"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select a tenant</option>
            {tenants?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name} ({t.phone})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Unit selector (when coming from tenant context) */}
      {unitId ? (
        <input type="hidden" name="unit_id" value={unitId} />
      ) : (
        <div className="w-full">
          <label
            htmlFor="unit_id"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Unit
          </label>
          <select
            id="unit_id"
            name="unit_id"
            required
            onChange={handleUnitChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select a vacant unit</option>
            {grouped &&
              Object.entries(grouped).map(([propertyName, units]) => (
                <optgroup key={propertyName} label={propertyName}>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      Unit {u.unit_number} — ৳{u.monthly_rent}/mo
                    </option>
                  ))}
                </optgroup>
              ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="monthly_rent"
          name="monthly_rent"
          label="Monthly Rent (BDT)"
          type="number"
          step="0.01"
          min="0"
          value={selectedRent || ""}
          onChange={(e) => setSelectedRent(Number(e.target.value))}
          required
        />
        <Input
          id="security_deposit"
          name="security_deposit"
          label="Security Deposit (BDT)"
          type="number"
          step="0.01"
          min="0"
          defaultValue={0}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="start_date"
          name="start_date"
          label="Start Date"
          type="date"
          required
        />
        <Input
          id="end_date"
          name="end_date"
          label="End Date (Optional)"
          type="date"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="rent_due_day"
          name="rent_due_day"
          label="Rent Due Day (1-28)"
          type="number"
          min="1"
          max="28"
          defaultValue={1}
          required
        />
        <Input
          id="advance_months"
          name="advance_months"
          label="Advance Months"
          type="number"
          min="0"
          defaultValue={0}
        />
      </div>

      <Input
        id="notes"
        name="notes"
        label="Notes (Optional)"
        placeholder="Any additional notes about this lease"
      />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <div className="flex gap-3 pt-2">
        <Button type="submit" isLoading={loading}>
          Create Lease
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
