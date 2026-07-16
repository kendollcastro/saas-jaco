import { z } from "zod";

export const bookingSchema = z.object({
  customerName: z.string().min(1, "El nombre del cliente es requerido"),
  customerPhone: z.string().nullable().optional(),
  customerEmail: z.string().email("Email inválido").nullable().optional().or(z.literal("")),
  serviceName: z.string().min(1, "El servicio es requerido"),
  date: z.string().min(1, "La fecha es requerida"),
  time: z.string().nullable().optional(),
  pax: z.coerce.number().int().min(1, "Al menos 1 persona").optional().default(1),
  total: z.coerce.number().min(0).nullable().optional(),
  deposit: z.coerce.number().min(0).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const serviceSchema = z.object({
  name: z.string().min(1, "El nombre del servicio es requerido"),
  description: z.string().nullable().optional(),
  price: z.coerce.number().min(0).nullable().optional(),
  duration: z.coerce.number().int().min(0).nullable().optional(),
});

export const staffSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  phone: z.string().nullable().optional(),
  email: z.string().email("Email inválido").nullable().optional().or(z.literal("")),
  role: z.string().nullable().optional(),
});

export const settingSchema = z.object({
  businessName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  address: z.string().optional(),
  modules: z.record(z.string(), z.boolean()).optional(),
});


