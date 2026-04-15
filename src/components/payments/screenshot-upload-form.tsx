"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FileUpload } from "@/components/ui/file-upload";
import { toast } from "@/components/ui/toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  uploadManualPayment,
  getTenantCycles,
} from "@/app/(dashboard)/tenant/upload-screenshot/actions";

interface RentCycle {
  id: string;
  period_start: string;
  period_end: string;
  amount_due: number;
  amount_paid: number;
}

export function ScreenshotUploadForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCycleId = searchParams.get("cycle");

  const [loading, setLoading] = useState(false);
  const [cycles, setCycles] = useState<RentCycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState(preselectedCycleId || "");
  const [paymentMethod, setPaymentMethod] = useState("bkash");
  const [transactionRef, setTransactionRef] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    async function fetchCycles() {
      const result = await getTenantCycles();
      if (result.success && result.data) {
        setCycles(result.data);
      }
    }
    fetchCycles();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !selectedCycle) {
      toast("Please select a rent cycle and upload a screenshot", "error");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("rent_cycle_id", selectedCycle);
      formData.set("payment_method", paymentMethod);
      formData.set("transaction_reference", transactionRef);
      formData.set("sender_number", senderNumber);
      formData.set("screenshot", file);

      const result = await uploadManualPayment(formData);

      if (result.success) {
        toast("Payment screenshot uploaded successfully!", "success");
        router.push("/tenant/rent-due");
        router.refresh();
      } else {
        toast(result.error || "Failed to upload", "error");
      }
    } catch (err: any) {
      toast(err.message || "Failed to upload", "error");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <Select
        id="cycle"
        label="Select Rent Cycle"
        value={selectedCycle}
        onChange={(e) => setSelectedCycle(e.target.value)}
        placeholder="Choose a rent period"
        options={cycles.map((c) => ({
          value: c.id,
          label: `${formatDate(c.period_start)} - ${formatDate(c.period_end)} (${formatCurrency(Number(c.amount_due) - Number(c.amount_paid))})`,
        }))}
      />
      <Select
        id="payment_method"
        label="Payment Method"
        value={paymentMethod}
        onChange={(e) => setPaymentMethod(e.target.value)}
        options={[
          { value: "bkash", label: "bKash" },
          { value: "nagad", label: "Nagad" },
          { value: "rocket", label: "Rocket" },
          { value: "bank_transfer", label: "Bank Transfer" },
        ]}
      />
      <Input
        id="transactionRef"
        label="Transaction Reference / TrxID"
        placeholder="e.g., bKash TrxID"
        value={transactionRef}
        onChange={(e) => setTransactionRef(e.target.value)}
      />
      <Input
        id="senderNumber"
        label="Sender Phone Number"
        placeholder="01XXXXXXXXX"
        value={senderNumber}
        onChange={(e) => setSenderNumber(e.target.value)}
      />
      <FileUpload
        label="Payment Screenshot"
        accept="image/jpeg,image/png,image/webp"
        maxSize={5 * 1024 * 1024}
        onChange={setFile}
      />
      <Button type="submit" isLoading={loading} className="w-full">
        Submit for Verification
      </Button>
    </form>
  );
}
