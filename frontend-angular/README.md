
# Frontend Angular (No Functional Changes, Angular-only)

This Angular 18 frontend mirrors your existing routes and behavior. It assumes your backend is at `https://projectangular1.onrender.com` and your frontend is served at `https://projectangular-8bmo.onrender.com`.

## Quick Start

```bash
# Node 20+ recommended
npm i -g @angular/cli@18.2.4
npm install
npm run start   # http://localhost:4200
```

> If you saw `ERESOLVE` about zone.js before: we pin `zone.js` to `~0.14.10` which satisfies Angular 18.2.0.

## Build

```bash
npm run build
# output: dist/frontend-angular
```

## Environment

All backend secrets remain server-side; frontend uses `/src/environments/*` to point to your backend:
- `apiBaseUrl`: `https://projectangular1.onrender.com`
- `frontendUrl`: `https://projectangular-8bmo.onrender.com`
- `googleClientId`: your provided Client ID

## Auth Flow

- **Email/Password** via `/api/auth/login`
- **Google**: button calls `/api/auth/google` on the backend which should handle OAuth and redirect back to `https://projectangular-8bmo.onrender.com`.
- `AuthInterceptor` auto-attaches `Authorization: Bearer <token>` when present.
- `AuthGuard`: redirect unauthenticated users to `/` (index).
- `RoleGuard`: if role is `user` and route requires `admin`, redirect to `/home` (as requested).

## Routes
- `/` Index (public)
- `/home` (auth)
- `/about` (public)
- `/contact` (public)
- `/login` (public)
- `/register` (public)
- `/settings` (auth)
- `/reset` (public: request & apply token reset)
- `/form` (admin only)
- `/check` (auth)
- `/admin` (admin only)

## File Tree (key files)

```
frontend-angular/
  package.json
  angular.json
  tsconfig.json
  tsconfig.app.json
  src/
    index.html
    main.ts
    styles.css
    assets/theme.css
    environments/
      environment.ts
      environment.prod.ts
    app/
      app.component.ts
      app.routes.ts
      core/
        interceptors/api.interceptor.ts
        guards/auth.guard.ts
        guards/role.guard.ts
        services/api.service.ts
        services/auth.service.ts
      pages/
        index/
        home/
        about/
        contact/
        login/
        register/
        settings/
        reset/
        form/
        check/
        admin/
```

## Notes
- Keep using your backend `.env` exactly as you provided; nothing is exposed client-side.
- If your backend sets a token cookie instead of returning a `token` in JSON, adjust `AuthService.loginWithCredentials` accordingly.
- To preserve "no UI changes," the UI is minimal and neutral.
