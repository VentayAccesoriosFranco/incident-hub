# Evidencia de pipeline fallido y corrección

## Resumen
Se provocó un fallo controlado en el pipeline de Azure para demostrar el ciclo de diagnóstico y corrección.

| Dato | Valor |
|---|---|
| Work item | AB#40 (Bug) |
| Rama | fix/transiciones-estado |
| Ejecución fallida | Build #__ (completar con el número del run) |
| Ejecución exitosa | Build #__ (completar con el número del run) |

## Qué falló
El paso "Pruebas automatizadas" terminó en rojo. La prueba `permite reabrir un incidente resuelto` (backend/tests/incidentRules.test.js) esperaba `true` y recibió `false`.

## Diagnóstico
Un commit simplificó las transiciones y eliminó `EN_PROCESO` como destino válido de `RESUELTO`. Eso rompe la regla de negocio que permite reabrir un incidente resuelto.

## Corrección
Se restauró `EN_PROCESO` en las transiciones de `RESUELTO` dentro de `backend/src/domain/incidentRules.js`.

## Verificación
- `npm test` local: todas las pruebas pasan.
- Pipeline posterior a la corrección: ejecución exitosa y artefacto `drop` publicado.

## Lección
Las pruebas automáticas detectaron la regresión antes del merge a `main`, gracias a la validación del pipeline en el Pull Request.