import { z } from "zod";

export const containerSeriesSchema = z
  .string()
  .regex(
    /^[A-Z]{4}\d{6}\.\d$/,
    "Formato inválido. Debe ser 4 letras, 6 dígitos, punto, 1 dígito (ej: CMAU002422.3)"
  );

export const emailSchema = z.string().email("Email inválido");

export const phoneSchema = z
  .string()
  .regex(/^\+?[\d\s\-()]+$/, "Número de teléfono inválido");

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export const clientSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  company: z.string().min(1, "La empresa es requerida"),
  phone: phoneSchema,
  email: emailSchema,
  address: z.string().min(1, "La dirección es requerida"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const assignmentSchema = z.object({
  containerId: z.string().uuid(),
  clientId: z.string().uuid().optional(),
  newClient: clientSchema.optional(),
  operationType: z.enum(["SALE", "RENTAL"]),
  monthlyRentalRate: z.number().positive().optional(),
  rentalStartDate: z.string().optional(),
  expectedReturnDate: z.string().optional(),
  salesInvoicePdfUrl: z.string(),
});

export const receiveContainerSchema = z.object({
  containerId: z.string().uuid(),
  notes: z.string().optional(),
  photoUrls: z.array(z.string()).optional(),
});

export const authorizeExitSchema = z.object({
  containerId: z.string().uuid(),
  notes: z.string().optional(),
});

export const confirmDeliverySchema = z.object({
  containerId: z.string().uuid(),
  notes: z.string().optional(),
});

export const confirmRevenueSchema = z.object({
  containerId: z.string().uuid(),
  finalRevenue: z.number().positive("Los ingresos deben ser mayores a 0"),
  notes: z.string().optional(),
});

export const extendRentalSchema = z.object({
  containerId: z.string().uuid(),
  newExpectedReturnDate: z.string(),
  reason: z.string().optional(),
});

export const userCreateSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  name: z.string().min(1, "El nombre es requerido"),
  role: z.enum(["ADMIN", "SALES", "WAREHOUSE_COORDINATOR"]),
});
