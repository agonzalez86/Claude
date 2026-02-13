"use client";

import { Package } from "lucide-react";

interface EmptyStateProps {
  message: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ message, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <Package className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-semibold text-gray-900">{message}</h3>
      {description && (
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      )}
      {action && (
        <div className="mt-6">
          <button onClick={action.onClick} className="btn-primary">
            {action.label}
          </button>
        </div>
      )}
    </div>
  );
}
