# Contributing

`concave-web` is a frontend-plus-proxy repo. Keep the role model and machine
control logic in `concave`; this repo should consume that API, not duplicate it.

## Local workflow

```bash
cd frontend
npm install
npm run build
cd ..
go test ./...
go build ./...
```

## Rules

- Keep the upstream API same-origin through the Go proxy.
- Treat cookies as the browser session source of truth.
- Do not reimplement role permissions in ad hoc ways; use the role metadata
  already returned by `concave serve`.
- Keep WebSocket and SSE proxy behavior intact when changing proxy code.
- Keep the sidebar/layout restrained and operational, not marketing-heavy.
