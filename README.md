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

Abrí **dos pestañas** del navegador (clave para la demo en vivo):

| Pestaña | URL | Branding |
| --- | --- | --- |
| **POS / Sucursal** | http://localhost:5173/#/pos | Hertz primario (amarillo) |
| **Dashboard / Back office** | http://localhost:5173/#/dashboard | INI primario (violeta), Hertz co-brand |

El pill arriba a la derecha (POS / Dashboard) permite saltar entre vistas sin tipear la URL.

> Build de producción: `npm run build` y luego `npm run preview`.

---

## La coreografía de la demo (≈3 min)

1. **Dashboard → Activas.** "Acá Hertz ve sus preautorizaciones del día. AR y CL en el mismo lugar."
2. **Pasá al POS.** Generá una preauth (ej. cliente María José, Corolla, $500.000).
   La card verde confirma el ID.
3. **Volvé al Dashboard.** La preauth nueva aparece **con pulse amarillo, en tiempo real**.
4. **Click en la fila → drawer.** *Modificá* el monto a $450.000 ("devolvió con la cubierta pinchada").
   La fila pasa a **Historial**.
5. **Historial → `+ Cobro adicional`** sobre una fila. Concepto "Multa de tránsito 18/06",
   $25.000, método **tarjeta tokenizada**. Latencia 0.8s → ✓ "Cobro realizado".
6. **Cobros adicionales.** El cobro hecho con token queda registrado.
7. **Toggle a CL** en el header: divisas en CLP, sucursales chilenas, KPIs recalculados.
8. Cierre: *"Un proveedor, dos países, todas las capas."*

> 💡 Botón **↻** (arriba a la derecha del Dashboard) reinicia la demo con datos frescos.
> Útil para dejar antigüedades ("hace 2h") recién horneadas justo antes de presentar.

---

## Qué hay que mirar (lo que no puede fallar)

- **Sync entre tabs en vivo** vía `BroadcastChannel` (fallback a `storage` event si no
  está disponible). Generar en el POS dispara la aparición + pulse en el Dashboard.
- **3 acciones sobre cada preauth activa**: Confirmar (monto original), Modificar (a un
  monto menor → queda *Modificada*), Anular (solo si está activa).
- **Cobro adicional** posterior: link de cobro (`https://pagos.ini.live/p/…`, texto, no
  resuelve) o tarjeta tokenizada (si el cliente la tiene en archivo).
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
    types.ts     # shapes de Preauth, Customer, Vehicle, AdditionalCharge
    actions.ts   # funciones PURAS: generate / confirm / modify / void / charges
    store.ts     # Zustand + persist (localStorage) + BroadcastChannel (sync tabs)
  utils/
    format.ts    # moneda, antigüedad relativa, fechas, vencimiento de devolución
    hooks.ts     # useNow (reloj 30s), router por hash
  components/    # BrandHeader, ActionDrawer, PreauthCard, CountrySwitcher, Segmented…
  views/
    POS.tsx              # Zona 1 — terminal de sucursal
    Dashboard.tsx        # Zona 2+3 — Activas / Historial / Cobros
    AdditionalCharge.tsx # Zona 4 — modal de cobro adicional
  App.tsx        # ruteo por hash (#/pos, #/dashboard)
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
