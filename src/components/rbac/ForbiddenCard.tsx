import { ShieldOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function ForbiddenCard() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <ShieldOff className="h-10 w-10 text-muted-foreground/40" />
        <div>
          <p className="font-semibold text-sm">Access Restricted</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            You do not have permission to perform this action. Contact your system administrator if
            you believe this is an error.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
