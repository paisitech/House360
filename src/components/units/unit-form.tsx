"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import type { Unit } from "@/types";

interface UnitFormProps {
  unit?: Unit;
  propertyId: string;
  action: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
}

export function UnitForm({ unit, propertyId, action }: UnitFormProps) {
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
      toast(unit ? "Unit updated" : "Unit created", "success");
      router.push(`/landlord/properties/${propertyId}`);
      router.refresh();
    } else {
      setError(result.error || "Something went wrong");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <Input
        id="unit_number"
        name="unit_number"
        label="Unit Number"
        placeholder="e.g., 3A, Floor-2"
        defaultValue={unit?.unit_number}
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          id="floor"
          name="floor"
          label="Floor"
          type="number"
          placeholder="e.g., 3"
          defaultValue={unit?.floor ?? ""}
        />
        <Input
          id="monthly_rent"
          name="monthly_rent"
          label="Monthly Rent (BDT)"
          type="number"
          step="0.01"
          min="0"
          placeholder="e.g., 15000"
          defaultValue={unit?.monthly_rent}
          required
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Input
          id="bedrooms"
          name="bedrooms"
          label="Bedrooms"
          type="number"
          min="0"
          defaultValue={unit?.bedrooms ?? 1}
        />
        <Input
          id="bathrooms"
          name="bathrooms"
          label="Bathrooms"
          type="number"
          min="0"
          defaultValue={unit?.bathrooms ?? 1}
        />
        <Input
          id="area_sqft"
          name="area_sqft"
          label="Area (sqft)"
          type="number"
          min="0"
          placeholder="Optional"
          defaultValue={unit?.area_sqft ?? ""}
        />
      </div>
      <Input
        id="description"
        name="description"
        label="Description (Optional)"
        placeholder="Brief description"
        defaultValue={unit?.description || ""}
      />
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <div className="flex gap-3 pt-2">
        <Button type="submit" isLoading={loading}>
          {unit ? "Update Unit" : "Create Unit"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
