"use client";

import { translations } from "@/lib/translations/es";

interface LoadingSpinnerProps {
  text?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({
  text = translations.common.loading,
  size = "md",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-300 border-t-primary-600`}
      />
      {text && <p className="mt-3 text-sm text-gray-500">{text}</p>}
    </div>
  );
}
