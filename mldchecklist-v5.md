# MLD Checklist V5 — MayLamDi Clean Start

Use this file as the implementation, prompting, and testing tracker for the clean-start MayLamDi specification. The previous website was intentionally deleted and must not be restored.

## Status key

- [ ] Not started
- [~] In progress
- [x] Completed and tested
- [!] Blocked or needs fixing

---

# 0. Current Product Decisions

- [x] Product name is MayLamDi everywhere
- [x] Repository is treated as a clean start
- [x] Deleted QuestBoard code is never restored
- [x] No migration plan is required
- [x] Supplied logo is used from `public/assets/maylamdi-logo.png`
- [x] Google sign-in is the only MVP authentication method
- [x] Convex is the only application backend/database
- [x] Vercel hosts the frontend
- [x] OpenRouter AI is optional
- [x] Manual planning works without AI
- [x] Seven built-in frameworks exist
- [x] One Custom Framework feature exists
- [x] One shared allocation engine serves all frameworks
- [x] AI does not allocate by “common sense” alone
- [x] Long-running projects are supported
- [x] Tasks over 14 days receive a breakdown suggestion
- [x] Two weeks is guidance, not a hard limit
- [x] Projects and text history are not capped at two
- [x] Separate goblin logging is not included
- [x] Goblin quota logic is not included
- [x] Compulsory final PDF share per member is not included
- [x] Review is optional per task
- [x] Task evidence supports note, link, image, and PDF
- [~] Practical statuses replace defeated/survived as core database states
- [x] Boss/quest language remains optional presentation only
- [x] No public teammate leaderboard
- [x] No punitive XP
- [x] No automatic recurring AI monitoring
- [ ] No unlicensed font or sound downloads

---

# 1. Codex Pack Files

- [x] `maylamdi-codex-master-prompt-v5.md` is in repository root
- [x] `mldchecklist-v5.md` is in repository root
- [x] `public/assets/maylamdi-logo.png` exists
- [x] Logo opens correctly
- [x] Logo is not stretched or recoloured
- [x] Logo has alt text
- [x] Logo has a text fallback

---

# 2. Clean Repository Bootstrap

## Clean Start Confirmation

- [x] Previous website is intentionally deleted
- [x] No migration is required
- [x] Old QuestBoard commits are not restored
- [x] Old branches are not used as implementation sources
- [x] No deleted files are copied from cached deployments
- [x] Current repository contents are reviewed only to preserve new supplied files
- [x] New app is created in repository root
- [x] No nested duplicate project directory

## New Application Scaffold

- [x] React created
- [x] Vite created
- [x] TypeScript configured
- [x] Tailwind configured
- [x] `src/main.tsx` exists
- [x] `src/App.tsx` or app entry exists
- [x] Base routing approach selected
- [x] Public asset directory exists
- [x] Supplied logo exists at `public/assets/maylamdi-logo.png`
- [x] Design-token structure exists
- [x] Feature/component folder structure exists
- [x] Convex folder prepared
- [x] `.env.example` created
- [x] `.gitignore` created or updated
- [x] README created or updated
- [x] New scaffold starts locally
- [x] New production build passes

## Dependency Setup

- [x] Only required dependencies installed
- [x] Package versions are compatible
- [x] No Firebase dependency
- [x] No Supabase dependency
- [x] No Express backend dependency
- [x] No obsolete QuestBoard package dependency
- [~] Lockfile committed with project files

## Bootstrap Report

- [~] Codex lists files created
- [~] Codex lists packages installed
- [~] Codex lists commands run
- [~] Codex reports build result
- [~] Codex reports manual setup still needed
- [x] Product features do not begin before scaffold succeeds

---

# 3. Foundation and Convex Connection

## Setup

- [x] React + Vite runs
- [x] Tailwind works
- [x] TypeScript works if configured
- [x] Convex package installed
- [x] Existing Convex development deployment linked
- [x] `.env.local` has `VITE_CONVEX_URL`
- [x] `.env.example` has names only
- [x] `.env` ignored
- [x] `.env.local` ignored
- [x] No secrets committed
- [x] README setup updated

## Convex Gate

- [x] `npx convex dev` runs
- [x] Generated API types exist
- [x] Correct React provider
- [x] Missing URL error is clear
- [x] Test query returns data
- [x] Function appears in Convex dashboard
- [x] Calls appear in Logs/Health
- [x] Build passes
- [x] No recurring console errors
- [x] Product features wait until gate passes

---

# 4. Branding and Themes

## Logo

- [ ] Landing page
- [ ] Sign-in page
- [ ] Navigation
- [ ] Loading/empty state
- [ ] PDF header
- [ ] Favicon/app icon if practical
- [ ] Aspect ratio preserved
- [ ] No recolouring
- [ ] Accessible alt text
- [ ] Load-failure fallback

