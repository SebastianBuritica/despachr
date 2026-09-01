-- Semilla: una semana real de Casablanca (lun 24 – vie 28 ago 2026)
--
-- PARA QUÉ: el informe de cumplimiento necesita volumen para significar algo.
-- Con 6 entregas no se ve nada. Reproduce la semana que describió la dueña:
-- ~35 facturas a tiendas de cadena, ventana de recibo 7–11am, algunas tarde y
-- algunas con novedad.
--
-- MODELADO (corrige la semilla vieja, que lo tenía al revés):
--   clients   = CASABLANCA, el generador de carga — quien paga y recibe el informe
--   address   = la tienda destino (Makro, Éxito, Olímpica…), NO el cliente
--
-- Ids fijos → re-ejecutable. Para borrar todo:
--   delete from clients where id = '11111111-1111-4111-8111-111111111111';

begin;

insert into clients (id, name, email, phone, address, city, department, contact_person, tipo_servicio, tarifa_flete)
values ('11111111-1111-4111-8111-111111111111', 'Casablanca', 'david@casablanca.com.co',
        '573001234567', 'Km 2 vía Medellín', 'Medellín', 'Antioquia', 'David', 'consolidado', 180000)
on conflict (id) do nothing;

-- created_by es NOT NULL: la malla la arma el coordinador, así que va Daniela Coord.
insert into weekly_plans (id, week_start_date, week_end_date, estado, created_by)
values ('22222222-2222-4222-8222-222222222222', '2026-08-24', '2026-08-28', 'completado',
        '669054bb-b0e3-4d59-a20b-74606d5cbc53')
on conflict (id) do nothing;

insert into routes (id, weekly_plan_id, driver_id, fecha, estado, flete_pactado)
select ('33333333-3333-4333-8333-00000000000' || n)::uuid,
       '22222222-2222-4222-8222-222222222222',
       '3fbfb8b8-8e08-4243-b579-e6cf5303cd3d',
       date '2026-08-23' + n, 'completada', 1250000
from generate_series(1, 5) n
on conflict (id) do nothing;

-- Resiembra limpia
delete from deliveries where client_id = '11111111-1111-4111-8111-111111111111';

