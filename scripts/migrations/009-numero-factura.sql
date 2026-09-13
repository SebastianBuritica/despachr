-- 009 — número de factura del cliente en la entrega
--
-- POR QUÉ: es la LLAVE que une las tres cosas que hoy se emparejan a mano:
--   · el Excel que el generador de carga manda el sábado (trae el número)
--   · la factura física firmada que vuelve del punto (lo lleva impreso)
--   · la fila de `deliveries`
-- Sin esta columna, el agente de cumplido no tiene contra qué emparejar una foto
-- y alguien sigue cruzando 35 imágenes a mano — que es el trabajo a eliminar.
--
-- UNIDAD (decisión, no accidente): una entrega = una FACTURA, no una parada.
-- La operación dice que "un solo negocio puede llevar dos o tres facturas", y el
-- cliente mide en facturas ("de 40 entregas, 37 efectivas"). Alinear la fila a la
-- factura hace que el match sea 1:1 y que el porcentaje coincida con el que el
-- cliente calcula por su lado. Una tienda con 3 facturas son 3 filas a la misma
-- dirección; `numero_secuencia` ya lo permite.
--
-- ÚNICO POR CLIENTE, no global: dos generadores de carga distintos pueden emitir
-- el mismo número. Un unique global rechazaría cargas legítimas.
--
-- NULLABLE: las entregas ya existentes no lo tienen y no se puede inventar.

alter table public.deliveries
  add column if not exists numero_factura text;

comment on column public.deliveries.numero_factura is
  'Número de la factura del generador de carga. Llave de emparejamiento entre el Excel semanal del cliente, la factura física firmada y esta fila. Null = aún no registrada.';

create unique index if not exists deliveries_cliente_factura_idx
  on public.deliveries (client_id, numero_factura)
  where numero_factura is not null;
