# Contributing to Claude Code Analytics

Thank you for your interest in contributing to Claude Code Analytics! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Guidelines](#development-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

### Our Standards

We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in your interactions.

**Examples of positive behavior**:
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community

**Unacceptable behavior**:
- Trolling, insulting comments, or personal attacks
- Public or private harassment
- Publishing others' private information
- Other conduct that could reasonably be considered inappropriate

## Getting Started

### Prerequisites

Before contributing, ensure you have:
- Node.js 18 or higher
- PostgreSQL 14 or higher
- Git installed and configured
- Familiarity with TypeScript, React, and PostgreSQL

### Initial Setup

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/claude-code-analytics.git
   cd claude-code-analytics
   ```

2. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/istealersn-dev/claude-code-analytics.git
   ```

3. **Install dependencies**
   ```bash
   npm install
   cd frontend && npm install && cd ..
   ```

4. **Set up development environment**
   ```bash
   # Create database
   createdb claude_code_analytics

   # Run schema
   psql -d claude_code_analytics -f schema.sql

   # Configure environment
   cp .env.example .env
   cp frontend/.env.example frontend/.env.local
   # Edit .env files with your settings
   ```

5. **Verify setup**
   ```bash
   npm run dev:all
   ```

   Visit `http://localhost:5173` to confirm everything works.

## How to Contribute

### Ways to Contribute

- 🐛 **Report bugs** - Found an issue? Let us know!
- ✨ **Suggest features** - Have an idea? We'd love to hear it!
- 📝 **Improve documentation** - Clarify, expand, or fix docs
- 🔧 **Fix bugs** - Help squash those pesky bugs
- ⚡ **Add features** - Implement new functionality
- 🎨 **Improve UI/UX** - Make the dashboard more beautiful
- ✅ **Write tests** - Improve test coverage

### Good First Issues

Look for issues labeled `good first issue` or `help wanted` - these are great starting points for new contributors.

## Development Guidelines

### Code Style

We use strict TypeScript and Biome for code quality:

```bash
# Format code
npm run format

# Lint code
npm run lint

# Type check
npm run type-check
```

### Naming Conventions

Follow these conventions consistently:

| Type | Convention | Example |
|------|------------|---------|
| Variables/Functions | camelCase | `getUserData`, `isLoading` |
| Components/Types | PascalCase | `DashboardCard`, `SessionData` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_RETRIES`, `API_BASE_URL` |
| Files | kebab-case | `session-list.tsx`, `api-client.ts` |
| CSS Classes | kebab-case | `.card-header`, `.btn-primary` |

### Component Guidelines

1. **Single Responsibility**: Each component does one thing well
2. **Explicit Props**: Define all props with TypeScript interfaces
3. **Composition**: Prefer composition over complex components
4. **Error Boundaries**: Wrap risky operations

Example:
```typescript
interface CardProps {
  title: string
  children: React.ReactNode
  className?: string
}

export function Card({ title, children, className = '' }: CardProps) {
  return (
    <div className={`rounded-lg border p-4 ${className}`}>
      <h3 className="text-lg font-semibold">{title}</h3>
      {children}
    </div>
  )
}
```

### Testing Requirements

- Write tests for new features
- Update tests when modifying existing code
- Ensure all tests pass before submitting PR

```bash
# Run tests
npm run test

# Run with coverage
npm run test:coverage
```

### Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples**:
```bash
git commit -m "feat(dashboard): add session duration chart"
git commit -m "fix(sync): handle empty JSONL files correctly"
git commit -m "docs(api): update authentication examples"
```

### Documentation

- Update relevant documentation when making changes
- Add JSDoc comments for complex functions
- Include examples for new features
- Keep README and docs in sync

## Pull Request Process

### Before Submitting

1. **Update your fork**
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow code style guidelines
   - Write/update tests
   - Update documentation

4. **Run quality checks**
   ```bash
   npm run test           # All tests pass
   npm run type-check     # No type errors
   npm run lint           # No lint errors
   npm run format         # Code formatted
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: your descriptive commit message"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

### Submitting the PR

1. Go to your fork on GitHub
2. Click "New Pull Request"
3. Select your feature branch
4. Fill out the PR template:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## How Has This Been Tested?
Describe testing approach

## Checklist
- [ ] Tests pass
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### PR Review Process

1. **Automated Checks**: CI will run tests and linting
2. **Code Review**: Maintainers will review your code
3. **Feedback**: Address any requested changes
4. **Approval**: Once approved, your PR will be merged

### After Your PR is Merged

1. **Delete your branch**
   ```bash
   git branch -d feature/your-feature-name
   git push origin --delete feature/your-feature-name
   ```

2. **Update your main branch**
   ```bash
   git checkout main
   git pull upstream main
   ```

## Reporting Issues

### Bug Reports

Use the bug report template and include:

1. **Description**: Clear description of the bug
2. **Steps to Reproduce**:
   ```
   1. Go to '...'
   2. Click on '...'
   3. See error
   ```
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**:
   - OS: [e.g., macOS 14.0]
   - Node.js version: [e.g., 18.17.0]
   - PostgreSQL version: [e.g., 14.9]
   - Browser: [e.g., Chrome 119]
6. **Screenshots**: If applicable
7. **Error Messages**: Full error output

### Feature Requests

Include:

1. **Problem**: What problem does this solve?
2. **Proposed Solution**: Your suggested implementation
3. **Alternatives**: Other solutions you've considered
4. **Context**: Any additional context or screenshots

### Questions

For questions about usage:
- Check existing documentation first
- Search existing issues
- If still unclear, open a discussion or issue

## Development Best Practices

### Before You Start

1. Check if an issue already exists
2. Comment on the issue to claim it
3. Discuss approach if it's a large change
4. Wait for approval before starting major work

### While Developing

1. Keep changes focused and atomic
2. Write clear commit messages
3. Test thoroughly
4. Update documentation as you go
5. Keep PRs reasonably sized

### Code Quality

- **DRY** (Don't Repeat Yourself)
- **KISS** (Keep It Simple, Stupid)
- **YAGNI** (You Aren't Gonna Need It)
- Avoid over-engineering
- Write self-documenting code
- Comment complex logic

### Performance Considerations

- Optimize database queries
- Minimize re-renders in React
- Use proper indexes
- Consider caching strategies
- Profile before optimizing

## Getting Help

- **Documentation**: Check `docs/` directory
- **Issues**: Search [existing issues](https://github.com/istealersn-dev/claude-code-analytics/issues)
- **Discussions**: Start a [discussion](https://github.com/istealersn-dev/claude-code-analytics/discussions)
- **Code**: Read `CLAUDE.md` for project conventions

## Recognition

Contributors will be:
- Listed in repository contributors
- Credited in release notes
- Acknowledged in documentation

Thank you for contributing! 🎉
