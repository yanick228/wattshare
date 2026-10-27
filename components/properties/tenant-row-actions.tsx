"use client";

import { useState } from "react";
import { toggleTenantStatus, deleteTenant } from "@/lib/actions/tenants";
import { Button } from "@/components/ui/button";
import { Trash2, UserCheck, UserX, Loader2 } from "lucide-react";

interface TenantRowActionsProps {
  tenantId: string;
  propertyId: string;
  isActive: boolean;
  tenantName: string;
}

export function TenantRowActions({
  tenantId,
  propertyId,
  isActive,
  tenantName,
}: TenantRowActionsProps) {
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      await toggleTenantStatus(tenantId, propertyId, isActive);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement ${tenantName} ?`)) {
      setLoading(true);
      try {
        await deleteTenant(tenantId, propertyId);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        disabled={loading}
        title={isActive ? "Marquer comme sorti" : "Réactiver le locataire"}
        className="h-8 px-2 text-xs"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : isActive ? (
          <span className="flex items-center gap-1 text-amber-600">
            <UserX className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Désactiver</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 text-emerald-600">
            <UserCheck className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Activer</span>
          </span>
        )}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        disabled={loading}
        title="Supprimer définitivement"
        className="h-8 w-8 text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
