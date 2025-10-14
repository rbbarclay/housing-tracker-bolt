# User Management Implementation Plan

## Overview
This document outlines the plan to add secure multi-user authentication and group collaboration features to the Housing Tracker application.

---

## Current State Analysis

### Database Schema
The current application has these tables:
- `criteria` - Search criteria (must-haves and nice-to-haves)
- `properties` - Properties being evaluated
- `ratings` - Junction table linking properties to criteria with scores (1-3)
- `locations` - Points of interest for distance calculations
- `geocoding_cache` - Cache for address geocoding results

### Current Security Model
- All tables use Row Level Security (RLS) but allow public access via `anon` role
- No user authentication or data isolation
- Single shared dataset across all users

---

## Requirements

### 1. Secure Authentication
- Users must create accounts and log in securely
- Each user can only access their own housing search data (or their group's data)
- Use Supabase's built-in email/password authentication

### 2. Group Collaboration
- Users can create or join a "search group" (e.g., couples, roommates, families)
- All members of a group share the same housing search
- Groups have a single shared dataset

### 3. Individual Ratings Within Groups
- Each user in a group can enter their own ratings for properties
- Ratings are associated with both the property/criterion AND the user
- Reports should show individual ratings and aggregate group ratings

### 4. Shared Criteria
- Criteria defined by any group member are visible to all group members
- All group members work from the same set of criteria
- Properties added by any member are visible to the entire group

---

## Database Schema Changes

### New Tables

#### `groups` (or `search_groups`)
Represents a collaborative housing search group.

```sql
CREATE TABLE search_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### `group_members`
Junction table linking users to groups with role management.

```sql
CREATE TABLE group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES search_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);
```

#### `user_profiles` (optional but recommended)
Extended user information beyond Supabase auth.users.

```sql
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Modified Tables

#### `criteria`
Add `group_id` to associate criteria with groups.

```sql
ALTER TABLE criteria
  ADD COLUMN group_id uuid NOT NULL REFERENCES search_groups(id) ON DELETE CASCADE;

CREATE INDEX idx_criteria_group_id ON criteria(group_id);
```

#### `properties`
Add `group_id` to associate properties with groups.

```sql
ALTER TABLE properties
  ADD COLUMN group_id uuid NOT NULL REFERENCES search_groups(id) ON DELETE CASCADE;

CREATE INDEX idx_properties_group_id ON properties(group_id);
```

#### `ratings`
Add `user_id` to track which user in the group made each rating.

```sql
ALTER TABLE ratings
  ADD COLUMN user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update unique constraint to allow multiple users to rate the same property/criterion
DROP CONSTRAINT IF EXISTS ratings_property_id_criterion_id_key;
ALTER TABLE ratings
  ADD CONSTRAINT ratings_property_criterion_user_unique
  UNIQUE(property_id, criterion_id, user_id);

CREATE INDEX idx_ratings_user_id ON ratings(user_id);
```

#### `locations`
Add `group_id` to associate locations with groups.

```sql
ALTER TABLE locations
  ADD COLUMN group_id uuid NOT NULL REFERENCES search_groups(id) ON DELETE CASCADE;

CREATE INDEX idx_locations_group_id ON locations(group_id);
```

#### `geocoding_cache`
Keep as-is (shared globally for efficiency).

---

## Row Level Security (RLS) Policies

All public policies must be replaced with secure, user-scoped policies.

### `search_groups` Policies

```sql
-- Users can see groups they belong to
CREATE POLICY "Users can view their groups"
  ON search_groups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = search_groups.id
      AND group_members.user_id = auth.uid()
    )
  );

-- Users can create new groups
CREATE POLICY "Users can create groups"
  ON search_groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Group owners can update group details
CREATE POLICY "Group owners can update groups"
  ON search_groups FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = search_groups.id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = search_groups.id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'owner'
    )
  );

-- Only group owners can delete groups
CREATE POLICY "Group owners can delete groups"
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
```

### `group_members` Policies

