# concave-web deployment

`concave-web` is meant to be run next to `concave serve`. It is a local browser
shell, not a public Internet application by itself.

## Requirements

- a reachable `concave serve` instance
- a built frontend bundle
- a local config file at `~/.config/concave-web/config.toml`

## Local config

Default path:

- `~/.config/concave-web/config.toml`

Default values:

```toml
api_base_url = "http://127.0.0.1:7777"
bind_addr = "127.0.0.1"
port = 8080
```

The file is created automatically on first run if it does not exist.

## Development flow

```bash
cd frontend
npm ci
npm run build
cd ..
go test ./...
go build ./...
go run . serve
```

The browser UI will then be available on the configured web port, with API traffic
proxied to the configured `api_base_url`.

## Operational notes

- If `concave serve` is unavailable, browser login and protected views will fail.
- If the frontend bundle has not been built, the Go server will not have assets to
  embed.
- The Go wrapper should stay thin. Business rules belong in `concave`, not here.
- `concave-web` should not bypass same-origin auth by talking to the backend
  directly from the browser with ad hoc cross-origin logic.

## Proxy behavior

The proxy is responsible for:

- forwarding API requests unchanged where possible
- preserving cookies
- preserving streaming behavior
- preserving WebSocket upgrades for terminal endpoints

Changes to the proxy should be treated as security-sensitive.
