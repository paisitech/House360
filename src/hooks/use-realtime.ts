"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useRealtimeReminders(
  tenantId: string | null,
  onNewReminder: (reminder: Record<string, unknown>) => void
) {
  useEffect(() => {
    if (!tenantId) return;

    const supabase = createClient();
    const channel = supabase
      .channel("reminders")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "reminders",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          onNewReminder(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, onNewReminder]);
}

export function useRealtimePayments(
  landlordId: string | null,
  onNewPayment: (payment: Record<string, unknown>) => void
) {
  useEffect(() => {
    if (!landlordId) return;

    const supabase = createClient();
    const channel = supabase
      .channel("payments")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "payments",
          filter: `landlord_id=eq.${landlordId}`,
        },
        (payload) => {
          onNewPayment(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [landlordId, onNewPayment]);
}
