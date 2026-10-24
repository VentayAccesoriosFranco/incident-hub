# Seguridad

## Gestión de secretos
- Ninguna credencial real está en el repositorio. `.env` está en `.gitignore`; solo se versiona `.env.example` con valores de desarrollo.
- Las credenciales de la base de datos de desarrollo (`incident` / `incident_dev`) son de uso local y no se usan en ningún ambiente compartido.
- **GitHub Actions:** el secreto `DB_PASSWORD` está en Settings → Secrets and variables → Actions.
- **Azure Pipelines:** el grupo de variables `incident-hub-secrets` contiene `DB_PASSWORD` marcada como secreta.
- El token de acceso (PAT) del agente self-hosted no se guarda en el repositorio.

## Controles en el pipeline
- `npm audit --audit-level=high` en Azure Pipelines y en GitHub Actions.
- Pruebas automáticas obligatorias antes de empaquetar el artefacto.
- Los despliegues a `qa` y `prod` requieren aprobación manual.

## Controles de proceso
- Revisión de código por una segunda cuenta en cada Pull Request.
- `main` protegido: los cambios solo entran por PR aprobado.

## Seguridad de la aplicación
- Consultas SQL parametrizadas (previenen inyección SQL).
- Validación de entrada en todas las rutas, con errores 400.
- Longitudes máximas en título, categoría y comentarios.
- Mensajes de error genéricos en errores internos (el detalle solo va al log del servidor).

## Hallazgos y resolución
- Se detectó una vulnerabilidad de severidad alta en `body-parser` (GHSA-27r3-jxmh-p828), resuelta con `npm audit fix`. Ver `docs/dependencias.md`.

## Riesgos conocidos
- La API no tiene autenticación real (DT-05 en `docs/deuda-tecnica.md`).
- Los despliegues a los ambientes son simulados.