# Changelog Directory

This directory contains individual changelog files for each version release, following the [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format.

## Structure

Each version has its own markdown file with detailed release notes:

- **Filename Format**: `v{MAJOR}.{MINOR}.{PATCH}.md` (e.g., `v1.4.0.md`)
- **Content Format**: Standard Keep a Changelog sections (Added, Changed, Fixed, etc.)
- **Chronological Order**: Newest versions first

## Versions

### Released Versions

- [v1.4.0 - 2025-08-07](v1.4.0.md) - Raw JSON Export Tool & Enhanced Documentation
- [v1.3.0 - 2025-08-06](v1.3.0.md) - Cloudflare Agents Implementation  
- [v1.2.0 - 2025-08-05](v1.2.0.md) - Test Organization & Tool Architecture Refactoring
- [v1.1.0 - 2025-08-05](v1.1.0.md) - Multi-Environment Deployment & D1/R2 Storage
- [v1.0.0 - 2025-02-01](v1.0.0.md) - Complete Codebase Reorganization & React Native Docs

### Unreleased Changes

- [unreleased.md](unreleased.md) - Changes scheduled for the next release

## Navigation

- **Main Changelog**: [../../CHANGELOG.md](../../CHANGELOG.md) - Overview with links to detailed entries
- **Latest Release**: [v1.4.0.md](v1.4.0.md)
- **Full Version History**: See individual files above

## Contributing

When adding new changelog entries:

1. Update `unreleased.md` during development
2. Create new version file when releasing (e.g., `v1.5.0.md`)
3. Update this README.md with the new version link
4. Update the main CHANGELOG.md index

## Format Guidelines

Each version file should follow this structure:

```markdown
# v{VERSION} - {DATE}

Brief description of the release.

## Added
- New features and capabilities

## Enhanced  
- Improvements to existing features

## Fixed
- Bug fixes and corrections

## Changed
- Breaking changes and modifications

## Removed
- Deprecated or removed features

## Technical Implementation
- Technical details for developers

## Deployment
- Deployment status and environment information
```

This organization makes it easier to:
- Find specific version information quickly
- Collaborate on changelog entries without conflicts
- Reference specific releases in issues and PRs
- Maintain clean version history as the project grows