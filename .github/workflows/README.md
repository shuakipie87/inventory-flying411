# CI/CD Pipeline

[![CI Pipeline](https://github.com/shuakipie87/inventory-flying/actions/workflows/ci.yml/badge.svg)](https://github.com/shuakipie87/inventory-flying/actions/workflows/ci.yml)
[![CD Pipeline](https://github.com/shuakipie87/inventory-flying/actions/workflows/cd.yml/badge.svg)](https://github.com/shuakipie87/inventory-flying/actions/workflows/cd.yml)
[![Security Scan](https://github.com/shuakipie87/inventory-flying/actions/workflows/security.yml/badge.svg)](https://github.com/shuakipie87/inventory-flying/actions/workflows/security.yml)

Automated CI/CD workflows for the Flying411 Inventory Management System. This directory contains 7 GitHub Actions workflows that handle continuous integration, deployment, security scanning, releases, and dependency management.

---

## Workflows

### 1. CI Pipeline (`ci.yml`)

Validates code quality and builds on every push and pull request.

**Triggers:** Push to `main` or `develop`, pull requests to `main`

**Jobs (7):**

| Job | Depends On | Description |
|-----|-----------|-------------|
| `lint-backend` | -- | ESLint + Prettier format check on backend |
| `lint-frontend` | -- | ESLint + Prettier format check on frontend |
| `test-backend` | `lint-backend` | Runs tests with coverage (PostgreSQL 15 + Redis 7 service containers) |
| `test-frontend` | `lint-frontend` | Runs tests with coverage |
| `build-backend` | `lint-backend`, `test-backend` | Compiles TypeScript, generates Prisma client, uploads build artifact |
| `build-frontend` | `lint-frontend`, `test-frontend` | Builds Vite production bundle (`VITE_API_URL=/api`), uploads build artifact |
| `security` | -- | Runs `npm audit` (high severity) on both backend and frontend |

> **Note**: Uses concurrency group `ci-${{ github.ref }}` with `cancel-in-progress: true` to avoid redundant runs.

---

### 2. CD Pipeline (`cd.yml`)

Builds Docker images, deploys to staging, runs smoke tests, and promotes to production.

**Triggers:** Push to `main`, manual dispatch (choose `staging` or `production`)

**Jobs (5):**

| Job | Depends On | Description |
|-----|-----------|-------------|
| `docker-build` | -- | Builds and pushes backend/frontend images to Docker Hub (tagged `latest` + commit SHA). Runs Trivy scan on both images. |
| `deploy-staging` | `docker-build` | SSHs into staging server, pulls images, runs `docker compose up -d`, applies Prisma migrations |
| `smoke-test` | `deploy-staging` | Runs `curl` health checks against `https://staging.flying411.com/api/health` and `https://staging.flying411.com` with retries |
| `deploy-production` | `docker-build`, `smoke-test` | SSHs into production server (main branch only), pulls images, runs migrations, sends Slack notification |
| `rollback` | `deploy-production` | Triggers automatically on production deployment failure. Restarts previous containers via SSH. |

> **Note**: Uses concurrency group `cd-${{ github.ref }}` with `cancel-in-progress: false` to prevent overlapping deployments.

---

### 3. PR Quality Check (`pr-check.yml`)

Runs a comprehensive quality gate on every pull request and posts a summary comment.

**Triggers:** Pull request opened, synchronized, or reopened

**Jobs (7):**

| Job | Depends On | Description |
|-----|-----------|-------------|
| `code-quality-backend` | -- | ESLint, Prettier, TypeScript type check (`tsc --noEmit`) |
| `code-quality-frontend` | -- | ESLint, Prettier, TypeScript type check (`tsc --noEmit`) |
| `test-coverage-backend` | -- | Runs tests with coverage (PostgreSQL 15 + Redis 7 service containers) |
| `test-coverage-frontend` | -- | Runs tests with coverage, enforces **70% minimum** threshold |
| `security-scan` | -- | `npm audit` on both packages + TruffleHog secret detection |
| `dependency-review` | -- | Reviews dependency changes, fails on moderate+ severity, comments findings on PR |
| `pr-summary` | All above | Posts/updates a status table comment on the PR with pass/fail results for each check |

---

### 4. Security Scan (`security.yml`)

Deep security analysis across multiple scanning tools.

**Triggers:** Weekly schedule (Monday 9:00 AM UTC), push to `main`, manual dispatch

**Jobs (5):**

| Job | Depends On | Description |
|-----|-----------|-------------|
| `dependency-scan` | -- | `npm audit` with JSON reports, uploads audit artifacts (30-day retention) |
| `trivy-scan` | -- | Filesystem scan of backend and frontend, uploads SARIF results to GitHub Security tab |
| `codeql-analysis` | -- | GitHub CodeQL SAST with `security-extended` queries for JavaScript/TypeScript |
| `secret-scan` | -- | TruffleHog (verified secrets) + Gitleaks detection |
| `report` | All above | Generates summary table in GitHub Actions step summary, sends results to monitor webhook |

---

### 5. Release (`release.yml`)

Builds versioned Docker images and creates a GitHub Release when a version tag is pushed.

**Triggers:** Tag push matching `v*` (e.g., `v1.2.0`, `v2.0.0-beta.1`)

**Jobs (3):**

| Job | Depends On | Description |
|-----|-----------|-------------|
| `build-release` | -- | Generates changelog from git history, builds and pushes Docker images tagged with version number + `latest` |
| `create-release` | `build-release` | Creates a GitHub Release with changelog and Docker pull commands. Marks tags containing `alpha`, `beta`, or `rc` as pre-releases. |
| `notify` | `build-release`, `create-release` | Sends Slack notification and monitor webhook with release details |

**Example:** Pushing tag `v1.3.0` produces Docker images `flying411/backend:1.3.0` and `flying411/frontend:1.3.0`.

---

### 6. Sync to Pipeline Monitor (`monitor-sync.yml`)

Forwards workflow run data to an external monitoring dashboard.

**Triggers:** Listens to all workflow completions (CI Pipeline, CD Pipeline, PR Quality Check, Security Scan, Release)

**Behavior:**
- Sends workflow run metadata (status, conclusion, timing, actor, branch) to `MONITOR_WEBHOOK_URL`
- On workflow completion, fetches and sends individual job details (steps, status, timing)
- Skips silently if `MONITOR_WEBHOOK_URL` is not configured

---

### 7. Auto-merge Dependabot (`auto-merge-dependabot.yml`)

Automates dependency update handling for Dependabot pull requests.

**Triggers:** `pull_request_target` (opened, synchronized, reopened) from `dependabot[bot]`

**Behavior:**
- **Minor/patch updates**: Automatically enables squash-merge via `gh pr merge --auto --squash`
- **Major updates**: Adds `major-update` and `needs-review` labels for manual review

---

## Required Secrets

Configure secrets in: **Settings > Secrets and variables > Actions**

| Secret | Purpose | Required |
|--------|---------|----------|
| `DOCKER_USERNAME` | Docker Hub login | Yes (CD, Release) |
| `DOCKER_PASSWORD` | Docker Hub access token | Yes (CD, Release) |
| `STAGING_HOST` | Staging server IP or hostname | Yes (CD) |
| `STAGING_USERNAME` | Staging SSH user | Yes (CD) |
| `STAGING_SSH_KEY` | Staging SSH private key | Yes (CD) |
| `PRODUCTION_HOST` | Production server IP or hostname | Yes (CD) |
| `PRODUCTION_USERNAME` | Production SSH user | Yes (CD) |
| `PRODUCTION_SSH_KEY` | Production SSH private key | Yes (CD) |
| `SLACK_WEBHOOK` | Slack incoming webhook URL for notifications | Optional |
| `MONITOR_WEBHOOK_URL` | External pipeline monitor endpoint | Optional |

---

## Setting Up Secrets

### 1. Docker Hub Token

```bash
# Create an access token at: https://hub.docker.com/settings/security
# Add the token as DOCKER_PASSWORD in GitHub Actions secrets
# Add your Docker Hub username as DOCKER_USERNAME
```

### 2. SSH Keys for Deployment

```bash
# Generate an SSH key pair for GitHub Actions
ssh-keygen -t ed25519 -C "github-actions-flying411" -f ~/.ssh/flying411_deploy

# Copy the public key to your servers
ssh-copy-id -i ~/.ssh/flying411_deploy.pub user@staging.flying411.com
ssh-copy-id -i ~/.ssh/flying411_deploy.pub user@flying411.com

# Display the private key, then paste it into the GitHub secrets
cat ~/.ssh/flying411_deploy
# Copy output -> STAGING_SSH_KEY and PRODUCTION_SSH_KEY
```

### 3. Slack Webhook (Optional)

```bash
# Create a webhook at: https://api.slack.com/messaging/webhooks
# Add the webhook URL as SLACK_WEBHOOK in GitHub Actions secrets
```

---

## Environment Configuration

Configure deployment environments in: **Settings > Environments**

### Staging

- **Name:** `staging`
- **URL:** https://staging.flying411.com
- **Protection rules:**
  - Required reviewers: 0 (auto-deploy)
  - Wait timer: 0 minutes
  - Deployment branches: `main`

### Production

- **Name:** `production`
- **URL:** https://flying411.com
- **Protection rules:**
  - Required reviewers: 1+ (manual approval)
  - Wait timer: 5 minutes (safety delay)
  - Deployment branches: `main`

---

## Local Testing

### Backend

```bash
cd backend
npm install
npm run lint
npm run format:check
npm run test:coverage
npm run build
```

### Frontend

```bash
cd frontend
npm install
npm run lint
npm run format:check
npm run test:coverage
npm run build
```

### Docker Build

```bash
# Individual images
docker build -t flying411/backend:test ./backend
docker build -t flying411/frontend:test ./frontend

# Full stack
docker compose -f docker-compose.prod.yml up --build
```

---

## Workflow Status Badges

Add these badges to your project README:

```markdown
[![CI Pipeline](https://github.com/shuakipie87/inventory-flying/actions/workflows/ci.yml/badge.svg)](https://github.com/shuakipie87/inventory-flying/actions/workflows/ci.yml)
[![CD Pipeline](https://github.com/shuakipie87/inventory-flying/actions/workflows/cd.yml/badge.svg)](https://github.com/shuakipie87/inventory-flying/actions/workflows/cd.yml)
[![Security Scan](https://github.com/shuakipie87/inventory-flying/actions/workflows/security.yml/badge.svg)](https://github.com/shuakipie87/inventory-flying/actions/workflows/security.yml)
```

---

## Troubleshooting

### Workflow Not Running

- Verify the workflow YAML has no syntax errors (use `actionlint` locally)
- Confirm the trigger event and branch match your push/PR
- Check that GitHub Actions is enabled under **Settings > Actions > General**

### Test Failures

- Review the workflow logs in the Actions tab
- For backend tests, verify that the PostgreSQL and Redis service containers started (check health check logs)
- Run `npm run test:coverage` locally to reproduce

### Docker Push Fails

- Confirm `DOCKER_USERNAME` and `DOCKER_PASSWORD` secrets are set and correct
- Check Docker Hub rate limits (100 pulls/6hr for anonymous, 200 for authenticated)
- Verify the image name matches your Docker Hub repository

### Deployment Fails

- Verify SSH credentials (`*_HOST`, `*_USERNAME`, `*_SSH_KEY`) are correct
- Test SSH connectivity manually: `ssh -i key user@host`
- Confirm `docker compose` is installed on the target server
- Check that `/opt/flying411` exists and contains `docker-compose.yml`

### Coverage Below Threshold

- The PR Quality Check enforces a 70% coverage threshold on frontend
- Run `npm run test:coverage` locally and check `coverage/coverage-summary.json`
- Add tests for uncovered code before pushing

### Secret Scanning Alerts

- Review detected secrets in the Security tab
- Rotate any compromised credentials immediately
- Update rotated values in GitHub Actions secrets

---

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax Reference](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Actions Marketplace](https://github.com/marketplace?type=actions)
- [GitHub Actions Status](https://www.githubstatus.com/)

---

**Last Updated:** February 18, 2026
**Maintained By:** @shuakipie87
