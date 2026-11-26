---
slug: cicd
title: CI/CD Pipelines
subtitle: 15 hands-on GitHub Actions lessons plus concepts, release strategies and interview questions
emoji: 🚀
accent: #0ea5e9
category: DevOps
cards: all
---

# Start here

## What are CI, continuous delivery and continuous deployment?

- **Continuous Integration (CI)**: developers merge small changes often; every change is **built and tested automatically**, so integration problems show up in minutes.
- **Continuous Delivery (CD)**: every change that passes the pipeline is **ready to release** at any time; deploying to production is a **manual button/approval**.
- **Continuous Deployment**: every passing change goes to **production automatically**, with no human step.

The goal is **small, frequent, low-risk releases**. The enablers are automated tests, one-command deployments, fast feedback and an easy rollback.

## What does a typical CI/CD pipeline look like?

1. **Commit / pull request**: developer pushes code.
2. **Build**: compile, install dependencies, produce an artifact (jar, bundle, Docker image).
3. **Test**: lint, unit, integration tests; coverage gate.
4. **Scan**: dependency vulnerabilities (SCA), static analysis (SAST), secrets scan.
5. **Package & publish**: versioned image/artifact to a registry.
6. **Deploy to staging**; run smoke/end-to-end tests.
7. **Approval** (continuous delivery) or automatic promotion.
8. **Deploy to production** with a safe strategy (rolling, blue-green, canary).
9. **Verify and monitor**: health checks, metrics, automatic rollback.

Try a pipeline in the **CI/CD pipeline simulator** lab.

## Which CI/CD tools exist and how do they compare?

| Tool | Notes |
|---|---|
| **GitHub Actions** | YAML in `.github/workflows`, huge marketplace of actions, built into GitHub |
| **GitLab CI/CD** | `.gitlab-ci.yml`, stages and jobs, built-in registry, environments and security scans |
| **Jenkins** | self-hosted, very flexible, plugins, `Jenkinsfile` (pipeline as code); you maintain it |
| **CircleCI / Travis / Buildkite** | hosted (or hybrid) CI services |
| **Azure DevOps Pipelines** | Microsoft ecosystem, YAML pipelines |
| **Argo CD / Flux** | **GitOps** continuous delivery for Kubernetes (pull-based) |
| **Terraform / Pulumi** | infrastructure as code, run from the pipeline |

# GitHub Actions

## What are the parts of GitHub Actions?

- **Workflow**: a YAML file in `.github/workflows/` that defines an automated process.
- **Event**: what starts it (`push`, `pull_request`, `schedule`, `workflow_dispatch`, `release`, `workflow_call`).
- **Job**: a group of steps that runs on **one runner**. Jobs run in parallel unless linked with `needs:`.
- **Step**: one command (`run:`) or one **action** (`uses:`).
- **Action**: a reusable unit (checkout, setup-node, docker/build-push-action).
- **Runner**: the machine that runs a job (GitHub-hosted Ubuntu/Windows/macOS, or **self-hosted**).
- **Context & expressions**: `${{ github.sha }}`, `${{ secrets.X }}`, `${{ matrix.node }}`, `if:` conditions.

## How do secrets, variables and environments work?

**Secrets** (encrypted, masked in logs) and **variables** (plain settings) can be set at **repository**, **organization** or **environment** level. An **environment** (`staging`, `production`) can have its own secrets, **required reviewers** (manual approval), a **wait timer** and **branch restrictions**. Secrets are not passed to workflows triggered by pull requests from forks. Prefer short-lived credentials with **OIDC** over stored cloud keys.

## How do you speed up a slow pipeline?

- **Cache** dependencies (`setup-node` with `cache`, `actions/cache`) and Docker layers (`cache-from: type=gha`).
- Run independent jobs **in parallel**; split big test suites (sharding).
- Use **path filters** and `if:` so unrelated changes skip jobs; **cancel outdated runs** (`concurrency: cancel-in-progress`).
- Build **once** and reuse the artifact; use smaller base images and multi-stage Docker builds.
- Fail **fast**: cheap checks (lint, unit tests) before expensive ones (e2e).
- Use faster/larger runners or self-hosted runners for heavy jobs; run slow suites nightly.

## What are reusable workflows and composite actions?

A **reusable workflow** has `on: workflow_call` with `inputs` and `secrets`; other workflows call it with `uses: org/repo/.github/workflows/x.yml@v1` (a whole job or more). A **composite action** packages **steps** (`runs: using: composite`) that you call inside a job. Use reusable workflows for whole pipelines shared across repos, composite actions for small repeated step groups. Version them (tags/SHA) so changes do not break every consumer at once.

## What is the difference between GitHub-hosted and self-hosted runners?

**GitHub-hosted** runners are fresh, clean VMs per job: zero maintenance, but limited hardware and no access to your private network. **Self-hosted** runners run on your machines: custom hardware (GPUs), private network access, caching, and no per-minute charge, but **you** patch and secure them and must never run untrusted fork code on them. Use ephemeral (one job, then destroyed) self-hosted runners and autoscaling (e.g. Actions Runner Controller) for safety.

