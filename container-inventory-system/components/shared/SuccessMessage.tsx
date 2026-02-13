"use client";

import { CheckCircle } from "lucide-react";

interface SuccessMessageProps {
  message: string;
  onDismiss?: () => void;
}

export function SuccessMessage({ message, onDismiss }: SuccessMessageProps) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-md p-4">
      <div className="flex items-start">
        <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-green-700">{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-3 text-green-400 hover:text-green-500"
          >
            <span className="sr-only">Cerrar</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
