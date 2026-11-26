// Diagrams for the n8n and CI/CD topics (generators come from diagrams.mjs).

export function devopsDiagrams({ flow, cycle, hub, compare }) {
  return {
    // ---------- n8n ----------
    'n8n-flow': () => flow({ title: 'An n8n workflow', caption: 'a trigger starts it, nodes do the work, data flows along the lines', perRow: 5, steps: [
      { i: '⚡', t: 'Trigger', s: 'webhook, schedule, app event', c: '#ea4b71' }, { i: '🌐', t: 'Get data', s: 'HTTP Request, database, app node' }, { i: '🧮', t: 'Transform', s: 'Edit Fields, Code' }, { i: '🔀', t: 'Decide', s: 'IF / Switch' }, { i: '📤', t: 'Act', s: 'Slack, email, CRM, database' }] }),
    'n8n-items': () => flow({ title: 'Items: a list of JSON objects', caption: 'most nodes run once per item; Aggregate turns many items back into one', perRow: 4, steps: [
      { i: '🪝', t: 'Webhook', s: '1 item' }, { i: '🌐', t: 'HTTP Request', s: 'returns 10 items' }, { i: '🧮', t: 'Edit Fields', s: 'runs 10 times (once per item)' }, { i: '📦', t: 'Aggregate', s: 'back to 1 item with a list' }] }),
    'n8n-webhook-urls': () => compare({ title: 'Test URL vs Production URL', left: { icon: '🧪', title: 'Test URL', c: '#f59e0b', items: ['/webhook-test/<path>', 'works while you click "Listen"', 'data shown on the canvas', 'used while building'] }, right: { icon: '🚀', title: 'Production URL', c: '#10b981', items: ['/webhook/<path>', 'works when the workflow is Active', 'runs saved in Executions', 'used by real services'] } }),
    'n8n-errors': () => flow({ title: 'Error handling in layers', perRow: 4, steps: [
      { i: '🔁', t: 'Retry On Fail', s: '3 tries, wait 2 s' }, { i: '↪️', t: 'Error output', s: 'continue with the other items' }, { i: '🚨', t: 'Error Workflow', s: 'Error Trigger → alert' }, { i: '🔎', t: 'Fix + re-run', s: 'open the execution, retry' }] }),
    'n8n-queue': () => hub({ title: 'Queue mode (scaling n8n)', caption: 'the main instance queues jobs in Redis; workers run them; Postgres stores everything', center: { i: '🎛️', t: 'Main instance', s: 'editor + triggers', c: '#ea4b71' }, spokes: [
      { i: '🔴', t: 'Redis queue', s: 'executions waiting' }, { i: '⚙️', t: 'Worker 1', s: 'runs workflows' }, { i: '⚙️', t: 'Worker 2', s: 'runs workflows' }, { i: '🐘', t: 'PostgreSQL', s: 'workflows + results' }] }),
    'n8n-vs': () => compare({ title: 'n8n vs cloud-only tools', vs: 'vs', left: { icon: '⚙️', title: 'n8n', c: '#ea4b71', items: ['self-host or cloud', 'full JavaScript / Python', 'data stays on your server', 'cost grows with servers'] }, right: { icon: '☁️', title: 'Zapier / Make', c: '#64748b', items: ['cloud only', 'limited code steps', 'data passes through their cloud', 'cost grows per task'] } }),
    'n8n-approval': () => flow({ title: 'Human approval with Wait', caption: 'the run pauses safely until a person clicks (even across restarts)', perRow: 5, steps: [
      { i: '🤖', t: 'Workflow proposes', s: 'refund $79' }, { i: '💬', t: 'Send message', s: 'Approve / Reject links' }, { i: '⏸️', t: 'Wait node', s: 'resume on webhook' }, { i: '🖱️', t: 'Person clicks', s: 'calls the resume URL' }, { i: '✅', t: 'Continue', s: 'IF approved → act' }] }),
    // ---------- CI/CD ----------
    'ci-vs-cd': () => compare({ title: 'Delivery vs Deployment', vs: 'vs', left: { icon: '📦', title: 'Continuous Delivery', c: '#3b82f6', items: ['every change is release-ready', 'a person approves production', 'safe for regulated teams', 'one click to ship'] }, right: { icon: '🚀', title: 'Continuous Deployment', c: '#10b981', items: ['every passing change ships', 'no manual approval', 'needs strong tests + monitoring', 'many releases per day'] } }),
    'cicd-pipeline': () => flow({ title: 'A typical CI/CD pipeline', caption: 'each stage must pass before the next starts', perRow: 5, steps: [
      { i: '📝', t: 'Commit / PR', s: 'push code' }, { i: '🔨', t: 'Build', s: 'compile, bundle, image' }, { i: '🧪', t: 'Test', s: 'lint, unit, coverage' }, { i: '🛡️', t: 'Scan', s: 'SAST, deps, secrets' }, { i: '📦', t: 'Publish', s: 'versioned artifact' },
      { i: '🎭', t: 'Staging', s: 'deploy + smoke tests' }, { i: '✋', t: 'Approve', s: 'person or policy' }, { i: '🚀', t: 'Production', s: 'rolling / canary' }, { i: '📈', t: 'Monitor', s: 'health + metrics' }, { i: '↩️', t: 'Rollback', s: 'if checks fail', c: '#ef4444' }] }),
    'gha-anatomy': () => hub({ title: 'GitHub Actions: the parts', caption: 'an event starts a workflow; jobs run on runners; steps run commands or actions', center: { i: '📄', t: 'Workflow', s: '.github/workflows/ci.yml', c: '#0ea5e9' }, spokes: [
      { i: '⚡', t: 'Event', s: 'push, pull_request, schedule' }, { i: '🧱', t: 'Jobs', s: 'parallel, or needs: other jobs' }, { i: '👣', t: 'Steps', s: 'run: command or uses: action' }, { i: '🖥️', t: 'Runner', s: 'fresh Ubuntu / Windows VM' }, { i: '🧩', t: 'Actions', s: 'checkout, setup-node, …' }] }),
    'gha-needs': () => flow({ title: 'Jobs wait with needs:', caption: 'lint and test run in parallel; later jobs only start if they succeed', perRow: 5, steps: [
      { i: '🧹', t: 'lint', s: 'parallel' }, { i: '🧪', t: 'test', s: 'parallel' }, { i: '🔨', t: 'build', s: 'needs: [lint, test]' }, { i: '🎭', t: 'deploy-staging', s: 'needs: build' }, { i: '🚀', t: 'deploy-production', s: 'needs staging + approval' }] }),
    'gha-cache': () => flow({ title: 'How a cache saves time', perRow: 5, steps: [
      { i: '🔑', t: 'Compute key', s: 'hash of package-lock.json' }, { i: '📥', t: 'Restore cache', s: 'hit → files back in seconds' }, { i: '📦', t: 'npm ci', s: 'only downloads what is missing' }, { i: '🧪', t: 'Run tests', s: '' }, { i: '💾', t: 'Save cache', s: 'on a miss, for next time' }] }),
    'docker-ci': () => flow({ title: 'Build once, deploy the same image', perRow: 5, steps: [
      { i: '📜', t: 'Dockerfile', s: 'multi-stage build' }, { i: '🔨', t: 'docker build', s: 'layers cached' }, { i: '🏷️', t: 'Tag with SHA', s: 'ghcr.io/you/app:3f9c2ab' }, { i: '📦', t: 'Push to registry', s: 'GHCR / ECR / Docker Hub' }, { i: '🚀', t: 'Deploy by tag', s: 'same image everywhere' }] }),
    'blue-green': () => hub({ title: 'Blue-green deployment', caption: 'switch the router to green; roll back by switching back', center: { i: '🔀', t: 'Router', s: 'load balancer', c: '#0ea5e9' }, spokes: [
      { i: '🔵', t: 'Blue (v1)', s: 'live now', c: '#3b82f6' }, { i: '🟢', t: 'Green (v2)', s: 'new, tested, idle', c: '#10b981' }, { i: '👥', t: 'Users', s: 'follow the router' }, { i: '↩️', t: 'Rollback', s: 'switch back instantly' }] }),
    'deploy-compare': () => compare({ title: 'Blue-green vs canary', vs: 'vs', left: { icon: '🔵🟢', title: 'Blue-green', c: '#3b82f6', items: ['two full environments', 'switch all traffic at once', 'instant rollback', 'needs double capacity'] }, right: { icon: '🐤', title: 'Canary', c: '#f59e0b', items: ['1–10% of users first', 'watch errors and latency', 'increase step by step', 'needs metrics + traffic split'] } }),
    'rollback': () => flow({ title: 'Safe release with automatic rollback', perRow: 5, steps: [
      { i: '🚀', t: 'Deploy new version', s: 'image :3f9c2ab' }, { i: '❤️', t: 'Health check', s: '/health + error rate' }, { i: '✅', t: 'Healthy?', s: 'yes → keep it', c: '#10b981' }, { i: '❌', t: 'Unhealthy', s: 'alarm fires', c: '#ef4444' }, { i: '↩️', t: 'kubectl rollout undo', s: 'previous image restored' }] }),
    'gitops': () => flow({ title: 'GitOps: Git is the source of truth', caption: 'a controller inside the cluster pulls and applies what Git says', perRow: 5, steps: [
      { i: '🔀', t: 'Merge a PR', s: 'change image tag' }, { i: '📚', t: 'Git repo', s: 'desired state (manifests)' }, { i: '🐙', t: 'Argo CD / Flux', s: 'watches the repo' }, { i: '☸️', t: 'Cluster updated', s: 'pull, no CI credentials' }, { i: '🔍', t: 'Drift fixed', s: 'cluster matches Git again' }] }),
    'dora': () => hub({ title: 'The four DORA metrics', caption: 'how well your team delivers software', center: { i: '📊', t: 'DORA', s: 'delivery performance', c: '#0ea5e9' }, spokes: [
      { i: '📅', t: 'Deployment frequency', s: 'how often you ship' }, { i: '⏱️', t: 'Lead time', s: 'commit → production' }, { i: '💥', t: 'Change failure rate', s: '% of bad releases' }, { i: '🩹', t: 'Time to restore', s: 'how fast you recover' }] }),
    'devsecops': () => flow({ title: 'Security inside the pipeline (shift left)', perRow: 4, steps: [
      { i: '🔑', t: 'Secret scan', s: 'gitleaks' }, { i: '📚', t: 'Dependency scan', s: 'SCA: Dependabot, audit' }, { i: '🧬', t: 'SAST', s: 'CodeQL, SonarQube' }, { i: '🐳', t: 'Image scan', s: 'Trivy, Grype' }, { i: '🏗️', t: 'IaC scan', s: 'Checkov, tfsec' }, { i: '🎭', t: 'Deploy to staging', s: '' }, { i: '🕷️', t: 'DAST', s: 'OWASP ZAP' }, { i: '🚀', t: 'Release', s: 'signed + SBOM' }] }),
    'oidc': () => flow({ title: 'OIDC: no stored cloud keys', caption: 'GitHub proves who it is and receives a short-lived credential', perRow: 5, steps: [
      { i: '▶️', t: 'Workflow runs', s: 'permissions: id-token: write' }, { i: '🪪', t: 'GitHub issues a token', s: 'signed JWT with repo + branch' }, { i: '☁️', t: 'Cloud verifies it', s: 'trust policy for your repo' }, { i: '🎫', t: 'Temporary credentials', s: 'valid minutes, not forever' }, { i: '🚀', t: 'Deploy', s: 'nothing secret stored' }] }),
    'iac-flow': () => flow({ title: 'Infrastructure as Code in the pipeline', perRow: 5, steps: [
      { i: '🔀', t: 'Pull request', s: 'edit Terraform' }, { i: '📋', t: 'terraform plan', s: 'shown in the PR' }, { i: '👀', t: 'Review', s: 'humans read the plan' }, { i: '🔒', t: 'Merge + approve', s: 'production needs approval' }, { i: '🏗️', t: 'terraform apply', s: 'remote state + locking' }] }),
  };
}

