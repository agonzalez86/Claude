"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { translations } from "@/lib/translations/es";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { SuccessMessage } from "@/components/shared/SuccessMessage";
import { Upload, FileText, Check, AlertTriangle, ChevronRight } from "lucide-react";

const t = translations.containers.register;

interface FacturaData {
  date: string;
  subtotal: number;
  containerNumbers: string[];
  quantity: number;
}

interface PedimentoMatch {
  seriesNumber: string;
  status: "exact" | "no_match" | "multiple";
  pedimentoNumber?: string;
  pedimentoNumbers?: string[];
  selectedPedimento?: string;
}

interface PedimentoInfo {
  pedimentoNumber: string;
  pdfUrl: string;
}

export default function RegisterContainersPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Factura
  const [facturaFile, setFacturaFile] = useState<File | null>(null);
  const [facturaPdfUrl, setFacturaPdfUrl] = useState("");
  const [facturaData, setFacturaData] = useState<FacturaData | null>(null);
  const [editedDate, setEditedDate] = useState("");
  const [editedSubtotal, setEditedSubtotal] = useState("");
  const [editedSeriesNumbers, setEditedSeriesNumbers] = useState("");
  const [extractionFailed, setExtractionFailed] = useState(false);

  // Step 2: Pedimentos
  const [pedimentoFiles, setPedimentoFiles] = useState<File[]>([]);
  const [pedimentos, setPedimentos] = useState<PedimentoInfo[]>([]);
  const [matches, setMatches] = useState<PedimentoMatch[]>([]);

  // Step 3: Internal codes
  const [internalCodes, setInternalCodes] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);
  const [createdCount, setCreatedCount] = useState(0);

  const handleUploadFactura = async () => {
    if (!facturaFile) return;
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", facturaFile);

      const res = await fetch("/api/containers/upload-factura", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setFacturaPdfUrl(data.pdfUrl);

      if (data.extractedData) {
        setFacturaData(data.extractedData);
        setEditedDate(data.extractedData.date);
        setEditedSubtotal(String(data.extractedData.subtotal));
        setEditedSeriesNumbers(data.extractedData.containerNumbers.join("\n"));
      } else {
        setExtractionFailed(true);
        setEditedDate("");
        setEditedSubtotal("");
        setEditedSeriesNumbers("");
      }
    } catch {
      setError(translations.errors.uploadFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmFactura = () => {
    const numbers = editedSeriesNumbers
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean);

    if (!editedDate || !editedSubtotal || numbers.length === 0) {
      setError("Por favor complete todos los campos");
      return;
    }

    setFacturaData({
      date: editedDate,
      subtotal: Number(editedSubtotal),
      containerNumbers: numbers,
      quantity: numbers.length,
    });
    setError("");
    setStep(2);
  };

  const handleUploadPedimentos = async () => {
    if (pedimentoFiles.length === 0) return;
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      pedimentoFiles.forEach((f) => formData.append("files", f));
      formData.append(
        "containerNumbers",
        JSON.stringify(facturaData!.containerNumbers)
      );

      const res = await fetch("/api/containers/upload-pedimento", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setPedimentos(data.pedimentos);
      setMatches(
        data.matches.map((m: PedimentoMatch) => ({
          ...m,
          selectedPedimento: m.pedimentoNumber || "",
        }))
      );
      setStep(3);
    } catch {
      setError(translations.errors.uploadFailed);
    } finally {
      setLoading(false);
    }
  };

  const allMatchesResolved = matches.every((m) => m.selectedPedimento);

  const handleCreateContainers = async () => {
    // Validate internal codes
    const seriesNumbers = facturaData!.containerNumbers;
    for (const sn of seriesNumbers) {
      if (!internalCodes[sn]) {
        setError(`Por favor ingrese el código interno para ${sn}`);
        return;
      }
    }

    setCreating(true);
    setError("");

    try {
      const costPerContainer =
        facturaData!.subtotal / facturaData!.quantity;

      const containers = seriesNumbers.map((sn) => {
        const match = matches.find((m) => m.seriesNumber === sn);
        const pedimento = pedimentos.find(
          (p) => p.pedimentoNumber === (match?.selectedPedimento || match?.pedimentoNumber)
        );

        return {
          seriesNumber: sn,
          internalCode: internalCodes[sn],
          pedimentoNumber: match?.selectedPedimento || match?.pedimentoNumber || "",
          purchaseDate: facturaData!.date,
          costWithoutIVA: costPerContainer,
          facturaPdfUrl,
          pedimentoPdfUrl: pedimento?.pdfUrl || "",
        };
      });

      const res = await fetch("/api/containers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ containers }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setCreatedCount(data.count);
      setCreated(true);
    } catch {
      setError(translations.errors.generic);
    } finally {
      setCreating(false);
    }
  };

  if (created) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {t.created.replace("{count}", String(createdCount))}
          </h2>
          <button
            onClick={() => router.push("/dashboard/containers")}
            className="btn-primary mt-6"
          >
            {t.viewInventory}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= s
                  ? "bg-primary-600 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {step > s ? <Check className="w-4 h-4" /> : s}
            </div>
            {s < 3 && (
              <ChevronRight className="w-5 h-5 text-gray-300 mx-1" />
            )}
          </div>
        ))}
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Step 1: Upload Factura */}
      {step === 1 && (
        <div className="card p-6 space-y-6">
          <h2 className="text-lg font-semibold">{t.step1}</h2>

          {!facturaPdfUrl ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500 mb-1">{t.maxFileSize}</p>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFacturaFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="factura-upload"
                />
                <label htmlFor="factura-upload" className="btn-primary cursor-pointer inline-block mt-2">
                  {t.selectFactura}
                </label>
                {facturaFile && (
                  <p className="mt-2 text-sm text-gray-600">
                    <FileText className="w-4 h-4 inline mr-1" />
                    {facturaFile.name}
                  </p>
                )}
              </div>
              {facturaFile && (
                <button
                  onClick={handleUploadFactura}
                  disabled={loading}
                  className="btn-primary w-full"
                >
                  {loading ? t.uploading : translations.common.upload}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-md font-medium">
                {extractionFailed
                  ? translations.containers.messages.extractionFailed
                  : t.extractedData}
              </h3>
              {!extractionFailed && (
                <p className="text-sm text-gray-500">{t.reviewData}</p>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.dateLabel}
                  </label>
                  <input
                    type="date"
                    value={editedDate}
                    onChange={(e) => setEditedDate(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.subtotalLabel}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      value={editedSubtotal}
                      onChange={(e) => setEditedSubtotal(e.target.value)}
                      className="input-field pl-8"
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.seriesLabel}
                  </label>
                  <textarea
                    value={editedSeriesNumbers}
                    onChange={(e) => setEditedSeriesNumbers(e.target.value)}
                    placeholder="CMAU002422.3&#10;APZU367158.9"
                    rows={6}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.quantityLabel}
                  </label>
                  <input
                    type="text"
                    value={
                      editedSeriesNumbers
                        .split("\n")
                        .filter((n) => n.trim()).length
                    }
                    readOnly
                    className="input-field bg-gray-50"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleConfirmFactura}
                  className="btn-primary flex-1"
                >
                  {translations.common.confirm}
                </button>
                <button
                  onClick={() => {
                    setFacturaPdfUrl("");
                    setFacturaFile(null);
                  }}
                  className="btn-secondary"
                >
                  {translations.common.cancel}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Upload Pedimentos */}
      {step === 2 && (
        <div className="card p-6 space-y-6">
          <h2 className="text-lg font-semibold">{t.step2}</h2>
          <p className="text-sm text-gray-500">{t.uploadInstructions}</p>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <input
              type="file"
              accept=".pdf"
              multiple
              onChange={(e) =>
                setPedimentoFiles(Array.from(e.target.files || []))
              }
              className="hidden"
              id="pedimento-upload"
            />
            <label htmlFor="pedimento-upload" className="btn-primary cursor-pointer inline-block">
              {t.selectPedimentos}
            </label>
          </div>

          {pedimentoFiles.length > 0 && (
            <div className="space-y-2">
              {pedimentoFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span>{f.name}</span>
                  <span className="text-gray-400">
                    ({(f.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleUploadPedimentos}
              disabled={loading || pedimentoFiles.length === 0}
              className="btn-primary flex-1"
            >
              {loading ? translations.common.loading : translations.common.upload}
            </button>
            <button onClick={() => setStep(1)} className="btn-secondary">
              {translations.common.back}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Match & Create */}
      {step === 3 && (
        <div className="card p-6 space-y-6">
          <h2 className="text-lg font-semibold">{t.linkContainers}</h2>

          {/* Matching table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {translations.containers.seriesNumber}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {translations.containers.pedimentoNumber}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {translations.containers.internalCode}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {matches.map((match, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 text-sm font-medium">
                      {match.seriesNumber}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {match.status === "exact" && (
                        <span className="text-green-600 flex items-center gap-1">
                          <Check className="w-4 h-4" /> {t.exactMatch}
                        </span>
                      )}
                      {match.status === "no_match" && (
                        <span className="text-yellow-600 flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" /> {t.noMatch}
                        </span>
                      )}
                      {match.status === "multiple" && (
                        <span className="text-orange-600 flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" /> {t.multipleMatches}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {match.status === "exact" ? (
                        match.pedimentoNumber
                      ) : (
                        <select
                          value={match.selectedPedimento || ""}
                          onChange={(e) => {
                            const updated = [...matches];
                            updated[i] = {
                              ...updated[i],
                              selectedPedimento: e.target.value,
                            };
                            setMatches(updated);
                          }}
                          className="input-field text-sm"
                        >
                          <option value="">{t.selectPedimento}</option>
                          {pedimentos.map((p) => (
                            <option key={p.pedimentoNumber} value={p.pedimentoNumber}>
                              {p.pedimentoNumber}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={internalCodes[match.seriesNumber] || ""}
                        onChange={(e) =>
                          setInternalCodes({
                            ...internalCodes,
                            [match.seriesNumber]: e.target.value,
                          })
                        }
                        placeholder={t.internalCodePlaceholder}
                        className="input-field text-sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCreateContainers}
              disabled={creating || !allMatchesResolved}
              className="btn-primary flex-1"
            >
              {creating ? t.creating : t.confirmMatches}
            </button>
            <button onClick={() => setStep(2)} className="btn-secondary">
              {translations.common.back}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
