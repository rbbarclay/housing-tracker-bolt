# Housing Search Tracker

A web application to help apartment and home searchers track properties, evaluate them against custom criteria, and make data-driven housing decisions.

## Features

### 1. Criteria Management
- Define custom must-have and nice-to-have criteria
- Add definitions to clarify what each criterion means for you
- Edit and delete criteria as your search evolves

### 2. Property Management
- Track all properties you're considering
- Store key details: address, neighborhood, price, beds/baths, square footage
- Add notes and listing URLs
- Archive properties when no longer relevant
- View rating status at a glance

### 3. Interactive Map
- Visualize all your properties on an interactive map
- Click pins to see property details
- Remember which neighborhoods you've explored

### 4. Mobile-Optimized Rating
- Rate properties immediately after viewing them
- Score each criterion on a 3-point scale (Meets/Partial/Doesn't Meet)
- Add notes to explain your ratings
- Works great on mobile devices during property visits

### 5. Automated Rankings & Reports
- **Tier 1 View**: Properties that meet ALL must-haves, ranked by nice-to-haves
- **Tier 2 View**: All properties ranked by total score
- Sort by individual criteria to compare specific aspects
- View detailed ratings and notes for each property
- Calculated scoring formula: `(Must-Have Score × 3) + (Nice-to-Have Score × 1)`

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Mapping**: React Leaflet + OpenStreetMap
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- A Supabase account (free tier works great)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   The `.env` file should contain your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

## Usage Guide

### Step 1: Define Your Criteria
Start by adding the factors that matter most in your housing search. Categorize them as:
- **Must-Haves**: Non-negotiable requirements
- **Nice-to-Haves**: Preferences that would be great but aren't dealbreakers

Examples:
- Must-Have: "Access to public transportation" (definition: "Within 10 min walk to metro")
- Nice-to-Have: "Natural light" (definition: "Large windows, bright during the day")

### Step 2: Add Properties
As you find properties online or through viewings, add them to the tracker with:
- Basic info: name, address, neighborhood
- Specs: price, bedrooms, bathrooms, square footage
- Additional: date viewed, listing URL, notes

### Step 3: Rate Properties
After viewing a property (ideally right after or the same day), rate it against all your criteria:
1. Open the app on your phone
2. Click "Rate" on the property
3. Go through each criterion and select Meets (3), Partial (2), or Doesn't Meet (1)
4. Add notes to explain your reasoning
5. Save

### Step 4: Compare & Decide
Use the Reports view to:
- See which properties meet all your must-haves (Tier 1)
- Compare all properties by total score (Tier 2)
- Sort by specific criteria to focus on what matters most
- Review detailed ratings and notes to refresh your memory
- Make your final decision with confidence

## Database Schema

The application uses three main tables:

- **criteria**: Your custom search criteria
- **properties**: Properties you're tracking
- **ratings**: Your ratings for each property-criterion pair

All tables have Row Level Security (RLS) enabled.

## Map Feature Note

For the MVP, the map view requires manually adding latitude/longitude coordinates to properties. In future versions, this will be automated via a geocoding API.

## Future Enhancements

Potential features for v2:
- Address autocomplete with automatic geocoding
- CSV export for data analysis
- Photo uploads for properties
- Multi-user support with authentication
- Collaborative decision-making for couples/roommates
- Distance calculations to key locations
- Mobile app version

## License

This project was created for personal use. Feel free to fork and customize for your own housing search.

## Contributing

This is a personal project, but suggestions and bug reports are welcome via GitHub issues.
