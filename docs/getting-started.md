# Getting Started

`concave-web` is a local browser shell for `concave serve`.

## Start the control plane

Bring up the backend first:

```bash
concave serve --addr 127.0.0.1:7777
```

Then start the web shell:

```bash
concave-web serve
```

Open:

```text
http://127.0.0.1:8080
```

## Sign in

The login page asks for:

- Username
- Password

The browser shell sends those credentials to `POST /api/v1/auth/login` on the proxied local API. The authenticated session is stored as an HTTP cookie from `concave serve`.

## Navigation and roles

Visible navigation depends on the role returned by the backend.

| Route | Purpose | Minimum role |
|---|---|---|
| `/dashboard` | Live CPU, GPU, memory, workspace, and suite summary | Viewer |
| `/environment` | Resolver drift and snapshot state | Viewer |
| `/fleet` | Local node and visible peers | Viewer |
| `/suites` | Suite lifecycle, container list, ports, and terminals | Viewer |
| `/logs` | Live container logs and container terminal | Viewer |
| `/workspace` | Workspace usage and backup/clean jobs | Viewer |
| `/doctor` | Host health checks | Viewer |
| `/lab` | Gradient Lab status page | Viewer |
| `/teams` | Team and quota status | Admin |
| `/users` | Per-user activity | Admin |
| `/system` | Host terminal and machine controls | Admin |
| `/settings` | Proxy config plus UI preferences | Viewer |

## Open JupyterLab from the browser

The `Lab` action in the Suites view is available to Developer and above.

1. Open `Suites`.
2. Select `boosting` or `neural`.
3. Click `Lab`.

The browser shell requests `GET /api/v1/suites/{suite}/lab` and opens the returned tokenized URL in a new tab.

## Local settings

`concave-web` stores proxy settings in:

```text
~/.config/concave-web/config.toml
```

The Settings page reads and writes:

- `api_base_url`
- `bind_addr`
- `port`

Theme mode and sidebar collapse are browser-local preferences stored in `localStorage`.

## If the connection fails

Use these checks:

1. Confirm the backend is up:

```bash
curl -sS http://127.0.0.1:7777/api/v1/health
```

2. Confirm the web shell is up:

```bash
curl -sS http://127.0.0.1:8080/
```

3. If the browser shows `frontend not built`, rebuild the frontend:

```bash
cd frontend
npm ci
npm run build
cd ..
```

4. If login succeeds but protected views fail, inspect the local proxy config in `~/.config/concave-web/config.toml`.
