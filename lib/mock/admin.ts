// Datos estáticos del prototipo (handoff admin). En producción vienen de API.
import type { StatusTone } from '@/components/ui/status-badge'

export interface Kpi {
  key: string
  label: string
  value: string
  delta: string
  up: boolean
}

export const KPIS: Kpi[] = [
  { key: 'cumplimiento', label: 'Cumplimiento', value: '94.8%', delta: '2.1 pts vs sem. anterior', up: true },
  { key: 'toneladas', label: 'Toneladas movilizadas', value: '48.3 T', delta: '6.4% vs sem. anterior', up: true },
  { key: 'facturacion', label: 'Facturación', value: '$8.4M', delta: '12% · COP', up: true },
  { key: 'margen', label: 'Margen promedio', value: '23.6%', delta: '0.9 pts', up: true },
]

export interface DayTonnage {
  day: string
  tons: number
}

export const TONNAGE_BY_DAY: DayTonnage[] = [
  { day: 'Lun', tons: 6.4 },
  { day: 'Mar', tons: 7.0 },
  { day: 'Mié', tons: 6.9 },
  { day: 'Jue', tons: 7.8 },
  { day: 'Vie', tons: 8.4 },
  { day: 'Sáb', tons: 6.6 },
  { day: 'Dom', tons: 5.2 },
]

export const COMPLIANCE_PCT = 94.8

export interface ProfitRow {
  id: string
  client: string
  tons: number
  revenue: string
  margin: number
  up: boolean
}

export const PROFITABILITY: ProfitRow[] = [
  { id: 'p1', client: 'Makro Montería', tons: 96.4, revenue: '$15.6M', margin: 26, up: true },
  { id: 'p2', client: 'Grupo Éxito Barranquilla', tons: 73.2, revenue: '$12.4M', margin: 22, up: true },
  { id: 'p3', client: 'Olímpica Soledad', tons: 41.0, revenue: '$6.8M', margin: 19, up: false },
  { id: 'p4', client: 'Tiendas D1 Cali', tons: 38.5, revenue: '$5.1M', margin: 24, up: true },
  { id: 'p5', client: 'Justo & Bueno Medellín', tons: 18.2, revenue: '$2.9M', margin: 17, up: false },
]

export interface ClientAccount {
  id: string
  name: string
  city: string
  contact: string
  contract: 'Anual' | 'Mensual'
  tons: number
  revenue: string
  margin: number
  active: boolean
}

export const CLIENT_ACCOUNTS: ClientAccount[] = [
  { id: 'a1', name: 'Makro Montería', city: 'Montería', contact: 'Laura Gómez', contract: 'Anual', tons: 96.4, revenue: '$15.6M', margin: 26, active: true },
  { id: 'a2', name: 'Grupo Éxito Barranquilla', city: 'Barranquilla', contact: 'Camilo Restrepo', contract: 'Anual', tons: 73.2, revenue: '$12.4M', margin: 22, active: true },
  { id: 'a3', name: 'Olímpica Soledad', city: 'Soledad', contact: 'Andrea Pérez', contract: 'Mensual', tons: 41.0, revenue: '$6.8M', margin: 19, active: true },
  { id: 'a4', name: 'Tiendas D1 Cali', city: 'Cali', contact: 'Felipe Cano', contract: 'Anual', tons: 38.5, revenue: '$5.1M', margin: 24, active: true },
  { id: 'a5', name: 'Justo & Bueno Medellín', city: 'Medellín', contact: 'Marcela Ruiz', contract: 'Mensual', tons: 18.2, revenue: '$2.9M', margin: 17, active: false },
]

export const CLIENT_SUMMARY = {
  total: 12,
  active: 11,
  monthlyTons: '246 T',
  monthlyRevenue: '$42.8M',
}

export type InvoiceStatus = 'pagada' | 'pendiente' | 'vencida'

export const INVOICE_STATUS: Record<InvoiceStatus, { label: string; tone: StatusTone }> = {
  pagada: { label: 'Pagada', tone: 'success' },
  pendiente: { label: 'Pendiente', tone: 'warning' },
  vencida: { label: 'Vencida', tone: 'danger' },
}

export interface Invoice {
  id: string
  client: string
  issued: string
  due: string
  amount: string
  status: InvoiceStatus
}

export const INVOICES: Invoice[] = [
  { id: 'FAC-2026-0151', client: 'Justo & Bueno Medellín', issued: '14 ene', due: '29 ene', amount: '$0.9M', status: 'pagada' },
  { id: 'FAC-2026-0150', client: 'Olímpica Soledad', issued: '13 ene', due: '28 ene', amount: '$1.4M', status: 'pendiente' },
  { id: 'FAC-2026-0149', client: 'Tiendas D1 Cali', issued: '12 ene', due: '27 ene', amount: '$2.1M', status: 'pendiente' },
  { id: 'FAC-2026-0148', client: 'Grupo Éxito Barranquilla', issued: '08 ene', due: '23 ene', amount: '$3.6M', status: 'vencida' },
  { id: 'FAC-2026-0147', client: 'Makro Montería', issued: '05 ene', due: '20 ene', amount: '$4.2M', status: 'pagada' },
]

export const BILLING_SUMMARY = {
  billed: '$42.8M',
  collected: '$34.1M',
  pending: '$6.2M',
  overdue: '$2.5M',
}

export interface RecentReport {
  id: string
  name: string
  period: string
  generated: string
  format: 'PDF' | 'XLSX' | 'CSV'
}

export const RECENT_REPORTS: RecentReport[] = [
  { id: 'rp1', name: 'Cumplimiento', period: 'Semana 15–21 ene', generated: '21 ene 2026', format: 'PDF' },
  { id: 'rp2', name: 'Rentabilidad', period: 'Enero 2026', generated: '20 ene 2026', format: 'XLSX' },
  { id: 'rp3', name: 'Toneladas', period: 'Semana 8–14 ene', generated: '14 ene 2026', format: 'PDF' },
  { id: 'rp4', name: 'Conductores', period: 'Enero 2026', generated: '12 ene 2026', format: 'CSV' },
]
