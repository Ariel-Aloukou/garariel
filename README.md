# Garariel

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.2.3.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Authentication & Authorization (prototype)

The current authentication and role-based authorization features are a **frontend prototype**. There is no backend and no external database: all data lives in the browser's `localStorage`.

### Demo accounts

| Identifier | Password | Role |
| --- | --- | --- |
| `admin@example.com` | `admin1234` | Administrateur |
| `staff@example.com` | `staff1234` | Employé |

Self-registration only ever creates accounts with the **Employé** role. The **Administrateur** role is reserved for the seeded demo accounts above.

### Security limitations — read this carefully

These limitations are inherent to a client-only prototype and are **not** a production-ready security model:

- **`localStorage` is not secure.** Session tokens and stored data are readable by any script running on the page (e.g. via XSS) and persist across browser restarts. Never store sensitive data there in a real application.
- **No backend means no real enforcement.** Every check (login, permissions, route guards) runs in the browser and can be bypassed by editing application state, `localStorage`, or the JavaScript itself. Route guards protect navigation, not data.
- **Passwords are never stored in clear text.** They are hashed client-side with a non-reversible derivation (Web Crypto, PBKDF2-SHA256, per-user random salt). However, because the derivation also happens in the browser, this only limits accidental exposure — it does **not** stop a determined attacker with access to the page.
- **Seed demo accounts ship with fixed passwords.** They exist only to demonstrate the two roles and must be removed or replaced before any real deployment.

### What this means for the future

A real deployment requires: a server-side backend, password hashing and verification performed server-side (e.g. bcrypt/argon2), a proper session or token mechanism, HTTPS, and server-enforced authorization. This prototype is intended to specify and validate the UX and front-end architecture, not to be production security.

## Client management (prototype)

Clients are the first business domain of the garage. Like authentication, client management is a **frontend-only prototype**: records are stored in the browser's `localStorage` under the key `garariel.clients`, with a deterministic demo seed used for development and tests. No personal or real data should be stored.

### Routes

| Route | Purpose | Required permission |
| --- | --- | --- |
| `/clients` | List and search clients | `clients:read` |
| `/clients/:id` | View a client | `clients:read` |
| `/clients/nouveau` | Create a client | `clients:write` |
| `/clients/:id/modifier` | Edit a client | `clients:write` |

All routes are mounted lazily under the authenticated shell and are additionally protected by `roleGuard` (`data.permission`).

### Permissions

- **Administrateur**: `clients:read` and `clients:write` (can view, create, edit and delete).
- **Employé**: `clients:read` only. Creation, editing and deletion entry points are hidden, and the write routes redirect to `/acces-refuse`.

### Behaviour notes

- A client has a **nom complet**, **téléphone**, **email** (all required) and an **adresse** (optional).
- The list is searchable on name, phone and email (case- and accent-insensitive) and exposes explicit empty ("aucun client") and no-result states.
- Deleting a client always requires an explicit confirmation step.
- Client data persists across reloads via `localStorage`; unreadable or incomplete stored data is discarded so the app always starts from a usable state.

### Prototype limitations

