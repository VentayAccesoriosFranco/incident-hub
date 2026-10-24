# Análisis de dependencias

## Alcance
Revisión de las dependencias del backend (`backend/package.json`) con `npm audit`, `npm outdated` y `npm ls`. El pipeline de Azure y el workflow de GitHub Actions ejecutan `npm audit --audit-level=high` en cada cambio.

## Dependencias directas

| Paquete | Tipo | Uso |
|---|---|---|
| express | producción | Servidor HTTP y API REST |
| pg | producción | Conexión a PostgreSQL |
| cors | producción | Política de acceso entre orígenes |
| dotenv | producción | Variables de entorno desde .env |
| jest | desarrollo | Pruebas unitarias |
| supertest | desarrollo | Pruebas de endpoints HTTP |

## Resultado de `npm audit`

Fecha de análisis: [fecha]
Resumen: [ej. "found 0 vulnerabilities" o "N vulnerabilities (x low, y moderate, z high)"]

| Paquete | Vulnerabilidad | Severidad | Decisión | Estado |
|---|---|---|---|---|
| [paquete] | [descripción o advisory] | [low/moderate/high/critical] | [actualizar / aceptar riesgo / diferir] | [resuelto / abierto] |

Si no hubo hallazgos, esta tabla queda vacía y se documenta aquí: "No se detectaron vulnerabilidades conocidas en la fecha de análisis."

## Paquetes desactualizados (`npm outdated`)

| Paquete | Versión actual | Última versión | Decisión |
|---|---|---|---|
| [paquete] | [actual] | [última] | [actualizar ahora / posponer por cambio mayor] |

## Política de decisión
- Severidad **high** o **critical**: se corrige antes de la siguiente versión.
- Severidad **moderate**: se corrige si no implica cambio mayor de versión; si lo implica, se registra como deuda técnica.
- Severidad **low**: se acepta el riesgo y se revisa en la siguiente iteración.
- Dependencias de desarrollo (jest, supertest) no se despliegan a producción, por lo que su riesgo es menor.

## Evidencia
- Reporte completo: `docs/npm-audit-report.json`
- Ejecución automática: paso "Revisión de dependencias" en Azure Pipelines y en GitHub Actions.

## Mejoras futuras
- Activar Dependabot en GitHub para recibir PRs de actualización.
- Hacer que `npm audit` bloquee el pipeline cuando haya severidad alta, quitando `continueOnError`.