## Colour Tokens

- [ ] `#fff73f`
- [ ] `#feaa01`
- [ ] `#ff8ae7`
- [ ] `#fd39e4`
- [ ] `#1dd851`
- [ ] `#17a738`
- [ ] `#4ca0fe`
- [ ] `#fffded`
- [ ] `#121f25`
- [ ] Central token file
- [ ] No unnecessary repeated hardcoding

## Light Mode

- [ ] Background `#fffded`
- [ ] Text `#121f25`
- [ ] Readable cards
- [ ] Readable inputs
- [ ] Readable disabled states
- [ ] Contrast checked

## Dark Mode

- [ ] Background `#121f25`
- [ ] Text `#fffded`
- [ ] Selective accent use
- [ ] Surface hierarchy
- [ ] Readable inputs
- [ ] Contrast checked

## Theme Behaviour

- [ ] Toggle exists
- [ ] System default supported
- [ ] Preference persists
- [ ] No severe theme flash
- [ ] Works before login
- [ ] Works after login

## Typography

- [ ] Blode Starkly specified for headings
- [ ] Glacial Indifference specified for body
- [ ] Licensed files only
- [ ] No automatic font downloads
- [ ] Heading fallback documented
- [ ] Body fallback documented
- [ ] Missing fonts do not break UI

---

# 5. Google Authentication

## Google Cloud Manual Setup

- [x] Google Cloud project exists
- [x] Branding complete
- [x] Audience External
- [x] Testing mode
- [x] Test users added
- [x] OpenID scope only
- [x] Email scope only
- [x] Profile scope only
- [x] OAuth web client created
- [x] Local origin registered
- [ ] Production origin registered
- [x] Exact callback registered
- [x] Client ID stored privately
- [x] Client secret stored privately

## Convex Auth

- [x] Compatible package version confirmed
- [x] Google provider configured
- [x] Continue with Google button
- [x] Sign-out button
- [x] Signed-out state
- [x] Loading state
- [x] Authenticated state
- [x] No username/password
- [x] No magic link
- [x] No local fake session
- [x] Secret not exposed to React

## Profile

- [x] First login creates profile
- [x] Profile linked to authenticated identity
- [x] Returning login reuses profile
- [x] Creation is idempotent
- [x] Display name saved
- [x] Email saved
- [x] Optional profile image handled
- [x] Created time saved
- [x] Updated time saved
- [x] Email is not sole identity

## Auth Helpers

- [x] `requireAuthUser`
- [x] `requireUserProfile`
- [ ] `requireTeamMember`
- [ ] `requireProjectMember`
- [ ] `requireTaskOwnerOrTeamPermission`
- [ ] `requireTaskReviewer`

## Auth Gate Test

- [x] Account A signs in
- [x] Account B signs in
- [ ] OAuth cancel handled
- [x] Refresh persists session
- [x] Sign-out works
- [x] Signed-out query rejected
- [x] Signed-out mutation rejected
- [x] No duplicate profile
- [x] Project features wait until gate passes

---

# 6. Convex Data Architecture

## Tables

- [x] `userProfiles`
- [x] `teams`
- [x] `teamMembers`
- [x] `customFrameworks`
- [x] `projects`
- [x] `projectMembers`
- [x] `phases`
- [x] `milestones`
- [x] `tasks`
- [x] `taskEvidence`
- [x] `taskReviews`
- [x] `activityLogs`
- [ ] `projectSnapshots`

## Validation

- [x] Explicit validators
- [x] No important `v.any()`
- [x] Convex IDs used
- [x] Storage IDs used for files
- [x] All public args validated
- [~] All indexes generated
- [x] Schema deploys
- [x] Types generate

## Indexes

- [x] teams by join code
- [x] team members by team
- [x] team members by user
- [x] team member by team+user
- [x] custom frameworks by team
- [x] projects by team+status
- [x] projects by team+updated time
- [x] project members by project
- [x] project member by project+user
- [x] phases by project+order
- [x] milestones by project+due date
- [x] tasks by project
- [x] tasks by project+owner
- [x] tasks by project+status
- [x] evidence by task
- [x] reviews by task
- [x] activity by project+timestamp
- [ ] snapshots by project

---

# 7. Team Creation and Realtime

## Create Team

- [x] Team name required
- [x] Unique short join code
- [x] Creator becomes member
- [x] Creator lands on team home
- [x] Join code visible
- [x] Join code copyable
- [x] Activity logged

## Join Team

- [x] Join input
- [x] Code normalised
- [x] Invalid code error
- [x] Duplicate join blocked
- [x] Membership stored
- [x] User lands on team home
- [x] Activity logged

## Permissions

