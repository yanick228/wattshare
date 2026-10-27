"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Check } from "lucide-react";

interface CopyShareButtonProps {
  billId: string;
}

export function CopyShareButton({ billId }: CopyShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const url = `${window.location.origin}/share/${billId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="flex items-center gap-1.5 border-border"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-emerald-600" />
          <span>Lien copié !</span>
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          <span>Partager aux locataires</span>
        </>
      )}
    </Button>
  );
}
