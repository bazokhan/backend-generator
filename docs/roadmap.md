---
layout: default
title: Roadmap
nav_order: 80
description: "Milestone-based roadmap for the TGraph Backend Generator"
---

# TGraph Backend Generator - Project Roadmap

> **Vision**: Become the definitive code generation toolkit that transforms Prisma schemas into production-ready, enterprise-grade full-stack applications with best-in-class developer experience.

---

## Table of Contents

1. [Current State (v0.0.1)](#current-state-v001)
2. [Core Philosophy & Goals](#core-philosophy--goals)
3. [Roadmap Strategy](#roadmap-strategy)
4. [Roadmap by Milestone](#roadmap-by-milestone)
5. [Feature Backlog](#feature-backlog)
6. [Technical Excellence](#technical-excellence)
7. [Ecosystem & Community](#ecosystem--community)
8. [Long-Term Outlook](#long-term-outlook)
9. [Success Metrics](#success-metrics)

---

## Current State (v0.0.1)

### ✅ What Works Today
- CLI commands (`api`, `dashboard`, `dtos`, `all`, `init`) that generate NestJS + React Admin artifacts from Prisma schemas.
- Prisma schema parsing with directive support for `@tg_form`, `@tg_format`, `@tg_upload`, and `@tg_readonly`.
- Automated generation of Nest DTOs, services, controllers, module updates, and React Admin resources (List/Edit/Create/Show/Studio).
- Safe regeneration via `.tg.` naming, tagged sections, and module updaters that preserve custom code.
- Documentation covering getting started, field directives, architecture, SDK usage, and troubleshooting.

### ⚠️ Gaps Observed
- Hard-coded file path assumptions (`src/app.module.ts`, `src/dashboard/src/...`) make adoption brittle for non-standard project layouts.
- CLI prompts block CI/non-interactive workflows; there is no `--yes`, dry-run, or diff preview.
- Missing environment preflight: absent schema files, Swagger JSON, or formatting tools cause late failures.
- Limited end-to-end coverage: only unit-level tests exist; regeneration behaviour on real projects is unverified.
- Dashboard generation depends on a pre-built Swagger JSON without guided automation or safeguards.

---

## Core Philosophy & Goals

### Design Principles
1. **Convention Over Configuration** – Ship sensible defaults, reveal complexity only when needed.
2. **Generate, Don't Replace** – Live alongside handcrafted code with clear boundaries and sentinel comments.
3. **Progressive Disclosure** – Let teams scale from basic CRUD to advanced customization at their own pace.
4. **Type Safety First** – Preserve end-to-end TypeScript types from Prisma schema to frontend client.
5. **Production Ready** – Generated code must meet NestJS and React Admin best practices out of the box.

### Strategic Goals
- Deliver a delightful developer experience that feels native to the NestJS + Prisma ecosystem.
- Earn trust for production deployments through reliability, documentation, and observability.
- Enable deep customization without forks via directives, templates, and SDK hooks.
- Grow an engaged community that contributes directives, recipes, and plugins.
- Expand to additional frameworks only after the core experience is exceptional.

---

## Roadmap Strategy

We will iterate through small, outcome-driven milestones. Each milestone is independently shippable and focuses on widening real-world usability before adding breadth.

Guiding heuristics:
- Prioritize stability and automation so the generator is predictable in CI and team workflows.
- Add capability only when we can cover it with tests, examples, and clear docs.
- Expose extension points early to avoid forking and keep customizations first-class.

---

## Roadmap by Milestone

### Superseded Plan Items
- ~~Phase 1: Foundation & Stability (v0.1.x - v0.5.x)~~ — Replaced with a lean milestone plan to ship a stable v0.1 faster.
- ~~Phase 2: Enterprise Features (v0.6.x - v1.0.0)~~ — Folded into a focused production-readiness milestone once stability is proven.
- ~~Phase 3: Multi-Framework Expansion (v1.1+)~~ — Deferred until the NestJS + React Admin experience is undeniably best-in-class.
- ~~Phase 4: Cloud Platform & SaaS (v2.0+)~~ — Out of scope for the next 24 months; revisit post v1.0 adoption.

### Milestone A – v0.1.0 Launch Readiness (target: 4–6 weeks)

#### Goals
- Make generation reliable on real-world NestJS + React Admin projects.
- Support scripted/CI usage without manual intervention.
- Detect misconfiguration early with actionable guidance.

#### Deliverables
- [ ] **TOP PRIORITY** Add non-interactive mode (`--yes` flag + config option) covering module creation, overwrites, and dashboard regeneration so CI pipelines can run `tgraph` safely.
- [ ] **TOP PRIORITY** Validate configuration before execution (schema validation, friendly errors) and ship `tgraph doctor` to surface missing files, Prisma issues, or incompatible Node versions upfront.
- [ ] **TOP PRIORITY** Make key project paths configurable (Nest AppModule location, feature/infrastructure roots, dashboard provider & App entry) with intelligent discovery and clear docs.
- [ ] Add a dry-run/preflight command that reports pending changes, missing modules, and required manual steps without touching the file system.
- [ ] Provide official example repositories (API-only, full stack) and add end-to-end tests that run the CLI twice to guarantee idempotent regeneration.
- [ ] Refresh docs with “happy path checklists” (schema markers, Swagger generation, custom guard integration) and troubleshooting for common failure modes.

### Milestone B – v0.2.0 Developer Experience (target: 6–8 weeks after v0.1)

#### Goals
- Shorten the iteration loop when evolving Prisma schemas.
- Give developers confidence before committing generated code.
- Extend directives based on actual user feedback instead of speculative breadth.

#### Deliverables
- [ ] Implement `--watch` / `tgraph dev` mode that reruns relevant generators on Prisma schema changes with clear status output.
- [ ] Add `--diff` and `--output-dir` options to preview generated changes or emit to a sandbox directory before applying.
- [ ] Allow overriding templates via project-local hooks (e.g., `templates/nest/service.ts.ejs`) with merge-safe defaults.
- [ ] Extend directive support with the most requested controls (`@tg_json`, `@tg_richtext`, currency helper) backed by docs and automated tests.
- [ ] Improve dashboard UX by generating reusable shared components (file upload, address inputs) and documenting resource customization patterns.

### Milestone C – v0.3.0 Production Readiness (target: 8–10 weeks after v0.2)

#### Goals
- Ship the first production deployments with minimal manual stitching.
- Bake in enterprise requirements without overwhelming first-time users.

#### Deliverables
- [ ] Generate optional RBAC scaffolding (policy classes, decorators, dashboard access control) that plugs into existing Nest guards.
- [ ] Support relation-heavy workflows: nested create/update for many-to-many, configurable cascade behaviour, and safer handling of self-relations.
- [ ] Enhance REST endpoints with richer query options (range filters, nested sorting, soft-delete awareness) and align the React Admin data provider to consume them.
- [ ] Provide “API surface contracts” (OpenAPI generation, typed client) as part of the CLI so dashboard type generation is one command.
- [ ] Harden upgrade paths with migration notes, breaking-change detection, and automated changelog generation per release.

### Milestone D – v0.4.0 Extensibility & Integrations (target: after v0.3)

#### Goals
- Let teams extend behaviour without forking the core.
- Validate the architecture against an additional frontend integration once the core is stable.

#### Deliverables
- [ ] Introduce a stable plugin API (Node hooks) for custom directives, templates, and post-processing steps.
- [ ] Add a proof-of-concept alternate frontend integration (e.g., React Admin + TanStack Router or a lightweight Next.js admin) to demonstrate extensibility.
- [ ] Expose granular SDK commands for selective regeneration (single model, dashboard only) with automation recipes.
- [ ] Evaluate privacy-conscious telemetry opt-in to understand feature usage and guide prioritisation.

---

## Feature Backlog

- **Schema & Backend**
  - Parameterise pagination defaults per model (page size, default sort).
  - Offer soft-delete patterns (`deletedAt`) with matching filters and dashboard toggles.
  - Add request/response transformation hooks for auditing, event dispatching, and search indexing.

- **Dashboard UX**
  - Generate layout presets (cards, split panes, tabbed forms) when schema metadata suggests them.
  - Provide bulk actions (export, inline edit) for eligible resources out of the box.
  - Surface help text from schema documentation comments in generated forms and tables.

- **Developer Workflow**
  - Publish a VS Code extension for directive IntelliSense and snippet insertion.
  - Add a CLI analytics command to measure generation time and highlight slow steps.
  - Maintain a compatibility matrix for supported versions of NestJS, Prisma, React Admin, and Node.

---

## Technical Excellence

- **Testing** – Snapshot generated artifacts, add nightly end-to-end runs on sample projects, and cover error paths (missing schema, conflicting files).
- **Release Engineering** – Automate semantic versioning, ship canary builds per commit, and gate `main` merges on passing e2e suites.
- **Performance** – Benchmark against 100+ model schemas, profile file-system writes, and introduce caching or incremental generation where it matters.
- **Observability** – Provide structured logging with log levels and a `--debug` flag; capture generation metrics for troubleshooting.
- **Quality Gates** – Enforce formatting/linting on generated output and require documentation updates for any new configuration surface.

---

## Ecosystem & Community

- Publish and maintain official example repositories (API-only, full stack, dashboard-lite).
- Enhance documentation with search, versioning, and “copy” snippets for directives and recipes.
- Ship a monthly changelog and roadmap update summarising progress, upcoming focus, and community highlights.
- Curate issues tagged `good-first-issue` and host quarterly contributor calls or livestreams.

---

## Long-Term Outlook

### 12–24 Month Horizon
- Reach v1.0 with multiple documented production deployments and a stable API surface.
- Evaluate adding GraphQL and alternative admin UI targets only after NestJS + React Admin parity is rock-solid.
- Introduce enterprise-friendly features (workspace templates, policy packs) based on actual adopter feedback.

### Superseded Long-Term Items
- ~~5-Year Vision (2030)~~ — We will revisit stretch goals like hosted platforms or conferences once the next two-year plan is delivered.

---

## Success Metrics

- **Developer Metrics**
  - Time to first generated API: < 5 minutes on a fresh project.
  - CLI success rate: > 98% (tracked via opt-in telemetry or support reports).
  - Documentation usefulness: > 4/5 satisfaction in surveys or community feedback.

- **Quality Metrics**
  - Test coverage: ≥ 90% on critical generators and updaters.
  - Idempotency: zero regressions in nightly double-run e2e suites.
  - Generation time: < 10 seconds for a 100-model schema on reference hardware.

- **Adoption Metrics**
  - npm downloads: 10K/month by the time v1.0 ships.
  - GitHub stars: 1K+ with active issue engagement.
  - Community: 500+ members across Discord/Discussions with consistent participation.

---

## Contributing to the Roadmap

We welcome community input:
- Suggest features via GitHub Discussions tagged `roadmap`.
- Upvote priorities with 👍 reactions to help us order work.
- Contribute code through issues tagged `help-wanted` and align PRs with active milestones.
- Share case studies so we can prioritise directives and templates that unlock real projects.

Roadmap governance:
- Monthly check-ins to review milestone progress and adjust scope.
- Public updates when priorities shift, with rationale.
- Transparent criteria for promoting backlog items into upcoming milestones.

---

## Conclusion

TGraph Backend Generator is focused on earning trust through reliability, polish, and extensibility. By delivering a stable v0.1, investing in developer experience, and layering production-ready capabilities over time, we can become the go-to toolkit for Prisma-driven teams.

---

*Last updated: January 2026*  
*Next review: March 2026*

For questions or suggestions, open a [GitHub Discussion](https://github.com/trugraph/backend-generator/discussions) or reach out to the maintainers.

---

## Legacy Idea Bank (Reference)

> Prior plan items retained for inspiration. Labels reflect current view of priority/fit within the streamlined roadmap.

- **Keep (Medium)** Enhanced field directives pack (`@tg_richtext`, `@tg_currency`, `@tg_phone`, `@tg_color`, `@tg_json`, `@tg_rating`, `@tg_markdown`) — aligns with Milestone B once stability and config flexibility land.
- **Keep (Medium)** Advanced validation set (regex/custom validators, cross-field/conditional validation, custom error messages, unified error formatting) — valuable for enterprise teams; schedule after configuration hardening.
- **Keep (High)** Relation experience overhaul (many-to-many polish, nested create/update, cascade controls, bidirectional syncing, polymorphic & self-relation UI) — critical for realistic schemas; maps to Milestone C.
- **Keep (Medium)** Developer workflow helpers (watch mode, interactive config wizard, diff preview, migration helpers, conflict resolution, performance tuning) — fold into Milestone B/C selectively; wizard likely optional docs-driven.
- **Keep (Medium)** Testing scaffolding (fixtures, API integration suites, component/unit tests, data factories, E2E utilities, coverage reports) — incorporate gradually once core e2e smoke tests exist.
- **Keep (High)** Authentication & authorization toolkit (RBAC templates, field/resource-level permissions, multi-tenant patterns, auth strategy samples) — required for broad production adoption (Milestone C).
- **Defer (Medium)** Workflow automation extras (audit logging, observability bundles, monitoring dashboards) — useful later; focus on core generation first.
- **Keep (Low)** CLI ergonomics (diff preview, dry-run, global `--yes`, telemetry toggle) — partially absorbed in Milestone A; telemetry remains opt-in future work.
- **Keep (Medium)** Template overrides / plugin system (custom directives, template hooks, post-processing) — foundational for extensibility; target Milestone D.
- **Keep (Low)** Performance enhancements (generation caching, incremental rebuilds) — monitor after real-world feedback to avoid premature complexity.
- **Defer (Low)** AI-assisted features (AI schema suggestions, automated optimizations, intelligent code review) — interesting but distracting before v1.0 stability.
- **Defer (Low)** Cloud/SaaS platform (hosted generation, collaboration workspace, real-time editing) — revisit once open-source toolkit is mature and resourced.
- **Keep (Low)** Ecosystem ambitions (plugin marketplace, conference, certification program, regional user groups) — aspirational community goals; note for long-term once user base scales.
- **Defer (Low)** Enterprise guarantees (SOC 2/ISO compliance, dedicated account management, SLA tiers) — requires sizable adoption; capture in future business planning.
- **Keep (Medium)** Example & documentation expansion (recipes, tutorials, architecture deep dives, troubleshooting guides) — continue investing as features ship.
- **Defer (Low)** Multi-framework expansion (support for additional backend/frontend stacks) — pause until NestJS + React Admin experience is best-in-class.
- **Drop (Low)** Overlapping success metrics (duplicated KPI targets from prior plan) — consolidated into current metrics section for clarity.