The [security limitations](#security-limitations--read-this-carefully) described for authentication apply unchanged: permissions are enforced **in the browser only** and can be bypassed. The `clients:read` / `clients:write` guards shape navigation and UI, they are not a security boundary for the data.

## Vehicle management (prototype)

Vehicles are the second business domain of the garage. Like the other domains, vehicle management is a **frontend-only prototype**: records are stored in the browser's `localStorage` under the key `garariel.vehicles`, with a deterministic demo seed (referencing the seeded clients `client-1`…`client-3`) used for development and tests.

### Routes

| Route | Purpose | Required permission |
| --- | --- | --- |
| `/vehicules` | List and search vehicles | `workshop:read` |
| `/vehicules/:id` | View a vehicle | `workshop:read` |
| `/vehicules/nouveau` | Create a vehicle | `workshop:manage` |
| `/vehicules/:id/modifier` | Edit a vehicle | `workshop:manage` |

The routes are lazy-mounted under the shell like `clients`, each guarded by `roleGuard` with its `data.permission`. The shell exposes a « Véhicules » navigation entry when the current role holds `workshop:read`.

### Permissions

- Read access requires `workshop:read`; create, update and delete require `workshop:manage`.
- Both seeded roles currently hold **both** permissions, so a write denial is enforced by the guard but cannot be demonstrated with a seeded account. The generic guard behaviour ("a role lacking the permission is redirected to `/acces-refuse`") is covered by `core/guards/auth.guard.spec.ts`.

### Behaviour

- A vehicle has an immatriculation (`plate`), marque (`make`), modèle (`model`) and client propriétaire (`clientId`) — all required — plus an **optional** année (`year`, 4 digits between 1886 and the current year + 1).
- Every vehicle is attached to an **existing** client chosen from the client list; a submission with a missing or unknown client is refused with an explicit field error. Whenever no client exists, creation is blocked and a link to `/clients/nouveau` is offered.
- Search matches immatriculation, marque or modèle (accent-insensitive; plate comparison ignores spaces and hyphens). Searching by owner name is deliberately out of scope.
- The list shows a scrollable table on wide screens and stacked cards on narrow ones, with explicit empty and no-result states.
- Deleting a vehicle always requires an explicit confirmation dialog.
- The owner client is resolved live via `ClientService`; a vehicle whose client no longer exists (for example after that client was deleted) is displayed with « Client introuvable » instead of crashing. Deleting a client does **not** cascade to its vehicles.

### Verification note

No desktop browser or viewport is available in this environment, so the "responsive" verification is **structural** (scrollable table `overflow-x-auto`, `md:block`/`md:hidden` card fallback, Tailwind classes) rather than pixel-level, as for `client-management`.

### Limits

The [security limitations](#security-limitations--read-this-carefully) described for authentication apply unchanged: `workshop:read` / `workshop:manage` are enforced **in the browser only**. There is no immatriculation uniqueness rule in this prototype.

## Intervention management (prototype)

Interventions are the third business domain of the garage (workshop orders). Like the other domains, intervention management is a **frontend-only prototype**: records are stored in the browser's `localStorage` under the key `garariel.interventions`, with a deterministic demo seed (referencing the seeded vehicles `vehicle-1`…`vehicle-3` and covering the three statuses) used for development and tests.

### Routes

| Route | Purpose | Required permission |
| --- | --- | --- |
| `/interventions` | List, search and filter interventions | `workshop:read` |
| `/interventions/:id` | View an intervention | `workshop:read` |
| `/interventions/nouveau` | Create an intervention | `workshop:manage` |
| `/interventions/:id/modifier` | Edit an intervention | `workshop:manage` |

The routes are lazy-mounted under the shell like `clients` and `vehicules`, each guarded by `roleGuard` with its `data.permission`. The shell exposes a « Interventions » navigation entry when the current role holds `workshop:read` (the original « Atelier » placeholder is left untouched).

### Permissions

- Read access requires `workshop:read`; create, update and delete require `workshop:manage`.
- As for vehicles, both seeded roles currently hold **both** permissions, so a write denial is enforced by the guard but cannot be demonstrated with a seeded account.

### Statuses

Each intervention has a status, always displayed with its **text label** (never colour alone):

| Value | Label | Badge colour |
| --- | --- | --- |
| `pending` | En attente | amber (amber-100 / amber-800) |
| `in_progress` | En cours | blue (blue-100 / blue-800) |
| `done` | Terminée | green (green-100 / green-800) |

The initial status of a newly created intervention is « En attente ».

### Behaviour

- An intervention has a **date** (ISO `YYYY-MM-DD`), a **description du problème** and a **véhicule** — all required — plus an **optional** diagnostic (`diagnosis`), travaux effectués (`workDone`) and coût (`cost`, euros with at most two decimals, `.` or `,` accepted). The status (`En attente`, `En cours`, `Terminée`) defaults to « En attente ».
- Every intervention is attached to an **existing** vehicle chosen from the vehicle list; a submission with a missing or unknown vehicle is refused with an explicit field error. Whenever no vehicle exists, creation is blocked and a link to `/vehicules/nouveau` is offered.
- Search matches the attached vehicle's **immatriculation, marque, modèle or owner name** (accent-insensitive; plate comparison ignores spaces and hyphens). Filters add a **status** (`Tous` / `En attente` / `En cours` / `Terminée`) and a **date range** (`Du` / `Au`, both optional). Search and filters combine with AND; a reset button clears them all, and explicit empty and no-result states are shown.
- The list shows a scrollable table on wide screens and stacked cards on narrow ones, with coloured status badges that always carry their text label.
- Deleting an intervention always requires an explicit confirmation dialog.
- The attached vehicle and its owner are resolved live via `VehicleService`/`ClientService`; an intervention whose vehicle or owner no longer exists is displayed with « Véhicule introuvable » / « Propriétaire introuvable » instead of crashing. Deleting a vehicle or a client does **not** cascade to its interventions.

### Verification note

No desktop browser or viewport is available in this environment, so the "responsive" verification is **structural** (scrollable table `overflow-x-auto`, `md:block`/`md:hidden` card fallback, Tailwind classes) rather than pixel-level, as for `client-management` and `vehicle-management`.

### Limits

The [security limitations](#security-limitations--read-this-carefully) described for authentication apply unchanged: `workshop:read` / `workshop:manage` are enforced **in the browser only**. There is no uniqueness or overlap rule for interventions attached to the same vehicle in this prototype.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
