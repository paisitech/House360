"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import type { Unit } from "@/types";
import {
  DoorOpen,
  Users,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  UserPlus,
  Edit,
  X,
  Save,
  ArrowLeft,
  Plus,
  Globe,
} from "lucide-react";

interface LeaseInfo {
  tenantName: string;
  tenantPhone: string;
  tenantEmail: string | null;
  tenantId: string;
  leaseId: string;
  rent: number;
  startDate: string;
  endDate: string | null;
  rentDueDay: number;
}

interface TenantOption {
  id: string;
  full_name: string;
  phone: string;
}

interface BuildingVisualProps {
  units: Unit[];
  propertyId: string;
  leaseMap: Record<string, LeaseInfo>;
  tenants: TenantOption[];
  updateUnitAction: (
    propertyId: string,
    unitId: string,
    formData: FormData
  ) => Promise<{ success: boolean; error?: string }>;
  createUnitAction: (
    propertyId: string,
    formData: FormData
  ) => Promise<{ success: boolean; error?: string }>;
  createLeaseAction: (
    formData: FormData
  ) => Promise<{ success: boolean; error?: string }>;
  toggleListingAction: (
    propertyId: string,
    unitId: string,
    isListed: boolean
  ) => Promise<{ success: boolean; error?: string }>;
}

type PanelView = "info" | "edit" | "assign" | "add-unit";

const STATUS_STYLES = {
  vacant: {
    bg: "bg-green-100 border-green-300",
    bgActive: "bg-green-200 border-green-500 ring-2 ring-green-400",
    hover: "hover:bg-green-200",
    text: "text-green-800",
    label: "Vacant",
  },
  occupied: {
    bg: "bg-blue-100 border-blue-300",
    bgActive: "bg-blue-200 border-blue-500 ring-2 ring-blue-400",
    hover: "hover:bg-blue-200",
    text: "text-blue-800",
    label: "Occupied",
  },
  maintenance: {
    bg: "bg-yellow-100 border-yellow-300",
    bgActive: "bg-yellow-200 border-yellow-500 ring-2 ring-yellow-400",
    hover: "hover:bg-yellow-200",
    text: "text-yellow-800",
    label: "Maintenance",
  },
};

