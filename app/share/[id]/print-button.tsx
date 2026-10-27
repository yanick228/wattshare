"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function SharePrintButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => window.print()}
      className="flex items-center gap-1.5 border-border print:hidden"
    >
      <Printer className="h-4 w-4" />
      <span>Imprimer / PDF</span>
    </Button>
  );
}
