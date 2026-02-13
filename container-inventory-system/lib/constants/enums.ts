export const STATUS_COLORS: Record<string, string> = {
  FREE: "bg-green-100 text-green-800 border-green-200",
  ASSIGNED_SALE: "bg-blue-100 text-blue-800 border-blue-200",
  ASSIGNED_RENTAL: "bg-purple-100 text-purple-800 border-purple-200",
  PENDING_REVENUE_CONFIRMATION: "bg-yellow-100 text-yellow-800 border-yellow-200",
};

export const LOCATION_COLORS: Record<string, string> = {
  SUPPLIER: "bg-gray-100 text-gray-800 border-gray-200",
  MY_WAREHOUSE: "bg-emerald-100 text-emerald-800 border-emerald-200",
  IN_TRANSIT: "bg-orange-100 text-orange-800 border-orange-200",
  CLIENT_LOCATION: "bg-cyan-100 text-cyan-800 border-cyan-200",
};

export const ACTION_TYPES = {
  CREATED: "Created",
  RECEIVED: "Received",
  ASSIGNED: "Assigned",
  EXIT_AUTHORIZED: "Exit Authorized",
  DELIVERY_CONFIRMED: "Delivery Confirmed",
  RETURNED: "Returned",
  RETURN_REJECTED: "Return Rejected",
  REVENUE_CONFIRMED: "Revenue Confirmed",
  RENTAL_EXTENDED: "Rental Extended",
  NOTE_ADDED: "Note Added",
  PHOTO_ADDED: "Photo Added",
  ARCHIVED: "Archived",
} as const;

export const ACTION_TYPE_LABELS: Record<string, string> = {
  Created: "Creado",
  Received: "Recibido",
  Assigned: "Asignado",
  "Exit Authorized": "Salida Autorizada",
  "Delivery Confirmed": "Entrega Confirmada",
  Returned: "Retornado",
  "Return Rejected": "Retorno Rechazado",
  "Revenue Confirmed": "Ingresos Confirmados",
  "Rental Extended": "Renta Extendida",
  "Note Added": "Nota Agregada",
  "Photo Added": "Foto Agregada",
  Archived: "Archivado",
};