```sql
-- Users can see members of groups they belong to
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

-- Group owners/admins can add members
CREATE POLICY "Owners and admins can add members"
  ON group_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_members.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role IN ('owner', 'admin')
    )
  );

-- Group owners/admins can update member roles
CREATE POLICY "Owners and admins can update members"
  ON group_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role IN ('owner', 'admin')
    )
  );

-- Users can remove themselves, or owners/admins can remove others
CREATE POLICY "Users can leave groups or be removed by admins"
  ON group_members FOR DELETE
  TO authenticated
  USING (
    group_members.user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role IN ('owner', 'admin')
    )
  );
```

### `criteria` Policies

```sql
-- Users can view criteria for their groups
CREATE POLICY "Users can view group criteria"
  ON criteria FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = criteria.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- Any group member can add criteria
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

-- Any group member can update criteria
CREATE POLICY "Group members can update criteria"
  ON criteria FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = criteria.group_id
      AND group_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = criteria.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- Any group member can delete criteria
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
```

### `properties` Policies

Similar pattern to criteria - all group members can CRUD properties.

```sql
CREATE POLICY "Users can view group properties"
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
  )
  WITH CHECK (
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
```

### `ratings` Policies

```sql
-- Users can view all ratings in their group
CREATE POLICY "Users can view group ratings"
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

-- Users can only insert their own ratings for group properties
CREATE POLICY "Users can add their own ratings"
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

-- Users can only update their own ratings
CREATE POLICY "Users can update their own ratings"
  ON ratings FOR UPDATE
  TO authenticated
  USING (ratings.user_id = auth.uid())
  WITH CHECK (ratings.user_id = auth.uid());

-- Users can only delete their own ratings
CREATE POLICY "Users can delete their own ratings"
  ON ratings FOR DELETE
  TO authenticated
  USING (ratings.user_id = auth.uid());
```

### `locations` Policies

Similar pattern to criteria and properties - all group members can CRUD.

```sql
CREATE POLICY "Users can view group locations"
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
  )
  WITH CHECK (
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
```

---

## Authentication Flow

### User Registration & Login

1. **Sign Up Flow**
   - User provides email and password
   - Supabase creates account in `auth.users`
   - Trigger creates user profile in `user_profiles`
   - User is prompted to either:
     - Create a new search group (becomes owner)
     - Join an existing group via invite code

2. **First-Time Setup**
   - If creating a new group:
     - User provides group name
     - System creates `search_groups` record
     - System creates `group_members` record with role='owner'
   - If joining existing group:
     - User enters invite code or link
     - System validates and adds user to group as 'member'

3. **Login Flow**
   - User provides email and password
   - Supabase validates credentials
   - App loads user's group(s) and associated data
   - User proceeds to main application

### Session Management
- Use Supabase's built-in session handling
- Store session state in React context
- Implement `onAuthStateChange` listener
- Handle session expiration and refresh

---

## Frontend Changes

### New Components Needed

1. **Authentication Components**
   - `Login.tsx` - Login form
   - `SignUp.tsx` - Registration form
   - `AuthLayout.tsx` - Wrapper for auth pages
   - `ProtectedRoute.tsx` - Route guard for authenticated pages

2. **Group Management Components**
   - `GroupSetup.tsx` - First-time group creation/join
   - `GroupSettings.tsx` - Manage group name, members
   - `GroupInvite.tsx` - Generate and share invite links
   - `MemberList.tsx` - View and manage group members

3. **User Profile Components**
   - `UserProfile.tsx` - View/edit profile
   - `UserMenu.tsx` - User dropdown in header

### Modified Components

1. **App.tsx**
   - Add authentication state management
   - Add routing for auth pages
   - Load user's active group on login
   - Pass group context to child components

2. **All Data Components** (PropertyManager, CriteriaManager, etc.)
   - Add `group_id` to all create/update operations
   - Filter data by user's active group
   - Handle multi-user rating display

3. **RatingForm.tsx**
   - Associate ratings with logged-in user
   - Show existing rating from current user
   - Optionally show other group members' ratings

