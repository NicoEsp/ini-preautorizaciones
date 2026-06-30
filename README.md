# INI · Preautorizaciones — Mockup demo (INI × Hertz)

Prototipo funcional del dashboard de preautorizaciones de **INI**, pensado para la
reunión comercial con **Hertz** (AR / CL). Es 100% client-side (sin backend) y está
diseñado para ser un **template reutilizable**: cambiando un archivo de branding y los
datos seed, el mismo mockup sirve para otra rentadora o una empresa de turismo.

La narrativa que cuenta en 3 minutos: con INI, Hertz tiene **un proveedor único** que
resuelve la preautorización **como flujo, no como transacción suelta** — y el dolor de
los 30-40 días para liberar el límite desaparece.

---

## Cómo correrlo

```bash
npm install
npm run dev
```

Abrí **dos pestañas** del navegador (clave para la demo en vivo): una vista de captura
(Checkout o Terminal) y el Dashboard.

| Vista | URL | Canal / Branding |
| --- | --- | --- |
| **Pre-reserva** | http://localhost:5173/#/pos | Web (hertz.com.ar) · Hertz amarillo · **no toma el hold** |
| **Terminal** | http://localhost:5173/#/terminal | Sucursal física (estilo Clover) · Hertz · **acá se toma la preautorización** |
| **Dashboard** | http://localhost:5173/#/dashboard | Back office · INI violeta, Hertz co-brand |

El pill arriba a la derecha (Pre-reserva / Terminal / Dashboard) permite saltar entre vistas
sin tipear la URL.

> **Captura presencial (seguridad):** el canal web sólo deja la pre-reserva; la
> preautorización —el bloqueo real— se toma en el POS/Terminal con verificación de
> identidad. No se captura un hold online.

> Build de producción: `npm run build` y luego `npm run preview`.

---

## La coreografía de la demo (≈3 min)

1. **Dashboard → Activas.** "Acá Hertz ve sus preautorizaciones del día. AR y CL en el mismo lugar."
2. **Terminal (sucursal).** "Nueva operación": monto en el keypad, vehículo, cliente, tarjeta
   (se tokeniza), aprobar. El dispositivo muestra "Preautorización aprobada".
3. **Volvé al Dashboard.** La preauth nueva aparece **con pulse amarillo, en tiempo real**
   (y el cliente nuevo queda guardado).
4. **Click en la fila → drawer.** "Confirmar el pago": el monto es **editable** — subilo
   ($580.000 por daños) o bajalo; el input cambia de color. La fila pasa a **Historial**
   mostrando bloqueado vs cobrado.
5. **Anular** otra preauth: secuencia *anulando → procesando reversa → ✓ Reversa enviada*,
   con ID de reversa y fecha de crédito al cliente.
6. **Historial → `+ Cobro adicional`**: multa con **tarjeta tokenizada** (latencia → ✓) o link.
7. **Acreditaciones.** Próxima acreditación, pendientes/acreditadas y reversas procesadas.
8. **Toggle a CL**: divisas en CLP, sucursales chilenas, KPIs recalculados.
9. Cierre: *"Un proveedor, dos países, todas las capas."*

> 💡 Botón **↻** (arriba a la derecha del Dashboard) reinicia la demo con datos frescos.
> Útil para dejar antigüedades ("hace 2h") recién horneadas justo antes de presentar.

---

## Qué hay que mirar (lo que no puede fallar)

- **Sync entre tabs en vivo** vía `BroadcastChannel` (fallback a `storage` event si no
  está disponible). Tomar la preauth en el **Terminal** dispara la aparición + pulse en el
  Dashboard. (La Pre-reserva web no genera hold, por diseño.)
- **2 acciones sobre cada preauth activa**: **Confirmar el pago** (monto editable: >, =, o <
  al bloqueado, con feedback de color) y **Anular** (dispara reversa a la tarjeta).
- **Terminal estilo Clover**: flujo de 4 pasos (monto → vehículo → cliente → tarjeta) +
  procesando + aprobado. Tokeniza la tarjeta (solo `last4` + marca, nunca el PAN completo).
- **Cobro adicional** posterior: link de cobro (`https://pagos.ini.live/p/…`, texto, no
  resuelve) o tarjeta tokenizada (si el cliente la tiene en archivo).
- **Acreditaciones**: settlement por cobro confirmado (a 10 días, menos comisión); reversas
  trackeadas aparte (no generan settlement).
- **Multi-país AR/CL**: filtra preauths, cambia divisa (ARS/CLP) y formato de números.
- **Persistencia**: `localStorage` — un refresh no borra el estado.
- **Sin requests externos**: fuentes self-hosted; consola limpia.

---

## Arquitectura

```
src/
  config/
    brand.ts     # 🎨 branding + país (divisa/locale) + sucursales — PARAMETRIZABLE
    seed.ts      # 📦 datos iniciales (~12 preauths, clientes, vehículos)
  state/
    types.ts     # shapes de Preauth (con reversal), Customer, Vehicle, AdditionalCharge
    actions.ts   # funciones PURAS: generate / confirm / void(+reversal) / charges / customers
    store.ts     # Zustand + persist (localStorage) + BroadcastChannel (sync tabs)
  utils/
    format.ts    # moneda, antigüedad, fechas (días hábiles), vencimiento
    settlement.ts# deriva acreditaciones (settlement) de los cobros confirmados
    hooks.ts     # useNow (reloj 30s), router por hash
  components/    # BrandHeader, ActionDrawer, Acreditaciones, PreauthCard, MoneyInput…
  views/
    POS.tsx              # Pre-reserva web (canal online, sin hold)
    Terminal.tsx         # Terminal de sucursal estilo Clover — toma la preauth (state machine)
    Dashboard.tsx        # Activas / Historial / Cobros / Acreditaciones
    AdditionalCharge.tsx # modal de cobro adicional
  App.tsx        # ruteo por hash (#/pos, #/terminal, #/dashboard)
```

**Principio de diseño del estado:** las acciones en `actions.ts` son funciones puras
(`(state, params) => state`). Los IDs, timestamps, URLs y la latencia simulada se generan
en el `store`, no en las acciones — así las acciones son testeables y deterministas.

**Stack:** React + Vite + TypeScript + Tailwind CSS + Zustand. Sin backend, sin librerías
de tablas pesadas. Tipografías (Inter + Bricolage Grotesque) self-hosted en `/public/fonts`.

---

## Reutilizarlo como template

Para venderlo a otra rentadora (Avis, Movida, Localiza) o a una empresa de turismo,
alcanza con tocar **dos archivos**:

1. **`src/config/brand.ts`** — nombre y logo del cliente, colores, etiquetas de dominio
   (`vehicleLabel: 'Vehículo'` → `'Habitación'` para un hotel), países y divisas.
2. **`src/config/seed.ts`** — catálogo de unidades, sucursales y clientes.

Los logos viven en `/public` (`ini-logo.svg`, `hertz-logo.svg`).