- [x] Non-member cannot read team
- [ ] Non-member cannot read projects
- [ ] Non-member cannot read evidence
- [ ] Non-member cannot edit framework
- [x] Non-member mutation rejected

## Realtime Gate

- [x] Separate Account A session
- [x] Separate Account B session
- [x] Both join same team
- [x] Member appears within 1–2 seconds
- [x] Shared test record updates live
- [x] No refresh
- [x] Uses `useQuery`
- [x] Product work waits until gate passes

---

# 8. Character Customisation

## Selector

- [x] Fill colour
- [x] Outline colour
- [x] Palette only
- [x] Fill/outline cannot match
- [x] Thick rounded outline
- [x] Live preview
- [x] Initials/name visible
- [x] Optional spell type
- [x] Keyboard accessible
- [x] Mobile friendly

## Backend

- [x] Stored per team member
- [x] Membership checked
- [x] Palette validated
- [x] Arbitrary CSS rejected
- [x] Matching colours rejected
- [x] Change logged
- [x] Teammates update live
- [x] Refresh persists
- [x] Different teams may use different colours

---

# 9. Built-in Frameworks

## Design and Creative

- [x] Empathise
- [x] Define / Research
- [x] Ideate
- [x] Prototype
- [x] Test
- [x] Refine
- [x] Deliver
- [x] Nonlinear overlap supported
- [x] Testing loopback supported

## Marketing and Communications

- [x] Situation and Audience Research
- [x] Strategy and Objectives
- [x] Concept Development
- [x] Content Production
- [x] Channel Planning
- [x] Launch
- [x] Measurement and Optimisation

## Business and Entrepreneurship

- [x] Problem or Opportunity
- [x] Market and Stakeholder Research
- [x] Solution or Business Model
- [x] Financial and Operational Planning
- [x] Risk Assessment
- [x] Implementation Proposal
- [x] Evaluation and Presentation

## Architecture and Spatial Design

- [x] Site and Context Analysis
- [x] User and Programme Research
- [x] Concept Development
- [x] Schematic Design
- [x] Design Development
- [x] Technical Documentation
- [x] Visualisation and Presentation
- [x] Review and Revision
- [x] Nonlinear revision supported

## Film, Animation, and Media Production

- [x] Development
- [x] Research and Script
- [x] Pre-production
- [x] Production
- [x] Post-production
- [x] Testing and Revision
- [x] Distribution or Presentation
- [x] Common dependencies included

## Software and IT

- [x] Requirements
- [x] Backlog and Planning
- [x] UX / Technical Design
- [x] Development
- [x] Testing
- [x] Deployment
- [x] Review and Iteration
- [x] Sprint support

## Academic Research

- [x] Research Question
- [x] Literature Review
- [x] Methodology
- [x] Ethics / Preparation
- [x] Data Collection
- [x] Analysis
- [x] Discussion
- [x] Writing
- [x] Review and Submission

## Framework Quality

- [x] Names and descriptions
- [x] Discipline tags
- [x] Suggested deliverables
- [x] Suggested skills
- [x] Default dependencies
- [x] Overlap metadata
- [x] Review checkpoints
- [x] Versioned template data
- [x] Preview UI
- [ ] Duplicate/edit option

---

# 10. Custom Framework

## Builder

- [x] Name
- [x] Description
- [x] Add phase
- [x] Rename phase
- [x] Reorder phase
- [x] Delete phase
- [x] Optional phase
- [x] Suggested deliverables
- [x] Suggested skills
- [x] Dependencies
- [x] Overlap toggle
- [x] Review checkpoint
- [x] Duplicate preset
- [x] Save
- [x] Edit
- [ ] Delete with confirmation
- [ ] Reuse in future projects

## Backend

- [x] Stored in Convex
- [x] Team ownership enforced
- [x] Creator stored
- [x] Created/updated time
- [x] Version stored
- [x] Validation
- [x] Non-member blocked
- [ ] Deleting used framework handled safely

## Test

- [x] Create from blank
- [x] Duplicate Design framework
- [x] Edit phases
- [x] Save
- [ ] Use in project
- [x] Reopen
- [x] Teammates see live
- [x] Unauthorised edit rejected

---

# 11. Long-Running Projects

## Project Duration

- [x] Projects may last months
- [x] Start date
- [x] Deadline
- [ ] Phase dates
- [x] Milestone dates
- [x] Task dates
- [x] No hard two-week project limit
- [x] Active data persists in Convex
- [ ] Cross-device return works

## Hierarchy

- [x] Project
- [x] Phase
- [x] Milestone
- [x] Task
- [ ] Optional subtask/checkpoint

## Two-Week Guidance

- [x] Task may exceed 14 days
- [x] Suggest breakdown
- [x] User can ignore suggestion
- [ ] AI breakdown optional
- [x] No validation rejection
- [x] Message is supportive

## Scaling

