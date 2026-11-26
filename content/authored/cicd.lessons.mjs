// Step-by-step CI/CD lessons (GitHub Actions). Same layout as the C# and Messaging lessons.

const L = (n, title, sub, big, steps, output, mistakes, file, program, run, lang = 'yaml', fileLabel = 'workflow file') =>
  ({ n, title, sub, big, steps, output, mistakes, file, program, run, lang, fileLabel });

export const groups = [
  { id: 'lab-1-first-pipeline', title: 'Lab 1: Your first pipeline (lessons 1–5)', from: 1, to: 5 },
  { id: 'lab-2-build-and-ship', title: 'Lab 2: Build, package and ship (lessons 6–10)', from: 6, to: 10 },
  { id: 'lab-3-professional', title: 'Lab 3: Professional pipelines (lessons 11–15)', from: 11, to: 15 },
];

export const lessons = [
  L(1, 'What CI/CD is, and the sample app', 'Create a tiny project with a test so there is something to automate.',
    '**CI (Continuous Integration)**: every time someone pushes code, a server automatically builds it and runs the tests, so broken code is found in minutes. **CD (Continuous Delivery/Deployment)**: after the checks pass, the new version is packaged and released automatically (or with one click). The point is small, safe, frequent releases instead of big scary ones. First we need a small project with a test.',
    [
      ['mkdir demo-app && cd demo-app\ngit init\nnpm init -y\nnpm pkg set type=module scripts.test="node --test"', 'Creates a Node.js project. `node --test` is Node\'s built-in test runner, so we need no extra libraries.', 'bash'],
      ['// src/sum.js\nexport const sum = (a, b) => a + b;', 'The code we want to protect.', 'javascript'],
      ['// src/sum.test.js\nimport test from \'node:test\';\nimport assert from \'node:assert/strict\';\nimport { sum } from \'./sum.js\';\n\ntest(\'adds two numbers\', () => assert.equal(sum(2, 3), 5));', 'One test. If someone breaks `sum`, this test fails.', 'javascript'],
      ['npm test', 'Run the tests on your own computer first. CI will run exactly this command.', 'bash'],
      ['git add . && git commit -m "first commit"\ngit remote add origin https://github.com/YOU/demo-app.git\ngit push -u origin main', 'Pushes the project to GitHub, where the pipeline will live.', 'bash'],
    ],
    '✔ adds two numbers (0.6ms)\nℹ tests 1\nℹ pass 1\nℹ fail 0',
    ['Pipelines automate commands that already work locally. If `npm test` fails on your laptop, fix that first.', 'Forgetting `package-lock.json`: CI uses `npm ci`, which needs it (run `npm install` once and commit the lock file).', 'No tests at all: CI then only proves the code compiles. The value comes from good tests.'],
    'sum.test.js',
    `import test from 'node:test';
import assert from 'node:assert/strict';
import { sum } from './sum.js';

test('adds two numbers', () => assert.equal(sum(2, 3), 5));
test('handles negatives', () => assert.equal(sum(-2, 1), -1));`,
    'npm test', 'javascript', 'test file'),

  L(2, 'Your first GitHub Actions workflow', 'Run the tests automatically on every push.',
    'GitHub Actions reads YAML files from `.github/workflows/`. A **workflow** starts on an **event** (like a push), runs one or more **jobs**, and each job has **steps** on a fresh virtual machine called a **runner**. Our first workflow checks out the code, installs Node.js, installs packages and runs the tests.',
    [
      ['name: CI\non: [push]', '`name` shows in the GitHub UI. `on` lists the events that start the workflow. `[push]` means every push to any branch.'],
      ['jobs:\n  test:\n    runs-on: ubuntu-latest', 'One job called `test`, running on a fresh Ubuntu machine that GitHub provides.'],
      ['    steps:\n      - uses: actions/checkout@v4', '`uses` runs a ready-made **action**. `checkout` downloads your repository onto the runner (the machine starts empty).'],
      ['      - uses: actions/setup-node@v4\n        with:\n          node-version: 20', 'Installs Node.js 20. `with` gives the action its inputs.'],
      ['      - run: npm ci\n      - run: npm test', '`run` executes a shell command. `npm ci` installs exactly what the lock file says (faster and stricter than `npm install`). If any command exits with an error the job fails.'],
    ],
    '✓ Set up job\n✓ Run actions/checkout@v4\n✓ Run actions/setup-node@v4\n✓ Run npm ci\n✓ Run npm test      ℹ pass 2\n✓ Complete job\n\nCI #1 — success (green tick next to your commit)',
    ['Putting the file in the wrong folder: it must be exactly `.github/workflows/ci.yml` at the repository root.', 'YAML indentation errors (use spaces, never tabs). GitHub shows "Invalid workflow file".', 'Forgetting `actions/checkout`: the runner is empty and `npm ci` fails with "no package.json".'],
    '.github/workflows/ci.yml',
    `name: CI
on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm test`,
    'git add .github && git commit -m "add CI" && git push   # then open the Actions tab on GitHub', 'yaml'),

  L(3, 'Triggers: when does the pipeline run?', 'Run on pull requests, on a schedule, or by hand.',
    'A trigger decides **when** a workflow starts. Typical set-up: run on every **pull request** (so problems are found before merging), on pushes to `main`, nightly on a **schedule**, and by hand with **workflow_dispatch**. You can also limit it by branch and by which files changed, so documentation edits do not start a full build.',
    [
      ['on:\n  push:\n    branches: [main]\n  pull_request:\n    branches: [main]', 'Runs on pushes to `main` and on pull requests that target `main`.'],
      ['  push:\n    paths:\n      - "src/**"\n      - "package*.json"', '`paths` limits the run to changes in these files. A README edit will not trigger it.'],
      ['  schedule:\n    - cron: "0 2 * * 1"', 'Runs every Monday at 02:00 UTC. Good for nightly dependency checks. Cron time is **UTC**.'],
      ['  workflow_dispatch:\n    inputs:\n      environment:\n        description: "Where to deploy"\n        default: staging', 'Adds a **Run workflow** button in the Actions tab, with an input form.'],
      ['${{ github.event_name }}   ${{ github.ref_name }}   ${{ github.actor }}', 'Context values you can read in your steps: what triggered the run, the branch name and who pushed.'],
    ],
    'Pull request #12 → CI runs → "All checks have passed"\nPush to main → CI runs\nEdit README.md → no run (paths filter)',
    ['Using both `push` and `pull_request` without branch filters: every commit on a PR runs the workflow twice.', 'Forgetting that scheduled workflows only run on the **default branch**.', 'Secrets are **not** available to workflows triggered by pull requests from forks (a security feature).'],
    '.github/workflows/ci.yml',
    `name: CI
on:
  push:
    branches: [main]
    paths: ["src/**", "package*.json", ".github/workflows/**"]
  pull_request:
    branches: [main]
  schedule:
    - cron: "0 2 * * 1"
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm test`,
    'Open a pull request, or use Actions → CI → Run workflow'),

  L(4, 'Jobs and dependencies (needs)', 'Split the pipeline into stages that wait for each other.',
    'Jobs run **in parallel** by default, each on its own machine. Use `needs:` to make one job wait for others, which builds a pipeline: lint and test run together, and **build** only starts if both succeeded. If a needed job fails, the dependent jobs are skipped, which is exactly the behaviour you want from a quality gate.',
    [
      ['jobs:\n  lint:\n    runs-on: ubuntu-latest\n    steps: [ … ]\n  test:\n    runs-on: ubuntu-latest\n    steps: [ … ]', '`lint` and `test` have no dependencies, so they start at the same time.'],
      ['  build:\n    needs: [lint, test]\n    runs-on: ubuntu-latest', '`build` waits for **both**. If either fails, `build` is skipped.'],
      ['    outputs:\n      version: ${{ steps.ver.outputs.version }}', 'A job can publish **outputs** that later jobs read with `needs.build.outputs.version`.'],
      ['      - id: ver\n        run: echo "version=1.0.${{ github.run_number }}" >> "$GITHUB_OUTPUT"', 'Sets an output by writing `name=value` to the special file `$GITHUB_OUTPUT`.', 'bash'],
      ['  notify:\n    needs: [build]\n    if: always()', '`if: always()` runs a job even when earlier jobs failed (useful for notifications).'],
    ],
    'lint ✓ (12 s)     test ✓ (20 s)   → run in parallel\nbuild ✓ (30 s)                      → starts after both\n(if test fails: build — skipped)',
    ['Forgetting that each job is a **fresh machine**: files from job A do not exist in job B unless you upload an artifact (lesson 7).', 'Chaining everything in one job: slower, and you cannot see which stage failed.', 'A skipped job counts as "success" for required checks unless you configure it. Check branch protection settings.'],
    '.github/workflows/ci.yml',
    `name: CI
on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run lint --if-present

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm test

  build:
    needs: [lint, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "building version 1.0.\${{ github.run_number }}"`,
    'Push a commit and watch the graph in the Actions tab'),

  L(5, 'Matrix builds: test on many versions at once', 'Run the same job for several Node versions and operating systems.',
    'Your users run different versions and systems. A **matrix** runs one job many times with different values, all in parallel. You write the job once and list the variations. One failing combination is shown in red, and the others still finish, so you see exactly which version is broken.',
    [
      ['strategy:\n  fail-fast: false\n  matrix:\n    node: [18, 20, 22]\n    os: [ubuntu-latest, windows-latest]', 'Creates 3 × 2 = **6 jobs**. `fail-fast: false` lets the other 5 finish even if one fails.'],
      ['runs-on: ${{ matrix.os }}', 'Each job takes its operating system from the matrix.'],
      ['- uses: actions/setup-node@v4\n  with:\n    node-version: ${{ matrix.node }}', 'And its Node version.'],
      ['include:\n  - node: 23\n    os: ubuntu-latest\n    experimental: true', '`include` adds one extra special combination.'],
      ['continue-on-error: ${{ matrix.experimental == true }}', 'Lets the experimental combination fail without failing the whole run.'],
    ],
    'test (18, ubuntu-latest)   ✓\ntest (18, windows-latest)  ✓\ntest (20, ubuntu-latest)   ✓\ntest (20, windows-latest)  ✓\ntest (22, ubuntu-latest)   ✓\ntest (22, windows-latest)  ✗   ← you now know exactly where it breaks',
    ['Huge matrices cost minutes (and money on private repos). Test the combinations that matter.', 'Writing `node-version: 20` as a number list item and getting `20.0`: quote versions like `"20"` if you use decimals such as `"1.20"`.', 'Windows runners use different shells and path separators: keep scripts cross-platform.'],
    '.github/workflows/ci.yml',
    `name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: \${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        node: [18, 20, 22]
        os: [ubuntu-latest, windows-latest]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ matrix.node }}
          cache: npm
      - run: npm ci
      - run: npm test`,
    'Push and open the run: the left list shows all 6 combinations'),

  L(6, 'Caching dependencies to speed things up', 'Stop downloading the same packages on every run.',
    'Every run starts on a **new, empty machine**, so `npm ci` downloads everything again. A **cache** stores files between runs. If the cache key (usually a hash of your lock file) matches, the files are restored in seconds. Faster pipelines mean developers actually wait for them and use them.',
    [
      ['- uses: actions/setup-node@v4\n  with:\n    node-version: 20\n    cache: npm', 'The easy way: `setup-node` caches the npm download folder using a key based on `package-lock.json`.'],
      ['- uses: actions/cache@v4\n  with:\n    path: ~/.cache/my-tool\n    key: tool-${{ runner.os }}-${{ hashFiles(\'**/package-lock.json\') }}\n    restore-keys: |\n      tool-${{ runner.os }}-', 'The general way. `key` is exact; `restore-keys` are fallbacks (partial matches).'],
      ['steps.cache.outputs.cache-hit == \'true\'', 'You can check whether the cache was found and skip an expensive step.', 'javascript'],
      ['- uses: docker/build-push-action@v6\n  with:\n    cache-from: type=gha\n    cache-to: type=gha,mode=max', 'Docker layers can be cached in the GitHub cache too (lesson 9).'],
    ],
    'Run npm ci\n  Cache restored from key: node-cache-Linux-npm-9f2c…\n  added 214 packages in 3s            (was 24 s without cache)',
    ['Caching things that change on every run (the key never matches again).', 'Caching **build output** that should be rebuilt. Cache dependencies, not results.', 'Never invalidating: include the lock file hash in the key so a dependency change gets a fresh cache.'],
    '.github/workflows/ci.yml',
    `name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm            # caches ~/.npm using package-lock.json as the key
      - run: npm ci
      - run: npm test`,
    'Run the workflow twice and compare the "npm ci" time'),

  L(7, 'Artifacts: keep and share build results', 'Save files from one job and use them in another.',
    'Because each job runs on a different machine, files do not carry over. An **artifact** is a file or folder you upload at the end of a job. Later jobs (or you, from the GitHub page) can download it. This is how you build **once** and deploy the **same files** to every environment.',
    [
      ['- run: npm run build\n  # creates the dist/ folder', 'Produce the build output in the build job.'],
      ['- uses: actions/upload-artifact@v4\n  with:\n    name: dist\n    path: dist/\n    retention-days: 7', 'Uploads `dist/` under the name `dist` and keeps it for 7 days.'],
      ['  deploy:\n    needs: build\n    steps:\n      - uses: actions/download-artifact@v4\n        with:\n          name: dist\n          path: dist/', 'The next job downloads exactly the files the build job produced.'],
      ['if: failure()\nuses: actions/upload-artifact@v4\nwith:\n  name: test-report\n  path: reports/', '`if: failure()` uploads logs or reports **only when something broke**, so you can investigate.'],
    ],
    'Artifacts (on the run page):\n  dist          1.2 MB   expires in 7 days\n  test-report   48 KB    expires in 7 days',
    ['Rebuilding in the deploy job: you may deploy code that is **different** from what was tested. Build once, deploy the artifact.', 'Uploading `node_modules`: huge and slow. Upload build output only.', 'Artifacts use storage and expire. Set a sensible `retention-days`.'],
    '.github/workflows/ci.yml',
    `name: Build and deploy
on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run build --if-present
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
          retention-days: 7

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist/
      - run: ls -R dist/`,
    'Push, then open the run page and download the "dist" artifact'),

  L(8, 'Secrets and variables', 'Use passwords and tokens without leaking them.',
    'Pipelines need secrets (API keys, cloud credentials) and settings (an environment name). **Secrets** are stored encrypted in GitHub, never appear in the repository, and are **masked** (`***`) in logs. **Variables** are for non-secret settings. You read both through `secrets.` and `vars.`. Never write a secret in the YAML file.',
    [
      ['Repo → Settings → Secrets and variables → Actions → New repository secret\n  Name: API_TOKEN     Value: (paste the token)', 'Create the secret in the GitHub UI, not in code.'],
      ['env:\n  API_URL: ${{ vars.API_URL }}\n  API_TOKEN: ${{ secrets.API_TOKEN }}', 'Expose them to a step as **environment variables**. The program reads `process.env.API_TOKEN`.'],
      ['- run: curl -H "Authorization: Bearer $API_TOKEN" "$API_URL/deploy"\n  env:\n    API_TOKEN: ${{ secrets.API_TOKEN }}', 'Pass a secret to one step only (the least exposure). Use the shell variable `$API_TOKEN`, not an inline `${{ }}` inside the command text.', 'bash'],
      ['GITHUB_TOKEN', 'GitHub creates a short-lived token automatically for every run: use it for pushing packages or commenting on pull requests instead of a personal token.'],
    ],
    'Run curl -H "Authorization: Bearer ***" "https://api.example.com/deploy"\n(the secret value is hidden as ***)',
    ['`echo $SECRET` in a script: GitHub masks the exact value, but a transformed copy (base64, split) is **not** masked.', 'Putting secrets in the YAML or committing a `.env` file. Rotate any secret that was ever committed.', 'Giving a secret to a workflow that runs on untrusted pull requests. Use environments and approvals for sensitive secrets.'],
    '.github/workflows/ci.yml',
    `name: Call API
on: workflow_dispatch

jobs:
  call:
    runs-on: ubuntu-latest
    env:
      API_URL: \${{ vars.API_URL }}
    steps:
      - name: Trigger deploy hook
        run: curl --fail -H "Authorization: Bearer $API_TOKEN" "$API_URL/deploy"
        env:
          API_TOKEN: \${{ secrets.API_TOKEN }}`,
    'Add the secret and variable in repo settings, then run the workflow by hand'),

  L(9, 'Build and push a Docker image', 'Package the app as a container and publish it to GitHub Container Registry.',
    'A **container image** bundles your app and everything it needs, so it runs the same on every server. The pipeline builds the image on every merge to `main` and pushes it to a **registry** (GHCR, Docker Hub, ECR). Tag it with the **commit SHA** so every image is traceable to exact code, and a human-friendly tag like `latest` for convenience.',
    [
      ['FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --omit=dev\nCOPY src ./src\nCMD ["node", "src/index.js"]', 'A small **Dockerfile**. Copying `package*.json` first lets Docker cache the install layer.', 'dockerfile'],
      ['permissions:\n  contents: read\n  packages: write', 'The job needs permission to **write packages**. Give only what is needed.'],
      ['- uses: docker/login-action@v3\n  with:\n    registry: ghcr.io\n    username: ${{ github.actor }}\n    password: ${{ secrets.GITHUB_TOKEN }}', 'Logs in to GHCR using the built-in token (no personal password needed).'],
      ['- uses: docker/build-push-action@v6\n  with:\n    context: .\n    push: true\n    tags: |\n      ghcr.io/${{ github.repository }}:${{ github.sha }}\n      ghcr.io/${{ github.repository }}:latest', 'Builds and pushes with two tags: the exact commit (`sha`) and `latest`.'],
      ['cache-from: type=gha\ncache-to: type=gha,mode=max', 'Reuses Docker layers between runs for much faster builds.'],
    ],
    '#12 exporting to image\n#12 pushing ghcr.io/you/demo-app:3f9c2ab … done\nPackage published: ghcr.io/you/demo-app',
    ['Deploying the `latest` tag: you cannot tell which code is running or roll back precisely. Deploy by **SHA or version**.', 'Forgetting `packages: write` permission: the push fails with `denied`.', 'Putting secrets in the image (`COPY .env`) or using a huge base image. Use a small base and pass secrets at runtime.'],
    '.github/workflows/docker.yml',
    `name: Docker
on:
  push:
    branches: [main]

permissions:
  contents: read
  packages: write

jobs:
  image:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: |
            ghcr.io/\${{ github.repository }}:\${{ github.sha }}
            ghcr.io/\${{ github.repository }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max`,
    'Merge to main, then open Packages on your GitHub profile'),

  L(10, 'Deploy with environments and approvals', 'Release to staging automatically and to production only after a person approves.',
    'GitHub **Environments** (like `staging` and `production`) hold their own secrets and **protection rules**. If `production` requires reviewers, the job **pauses** until someone clicks Approve. Add `concurrency` so two deploys never run at once, and deploy only from `main`. This is **continuous delivery** with a safety switch.',
    [
      ['Repo → Settings → Environments → New: production\n  Required reviewers: you\n  Deployment branches: main', 'Create the environment and require a human approval.'],
      ['deploy-staging:\n  needs: build\n  environment: staging\n  if: github.ref == \'refs/heads/main\'', 'Deploys automatically, but only for the `main` branch.'],
      ['deploy-production:\n  needs: deploy-staging\n  environment: production', 'The job waits for approval because the `production` environment has required reviewers.'],
      ['concurrency:\n  group: deploy-${{ github.ref }}\n  cancel-in-progress: false', 'Only one deploy per branch at a time. `cancel-in-progress: false` queues instead of killing a running deploy.'],
      ['- run: ./scripts/deploy.sh "$IMAGE"\n  env:\n    IMAGE: ghcr.io/${{ github.repository }}:${{ github.sha }}\n    TOKEN: ${{ secrets.DEPLOY_TOKEN }}', 'The deploy script gets the **exact image** that was built and tested. `DEPLOY_TOKEN` is stored in the environment, so staging and production use different secrets.', 'bash'],
    ],
    'build            ✓\ndeploy-staging   ✓  → https://staging.example.com\ndeploy-production  ⏸  Waiting for approval from you…   [Review deployments]',
    ['Auto-deploying every branch to production. Restrict with the branch rule and the `if:` condition.', 'Using the same secrets everywhere: put production secrets in the **production environment** only.', 'No health check after deploy: a broken release goes unnoticed. Add a smoke test (lesson 13).'],
    '.github/workflows/deploy.yml',
    `name: Deploy
on:
  push:
    branches: [main]

concurrency:
  group: deploy-\${{ github.ref }}
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      image: ghcr.io/\${{ github.repository }}:\${{ github.sha }}
    steps:
      - run: echo "build and push the image here (lesson 9)"

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - run: ./scripts/deploy.sh "\${{ needs.build.outputs.image }}"
        env:
          TOKEN: \${{ secrets.DEPLOY_TOKEN }}

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production        # requires an approval
    steps:
      - run: ./scripts/deploy.sh "\${{ needs.build.outputs.image }}"
        env:
          TOKEN: \${{ secrets.DEPLOY_TOKEN }}`,
    'Push to main, then click "Review deployments" on the run page'),

  L(11, 'Reusable workflows and composite actions', 'Write a pipeline once and share it between repositories.',
    'When ten repositories need the same test job, copy-pasting is a maintenance nightmare. A **reusable workflow** is a normal workflow with `on: workflow_call`; other workflows call it with `uses:` and pass **inputs** and **secrets**. A **composite action** does the same for a group of steps inside a job.',
    [
      ['# .github/workflows/node-test.yml\non:\n  workflow_call:\n    inputs:\n      node-version:\n        type: string\n        default: "20"', 'The shared workflow. `workflow_call` makes it callable and `inputs` are its parameters.'],
      ['    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: ${{ inputs.node-version }}\n      - run: npm ci && npm test', 'Uses the input inside the steps.'],
      ['# caller\njobs:\n  tests:\n    uses: ./.github/workflows/node-test.yml\n    with:\n      node-version: "22"', 'Calls it from the same repo. For another repo write `uses: my-org/shared/.github/workflows/node-test.yml@v1`.'],
      ['secrets: inherit', 'Passes the caller\'s secrets to the reusable workflow.'],
      ['# .github/actions/setup/action.yml\nruns:\n  using: composite\n  steps:\n    - uses: actions/setup-node@v4\n      with: { node-version: 20, cache: npm }\n    - run: npm ci\n      shell: bash', 'A **composite action**: several steps packaged as one reusable `uses: ./.github/actions/setup`.'],
    ],
    'tests / test   ✓   (called workflow shown as a nested job)',
    ['Forgetting `shell: bash` on `run` steps inside a composite action: it is required there.', 'Changing a shared workflow without versioning: every repo breaks at once. Call it by a **tag** (`@v1`) or SHA.', 'Nesting reusable workflows deeply: there is a limit and it gets hard to read.'],
    '.github/workflows/node-test.yml',
    `name: Node tests (reusable)
on:
  workflow_call:
    inputs:
      node-version:
        type: string
        default: "20"

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ inputs.node-version }}
          cache: npm
      - run: npm ci
      - run: npm test`,
    'Create a second workflow that calls it with "uses:"'),

  L(12, 'Quality gates: lint, coverage and required checks', 'Stop bad code from being merged.',
    'A **quality gate** is a check that must pass before code can merge. Combine fast checks (lint, format, type-check, unit tests) with a **coverage threshold**, and turn them into **required status checks** with **branch protection**, so nobody (not even you on a Friday evening) can merge a red build. Cancel outdated runs so the queue stays short.',
    [
      ['- run: npm run lint\n- run: npm test\n- run: npx c8 --check-coverage --lines 80 npm test', 'Lint, tests and a gate: the last command **fails** if less than 80% of lines are covered.', 'bash'],
      ['concurrency:\n  group: ci-${{ github.ref }}\n  cancel-in-progress: true', 'When you push again, the old run on the same branch is cancelled. Saves minutes and shows only the latest result.'],
      ['Repo → Settings → Branches → Add rule for "main"\n  ☑ Require a pull request before merging\n  ☑ Require status checks to pass: "test", "lint"\n  ☑ Require branches to be up to date', 'Branch protection: **this** is what enforces the gate. A workflow alone cannot block a merge.'],
      ['  ☑ Require approvals: 1\n  ☑ Do not allow bypassing the above settings', 'Add a human review and make the rule apply to admins too.'],
    ],
    'Pull request #14\n  ✓ lint\n  ✓ test (coverage 86%)\n  Merging is blocked until all required checks pass and 1 review approves',
    ['Having checks but not marking them **required**: people can merge red builds.', 'Chasing 100% coverage. A threshold like 70–85% on important code is healthier than gaming the number.', 'Slow gates (20+ minutes): people stop waiting and work around them. Keep the PR pipeline fast; run slow tests nightly.'],
    '.github/workflows/ci.yml',
    `name: CI
on:
  pull_request:
    branches: [main]

concurrency:
  group: ci-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run lint --if-present

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npx c8 --check-coverage --lines 80 npm test`,
    'Open a pull request and look at the "Checks" section'),

  L(13, 'Deployment strategies and rollback', 'Release safely: rolling, blue-green and canary, with a way back.',
    'How you release matters as much as what you release. **Rolling** replaces servers a few at a time. **Blue-green** runs the new version beside the old one and switches traffic at once (instant rollback by switching back). **Canary** sends a small share of users (5%) to the new version first and watches errors before sending more. Always end a deploy with a **health check** and know the **rollback** command.',
    [
      ['kubectl set image deployment/web web=ghcr.io/you/demo-app:${GITHUB_SHA}', 'Starts a Kubernetes **rolling update**: new pods start, old ones stop gradually.', 'bash'],
      ['kubectl rollout status deployment/web --timeout=120s', 'Waits until the rollout succeeds. The command fails (and so does the pipeline) if pods never become ready.', 'bash'],
      ['curl --fail --retry 5 --retry-delay 3 https://app.example.com/health', 'A **smoke test**: if the health endpoint is not OK, the job fails.', 'bash'],
      ['- name: Roll back on failure\n  if: failure()\n  run: kubectl rollout undo deployment/web', '`if: failure()` runs only when an earlier step failed: automatic **rollback** to the previous version.'],
      ['# canary: two deployments behind one service\nweb-stable  replicas: 19   (v1)\nweb-canary  replicas: 1    (v2)  → ~5% of traffic', 'A simple canary: 1 of 20 pods runs the new version. Watch the error rate, then scale canary up (or delete it).', 'yaml'],
    ],
    'deployment "web" successfully rolled out\nhealth: {"status":"ok","version":"3f9c2ab"}\n(if health fails → kubectl rollout undo → previous version restored)',
    ['Deploying with no health check and no rollback plan: "hope" is not a strategy.', 'Database changes that break the **old** version during a rolling or blue-green release. Make migrations backward compatible (add first, remove later).', 'Canary with no metrics: you cannot tell whether the new version is worse.'],
    '.github/workflows/deploy.yml',
    `name: Deploy to Kubernetes
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - name: Set new image
        run: kubectl set image deployment/web web=ghcr.io/\${{ github.repository }}:\${{ github.sha }}
      - name: Wait for rollout
        run: kubectl rollout status deployment/web --timeout=120s
      - name: Smoke test
        run: curl --fail --retry 5 --retry-delay 3 https://app.example.com/health
      - name: Roll back on failure
        if: failure()
        run: kubectl rollout undo deployment/web`,
    'Try the "Canary rollout" lab on this topic\'s Playground tab'),

  L(14, 'Pipeline security', 'Least privilege, pinned actions, OIDC and dependency scanning.',
    'A pipeline can deploy to production, so it is a high-value target. Good habits: give the token **minimum permissions**, **pin third-party actions** to a commit SHA (a tag can be moved), avoid long-lived cloud keys by using **OIDC** (short-lived tokens), and scan for **vulnerable dependencies**, **secrets** and insecure code on every change.',
    [
      ['permissions:\n  contents: read', 'Set at the top of the workflow: the default `GITHUB_TOKEN` becomes read-only. Grant more (like `packages: write`) only to the job that needs it.'],
      ['- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11   # v4.1.1', 'Pin an action to a **full commit SHA** so a hijacked tag cannot change what runs. Dependabot can update the SHA for you.'],
      ['permissions:\n  id-token: write\n  contents: read\n\n- uses: aws-actions/configure-aws-credentials@v4\n  with:\n    role-to-assume: arn:aws:iam::123456789012:role/gh-deploy\n    aws-region: eu-west-1', '**OIDC**: GitHub proves its identity to AWS/Azure/GCP and receives a **temporary** credential. No stored cloud keys to leak.'],
      ['# .github/dependabot.yml\nversion: 2\nupdates:\n  - package-ecosystem: npm\n    directory: "/"\n    schedule: { interval: weekly }\n  - package-ecosystem: github-actions\n    directory: "/"\n    schedule: { interval: weekly }', 'Dependabot opens pull requests for outdated or vulnerable packages **and actions**.'],
      ['- uses: github/codeql-action/init@v3\n  with: { languages: javascript }\n- uses: github/codeql-action/analyze@v3', '**CodeQL** (static analysis, SAST) finds security bugs in your code on every pull request.'],
    ],
    'Security tab → Code scanning: 0 alerts\nDependabot: 2 pull requests opened (1 security update)',
    ['Using `pull_request_target` carelessly: it runs with secrets on code from forks. Avoid checking out untrusted code in it.', 'Printing secrets in logs or passing user-controlled text (issue titles, branch names) directly into `run:` scripts: **script injection**. Pass them through `env:` instead.', 'Long-lived cloud keys stored as secrets when OIDC is available.'],
    '.github/workflows/security.yml',
    `name: Security
on:
  pull_request:
  schedule:
    - cron: "0 3 * * 1"

permissions:
  contents: read
  security-events: write

jobs:
  codeql:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v3
        with:
          languages: javascript
      - uses: github/codeql-action/analyze@v3

  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm audit --audit-level=high`,
    'Open a pull request and check the Security tab'),

  L(15, 'Capstone: a complete pipeline', 'Put it all together: test, build an image, deploy to staging, approve, deploy to production.',
    'This is the pipeline a real team would use: **PRs** run lint and tests in a matrix and stop there. A merge to **main** builds one Docker image tagged with the commit, deploys it to **staging**, runs a smoke test, waits for a **human approval**, then deploys the **same image** to **production** and rolls back automatically if the health check fails.',
    [
      ['on: pull_request / push to main', 'One file, two behaviours: pull requests only run the **quality** jobs; the **deploy** jobs have `if: github.ref == \'refs/heads/main\'`.', 'yaml'],
      ['jobs: lint ─┐\n      test (matrix) ─┴→ build-image → deploy-staging → (approve) → deploy-production', 'The shape of the pipeline: parallel checks, then one build, then two environments.', 'plaintext'],
      ['needs: [lint, test]\nneeds: build-image\nneeds: deploy-staging', 'Each stage waits for the previous one, so a failure anywhere stops the release.', 'yaml'],
      ['environment: production   # required reviewers\nif: failure() → rollout undo', 'Approval before production, and an automatic rollback if the smoke test fails.', 'yaml'],
    ],
    'PR: lint ✓  test (18,20,22) ✓   → mergeable\nmain: build-image ✓ → staging ✓ → ⏸ approval → production ✓ → smoke test ✓',
    ['Copying this without tests: a pipeline is only as good as the checks inside it.', 'Different builds for staging and production: build **once**, promote the same artifact.', 'Forgetting to protect `main`: required checks and reviews turn this pipeline into a real safety net.'],
    '.github/workflows/pipeline.yml',
    `name: Pipeline
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

concurrency:
  group: pipeline-\${{ github.ref }}
  cancel-in-progress: \${{ github.event_name == 'pull_request' }}

permissions:
  contents: read

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run lint --if-present

  test:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        node: [18, 20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ matrix.node }}
          cache: npm
      - run: npm ci
      - run: npm test

  build-image:
    if: github.ref == 'refs/heads/main'
    needs: [lint, test]
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    outputs:
      image: ghcr.io/\${{ github.repository }}:\${{ github.sha }}
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: ghcr.io/\${{ github.repository }}:\${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    needs: build-image
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - run: ./scripts/deploy.sh "\${{ needs.build-image.outputs.image }}" staging
      - run: curl --fail --retry 5 --retry-delay 3 https://staging.example.com/health

  deploy-production:
    needs: [build-image, deploy-staging]
    runs-on: ubuntu-latest
    environment: production        # required reviewers = manual approval
    steps:
      - run: ./scripts/deploy.sh "\${{ needs.build-image.outputs.image }}" production
      - run: curl --fail --retry 5 --retry-delay 3 https://app.example.com/health
      - if: failure()
        run: ./scripts/rollback.sh production`,
    'Open a PR, merge it, then approve the production deployment'),
];
