# Estrategia de ramas

## Modelo
Trabajo basado en `main` estable con ramas cortas por cambio.

| Rama | Uso | Ejemplo |
|---|---|---|
| `main` | Siempre estable; solo recibe Pull Requests aprobados | |
| `feature/*` | Nueva funcionalidad | `feature/frontend-react` |
| `fix/*` | Corrección de errores | `fix/transiciones-estado` |
| `refactor/*` | Mejoras internas y deuda técnica | `refactor/pruebas-transiciones` |

## Reglas
1. Nunca se hace push directo a `main`.
2. Cada rama nace desde `main` actualizado y se borra al hacer merge.
3. Todo cambio entra por Pull Request con revisión de otra cuenta.
4. El PR debe pasar las validaciones de Azure Pipelines y GitHub Actions.
5. El título del commit y del PR incluye el work item con `AB#ID`.

## Convención de commits
`tipo: descripción AB#ID`, con tipos `feat`, `fix`, `refactor`, `docs`, `ci` y `test`.

## Trazabilidad
Work item en Azure Boards → rama → commits con `AB#ID` → Pull Request → pipeline → tag de versión.

## Flujo de un cambio
1. Pasar la Task a Active.
2. Crear la rama desde `main`.
3. Hacer commits con `AB#ID`.
4. Abrir el PR; corre el pipeline.
5. Revisión y aprobación por la segunda cuenta.
6. Merge, borrar la rama y cerrar la Task.
7. Crear el tag de versión cuando se completa un hito.