with coords(city, lat, lon) as (values
  ('Barranquilla', 10.9639, -74.7964), ('Cartagena', 10.3910, -75.4794),
  ('Montería', 8.7479, -75.8814),      ('Sincelejo', 9.3047, -75.3978),
  ('Santa Marta', 11.2408, -74.1990),  ('Valledupar', 10.4631, -73.2532)
),
datos(seq, tienda, city, prog, retraso, estado, novedad, obs) as (values
  -- lunes 24 · Barranquilla
  (1,'Makro Barranquilla','Barranquilla',date '2026-08-24',0,'entregado',null,null),
  (2,'Éxito Buenavista','Barranquilla',date '2026-08-24',0,'entregado',null,null),
  (3,'Olímpica Prado','Barranquilla',date '2026-08-24',0,'entregado',null,null),
  (4,'Ara Soledad','Barranquilla',date '2026-08-24',0,'entregado',null,null),
  (5,'Carulla Alto Prado','Barranquilla',date '2026-08-24',0,'entregado',null,null),
  (6,'D1 Malambo','Barranquilla',date '2026-08-24',1,'entregado',null,'Llegó fuera de ventana; recibieron al día siguiente'),
  (7,'Súper Inter Norte','Barranquilla',date '2026-08-24',0,'entregado',null,null),
  -- martes 25 · Cartagena
  (1,'Makro Cartagena','Cartagena',date '2026-08-25',0,'entregado',null,null),
  (2,'Éxito Castellana','Cartagena',date '2026-08-25',0,'entregado',null,null),
  (3,'Olímpica Bocagrande','Cartagena',date '2026-08-25',0,'novedad','rechazo','Orden de compra cerrada en el sistema del punto'),
  (4,'Ara Turbaco','Cartagena',date '2026-08-25',0,'entregado',null,null),
  (5,'D1 Manga','Cartagena',date '2026-08-25',0,'entregado',null,null),
  (6,'Olímpica Ternera','Cartagena',date '2026-08-25',0,'entregado',null,null),
  (7,'Éxito San Fernando','Cartagena',date '2026-08-25',0,'entregado',null,null),
  -- miércoles 26 · Montería / Sincelejo
  (1,'Makro Montería','Montería',date '2026-08-26',0,'entregado',null,null),
  (2,'Éxito Montería','Montería',date '2026-08-26',0,'entregado',null,null),
  (3,'Olímpica Montería Centro','Montería',date '2026-08-26',0,'entregado',null,null),
  (4,'Ara Montería Sur','Montería',date '2026-08-26',0,'novedad','faltante','Enviadas 40 unidades, recibidas 38; se anotó en la factura'),
  (5,'Olímpica Sincelejo','Sincelejo',date '2026-08-26',0,'entregado',null,null),
  (6,'Éxito Sincelejo','Sincelejo',date '2026-08-26',0,'entregado',null,null),
  (7,'D1 Sincelejo Norte','Sincelejo',date '2026-08-26',0,'entregado',null,null),
  -- jueves 27 · Santa Marta / Valledupar
  (1,'Makro Santa Marta','Santa Marta',date '2026-08-27',0,'entregado',null,null),
  (2,'Éxito Santa Marta','Santa Marta',date '2026-08-27',0,'entregado',null,null),
  (3,'Olímpica Rodadero','Santa Marta',date '2026-08-27',0,'entregado',null,null),
  (4,'Ara Gaira','Santa Marta',date '2026-08-27',1,'entregado',null,'Cola de descargue de 2h; no alcanzó la ventana de recibo'),
  (5,'Éxito Valledupar','Valledupar',date '2026-08-27',0,'entregado',null,null),
  (6,'Olímpica Valledupar','Valledupar',date '2026-08-27',0,'entregado',null,null),
  (7,'D1 Valledupar Centro','Valledupar',date '2026-08-27',0,'novedad','cliente_ausente','Punto cerrado por inventario; no recibieron'),
  -- viernes 28 · Barranquilla
  (1,'Makro Barranquilla','Barranquilla',date '2026-08-28',0,'entregado',null,null),
  (2,'Éxito Villa Country','Barranquilla',date '2026-08-28',0,'entregado',null,null),
  (3,'Olímpica Country','Barranquilla',date '2026-08-28',0,'entregado',null,null),
  (4,'Ara Riomar','Barranquilla',date '2026-08-28',0,'entregado',null,null),
  (5,'Carulla Villa Santos','Barranquilla',date '2026-08-28',0,'entregado',null,null),
  (6,'D1 Las Flores','Barranquilla',date '2026-08-28',0,'entregado',null,null),
  (7,'Súper Inter Sur','Barranquilla',date '2026-08-28',0,'entregado',null,null)
)
insert into deliveries (route_id, client_id, address, city, numero_secuencia, valor_flete,
                        estado, fecha_programada, hora_llegada_punto, hora_salida_punto,
                        latitude, longitude, observaciones, foto_cumplido_url)
select ('33333333-3333-4333-8333-00000000000' || extract(isodow from d.prog)::int)::uuid,
       '11111111-1111-4111-8111-111111111111',
       d.tienda, d.city, d.seq, 180000,
       d.estado, d.prog,
       ((d.prog + d.retraso) + time '07:30') at time zone 'America/Bogota',
       case when d.estado = 'entregado'
            then ((d.prog + d.retraso) + time '08:45') at time zone 'America/Bogota' end,
       c.lat, c.lon, d.obs,
       case when d.estado = 'entregado' then 'cumplidos/demo/' || d.seq || '.jpg' end
from datos d join coords c on c.city = d.city;

-- Novedades: una fila en issues por cada entrega cerrada con novedad
insert into issues (delivery_id, tipo_novedad, descripcion, estado)
select dl.id, dt.novedad, dl.observaciones, 'reportada'
from deliveries dl
join (values
  ('Olímpica Bocagrande','rechazo'), ('Ara Montería Sur','faltante'),
  ('D1 Valledupar Centro','cliente_ausente')
) as dt(tienda, novedad) on dt.tienda = dl.address
where dl.client_id = '11111111-1111-4111-8111-111111111111' and dl.estado = 'novedad';

commit;

-- Verificación
select count(*) total,
       count(*) filter (where estado = 'entregado') entregadas,
       count(*) filter (where estado = 'novedad') novedades,
       count(*) filter (where estado = 'entregado'
              and (hora_salida_punto at time zone 'America/Bogota')::date <= fecha_programada) a_tiempo
from deliveries where client_id = '11111111-1111-4111-8111-111111111111';
