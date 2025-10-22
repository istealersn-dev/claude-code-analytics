# Git Branching Workflow - Claude Code Analytics

## 🌿 Branching Strategy

We follow a **feature branch workflow** where all development happens in feature branches, and changes are merged to main via pull requests.

## 📋 Branch Naming Convention

### Feature Branches
- `feature/phase-6-claude-code-2` - Major feature implementation
- `feature/checkpoint-analytics` - Specific feature implementation
- `feature/dashboard-enhancements` - UI/UX improvements
- `feature/performance-optimization` - Performance improvements

### Bug Fix Branches
- `bugfix/parser-memory-leak` - Bug fixes
- `bugfix/dashboard-loading-issue` - UI bug fixes
- `bugfix/database-connection-error` - Backend bug fixes

### Hotfix Branches
- `hotfix/security-patch` - Critical security fixes
- `hotfix/production-crash` - Production emergency fixes

### Documentation Branches
- `docs/api-documentation` - API documentation updates
- `docs/user-guide` - User guide improvements
- `docs/developer-setup` - Developer documentation

## 🔄 Workflow Process

### 1. Starting New Work
```bash
# Always start from main branch
git checkout main
git pull origin main

# Create new feature branch
git checkout -b feature/your-feature-name

# Start development
# ... make changes ...
```

### 2. During Development
```bash
# Regular commits with descriptive messages
git add .
git commit -m "feat: add checkpoint analytics widget"

# Push branch to remote
git push origin feature/your-feature-name
```

### 3. Before Merging
```bash
# Update with latest main
git checkout main
git pull origin main
git checkout feature/your-feature-name
git rebase main

# Run tests
npm run test
npm run test:claude-code-2

# Push updated branch
git push origin feature/your-feature-name
```

### 4. Creating Pull Request
- Create PR from feature branch to main
- Include detailed description of changes
- Link to related issues or TODOs
- Request review from team members
- Ensure all tests pass

### 5. After Merge
```bash
# Switch back to main
git checkout main
git pull origin main

# Delete feature branch
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

## 📝 Commit Message Convention

### Format
```
type(scope): description

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples
```bash
# Feature implementation
git commit -m "feat(analytics): add checkpoint analytics dashboard"

# Bug fix
git commit -m "fix(parser): handle malformed JSONL files gracefully"

# Documentation
git commit -m "docs(api): update Claude Code 2.0 endpoint documentation"

# Testing
git commit -m "test(integration): add Claude Code 2.0 API tests"

# Refactoring
git commit -m "refactor(database): optimize queries for extended sessions"
```

## 🚫 What NOT to Do

### ❌ Never commit directly to main
```bash
# DON'T DO THIS
git checkout main
git add .
git commit -m "quick fix"
git push origin main
```

### ❌ Never work on main branch
```bash
# DON'T DO THIS
git checkout main
# ... make changes ...
git commit -m "new feature"
```

### ❌ Never merge without PR
```bash
# DON'T DO THIS
git checkout main
git merge feature/some-feature
git push origin main
```

## ✅ Best Practices

### 1. Always Use Feature Branches
- Every change goes through a feature branch
- No direct commits to main
- All changes reviewed via PR

### 2. Keep Branches Small and Focused
- One feature per branch
- Keep commits logical and atomic
- Regular commits during development

### 3. Write Good Commit Messages
- Use conventional commit format
- Be descriptive and clear
- Include context when needed

### 4. Test Before Merging
- Run all tests locally
- Ensure CI/CD passes
- Test the feature thoroughly

### 5. Clean Up After Merging
- Delete merged feature branches
- Keep main branch clean
- Regular cleanup of old branches

## 🔧 Useful Git Commands

### Branch Management
```bash
# List all branches
git branch -a

# Create and switch to new branch
git checkout -b feature/new-feature

# Switch between branches
git checkout main
git checkout feature/some-feature

# Delete local branch
git branch -d feature/old-feature

# Delete remote branch
git push origin --delete feature/old-feature
```

### Stashing Changes
```bash
# Stash current changes
git stash

# Apply stashed changes
git stash pop

# List stashes
git stash list

# Apply specific stash
git stash apply stash@{0}
```

### Rebasing
```bash
# Rebase feature branch on main
git checkout feature/your-feature
git rebase main

# Interactive rebase (squash commits)
git rebase -i main
```

### Resolving Conflicts
```bash
# When conflicts occur during rebase
git status
# Edit conflicted files
git add .
git rebase --continue
```

## 📊 Branch Protection Rules

### Main Branch Protection
- Require pull request reviews
- Require status checks to pass
- Require branches to be up to date
- Restrict pushes to main branch

### Required Checks
- All tests must pass
- Code coverage must meet threshold
- No linting errors
- Build must succeed

## 🎯 Current Active Branches

### Feature Branches
- `feature/phase-6-claude-code-2` - Claude Code 2.0 implementation
- `feature/checkpoint-analytics` - Checkpoint analytics widgets
- `feature/subagent-performance` - Subagent performance metrics

### Development Branches
- `develop` - Integration branch for features
- `staging` - Pre-production testing

## 📋 Branch Lifecycle

1. **Create** - Start from main, create feature branch
2. **Develop** - Make changes, commit regularly
3. **Test** - Run tests, ensure quality
4. **Review** - Create PR, get code review
5. **Merge** - Merge to main after approval
6. **Cleanup** - Delete feature branch

## 🚀 Quick Start Guide

### For New Features
```bash
# 1. Start from main
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Make changes and commit
git add .
git commit -m "feat: implement your feature"

# 4. Push branch
git push origin feature/your-feature-name

# 5. Create PR on GitHub
# 6. After merge, cleanup
git checkout main
git pull origin main
git branch -d feature/your-feature-name
```

### For Bug Fixes
```bash
# 1. Start from main
git checkout main
git pull origin main

# 2. Create bugfix branch
git checkout -b bugfix/issue-description

# 3. Fix and commit
git add .
git commit -m "fix: resolve issue description"

# 4. Push and create PR
git push origin bugfix/issue-description
```

---

*This workflow ensures code quality, collaboration, and maintainability while keeping the main branch stable and production-ready.*
