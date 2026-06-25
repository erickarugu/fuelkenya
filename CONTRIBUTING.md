# Contributing to FuelKenya

Thank you for your interest in contributing. This is a small, focused project — contributions that improve data accuracy, API usability, or the dashboard experience are most welcome.

## Ways to contribute

- **Bug reports** — if something is broken, open an issue with steps to reproduce
- **Data issues** — if prices look wrong, include the source EPRA document
- **New features** — open an issue first to discuss before writing code
- **Docs improvements** — typos, unclear explanations, missing examples

## Development setup

See [README.md](./README.md) for the full quick-start guide. The short version:

```bash
git clone https://github.com/erickarugu/fuelkenya.git
cd fuelkenya

# API
cd api && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt && cp .env.example .env
# edit .env, then:
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# Web (new terminal)
cd web && pnpm install && pnpm dev
```

## Submitting a pull request

1. Fork the repo and create a branch from `main`
2. Make your changes — keep PRs focused; one concern per PR
3. Make sure the API still starts and the web builds (`pnpm build`) before opening a PR
4. Open the PR with a clear description of what changed and why

There are no automated tests yet — manual verification is enough for now.

## Code style

**Python (api/)**: [Ruff](https://docs.astral.sh/ruff/) for linting, [Black](https://black.readthedocs.io) for formatting. Run before committing:

```bash
cd api
ruff check .
black .
```

**TypeScript (web/, docs/)**: standard Next.js ESLint config. Run:

```bash
pnpm lint
```

## Reporting a security vulnerability

Please do not open a public issue for security vulnerabilities. Email **erickariuki32@gmail.com** with details and allow reasonable time to respond before any public disclosure.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
