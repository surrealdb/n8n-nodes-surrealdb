# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build/Test Commands
- `npm run build` - Build the project (TypeScript + Gulp for icons)
- `npm run dev` - Start TypeScript in watch mode
- `npm run format` - Format code with Prettier
- `npm run lint` - Lint nodes, credentials, and package.json
- `npm run lintfix` - Lint and automatically fix issues

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