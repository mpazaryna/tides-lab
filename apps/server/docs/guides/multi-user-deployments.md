# Multi-User Deployments Guide

## Overview

This guide explains how to enable multiple team members to deploy Tides to Cloudflare Workers while maintaining security, consistency, and proper access controls.

## Prerequisites

- Cloudflare account with Workers plan
- GitHub repository access for team members
- Understanding of Cloudflare API tokens and permissions

## Deployment Architecture

### Environment Strategy

Tides uses a three-environment deployment model that supports multi-user collaboration:

| Environment           | Purpose                                 | Access Level    | URL Pattern                        |
| --------------------- | --------------------------------------- | --------------- | ---------------------------------- |
| **Development** (003) | Individual testing, feature development | All developers  | `tides-003-[username].workers.dev` |
| **Staging** (002)     | Integration testing, QA                 | Developers + QA | `tides-002.mpazbot.workers.dev`    |
| **Production** (001)  | Live production system                  | Team leads only | `tides-001.mpazbot.workers.dev`    |

### Multi-User Environment Naming

For development environments, use personal worker names:

```bash
# Each developer gets their own development worker
tides-003-mason.workers.dev
tides-003-matthew.workers.dev
```

## Setup Methods

### Quick Decision Guide

**Choose GitHub Actions if:**

- You want automated PR previews and staging deployments
- You prefer not to share Cloudflare account access
- You want CI/CD for development/staging (but can still deploy prod manually)
- You have a GitHub repository

**Choose Local Deployment if:**

- Developers need direct deployment control
- You want faster iteration without CI/CD
- You prefer manual control, especially for production
- You're comfortable with either:
  - Adding team members to your Cloudflare account (Option A)
  - Creating and managing API tokens for each person (Option B)

**Note:** Many teams use a hybrid approach - GitHub Actions for dev/staging, manual for production

### Method 1: GitHub Actions (Recommended)

#### 1. Repository Setup

**Add team members to your GitHub repository:**

1. Go to repository **Settings** → **Collaborators**
2. Add team members with appropriate permissions:
   - **Developers**: Write access
   - **Reviewers**: Admin access for production deployments

#### 2. Environment Secrets

Configure these secrets in **Settings** → **Secrets and variables** → **Actions**:

```bash
# Required for all environments
CLOUDFLARE_API_TOKEN=<team-token>
CLOUDFLARE_ACCOUNT_ID=<account-id>

# Database URLs for each environment
DATABASE_URL_DEV=<development-db-url>
DATABASE_URL_STAGING=<staging-db-url>
DATABASE_URL_PROD=<production-db-url>
```

#### 3. GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Tides

on:
  workflow_dispatch:
    inputs:
      environment:
        description: "Deployment environment"
        required: true
        default: "dev"
        type: choice
        options:
          - dev
          - staging
          - prod
      developer:
        description: "Developer name (for dev environments only)"
        required: false
        default: ""

  push:
    branches:
      - main
    paths:
      - "src/**"
      - "wrangler.toml"

  pull_request:
    types: [opened, synchronize]
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy Tides
    permissions:
      contents: read
      deployments: write
      pull-requests: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm

      - name: Install dependencies
        run: npm install

      - name: Run tests
        run: npm run test

      - name: Determine deployment target
        id: deploy-target
        run: |
          if [[ "${{ github.event_name }}" == "workflow_dispatch" ]]; then
            ENV="${{ github.event.inputs.environment }}"
            DEV_NAME="${{ github.event.inputs.developer }}"
          elif [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
            ENV="staging"
            DEV_NAME=""
          elif [[ "${{ github.event_name }}" == "pull_request" ]]; then
            ENV="dev"
            DEV_NAME="${{ github.actor }}"
          fi

          if [[ "$ENV" == "dev" && -n "$DEV_NAME" ]]; then
            WORKER_NAME="tides-003-${DEV_NAME}"
          elif [[ "$ENV" == "staging" ]]; then
            WORKER_NAME="tides-002"
          elif [[ "$ENV" == "prod" ]]; then
            WORKER_NAME="tides-001"
          else
            WORKER_NAME="tides-003"
          fi

          echo "environment=$ENV" >> $GITHUB_OUTPUT
          echo "worker_name=$WORKER_NAME" >> $GITHUB_OUTPUT
          echo "dev_name=$DEV_NAME" >> $GITHUB_OUTPUT

      - name: Deploy to Cloudflare
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy --name ${{ steps.deploy-target.outputs.worker_name }} --env ${{ steps.deploy-target.outputs.environment }}
        env:
          DATABASE_URL: ${{ steps.deploy-target.outputs.environment == 'prod' && secrets.DATABASE_URL_PROD || steps.deploy-target.outputs.environment == 'staging' && secrets.DATABASE_URL_STAGING || secrets.DATABASE_URL_DEV }}

      - name: Comment PR with deployment URL
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const workerName = '${{ steps.deploy-target.outputs.worker_name }}';
            const url = `https://${workerName}.mpazbot.workers.dev`;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `🚀 **Preview Deployment Ready**\n\nYour changes have been deployed to: ${url}\n\n**Test API:**\n\`\`\`bash\ncurl -X POST "${url}/mcp" \\\n  -H "Authorization: Bearer tides_testuser_001" \\\n  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}'\n\`\`\``
            });
