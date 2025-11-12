# Claude Code Session Management

This directory contains prompts and context for Claude Code sessions.

## Files in This Directory

### SESSION_PROMPT.md
**Comprehensive session prompt** with full context, guidelines, and examples.

- **Use when**: Starting a new development session
- **Length**: ~500 lines with detailed explanations
- **Contains**: Full context, principles, workflow, examples

### QUICK_START.txt
**Condensed copy-paste prompt** for quick session starts.

- **Use when**: You just need to get started fast
- **Length**: ~80 lines, essential info only
- **Contains**: Core context and instructions

## How to Use

### Option 1: Full Context (Recommended for first session or after breaks)

1. Open `.claude/SESSION_PROMPT.md`
2. Copy the entire prompt from the code block
3. Paste into new Claude Code session
4. Wait for Claude to read docs and summarize

### Option 2: Quick Start (For daily sessions)

1. Open `.claude/QUICK_START.txt`
2. Copy everything after the first divider line
3. Paste into new Claude Code session
4. Start working immediately

### Option 3: Custom Prompt (For specific needs)

Start with QUICK_START.txt and add:

```
Additional context: [Describe what you're working on]
Focus area: [Specific phase or feature]
Known issues: [Any blockers or problems]
```

## What Claude Will Do

After receiving the prompt, Claude will:

1. ✅ Read `PROJECT_PLAN.md` to find current phase
2. ✅ Check task completion status
3. ✅ Review recent changes in `CHANGELOG.md`
4. ✅ Summarize current state
5. ✅ Ask what you want to work on
6. ✅ Reference `TECHNICAL_SPEC.md` during implementation
7. ✅ Remind you to update docs
8. ✅ Use proper commit message format

## Tips for Effective Sessions

### Before Starting
- [ ] Have `PROJECT_PLAN.md` open in an editor
- [ ] Review last session's progress
- [ ] Know which tasks you want to tackle
- [ ] Check for any noted blockers

### During Session
- [ ] Let Claude read docs before asking for work
- [ ] Work on one task at a time
- [ ] Update `PROJECT_PLAN.md` as you complete tasks
- [ ] Commit frequently
- [ ] Test as you go

### After Session
- [ ] Update phase progress percentage
- [ ] Update `CHANGELOG.md` if you completed features
- [ ] Commit all documentation changes
- [ ] Push to git
- [ ] Note any blockers for next session

## Customization Examples

### For Debugging
```
[Paste QUICK_START.txt]

Additional context: I'm debugging an issue with session refresh.
Focus: Don't implement new features, just fix the auth bug.
```

### For Code Review
```
[Paste QUICK_START.txt]

Additional context: I've completed Phase 1 tasks 1.1-1.15.
Task: Review my code for security issues, TypeScript errors, and adherence to TECHNICAL_SPEC.md patterns.
```

### For Specific Phase
```
[Paste QUICK_START.txt]

Additional context: Starting Phase 3 (Groups & Invites).
Focus: Only work on tasks 3.1-3.30, ignore other phases.
```

## Troubleshooting

### Claude doesn't read the docs
**Problem**: Claude responds without checking `PROJECT_PLAN.md`
**Solution**: Explicitly ask: "Before answering, please read PROJECT_PLAN.md and tell me the current phase and progress."

### Claude suggests skipping tasks
**Problem**: Claude wants to jump ahead or skip tasks
**Solution**: Remind: "Please follow the task order in PROJECT_PLAN.md. We need to complete Phase N before moving to Phase N+1."

### Claude doesn't update docs
**Problem**: Claude implements features but doesn't update tracking
**Solution**: Add to prompt: "After completing each task, remind me to update PROJECT_PLAN.md and CHANGELOG.md."

### Context gets lost mid-session
**Problem**: Long session, Claude forgets earlier context
**Solution**: Periodically say: "Review PROJECT_PLAN.md to confirm current phase and progress."

## Session Templates

### Daily Development Session
```
[QUICK_START.txt]

I'm ready to work on the next tasks in the current phase.
Please summarize status and ask which tasks I want to tackle.
```

### Bug Fix Session
```
[QUICK_START.txt]

I'm fixing bugs rather than implementing new features.
Check PROJECT_PLAN.md Known Issues section.
Focus on stability and test coverage.
```

### Code Review Session
```
[QUICK_START.txt]

Please review the code I've written for [Phase/Feature].
Check against TECHNICAL_SPEC.md patterns.
Look for: security issues, TypeScript errors, best practices violations.
```

### Planning Session
```
[QUICK_START.txt]

We're planning implementation for Phase N.
Review tasks N.1-N.X in PROJECT_PLAN.md.
Help me understand dependencies and potential challenges.
Don't implement yet, just discuss approach.
```

## File Maintenance

These prompt files should be updated when:

- Major architecture changes occur
- New phases are added beyond Phase 9
- Tech stack changes significantly
- Workflow processes change

**To update**: Edit the relevant file and commit with message:
```
docs(claude): Update session prompt with [change description]
```

## Quick Reference Card

| Need | Use | Time |
|------|-----|------|
| First session ever | SESSION_PROMPT.md full prompt | 5 min |
| Daily development | QUICK_START.txt | 30 sec |
| After a break (1+ week) | SESSION_PROMPT.md full prompt | 5 min |
| Specific feature focus | QUICK_START.txt + custom context | 1 min |
| Code review | QUICK_START.txt + review instructions | 1 min |
| Debugging | QUICK_START.txt + bug description | 1 min |

---

**Remember**: The prompt is just the starting point. Claude adapts to your communication style, so be direct about what you need!
