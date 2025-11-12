# Housing Tracker MVP - Technical Specification & Implementation Plan

**Document Owner**: Engineering Team
**Last Updated**: November 11, 2025
**Status**: Ready for Implementation
**Version**: 1.0

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Technology Stack](#technology-stack)
4. [Database Design](#database-design)
5. [API & Data Layer](#api--data-layer)
6. [Frontend Architecture](#frontend-architecture)
7. [Security Architecture](#security-architecture)
8. [Scalability & Performance](#scalability--performance)
9. [Implementation Plan](#implementation-plan)
10. [Testing Strategy](#testing-strategy)
11. [Deployment Strategy](#deployment-strategy)
12. [Monitoring & Observability](#monitoring--observability)
13. [Migration Strategy](#migration-strategy)

---

## EXECUTIVE SUMMARY

This document outlines the technical architecture for transforming the Housing Tracker from a single-user prototype into a production-ready multi-user collaborative platform. The architecture prioritizes:

- **Scalability**: Support 10,000+ users with minimal infrastructure changes
- **Security**: Zero-trust data isolation with Supabase RLS
- **Maintainability**: Clean separation of concerns, TypeScript strict mode, modular components
- **Flexibility**: Easy to extend with new features based on user feedback

### Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Authentication** | Supabase Auth | Native integration, battle-tested, handles edge cases |
| **State Management** | React Context + Hooks | Sufficient for MVP, avoid over-engineering |
| **Routing** | React Router v6 | Industry standard, excellent TypeScript support |
| **Data Fetching** | Supabase Client SDK | Auto-generated types, RLS enforcement, real-time ready |
| **Form Handling** | Controlled components + validation hooks | Lightweight, full control, gradual enhancement path |
| **Code Organization** | Feature-based folders | Scalable, supports future microservices if needed |

---

## ARCHITECTURE OVERVIEW

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT TIER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   React UI   │  │  React Router│  │  Auth Context│          │
│  │  Components  │→ │  Navigation  │→ │  + Session   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│          ↓                                    ↓                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │Group Context │  │ Data Hooks   │  │ Supabase SDK │          │
│  │  + Active    │→ │ (useProperty,│→ │   Client     │          │
│  │    Group     │  │  useCriteria)│  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTPS (RLS enforced)
┌───────────────────────────────┴─────────────────────────────────┐
│                     SUPABASE BACKEND TIER                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Supabase Auth│  │  PostgreSQL  │  │  Edge Funcs  │          │
│  │   Service    │  │  + RLS       │  │  (Optional)  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌──────────────────────────────────────────────────┐           │
│  │              Row Level Security Policies         │           │
│  │  - Group-based data isolation                   │           │
│  │  - User-scoped ratings                          │           │
│  │  - Role-based group management                  │           │
│  └──────────────────────────────────────────────────┘           │
└──────────────────────────────────────────────────────────────────┘
```

### Data Flow Patterns

#### Authentication Flow
```
User → Login Form → Supabase Auth → JWT Token → AuthContext →
Protected Routes → Load User Groups → Set Active Group → Load Group Data
```

#### Group Collaboration Flow
```
Owner Creates Group → Generate Invite → Share Link/Code →
Invited User Signs Up → Auto-join Group → Load Shared Data →
Each User Rates Independently → Aggregate in Reports
```

#### Financial Calculation Flow
```
User Enters Costs → Validation → Calculate Month 1/Year 1/Year 2 →
Store in property_financials → Display in Property Cards →
Sort/Compare in Reports → Export to CSV
```

---

## TECHNOLOGY STACK

### Frontend Dependencies

```json
{
  "dependencies": {
    // Core
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.20.0",  // NEW

    // State & Data
    "@supabase/supabase-js": "^2.57.4",

    // UI & Styling
    "tailwindcss": "^3.4.1",
    "lucide-react": "^0.344.0",

    // Maps
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",

    // Forms & Validation
    "zod": "^3.22.4",  // NEW - Runtime validation

    // Utilities
    "date-fns": "^3.0.0"  // NEW - Date formatting
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.5.3",
    "vite": "^5.4.2",
    "autoprefixer": "^10.4.18",
    "postcss": "^8.4.35",

    // Testing (Phase 8)
    "vitest": "^1.0.0",  // NEW
    "@testing-library/react": "^14.0.0",  // NEW
    "@testing-library/user-event": "^14.0.0"  // NEW
  }
}
```

### Backend (Supabase)

- **Database**: PostgreSQL 15+
- **Authentication**: Supabase Auth (email/password provider)
- **Storage**: Supabase Storage (future: property photos)
- **Realtime**: Supabase Realtime (optional Phase 7)
- **Edge Functions**: Supabase Edge Functions (optional for complex calculations)

### External Services

- **Geocoding**: Nominatim (OpenStreetMap) - Free tier
- **Hosting**: Vercel (Frontend)
- **Analytics**: Vercel Analytics (built-in, privacy-friendly)
- **Error Tracking**: Sentry (optional, post-MVP)

---

## DATABASE DESIGN

### Entity Relationship Diagram

```
┌─────────────────┐
│   auth.users    │ (Supabase managed)
│  - id (PK)      │
│  - email        │
│  - created_at   │
└────────┬────────┘
         │
         ├────────────────────────────────────┐
         │                                    │
         ↓                                    ↓
┌──────────────────┐              ┌─────────────────────┐
│  user_profiles   │              │  search_groups      │
│  - id (PK, FK)   │              │  - id (PK)          │
│  - display_name  │              │  - name             │
│  - phone         │              │  - created_by (FK)  │
│  - created_at    │              │  - created_at       │
└──────────────────┘              └──────────┬──────────┘
         ↓                                   │
┌──────────────────┐                        │
│  group_members   │←───────────────────────┘
│  - id (PK)       │
│  - group_id (FK) │
│  - user_id (FK)  │
│  - role          │
│  - joined_at     │
└──────────────────┘
         ↓
┌──────────────────┐              ┌─────────────────────┐
│  group_invites   │              │    criteria         │
│  - id (PK)       │              │  - id (PK)          │
│  - group_id (FK) │              │  - group_id (FK)    │
│  - invite_code   │              │  - name             │
│  - expires_at    │              │  - type             │
│  - max_uses      │              │  - definition       │
│  - used_count    │              └──────────┬──────────┘
└──────────────────┘                         │
                                             │
         ┌───────────────────────────────────┘
         │
         ↓
┌─────────────────────┐          ┌─────────────────────┐
│    properties       │          │      ratings        │
│  - id (PK)          │          │  - id (PK)          │
│  - group_id (FK)    │←─────────│  - property_id (FK) │
│  - name             │          │  - criterion_id(FK) │
│  - address          │          │  - user_id (FK)     │
│  - neighborhood     │          │  - score (1-3)      │
│  - price            │          │  - notes            │
│  - bedrooms         │          └─────────────────────┘
│  - bathrooms        │
│  - sqft             │
│  - archived         │
│  - latitude         │
│  - longitude        │
└──────────┬──────────┘
           │
           ↓
┌───────────────────────┐
│ property_financials   │
│  - id (PK)            │
│  - property_id (FK)   │
│  - base_rent          │
│  - utilities_estimate │
│  - pet_rent           │
│  - parking_cost       │
│  - storage_cost       │
│  - renters_insurance  │
│  - other_monthly      │
│  - application_fee    │
│  - security_deposit   │
│  - admin_fees         │
│  - promo_type         │
│  - promo_months_free  │
│  - month_1_cost       │
│  - year_1_total       │
│  - year_1_avg_monthly │
│  - year_2_monthly_est │
└───────────────────────┘

┌─────────────────────┐          ┌─────────────────────┐
│     locations       │          │  geocoding_cache    │
│  - id (PK)          │          │  - id (PK)          │
│  - group_id (FK)    │          │  - address          │
│  - name             │          │  - latitude         │
│  - address          │          │  - longitude        │
│  - latitude         │          │  - created_at       │
│  - longitude        │          └─────────────────────┘
└─────────────────────┘          (Global cache, no group_id)
```

### Complete Schema Definitions

#### New Tables

```sql
-- User Profiles (extends auth.users)
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Search Groups
CREATE TABLE search_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Group Members (junction table with roles)
CREATE TABLE group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES search_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Group Invites
CREATE TABLE group_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES search_groups(id) ON DELETE CASCADE,
  invite_code text UNIQUE NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  max_uses integer DEFAULT 10,
  used_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),

  CHECK (used_count <= max_uses),
  CHECK (expires_at > created_at)
);

-- Property Financials
CREATE TABLE property_financials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,

  -- Monthly recurring costs
  base_rent numeric NOT NULL DEFAULT 0,
  utilities_estimate numeric DEFAULT 0,
  pet_rent numeric DEFAULT 0,
  parking_cost numeric DEFAULT 0,
  storage_cost numeric DEFAULT 0,
  renters_insurance numeric DEFAULT 0,
  other_monthly_costs numeric DEFAULT 0,
  other_monthly_notes text,

  -- One-time costs
  application_fee numeric DEFAULT 0,
  security_deposit numeric DEFAULT 0,
  admin_fees numeric DEFAULT 0,
  other_onetime_costs numeric DEFAULT 0,
  other_onetime_notes text,

  -- Promotional deals
  promo_type text DEFAULT 'none' CHECK (promo_type IN ('none', 'months_free', 'reduced_rate', 'other')),
  promo_months_free integer DEFAULT 0,
  promo_reduced_amount numeric DEFAULT 0,
  promo_notes text,

  -- Projection settings
  lease_term_months integer DEFAULT 12,
  expected_rent_increase_pct numeric DEFAULT 3.0,

  -- Calculated fields (computed on save via trigger or application logic)
  month_1_cost numeric,
  year_1_total_cost numeric,
  year_1_avg_monthly numeric,
  year_2_monthly_estimate numeric,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(property_id)
);
```

#### Schema Modifications

```sql
-- Add group_id to existing tables
ALTER TABLE criteria ADD COLUMN group_id uuid REFERENCES search_groups(id) ON DELETE CASCADE;
ALTER TABLE properties ADD COLUMN group_id uuid REFERENCES search_groups(id) ON DELETE CASCADE;
ALTER TABLE locations ADD COLUMN group_id uuid REFERENCES search_groups(id) ON DELETE CASCADE;

-- Add user_id to ratings and change unique constraint
ALTER TABLE ratings ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE ratings DROP CONSTRAINT IF EXISTS ratings_property_id_criterion_id_key;
ALTER TABLE ratings ADD CONSTRAINT ratings_property_criterion_user_unique
  UNIQUE(property_id, criterion_id, user_id);

-- Create indexes for performance
CREATE INDEX idx_criteria_group_id ON criteria(group_id);
CREATE INDEX idx_properties_group_id ON properties(group_id);
CREATE INDEX idx_locations_group_id ON locations(group_id);
CREATE INDEX idx_ratings_user_id ON ratings(user_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_invites_code ON group_invites(invite_code);
CREATE INDEX idx_property_financials_property_id ON property_financials(property_id);

-- Add NOT NULL constraints after migration
-- (Initially nullable to allow gradual migration)
-- After migration completes:
-- ALTER TABLE criteria ALTER COLUMN group_id SET NOT NULL;
-- ALTER TABLE properties ALTER COLUMN group_id SET NOT NULL;
-- ALTER TABLE ratings ALTER COLUMN user_id SET NOT NULL;
```

#### Database Triggers

```sql
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_search_groups_updated_at BEFORE UPDATE ON search_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_property_financials_updated_at BEFORE UPDATE ON property_financials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create user_profile on signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Calculate financial metrics on save
CREATE OR REPLACE FUNCTION calculate_financial_metrics()
RETURNS TRIGGER AS $$
DECLARE
  monthly_recurring numeric;
  total_onetime numeric;
  promo_discount numeric;
BEGIN
  -- Calculate monthly recurring costs
  monthly_recurring := COALESCE(NEW.base_rent, 0) +
                      COALESCE(NEW.utilities_estimate, 0) +
                      COALESCE(NEW.pet_rent, 0) +
                      COALESCE(NEW.parking_cost, 0) +
                      COALESCE(NEW.storage_cost, 0) +
                      COALESCE(NEW.renters_insurance, 0) +
                      COALESCE(NEW.other_monthly_costs, 0);

  -- Calculate one-time costs
  total_onetime := COALESCE(NEW.application_fee, 0) +
                   COALESCE(NEW.security_deposit, 0) +
                   COALESCE(NEW.admin_fees, 0) +
                   COALESCE(NEW.other_onetime_costs, 0);

  -- Calculate promotional discount
  IF NEW.promo_type = 'months_free' THEN
    promo_discount := COALESCE(NEW.base_rent, 0) * COALESCE(NEW.promo_months_free, 0);
  ELSIF NEW.promo_type = 'reduced_rate' THEN
    promo_discount := COALESCE(NEW.promo_reduced_amount, 0);
  ELSE
    promo_discount := 0;
  END IF;

  -- Month 1 Cost (first month + one-time fees)
  NEW.month_1_cost := monthly_recurring + total_onetime -
    (CASE WHEN NEW.promo_type = 'months_free' AND NEW.promo_months_free > 0
          THEN COALESCE(NEW.base_rent, 0)
          ELSE COALESCE(NEW.promo_reduced_amount, 0)
     END);

  -- Year 1 Total Cost
  NEW.year_1_total_cost := (monthly_recurring * NEW.lease_term_months) +
                            total_onetime - promo_discount;

  -- Year 1 Average Monthly
  NEW.year_1_avg_monthly := NEW.year_1_total_cost / NEW.lease_term_months;

  -- Year 2 Monthly Estimate (no promo, no one-time)
  NEW.year_2_monthly_estimate := monthly_recurring *
    (1 + (COALESCE(NEW.expected_rent_increase_pct, 3.0) / 100));

  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_financials_on_save
  BEFORE INSERT OR UPDATE ON property_financials
  FOR EACH ROW EXECUTE FUNCTION calculate_financial_metrics();
```

---

## API & DATA LAYER

### Data Access Patterns

We'll use **custom hooks** for data fetching to centralize logic and make components cleaner.

#### Hook Structure

```typescript
// src/hooks/useAuth.ts
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth methods
  async function signIn(email: string, password: string) { ... }
  async function signUp(email: string, password: string, displayName: string) { ... }
  async function signOut() { ... }

  return { user, session, loading, signIn, signUp, signOut };
}

// src/hooks/useGroups.ts
export function useGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [activeGroup, setActiveGroup] = useState<SearchGroup | null>(null);

  // Group methods
  async function createGroup(name: string) { ... }
  async function joinGroup(inviteCode: string) { ... }
  async function generateInvite(groupId: string) { ... }

  return { groups, activeGroup, createGroup, joinGroup, generateInvite };
}

// src/hooks/useCriteria.ts
export function useCriteria(groupId: string) {
  const [criteria, setCriteria] = useState<Criterion[]>([]);

  async function addCriterion(data: CreateCriterionDto) { ... }
  async function updateCriterion(id: string, data: UpdateCriterionDto) { ... }
  async function deleteCriterion(id: string) { ... }

  return { criteria, addCriterion, updateCriterion, deleteCriterion };
}

// Similar hooks for:
// - useProperties(groupId)
// - useRatings(propertyId, userId?)
// - useFinancials(propertyId)
// - useGroupMembers(groupId)
```

### TypeScript Types

```typescript
// src/types/auth.ts
export interface User {
  id: string;
  email: string;
  display_name: string;
  phone?: string;
  created_at: string;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: User;
}

// src/types/groups.ts
export interface SearchGroup {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'owner' | 'member';
  joined_at: string;
  user?: User; // Joined relation
}

export interface GroupInvite {
  id: string;
  group_id: string;
  invite_code: string;
  created_by: string;
  expires_at: string;
  max_uses: number;
  used_count: number;
  created_at: string;
}

// src/types/financials.ts
export interface PropertyFinancials {
  id: string;
  property_id: string;

  // Monthly recurring
  base_rent: number;
  utilities_estimate: number;
  pet_rent: number;
  parking_cost: number;
  storage_cost: number;
  renters_insurance: number;
  other_monthly_costs: number;
  other_monthly_notes?: string;

  // One-time
  application_fee: number;
  security_deposit: number;
  admin_fees: number;
  other_onetime_costs: number;
  other_onetime_notes?: string;

  // Promotions
  promo_type: 'none' | 'months_free' | 'reduced_rate' | 'other';
  promo_months_free: number;
  promo_reduced_amount: number;
  promo_notes?: string;

  // Settings
  lease_term_months: number;
  expected_rent_increase_pct: number;

  // Calculated (read-only)
  month_1_cost: number;
  year_1_total_cost: number;
  year_1_avg_monthly: number;
  year_2_monthly_estimate: number;

  created_at: string;
  updated_at: string;
}

// Update existing types
export interface Rating {
  id: string;
  property_id: string;
  criterion_id: string;
  user_id: string;  // NEW
  score: 1 | 2 | 3;
  notes?: string;
  created_at: string;
  updated_at: string;
  user?: User;  // Joined relation (optional)
}

export interface Criterion {
  id: string;
  group_id: string;  // NEW
  name: string;
  type: 'must-have' | 'nice-to-have';
  definition?: string;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  group_id: string;  // NEW
  name: string;
  address: string;
  neighborhood: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  date_viewed?: string;
  listing_url?: string;
  notes?: string;
  archived: boolean;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
  financials?: PropertyFinancials;  // Joined relation (optional)
}
```

---

## FRONTEND ARCHITECTURE

### Folder Structure

```
src/
├── main.tsx                    # Entry point
├── App.tsx                     # Root component with routing
├── vite-env.d.ts
│
├── components/                 # Reusable UI components
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── SignUpForm.tsx
│   │   ├── ForgotPasswordForm.tsx
│   │   └── ProtectedRoute.tsx
│   │
│   ├── groups/
│   │   ├── GroupSetup.tsx
│   │   ├── GroupInvite.tsx
│   │   ├── JoinGroup.tsx
│   │   ├── GroupSettings.tsx
│   │   ├── MemberList.tsx
│   │   └── GroupSwitcher.tsx
│   │
│   ├── criteria/
│   │   ├── CriteriaManager.tsx      # Existing, refactor for groups
│   │   ├── CriterionForm.tsx
│   │   └── CriterionCard.tsx
│   │
│   ├── properties/
│   │   ├── PropertyManager.tsx      # Existing, refactor for groups
│   │   ├── PropertyForm.tsx
│   │   ├── PropertyCard.tsx
│   │   └── PropertyDetail.tsx
│   │
│   ├── financials/
│   │   ├── FinancialForm.tsx        # NEW
│   │   ├── FinancialSummary.tsx     # NEW
│   │   ├── FinancialComparison.tsx  # NEW
│   │   └── CostBreakdown.tsx        # NEW
│   │
│   ├── ratings/
│   │   ├── RatingForm.tsx           # Existing, refactor for multi-user
│   │   ├── RatingCard.tsx
│   │   └── MultiUserRatingView.tsx  # NEW
│   │
│   ├── reports/
│   │   ├── Reports.tsx              # Existing, refactor for multi-user
│   │   ├── PropertyRankingCard.tsx
│   │   └── RatingBreakdown.tsx
│   │
│   ├── map/
│   │   └── PropertyMap.tsx          # Existing
│   │
│   └── ui/                          # Generic UI components
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       ├── Dropdown.tsx
│       ├── LoadingSpinner.tsx
│       └── ErrorBoundary.tsx
│
├── hooks/                      # Custom React hooks
│   ├── useAuth.ts              # NEW
│   ├── useGroups.ts            # NEW
│   ├── useCriteria.ts          # NEW
│   ├── useProperties.ts        # NEW
│   ├── useRatings.ts           # NEW
│   ├── useFinancials.ts        # NEW
│   ├── useGroupMembers.ts      # NEW
│   └── useInvites.ts           # NEW
│
├── contexts/                   # React Context providers
│   ├── AuthContext.tsx         # NEW
│   └── GroupContext.tsx        # NEW
│
├── lib/                        # Utility libraries
│   ├── supabase.ts             # Existing
│   ├── geocoding.ts            # Existing
│   ├── scoring.ts              # Existing
│   ├── financial.ts            # NEW - Financial calculations
│   ├── validation.ts           # NEW - Zod schemas
│   └── utils.ts                # NEW - Helper functions
│
├── types/                      # TypeScript type definitions
│   ├── auth.ts                 # NEW
│   ├── groups.ts               # NEW
│   ├── financials.ts           # NEW
│   ├── index.ts                # Existing, update
│   └── supabase.ts             # Auto-generated types
│
├── pages/                      # Page-level components
│   ├── HomePage.tsx
│   ├── LoginPage.tsx           # NEW
│   ├── SignUpPage.tsx          # NEW
│   ├── OnboardingPage.tsx      # NEW
│   ├── CriteriaPage.tsx
│   ├── PropertiesPage.tsx
│   ├── PropertyDetailPage.tsx
│   ├── RatingPage.tsx
│   ├── ReportsPage.tsx
│   ├── MapPage.tsx
│   ├── SettingsPage.tsx        # NEW
│   └── NotFoundPage.tsx        # NEW
│
└── styles/
    └── index.css               # Tailwind imports
```

### Component Design Patterns

#### 1. Separation of Concerns
- **Pages**: Route-level components, data orchestration
- **Components**: Presentational, reusable
- **Hooks**: Data fetching and business logic
- **Contexts**: Global state (auth, active group)

#### 2. Props Over Context
- Use contexts only for truly global state (auth, active group)
- Pass data via props for component tree
- Avoid "prop drilling hell" with composition

#### 3. Error Boundaries
```typescript
// src/components/ui/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component<Props, State> {
  // Catch React errors and display fallback UI
}
```

#### 4. Loading States
```typescript
// Consistent loading pattern across all data hooks
const { data, loading, error, refetch } = useProperties(groupId);

if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
return <PropertyList properties={data} />;
```

### Routing Strategy

```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GroupProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/join/:inviteCode" element={<JoinGroupPage />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/" element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="criteria" element={<CriteriaPage />} />
                <Route path="properties" element={<PropertiesPage />} />
                <Route path="properties/:id" element={<PropertyDetailPage />} />
                <Route path="properties/:id/rate" element={<RatingPage />} />
                <Route path="properties/:id/financials" element={<FinancialFormPage />} />
                <Route path="map" element={<MapPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </GroupProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

### State Management Strategy

#### AuthContext
```typescript
// src/contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (session?.user) {
          // Fetch user profile
          const { data } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          setUser(data);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Implement auth methods...

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
```

#### GroupContext
```typescript
// src/contexts/GroupContext.tsx
interface GroupContextType {
  groups: SearchGroup[];
  activeGroup: SearchGroup | null;
  groupMembers: GroupMember[];
  userRole: 'owner' | 'member' | null;
  loading: boolean;
  setActiveGroup: (groupId: string) => void;
  createGroup: (name: string) => Promise<SearchGroup>;
  joinGroup: (inviteCode: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function GroupProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [activeGroup, setActiveGroup] = useState<SearchGroup | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);

  // Load user's groups on mount
  useEffect(() => {
    if (user) {
      loadUserGroups();
    }
  }, [user]);

  // Load group members when active group changes
  useEffect(() => {
    if (activeGroup) {
      loadGroupMembers(activeGroup.id);
    }
  }, [activeGroup]);

  // Implement group methods...

  return (
    <GroupContext.Provider value={{
      groups,
      activeGroup,
      groupMembers,
      userRole,
      loading,
      setActiveGroup,
      createGroup,
      joinGroup,
      leaveGroup,
      deleteGroup,
      refetch
    }}>
      {children}
    </GroupContext.Provider>
  );
}
```

---

## SECURITY ARCHITECTURE

### Row Level Security (RLS) Policies

#### Complete RLS Policy Set

```sql
-- ============================================
-- USER_PROFILES POLICIES
-- ============================================

CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================
-- SEARCH_GROUPS POLICIES
-- ============================================

CREATE POLICY "Users can view groups they belong to"
  ON search_groups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = search_groups.id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create groups"
  ON search_groups FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Group owners can update their groups"
  ON search_groups FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = search_groups.id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'owner'
    )
  );

CREATE POLICY "Group owners can delete their groups"
  ON search_groups FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = search_groups.id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'owner'
    )
  );

-- ============================================
-- GROUP_MEMBERS POLICIES
-- ============================================

CREATE POLICY "Users can view members of their groups"
  ON group_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Group owners can add members"
  ON group_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_members.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'owner'
    )
  );

CREATE POLICY "Users can leave groups or owners can remove members"
  ON group_members FOR DELETE
  TO authenticated
  USING (
    group_members.user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'owner'
    )
  );

-- ============================================
-- GROUP_INVITES POLICIES
-- ============================================

CREATE POLICY "Group members can view invites for their group"
  ON group_invites FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_invites.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Group owners can create invites"
  ON group_invites FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_invites.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'owner'
    )
  );

CREATE POLICY "Group owners can delete invites"
  ON group_invites FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_invites.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'owner'
    )
  );

-- ============================================
-- CRITERIA POLICIES
-- ============================================

CREATE POLICY "Users can view criteria for their groups"
  ON criteria FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = criteria.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can add criteria"
  ON criteria FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = criteria.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can update criteria"
  ON criteria FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = criteria.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can delete criteria"
  ON criteria FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = criteria.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- ============================================
-- PROPERTIES POLICIES
-- ============================================

CREATE POLICY "Users can view properties for their groups"
  ON properties FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = properties.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can add properties"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = properties.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can update properties"
  ON properties FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = properties.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can delete properties"
  ON properties FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = properties.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- ============================================
-- RATINGS POLICIES
-- ============================================

CREATE POLICY "Users can view all ratings in their groups"
  ON ratings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      JOIN group_members ON group_members.group_id = properties.group_id
      WHERE properties.id = ratings.property_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add their own ratings for group properties"
  ON ratings FOR INSERT
  TO authenticated
  WITH CHECK (
    ratings.user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM properties
      JOIN group_members ON group_members.group_id = properties.group_id
      WHERE properties.id = ratings.property_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update only their own ratings"
  ON ratings FOR UPDATE
  TO authenticated
  USING (ratings.user_id = auth.uid())
  WITH CHECK (ratings.user_id = auth.uid());

CREATE POLICY "Users can delete only their own ratings"
  ON ratings FOR DELETE
  TO authenticated
  USING (ratings.user_id = auth.uid());

-- ============================================
-- PROPERTY_FINANCIALS POLICIES
-- ============================================

CREATE POLICY "Users can view financials for group properties"
  ON property_financials FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      JOIN group_members ON group_members.group_id = properties.group_id
      WHERE properties.id = property_financials.property_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can add financials"
  ON property_financials FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      JOIN group_members ON group_members.group_id = properties.group_id
      WHERE properties.id = property_financials.property_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can update financials"
  ON property_financials FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      JOIN group_members ON group_members.group_id = properties.group_id
      WHERE properties.id = property_financials.property_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can delete financials"
  ON property_financials FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      JOIN group_members ON group_members.group_id = properties.group_id
      WHERE properties.id = property_financials.property_id
      AND group_members.user_id = auth.uid()
    )
  );

-- ============================================
-- LOCATIONS POLICIES
-- ============================================

CREATE POLICY "Users can view locations for their groups"
  ON locations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = locations.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can add locations"
  ON locations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = locations.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can update locations"
  ON locations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = locations.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can delete locations"
  ON locations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = locations.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- ============================================
-- GEOCODING_CACHE POLICIES (Global, no group)
-- ============================================

CREATE POLICY "Authenticated users can read geocoding cache"
  ON geocoding_cache FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can add to geocoding cache"
  ON geocoding_cache FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

### Authentication Security

#### Password Requirements
```typescript
// src/lib/validation.ts
import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: passwordSchema,
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
});
```

#### Session Management
- JWT tokens with 30-day expiration
- Auto-refresh before expiration
- Secure httpOnly cookies (Supabase handles this)
- Logout invalidates refresh token

#### Rate Limiting
- Supabase Auth built-in rate limiting (5 attempts per 15 min)
- Additional rate limiting via Supabase Edge Functions if needed

---

## SCALABILITY & PERFORMANCE

### Database Optimization

#### Indexing Strategy
All critical foreign keys and filter columns are indexed (see schema section).

#### Query Optimization
```typescript
// Bad: N+1 queries
properties.forEach(async (property) => {
  const ratings = await supabase.from('ratings').select('*').eq('property_id', property.id);
});

// Good: Single query with join
const { data } = await supabase
  .from('properties')
  .select(`
    *,
    ratings (*),
    financials:property_financials (*)
  `)
  .eq('group_id', activeGroupId);
```

#### Pagination
```typescript
// For groups with 100+ properties
const { data, count } = await supabase
  .from('properties')
  .select('*', { count: 'exact' })
  .eq('group_id', activeGroupId)
  .range(0, 24);  // Load 25 at a time
```

### Frontend Performance

#### Code Splitting
```typescript
// Lazy load routes
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const MapPage = lazy(() => import('./pages/MapPage'));

// Use Suspense for loading states
<Suspense fallback={<LoadingSpinner />}>
  <ReportsPage />
</Suspense>
```

#### Memoization
```typescript
// Expensive calculations
const sortedProperties = useMemo(() => {
  return properties
    .map(calculateScores)
    .sort((a, b) => b.totalScore - a.totalScore);
}, [properties, criteria, ratings]);
```

#### Debouncing
```typescript
// Search/filter inputs
const debouncedSearch = useMemo(
  () => debounce((query) => setSearchQuery(query), 300),
  []
);
```

### Caching Strategy

#### Client-Side Caching
- React Query / SWR for data caching (optional Phase 7)
- LocalStorage for user preferences (theme, last active group)

#### Server-Side Caching
- Geocoding cache table (already implemented)
- PostgreSQL query result caching (Supabase handles this)

### Scalability Limits

| Resource | Free Tier Limit | Mitigation Strategy |
|----------|----------------|---------------------|
| Database Size | 500 MB | Monitor usage, upgrade to Pro ($25/mo for 8 GB) |
| Monthly Active Users | 50,000 | Sufficient for MVP, upgrade to Pro if exceeded |
| API Requests | Unlimited | N/A |
| Storage | 1 GB | Use CDN for static assets, compress images |
| Egress Bandwidth | 2 GB | Optimize image sizes, use lazy loading |

---

## IMPLEMENTATION PLAN

### Phase 0: Setup & Planning (1-2 days)

**Tasks:**
1. Create new git branch: `feature/mvp-multi-user`
2. Install new dependencies (react-router-dom, zod, date-fns)
3. Generate Supabase TypeScript types: `npx supabase gen types typescript`
4. Set up folder structure (create new folders)
5. Create project board with all tasks from Phases 1-9

**Deliverables:**
- Clean working branch
- Updated package.json
- Folder structure in place
- Project board with estimated tasks

---

### Phase 1: Authentication Foundation (3-4 days)

**Tasks:**
1. Install react-router-dom
2. Create AuthContext and useAuth hook
3. Build LoginForm component with validation
4. Build SignUpForm component with validation
5. Build ForgotPasswordForm component
6. Create ProtectedRoute wrapper
7. Update App.tsx with routing
8. Add user_profiles table and trigger
9. Test signup/login/logout flows
10. Add UserMenu dropdown to header

**Key Files to Create:**
- `src/contexts/AuthContext.tsx`
- `src/hooks/useAuth.ts`
- `src/components/auth/LoginForm.tsx`
- `src/components/auth/SignUpForm.tsx`
- `src/components/auth/ForgotPasswordForm.tsx`
- `src/components/auth/ProtectedRoute.tsx`
- `src/components/ui/UserMenu.tsx`
- `src/pages/LoginPage.tsx`
- `src/pages/SignUpPage.tsx`
- `src/lib/validation.ts`

**Migrations:**
```sql
-- supabase/migrations/20251112000001_add_auth_tables.sql
CREATE TABLE user_profiles (...);
CREATE TRIGGER on_auth_user_created ...;
```

**Testing Checklist:**
- [ ] User can sign up with email/password
- [ ] Display name is saved to user_profiles
- [ ] User receives email verification (optional)
- [ ] User can log in with valid credentials
- [ ] Invalid credentials show error message
- [ ] User can log out
- [ ] Session persists across page refreshes
- [ ] Protected routes redirect to login

**Deliverable:** Users can create accounts and log in

---

### Phase 2: Database Schema Migration (2-3 days)

**Tasks:**
1. Create search_groups table
2. Create group_members table
3. Create group_invites table
4. Create property_financials table
5. Add group_id to criteria, properties, locations
6. Add user_id to ratings
7. Update ratings unique constraint
8. Drop old public RLS policies
9. Create new authenticated RLS policies
10. Create indexes
11. Create triggers (updated_at, financials calculation)
12. Test all RLS policies with multiple users

**Key Files to Create:**
- `supabase/migrations/20251112000002_add_group_tables.sql`
- `supabase/migrations/20251112000003_add_financials_table.sql`
- `supabase/migrations/20251112000004_modify_existing_tables.sql`
- `supabase/migrations/20251112000005_create_rls_policies.sql`
- `supabase/migrations/20251112000006_create_triggers.sql`

**Testing Checklist:**
- [ ] All new tables created successfully
- [ ] Foreign keys enforce referential integrity
- [ ] Indexes created (check with `\di` in psql)
- [ ] RLS policies prevent unauthorized access
- [ ] User A cannot see User B's groups
- [ ] User A can see shared group data
- [ ] Triggers auto-update timestamps
- [ ] Financial calculations trigger works

**Deliverable:** Database ready for multi-user, group-based data

---

### Phase 3: Onboarding & Group Setup (3-4 days)

**Tasks:**
1. Create GroupContext and useGroups hook
2. Build OnboardingPage (create/join group choice)
3. Build GroupSetup component (name input)
4. Implement createGroup function
5. Auto-add creator as owner in group_members
6. Build GroupInvite component (generate code/link)
7. Implement generateInvite function
8. Build JoinGroup component (enter code)
9. Implement joinGroup function (validate + add member)
10. Build GroupSettings page
11. Build MemberList component
12. Test full onboarding flows

**Key Files to Create:**
- `src/contexts/GroupContext.tsx`
- `src/hooks/useGroups.ts`
- `src/pages/OnboardingPage.tsx`
- `src/components/groups/GroupSetup.tsx`
- `src/components/groups/GroupInvite.tsx`
- `src/components/groups/JoinGroup.tsx`
- `src/components/groups/GroupSettings.tsx`
- `src/components/groups/MemberList.tsx`
- `src/lib/invite.ts` (invite code generation)

**Invite Code Generation:**
```typescript
// src/lib/invite.ts
export function generateInviteCode(): string {
  return `JOIN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}
```

**Testing Checklist:**
- [ ] New user can create a solo group
- [ ] New user can create a group with custom name
- [ ] Owner can generate invite code
- [ ] Invite link copies to clipboard
- [ ] Second user can join via invite code
- [ ] Expired invites are rejected
- [ ] Max-use invites stop working after limit
- [ ] Group settings show all members
- [ ] Owner can remove members
- [ ] Members can leave group

**Deliverable:** Users can create groups and invite others

---

### Phase 4: Update Existing Features for Groups (4-5 days)

**Tasks:**
1. Update CriteriaManager to filter by active group
2. Add group_id when creating criteria
3. Update PropertyManager to filter by active group
4. Add group_id when creating properties
5. Update LocationManager (if used) for groups
6. Refactor all Supabase queries to include group_id
7. Update RatingForm to include user_id
8. Show "No group selected" state if activeGroup is null
9. Add group switcher to header (if user has multiple groups)
10. Test all CRUD operations with RLS

**Key Files to Update:**
- `src/components/CriteriaManager.tsx`
- `src/components/PropertyManager.tsx`
- `src/components/RatingForm.tsx`
- `src/hooks/useCriteria.ts` (NEW)
- `src/hooks/useProperties.ts` (NEW)
- `src/hooks/useRatings.ts` (NEW)

**Example Refactor:**
```typescript
// Before (no group context)
const { data: criteria } = await supabase
  .from('criteria')
  .select('*');

// After (group-scoped)
const { data: criteria } = await supabase
  .from('criteria')
  .select('*')
  .eq('group_id', activeGroup.id);
```

**Testing Checklist:**
- [ ] User in Group A sees only Group A's criteria
- [ ] User in Group A cannot see Group B's properties
- [ ] Creating a criterion adds it to active group
- [ ] Creating a property adds it to active group
- [ ] Ratings are associated with current user
- [ ] All filters work correctly
- [ ] No data leaks between groups

**Deliverable:** All core features work with group isolation

---

### Phase 5: Multi-User Ratings (3-4 days)

**Tasks:**
1. Update ratings table (user_id already added in Phase 2)
2. Modify RatingForm to show current user's existing rating
3. Build MultiUserRatingView component
4. Add user filter dropdown to Reports
5. Implement aggregate statistics (average, consensus)
6. Highlight criteria with disagreement (variance > 1 point)
7. Update PropertyCard to show who has rated
8. Add "Rating Status" indicator per user
9. Test rating flows with multiple users
10. Handle edge case: user deletes their ratings

**Key Files to Create:**
- `src/components/ratings/MultiUserRatingView.tsx`
- `src/lib/aggregation.ts` (statistical functions)

**Key Files to Update:**
- `src/components/RatingForm.tsx`
- `src/components/Reports.tsx`
- `src/components/PropertyCard.tsx`

**Aggregation Functions:**
```typescript
// src/lib/aggregation.ts
export function calculateAverageScore(ratings: Rating[]): number {
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((acc, r) => acc + r.score, 0);
  return sum / ratings.length;
}

export function calculateConsensus(ratings: Rating[]): number {
  // Returns 0-1 (1 = perfect agreement)
  const avg = calculateAverageScore(ratings);
  const variance = ratings.reduce((acc, r) => acc + Math.pow(r.score - avg, 2), 0) / ratings.length;
  return 1 - (variance / 2); // Normalize to 0-1
}
```

**Testing Checklist:**
- [ ] User A can rate a property
- [ ] User B can rate the same property independently
- [ ] Each user sees their own previous rating when editing
- [ ] Reports show "My Ratings" vs "Group Average"
- [ ] Average score is calculated correctly
- [ ] Disagreement is highlighted visually
- [ ] Property card shows "2/3 members rated"

**Deliverable:** Multiple users can rate independently with aggregate views

---

### Phase 6: Financial Modeling (5-6 days)

**Tasks:**
1. Create property_financials table (done in Phase 2)
2. Create financial calculation trigger (done in Phase 2)
3. Build FinancialForm component
4. Implement form validation (Zod schema)
5. Build FinancialSummary component
6. Build FinancialComparison component
7. Build CostBreakdown component
8. Add "Financials" button to PropertyCard
9. Update Reports to sort by financial metrics
10. Add financial columns to CSV export
11. Test various promotional deal scenarios
12. Add tooltips explaining calculations

**Key Files to Create:**
- `src/components/financials/FinancialForm.tsx`
- `src/components/financials/FinancialSummary.tsx`
- `src/components/financials/FinancialComparison.tsx`
- `src/components/financials/CostBreakdown.tsx`
- `src/hooks/useFinancials.ts`
- `src/types/financials.ts`
- `src/lib/financial.ts` (client-side calculations for preview)

**Financial Validation:**
```typescript
// src/lib/validation.ts
export const financialsSchema = z.object({
  base_rent: z.number().min(0),
  utilities_estimate: z.number().min(0).default(0),
  pet_rent: z.number().min(0).default(0),
  parking_cost: z.number().min(0).default(0),
  // ... etc
  promo_type: z.enum(['none', 'months_free', 'reduced_rate', 'other']),
  promo_months_free: z.number().min(0).max(12),
  lease_term_months: z.number().min(1).max(24).default(12),
});
```

**Testing Checklist:**
- [ ] Form saves all cost fields correctly
- [ ] Month 1 cost calculation is correct
- [ ] Year 1 total cost includes one-time fees
- [ ] Year 1 avg monthly excludes one-time fees
- [ ] Year 2 estimate applies rent increase %
- [ ] "2 months free" promo calculates correctly
- [ ] "Reduced first month" promo calculates correctly
- [ ] Reports can sort by cost metrics
- [ ] CSV export includes financial data

**Deliverable:** Complete financial modeling with accurate calculations

---

### Phase 7: UI/UX Polish (3-4 days)

**Tasks:**
1. Add loading spinners to all async operations
2. Add error messages with retry buttons
3. Add success toasts for mutations
4. Build onboarding tutorial (tooltips or modal)
5. Improve mobile responsiveness
6. Add keyboard navigation (Tab, Enter)
7. Add confirmation modals for destructive actions
8. Improve form validation feedback
9. Add empty states ("No properties yet")
10. Add skeleton loaders for better perceived performance
11. Test on real mobile devices
12. Accessibility audit (basic)

**Key Files to Create:**
- `src/components/ui/LoadingSpinner.tsx`
- `src/components/ui/Toast.tsx`
- `src/components/ui/ConfirmModal.tsx`
- `src/components/ui/EmptyState.tsx`
- `src/components/ui/Skeleton.tsx`
- `src/components/onboarding/Tutorial.tsx`

**Error Handling Pattern:**
```typescript
try {
  await createProperty(data);
  showToast('Property added successfully', 'success');
} catch (error) {
  showToast('Failed to add property. Please try again.', 'error');
  console.error('Create property error:', error);
}
```

**Testing Checklist:**
- [ ] All buttons show loading state during async ops
- [ ] Errors display user-friendly messages
- [ ] Success confirmations are clear
- [ ] Tutorial guides new users
- [ ] Works on iPhone Safari
- [ ] Works on Android Chrome
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility (basic)

**Deliverable:** Polished, professional interface

---

### Phase 8: Testing & Bug Fixes (3-4 days)

**Tasks:**
1. Test all user workflows end-to-end
2. Test edge cases (empty states, single user, 10 users)
3. Test concurrent edits by multiple users
4. Cross-browser testing (Chrome, Safari, Firefox, Edge)
5. Mobile device testing (iOS, Android)
6. Fix critical bugs
7. Fix UI bugs
8. Performance optimization (identify slow queries)
9. Write unit tests for critical functions (optional)
10. Load testing (simulate 100 concurrent users)

**Testing Matrix:**

| Workflow | Chrome | Safari | Firefox | Mobile |
|----------|--------|--------|---------|--------|
| Signup & Login | ✓ | ✓ | ✓ | ✓ |
| Create Group | ✓ | ✓ | ✓ | ✓ |
| Invite & Join | ✓ | ✓ | ✓ | ✓ |
| Add Criteria | ✓ | ✓ | ✓ | ✓ |
| Add Property | ✓ | ✓ | ✓ | ✓ |
| Add Financials | ✓ | ✓ | ✓ | ✓ |
| Rate Property | ✓ | ✓ | ✓ | ✓ |
| View Reports | ✓ | ✓ | ✓ | ✓ |
| CSV Export | ✓ | ✓ | ✓ | ✓ |

**Edge Cases to Test:**
- Last owner tries to leave group
- User deletes all their ratings
- Invite code used max times
- Expired invite code
- Empty groups (no criteria, no properties)
- Large groups (10 users, 100 properties)
- Slow network (simulate 3G)

**Performance Benchmarks:**
- Page load < 2s
- Property list renders in < 500ms
- Reports calculate in < 1s
- Map with 50 pins loads in < 3s

**Deliverable:** Stable, tested application ready for production

---

### Phase 9: Deployment & Documentation (2-3 days)

**Tasks:**
1. Run database migrations in production Supabase
2. Set up Vercel project and connect GitHub repo
3. Configure environment variables in Vercel
4. Deploy to Vercel preview environment
5. Test preview deployment thoroughly
6. Deploy to production
7. Set up custom domain (optional)
8. Set up Vercel Analytics
9. Write user documentation
10. Create demo video (5-10 min)
11. Monitor logs for first 24 hours
12. Fix any critical deployment issues

**Environment Variables (Vercel):**
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

**Database Migration Script:**
```sql
-- Run in Supabase SQL Editor (PRODUCTION)
-- Double-check all migrations before running!

BEGIN;

-- Phase 2 migrations
\i supabase/migrations/20251112000002_add_group_tables.sql
\i supabase/migrations/20251112000003_add_financials_table.sql
\i supabase/migrations/20251112000004_modify_existing_tables.sql
\i supabase/migrations/20251112000005_create_rls_policies.sql
\i supabase/migrations/20251112000006_create_triggers.sql

COMMIT;
```

**Documentation to Create:**
- `docs/USER_GUIDE.md` - How to use the app
- `docs/ADMIN_GUIDE.md` - How to manage groups
- `docs/TROUBLESHOOTING.md` - Common issues
- `README.md` - Update with MVP features

**Testing Checklist:**
- [ ] Production database migrations successful
- [ ] Vercel preview deployment works
- [ ] All environment variables configured
- [ ] Authentication works in production
- [ ] Data isolation verified in production
- [ ] Custom domain configured (if applicable)
- [ ] Analytics tracking confirmed
- [ ] User documentation complete

**Deliverable:** Live MVP accessible to users

---

## TESTING STRATEGY

### Unit Testing (Optional Phase 8)

**Test Coverage Priorities:**
1. Financial calculations (highest priority)
2. Scoring algorithms
3. Data aggregation functions
4. Validation schemas

```typescript
// Example: src/lib/financial.test.ts
import { describe, it, expect } from 'vitest';
import { calculateMonth1Cost, calculateYear1Total } from './financial';

describe('Financial Calculations', () => {
  it('calculates Month 1 cost correctly with no promo', () => {
    const result = calculateMonth1Cost({
      base_rent: 2000,
      utilities_estimate: 150,
      application_fee: 50,
      security_deposit: 2000,
      promo_type: 'none',
    });
    expect(result).toBe(4200); // 2000 + 150 + 50 + 2000
  });

  it('calculates Month 1 cost with first month free', () => {
    const result = calculateMonth1Cost({
      base_rent: 2000,
      utilities_estimate: 150,
      application_fee: 50,
      promo_type: 'months_free',
      promo_months_free: 1,
    });
    expect(result).toBe(200); // 150 + 50 (no rent)
  });
});
```

### Integration Testing

**Key Scenarios:**
1. End-to-end signup → create group → add data flow
2. Multi-user rating and aggregation
3. RLS policy enforcement

### Manual Testing Checklist

See Phase 8 testing matrix and edge cases.

---

## DEPLOYMENT STRATEGY

### Deployment Pipeline

```
Local Development → Git Push → GitHub → Vercel Preview →
Manual QA → Promote to Production → Monitor
```

### Rollback Plan

- Vercel allows instant rollback to previous deployment
- Database migrations require manual rollback scripts
- Always create migration rollback scripts:

```sql
-- Rollback for 20251112000002_add_group_tables.sql
DROP TABLE IF EXISTS group_invites CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS search_groups CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
```

### Blue-Green Deployment (Advanced)

Not needed for MVP, but for future reference:
- Deploy new version to separate Supabase project
- Test thoroughly
- Update frontend to point to new backend
- Keep old version for 7 days

---

## MONITORING & OBSERVABILITY

### Error Tracking

**Sentry Setup (Optional):**
```typescript
// src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
});
```

### Analytics

**Vercel Analytics:**
- Automatically tracks page views
- Core Web Vitals
- User flow analytics

**Custom Events:**
```typescript
// Track critical user actions
analytics.track('property_rated', {
  property_id: propertyId,
  user_id: userId,
  group_id: groupId,
});
```

### Logging Strategy

**Frontend:**
- Console errors in development
- Sentry errors in production
- Analytics events for user actions

**Backend:**
- Supabase logs (available in dashboard)
- Database slow query log (monitor in Supabase)

### Metrics to Monitor

**Application Health:**
- Error rate (target: <1%)
- API response time (target: <500ms)
- Page load time (target: <2s)

**Business Metrics:**
- Daily/weekly/monthly active users
- Properties added per day
- Ratings completed per day
- Group invites sent/accepted
- Financials added per property

**Database Metrics:**
- Query performance (Supabase dashboard)
- Connection pool usage
- Storage usage (target: <80% of tier limit)

---

## MIGRATION STRATEGY

### Data Migration from Prototype to MVP

**Scenario:** Existing users have data in the prototype

**Option A: Fresh Start (Recommended for MVP)**
1. Export all existing data to CSV
2. Send CSV to existing users
3. Clear database and apply MVP migrations
4. Users re-enter their data after signup

**Option B: Migrate Existing Data**
1. Create a "Legacy Group" for all existing data
2. Assign a system user as owner
3. First user to sign up gets added to Legacy Group
4. They can claim ownership or start fresh

**Migration Script (Option B):**
```sql
-- Create system user (run once)
INSERT INTO auth.users (id, email)
VALUES ('00000000-0000-0000-0000-000000000000', 'system@housingtracker.app');

-- Create legacy group
INSERT INTO search_groups (id, name, created_by)
VALUES ('11111111-1111-1111-1111-111111111111', 'Legacy Data', '00000000-0000-0000-0000-000000000000');

-- Migrate criteria
UPDATE criteria SET group_id = '11111111-1111-1111-1111-111111111111';

-- Migrate properties
UPDATE properties SET group_id = '11111111-1111-1111-1111-111111111111';

-- Migrate locations
UPDATE locations SET group_id = '11111111-1111-1111-1111-111111111111';

-- Migrate ratings (assign to system user initially)
UPDATE ratings SET user_id = '00000000-0000-0000-0000-000000000000';
```

---

## CONCLUSION

This technical specification provides a comprehensive blueprint for building a scalable, secure, and maintainable Housing Tracker MVP. The architecture is designed to:

1. **Scale gracefully** from prototype to 10,000+ users
2. **Ensure security** through RLS and zero-trust data isolation
3. **Remain maintainable** with clean separation of concerns and TypeScript
4. **Enable rapid iteration** based on user feedback

### Next Steps

1. Review and approve this technical spec
2. Clarify any questions or concerns
3. Begin Phase 0 (Setup & Planning)
4. Execute phases sequentially with regular check-ins

### Success Criteria

The MVP will be considered successful when:
- ✅ All 9 implementation phases complete
- ✅ All acceptance criteria from PRD met
- ✅ All testing checklists pass
- ✅ Application deployed to production
- ✅ Zero critical security vulnerabilities
- ✅ Documentation complete

**Estimated Total Timeline:** 28-36 development days (6-8 weeks)

---

**Document End**
