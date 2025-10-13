import { useState, useEffect } from 'react';
import { Plus, Edit2, MapPin, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { geocodeAddress } from '../lib/geocoding';
import { Location } from '../types';

export function LocationManager() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: ''
  });

  useEffect(() => {
    loadLocations();
  }, []);

  async function loadLocations() {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading locations:', error);
    } else {
      setLocations(data || []);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsGeocoding(true);
    setGeocodeError(null);

    const geocodeResult = await geocodeAddress(formData.address);

    if (!geocodeResult.success) {
      setGeocodeError(geocodeResult.error || 'Failed to geocode address');
      setIsGeocoding(false);
      return;
    }

    const locationData = {
      name: formData.name,
      address: formData.address,
      latitude: geocodeResult.latitude,
      longitude: geocodeResult.longitude,
      updated_at: new Date().toISOString()
    };

    if (editingId) {
      const { error } = await supabase
        .from('locations')
        .update(locationData)
        .eq('id', editingId);

      if (error) {
        console.error('Error updating location:', error);
      }
    } else {
      const { error } = await supabase
        .from('locations')
        .insert(locationData);

      if (error) {
        console.error('Error creating location:', error);
      }
    }

    setIsGeocoding(false);
    resetForm();
    loadLocations();
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this location?')) return;

    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting location:', error);
    } else {
      loadLocations();
    }
  }

  function startEdit(location: Location) {
    setEditingId(location.id);
    setFormData({
      name: location.name,
      address: location.address
    });
    setIsAdding(true);
  }

  function resetForm() {
    setFormData({
      name: '',
      address: ''
    });
    setEditingId(null);
    setIsAdding(false);
    setGeocodeError(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Key Locations</h2>
          <p className="text-sm text-gray-600 mt-1">
            Add important places to calculate distances from your properties
          </p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Add Location
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4">
          {geocodeError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <p className="text-sm">{geocodeError}</p>
              <p className="text-xs mt-1">Please verify the address and try again.</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Work, Gym, Parents' House"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address *
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="123 Main St, Denver, CO 80202"
              required
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isGeocoding}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isGeocoding && <Loader2 size={16} className="animate-spin" />}
              {isGeocoding ? 'Finding location...' : `${editingId ? 'Update' : 'Save'} Location`}
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

      {locations.length === 0 && !isAdding && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">
            No locations yet. Add key places like your work, gym, or family to see distances from properties.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.map(location => (
          <div key={location.id} className="bg-white rounded-lg shadow-md p-5 space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900">{location.name}</h3>
                <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                  <MapPin size={14} />
                  {location.address}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => startEdit(location)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                <Edit2 size={16} />
                Edit
              </button>
              <button
                onClick={() => handleDelete(location.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
