"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { translations } from "@/lib/translations/es";
import { StatusBadge } from "@/components/containers/StatusBadge";
import { LocationBadge } from "@/components/containers/LocationBadge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDate, formatCurrency } from "@/lib/utils/formatters";
import { Eye, Search, Filter } from "lucide-react";

interface Container {
  id: string;
  seriesNumber: string;
  internalCode: string;
  currentStatus: string;
  currentLocation: string;
  assignedTo?: { name: string; company: string } | null;
  assignedBy?: { name: string } | null;
  assignedDate?: string | null;
  purchaseDate: string;
  costWithoutIVA: string;
  pedimentoNumber: string;
}

export default function ContainersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const fetchContainers = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (locationFilter !== "all") params.set("location", locationFilter);

    const res = await fetch(`/api/containers?${params.toString()}`);
    const data = await res.json();
    setContainers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchContainers();
  }, [statusFilter, locationFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchContainers();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {translations.containers.title}
        </h1>
      </div>

      {/* Search and Filters */}
      <div className="card p-4 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={translations.filters.searchPlaceholder}
              className="input-field pl-10"
            />
          </div>
          <button type="submit" className="btn-primary">
            {translations.common.search}
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary"
          >
            <Filter className="w-4 h-4 mr-2" />
            {translations.common.filter}
          </button>
        </form>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {translations.filters.status}
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field"
              >
                <option value="all">{translations.common.all}</option>
                <option value="FREE">{translations.containers.statuses.FREE}</option>
                <option value="ASSIGNED_SALE">{translations.containers.statuses.ASSIGNED_SALE}</option>
                <option value="ASSIGNED_RENTAL">{translations.containers.statuses.ASSIGNED_RENTAL}</option>
                <option value="PENDING_REVENUE_CONFIRMATION">{translations.containers.statuses.PENDING_REVENUE_CONFIRMATION}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {translations.filters.location}
              </label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="input-field"
              >
                <option value="all">{translations.common.all}</option>
                <option value="SUPPLIER">{translations.containers.locations.SUPPLIER}</option>
                <option value="MY_WAREHOUSE">{translations.containers.locations.MY_WAREHOUSE}</option>
                <option value="IN_TRANSIT">{translations.containers.locations.IN_TRANSIT}</option>
                <option value="CLIENT_LOCATION">{translations.containers.locations.CLIENT_LOCATION}</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Container Table */}
      {loading ? (
        <LoadingSpinner />
      ) : containers.length === 0 ? (
        <EmptyState message={translations.common.noResults} />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
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
                    {translations.table.status}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {translations.table.location}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {translations.table.assignedTo}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {translations.table.assignedDate}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {translations.common.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {containers.map((container) => (
                  <tr
                    key={container.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() =>
                      router.push(`/dashboard/containers/${container.id}`)
                    }
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {container.seriesNumber}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {container.internalCode}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={container.currentStatus} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <LocationBadge location={container.currentLocation} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {container.assignedTo
                        ? `${container.assignedTo.name} - ${container.assignedTo.company}`
                        : "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {container.assignedDate
                        ? formatDate(container.assignedDate)
                        : "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/containers/${container.id}`);
                        }}
                        className="text-primary-600 hover:text-primary-800"
                        title={translations.containers.actions.viewDetails}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
