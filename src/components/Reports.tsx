import { useState, useEffect } from 'react';
import { ChevronDown, ExternalLink, MapPin, Check, AlertTriangle, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Property, Criterion, Rating, PropertyScore } from '../types';
import { calculatePropertyScore, sortPropertiesByScore, filterTier1Properties, sortPropertiesByCriterion } from '../lib/scoring';

export function Reports() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [viewMode, setViewMode] = useState<'tier1' | 'tier2'>('tier1');
  const [sortBy, setSortBy] = useState<'total' | string>('total');
  const [expandedProperty, setExpandedProperty] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [propertiesResult, criteriaResult, ratingsResult] = await Promise.all([
      supabase.from('properties').select('*').eq('archived', false),
      supabase.from('criteria').select('*'),
      supabase.from('ratings').select('*')
    ]);

    if (propertiesResult.data) setProperties(propertiesResult.data);
    if (criteriaResult.data) setCriteria(criteriaResult.data);
    if (ratingsResult.data) setRatings(ratingsResult.data);
  }

  const propertyScores: PropertyScore[] = properties.map(property => {
    const propertyRatings = ratings.filter(r => r.property_id === property.id);
    return calculatePropertyScore(property, propertyRatings, criteria);
  });

  let displayScores = propertyScores;
  if (viewMode === 'tier1') {
    displayScores = filterTier1Properties(propertyScores);
  } else if (sortBy === 'total') {
    displayScores = sortPropertiesByScore(propertyScores);
  } else {
    displayScores = sortPropertiesByCriterion(propertyScores, sortBy);
  }

  const ScoreBadge = ({ score }: { score: 1 | 2 | 3 }) => {
    if (score === 3) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
          <Check size={14} /> Meets
        </span>
      );
    }
    if (score === 2) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
          <AlertTriangle size={14} /> Partial
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
        <X size={14} /> Doesn't Meet
      </span>
    );
  };

  if (properties.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-600">No properties to report on yet. Add and rate properties to see rankings.</p>
      </div>
    );
  }

  if (propertyScores.every(s => s.ratings.length === 0)) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-600">No ratings yet. Rate your properties to see the comparison report.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Property Rankings</h2>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex rounded-lg overflow-hidden border border-gray-300">
            <button
              onClick={() => setViewMode('tier1')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'tier1'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Tier 1 Only
            </button>
            <button
              onClick={() => setViewMode('tier2')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
                viewMode === 'tier2'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              All Properties
            </button>
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="total">Sort by Total Score</option>
              {criteria.map(criterion => (
                <option key={criterion.id} value={criterion.id}>
                  Sort by: {criterion.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
          </div>
        </div>
      </div>

      {viewMode === 'tier1' && displayScores.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-900 font-medium">No properties meet all must-have criteria.</p>
          <p className="text-yellow-700 text-sm mt-2">Switch to "All Properties" view to see all ranked properties.</p>
        </div>
      )}

      <div className="space-y-4">
        {displayScores.map((score, index) => {
          const isExpanded = expandedProperty === score.property.id;

          return (
            <div key={score.property.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl font-bold text-blue-600">#{index + 1}</span>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{score.property.name}</h3>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin size={14} />
                          {score.property.neighborhood}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{score.property.address}</p>
                  </div>

                  <div className="text-right ml-4">
                    <div className="text-3xl font-bold text-blue-600">{score.totalScore.toFixed(2)}</div>
                    <div className="text-xs text-gray-600 mt-1">Total Score</div>
                    {score.meetsAllMustHaves && (
                      <div className="mt-2">
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                          Tier 1
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {score.property.price && (
                    <div>
                      <div className="text-sm text-gray-600">Price</div>
                      <div className="font-semibold text-gray-900">${score.property.price.toLocaleString()}/mo</div>
                    </div>
                  )}
                  {score.property.bedrooms && (
                    <div>
                      <div className="text-sm text-gray-600">Bedrooms</div>
                      <div className="font-semibold text-gray-900">{score.property.bedrooms}</div>
                    </div>
                  )}
                  {score.property.bathrooms && (
                    <div>
                      <div className="text-sm text-gray-600">Bathrooms</div>
                      <div className="font-semibold text-gray-900">{score.property.bathrooms}</div>
                    </div>
                  )}
                  {score.property.sqft && (
                    <div>
                      <div className="text-sm text-gray-600">Square Feet</div>
                      <div className="font-semibold text-gray-900">{score.property.sqft.toLocaleString()}</div>
                    </div>
                  )}
                </div>

                <div className="flex gap-6 mb-4">
                  <div>
                    <div className="text-sm text-gray-600">Must-Have Score</div>
                    <div className="text-lg font-bold text-gray-900">{score.mustHaveScore.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Nice-to-Have Score</div>
                    <div className="text-lg font-bold text-gray-900">{score.niceToHaveScore.toFixed(2)}</div>
                  </div>
                  {score.property.date_viewed && (
                    <div>
                      <div className="text-sm text-gray-600">Date Viewed</div>
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(score.property.date_viewed).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>

                {score.property.notes && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-700 mb-1">Notes</div>
                    <div className="text-sm text-gray-600 italic">{score.property.notes}</div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setExpandedProperty(isExpanded ? null : score.property.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    {isExpanded ? 'Hide' : 'View'} Detailed Ratings
                  </button>
                  {score.property.listing_url && (
                    <a
                      href={score.property.listing_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                    >
                      <ExternalLink size={16} />
                      View Listing
                    </a>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                  <h4 className="font-semibold text-gray-900 mb-4">Detailed Ratings</h4>

                  {criteria.filter(c => c.type === 'must-have').length > 0 && (
                    <div className="mb-6">
                      <h5 className="font-medium text-gray-700 mb-3">Must-Haves</h5>
                      <div className="space-y-3">
                        {criteria.filter(c => c.type === 'must-have').map(criterion => {
                          const rating = score.ratings.find(r => r.criterion_id === criterion.id);
                          return (
                            <div key={criterion.id} className="bg-white p-4 rounded-lg">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">{criterion.name}</div>
                                  {criterion.definition && (
                                    <div className="text-sm text-gray-600 mt-1">{criterion.definition}</div>
                                  )}
                                </div>
                                {rating && <ScoreBadge score={rating.score} />}
                              </div>
                              {rating?.notes && (
                                <div className="text-sm text-gray-600 mt-2 pl-4 border-l-2 border-gray-300">
                                  {rating.notes}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {criteria.filter(c => c.type === 'nice-to-have').length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-3">Nice-to-Haves</h5>
                      <div className="space-y-3">
                        {criteria.filter(c => c.type === 'nice-to-have').map(criterion => {
                          const rating = score.ratings.find(r => r.criterion_id === criterion.id);
                          return (
                            <div key={criterion.id} className="bg-white p-4 rounded-lg">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">{criterion.name}</div>
                                  {criterion.definition && (
                                    <div className="text-sm text-gray-600 mt-1">{criterion.definition}</div>
                                  )}
                                </div>
                                {rating && <ScoreBadge score={rating.score} />}
                              </div>
                              {rating?.notes && (
                                <div className="text-sm text-gray-600 mt-2 pl-4 border-l-2 border-gray-300">
                                  {rating.notes}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