- [ ] Project list paginated
- [ ] Task list paginated or virtualised
- [ ] Activity list paginated
- [ ] Active projects not auto-deleted
- [ ] Archived text remains
- [ ] Large assets use external links
- [ ] No video upload

---

# 12. Project Creation

## Consolidated Setup

- [x] Project details
- [x] Framework selection
- [x] Member planning inputs
- [x] Phase preview
- [~] Milestone preview
- [~] Task plan
- [x] Allocation suggestions
- [x] Final confirmation
- [x] No rigid multi-page wizard
- [ ] Collapsible sections allowed

## Framework Selection

- [x] Seven presets
- [x] Custom
- [x] Preview
- [x] Manual choice
- [ ] AI recommendation
- [x] Duplicate/edit before use

## Member Inputs

- [x] Skills
- [x] Availability
- [x] Current workload
- [x] Preferences
- [x] Optional weekly capacity
- [x] Inputs labelled self-reported

## Validation

- [x] Title
- [x] Dates
- [x] Team membership
- [x] At least one project member
- [x] Valid framework
- [x] Valid phases
- [x] Valid milestones
- [x] Valid owners
- [x] Valid dependencies
- [x] Backend repeats critical checks

## Creation Test

- [x] Account A creates project
- [~] Account B sees it live
- [x] Framework copied correctly
- [x] Phases created
- [x] Milestones created
- [x] Tasks created
- [x] Planning inputs saved
- [x] Refresh persists

---

# 13. Allocation Engine

## Deterministic Inputs

- [x] Required skills
- [x] Availability
- [x] Current workload
- [x] Preferences
- [x] Dependency timing
- [x] Estimated effort
- [x] Weekly capacity

## Suggested Scoring

- [x] Skill match 0–40
- [x] Availability 0–25
- [x] Workload balance 0–20
- [x] Preference 0–10
- [x] Dependency timing 0–5
- [x] Hard constraints before score
- [x] Configurable weights
- [x] Consistent output

## Explainability

- [x] Explanation per suggested owner
- [x] No objective fairness claim
- [x] Task count not fairness score
- [x] Assumptions visible
- [x] User can inspect inputs

## Human Control

- [x] Swap owner
- [x] Add collaborator
- [ ] Split task
- [ ] Merge task
- [x] Edit effort
- [x] Edit difficulty
- [x] Edit dates
- [x] Edit dependencies
- [ ] Reject AI plan
- [x] Manual plan

## Tests

- [x] Skill fit preferred
- [x] Unavailable member avoided
- [x] Overloaded member penalised
- [x] Preference considered
- [ ] No-owner tasks flagged
- [x] Explanation matches score
- [x] Same inputs give stable result

---

# 14. Nonlinear Workflow

- [x] Overlapping phases
- [x] Task dependencies
- [x] Loop back to earlier phase
- [x] Revision cycles
- [x] Blocked status
- [x] Reopen completed task
- [x] Reopen logged
- [ ] Dependency indicators
- [x] No mandatory complex graph editor
- [x] Clear list/board experience

---

# 15. Task Management

## Task Fields

- [x] Title
- [x] Description
- [x] Phase
- [x] Milestone
- [x] Primary owner
- [x] Collaborators
- [x] Required skills
- [x] Estimated effort
- [x] Difficulty 1–5
- [x] Weight
- [x] Start date
- [x] Due date
- [x] Dependencies
- [x] Review requirement
- [x] Reviewer
- [x] Source
- [x] Status

## Actions

- [x] Create
- [x] Edit
- [x] Delete
- [x] Assign
- [x] Reassign
- [x] Add collaborator
- [x] Start
- [x] Block
- [x] Send to review
- [x] Complete
- [x] Reopen
- [x] Search
- [x] Filter by owner
- [x] Filter by phase
- [x] Filter by status

## Rules

- [x] Team permission
- [x] Project permission
- [x] Valid owner
- [x] Valid collaborator
- [x] Valid reviewer
- [x] No self-review
- [x] Valid dependency
- [x] Circular dependency handled
- [x] Task count not effort
- [x] Changes live
- [x] Changes logged

## Long Task

- [x] >14-day detection
- [x] Breakdown suggestion
- [x] Ignore option
- [ ] AI subtasks option
- [x] No hard error

---

# 16. Evidence and Review

## Evidence Types

- [x] Note
- [x] External link
- [x] Image
- [x] PDF
- [x] Figma link
- [x] Drive link
- [x] GitHub link
- [x] Miro/other link

## Upload Rules

- [x] PDF max 10 MB
- [x] Image max 5 MB
- [x] No video
- [x] Storage ID saved
- [x] Temporary URL not saved
- [x] Upload progress
- [x] Upload error
- [x] File type validation
- [x] Authorised URL generation

## Review

