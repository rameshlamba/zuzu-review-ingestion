# CI/CD Pipeline Setup

## Overview

This repository includes a comprehensive CI/CD pipeline using GitHub Actions that provides automated testing, security scanning, building, and deployment for the Review System Microservice.

## 🚀 Workflows

### 1. Main CI/CD Pipeline (`ci-cd.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main`

**Jobs:**
- **Test & Lint**: Runs unit tests, linting, and type checking
- **Security Scan**: Performs security audits and vulnerability scanning
- **Build**: Creates and pushes Docker images to GitHub Container Registry
- **Deploy Staging**: Deploys to staging environment (develop branch)
- **Deploy Production**: Deploys to production environment (main branch)
- **Notify**: Sends deployment notifications

### 2. Dependency Updates (`dependency-update.yml`)

**Triggers:**
- Weekly schedule (Mondays at 9 AM UTC)
- Manual dispatch

**Features:**
- Automatically updates npm dependencies
- Applies security fixes
- Creates pull requests with changes
- Runs tests to ensure compatibility

### 3. Database Migration (`database-migration.yml`)

**Triggers:**
- Manual dispatch with environment selection

**Features:**
- Run migrations in staging/production
- Revert migrations if needed
- Show migration status
- Environment-specific configuration

### 4. Performance Testing (`performance-test.yml`)

**Triggers:**
- Daily schedule (2 AM UTC)
- Push to main (when source code changes)
- Manual dispatch

**Features:**
- Load testing with k6
- Performance benchmarking
- Resource usage monitoring
- Performance report generation

### 5. Release Management (`release.yml`)

**Triggers:**
- Git tags (v*)

**Features:**
- Automated changelog generation
- Docker image tagging
- GitHub release creation
- Release notifications

### 6. Code Quality (`code-quality.yml`)

**Triggers:**
- Push to main/develop
- Pull requests to main

**Features:**
- ESLint and Prettier checks
- TypeScript compilation
- SonarCloud analysis
- Documentation generation

## 🔧 Setup Instructions

### 1. GitHub Repository Secrets

Add these secrets to your GitHub repository (`Settings > Secrets and variables > Actions`):

#### Required Secrets:
```
GITHUB_TOKEN          # Automatically provided by GitHub
```

#### Optional Secrets (for enhanced features):
```
SNYK_TOKEN           # Snyk security scanning
SONAR_TOKEN          # SonarCloud code quality
SLACK_WEBHOOK        # Slack notifications
```

#### Environment-Specific Secrets:
For staging and production environments, add:
```
DB_HOST              # Database host
DB_PORT              # Database port  
DB_USERNAME          # Database username
DB_PASSWORD          # Database password
DB_NAME              # Database name
AWS_ACCESS_KEY_ID    # AWS access key
AWS_SECRET_ACCESS_KEY # AWS secret key
```

### 2. GitHub Environments

Create environments in your repository (`Settings > Environments`):

- **staging**: For staging deployments
- **production**: For production deployments (with protection rules)

### 3. Container Registry Setup

The pipeline uses GitHub Container Registry (ghcr.io). No additional setup required - it uses the `GITHUB_TOKEN` automatically.

### 4. SonarCloud Setup (Optional)

1. Go to [SonarCloud.io](https://sonarcloud.io)
2. Import your GitHub repository
3. Get your organization key and project key
4. Update `sonar-project.properties` with your keys
5. Add `SONAR_TOKEN` to GitHub secrets

### 5. Dependabot Configuration

Dependabot is configured in `.github/dependabot.yml` to:
- Update npm dependencies weekly
- Update Docker base images weekly
- Update GitHub Actions weekly

## 📊 Pipeline Features

### Automated Testing
- ✅ Unit tests with coverage reporting
- ✅ Integration tests with PostgreSQL
- ✅ Type checking with TypeScript
- ✅ Linting with ESLint
- ✅ Code formatting with Prettier

### Security & Quality
- ✅ npm audit for vulnerabilities
- ✅ Snyk security scanning
- ✅ SonarCloud code quality analysis
- ✅ Dependency vulnerability monitoring

### Build & Deploy
- ✅ Docker image building and caching
- ✅ Multi-stage builds for optimization
- ✅ Automated tagging and versioning
- ✅ Environment-specific deployments

### Monitoring & Notifications
- ✅ Performance testing and benchmarking
- ✅ Slack notifications for deployments
- ✅ GitHub release automation
- ✅ Artifact and report uploads

## 🔄 Deployment Flow

### Development Flow:
1. **Feature Branch** → Create PR → **CI runs tests**
2. **PR Approved** → Merge to `develop` → **Deploy to Staging**
3. **Staging Tested** → Merge to `main` → **Deploy to Production**

### Release Flow:
1. **Create Git Tag** (`git tag v1.0.0`)
2. **Push Tag** (`git push origin v1.0.0`)
3. **Release Workflow** → Build → Create GitHub Release

## 📈 Monitoring

### GitHub Actions Dashboard
- View workflow runs in the "Actions" tab
- Monitor build times and success rates
- Download artifacts and reports

### Container Registry
- View Docker images at `ghcr.io/YOUR_USERNAME/zuzu-review-ingestion`
- Track image sizes and vulnerabilities

### Code Quality
- SonarCloud dashboard for code metrics
- Coverage reports in PR comments
- Security vulnerability alerts

## 🛠️ Customization

### Adding New Environments
1. Create environment in GitHub settings
2. Add environment-specific secrets
3. Update deployment jobs in workflows

### Custom Deployment Commands
Update the deployment steps in `ci-cd.yml`:

```yaml
- name: Deploy to production
  run: |
    # Add your deployment commands here
    kubectl apply -f k8s/
    # or
    docker-compose -f docker-compose.prod.yml up -d
    # or
    aws ecs update-service --cluster prod --service review-service
```

### Adding New Tests
1. Add test files with `.spec.ts` or `.test.ts` extension
2. Update test scripts in `package.json`
3. Tests will automatically run in CI

### Performance Thresholds
Modify performance thresholds in `performance-test.yml`:

```javascript
thresholds: {
  http_req_duration: ['p(95)<500'], // 95% under 500ms
  http_req_failed: ['rate<0.1'],    // Error rate under 10%
}
```

## 🚨 Troubleshooting

### Common Issues:

1. **Tests Failing**: Check test logs in Actions tab
2. **Docker Build Failing**: Verify Dockerfile syntax
3. **Deployment Failing**: Check environment secrets
4. **Security Scan Failing**: Review and fix vulnerabilities

### Debug Commands:
```bash
# Local testing
npm run test
npm run lint
docker build -t test-image .

# Check workflow syntax
gh workflow list
gh run list
```

## 📚 Best Practices

1. **Branch Protection**: Enable branch protection rules for `main`
2. **Required Reviews**: Require PR reviews before merging
3. **Status Checks**: Make CI checks required for merging
4. **Environment Protection**: Add approval requirements for production
5. **Secret Management**: Use environment-specific secrets
6. **Monitoring**: Set up alerts for failed deployments

Your CI/CD pipeline is now ready to provide automated, reliable deployments! 🚀