-- 010 — segunda fecha de entrega (reprogramación)
--
-- POR QUÉ: el archivo del cliente tiene una columna `2DA FECHA`. Cuando una
-- entrega falla, el compromiso se corre y queda en la MISMA fila — no se crea
-- una entrega nueva. Eso responde la pregunta D2 de PREGUNTAS-CLIENTE.md.
--
-- REGLA DE NEGOCIO (de la dueña, 2026-09-02, textual):
--   "Siempre con la primera fecha, porque es la que está en la malla."
--
-- O sea: `fecha_programada` NUNCA se sobreescribe con la reprogramada, y el %
-- de cumplimiento se sigue midiendo contra ella. Si se midiera contra la 2da,
-- el número daría mejor y DEJARÍA DE COINCIDIR con el que el cliente calcula
-- por su lado — que es la forma más rápida de volver inútil un informe.
--
-- Para qué sirve entonces: la malla es un patrón fijo ("todos los martes estas
-- tiendas"), así que una reprogramación siempre significa que pasó una novedad.
-- Guardarla permite responder lo que la dueña quiere analizar: cuáles son las
-- causas más frecuentes por las que hay que correr una entrega.

alter table public.deliveries
  add column if not exists fecha_reprogramada date;

comment on column public.deliveries.fecha_reprogramada is
  'Segunda fecha de entrega tras una novedad ("2DA FECHA" en el archivo del cliente). NO reemplaza a fecha_programada: el cumplimiento se mide siempre contra la primera, que es la de la malla.';

-- La reprogramada nunca puede ser anterior al compromiso original.
alter table public.deliveries
  drop constraint if exists deliveries_reprogramada_posterior;
alter table public.deliveries
  add constraint deliveries_reprogramada_posterior
  check (fecha_reprogramada is null or fecha_programada is null
         or fecha_reprogramada >= fecha_programada);
