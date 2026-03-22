# concave-web

`concave-web` is the browser control plane for `concave`.

It serves an embedded Vue frontend, proxies `/api/v1/*` to `concave serve`,
and keeps its own local config at `~/.config/concave-web/config.toml`.

The frontend is role-aware and consumes the authenticated `concave serve` API for:

- login and session bootstrap
- suite lifecycle and logs
- workspace and doctor views
- Admin-only users and system control pages
- container and host terminals over WebSocket

## Development

```bash
cd frontend
npm install
npm run build
cd ..
go test ./...
go run . serve
```

The default upstream API is `http://127.0.0.1:7777`.
