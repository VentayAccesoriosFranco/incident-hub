# Estrategia de release

## Versionado semántico
Formato `MAJOR.MINOR.PATCH`:
- **MAJOR**: cambios incompatibles.
- **MINOR**: funcionalidad nueva compatible.
- **PATCH**: correcciones y mejoras internas.
Hasta `v1.0.0` las versiones `0.x` indican desarrollo previo a la primera versión estable.

## Historial de versiones

| Versión | Contenido |
|---|---|
| v0.1.0 – v0.5.0 | Backend: base, incidentes, flujo de estados, bitácora de comentarios y dashboard |
| v0.6.0 | Pipeline de Azure con agente self-hosted |
| v0.7.0 | Corrección de regresión y evidencia de pipeline fallido |
| v0.8.0 | GitHub Actions y secretos protegidos |
| v0.9.0 | Análisis de dependencias |
| v0.9.1 | Deuda técnica: pruebas de transiciones y cobertura |
| v0.10.0 | Frontend React |
| v0.11.0 | Ambientes dev, qa y prod con aprobación |
| v1.0.0 | Primera versión estable con documentación completa |

## Ambientes

| Ambiente | Despliegue | Aprobación |
|---|---|---|
| dev | Automático al integrar en `main` | No |
| qa | Tras dev exitoso | Manual |
| prod | Tras qa aprobado | Manual |

## Flujo de release
1. Los cambios se integran en `main` mediante Pull Request.
2. El pipeline compila, prueba, audita y publica el artefacto `drop`.
3. El mismo artefacto avanza por dev, qa y prod; no se recompila entre ambientes.
4. Cada aprobación queda registrada en Azure Pipelines.
5. Se crea el tag `vX.Y.Z` y la GitHub Release con notas.

## Rollback
Se vuelve a ejecutar el despliegue del artefacto de la versión estable anterior (identificada por su tag) a través de los mismos ambientes y aprobaciones.

## Criterios para liberar
- Pipeline en verde y pruebas pasando.
- Sin vulnerabilidades altas o críticas abiertas.
- Documentación actualizada.
- Aprobación en qa y prod.