- [x] Optional per task
- [x] Reviewer assigned only when required
- [x] No self-review
- [x] Reviewer project member
- [x] Pending
- [x] Approved
- [x] Changes requested
- [x] Comment
- [x] Review time
- [x] Return to editable state
- [x] Activity logged

## Contribution Report

- [ ] Owned tasks
- [ ] Collaborator tasks
- [ ] Effort/weight
- [ ] Status history
- [ ] Evidence summary
- [ ] Review outcome
- [ ] Dates
- [ ] Fairness limitation note

---

# 17. Progress and Game Layer

## Practical Progress

- [x] Weighted required tasks
- [x] Milestone completion
- [x] Project status
- [x] Progress source documented
- [x] No manual client-only persistent progress

## Optional Boss Visual

- [x] Project represented as boss
- [x] Weighted progress reduces visual health
- [x] Milestone animation
- [x] Completion celebration
- [x] Overdue “boss still standing”
- [x] Game does not block actions
- [x] Core data uses practical statuses

## Removed

- [x] No separate goblin log
- [x] No goblin quota
- [x] No final-member-PDF HP
- [x] No defeated/survived-only database state

---

# 18. Workload and At-Risk Support

## Workload View

- [x] Tasks by member
- [x] Estimated effort
- [x] Due-date overlap
- [x] Availability
- [x] Capacity
- [x] Phase workload
- [x] No public ranking

## Risk Flags

- [x] Overdue task
- [x] Blocked dependency
- [ ] No owner
- [x] Pending review
- [x] Overloaded member
- [x] Multiple heavy due tasks
- [x] Milestone at risk

## Actions

- [x] Reassign
- [x] Add collaborator
- [ ] Split task
- [x] Edit date
- [ ] Ask AI to rebalance
- [x] Human confirmation
- [x] No automatic AI monitoring

---

# 19. Activity and Notifications

## Logged Events

- [x] Team created
- [x] Member joined
- [x] Character changed
- [x] Framework created
- [x] Framework edited
- [x] Project created
- [x] Phase changed
- [x] Milestone changed
- [x] Task created
- [ ] Task assigned
- [x] Task reassigned
- [x] Status changed
- [x] Evidence submitted
- [x] Review approved
- [x] Changes requested
- [x] Task reopened
- [x] Project at risk
- [x] Project completed
- [x] Project archived
- [ ] Project deleted

## Behaviour

- [x] UTC storage
- [x] Local display
- [x] Actor from auth
- [x] Typed metadata
- [x] Paginated
- [x] Realtime
- [x] In-app notification
- [x] No false push notification claim

---

# 20. Sound System

## Core

- [ ] Central Web Audio manager
- [ ] Sound toggle
- [ ] Optional volume
- [ ] Preference persists
- [ ] User gesture unlock
- [ ] Graceful failure
- [ ] No copyrighted files required
- [ ] No sound on failed action
- [ ] No duplicate rerender sound
- [ ] Old events not replayed
- [ ] Remote events deduplicated

## Sounds

- [ ] Button pop
- [ ] Member joined sparkle
- [ ] Character saved twinkle
- [ ] Framework selected chime
- [ ] Project created flourish
- [ ] Task created rising pop
- [ ] Task assigned chime
- [ ] Task completed success pop
- [ ] Evidence submitted whoosh
- [ ] Review approved chord
- [ ] Changes requested neutral boop
- [ ] Milestone fanfare
- [ ] Project completion arpeggio
- [ ] Overdue subtle alert
- [ ] AI ready sparkle

---

# 21. AI-Assisted Planning

## Provider

- [x] Convex server action
- [x] No direct React request
- [x] Key private
- [x] Model configurable
- [x] Default Gemma model
- [x] Fallback free router
- [x] Four-model free-only fallback chain
- [x] Exponential backoff and `Retry-After`
- [x] JSON-only degradation with server validation
- [x] No key in `VITE_`
- [x] No key committed

## Input

- [x] Brief text
- [x] Candidate framework
- [x] Deadline
- [x] Members
- [x] Skills
- [x] Availability
- [x] Workload
- [x] Preferences
- [x] Length limit
- [x] Explicit trigger

## Output

- [x] Recommended framework
- [x] Reason
- [ ] Phases
- [x] Milestones
- [x] Tasks
- [x] Dependencies
- [x] Skills
- [x] Effort
- [x] Difficulty
- [x] Owners
- [x] Collaborators
- [x] Explanations
- [x] Review requirements
- [x] Long-task breakdown
- [x] Risks
- [x] Assumptions
- [x] Strict validation
- [x] Prefill only
- [x] Editable
- [x] Confirmation required

## Failure

- [x] Timeout
- [x] Rate limit
- [x] Model unavailable
- [x] Invalid JSON
- [x] Empty response
- [x] Retry
- [x] Manual fallback

