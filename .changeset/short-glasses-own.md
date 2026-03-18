---
"@tgraph/backend-generator": patch
---

Fix `DtoGenerator` output directory setup to check for an existing directory, remove it safely, and recreate it before generation.

This restores expected behavior for cleanup and error propagation during DTO generation.
