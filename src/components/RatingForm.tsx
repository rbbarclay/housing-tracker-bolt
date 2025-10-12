import { useState, useEffect } from 'react';
import { Check, AlertTriangle, X, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Property, Criterion, Rating } from '../types';

interface RatingFormProps {
  propertyId: string;
  onBack: () => void;
}

export function RatingForm({ propertyId, onBack }: RatingFormProps) {
  const [property, setProperty] = useState<Property | null>(null);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [ratings, setRatings] = useState<Map<string, { score: 1 | 2 | 3; notes: string }>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [propertyId]);

  async function loadData() {
    setLoading(true);

    const [propertyResult, criteriaResult, ratingsResult] = await Promise.all([
      supabase.from('properties').select('*').eq('id', propertyId).maybeSingle(),
      supabase.from('criteria').select('*').order('type', { ascending: false }).order('name'),
      supabase.from('ratings').select('*').eq('property_id', propertyId)
    ]);

    if (propertyResult.error) {
      console.error('Error loading property:', propertyResult.error);
    } else {
      setProperty(propertyResult.data);
    }

    if (criteriaResult.error) {
      console.error('Error loading criteria:', criteriaResult.error);
    } else {
      setCriteria(criteriaResult.data || []);
    }

    if (ratingsResult.error) {
      console.error('Error loading ratings:', ratingsResult.error);
    } else {
      const ratingsMap = new Map();
      (ratingsResult.data || []).forEach((rating: Rating) => {
        ratingsMap.set(rating.criterion_id, {
          score: rating.score,
          notes: rating.notes || ''
        });
      });
      setRatings(ratingsMap);
    }

    setLoading(false);
  }

  function updateRating(criterionId: string, score: 1 | 2 | 3) {
    const current = ratings.get(criterionId) || { score: 1, notes: '' };
    setRatings(new Map(ratings.set(criterionId, { ...current, score })));
  }

  function updateNotes(criterionId: string, notes: string) {
    const current = ratings.get(criterionId) || { score: 2, notes: '' };
    setRatings(new Map(ratings.set(criterionId, { ...current, notes })));
  }

  async function handleSave() {
    if (!property) return;

    const ratingsToSave = Array.from(ratings.entries()).map(([criterion_id, { score, notes }]) => ({
      property_id: propertyId,
      criterion_id,
      score,
      notes: notes || null
    }));

    for (const rating of ratingsToSave) {
      const { error } = await supabase
        .from('ratings')
        .upsert(rating, {
          onConflict: 'property_id,criterion_id'
        });

      if (error) {
        console.error('Error saving rating:', error);
      }
    }

    onBack();
  }

  if (loading || !property) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const mustHaves = criteria.filter(c => c.type === 'must-have');
  const niceToHaves = criteria.filter(c => c.type === 'nice-to-have');

  const ScoreButton = ({
    score,
    currentScore,
    onClick,
    icon: Icon,
    label,
    color
  }: {
    score: 1 | 2 | 3;
    currentScore: 1 | 2 | 3 | undefined;
    onClick: () => void;
    icon: any;
    label: string;
    color: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all ${
        currentScore === score
          ? `${color} border-transparent text-white font-semibold`
          : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
      }`}
    >
      <Icon size={20} />
      <span className="text-sm">{label}</span>
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rate Property</h2>
          <p className="text-gray-600">{property.name} - {property.neighborhood}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-8">
        {mustHaves.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-red-200">
              Must-Haves
            </h3>
            <div className="space-y-6">
              {mustHaves.map(criterion => {
                const rating = ratings.get(criterion.id);
                return (
                  <div key={criterion.id} className="bg-red-50 p-4 rounded-lg">
                    <div className="mb-3">
                      <h4 className="font-medium text-gray-900">{criterion.name}</h4>
                      {criterion.definition && (
                        <p className="text-sm text-gray-600 mt-1">{criterion.definition}</p>
                      )}
                    </div>

                    <div className="flex gap-2 mb-3">
                      <ScoreButton
                        score={3}
                        currentScore={rating?.score}
                        onClick={() => updateRating(criterion.id, 3)}
                        icon={Check}
                        label="Meets"
                        color="bg-green-600"
                      />
                      <ScoreButton
                        score={2}
                        currentScore={rating?.score}
                        onClick={() => updateRating(criterion.id, 2)}
                        icon={AlertTriangle}
                        label="Partial"
                        color="bg-yellow-600"
                      />
                      <ScoreButton
                        score={1}
                        currentScore={rating?.score}
                        onClick={() => updateRating(criterion.id, 1)}
                        icon={X}
                        label="Doesn't Meet"
                        color="bg-red-600"
                      />
                    </div>

                    <textarea
                      value={rating?.notes || ''}
                      onChange={(e) => updateNotes(criterion.id, e.target.value)}
                      placeholder="Optional notes..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      maxLength={500}
                      rows={2}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {niceToHaves.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-green-200">
              Nice-to-Haves
            </h3>
            <div className="space-y-6">
              {niceToHaves.map(criterion => {
                const rating = ratings.get(criterion.id);
                return (
                  <div key={criterion.id} className="bg-green-50 p-4 rounded-lg">
                    <div className="mb-3">
                      <h4 className="font-medium text-gray-900">{criterion.name}</h4>
                      {criterion.definition && (
                        <p className="text-sm text-gray-600 mt-1">{criterion.definition}</p>
                      )}
                    </div>

                    <div className="flex gap-2 mb-3">
                      <ScoreButton
                        score={3}
                        currentScore={rating?.score}
                        onClick={() => updateRating(criterion.id, 3)}
                        icon={Check}
                        label="Meets"
                        color="bg-green-600"
                      />
                      <ScoreButton
                        score={2}
                        currentScore={rating?.score}
                        onClick={() => updateRating(criterion.id, 2)}
                        icon={AlertTriangle}
                        label="Partial"
                        color="bg-yellow-600"
                      />
                      <ScoreButton
                        score={1}
                        currentScore={rating?.score}
                        onClick={() => updateRating(criterion.id, 1)}
                        icon={X}
                        label="Doesn't Meet"
                        color="bg-red-600"
                      />
                    </div>

                    <textarea
                      value={rating?.notes || ''}
                      onChange={(e) => updateNotes(criterion.id, e.target.value)}
                      placeholder="Optional notes..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      maxLength={500}
                      rows={2}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {criteria.length === 0 && (
          <p className="text-center text-gray-600 py-8">
            No criteria defined yet. Add criteria first to rate properties.
          </p>
        )}
      </div>

      <div className="flex gap-3 sticky bottom-0 bg-gray-50 py-4">
        <button
          onClick={handleSave}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          Save Ratings
        </button>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