---

# 22. Main Pages

## Public

- [ ] Landing
- [ ] Product explanation
- [ ] Logo
- [x] Google sign-in
- [ ] Theme toggle
- [ ] Responsive navigation

## Authenticated

- [ ] Profile/onboarding
- [ ] Create/join team
- [ ] Team home
- [ ] Project list
- [x] Archived projects
- [ ] Character settings
- [ ] Framework library
- [ ] Custom framework builder
- [ ] Create project
- [ ] Project workspace
- [ ] Team settings

## Project Tabs

- [ ] Overview
- [ ] Plan
- [ ] Tasks
- [ ] Workload
- [ ] Evidence
- [ ] Activity
- [ ] Report
- [ ] Mobile navigation

---

# 23. Archive, Export, and Deletion

## Archive

- [x] Complete project
- [x] Archive project
- [ ] Paginated archive
- [x] Reopen/view archive
- [x] No two-project cap
- [x] Active project never auto-deleted
- [x] Text history retained

## Export

- [ ] Branded PDF
- [ ] Logo in PDF
- [ ] Framework
- [ ] Dates
- [ ] Phases
- [ ] Milestones
- [ ] Tasks
- [ ] Owners
- [ ] Collaborators
- [ ] Effort/weight
- [ ] Evidence summary
- [ ] Reviews
- [ ] Activity
- [ ] Contribution summary
- [ ] Multi-page
- [ ] Long text wrap
- [ ] Mobile download
- [ ] Optional JSON export

## Delete

- [ ] Explicit confirmation
- [ ] Authorisation
- [ ] Export reminder
- [ ] Related files deleted
- [ ] Idempotent
- [ ] Failure logged
- [ ] No hidden auto-delete

---

# 24. Responsive and Accessibility

## Responsive

- [ ] 320 px supported
- [ ] Mobile-first
- [ ] Desktop grids
- [ ] No horizontal overflow
- [ ] Touch targets
- [ ] Mobile colour selector
- [ ] Mobile framework builder
- [ ] Mobile project form
- [ ] Mobile task board
- [ ] Mobile upload
- [ ] Mobile PDF

## Accessibility

- [ ] Visible labels
- [ ] Keyboard navigation
- [ ] Visible focus
- [ ] Error announcements
- [ ] Loading announcements
- [ ] Colour-independent status
- [ ] Contrast
- [ ] SVG labels
- [ ] Dialog focus
- [ ] Reduced motion
- [ ] Accessible theme toggle
- [ ] Accessible sound toggle
- [ ] Accessible character selector
- [ ] Accessible framework selector
- [ ] Accessible file input

---

# 25. Security and Privacy

- [ ] Actor derived from auth
- [ ] Team membership enforced
- [ ] Project membership enforced
- [ ] Framework ownership enforced
- [ ] Owner validated
- [ ] Collaborator validated
- [ ] Reviewer validated
- [ ] No self-review
- [ ] Palette validated
- [ ] Dependencies validated
- [ ] File type validated
- [ ] File size validated
- [ ] File URL authorised
- [ ] Duplicate join prevented
- [ ] Project delete authorised
- [ ] Frontend actor ID not trusted
- [ ] AI guarded
- [ ] Secrets server-side
- [ ] Basic Google identity only
- [ ] Evidence visibility explained
- [ ] No surveillance language

---

# 26. Errors and Edge Cases

- [ ] Missing Convex URL
- [ ] Convex disconnected
- [ ] OAuth cancelled
- [ ] Redirect mismatch
- [ ] Expired session
- [ ] Missing profile
- [ ] Invalid join code
- [ ] Duplicate join
- [ ] Missing team
- [ ] Missing project
- [ ] Non-member
- [ ] Deleted framework
- [ ] Invalid custom framework
- [ ] Empty plan
- [ ] No owner
- [ ] Invalid collaborator
- [ ] Invalid reviewer
- [ ] Self-review
- [ ] Invalid dependency
- [ ] Circular dependency
- [ ] >14-day task
- [ ] Date outside project
- [ ] Upload failure
- [ ] Wrong file type
- [ ] Oversized file
- [ ] Duplicate evidence
- [ ] Review after deletion
- [ ] AI timeout
- [ ] AI rate limit
- [ ] AI unavailable
- [ ] Invalid AI JSON
- [ ] Offline
- [ ] Reconnect
- [ ] Audio unavailable
- [ ] Logo failure

---

# 27. Testing

## Backend