```

#### 4. Protection Rules

Set up branch protection in **Settings** → **Branches**:

- **Require pull request reviews** before merging to main
- **Require status checks** (tests must pass)
- **Restrict pushes** to main branch

### Method 2: Individual API Tokens (Local Deployment)

For local deployments, you have two options:

#### Option A: Shared Cloudflare Account (Team Access)

**The account owner adds team members to Cloudflare:**

1. Account owner goes to **Cloudflare Dashboard** → **Manage Account** → **Members**
2. Click **Invite** → Enter colleague's email
3. Set role permissions:
   - **Super Administrator** - Full access (for DevOps/Team Leads)
   - **Administrator** - Deploy to all environments
   - **Cloudflare Workers Admin** - Deploy workers only (recommended for developers)
   - **Cloudflare Workers Edit** - Deploy to specific workers
4. Team member accepts invite and can deploy using their own login

#### Option B: Scoped API Tokens (No Account Access)

**The account owner creates and shares scoped API tokens:**

1. Account owner creates tokens at [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click **Create Token** → **Custom token**
3. Configure permissions per team member:

   ```
   For Developers (dev environment only):
   - Account: <Your Account> - Cloudflare Workers Scripts:Edit
   - Specific Worker: tides-003-[developer-name]

   For Senior Developers (dev + staging):
   - Account: <Your Account> - Cloudflare Workers Scripts:Edit
   - Specific Workers: tides-003-*, tides-002

   For Team Leads (all environments):
   - Account: <Your Account> - Cloudflare Workers Scripts:Edit
   - All Workers: tides-*
   ```

4. Set IP restrictions if desired
5. Share token securely with team member

#### Local Environment Setup

Regardless of which option above, each developer sets up their local environment:

```bash
# Clone the repository
git clone <repository-url>
cd tides

# Install dependencies
npm install

# Authenticate with Cloudflare (choose one):

# Option A: If you have Cloudflare account access
npx wrangler login

# Option B: If you were given an API token
export CLOUDFLARE_API_TOKEN=<provided-api-token>

# Set up local environment
cp .env.example .dev.vars
# Edit .dev.vars with your development database URL
```

#### Personal Development Deployments

Each developer deploys to their personal development environment:

```bash
# Deploy to personal development environment
npx wrangler deploy --name tides-003-yourname --env dev

# Test the deployment
curl -X POST "https://tides-003-yourname.mpazbot.workers.dev/mcp" \
  -H "Authorization: Bearer tides_testuser_001" \
  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}'
```

## Wrangler Configuration

### Environment-Specific Configuration

Update `wrangler.toml` to support multiple environments:

```toml
name = "tides-default"
main = "src/index.ts"
compatibility_date = "2025-06-17"
compatibility_flags = ["nodejs_compat"]

# Development environment
[env.dev]
name = "tides-003"
d1_databases = [
  { binding = "DB", database_name = "tides-003-db", database_id = "dev-database-id" }
]
r2_buckets = [
  { binding = "STORAGE", bucket_name = "tides-003-storage" }
]

# Staging environment
[env.staging]
name = "tides-002"
d1_databases = [
  { binding = "DB", database_name = "tides-002-db", database_id = "staging-database-id" }
]
r2_buckets = [
  { binding = "STORAGE", bucket_name = "tides-002-storage" }
]

# Production environment
[env.prod]
name = "tides-001"
d1_databases = [
  { binding = "DB", database_name = "tides-001-db", database_id = "prod-database-id" }
]
r2_buckets = [
  { binding = "STORAGE", bucket_name = "tides-001-storage" }
]

# Durable Objects
[[durable_objects.bindings]]
name = "HELLO_AGENT"
class_name = "HelloAgent"

[[durable_objects.bindings]]
name = "TIDE_PRODUCTIVITY_AGENT"
class_name = "TideProductivityAgent"

# Common migrations
[[migrations]]
tag = "v1"
new_classes = ["HelloAgent", "TideProductivityAgent"]
```

## Access Control & Security

### Role-Based Permissions

| Role                 | Development     | Staging   | Production | Database Access  |
| -------------------- | --------------- | --------- | ---------- | ---------------- |
| **Developer**        | ✅ Personal env | ❌        | ❌         | Dev only         |
| **Senior Developer** | ✅ Personal env | ✅ Deploy | ❌         | Dev + Staging    |
| **Team Lead**        | ✅ Personal env | ✅ Deploy | ✅ Deploy  | All environments |
| **DevOps**           | ✅ Admin        | ✅ Admin  | ✅ Admin   | All environments |

### API Token Security

- **Never commit API tokens** to version control
- **Use environment variables** in CI/CD
- **Set IP restrictions** on tokens when possible
- **Rotate tokens regularly** (quarterly)
- **Use minimal permissions** (principle of least privilege)

### Database Security

- **Separate databases** per environment
- **Different connection strings** for each environment
- **Backup production data** before deployments
- **Monitor database access** logs

## Deployment Workflows

### Feature Development Workflow

```bash
# 1. Create feature branch
git checkout -b feature/new-productivity-insights

