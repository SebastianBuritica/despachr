# Preguntas para la operación (cliente piloto)

**Para qué es esto:** hay trabajo que no se puede construir bien sin saber cómo funciona la
operación de verdad. No son preguntas técnicas — son sobre el día a día. Se pueden responder
hablando; no hace falta escribir nada formal.

**Cómo usarlo:** si sólo hay tiempo para cinco, son las marcadas 🔴. Cada bloque dice al final qué
desbloquea, por si ayuda a priorizar.

---

## A. Peso y volumen de la carga

> Sin esto no se puede construir el **planificador de malla**: el sistema no sabría cuándo un camión
> ya va lleno.

**A1.** 🔴 Cuando un cliente manda el Excel del viernes, ¿viene el **peso** de lo que hay que mover?
¿En qué viene — kilos, número de cajas, toneladas, estibas?

**A2.** Ese dato, ¿es por **cada punto de entrega** o por todo el despacho del cliente junto?

**A3.** 🔴 Al armar un camión, ¿qué se llena primero: **el peso o el espacio**? (Hay carga liviana
que ocupa mucho y carga pesada que ocupa poco — importa saber cuál manda.)

**A4.** ¿Cuánto carga un camión típico? ¿Todos cargan lo mismo o depende del vehículo?

**A5.** Hoy, ¿cómo se sabe que un camión ya no da para más? ¿Se calcula con algún número o es
experiencia?

---

## B. Qué significa "a tiempo"

> Es **el indicador que más importa** según lo que hemos hablado, pero ahora mismo el sistema no
> puede calcularlo: no hay contra qué comparar la hora de llegada.

**B1.** 🔴 ¿Qué hace que una entrega sea "a tiempo"? ¿Hay una **hora comprometida** con el cliente,
o una ventana (por ejemplo "entre 7 y 11 de la mañana")?

**B2.** Esa hora, ¿la pone el cliente o la ponemos nosotros al armar la ruta?

**B3.** ¿Es igual para todos los clientes, o cada uno tiene lo suyo? (¿Makro exige distinto que una
tienda de barrio?)

**B4.** Cuando un cliente reclama que llegamos tarde, **¿contra qué está comparando?**

---

## C. Cómo se arma la malla

> Para diseñar la pantalla del planificador hay que entender la decisión real, no una versión
> idealizada.

**C1.** ¿Cómo se decide **qué conductor va a qué ruta**? ¿Por zona, por vehículo, por quién esté
libre, por confianza?

**C2.** En una semana normal, ¿cuántas rutas salen y cuántos puntos tiene cada una?

**C3.** ¿Qué es **lo que más tiempo quita** al armar la malla? (Esa es la parte que más vale la pena
automatizar.)

**C4.** ¿Qué pasa cuando un cliente manda el Excel tarde — sábado o domingo? ¿Se rehace la malla?

---

## D. Novedades (rechazos, faltantes, daños)

> Ya sabemos que una novedad **cierra la entrega**. Falta saber qué pasa después, en la operación.

**D1.** 🔴 Con un rechazo, ¿qué pasa con la mercancía? ¿Vuelve a bodega, se deja donde el cliente,
se reintenta otro día?

**D2.** Si se reintenta, ¿eso es **una entrega nueva** en la malla de la otra semana, o se considera
la misma que quedó pendiente?

**D3.** ¿Quién resuelve la novedad — la coordinadora, el cliente, el conductor?

**D4.** ¿Se le cobra igual al cliente cuando hubo rechazo, o se cobra distinto?

---

## E. Alertas (camión demorado en un punto)

> Hoy el sistema avisa cuando un conductor lleva **más de 60 minutos** en un punto. Ese número lo
> pusimos nosotros; hay que validarlo.

**E1.** 🔴 ¿60 minutos es razonable? ¿Cuánto se demora normalmente un descargue en un Makro
comparado con una tienda pequeña?

**E2.** Cuando se sabe que un camión lleva mucho parado, ¿qué se hace? ¿Se llama al conductor?

**E3.** ¿Es suficiente ver la alerta **en la pantalla del panel** mientras se está trabajando, o hace
falta que llegue algo **al celular** aunque se esté en otra cosa? (Esto define si vale la pena
montar avisos por SMS o WhatsApp; hoy la alerta se ve en el panel.)

---

## F. La plata: flete y facturación

> Esto define el panel de administración (lo que ve el dueño). Va después de v1, pero entre antes se
> sepa, mejor.

**F1.** ¿Cómo se le cobra al cliente — por entrega, por ruta, por kilo, por camión completo? ¿Cambia
según sea paqueteo, consolidado o exclusivo?

**F2.** El flete que se le paga al conductor, ¿cómo se pacta? ¿Fijo por ruta, por kilómetro, por
viaje?

**F3.** ¿A los cuántos días pagan los clientes **en la práctica**? (No lo que dice el contrato — lo
que pasa de verdad.)

**F4.** De todo el proceso de facturar en Sistran y pasar el XML a Cigo, ¿**cuál es el paso más
tedioso**? Ahí es donde el sistema puede ayudar más.

---

## Las 5 más importantes, si el tiempo es corto

1. **A1** — ¿el Excel trae el peso, y en qué unidad?
2. **A3** — ¿se llena antes el peso o el espacio del camión?
3. **B1** — ¿qué hace que una entrega sea "a tiempo"?
4. **D1** — con un rechazo, ¿qué pasa con la mercancía?
5. **E1** — ¿60 minutos parados en un punto es el número correcto?