- [ ] Auth helpers
- [ ] Profile idempotency
- [ ] Join code uniqueness
- [ ] Duplicate membership
- [ ] Team authorisation
- [ ] Project authorisation
- [ ] Palette validation
- [ ] Custom framework ownership
- [ ] Phase ordering
- [ ] Dependency validation
- [ ] Circular dependency
- [ ] Owner validation
- [ ] Collaborator validation
- [ ] Reviewer validation
- [ ] No self-review
- [ ] Evidence access
- [ ] Archive/delete permission
- [ ] Storage cleanup
- [ ] Allocation score
- [ ] AI schema validation

## Realtime Two-Session

- [ ] Member join
- [ ] Character update
- [ ] Framework creation
- [ ] Project creation
- [ ] Task creation
- [ ] Assignment
- [ ] Status
- [ ] Evidence
- [ ] Review
- [ ] Workload
- [ ] Completion
- [ ] Archive

## UI

- [ ] Logo
- [ ] Light mode
- [ ] Dark mode
- [ ] Theme persistence
- [ ] Sound
- [ ] Sound persistence
- [ ] Character
- [ ] Seven frameworks
- [ ] Custom framework
- [ ] Months-long project
- [ ] >14-day task suggestion
- [ ] Mobile
- [ ] Keyboard
- [ ] Reduced motion
- [ ] PDF
- [ ] AI fallback

## Build

- [x] Install
- [x] Convex generation
- [x] Type check
- [x] Lint
- [x] Tests
- [x] Production build
- [x] No known console errors

---

# 28. Production Deployment

## Convex

- [x] Production deployment exists
- [x] Schema deployed
- [x] Functions deployed
- [x] Auth variables set
- [ ] OpenRouter variables set
- [x] Development/production separated

## Google OAuth

- [x] Production origin
- [x] Production callback
- [x] Test user or publishing status appropriate
- [x] Production login tested

## Vercel

- [ ] Existing repository connected
- [x] Correct root
- [x] Correct build command
- [x] `CONVEX_DEPLOY_KEY` private
- [x] Production uses production Convex
- [x] Deployment succeeds
- [x] Route refresh works

## Production Test

- [x] Login
- [ ] Team
- [ ] Realtime
- [ ] Character
- [ ] Framework
- [ ] Custom framework
- [ ] Long project
- [ ] Task
- [ ] Evidence
- [ ] Review
- [ ] Workload
- [ ] Archive
- [ ] PDF
- [x] Theme
- [ ] Sound
- [ ] AI/manual fallback

---

# 29. Explicitly Out of Scope

- [ ] No payments
- [x] No public leaderboard
- [x] No punitive XP
- [x] No separate goblin log
- [x] No goblin quota
- [x] No compulsory final PDF per member
- [ ] No self-review
- [ ] No universal reviewer per member
- [ ] Project history has no two-project cap
- [ ] No recurring AI monitoring
- [ ] No Gmail inbox access
- [ ] No video upload
- [ ] No unlicensed font downloads
- [ ] No unlicensed sound downloads
- [ ] No false online-presence claim

---

# 30. Development Progress Board

| Phase | Feature | Status | Blocker | Last tested |
|---|---|---|---|---|
| 0 | Clean repository bootstrap | Completed |  | 2026-07-30 |
| 1 | Convex connection | Completed |  | 2026-07-30 |
| 2 | Branding and theme | Not started |  |  |
| 3 | Google authentication | Completed |  | 2026-07-31 |
| 4 | Data architecture | In progress | Snapshot table remains | 2026-08-04 |
| 5 | Team realtime | Completed |  | 2026-07-31 |
| 6 | Character customisation | Completed |  | 2026-07-31 |
| 7 | Built-in frameworks | Completed |  | 2026-07-31 |
| 8 | Custom framework | Completed | Project-use and safe whole-template deletion follow project creation | 2026-07-31 |
| 9 | Long project structure | In progress | Phase dates and subtasks remain | 2026-08-03 |
| 10 | Project creation | Completed |  | 2026-08-04 |
| 11 | Allocation engine | Completed |  | 2026-08-04 |
| 12 | Nonlinear workflow | In progress | Dependency indicators remain | 2026-08-05 |
| 13 | Task management | Completed |  | 2026-08-04 |
| 14 | Evidence and review | In progress | Production image/PDF upload smoke test remains | 2026-08-04 |
| 15 | Progress/game layer | Completed |  | 2026-08-03 |
| 16 | Workload and risk | In progress | No-owner flag, split-task action, and optional AI rebalance remain | 2026-08-04 |
| 17 | Activity | In progress | Project deletion event remains | 2026-08-05 |
| 18 | Sound | Not started |  |  |
| 19 | AI | In progress | Private OpenRouter key and live production test remain | 2026-08-06 |
| 20 | Archive/export | In progress | Archive pagination, export, and deletion remain | 2026-08-05 |
| 21 | Accessibility | Not started |  |  |
| 22 | Security | Not started |  |  |
| 23 | Testing | Not started |  |  |
| 24 | Production | In progress | Repository-owner Git connection and remaining product phases | 2026-08-03 |

