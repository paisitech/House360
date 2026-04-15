import { Card, CardContent } from "@/components/ui/card";
import { ScreenshotUploadForm } from "@/components/payments/screenshot-upload-form";

export default function UploadScreenshotPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Payment Screenshot</h1>
        <p className="text-sm text-gray-500">
          Upload proof of payment for manual verification
        </p>
      </div>
      <Card>
        <CardContent className="py-6">
          <ScreenshotUploadForm />
        </CardContent>
      </Card>
    </div>
  );
}
