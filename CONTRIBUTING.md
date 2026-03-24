# Contributing to concave-web

Contributions are welcome for browser UX, API-backed flows, proxy behavior, tests, and documentation. Keep the repository focused on the browser shell. Backend machine logic belongs in `concave`.

## Before you start

Read [README.md](README.md), [docs/getting-started.md](docs/getting-started.md), and [docs/api.md](docs/api.md) before changing routes, proxy behavior, or authenticated flows.

## Development setup

Use Ubuntu 24.04 with Go 1.25 or newer, Node.js 20 or newer, and npm.

```bash
git clone <repo-url>
cd concave-web/frontend
npm ci
npm run build
cd ..
go test ./...
CGO_ENABLED=0 go build -o concave-web .
./concave-web --help
```

For end-to-end work, run `concave serve` locally and then start `./concave-web serve`.

## Making changes

### Branching

Use one of these branch prefixes:

- `feat/<slug>`
- `fix/<slug>`
- `docs/<slug>`

### Commit messages

Format commits as `<type>(<scope>): <summary>`.

Use these types:

- `feat`
- `fix`
- `refactor`
- `test`
- `docs`
- `chore`

Keep the summary under 72 characters.

Examples:

- `feat(proxy): preserve websocket headers for terminals`
- `fix(router): redirect unauthenticated users to login`
- `docs(api): describe workspace job endpoints`

### Tests

- Add or update tests for new functions and behavior changes.
- Run `go test ./...` before opening a pull request.
- Rebuild the frontend with `npm run build` when you change `frontend/src/`.
- Verify the browser shell manually when you touch routing, login, WebSockets, or streaming views.

### Pull requests

- Keep pull requests to one logical change.
- Describe visible UI changes, API assumptions, and any proxy-side risk.
- Include screenshots for user-facing changes.

## Code conventions

- Keep business logic in `concave`. `concave-web` is a browser client plus proxy.
- Use Vue 3, TypeScript, and Vite for frontend changes.
- Keep `/api/v1/*` traffic same-origin through the Go proxy.
- Do not hardcode backend hosts inside view code. Use relative API paths through the proxy.
- Keep auth state in Pinia and the session cookie returned by `concave serve`.
- Theme mode and sidebar collapse are the only browser-local preferences and are stored in `localStorage`.
- Treat WebSocket and SSE proxy behavior as security-sensitive.

## What we don't accept

- Dependencies added without prior discussion in an issue.
- UI component libraries added without prior discussion.
- Business logic duplicated from `concave`.
- Shell string interpolation with user-controlled input.

## License

By contributing, you agree that your contributions will be released under the repository license when one is published.
