import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Criterion, CriterionType, Property } from '../types';

export function CriteriaManager() {
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showBulkRatingPrompt, setShowBulkRatingPrompt] = useState(false);
  const [newCriterionId, setNewCriterionId] = useState<string | null>(null);
  const [propertiesNeedingRating, setPropertiesNeedingRating] = useState<Property[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    type: 'must-have' as CriterionType,
    definition: ''
  });

  useEffect(() => {
    loadCriteria();
  }, []);

  async function loadCriteria() {
    const { data, error } = await supabase
      .from('criteria')
      .select('*')
      .order('type', { ascending: false })
      .order('name');

    if (error) {
      console.error('Error loading criteria:', error);
    } else {
      setCriteria(data || []);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (editingId) {
      const { error } = await supabase
        .from('criteria')
        .update({
          name: formData.name,
          type: formData.type,
          definition: formData.definition || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingId);

      if (error) {
        console.error('Error updating criterion:', error);
      }

      resetForm();
      loadCriteria();
    } else {
      const { data, error } = await supabase
        .from('criteria')
        .insert({
          name: formData.name,
          type: formData.type,
          definition: formData.definition || null
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating criterion:', error);
        resetForm();
        loadCriteria();
      } else if (data) {
        const propertiesResult = await supabase
          .from('properties')
          .select('*')
          .eq('archived', false);

        if (propertiesResult.data && propertiesResult.data.length > 0) {
          const ratingsResult = await supabase
            .from('ratings')
            .select('property_id')
            .eq('criterion_id', data.id);

          const ratedPropertyIds = new Set(ratingsResult.data?.map(r => r.property_id) || []);
          const unratedProperties = propertiesResult.data.filter(p => !ratedPropertyIds.has(p.id));

          if (unratedProperties.length > 0) {
            setNewCriterionId(data.id);
            setPropertiesNeedingRating(unratedProperties);
            setShowBulkRatingPrompt(true);
          }
        }

        resetForm();
        loadCriteria();
      }
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this criterion? Ratings for this criterion will also be deleted.')) {
      return;
    }

    const { error } = await supabase
      .from('criteria')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting criterion:', error);
    } else {
      loadCriteria();
    }
  }

  function startEdit(criterion: Criterion) {
    setEditingId(criterion.id);
    setFormData({
      name: criterion.name,
      type: criterion.type,
      definition: criterion.definition || ''
    });
    setIsAdding(true);
  }

  function resetForm() {
    setFormData({ name: '', type: 'must-have', definition: '' });
    setEditingId(null);
    setIsAdding(false);
  }

  async function handleBulkRating(score: 1 | 2 | 3) {
    if (!newCriterionId) return;

    const ratingsToInsert = propertiesNeedingRating.map(property => ({
      property_id: property.id,
      criterion_id: newCriterionId,
      score,
      notes: null
    }));

    const { error } = await supabase
      .from('ratings')
      .insert(ratingsToInsert);

    if (error) {
      console.error('Error creating bulk ratings:', error);
    }

    setShowBulkRatingPrompt(false);
    setNewCriterionId(null);
    setPropertiesNeedingRating([]);
  }

  function dismissBulkRating() {
    setShowBulkRatingPrompt(false);
    setNewCriterionId(null);
    setPropertiesNeedingRating([]);
  }

  const mustHaves = criteria.filter(c => c.type === 'must-have');
  const niceToHaves = criteria.filter(c => c.type === 'nice-to-have');

  return (
    <div className="space-y-6">
      {showBulkRatingPrompt && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-blue-600 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">
                Rate Existing Properties?
              </h3>
              <p className="text-sm text-gray-700 mb-4">
                You have {propertiesNeedingRating.length} existing {propertiesNeedingRating.length === 1 ? 'property' : 'properties'} without ratings for this new criterion.
                Would you like to apply a default rating to all of them now? You can always adjust individual ratings later.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleBulkRating(3)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Rate All as "Meets"
                </button>
                <button
                  onClick={() => handleBulkRating(2)}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
                >
                  Rate All as "Partial"
                </button>
                <button
                  onClick={() => handleBulkRating(1)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Rate All as "Doesn't Meet"
                </button>
                <button
                  onClick={dismissBulkRating}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  Skip - I'll Rate Manually
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Search Criteria</h2>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Add Criterion
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Criterion Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Access to public transportation"
              maxLength={200}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="must-have"
                  checked={formData.type === 'must-have'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as CriterionType })}
                  className="mr-2"
                />
                Must-Have
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="nice-to-have"
                  checked={formData.type === 'nice-to-have'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as CriterionType })}
                  className="mr-2"
                />
                Nice-to-Have
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Definition (Optional)
            </label>
            <textarea
              value={formData.definition}
              onChange={(e) => setFormData({ ...formData, definition: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Within 10 min walk to metro station"
              maxLength={500}
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {editingId ? 'Update' : 'Save'} Criterion
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {criteria.length === 0 && !isAdding && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No criteria yet. Add your first criterion to get started.</p>
        </div>
      )}

      {mustHaves.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Must-Haves</h3>
          <div className="space-y-3">
            {mustHaves.map(criterion => (
              <div key={criterion.id} className="flex items-start justify-between p-4 bg-red-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{criterion.name}</h4>
                  {criterion.definition && (
                    <p className="text-sm text-gray-600 mt-1">{criterion.definition}</p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => startEdit(criterion)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(criterion.id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {niceToHaves.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Nice-to-Haves</h3>
          <div className="space-y-3">
            {niceToHaves.map(criterion => (
              <div key={criterion.id} className="flex items-start justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{criterion.name}</h4>
                  {criterion.definition && (
                    <p className="text-sm text-gray-600 mt-1">{criterion.definition}</p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => startEdit(criterion)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(criterion.id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
