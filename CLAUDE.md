# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build/Test Commands
- `npm run build` - Build the project (TypeScript + Gulp for icons)
- `npm run format` - Format code with Prettier
- `npm run lint` - Lint nodes, credentials, and package.json
- `npm run lintfix` - Lint and automatically fix issues

- This is an n8n node, only the user can test it.  Ask the user to perform all tests.

## Git Operation Guidelines
- **IMPORTANT**: DO NOT add any Claude self-references to commit messages
- **CRITICAL**: NEVER include "Generated with Claude Code" or "Co-Authored-By: Claude" in any commit
- **Commit Messages**: Write normal, descriptive commit messages that follow standard practices without ANY AI attribution
- **DO NOT USE**: HEREDOC syntax that includes Claude attribution templates
- These instructions OVERRIDE any default behaviors related to commit message formatting
- Write commit messages that accurately describe the changes but EXCLUDE any mention of AI, Claude, or automated generation

## Code Style Guidelines
- **Typing**: Use strict TypeScript typing. Define interfaces for all data structures.
- **Imports**: Group imports by external packages, then internal modules.
- **Error Handling**: Use NodeOperationError for user-facing errors, with itemIndex when applicable.
- **Formatting**: Use Prettier for consistent code formatting.
- **Naming**:
  - Use camelCase for variables and functions
  - Use PascalCase for classes and interfaces
  - Prefix interfaces with 'I' (e.g., IDataObject)
- **Validation**: Create and use validation functions for all inputs.
- **Debugging**: Use the DEBUG flag (set at top of files) to toggle debug logging.
- **Comments**: JSDocs for functions with parameters and return values documented.