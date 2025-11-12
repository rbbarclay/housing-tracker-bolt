# Project Management Guide

This guide explains how to use and maintain the project planning documents.

---

## 📚 Document Structure

### Core Planning Documents

| Document | Purpose | Update Frequency |
|----------|---------|------------------|
| **TECHNICAL_SPEC.md** | Architecture, design decisions, implementation details | Updated when architecture changes |
| **PROJECT_PLAN.md** | Task tracking, progress monitoring, phase status | Updated daily during active development |
| **CHANGELOG.md** | Version history, feature tracking | Updated with each significant change |
| **prd-mvp.md** | Product requirements, user stories | Updated when requirements change |
| **USER_MANAGEMENT_PLAN.md** | User/auth architecture details | Reference only (incorporated into TECHNICAL_SPEC) |

---

## 🔄 How to Track Progress

### Daily Updates

1. **Start of Day**
   - Review current phase tasks in `PROJECT_PLAN.md`
   - Check off completed tasks from previous day
   - Identify tasks for today
   - Update phase status if needed

2. **During Development**
   - Check off tasks as you complete them
   - Add notes about decisions or blockers
   - Update CHANGELOG.md for significant changes

3. **End of Day**
   - Review completed tasks
   - Update phase progress percentage
   - Note any blockers or issues
   - Commit changes to git

### Example Daily Workflow

```bash
# Morning - pull latest changes
git pull

# Edit PROJECT_PLAN.md to mark tasks complete
# Use checkboxes: - [x] for done, - [ ] for not done

# During the day - commit progress regularly
git add PROJECT_PLAN.md CHANGELOG.md
git commit -m "progress: Completed tasks 1.8-1.12 in Phase 1"

# End of day - push changes
git push
```

---

## ✅ Using the Task Checklists

### Task Format

Each task in PROJECT_PLAN.md follows this format:

```markdown
- [ ] **X.Y** Task description
```

Where:
- `[ ]` = Not started
- `[x]` = Complete
- `X` = Phase number
- `Y` = Task number

### Marking Tasks Complete

```markdown
# Before
- [ ] **1.8** Create `src/contexts/AuthContext.tsx`

# After
- [x] **1.8** Create `src/contexts/AuthContext.tsx`
```

### Adding Notes

```markdown
- [x] **1.8** Create `src/contexts/AuthContext.tsx`
  *Note: Added additional error handling for session refresh*
```

---

## 📊 Updating Phase Status

### Phase Status Indicators

| Symbol | Meaning |
|--------|---------|
| ⚪ | Not Started |
| 🔵 | In Progress |
| ✅ | Complete |
| 🔴 | Blocked |

### Updating Phase Table

In PROJECT_PLAN.md, update the phase completion tracker:

```markdown
| Phase | Status | Duration | Start Date | End Date | Progress |
|-------|--------|----------|------------|----------|----------|
| **Phase 1** | 🔵 In Progress | 3-4 days | 2025-11-15 | 2025-11-18 | 40% |
```

### Calculating Progress

```
Progress = (Completed Tasks / Total Tasks) × 100
```

Example:
- Total tasks in Phase 1: 29
- Completed tasks: 12
- Progress: (12 / 29) × 100 = 41%

---

## 📝 Updating the CHANGELOG

### When to Update

Update CHANGELOG.md when you:
- Complete a phase
- Add a significant feature
- Fix an important bug
- Make architectural changes
- Deploy to production

### Format

```markdown
## [Unreleased]

### Added
- Authentication system with email/password
- User profile management
- Session persistence

### Changed
- Updated CriteriaManager to support groups

### Fixed
- Fixed session refresh bug on page reload
```

### Example Commit

```bash
git add CHANGELOG.md
git commit -m "docs: Update changelog for Phase 1 completion"
```

---

## 🎯 Phase Workflow

### Starting a New Phase

1. **Update PROJECT_PLAN.md:**
   ```markdown
   | **Phase 1** | 🔵 In Progress | 3-4 days | 2025-11-15 | - | 0% |
   ```

2. **Create a git branch (optional):**
   ```bash
   git checkout -b phase-1-authentication
   ```

3. **Review all tasks for the phase**
4. **Begin implementation**

### During a Phase

1. Check off tasks as you complete them
2. Add notes about decisions or issues
3. Commit regularly (at least daily)
4. Update progress percentage
5. Update CHANGELOG.md for significant features

### Completing a Phase

1. **Verify all tasks are complete:**
   ```markdown
   - [x] **1.1** Install dependencies
   - [x] **1.2** Create migrations
   ...all other tasks...
   ```

2. **Update phase status:**
   ```markdown
   | **Phase 1** | ✅ Complete | 3-4 days | 2025-11-15 | 2025-11-18 | 100% |
   ```

3. **Update CHANGELOG.md:**
   ```markdown
   ### Phase 1 Complete - 2025-11-18
   - Implemented authentication system
   - Created user profiles
   - Set up protected routes
   ```

4. **Commit and merge (if using branches):**
   ```bash
   git add .
   git commit -m "feat: Complete Phase 1 - Authentication Foundation"
   git checkout main
   git merge phase-1-authentication
   git push
   ```

5. **Update overall progress:**
   ```markdown
   | **Overall Progress** | 11% (1/9 phases complete) |
   ```

---

