# IT Incident Hub

Aplicación web para registrar, asignar y dar seguimiento a incidentes de TI, desarrollada como proyecto integrador DevOps (Universidad Mariano Gálvez, Centro Universitario de Retalhuleu).

**Versión actual:** v1.0.0

## Funcionalidades
- Crear y consultar incidentes con título, descripción, categoría y prioridad.
- Asignar un técnico y cambiar el estado: NUEVO → ASIGNADO → EN_PROCESO → RESUELTO → CERRADO.
- Bitácora de comentarios por incidente.
- Filtros por estado, prioridad, categoría y técnico.
- Dashboard con indicadores (total, abiertos, cerrados, críticos y agrupaciones).
- API REST con base de datos PostgreSQL.

## Requisitos
- Node.js 20 o superior
- Docker Desktop (para PostgreSQL)
- Git

## Instalación y ejecución

1. Clonar el repositorio:

   ```bash
   git clone https://github.com/VentayAccesoriosFranco/incident-hub.git
   cd incident-hub
   ```

2. Base de datos:

   ```bash
   cd devops
   docker compose up -d
   ```

3. Backend:

   ```bash
   cd backend
   cp .env.example .env
   npm install
   npm run dev
   ```

   En Windows PowerShell usa `Copy-Item .env.example .env`. La API queda en `http://localhost:3000`.

4. Frontend (en otra terminal):

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   La aplicación queda en `http://localhost:5173`.

## Pruebas

```bash
cd backend
npm test
npm run test:coverage
```

## Estructura del repositorio

| Carpeta | Contenido |
|---|---|
| `backend/` | API REST (Node.js + Express) y pruebas |
| `frontend/` | Interfaz web (React + Vite) |
| `database/` | Esquema SQL |
| `devops/` | Docker Compose para PostgreSQL |
| `docs/` | Documentación del proyecto |
| `.github/workflows/` | Workflow de GitHub Actions |
| `azure-pipelines.yml` | Pipeline de Azure |

## Proceso DevOps
- **Planificación:** Azure Boards (Epics, Features, Stories y Tasks) con trazabilidad mediante `AB#ID`.
- **Control de versiones:** ramas `feature/*`, `fix/*` y `refactor/*`, Pull Requests con revisión y `main` estable.
- **Integración continua:** Azure Pipelines (agente self-hosted) y GitHub Actions.
- **Entrega:** ambientes dev, qa y prod con aprobación manual.
- **Versionado:** SemVer hasta v1.0.0.

## Documentación
- [Arquitectura](docs/arquitectura.md)
- [Estrategia de ramas](docs/branching.md)
- [Deuda técnica](docs/deuda-tecnica.md)
- [Seguridad](docs/seguridad.md)
- [Dependencias](docs/dependencias.md)
- [Estrategia de release](docs/estrategia-release.md)
- [Pipeline fallido y corrección](docs/pipeline-fallido.md)

## Equipo
- Marco Antonio Franco García, desarrollador y propietario del repositorio.
- antoniofranco16251-gif, revisor de código (cuenta de apoyo para las revisiones de PR).