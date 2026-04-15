"use client";

import { useState } from "react";
import { submitApplication } from "@/app/(public)/listings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, Send } from "lucide-react";

interface ApplicationFormProps {
  unitId: string;
}

export function ApplicationForm({ unitId }: ApplicationFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await submitApplication(unitId, formData);

    if (result.success) {
      setSubmitted(true);
    } else {
      setError(result.error || "Something went wrong");
    }
    setLoading(false);
  }

  if (submitted) {
    return (
      <div className="text-center py-6">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-3" />
        <h3 className="text-lg font-semibold text-gray-900">
          Application Submitted!
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          The landlord will review your application and get in touch soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        id="full_name"
        name="full_name"
        label="Full Name"
        placeholder="Your full name"
        required
      />
      <Input
        id="email"
        name="email"
        label="Email"
        type="email"
        placeholder="your@email.com"
        required
      />
      <Input
        id="phone"
        name="phone"
        label="Phone"
        placeholder="01XXXXXXXXX"
        required
      />
      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Message (optional)
        </label>
        <textarea
          id="message"
          name="message"
          rows={3}
          maxLength={1000}
          placeholder="Tell the landlord about yourself..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
        />
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" isLoading={loading}>
        <Send className="mr-1.5 h-4 w-4" />
        Submit Application
      </Button>
    </form>
  );
}
