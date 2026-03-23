# concave-web frontend guide

The frontend is a role-aware operations shell for the `concave serve` API.

## Route map

- `/login`
- `/dashboard`
- `/suites`
- `/logs`
- `/workspace`
- `/doctor`
- `/users`
- `/system`
- `/settings`

Public access is limited to `/login`. All other routes require an authenticated
session.

## State model

Auth bootstrap is handled by the Pinia auth store:

- load current identity from the backend
- determine whether a valid session exists
- compute the correct home route based on role
- drive route guards and sidebar visibility

## Page responsibilities

- Dashboard: high-level system and suite state, CPU and GPU line graphs, memory bars,
  per-core CPU activity, workspace capacity, and suite rollup
- Suites: suite inspection and lifecycle actions
- Logs: per-suite or per-container log exploration
- Workspace: disk and workspace status
- Doctor: host and suite health checks
- Users: admin-only user activity summary
- System: admin-only machine controls and host terminal
- Settings: local browser shell configuration plus appearance controls such as theme
  and sidebar collapse state

## Terminal behavior

The terminal component is reusable and supports:

- connection open/close
- resize handling
- server-driven output
- user keystroke passthrough

Container terminals are available where role policy allows. Host terminal access is
admin-only and intentionally lives in the System view.

## Appearance model

The shell supports:

- dark and light themes
- collapsible sidebar navigation
- icon-led section and settings affordances

These preferences are browser-local UI state, separate from the Go proxy config.

## UI rule of thumb

The UI should stay operational and dense. It is not a marketing surface. Changes
should preserve:

- restrained navigation
- explicit operational status
- role-aware action visibility
- direct parity with the authenticated backend
