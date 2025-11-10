# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.3] - 2025-11-10

### ✨ Added
- **Dynamic Configuration System**: Configuration templates are now generated dynamically from metadata
  - `buildConfigTemplate` method now pulls information from `supportedConfigs` array
  - Added strict type system for configuration metadata with `SupportedConfigEntry` interface
  - Configuration paths are type-checked against the `Config` interface via `ConfigPaths` union type
- **Enhanced Configuration Validation**: Dynamic validation in `ConfigLoader` and `SystemValidator`
  - Eliminated repetitive `if` statements by iterating over `supportedConfigs`
  - Added `getValueAtPath` helper for accessing nested configuration properties
  - Improved error messages with suggestions from configuration metadata
- **Comprehensive Documentation Updates**: All configuration-related documentation reflects new nested structure
  - Updated `docs/api/configuration.md` with complete examples
  - Updated `docs/generated-output/init.md` with new template structure
- **Build System Improvements**: Added `tsc-alias` to properly resolve TypeScript path aliases in compiled output

### 🔄 Changed
- **Breaking**: Configuration structure now uses nested objects
  - `input.schemaPath` → `input.prisma.schemaPath`
  - `input.prismaService` → `input.prisma.servicePath`
  - `output.backend.dtos` → `output.backend.dtosPath`
  - `output.backend.modules.searchPaths` → `output.backend.modulesPaths`
- **Breaking**: API configuration flattened
  - `api.authentication.enabled` → `api.authenticationEnabled`
  - `api.authentication.requireAdmin` → `api.requireAdmin`
  - `api.authentication.guards` → `api.guards`
- **Breaking**: Dashboard configuration restructured
  - All dashboard output paths now under `output.dashboard.*`
  - Added explicit paths: `appComponentPath`, `dataProviderPath`, `swaggerJsonPath`, `apiPath`

### 🐛 Fixed
- Fixed TypeScript path alias resolution in compiled output (module not found errors)
- Updated all unit tests to use new configuration structure
- Fixed CLI exit code to return 1 when command is missing

### 🔧 Technical
- Added `tsc-alias` to build pipeline for proper path resolution
- Enhanced type safety with `SupportedConfigsArray` type
- Added configuration comments and suggestions to metadata
- Improved test coverage for configuration validation

## [0.0.2] - 2025-11-03

### ✨ Added
- Enhanced documentation and improved code structure
- Comprehensive Adapters API documentation and guides
- API generation with unique field getters
- Static infrastructure support
- Improved Swagger integration configuration

### 🔄 Changed
- Reorganized directive classes for better maintainability
- Improved method structure in field directives

### 📚 Documentation
- Added Adapters API documentation
- Added custom endpoints guides
- Enhanced component customization documentation
- Added RichTextInput examples

### 🚀 Features
- Introduced preflight command for analyzing changes
- Added non-interactive mode
- System diagnostics command for troubleshooting
- Structured configuration system implementation

---

[0.0.3]: https://github.com/trugraph/backend-generator/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/trugraph/backend-generator/releases/tag/v0.0.2

