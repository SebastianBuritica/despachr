# Preguntas para la operación (cliente piloto)

**Para qué es esto:** hay trabajo que no se puede construir bien sin saber cómo funciona la
operación de verdad. No son preguntas técnicas — son sobre el día a día. Se pueden responder
hablando; no hace falta escribir nada formal.

**Cómo usarlo:** son 20. Si sólo hay tiempo para seis, están al final. Cada bloque dice qué
desbloquea, por si ayuda a priorizar.

---

## A. Peso y volumen de la carga

> Sin esto no se puede construir el **planificador de malla**: el sistema no sabría cuándo un camión
> ya va lleno.

**A1.** 🔴 Cuando un cliente manda el Excel del viernes, ¿viene el **peso** de lo que hay que mover?
¿En qué — kilos, cajas, toneladas, estibas? ¿Y ese dato viene por **cada punto de entrega** o por
todo el despacho del cliente junto?

**A4.** 🔴 ¿Qué vehículos hay y cuánto carga cada uno? ¿Son de la empresa o los pone el conductor?
Al armar un camión, ¿qué se llena primero, **el peso o el espacio**?

---

## B. Qué significa "a tiempo"

> Es **el indicador que más importa**, pero ahora mismo el sistema no puede calcularlo: no hay contra
> qué comparar la hora de llegada.

**B1.** 🔴 ¿Qué hace que una entrega sea "a tiempo" — una **hora comprometida** o una ventana ("entre
7 y 11")? ¿La pone el cliente o nosotros? ¿Es igual para todos, o Makro exige distinto que una
tienda de barrio?

---

## C. Cómo se arma la malla

**C3.** ¿Qué es **lo que más tiempo quita** al armar la malla? Esa es la parte que vale la pena
automatizar — y probablemente no es la que uno se imagina.

---

## D. Novedades (rechazos, faltantes, daños)

> Ya sabemos que una novedad **cierra la entrega**. Falta saber qué pasa después.

**D2. ✅ CONTESTADA** (dueña, 2026-09-02, por voz) — Cuando hay novedad, la entrega se
**reprograma en la MISMA fila**, no se crea una nueva. El compromiso original NUNCA se
sobreescribe: *"siempre con la primera fecha, porque es la que está en la malla"* — el % de
cumplimiento se mide contra ella, y la segunda fecha se guarda aparte sólo para poder analizar
las causas de reprogramación. Implementado en `deliveries.fecha_reprogramada` (migración `010`).

---

## E. Alertas (camión demorado en un punto)

> Hoy el sistema avisa a los **60 minutos**. Ese número lo pusimos nosotros.

**E1.** 🔴 ¿60 minutos es razonable? ¿Cuánto se demora normalmente un descargue en un Makro
comparado con una tienda pequeña?

**E3.** ¿Basta con ver la alerta **en la pantalla del panel** mientras se trabaja, o hace falta que
llegue algo **al celular** aunque se esté en otra cosa? (Define si vale la pena montar SMS.)

---

## F. La plata

> Todo este bloque define el panel de administración, que va **después** de v1. Una sola pregunta
> ahora; el resto es otra conversación, cuando la app ya esté corriendo.

**F4.** De todo el proceso de facturar en Sistran y pasar el XML a Cigo, ¿**cuál es el paso más
tedioso**? Ahí es donde el sistema puede ayudar más.

---

## G. Con qué trabajan hoy

> El código asume cosas sobre los equipos de la gente que nunca se verificaron.

**G1.** 🔴 ¿Qué celular tiene cada conductor — Android o iPhone, propio o de la empresa? ¿Y **quién
paga los datos**: plan mensual o recargas? Un conductor sin datos a mitad de mes deja de reportar, y
eso no lo arregla el modo sin señal.

**G6.** **Sistran:** ¿es de escritorio o de navegador? ¿Exporta o importa algo (Excel, XML), o todo
se digita a mano?

**G7.** ¿Cuántos grupos de WhatsApp hay hoy y para qué sirve cada uno? **Es el mapa exacto de lo que
la app tiene que reemplazar.**

---

## H. Las personas (esto decide si la app se usa o no)

> Los conductores son **terceros contratistas**, no empleados. Nadie puede obligarlos a usar una app.
> Este bloque es el riesgo más grande del proyecto y no depende del código.

**H1.** 🔴 ¿Cuántos conductores hay y son siempre los mismos o rotan? Cuando entra uno nuevo, ¿quién
lo da de alta y en cuánto tiempo tiene que estar listo? (Hoy eso requiere un comando manual mío. Si
pasa cada semana hay que construir la pantalla; si pasa dos veces al año, no.)

**H2.** 🔴 Si un conductor **se niega** y sigue mandando fotos por WhatsApp, ¿qué pasa? ¿Hay alguna
palanca — por ejemplo, que sin cumplido cargado no se paga el flete?

**H3.** ¿Quién sería el **más difícil** de convencer y quién el **más fácil**? (Con el fácil se
arranca; el difícil dice qué hay que arreglar antes.)

---

## I. Los datos que ya existen

> La app está vacía. Antes del primer lunes hay que cargar clientes, puntos y vehículos. Cuánto
> trabajo es eso depende enteramente de estas dos respuestas.

**I1.** 🔴 ¿Cuántos clientes activos hay y cuántos puntos de entrega distintos? En una semana normal,
¿cuántas rutas salen y cuántos puntos tiene cada una?

**I2.** 🔴 ¿Existe ya una lista de los puntos con sus direcciones (en Sistran, en un Excel maestro),
o cada semana la dirección viene escrita a mano en el Excel del cliente? ¿Son direcciones exactas
("Cra 5 #12-34") o "Makro Montería" a secas? **El mapa necesita coordenadas**; si sólo hay nombres,
hay que resolverlas una por una.

---

## J. Qué significa que esto "ya está funcionando"

> Sin una definición acordada de éxito, la app se queda para siempre en "casi lista".

**J1.** 🔴 El primer lunes real, ¿arrancamos con **todas** las rutas o con **una sola** de prueba?

**J2.** ¿Qué tendría que pasar para que digas "esto sí sirve"? ¿Y qué tendría que pasar para que
digas "volvamos al Excel"?

**J3.** ¿Cuánto tiempo se va a llevar Excel **y** app en paralelo? El doble trabajo es lo que mata la
adopción — conviene ponerle fecha de fin desde el principio.

---

## K. Papel y firmas

**K1.** 🔴 ¿El cumplido **en papel** sigue haciendo falta — el cliente o la DIAN exigen el original
firmado, o basta con la foto? ¿Se imprime algo más hoy (manifiesto, planilla)?

---

## Si sólo hay tiempo para seis

1. **H2** — ¿y si un conductor se niega a usarla?
2. **G1** — ¿quién paga los datos del celular?
3. **I2** — ¿ya existe la lista de puntos con direcciones?
4. **J1** — ¿arrancamos con una ruta o con todas?
5. **K1** — ¿el papel sigue haciendo falta?
6. **A1** — ¿el Excel trae el peso, y por punto o por despacho?

## Y algo que vale más que cualquier respuesta

Pedirle que **muestre**, no que cuente:

- Un Excel real de un cliente, tal como llegó el viernes pasado.
- Una malla real ya armada.
- Una foto de la pantalla de Sistran cuando factura.
- El grupo de WhatsApp de un martes cualquiera.
- Un cumplido en papel, ya firmado.

La gente describe el proceso como *debería* ser; los archivos muestran cómo *es*. Cinco capturas de
pantalla responden más preguntas que una hora de conversación.
