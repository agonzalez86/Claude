"use client";

import { useEffect, useState } from "react";
import { translations } from "@/lib/translations/es";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { SuccessMessage } from "@/components/shared/SuccessMessage";
import { formatDate } from "@/lib/utils/formatters";
import { Truck, MapPin, CheckCircle } from "lucide-react";

const wt = translations.warehouse;

interface Container {
  id: string;
  seriesNumber: string;
  internalCode: string;
  operationType: string;
  assignedTo: { name: string; company: string; address: string } | null;
  updatedAt: string;
}

export default function InTransitPage() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmModal, setConfirmModal] = useState<string | null>(null);
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchContainers = async () => {
    setLoading(true);
    const res = await fetch("/api/containers?location=IN_TRANSIT");
    const data = await res.json();
    setContainers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchContainers();
  }, []);

  const handleConfirmDelivery = async (containerId: string) => {
    setProcessing(true);
    setError("");

    try {
      const res = await fetch("/api/containers/confirm-delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          containerId,
          notes: deliveryNotes || undefined,
        }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSuccess(translations.containers.messages.deliveryConfirmed);
        setConfirmModal(null);
        setDeliveryNotes("");
        fetchContainers();
      }
    } catch {
      setError(translations.errors.generic);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        <Truck className="w-6 h-6 inline mr-2" />
        {wt.pendingDeliveries}
      </h1>

      {error && <ErrorMessage message={error} />}
      {success && (
        <SuccessMessage message={success} onDismiss={() => setSuccess("")} />
      )}

      {containers.length === 0 ? (
        <EmptyState message="No hay contenedores en tránsito" />
      ) : (
        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {translations.table.seriesNumber}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {translations.table.internalCode}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {translations.table.client}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {translations.table.address}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {translations.table.type}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {translations.common.actions}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {containers.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 text-sm font-medium">
                    {c.seriesNumber}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {c.internalCode}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {c.assignedTo?.name} - {c.assignedTo?.company}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      {c.assignedTo?.address}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {translations.containers.operationTypes[c.operationType] || c.operationType}
                  </td>
                  <td className="px-4 py-3">
                    {confirmModal === c.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={deliveryNotes}
                          onChange={(e) => setDeliveryNotes(e.target.value)}
                          placeholder={wt.deliveryNotesPlaceholder}
                          rows={2}
                          className="input-field text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleConfirmDelivery(c.id)}
                            disabled={processing}
                            className="btn-primary text-xs px-3 py-1"
                          >
                            {processing ? "..." : translations.common.confirm}
                          </button>
                          <button
                            onClick={() => setConfirmModal(null)}
                            className="btn-secondary text-xs px-3 py-1"
                          >
                            {translations.common.cancel}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmModal(c.id)}
                        className="btn-primary text-xs px-3 py-1"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {wt.confirmDelivery}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