export const DEVOPS_RULES = {
  n8n: [
    [/What is n8n, in one minute/, 'n8n-flow'], [/n8n vs Zapier/, 'n8n-vs'], [/How does data flow: items/, 'n8n-items'], [/test and production webhook URL/, 'n8n-webhook-urls'],
    [/How do you handle errors in n8n/, 'n8n-errors'], [/queue mode/, 'n8n-queue'], [/human approval/, 'n8n-approval'],
    [/^2\. Your first workflow/, 'n8n-flow'], [/^3\. Items and JSON/, 'n8n-items'], [/^8\. Webhook trigger/, 'n8n-webhook-urls'], [/^14\. Error workflows/, 'n8n-errors'], [/^17\. Go to production/, 'n8n-queue'],
  ],
  cicd: [
    [/CI, continuous delivery/, 'ci-vs-cd'], [/typical CI\/CD pipeline/, 'cicd-pipeline'], [/parts of GitHub Actions/, 'gha-anatomy'], [/^2\. Your first GitHub/, 'gha-anatomy'], [/^4\. Jobs and/, 'gha-needs'],
    [/^6\. Caching/, 'gha-cache'], [/^9\. Build and push/, 'docker-ci'], [/^10\. Deploy with/, 'gha-needs'], [/Blue-green vs canary/, 'deploy-compare'], [/Blue-green vs canary/, 'blue-green'],
    [/^13\. Deployment strategies/, 'blue-green'], [/roll back safely/, 'rollback'], [/What is GitOps/, 'gitops'], [/DORA/, 'dora'], [/DevSecOps/, 'devsecops'], [/^14\. Pipeline security/, 'oidc'],
    [/Infrastructure as Code/, 'iac-flow'], [/^15\. Capstone/, 'cicd-pipeline'],
  ],
};
