# More interview questions

## What is artifact promotion, and why not rebuild for each environment?

**Artifact promotion** means you **build once** (one image or package, immutable, tagged by commit) and **promote the same artifact** through dev → staging → production. Rebuilding for each environment can produce a **different binary** (changed dependencies, different timestamps) from what you tested. Environment differences belong in **configuration** (env vars, secrets, config maps), not in the build.

## How do you speed up Docker builds in CI?

Order the Dockerfile so rarely changing layers come first (copy `package*.json`, install, then copy source); use **multi-stage builds** and small base images; add a `.dockerignore`; use **BuildKit cache** (`cache-from`/`cache-to` with `type=gha` or a registry cache); build in parallel for multiple platforms only when needed; and avoid running tests inside the image build when a faster separate job can do it.

## How do you rotate secrets without downtime?

Store secrets in a **secret manager** and have the app read them at runtime. Rotate with an **overlap window**: create the new secret, make the system accept **both** old and new (or issue a second key), deploy consumers with the new one, verify, then **revoke** the old. Automate rotation (scheduled, with alerts), avoid secrets baked into images, and prefer short-lived credentials (OIDC, workload identity) so there is less to rotate.

## What are the GITHUB_TOKEN permissions and why set them explicitly?

`GITHUB_TOKEN` is a **short-lived token** created for each run. Its default permissions depend on repository settings and may be broad. Set `permissions:` at the workflow or job level to the **minimum** (`contents: read`; add `packages: write`, `pull-requests: write`, `id-token: write` only where needed). This limits the damage if a step or third-party action is compromised.

## How do you roll back when a database migration was already applied?

Design migrations to be **backward compatible** (expand/contract): add columns or tables first, deploy code that works with both shapes, backfill, and only later remove old structures. Then an application rollback needs **no database rollback**. Avoid destructive changes in the same release, test migrations on production-like data, keep backups, and have **down** scripts only as a last resort (data written after the migration may not fit the old schema).

## What is automated canary analysis?

Instead of watching dashboards manually, a tool (Argo Rollouts, Flagger, Spinnaker Kayenta) compares **metrics of the canary vs the baseline** (error rate, latency, saturation, business metrics) during each step, and automatically **promotes** the rollout if they are within thresholds or **aborts and rolls back** if not. Good metrics, enough traffic and well-chosen thresholds are essential.

## What is the difference between smoke tests, integration tests and end-to-end tests?

- **Smoke tests**: a few quick checks that the deployed system is basically alive (health endpoint, login page loads); run after every deploy.
- **Integration tests**: check that components work together (service + database, API + queue); slower than unit tests.
- **End-to-end (E2E) tests**: drive the whole system like a user (browser tests); the slowest and most brittle, so keep them few and focused on critical journeys.
Follow the **test pyramid**: many unit tests, fewer integration tests, very few E2E tests.

## How do preview environments per pull request work?

On every pull request the pipeline deploys an **ephemeral environment** (a namespace in Kubernetes, a preview deployment on Vercel/Netlify, a temporary cloud stack) with a unique URL, posts the link to the PR, and **destroys it** when the PR closes. Reviewers and testers can try the change before merging. Keep them cheap (small data, auto-delete), isolate secrets, and seed with safe test data.

## How do you handle approvals and change management in regulated industries?

Use **required reviewers** on protected environments, **branch protection** (peer review, signed commits), **separation of duties** (the author cannot approve their own production deploy), an **audit trail** (who approved, what changed, which artifact), links from deployments to tickets, **policy as code** (OPA) checks, and signed, traceable artifacts (provenance, SBOM). Automation actually helps compliance because every release follows the same recorded path.

## What are the risks of self-hosted runners and how do you reduce them?

A self-hosted runner executes workflow code on **your** machine, often inside your network with access to secrets and internal systems. Risks: untrusted code (fork pull requests) running on it, leftover files and credentials between jobs, and an unpatched machine. Reduce by using **ephemeral runners** (one job, then destroyed; Actions Runner Controller or autoscaling), never running untrusted forks on them, network isolation, least-privilege credentials and keeping the image patched.

## How do you set up CI for a monorepo efficiently?

Detect **affected projects** (path filters, `git diff`, or tools like Nx, Turborepo, Bazel), run only their lint/test/build, share a **remote build cache**, parallelise by project and shard large test suites, use reusable workflows per service type, and version/release packages independently. Keep the pull-request pipeline fast so developers do not avoid it.

## Immutable infrastructure vs configuration management?

With **immutable infrastructure** you never change a running server: you build a new image/instance (AMI, container) with the change and **replace** the old one, so environments do not drift and rollbacks are easy. **Configuration management** (Ansible, Chef, Puppet) modifies existing servers in place, which is flexible but allows **drift**. Containers and Terraform make the immutable approach the default for most modern deployments.