# Release strategies

## Blue-green vs canary vs rolling: how do they differ?

| Strategy | How it works | Rollback | Cost / risk |
|---|---|---|---|
| **Rolling** | replace instances gradually (few at a time) | roll the update back (slow) | cheap; old and new versions run together briefly |
| **Blue-green** | run a full new environment ("green") beside the live one ("blue"), then **switch traffic** | switch back instantly | needs 2× capacity |
| **Canary** | send a **small percentage** of traffic (1–10%) to the new version, watch metrics, then increase | route traffic back to stable | needs good metrics and traffic splitting |
| **Recreate** | stop old, start new | redeploy old | downtime |
| **Shadow** | copy real traffic to the new version without returning its answers | n/a | tests safely, adds load |

Try the **Canary rollout** lab.

## How do you roll back safely?

Keep **immutable, versioned artifacts** (deploy by SHA or version, not `latest`) so the old version still exists. Roll back by **redeploying the previous artifact** (`kubectl rollout undo`, switch the blue-green router, flip the feature flag, `git revert` in GitOps). Automate it: a failing **health check or error-rate alarm** triggers rollback. Make database changes **backward compatible** (expand → migrate → contract) so the old code still works. Practice rollbacks regularly.

## What are feature flags and how do they relate to deployment?

A **feature flag** lets you ship code **turned off** and enable it later for some or all users without redeploying. This separates **deployment** (code reaches production) from **release** (users see it). Benefits: trunk-based development with unfinished features hidden, gradual rollouts, instant kill-switch. Costs: flag debt (remove old flags), more test combinations, flag service availability.

## What is GitOps?

**GitOps** uses a Git repository as the **single source of truth** for the desired state of your infrastructure/apps. A controller in the cluster (**Argo CD, Flux**) continuously compares the cluster with Git and **pulls** changes to make them match. Deploying = merging a pull request that changes the manifests (e.g. a new image tag); rollback = `git revert`. Benefits: audit trail, review, easy rollback and **no cluster credentials in the CI system** (pull instead of push); drift is detected and corrected.

## How do you handle database migrations in CD?

Run migrations as a controlled pipeline step (Flyway, Liquibase, EF Core migrations, Alembic) **before or during** deployment, and make them **backward compatible** with the version still running: **add** new columns/tables first, deploy code that uses both, **backfill**, then **remove** old things in a later release (expand/contract). Avoid long locks on big tables, take backups, test migrations on a copy of production data, and never edit an already-applied migration.

## Trunk-based development vs Git Flow: which suits CI/CD?

**Trunk-based**: everyone merges small changes to `main` (or very short-lived branches) several times a day, with feature flags hiding unfinished work. It fits CI/CD best: fewer merge conflicts and always-releasable `main`. **Git Flow** (develop, release, hotfix branches) suits scheduled, versioned releases but delays integration and adds merge overhead. Most modern teams use trunk-based or GitHub Flow (short feature branches + pull requests).

# Quality and security

## What belongs in a quality gate?

Fast, deterministic checks that block a merge: **format/lint**, **type-check**, **unit tests**, a **coverage threshold** on new code, **build succeeds**, **dependency vulnerability scan**, **secrets scan** and **SAST**. Slower checks (integration, end-to-end, performance, DAST) run after merge or nightly. Make them **required status checks** with branch protection plus at least one **code review**.

## What is DevSecOps and which scans belong in the pipeline?

DevSecOps means **security is part of the pipeline** ("shift left"). Common steps: **SCA** (Dependabot, `npm audit`, Snyk, Trivy: vulnerable libraries), **SAST** (CodeQL, SonarQube: bugs in your code), **secret scanning** (gitleaks, GitHub secret scanning), **container image scanning** (Trivy, Grype), **IaC scanning** (Checkov, tfsec), **DAST** (OWASP ZAP against staging), **SBOM** generation, and **image signing/provenance** (cosign, SLSA). Fail the build on high-severity findings and track exceptions.

## How do you handle flaky tests?

Detect them (re-run history, quarantine report), **fix the root cause** (shared state, timing/sleeps, real network calls, test ordering, time zones), isolate/quarantine truly flaky tests into a non-blocking job with an owner and a deadline, avoid blanket automatic retries that hide problems, and make environments deterministic (containers, fixed seeds, mocked time/network). Flaky tests erode trust: people start ignoring red builds.

## What are the DORA metrics?

Four measures of delivery performance:

| Metric | Meaning |
|---|---|
| **Deployment frequency** | how often you deploy to production |
| **Lead time for changes** | commit → running in production |
| **Change failure rate** | % of deployments that cause an incident/rollback |
| **Time to restore service** (MTTR) | how fast you recover from a failure |