export function BuildingVisual({
  units,
  propertyId,
  leaseMap,
  tenants,
  updateUnitAction,
  createUnitAction,
  createLeaseAction,
  toggleListingAction,
}: BuildingVisualProps) {
  const router = useRouter();
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [panelView, setPanelView] = useState<PanelView>("info");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedUnit = units.find((u) => u.id === selectedUnitId);
  const selectedLease = selectedUnitId ? leaseMap[selectedUnitId] : null;

  function selectUnit(unitId: string) {
    if (unitId === selectedUnitId) {
      setSelectedUnitId(null);
    } else {
      setSelectedUnitId(unitId);
      setPanelView("info");
      setError("");
    }
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedUnit) return;
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await updateUnitAction(propertyId, selectedUnit.id, formData);

    if (result.success) {
      toast("Unit updated", "success");
      setPanelView("info");
      router.refresh();
    } else {
      setError(result.error || "Something went wrong");
    }
    setLoading(false);
  }

  async function handleAssignSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedUnit) return;
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await createLeaseAction(formData);

    if (result.success) {
      toast("Tenant assigned", "success");
      setPanelView("info");
      router.refresh();
    } else {
      setError(result.error || "Something went wrong");
    }
    setLoading(false);
  }

  async function handleAddUnitSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await createUnitAction(propertyId, formData);

    if (result.success) {
      toast("Unit added", "success");
      setPanelView("info");
      setSelectedUnitId(null);
      router.refresh();
    } else {
      setError(result.error || "Something went wrong");
    }
    setLoading(false);
  }

  async function handleToggleListing(unitId: string, currentlyListed: boolean) {
    setLoading(true);
    const result = await toggleListingAction(propertyId, unitId, !currentlyListed);
    if (result.success) {
      toast(currentlyListed ? "Unit delisted" : "Unit listed publicly", "success");
      router.refresh();
    } else {
      setError(result.error || "Something went wrong");
    }
    setLoading(false);
  }

  function openAddUnit() {
    setSelectedUnitId(null);
    setPanelView("add-unit");
    setError("");
  }

  // Group units by floor
  const floorMap = new Map<number, Unit[]>();
  for (const unit of units) {
    const floor = unit.floor ?? 0;
    if (!floorMap.has(floor)) floorMap.set(floor, []);
    floorMap.get(floor)!.push(unit);
  }

  const floors = Array.from(floorMap.entries()).sort((a, b) => b[0] - a[0]);
  for (const [, floorUnits] of floors) {
    floorUnits.sort((a, b) => a.unit_number.localeCompare(b.unit_number));
  }

  const totalUnits = units.length;
  const occupied = units.filter((u) => u.status === "occupied").length;
  const vacant = units.filter((u) => u.status === "vacant").length;
  const maintenance = units.filter((u) => u.status === "maintenance").length;

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-green-500" />
          <span className="text-gray-600">Vacant ({vacant})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-blue-500" />
          <span className="text-gray-600">Occupied ({occupied})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-yellow-500" />
          <span className="text-gray-600">Maintenance ({maintenance})</span>
        </div>
        <span className="text-gray-400 ml-auto">
          {occupied}/{totalUnits} occupied
        </span>
      </div>

      {/* Building Map + Side Panel */}
      <div className="flex gap-4 justify-center">
        {/* Building */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-1 min-w-0 inline-flex flex-col">
          {floors.map(([floor, floorUnits]) => (
            <div key={floor} className="flex items-center gap-2">
              <span className="w-16 text-xs font-medium text-gray-400 text-right shrink-0">
                Floor {floor}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {floorUnits.map((unit) => {
                  const style =
                    STATUS_STYLES[
                      unit.status as keyof typeof STATUS_STYLES
                    ] ?? STATUS_STYLES.vacant;
                  const isSelected = unit.id === selectedUnitId;

                  return (
                    <button
                      key={unit.id}
                      type="button"
                      onClick={() => selectUnit(unit.id)}
                      className={cn(
                        "relative flex items-center justify-center rounded-md border px-3 py-2 text-xs font-semibold transition-all min-w-[3.5rem] cursor-pointer",
                        isSelected ? style.bgActive : style.bg,
                        !isSelected && style.hover,
                        style.text
                      )}
                    >
                      {unit.unit_number}
                      {unit.is_listed && (
                        <Globe className="absolute -top-1 -right-1 h-3 w-3 text-blue-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {/* Add Unit button inside building */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-200 mt-2">
            <span className="w-16 shrink-0" />
            <button
              type="button"
              onClick={openAddUnit}
              className="flex items-center gap-1 rounded-md border border-dashed border-gray-300 px-3 py-2 text-xs font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Unit
            </button>
          </div>
        </div>

        {/* Side Panel */}
        {(selectedUnit || panelView === "add-unit") && (
          <div className="w-80 shrink-0 rounded-xl border border-gray-200 bg-white shadow-sm overflow-y-auto max-h-[600px]">
            {/* Panel Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between z-10">
              {panelView === "add-unit" ? (
                <div className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-900">Add Unit</h3>
                </div>
              ) : panelView !== "info" ? (
                <button
                  type="button"
                  onClick={() => {
                    setPanelView("info");
                    setError("");
                  }}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <DoorOpen className="h-5 w-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-900">
                    Unit {selectedUnit!.unit_number}
                  </h3>
                  <span
                    className={cn(
                      "text-xs font-medium px-1.5 py-0.5 rounded",
                      STATUS_STYLES[
                        selectedUnit!.status as keyof typeof STATUS_STYLES
                      ]?.bg,
                      STATUS_STYLES[
                        selectedUnit!.status as keyof typeof STATUS_STYLES
                      ]?.text
                    )}
                  >
                    {STATUS_STYLES[
                      selectedUnit!.status as keyof typeof STATUS_STYLES
                    ]?.label}
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setSelectedUnitId(null);
                  if (panelView === "add-unit") setPanelView("info");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* === INFO VIEW === */}
              {panelView === "info" && selectedUnit && (
                <>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Rent</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(Number(selectedUnit.monthly_rent))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Size</span>
                      <span className="text-gray-700">
                        {selectedUnit.bedrooms} bed, {selectedUnit.bathrooms}{" "}
                        bath
                        {selectedUnit.area_sqft
                          ? `, ${selectedUnit.area_sqft} sqft`
                          : ""}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Floor</span>
                      <span className="text-gray-700">
                        {selectedUnit.floor ?? "N/A"}
                      </span>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  {selectedLease ? (
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Current Tenant
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <Link
                            href={`/landlord/tenants/${selectedLease.tenantId}`}
                            className="text-sm font-medium text-blue-600 hover:underline"
                          >
                            {selectedLease.tenantName}
                          </Link>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-700">
                            {selectedLease.tenantPhone}
                          </span>
                        </div>
                        {selectedLease.tenantEmail && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-700">
                              {selectedLease.tenantEmail}
                            </span>
                          </div>
                        )}
                      </div>

                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-1">
                        Lease
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-700">
                            {formatCurrency(selectedLease.rent)}/mo
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-700">
                            {formatDate(selectedLease.startDate)} —{" "}
                            {selectedLease.endDate
                              ? formatDate(selectedLease.endDate)
                              : "Ongoing"}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Due on day {selectedLease.rentDueDay} of each month
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-500">
                        No tenant assigned
                      </p>
                      {selectedUnit.status === "vacant" && (
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => setPanelView("assign")}
                        >
                          <UserPlus className="mr-1 h-4 w-4" />
                          Assign Tenant
                        </Button>
                      )}
                    </div>
                  )}

                  <hr className="border-gray-100" />

                  {/* List publicly toggle — only for vacant units */}
                  {selectedUnit.status === "vacant" && (
                    <button
                      type="button"
                      onClick={() => handleToggleListing(selectedUnit.id, selectedUnit.is_listed)}
                      disabled={loading}
                      className={cn(
                        "flex items-center justify-between w-full rounded-lg border px-3 py-2.5 text-sm transition-colors",
                        selectedUnit.is_listed
                          ? "border-green-300 bg-green-50 text-green-800"
                          : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        {selectedUnit.is_listed ? "Listed publicly" : "Not listed"}
                      </span>
                      <span
                        className={cn(
                          "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                          selectedUnit.is_listed ? "bg-green-500" : "bg-gray-300"
                        )}
                      >
                        <span
                          className={cn(
                            "inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform",
                            selectedUnit.is_listed ? "translate-x-4" : "translate-x-0.5"
                          )}
                        />
                      </span>
                    </button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setPanelView("edit")}
                  >
                    <Edit className="mr-1 h-4 w-4" />
                    Edit Unit
                  </Button>
                </>
              )}

              {/* === EDIT VIEW === */}
              {panelView === "edit" && selectedUnit && (
                <form onSubmit={handleEditSubmit} className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Edit Unit {selectedUnit.unit_number}
                  </h4>
                  <Input
                    id="unit_number"
                    name="unit_number"
                    label="Unit Number"
                    defaultValue={selectedUnit.unit_number}
                    required
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      id="floor"
                      name="floor"
                      label="Floor"
                      type="number"
                      defaultValue={selectedUnit.floor ?? ""}
                    />
                    <Input
                      id="monthly_rent"
                      name="monthly_rent"
                      label="Rent (BDT)"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={selectedUnit.monthly_rent}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      id="bedrooms"
                      name="bedrooms"
                      label="Beds"
                      type="number"
                      min="0"
                      defaultValue={selectedUnit.bedrooms}
                    />
                    <Input
                      id="bathrooms"
                      name="bathrooms"
                      label="Baths"
                      type="number"
                      min="0"
                      defaultValue={selectedUnit.bathrooms}
                    />
                    <Input
                      id="area_sqft"
                      name="area_sqft"
                      label="Sqft"
                      type="number"
                      min="0"
                      defaultValue={selectedUnit.area_sqft ?? ""}
                    />
                  </div>
                  <Input
                    id="description"
                    name="description"
                    label="Description"
                    placeholder="Optional"
                    defaultValue={selectedUnit.description || ""}
                  />
                  {error && (
                    <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">
                      {error}
                    </p>
                  )}
                  <Button
                    type="submit"
                    size="sm"
                    className="w-full"
                    isLoading={loading}
                  >
                    <Save className="mr-1 h-4 w-4" />
                    Save Changes
                  </Button>
                </form>
              )}

              {/* === ASSIGN TENANT VIEW === */}
              {panelView === "assign" && selectedUnit && (
                <form onSubmit={handleAssignSubmit} className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Assign Tenant to {selectedUnit.unit_number}
                  </h4>

                  <input
                    type="hidden"
                    name="unit_id"
                    value={selectedUnit.id}
                  />

                  <div className="w-full">
                    <label
                      htmlFor="tenant_id"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Tenant
                    </label>
                    {tenants.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        No tenants available.{" "}
                        <Link
                          href="/landlord/tenants/new"
                          className="text-blue-600 hover:underline"
                        >
                          Add one first
                        </Link>
                      </p>
                    ) : (
                      <select
                        id="tenant_id"
                        name="tenant_id"
                        required
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Select a tenant</option>
                        {tenants.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.full_name} ({t.phone})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <Input
                    id="monthly_rent"
                    name="monthly_rent"
                    label="Monthly Rent (BDT)"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={selectedUnit.monthly_rent}
                    required
                  />
                  <Input
                    id="security_deposit"
                    name="security_deposit"
                    label="Security Deposit"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={0}
                  />
                  <div className="grid grid-cols-2 gap-3">
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
                      label="End Date"
                      type="date"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      id="rent_due_day"
                      name="rent_due_day"
                      label="Due Day (1-28)"
                      type="number"
                      min="1"
                      max="28"
                      defaultValue={1}
                      required
                    />
                    <Input
                      id="advance_months"
                      name="advance_months"
                      label="Advance"
                      type="number"
                      min="0"
                      defaultValue={0}
                    />
                  </div>

                  {error && (
                    <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">
                      {error}
                    </p>
                  )}
                  {tenants.length > 0 && (
                    <Button
                      type="submit"
                      size="sm"
                      className="w-full"
                      isLoading={loading}
                    >
                      <UserPlus className="mr-1 h-4 w-4" />
                      Assign Tenant
                    </Button>
                  )}
                </form>
              )}

              {/* === ADD UNIT VIEW === */}
              {panelView === "add-unit" && (
                <form onSubmit={handleAddUnitSubmit} className="space-y-3">
                  <Input
                    id="unit_number"
                    name="unit_number"
                    label="Unit Number"
                    placeholder="e.g., 3A, Floor-2"
                    required
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      id="floor"
                      name="floor"
                      label="Floor"
                      type="number"
                      placeholder="e.g., 3"
                    />
                    <Input
                      id="monthly_rent"
                      name="monthly_rent"
                      label="Rent (BDT)"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="e.g., 15000"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      id="bedrooms"
                      name="bedrooms"
                      label="Beds"
                      type="number"
                      min="0"
                      defaultValue={1}
                    />
                    <Input
                      id="bathrooms"
                      name="bathrooms"
                      label="Baths"
                      type="number"
                      min="0"
                      defaultValue={1}
                    />
                    <Input
                      id="area_sqft"
                      name="area_sqft"
                      label="Sqft"
                      type="number"
                      min="0"
                      placeholder="Optional"
                    />
                  </div>
                  <Input
                    id="description"
                    name="description"
                    label="Description"
                    placeholder="Optional"
                  />
                  {error && (
                    <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">
                      {error}
                    </p>
                  )}
                  <Button
                    type="submit"
                    size="sm"
                    className="w-full"
                    isLoading={loading}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add Unit
                  </Button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
