# Changelog

All notable changes to the Housing Tracker project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planning & Documentation
- Created comprehensive Technical Specification (TECHNICAL_SPEC.md)
- Created Project Plan with task tracking (PROJECT_PLAN.md)
- Created Changelog (CHANGELOG.md)
- Reviewed existing codebase and documentation

---

## [0.1.0] - 2025-11-11 (Prototype)

### Initial Prototype Features

#### Criteria Management
- Add custom must-have and nice-to-have criteria
- Define criterion descriptions
- Edit and delete criteria

#### Property Management
- Track properties with full details (address, price, specs)
- Add notes and listing URLs
- Archive properties
- Manual geocoding (lat/long input)

#### Rating System
- Rate properties on 3-point scale (Meets/Partial/Doesn't Meet)
- Add notes per criterion
- Mobile-optimized rating form

#### Reports & Analytics
- Tier 1 view (meets all must-haves)
- Tier 2 view (all properties ranked)
- Weighted scoring: (Must-Have × 3) + (Nice-to-Have × 1)
- CSV export

#### Map View
- Interactive map with Leaflet
- Property pins with popups
- Geocoding cache

#### Tech Stack
- React 18 + TypeScript + Vite
- Tailwind CSS
- Supabase (PostgreSQL + Auth)
- React Leaflet

### Security
- Row Level Security (RLS) enabled
- Public access policies (prototype only)

---

## Roadmap

### [0.2.0] - MVP Release (Target: January 2026)

#### Authentication & User Management
- Email/password authentication
- User profiles
- Session management

#### Group Collaboration
- Create and join search groups
- Invite system (codes and links)
- Group member management
- Role-based permissions (owner/member)

#### Multi-User Ratings
- Per-user rating tracking
- Aggregate ratings view
- Individual vs group perspectives
- Consensus metrics

#### Financial Modeling
- Complete cost tracking (rent, utilities, fees)
- Promotional deal modeling
- Month 1 / Year 1 / Year 2 projections
- Cost comparison views

#### Security Enhancements
- Group-based data isolation
- User-scoped ratings
- Comprehensive RLS policies
- Secure invite system

#### UX Improvements
- Onboarding flow
- Loading states
- Error handling
- Mobile optimization
- Accessibility improvements

### [0.3.0] - Post-MVP Enhancements

- Real-time collaboration (Supabase Realtime)
- Activity feed
- Email notifications
- Photo uploads
- Multiple groups per user
- Advanced financial features
- Social features

---

## Version History

- **0.1.0** (2025-11-11): Initial prototype
- **0.2.0** (Planned 2026-01): MVP release
- **0.3.0** (Future): Post-MVP enhancements

---

## Template for Future Entries

### [Version] - YYYY-MM-DD

#### Added
- New features

#### Changed
- Changes to existing features

#### Deprecated
- Soon-to-be removed features

#### Removed
- Removed features

#### Fixed
- Bug fixes

#### Security
- Security improvements

---

**Maintained by**: Housing Tracker Development Team
**Last Updated**: November 11, 2025
