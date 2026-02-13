"use client";

import { useEffect, useState } from "react";
import { translations } from "@/lib/translations/es";
import { StatusBadge } from "@/components/containers/StatusBadge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { SuccessMessage } from "@/components/shared/SuccessMessage";
import { formatDate } from "@/lib/utils/formatters";
import { ArrowUpFromLine, MapPin, Phone, Mail, ChevronDown, ChevronUp } from "lucide-react";

const wt = translations.warehouse;

interface Container {
  id: string;
  seriesNumber: string;
  internalCode: string;
  currentStatus: string;
  currentLocation: string;
  operationType: string;
  assignedDate: string;
  assignedTo: { name: string; company: string; phone: string; email: string; address: string } | null;
  assignedBy: { name: string } | null;
  monthlyRentalRate?: string;
  expectedReturnDate?: string;
  salesInvoicePdfUrl?: string;
}

export default function ExitsPage() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [exitModal, setExitModal] = useState<string | null>(null);
  const [exitNotes, setExitNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchContainers = async () => {
    setLoading(true);
    const res = await fetch("/api/containers?status=ASSIGNED_SALE&location=MY_WAREHOUSE");
    const saleMW = await res.json();
    const res2 = await fetch("/api/containers?status=ASSIGNED_RENTAL&location=MY_WAREHOUSE");
    const rentalMW = await res2.json();
    const res3 = await fetch("/api/containers?status=ASSIGNED_SALE&location=SUPPLIER");
    const saleSup = await res3.json();
    const res4 = await fetch("/api/containers?status=ASSIGNED_RENTAL&location=SUPPLIER");
    const rentalSup = await res4.json();

    setContainers([...saleMW, ...rentalMW, ...saleSup, ...rentalSup]);
    setLoading(false);
  };

  useEffect(() => {
    fetchContainers();
  }, []);

  const handleAuthorizeExit = async (containerId: string) => {
    setProcessing(true);
    setError("");

    try {
      const res = await fetch("/api/containers/authorize-exit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ containerId, notes: exitNotes || undefined }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSuccess(translations.containers.messages.exitAuthorized);
        setExitModal(null);
        setExitNotes("");
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
        {wt.readyForExit}
      </h1>

      {error && <ErrorMessage message={error} />}
      {success && (
        <SuccessMessage message={success} onDismiss={() => setSuccess("")} />
      )}

      {containers.length === 0 ? (
        <EmptyState message="No hay contenedores listos para salida" />
      ) : (
        <div className="space-y-3">
          {containers.map((c) => (
            <div key={c.id} className="card">
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() =>
                  setExpandedId(expandedId === c.id ? null : c.id)
                }
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-medium text-gray-900">
                      {c.seriesNumber}
                    </p>
                    <p className="text-sm text-gray-500">{c.internalCode}</p>
                  </div>
                  <StatusBadge status={c.currentStatus} />
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <p className="font-medium">
                      {c.assignedTo?.name} - {c.assignedTo?.company}
                    </p>
                    <p className="text-gray-500">
                      {c.assignedDate ? formatDate(c.assignedDate) : ""}
                    </p>
                  </div>
                  {expandedId === c.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              {expandedId === c.id && c.assignedTo && (
                <div className="border-t px-4 py-4 space-y-3 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <a href={`tel:${c.assignedTo.phone}`} className="text-primary-600 hover:underline">
                        {c.assignedTo.phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <a href={`mailto:${c.assignedTo.email}`} className="text-primary-600 hover:underline">
                        {c.assignedTo.email}
                      </a>
                    </div>
                    <div className="flex items-start gap-2 md:col-span-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      <span>{c.assignedTo.address}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">{translations.containers.operationType}: </span>
                      <span className="font-medium">
                        {translations.containers.operationTypes[c.operationType] || c.operationType}
                      </span>
                    </div>
                    {c.operationType === "RENTAL" && (
                      <>
                        <div>
                          <span className="text-gray-500">{translations.containers.rental.monthlyRate}: </span>
                          <span className="font-medium">${Number(c.monthlyRentalRate || 0).toLocaleString("es-MX")} MXN</span>
                        </div>
                        <div>
                          <span className="text-gray-500">{translations.containers.rental.expectedReturnDate}: </span>
                          <span className="font-medium">
                            {c.expectedReturnDate ? formatDate(c.expectedReturnDate) : "-"}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {exitModal === c.id ? (
                    <div className="mt-4 p-4 bg-white rounded-lg border space-y-3">
                      <h3 className="font-medium">{wt.authorizeExitTitle}</h3>
                      <p className="text-sm text-gray-600">
                        {wt.exitingTo} <strong>{c.assignedTo.name}</strong>
                      </p>
                      <p className="text-sm text-gray-600">
                        {wt.exitAddress} {c.assignedTo.address}
                      </p>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {wt.exitNotesLabel}
                        </label>
                        <textarea
                          value={exitNotes}
                          onChange={(e) => setExitNotes(e.target.value)}
                          placeholder={wt.exitNotesPlaceholder}
                          rows={2}
                          className="input-field"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleAuthorizeExit(c.id)}
                          disabled={processing}
                          className="btn-primary flex-1"
                        >
                          {processing ? translations.common.loading : wt.confirmExit}
                        </button>
                        <button
                          onClick={() => {
                            setExitModal(null);
                            setExitNotes("");
                          }}
                          className="btn-secondary"
                        >
                          {translations.common.cancel}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setExitModal(c.id)}
                      className="btn-primary mt-2"
                    >
                      <ArrowUpFromLine className="w-4 h-4 mr-2" />
                      {wt.authorizeExit}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
