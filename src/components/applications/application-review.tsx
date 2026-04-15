"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  approveApplication,
  rejectApplication,
} from "@/app/(dashboard)/landlord/applications/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { Check, X } from "lucide-react";

interface ApplicationReviewProps {
  applicationId: string;
  unitMonthlyRent: number;
}

export function ApplicationReview({
  applicationId,
  unitMonthlyRent,
}: ApplicationReviewProps) {
  const router = useRouter();
  const [showApproveForm, setShowApproveForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleApprove(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await approveApplication(applicationId, formData);

    if (result.success) {
      toast("Application approved — tenant and lease created", "success");
      router.refresh();
    } else {
      setError(result.error || "Something went wrong");
    }
    setLoading(false);
  }

  async function handleReject() {
    setLoading(true);
    setError("");

    const result = await rejectApplication(applicationId);

    if (result.success) {
      toast("Application rejected", "success");
      router.refresh();
    } else {
      setError(result.error || "Something went wrong");
    }
    setLoading(false);
  }

  if (showApproveForm) {
    return (
      <form
        onSubmit={handleApprove}
        className="w-full sm:w-auto min-w-[280px] space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4"
      >
        <h4 className="text-sm font-semibold text-gray-900">
          Lease Details
        </h4>
        <Input
          id="monthly_rent"
          name="monthly_rent"
          label="Monthly Rent (BDT)"
          type="number"
          step="0.01"
          min="0"
          defaultValue={unitMonthlyRent}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            id="start_date"
            name="start_date"
            label="Start Date"
            type="date"
            defaultValue={new Date().toISOString().split("T")[0]}
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
            id="security_deposit"
            name="security_deposit"
            label="Deposit"
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

        <div className="flex gap-2">
          <Button
            type="submit"
            size="sm"
            className="flex-1"
            isLoading={loading}
          >
            <Check className="mr-1 h-4 w-4" />
            Approve
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setShowApproveForm(false);
              setError("");
            }}
          >
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex gap-2 shrink-0">
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
      <Button
        size="sm"
        onClick={() => setShowApproveForm(true)}
        disabled={loading}
      >
        <Check className="mr-1 h-4 w-4" />
        Approve
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={handleReject}
        isLoading={loading}
      >
        <X className="mr-1 h-4 w-4" />
        Reject
      </Button>
    </div>
  );
}
