import { Building2 } from "lucide-react";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <Building2 className="mx-auto h-10 w-10 text-blue-600" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Start managing your properties with House360
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}
