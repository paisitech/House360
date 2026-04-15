"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { CreditCard } from "lucide-react";

interface PayRentButtonProps {
  rentCycleId: string;
  amount: number;
}

export function PayRentButton({ rentCycleId, amount }: PayRentButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rent_cycle_id: rentCycleId }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast(data.error || "Failed to initiate payment", "error");
      }
    } catch {
      toast("Network error", "error");
    }
    setLoading(false);
  }

  return (
    <Button onClick={handlePay} isLoading={loading}>
      <CreditCard className="mr-2 h-4 w-4" />
      Pay Online
    </Button>
  );
}
