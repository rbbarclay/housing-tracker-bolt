import { useState } from 'react';
import { Home, List, MapIcon, Star, BarChart3 } from 'lucide-react';
import { CriteriaManager } from './components/CriteriaManager';
import { PropertyManager } from './components/PropertyManager';
import { PropertyMap } from './components/PropertyMap';
import { RatingForm } from './components/RatingForm';
import { Reports } from './components/Reports';

type View = 'home' | 'criteria' | 'properties' | 'map' | 'rate' | 'reports';

function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [ratingPropertyId, setRatingPropertyId] = useState<string | null>(null);

  function handleRateProperty(propertyId: string) {
    setRatingPropertyId(propertyId);
    setCurrentView('rate');
  }

  function handleBackFromRating() {
    setRatingPropertyId(null);
    setCurrentView('properties');
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Home size={28} className="text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Housing Tracker</h1>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setCurrentView('criteria')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'criteria'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <List size={20} />
                <span className="hidden sm:inline">Criteria</span>
              </button>

              <button
                onClick={() => setCurrentView('properties')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'properties'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Home size={20} />
                <span className="hidden sm:inline">Properties</span>
              </button>

              <button
                onClick={() => setCurrentView('map')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'map'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <MapIcon size={20} />
                <span className="hidden sm:inline">Map</span>
              </button>

              <button
                onClick={() => setCurrentView('reports')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'reports'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <BarChart3 size={20} />
                <span className="hidden sm:inline">Reports</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'home' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Housing Tracker</h2>
              <p className="text-gray-700 mb-6">
                Make smarter housing decisions by tracking properties, rating them against your custom criteria,
                and comparing them side-by-side.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">1. Define Your Criteria</h3>
                  <p className="text-gray-600 mb-4">
                    Start by adding your must-haves and nice-to-haves. What matters most in your housing search?
                  </p>
                  <button
                    onClick={() => setCurrentView('criteria')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Manage Criteria
                  </button>
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">2. Add Properties</h3>
                  <p className="text-gray-600 mb-4">
                    Track properties you're considering with all the relevant details.
                  </p>
                  <button
                    onClick={() => setCurrentView('properties')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Manage Properties
                  </button>
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">3. Rate Properties</h3>
                  <p className="text-gray-600 mb-4">
                    After viewing a property, rate it against your criteria on your phone.
                  </p>
                  <button
                    onClick={() => setCurrentView('properties')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Properties
                  </button>
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">4. Compare & Decide</h3>
                  <p className="text-gray-600 mb-4">
                    View ranked properties and make data-driven decisions.
                  </p>
                  <button
                    onClick={() => setCurrentView('reports')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Reports
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'criteria' && <CriteriaManager />}
        {currentView === 'properties' && <PropertyManager onRate={handleRateProperty} />}
        {currentView === 'map' && <PropertyMap />}
        {currentView === 'rate' && ratingPropertyId && (
          <RatingForm propertyId={ratingPropertyId} onBack={handleBackFromRating} />
        )}
        {currentView === 'reports' && <Reports />}
      </main>
    </div>
  );
}

export default App;
