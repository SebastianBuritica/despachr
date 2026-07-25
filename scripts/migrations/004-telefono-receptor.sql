/*
╔════════════════════════════════════════════════════════════════════════════╗
║  DESPACHR — MIGRACIÓN 004: teléfono del receptor en la entrega              ║
╚════════════════════════════════════════════════════════════════════════════╝

QUÉ HACE
  - Añade public.deliveries.telefono_receptor (text, NULLABLE): teléfono de la
    persona/punto que recibe la carga. Es lo que consume el botón "Llamar" de
    la app del conductor (tel:) — hasta ahora vivía solo en el mock.

  POR QUÉ ESTE NOMBRE (y no contacto_receptor)
    La columna guarda un TELÉFONO, así que se nombra por lo que contiene. El
    NOMBRE de quien recibe NO se pre-carga: es imposible saberlo por anticipado
    (recibe quien esté en la bodega ese día) y ya se captura en el cumplido, en
    el campo "Recibido por". Por eso solo se agrega el teléfono, sin un campo de
    nombre que nadie llenaría.

  NULLABLE a propósito: no toda entrega trae un teléfono (la malla puede
  cargarse sin él). La UI ya degrada: si no hay teléfono, "Llamar" se
  deshabilita en lugar de romper.

  Formato sugerido: E.164 (p. ej. +573001234567), pero se guarda como texto
  libre porque los datos vienen de Excel del cliente y no siempre están
  normalizados. La normalización (si se necesita) es trabajo posterior.

DEPENDENCIAS
  Requiere el schema base (scripts/schema.sql) ya aplicado: solo usa la tabla
  public.deliveries.

CÓMO CORRERLO
  Supabase → SQL Editor → New query → pega TODO este archivo → Run.
  Idempotente (add column if not exists).

CÓMO VERIFICAR
  select column_name, data_type, is_nullable
    from information_schema.columns
   where table_schema = 'public'
     and table_name = 'deliveries'
     and column_name = 'telefono_receptor';
  -- Esperado: telefono_receptor | text | YES
*/

alter table public.deliveries
  add column if not exists telefono_receptor text;

comment on column public.deliveries.telefono_receptor is
  'Teléfono del receptor en el punto (botón "Llamar" del conductor). Nullable; formato sugerido E.164. El nombre de quien recibe se captura en el cumplido, no aquí.';
