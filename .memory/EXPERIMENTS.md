# Experiments Registry

## Operating direction

- Repo memory stays the source of truth
- A future sidecar workspace will handle orchestration and repeatable experiment runs
- Any state promoted back here must be summary-first and human-reviewable

## External systems to apply in phases

### Paperclip-inspired orchestration

Target role:

- separate sibling workspace, for example `cityfashion-ops/`
- reads `.memory/PROJECT.md`, `.memory/STATE.md`, and `.memory/TODO.md`
- proposes updates back into repo memory instead of owning the truth

Near-term experiment:

- define the sidecar workspace shape
- define how it reads repo memory
- define how it writes back summaries, task proposals, and research outputs

Current status on `2026-03-31`:

- sibling workspace created at `../cityfashion-ops`
- Paperclip CLI onboarding completed with local data in `../cityfashion-ops/.paperclip-data`
- `paperclipai doctor` passed
- automatic local server start failed on Windows during embedded PostgreSQL startup
- starter `programs/` docs created for launch ops, product cleanup, SEO/GEO, and reporting loops
- first ops-hub templates created for prospects, outreach queue, campaigns, experiment log, and weekly reports
- a live Google Sheets ops hub has now been created and seeded through direct API writes with a service account

### Autoresearch-inspired `program.md` runs

Target role:

- reusable experiment briefs for repeated work loops

Planned first programs:

- product cleanup and review loop
- launch and operations backlog grooming
- SEO/GEO audit and opportunity scan

### SEO / GEO skills adoption

Target role:

- shape the backlog, audit structure, and recurring visibility workflows

Immediate use:

- maintain technical SEO backlog
- maintain content and metadata improvement backlog
- keep answer-surface and share-readiness ideas organized
