"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { generateRentCycles } from "@/app/(dashboard)/landlord/payments/actions";
import { RefreshCw } from "lucide-react";

export function GenerateCyclesButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const result = await generateRentCycles();
    if (result.success) {
      toast(result.error || "Rent cycles generated", "success");
      router.refresh();
    } else {
      toast(result.error || "Failed", "error");
    }
    setLoading(false);
  }

  return (
    <Button size="sm" variant="outline" onClick={handleClick} isLoading={loading}>
      <RefreshCw className="mr-1 h-4 w-4" />
      Generate Rent Cycles
    </Button>
  );
}