4. **Reports.tsx**
   - Add user filter to show individual vs. aggregate ratings
   - Display rating breakdown by user
   - Show consensus vs. disagreement metrics

### Context/State Management

```typescript
// AuthContext
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// GroupContext
interface GroupContextType {
  activeGroup: SearchGroup | null;
  groupMembers: GroupMember[];
  userRole: 'owner' | 'admin' | 'member' | null;
  switchGroup: (groupId: string) => Promise<void>;
  createGroup: (name: string) => Promise<SearchGroup>;
  joinGroup: (inviteCode: string) => Promise<void>;
}
```

---

## Implementation Phases

### Phase 1: Authentication Foundation (Estimated: 2-3 days)
**Goal:** Get basic authentication working

1. Install and configure Supabase auth
2. Create authentication components (Login, SignUp)
3. Implement auth context and session management
4. Add protected routes
5. Update navigation header with user menu
6. Test email/password authentication flow

**Deliverable:** Users can sign up, log in, and log out

### Phase 2: Database Schema Migration (Estimated: 1-2 days)
**Goal:** Update database for multi-user support

1. Create new tables (`search_groups`, `group_members`, `user_profiles`)
2. Add foreign key columns to existing tables
3. Create migration script with data preservation strategy
4. Remove old public policies
5. Apply new RLS policies
6. Test database access patterns

**Deliverable:** Database ready for multi-user, group-based data

### Phase 3: Group Management (Estimated: 2-3 days)
**Goal:** Allow users to create and join groups

1. Create group setup flow for new users
2. Implement group creation functionality
3. Build invite system (invite codes or links)
4. Create group settings page
5. Implement member management (add, remove, roles)
6. Add group context to application
7. Test group isolation (users can't see other groups' data)

**Deliverable:** Users can create groups, invite others, and manage membership

### Phase 4: Update Existing Features (Estimated: 3-4 days)
**Goal:** Make all features work with groups and users

1. Update PropertyManager to include `group_id`
2. Update CriteriaManager to include `group_id`
3. Update LocationManager (if exists) to include `group_id`
4. Update RatingForm to include `user_id` and show user context
5. Update all data queries to filter by active group
6. Update all create/update operations to include group context
7. Test all CRUD operations with RLS policies

**Deliverable:** All core features work with group-scoped data

### Phase 5: Multi-User Rating Features (Estimated: 2-3 days)
**Goal:** Enable and display individual ratings within groups

1. Update ratings to be per-user
2. Display current user's existing rating when editing
3. Add UI to show other group members' ratings (optional view)
4. Update Reports to show per-user breakdown
5. Add aggregate statistics (average, consensus, etc.)
6. Add visual indicators for rating agreement/disagreement

**Deliverable:** Each group member can rate independently, and ratings are tracked per-user

### Phase 6: Polish & Testing (Estimated: 2-3 days)
**Goal:** Ensure quality and handle edge cases

1. Add loading states for all async operations
2. Improve error handling and user feedback
3. Add onboarding/help for new users
4. Test edge cases (last member leaving group, deleting group, etc.)
5. Test concurrent edits by multiple users
6. Optimize query performance
7. Add user profile editing

**Deliverable:** Production-ready multi-user application

### Phase 7: Advanced Features (Optional, Future)
**Goal:** Enhance collaboration experience

1. Real-time updates (subscriptions for live collaboration)
2. Activity feed (who added/rated what)
3. Notifications (new property added, all members rated, etc.)
4. Export/sharing features for group reports
5. Multiple groups per user (group switching)
6. Group ownership transfer

---

## Data Migration Strategy

### For Existing Data

If the app already has data in production:

1. **Before Migration**
   - Announce maintenance window
   - Back up all existing data
   - Document all existing properties, criteria, ratings

2. **Migration Options**

   **Option A: Assign to Single Group**
   - Create a default "Legacy Search" group
   - Assign all existing data to this group
   - Assign existing anonymous data to system user
   - Notify users to claim their data by joining group

   **Option B: User Claims Data**
   - Temporarily preserve anonymous data
   - First user to sign up claims all data
   - Subsequent users start fresh
   - Keep legacy data for 30 days then archive

   **Option C: Fresh Start**
   - Export existing data to CSV
   - Provide download link to users
   - Clear all data on migration
   - Users re-enter their housing search

