# concave-web docs

This directory contains the repository-level documentation for `concave-web`.

## Reading order

- [architecture.md](architecture.md): service boundaries, request flow, proxy model,
  and frontend structure.
- [deployment.md](deployment.md): config file, build/run flow, upstream API
  expectations, and operational notes.
- [frontend.md](frontend.md): route map, state model, role gating, and terminal UI
  behavior.

## Relationship to other repos

- `concave` provides the authenticated backend API and machine control.
- `concave-web` provides the browser-facing shell and proxy.
- `concave-tui` provides the terminal UI client.
