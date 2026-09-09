-- 012 — orden de compra
--
-- POR QUÉ: el formato de Casablanca cambió con el tiempo (Girle, 2026-09-08) —
-- las versiones de junio y agosto traían "Orden de compra" junto al número de
-- documento; la de septiembre (la más reciente) la quitó junto con peso/cajas.
-- Girle pidió específicamente traerla de vuelta, sin el resto de lo viejo
-- (peso/cajas no vuelven). Es un dato del cliente, no algo que el sistema
-- calcule — mismo patrón que `numero_factura` (migración 009).

alter table public.deliveries
  add column if not exists orden_compra text;

comment on column public.deliveries.orden_compra is
  'Orden de compra del cliente (columna "Orden de compra" en el Excel de Casablanca) — dato manual, no calculado. Distinta de numero_factura.';