3. **Migration Script**
```sql
-- Example: Option A migration
BEGIN;

-- Create default group
INSERT INTO search_groups (id, name, created_by)
VALUES ('00000000-0000-0000-0000-000000000000', 'Legacy Search Group', NULL);

-- Add group_id to all existing records
UPDATE criteria SET group_id = '00000000-0000-0000-0000-000000000000';
UPDATE properties SET group_id = '00000000-0000-0000-0000-000000000000';
UPDATE locations SET group_id = '00000000-0000-0000-0000-000000000000';

-- Create placeholder user for existing ratings
-- (Requires manual assignment or using a system account)

COMMIT;
```

---

## Security Considerations

### Authentication
- Use strong password requirements (min 8 chars, complexity)
- Implement rate limiting on login attempts
- Consider email verification for new accounts
- Use HTTPS for all communication
- Store no passwords client-side

### Authorization
- All RLS policies use `auth.uid()` to check user identity
- Group membership is always verified before data access
- No direct table access - all queries go through RLS
- Service role key never exposed to frontend

### Data Isolation
- Users can only see groups they belong to
- Users can only rate on behalf of themselves
- Group members cannot access other groups' data
- Proper indexes ensure performant filtered queries

### Invite System
- Generate secure random invite codes
- Expire invite codes after use or timeout
- Limit invites to prevent abuse
- Log invite usage for audit trail

---

## Testing Strategy

### Unit Tests
- Test RLS policies with different user scenarios
- Test group membership checks
- Test rating isolation per user
- Test invite code generation and validation

### Integration Tests
- Test complete auth flow (signup → group create → data entry)
- Test joining existing group
- Test multi-user rating scenarios
- Test data isolation between groups

### User Acceptance Testing
- Solo user creates account and uses app
- Couple creates group together and collaborates
- Group of 3+ tests complex scenarios
- Test invite flow with new users

---

## Estimated Total Time

- **Phase 1:** 2-3 days
- **Phase 2:** 1-2 days
- **Phase 3:** 2-3 days
- **Phase 4:** 3-4 days
- **Phase 5:** 2-3 days
- **Phase 6:** 2-3 days

**Total: 12-18 days of development time**

This assumes one developer working full-time. Time may vary based on:
- Existing familiarity with Supabase auth
- Complexity of UI/UX requirements
- Extent of testing and polish desired
- Need for advanced features

---

## Open Questions & Decisions Needed

1. **Multiple Groups Per User?**
   - Should a user be able to belong to multiple search groups?
   - If yes, need group switching UI and active group selection

2. **Rating Visibility**
   - Should users see other members' ratings before entering their own?
   - Blind rating might reduce bias but less collaborative feel

3. **Group Size Limits**
   - Is there a maximum group size? (performance consideration)

4. **Group Ownership**
   - What happens if the owner leaves the group?
   - Can ownership be transferred?

5. **Data Retention**
   - What happens to group data if all members leave?
   - Should groups be soft-deleted or hard-deleted?

6. **Invite System**
   - Use codes, links, or both?
   - Email-based invites or manual share?

7. **Anonymous Usage**
   - Should the app support any anonymous/guest mode?
   - Or require authentication for all use?

---

## Conclusion

This plan provides a comprehensive approach to adding secure, multi-user authentication with group collaboration to the Housing Tracker application. The phased approach allows for incremental development and testing, while the detailed RLS policies ensure proper data isolation and security.

The key architectural decisions are:
- Use Supabase's built-in authentication
- Group-based data model (all data belongs to a group)
- Individual ratings within groups (ratings associated with user_id)
- Shared criteria, properties, and locations within groups
- Comprehensive RLS policies for security and data isolation

Implementation should begin with Phase 1 (authentication foundation) and proceed sequentially through the phases, with thorough testing at each stage.
