import { Building2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} House360. All rights reserved.
            </span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
              Privacy
            </a>
            <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
              Terms
            </a>
            <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
