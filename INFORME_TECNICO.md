# Informe técnico — FastOrder S.A.

## Objetivo y alcance
Rediseño del cliente Angular como dashboard sencillo para explorar productos, personalizar pedidos con notas y consultar los pedidos de la sesión. La interfaz utiliza una paleta cálida, navegación lateral en escritorio, navegación superior en móvil, tarjetas de productos y un carrito lateral que se transforma en panel móvil.

## Entorno
El proyecto ya contaba con Node.js, NPM, Angular y @angular/service-worker. Se añadió la biblioteca `lucide` para generar iconos SVG locales, sin dependencias de CDN. Se importan solo los iconos usados. No se reinstaló Node.js.

Comandos:
- `npm install`: instalar dependencias del proyecto.
- `npm start`: desarrollo en http://localhost:4200.
- `npm run build`: generar producción en dist/FastOrder.
- `npm test -- --watch=false`: pruebas unitarias.
- `npm run serve:ssr:FastOrder`: ejecutar el servidor compilado.

## Cambios de interfaz
- Dashboard con navegación entre menú y pedidos de la sesión.
- Indicadores reactivos de productos, carrito y envíos pendientes.
- Búsqueda, filtros de categoría y controles de cantidad.
- Carrito con nombre, destino, notas, subtotal, IGV y total.
- Estados vacíos y seguimiento del pedido existente.
- Sustitución de emojis por iconos Lucide en la interfaz y eliminación en notificaciones.
- Adaptaciones en 600, 900, 1150 y 1500 píxeles.
- Foco visible, etiquetas accesibles, zoom permitido y respeto a movimiento reducido.
- Manifiesto y color del navegador alineados con la nueva paleta.

## PWA existente
El registro del Service Worker y el manifiesto ya estaban configurados. El caché de recursos estáticos incluye JavaScript, CSS e iconos. Los grupos de datos para /api/menu, /api/products y /api/orders usan freshness con tiempos de espera y vencimiento. El catálogo actual está incluido en código, por lo que no consulta un menú actualizado al servidor. Las fotografías externas no tienen una estrategia de caché propia.

Los pedidos pendientes se guardan mediante OfflineService y se reintentan al recibir el evento online. El historial mostrado es de la sesión y no persiste completo al recargar. El indicador de conexión refleja navigator.onLine, no la disponibilidad del backend.

## Validación realizada
- Compilación de producción: correcta; paquete inicial aproximadamente 402 kB sin comprimir.
- Dos pruebas unitarias correctas: búsqueda y cálculo del carrito; navegación al historial vacío.
- Revisión visual en navegador integrado de escritorio y viewport móvil de 390 × 844.
- Interacción verificada: agregar producto, total S/ 25.84 para el cuarto de pollo con IGV y apertura del panel móvil.

La revisión de viewport no sustituye pruebas en dispositivos físicos ni confirma compatibilidad entre navegadores. No se validó instalación, push real ni funcionamiento offline de producción en esta revisión de diseño.

## Requisitos pendientes para producción
1. Implementar una API persistente para menú y pedidos; src/server.ts actualmente no implementa estos endpoints.
2. Sustituir la simulación de cocina por actualizaciones reales desde el servidor; el servicio actual avanza estados con temporizadores de demostración.
3. Configurar claves VAPID reales y un backend Web Push. La clave del servicio de notificaciones es de ejemplo; los avisos locales no demuestran entrega push remota.
4. Persistir el historial completo y recuperar pedidos recientes al iniciar; gestionar menú actualizado y caché de imágenes externas.
5. Asegurar idempotencia de pedidos, reintentos y sincronización con el backend.
6. Confirmar tiempos estimados con la cocina; no se muestran estimaciones inventadas.
7. Probar Chrome, Edge, Firefox y Safari, Android e iOS, instalación, caché, pérdida de red y recuperación en producción.
8. Desplegar el build en un servidor con HTTPS y configurar API, persistencia y monitorización. No se realizó despliegue público en esta entrega.
