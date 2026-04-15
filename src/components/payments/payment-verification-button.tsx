"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { verifyManualPayment } from "@/app/(dashboard)/landlord/payments/actions";
import { Check, X } from "lucide-react";

interface PaymentVerificationButtonProps {
  paymentId: string;
}

export function PaymentVerificationButton({
  paymentId,
}: PaymentVerificationButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleAction(action: "approve" | "reject") {
    setLoading(true);
    let reason: string | undefined;

    if (action === "reject") {
      reason = prompt("Reason for rejection (optional):") || undefined;
    }

    const result = await verifyManualPayment(paymentId, action, reason);

    if (result.success) {
      toast(
        action === "approve" ? "Payment approved" : "Payment rejected",
        action === "approve" ? "success" : "info"
      );
    } else {
      toast(result.error || "Failed", "error");
    }
    setLoading(false);
  }

  return (
    <div className="flex gap-1">
      <Button
        size="sm"
        variant="primary"
        onClick={() => handleAction("approve")}
        disabled={loading}
      >
        <Check className="h-3.5 w-3.5 mr-1" />
        Approve
      </Button>
      <Button
        size="sm"
        variant="danger"
        onClick={() => handleAction("reject")}
        disabled={loading}
      >
        <X className="h-3.5 w-3.5 mr-1" />
        Reject
      </Button>
    </div>
  );
}
