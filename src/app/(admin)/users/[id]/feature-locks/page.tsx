"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";

export default function FeatureLocksPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/users/${id}`)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Profile
        </Button>
        <PageHeader title="Feature Locks" description={`Managing locks for user ${id.slice(0, 8)}…`} />
      </div>
      <p className="text-sm text-muted-foreground">Feature lock management is available on the user detail page.</p>
    </div>
  );
}