## 🐛 Tracking Issues

### In PROJECT_PLAN.md

Update the "Known Issues & Blockers" section:

```markdown
## 🐛 KNOWN ISSUES & BLOCKERS

### Current Blockers
- **Phase 1**: Supabase email verification not working in development
  - **Impact**: Cannot test signup flow completely
  - **Solution**: Disable email verification for development

### Known Issues
- Session refresh sometimes fails on slow connections (Priority: Medium)
- Mobile keyboard covers input fields on iOS (Priority: High)
```

### Creating GitHub Issues (Optional)

For more formal tracking:

```bash
# Label with phase and priority
[Phase 1] Session refresh fails on slow connections
Priority: Medium
Phase: Phase 1 - Authentication
```

---

## 📈 Metrics Tracking

### Development Metrics

Track in PROJECT_PLAN.md weekly:

```markdown
### Week 1 (Nov 11-17)
- Tasks completed: 45
- Lines of code added: 2,340
- Components created: 12
- Tests written: 8
- Bugs found: 3
- Bugs fixed: 2
```

---

## 🔄 Git Workflow

### Recommended Commit Message Format

```
type(scope): Short description

Longer description if needed

- Bullet points for details
- References to issues or tasks

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `test`: Adding tests
- `chore`: Changes to build process or auxiliary tools
- `progress`: Daily progress updates

**Examples:**

```bash
# Completing tasks
git commit -m "feat(auth): Implement login and signup forms

- Created LoginForm component
- Created SignUpForm component
- Added form validation with Zod
- Completed tasks 1.12, 1.13, 1.20

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>"

# Daily progress
git commit -m "progress: Completed Phase 1 tasks 1.8-1.15

Updated PROJECT_PLAN.md with progress.
Phase 1 now at 52% complete (15/29 tasks).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>"

# Bug fix
git commit -m "fix(auth): Resolve session refresh error

Fixed bug where session would expire prematurely.
Added retry logic with exponential backoff.

Fixes task 1.27 from Phase 1.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## 📅 Weekly Reviews

### Every Friday (or End of Week)

1. **Review overall progress**
   - Update phase completion table
   - Calculate overall % complete
   - Check if on track for timeline

2. **Update metrics**
   - Tasks completed this week
   - Features delivered
   - Bugs found/fixed
   - Performance benchmarks

3. **Plan next week**
   - Identify tasks for next week
   - Note any blockers
   - Adjust timeline if needed

4. **Update stakeholders**
   - Share progress summary
   - Highlight achievements
   - Communicate blockers or delays

### Weekly Summary Template

```markdown
## Week 1 Summary (Nov 11-17, 2025)

### Progress
- **Overall**: 11% complete (1/9 phases)
- **Current Phase**: Phase 1 - Authentication (100% ✅)
- **Next Phase**: Phase 2 - Database Migration

### Achievements
- Completed full authentication system
- Created 12 new components
- Set up protected routing
- Wrote 8 unit tests

### Metrics
- Tasks completed: 29/29 (Phase 1)
- Lines of code: 2,340
- Bugs fixed: 3

### Blockers
- None

### Next Week Plan
- Begin Phase 2: Database Schema Migration
- Create all new tables
- Implement RLS policies
- Test data isolation

### Timeline
- On track ✅
- Expected completion: January 6, 2026
```

---

## 🎯 Quick Reference

### Daily Checklist

- [ ] Pull latest changes (`git pull`)
- [ ] Check PROJECT_PLAN.md for today's tasks
- [ ] Work on tasks
- [ ] Check off completed tasks
- [ ] Update CHANGELOG.md if needed
- [ ] Commit progress (`git commit`)
- [ ] Push changes (`git push`)

### Phase Transition Checklist

- [ ] All tasks checked off
- [ ] Phase status updated to ✅
- [ ] Progress set to 100%
- [ ] Start and end dates filled
- [ ] CHANGELOG.md updated
- [ ] Deliverables verified
- [ ] Changes committed and pushed
- [ ] Overall progress updated

### Pre-Deployment Checklist

- [ ] All 9 phases complete
- [ ] All tests passing
- [ ] CHANGELOG.md up to date
- [ ] README.md updated
- [ ] Documentation complete
- [ ] Environment variables configured
- [ ] Database migrations ready

---

## 📞 Getting Help

### If You're Blocked

1. **Document the blocker** in PROJECT_PLAN.md
2. **Try to find a workaround** (document it)
3. **Ask for help** from team or community
4. **Move to other tasks** while blocked
5. **Update timeline** if significant delay

### If Requirements Change

1. **Update prd-mvp.md** with new requirements
2. **Update TECHNICAL_SPEC.md** if architecture changes
3. **Update PROJECT_PLAN.md** with new tasks
4. **Adjust timeline** as needed
5. **Document decision** in decision log
6. **Commit changes**

---

## 🎉 Celebrating Milestones

### Suggested Milestones

- ✅ Complete Phase 1 (Authentication)
- ✅ Complete Phase 3 (Groups & Invites)
- ✅ Complete Phase 6 (Financial Modeling)
- ✅ All phases complete
- ✅ First successful deployment
- ✅ First 10 users
- ✅ First 100 users

**Document achievements in CHANGELOG.md!**

---

**Remember:** These documents are living artifacts. Update them regularly to keep the project organized and on track!