Elite teams deploy on demand, with lead times under a day, low failure rates and fast recovery. CI/CD improves the first two; monitoring and rollback improve the last two.

## How should secrets be managed in CI/CD?

Never commit them. Store them in the CI's **encrypted secrets** or, better, a **secret manager** (Vault, AWS Secrets Manager, Azure Key Vault) and fetch them at run time with **short-lived credentials via OIDC**. Scope secrets to the **environment** that needs them, rotate regularly, **mask** them in logs, never pass them to untrusted (fork) builds, use read-only tokens where possible, and scan the repository history for leaks (rotate anything that leaked).

## What is Infrastructure as Code and how does it fit CI/CD?

**IaC** describes servers, networks and cloud resources in code (Terraform, Pulumi, CloudFormation, Bicep, Ansible) so they are versioned, reviewed and reproducible. In CI/CD: on a pull request run `terraform fmt/validate/plan` and show the **plan** in the PR; on merge **apply** it (with approval for production), keep **remote state** with locking, use separate state per environment, and scan for misconfiguration (Checkov/tfsec).

# Interview questions

## Walk me through a CI/CD pipeline you would design for a microservice

1. **PR pipeline**: lint, unit tests, build, container scan, coverage gate; required checks + review.
2. **Merge to main**: build **one** immutable Docker image tagged with the commit SHA, push to a registry, generate an SBOM, sign it.
3. **Deploy to staging** automatically (GitOps commit or `kubectl set image`), run smoke and contract/e2e tests.
4. **Approval** (or automatic promotion based on checks) → **canary** release to production (5% → 50% → 100%) with automated metrics checks.
5. **Rollback** automatically on failed health checks or SLO alarms.
6. **Observability**: dashboards, alerts, deployment markers; track DORA metrics.
7. **Security**: OIDC credentials, least privilege, pinned actions, dependency updates via Dependabot.

## Jenkins vs GitHub Actions: how do you choose?

**GitHub Actions**: no server to maintain, close to your code, huge marketplace, easy YAML, good defaults and OIDC. **Jenkins**: maximum flexibility, huge plugin ecosystem, runs anywhere (air-gapped, on-prem), but you maintain the server, plugins, security patches and scaling. Choose Actions (or GitLab CI) for most new projects on those platforms; choose Jenkins when you need on-prem control, existing investment or very custom workflows. Either way, keep the pipeline as **code** in the repository.

## How do you design pipelines for a monorepo?

Detect **what changed** (path filters, `git diff`, build tools like Nx, Turborepo, Bazel) and build/test only affected projects; share caching (remote build cache); keep per-service pipelines in reusable workflows; version and release packages independently; and keep the PR pipeline fast with parallel jobs and test sharding. Protect against "everything rebuilds on every change".

## How do you version artifacts and releases?

Use **Semantic Versioning** (MAJOR.MINOR.PATCH) for libraries and APIs and the **commit SHA** for deployable images. Tags are **immutable** (never overwrite a published version), generate **changelogs** from conventional commits, create releases from tags, and record which version runs in each environment. Keep old artifacts for rollback and store them in an **artifact registry**.

## How would you achieve zero-downtime deployments?

Run multiple instances behind a load balancer; use **rolling**, **blue-green** or **canary** deployments; add **readiness and liveness probes** so traffic only reaches ready instances; use **graceful shutdown** (drain connections); keep **database changes backward compatible**; keep **sessions/state** outside the process; and verify with health checks before shifting traffic. Add automatic rollback.

## What happens if a deployment fails halfway?

Design deployments to be **idempotent and atomic where possible**. With rolling updates the old pods keep serving until new ones are ready, so a failed rollout leaves the old version running (and `kubectl rollout undo` restores any partial state). With blue-green the switch never happened. For stateful or scripted deploys, use a **lock** (`concurrency`), health checks between steps, a **rollback step** (`if: failure()`), and alerts. Always know the current deployed version and be able to redeploy the previous one.

## How do you make builds reproducible?

Pin versions (lock files, `npm ci`, pinned base image digests and action SHAs), build in **clean, containerised** environments, avoid downloading "latest", record the **commit and build inputs** (SBOM/provenance), keep builds hermetic (no network at build time if possible), and build **once** and promote the same artifact through environments.

## How do you use Docker well in CI?

Use **multi-stage builds** (build in a fat image, ship a small runtime image), order Dockerfile layers so dependency installs are cached, use `.dockerignore`, **BuildKit cache** (`cache-from/cache-to`), run as a **non-root** user, scan the image, tag with the **SHA**, and never bake secrets into the image (use runtime secrets or BuildKit secret mounts).

## Pipeline as code vs configuring pipelines in a UI?

**Pipeline as code** (YAML/Jenkinsfile in the repo) is versioned, reviewed in pull requests, reproducible, branch-specific and recoverable; UI-configured jobs drift, cannot be reviewed and are hard to reproduce. Prefer code, keep it DRY with reusable templates, and test pipeline changes on a branch before touching `main`.
