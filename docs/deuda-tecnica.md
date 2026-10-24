# Registro de deuda técnica

Deuda identificada durante el desarrollo, con su estado y el trabajo rastreado en Azure Boards.

| ID | Deuda | Impacto | Estado | Work item | Resolución |
|---|---|---|---|---|---|
| DT-01 | Pruebas incompletas de transiciones de estado | Las transiciones inválidas no estaban protegidas; una regresión pasaba inadvertida | Resuelta | AB#ID1 | PR `refactor/pruebas-transiciones`: matriz de 25 combinaciones |
| DT-02 | Sin medición de cobertura de código | No se sabía qué parte del backend estaba sin probar | Resuelta | AB#ID2 | PR `refactor/cobertura-codigo`: script `test:coverage` con umbrales |
| DT-03 | Sin validación de variables de entorno al arrancar | Si falta una variable, el error aparece tarde y confuso | Abierta | — | Planificada: módulo `config.js` que valide al inicio |
| DT-04 | Validación de entrada repetida en las rutas | Cambiar una regla obliga a editar varios archivos | Abierta | — | Planificada: extraer funciones de validación compartidas |
| DT-05 | Sin autenticación real; solo se valida el rol del técnico asignado | Cualquiera con acceso a la API puede crear y cambiar incidentes | Abierta | — | Planificada: autenticación con tokens en una versión posterior |

## Política
- Cada deuda se registra con impacto y estado.
- Las deudas resueltas deben tener un work item y un Pull Request rastreables mediante AB#ID.
- Las deudas abiertas se priorizan en la siguiente iteración según su impacto.

## Deuda resuelta en esta versión
- **DT-01:** `backend/tests/incidentRules.matrix.test.js` verifica todas las combinaciones de transición.
- **DT-02:** `npm run test:coverage` genera el informe y falla si la cobertura baja de los umbrales.