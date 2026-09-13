-- 008 — fecha comprometida con el cliente
--
-- POR QUÉ: el generador de carga manda el sábado un Excel con la fecha de entrega
-- comprometida de cada factura. Sin ese dato "a tiempo" no existe: hoy sólo
-- guardamos cuándo llegó el camión, contra nada. Es la columna que vuelve
-- calculable el % de cumplimiento — el informe que hoy se arma a mano filtrando
-- Excel, con los cumplidos llegando 15-20 días tarde.
--
-- NULLABLE a propósito: las entregas viejas no tienen compromiso registrado y no
-- se puede inventar uno. El informe cuenta sólo las que lo tienen y declara
-- cuántas excluyó — un cumplimiento calculado sobre una base silenciosamente
-- recortada es peor que no tenerlo.
--
-- NO se agrega "fecha_entrega_real": ya es derivable de hora_salida_punto.

alter table public.deliveries
  add column if not exists fecha_programada date;

comment on column public.deliveries.fecha_programada is
  'Fecha comprometida con el cliente (Excel semanal del generador de carga). Null = sin compromiso registrado; se excluye del % de cumplimiento.';

create index if not exists deliveries_fecha_programada_idx
  on public.deliveries (fecha_programada)
  where fecha_programada is not null;
