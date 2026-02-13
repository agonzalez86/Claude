"use client";

import { useState } from "react";
import { translations } from "@/lib/translations/es";
import { StatusBadge } from "@/components/containers/StatusBadge";
import { LocationBadge } from "@/components/containers/LocationBadge";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { SuccessMessage } from "@/components/shared/SuccessMessage";
import { Search, Package } from "lucide-react";
import { formatDate } from "@/lib/utils/formatters";

const wt = translations.warehouse;

interface ContainerInfo {
  id: string;
  seriesNumber: string;
  internalCode: string;
  currentStatus: string;
  currentLocation: string;
  purchaseDate: string;
  assignedTo?: { name: string } | null;
}

export default function ReceiveContainerPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [container, setContainer] = useState<ContainerInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [notes, setNotes] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError("");
    setSuccess("");
    setContainer(null);

    try {
      const res = await fetch(
        `/api/containers?search=${encodeURIComponent(searchQuery)}`
      );
      const data = await res.json();

      if (data.length === 0) {
        setError(translations.containers.messages.notFound);
      } else {
        setContainer(data[0]);
      }
    } catch {
      setError(translations.errors.generic);
    } finally {
      setLoading(false);
    }
  };

  const handleReceive = async () => {
    if (!container) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/containers/receive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          containerId: container.id,
          notes: notes || undefined,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setSuccess(translations.containers.messages.receivedSuccess);
        setContainer(null);
        setShowConfirm(false);
        setNotes("");
        setSearchQuery("");
      }
    } catch {
      setError(translations.errors.generic);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        {wt.receiveContainer}
      </h1>

      {/* Search */}
      <div className="card p-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={wt.searchPlaceholder}
              className="input-field pl-10"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {translations.common.search}
          </button>
        </form>
      </div>

      {error && <ErrorMessage message={error} />}
      {success && <SuccessMessage message={success} />}

      {/* Container Found */}
      {container && (
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Package className="w-5 h-5" />
            {wt.containerInfo}
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">{translations.containers.seriesNumber}</p>
              <p className="font-medium">{container.seriesNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{translations.containers.internalCode}</p>
              <p className="font-medium">{container.internalCode}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{translations.containers.location}</p>
              <LocationBadge location={container.currentLocation} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{translations.containers.status}</p>
              <StatusBadge status={container.currentStatus} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{translations.containers.purchaseDate}</p>
              <p className="font-medium">{formatDate(container.purchaseDate)}</p>
            </div>
          </div>

          {container.currentLocation === "MY_WAREHOUSE" &&
          container.currentStatus === "FREE" ? (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-3 rounded-md text-sm">
              {translations.containers.messages.alreadyAtWarehouse}
            </div>
          ) : (
            <>
              {!showConfirm ? (
                <button
                  onClick={() => setShowConfirm(true)}
                  className="btn-primary w-full"
                >
                  {wt.receiveContainer}
                </button>
              ) : (
                <div className="border-t pt-4 space-y-4">
                  <h3 className="font-medium">{wt.confirmReceiptTitle}</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {wt.addNotes}
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={wt.addNotesPlaceholder}
                      rows={3}
                      className="input-field"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleReceive}
                      disabled={loading}
                      className="btn-primary flex-1"
                    >
                      {loading ? translations.common.loading : wt.confirmReceipt}
                    </button>
                    <button
                      onClick={() => setShowConfirm(false)}
                      className="btn-secondary"
                    >
                      {translations.common.cancel}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
