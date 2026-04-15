"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import type { Property } from "@/types";

interface PropertyFormProps {
  property?: Property;
  action: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
}

export function PropertyForm({ property, action }: PropertyFormProps) {
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
      toast(property ? "Property updated" : "Property created", "success");
      router.push("/landlord/properties");
      router.refresh();
    } else {
      setError(result.error || "Something went wrong");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <Input
        id="name"
        name="name"
        label="Property Name"
        placeholder="e.g., Green Valley Apartments"
        defaultValue={property?.name}
        required
      />
      <Input
        id="address"
        name="address"
        label="Address"
        placeholder="Full street address"
        defaultValue={property?.address}
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          id="city"
          name="city"
          label="City"
          placeholder="e.g., Dhaka"
          defaultValue={property?.city}
          required
        />
        <Input
          id="area"
          name="area"
          label="Area"
          placeholder="e.g., Dhanmondi"
          defaultValue={property?.area || ""}
        />
      </div>
      <Select
        id="property_type"
        name="property_type"
        label="Property Type"
        defaultValue={property?.property_type || "residential"}
        options={[
          { value: "residential", label: "Residential" },
          { value: "commercial", label: "Commercial" },
          { value: "mixed", label: "Mixed" },
        ]}
      />
      {!property && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="total_floors"
              name="total_floors"
              label="Total Floors"
              type="number"
              min={1}
              defaultValue={1}
              required
            />
            <Input
              id="units_per_floor"
              name="units_per_floor"
              label="Units Per Floor"
              type="number"
              min={1}
              defaultValue={1}
              required
            />
          </div>
          <Input
            id="default_rent"
            name="default_rent"
            label="Default Monthly Rent (BDT)"
            type="number"
            step="0.01"
            min={0}
            placeholder="e.g., 15000"
            required
          />
          <p className="text-xs text-gray-500 -mt-2">
            Units will be auto-generated (e.g., 1A, 1B, 2A, 2B...). You can edit individual rents later.
          </p>
        </>
      )}
      <Input
        id="description"
        name="description"
        label="Description (Optional)"
        placeholder="Brief description of the property"
        defaultValue={property?.description || ""}
      />
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <div className="flex gap-3 pt-2">
        <Button type="submit" isLoading={loading}>
          {property ? "Update Property" : "Create Property"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
