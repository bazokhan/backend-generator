---
"@tgraph/backend-generator": minor
---

Add VitePress documentation, end-to-end examples, and CI/CD pipeline

- Migrated docs from Jekyll to VitePress 1.6.x with purple brand theme
- Refreshed all doc content to match the current flat `UserConfig` format
- Added three end-to-end example projects: `01-todo-app`, `02-blog`, `03-ecommerce-rbac`
- Added CI workflow with Node 18/20/22 matrix
- Added automated release pipeline with Changesets
- Fixed cross-platform path normalization (Windows backslashes → forward slashes)
