# Arquitectura

## Visión general
IT Incident Hub es una aplicación web de tres capas para registrar y dar seguimiento a incidentes de TI.

    Navegador (React + Vite, :5173)
            |  HTTP / JSON
            v
    API REST (Node.js + Express, :3000)
            |  SQL (pg)
            v
    PostgreSQL 16 (Docker, :5433)

## Componentes

| Capa | Tecnología | Ubicación | Responsabilidad |
|---|---|---|---|
| Frontend | React 18 + Vite | `frontend/` | Listado con filtros, alta, detalle, comentarios y dashboard |
| Backend | Node.js 20 + Express | `backend/src/` | API REST y reglas de negocio |
| Base de datos | PostgreSQL 16 | `database/schema.sql` | Usuarios, incidentes y comentarios |
| Infraestructura local | Docker Compose | `devops/` | Levanta PostgreSQL para desarrollo |
| CI/CD | Azure Pipelines y GitHub Actions | `azure-pipelines.yml`, `.github/workflows/` | Build, pruebas, auditoría y publicación |

## Estructura del backend
- `src/app.js`: configura Express, rutas y manejo de errores.
- `src/server.js`: arranca el servidor.
- `src/db.js`: pool de conexiones a PostgreSQL.
- `src/domain/incidentRules.js`: estados y transiciones válidas.
- `src/routes/`: `incidents.js`, `comments.js` y `dashboard.js`.

## Modelo de datos
- **users**: id, name, email, role (`USUARIO`, `TECNICO`, `ADMIN`).
- **incidents**: id, title, description, category, priority (`BAJA`, `MEDIA`, `ALTA`, `CRITICA`), status, created_by, assigned_to, created_at, updated_at.
- **comments**: id, incident_id, author_id, body, created_at (bitácora del incidente).

## Flujo de estados

    NUEVO -> ASIGNADO -> EN_PROCESO -> RESUELTO -> CERRADO
                              ^             |
                              +-------------+  (reapertura)

Asignar un técnico a un incidente NUEVO lo pasa a ASIGNADO. Las demás transiciones se piden con `PATCH /:id/status` y el servidor rechaza con 409 las no permitidas.

## API REST

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Estado del servicio |
| POST | `/api/incidents` | Crear incidente |
| GET | `/api/incidents` | Listar con filtros `status`, `priority`, `category`, `assigned_to` |
| GET | `/api/incidents/:id` | Consultar un incidente |
| PATCH | `/api/incidents/:id/assign` | Asignar técnico |
| PATCH | `/api/incidents/:id/status` | Cambiar estado |
| POST | `/api/incidents/:id/comments` | Agregar comentario |
| GET | `/api/incidents/:id/comments` | Consultar la bitácora |
| GET | `/api/dashboard` | Indicadores: total, abiertos, cerrados, críticos y agrupaciones |

## Decisiones técnicas
- Las reglas de transición viven en un módulo de dominio separado para probarlas sin base de datos.
- Las pruebas del backend simulan la base de datos (Jest + Supertest), por lo que el pipeline no necesita PostgreSQL.
- La base de datos usa el puerto 5433 en desarrollo para no chocar con instalaciones locales de PostgreSQL.