---

# 31. Current Sprint Notes

## Current phase

- [~] Phase: 19 — Optional AI-assisted planning

## Goal

- [~] Goal: Add a private, validated AI planning draft that never bypasses human review.

## Blockers

- [ ] The personal GitHub repository owner must connect the repository to Vercel; collaborator access cannot create that Git integration.
- [~] Production image/PDF upload smoke testing remains.
- [~] OpenRouter is configured on development and production; the latest live smoke test exhausted temporarily busy/unavailable free routes and correctly preserved manual planning.

## Codex result

- Public deployment updated: `https://maylamdi.vercel.app`.
- Production Convex updated: `reminiscent-narwhal-80`.
- Added persistent projects, project-member planning records, and framework-derived phases.
- Added a consolidated project setup interface with project details, seven presets, custom frameworks, phase preview, member selection, skills, availability, workload, preferences, capacity, and final confirmation.
- Added a live team project list and project creation activity event.
- Added project workspaces with milestones, task creation, owners, collaborators, skills, effort, difficulty, weight, dates, dependencies, optional review assignment, search, filters, and live status controls.
- Connected saved weighted tasks, milestones, and practical project status to the live boss encounter.
- Added full task editing and reassignment, dependency-cycle detection, dependency-aware deletion protection, and an explicit in-app deletion confirmation.
- Added task evidence notes, external links, images, and PDFs with upload progress, file limits, protected download URLs, and authenticated activity logging.
- Added pending review requests, assigned-reviewer enforcement, approvals, changes requested with comments, task reopening, and progress recalculation.
- Added one deterministic allocation engine for every framework using skills, availability, current workload, preferences, dependency readiness, estimated effort, and weekly capacity.
- Added inspectable 100-point score breakdowns, per-candidate explanations, and explicit human-confirmed reassignment.
- Added workload summaries by member and phase plus rule-based overdue, dependency, pending-review, overload, due-date-overlap, and milestone risk flags.
- Added a paginated realtime team activity timeline with readable event descriptions and local date/time display.
- Added persistent per-person unread state, unread-only filtering, live notification counts, and a mark-all-read action.
- Added editable phase status cards supporting overlapping and nonlinear workflows without forcing a graph editor.
- Added automatic project planning, active, at-risk, overdue, and completed lifecycle history whenever task progress changes.
- Added reversible project archiving with explicit confirmation, read-only protection, visible archived projects, and restore controls.
- Added an authenticated Convex AI action using a configurable four-model free-only chain, bounded retries, exponential backoff, `Retry-After`, structured-to-JSON-only degradation, timeout/capacity handling, and no browser-side key or model exposure.
- Added strict AI plan validation for project dates, phase/member IDs, owners, reviewers, collaborators, output limits, numeric ranges, and circular dependencies.
- Added an editable AI planning draft for milestones and tasks with risks, assumptions, owner explanations, long-task breakdowns, discard/retry controls, and explicit handoff into the existing manual confirmation forms.
- Packages: no package added or removed.
- Schema/index changes: added `taskEvidence`, `taskReviews`, and `activityReadStates`; added task/reviewer/read-state indexes, storage IDs, file metadata, and typed evidence/review/phase/project lifecycle metadata.
- Security: archive and phase changes require project access; archived projects reject task, evidence, and review writes; activity history and read-state changes require team membership; evidence reads require team access; evidence writes require project permission; upload type and actual stored size are rechecked on the backend; only the assigned reviewer can approve or request changes; review-required tasks cannot bypass approval.
- Tests passed: Convex generation/development deployment, typecheck, lint, 51 tests, local production build, Vercel production build, production Convex deployment, public HTTP check, fallback-chain simulation, retry/backoff checks, and public-bundle privacy scan.
- Tests failed: none.
- Live free-provider result: no model completed the latest smoke test; invalid/empty output was discarded, nothing was saved, and the required manual-planning message was returned.
- Remaining issue: two-account live UI verification and the later project-planning sections are still required.

## Next action

- [x] Add saved project, member-plan, and phase data
- [x] Add consolidated project details and framework selection
- [x] Add member planning inputs and phase preview
- [x] Add milestones and the initial task plan
- [x] Connect saved tasks to weighted progress and boss health
- [x] Add task edit, delete, and reassignment
- [x] Add evidence submission and review outcomes
- [x] Add deterministic allocation suggestions and workload/risk support
- [x] Add activity history and persistent in-app notifications
- [x] Add phase lifecycle controls and reversible project archiving
- [x] Add validated AI planning drafts and manual-form handoff
- [ ] Configure the private OpenRouter key and run a live AI generation test
- [ ] Run production image and PDF upload smoke tests
- [ ] Run the two-account project realtime test