# 2. Develop and test locally
npm run dev
npm run test

# 3. Deploy to personal development environment
npx wrangler deploy --name tides-003-yourname --env dev

# 4. Test deployed feature
./scripts/testing/test-productivity-agent-live.sh

# 5. Create pull request
git push origin feature/new-productivity-insights
# GitHub Actions automatically deploys preview environment

# 6. After review and merge, staging deployment happens automatically
```

### Staging Deployment

```bash
# Automatic on main branch push via GitHub Actions
# OR manual trigger via GitHub UI
# OR manual deployment:
npx wrangler deploy --env staging
```

### Production Deployment

```bash
# Manual deployment by team leads only (RECOMMENDED)
npx wrangler deploy --env prod

# Verify deployment
curl https://tides-001.mpazbot.workers.dev/health

# Or via GitHub Actions with approval
# (requires manual approval step - but manual is often safer)
```

**Why Manual Production Deployments Are Often Better:**

- **Full control** over timing and conditions
- **Ability to verify** staging thoroughly first
- **Immediate rollback** capability if issues arise
- **Peace of mind** knowing exactly what's being deployed
- **No surprises** from automated processes

## Database Management

### Environment Isolation

Each environment has isolated database resources:

```bash
# Development (multiple per developer)
tides-003-<developer>-db
tides-003-<developer>-storage

# Staging (shared)
tides-002-db
tides-002-storage

# Production (protected)
tides-001-db
tides-001-storage
```

### Schema Migrations

Run migrations per environment:

```bash
# Development
npx wrangler d1 migrations apply tides-003-db --env dev

# Staging
npx wrangler d1 migrations apply tides-002-db --env staging

# Production
npx wrangler d1 migrations apply tides-001-db --env prod
```

## Monitoring & Observability

### Deployment Tracking

Each deployment should include:

- **Git commit hash** in deployment metadata
- **Deployment timestamp**
- **Environment identifier**
- **Deployer information**

### Health Monitoring

```bash
# Monitor all environments
npm run monitor:simple  # Basic health check
npm run monitor:live    # Real-time logs
npm run monitor         # Full analytics (requires permissions)
```

### Error Tracking

- **Cloudflare Workers Analytics** for request metrics
- **Real-time tail logs** for debugging: `npx wrangler tail`
- **Custom logging** in application code
- **Alert setup** for production errors

## Team Onboarding Checklist

### New Developer Setup

- [ ] **GitHub repository access** (Write permission)
- [ ] **Cloudflare account access** (or personal API token)
- [ ] **Local development setup** completed
- [ ] **Personal development environment** deployed
- [ ] **Test suite** running successfully
- [ ] **Documentation review** completed

### Verification Steps

```bash
# 1. Verify local development
npm run dev
curl http://localhost:8787/health

# 2. Verify personal deployment
npx wrangler deploy --name tides-003-yourname --env dev
curl https://tides-003-yourname.mpazbot.workers.dev/health

# 3. Verify MCP functionality
./scripts/testing/test-productivity-agent-live.sh

# 4. Verify tests pass
npm run test
npm run test:e2e
```

## Troubleshooting

### Common Issues

| Issue                         | Cause                       | Solution                                  |
| ----------------------------- | --------------------------- | ----------------------------------------- |
| **403 Forbidden**             | API token lacks permissions | Update token permissions or regenerate    |
| **Worker name conflicts**     | Name already exists         | Use personal naming: `tides-003-yourname` |
| **Database connection fails** | Wrong environment variables | Check `.dev.vars` and secrets             |
| **Tests fail in CI**          | Environment differences     | Update GitHub Actions secrets             |

### Support Resources

- **[Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)**
- **[Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)**
- **[Team Slack/Discord]** - Internal support channel
- **[GitHub Issues]** - Bug reports and feature requests

## Best Practices

### Code Quality

- **Always run tests** before deployment
- **Use pull requests** for all changes
- **Require code reviews** for production deployments
- **Follow semantic versioning** for releases

### Security

- **Rotate API tokens** quarterly
- **Use separate databases** per environment
- **Never share production credentials**
- **Monitor access logs** regularly

### Performance

- **Test performance** in staging before production
- **Monitor resource usage** across environments
- **Use appropriate Worker memory limits**
- **Implement proper caching** strategies

---

_This guide ensures secure, efficient multi-user deployment workflows while maintaining environment isolation and proper access controls._
