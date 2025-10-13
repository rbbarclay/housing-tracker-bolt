import { useState, useEffect } from 'react';
import { Plus, Edit2, MapPin, Star, Archive, Loader2, CheckCircle, Clock, AlertCircle, TrendingUp, MapPinned, MapPinOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { geocodeAddress } from '../lib/geocoding';
import { Property, Rating, Criterion } from '../types';

interface PropertyManagerProps {
  onRate: (propertyId: string) => void;
}

export function PropertyManager({ onRate }: PropertyManagerProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    neighborhood: '',
    price: '',
    bedrooms: '',
    bathrooms: '',
    sqft: '',
    date_viewed: '',
    listing_url: '',
    notes: ''
  });

  useEffect(() => {
    loadProperties();
    loadRatings();
    loadCriteria();
  }, []);

  async function loadProperties() {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading properties:', error);
    } else {
      setProperties(data || []);
    }
  }

  async function loadRatings() {
    const { data, error } = await supabase
      .from('ratings')
      .select('*');

    if (error) {
      console.error('Error loading ratings:', error);
    } else {
      setRatings(data || []);
    }
  }

  async function loadCriteria() {
    const { data, error } = await supabase
      .from('criteria')
      .select('*');

    if (error) {
      console.error('Error loading criteria:', error);
    } else {
      setCriteria(data || []);
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

    const propertyData = {
      name: formData.name,
      address: formData.address,
      neighborhood: formData.neighborhood,
      price: formData.price ? parseFloat(formData.price) : null,
      bedrooms: formData.bedrooms ? parseFloat(formData.bedrooms) : null,
      bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : null,
      sqft: formData.sqft ? parseFloat(formData.sqft) : null,
      date_viewed: formData.date_viewed || null,
      listing_url: formData.listing_url || null,
      notes: formData.notes || null,
      latitude: geocodeResult.latitude,
      longitude: geocodeResult.longitude,
      updated_at: new Date().toISOString()
    };

    if (editingId) {
      const { error } = await supabase
        .from('properties')
        .update(propertyData)
        .eq('id', editingId);

      if (error) {
        console.error('Error updating property:', error);
      }
    } else {
      const { error } = await supabase
        .from('properties')
        .insert(propertyData);

      if (error) {
        console.error('Error creating property:', error);
      }
    }

    setIsGeocoding(false);
    resetForm();
    loadProperties();
  }

  async function handleArchive(id: string, archived: boolean) {
    const { error } = await supabase
      .from('properties')
      .update({ archived: !archived, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error archiving property:', error);
    } else {
      loadProperties();
    }
  }

  function startEdit(property: Property) {
    setEditingId(property.id);
    setFormData({
      name: property.name,
      address: property.address,
      neighborhood: property.neighborhood,
      price: property.price?.toString() || '',
      bedrooms: property.bedrooms?.toString() || '',
      bathrooms: property.bathrooms?.toString() || '',
      sqft: property.sqft?.toString() || '',
      date_viewed: property.date_viewed || '',
      listing_url: property.listing_url || '',
      notes: property.notes || ''
    });
    setIsAdding(true);
  }

  function resetForm() {
    setFormData({
      name: '',
      address: '',
      neighborhood: '',
      price: '',
      bedrooms: '',
      bathrooms: '',
      sqft: '',
      date_viewed: '',
      listing_url: '',
      notes: ''
    });
    setEditingId(null);
    setIsAdding(false);
    setGeocodeError(null);
  }

  function getRatingStatus(propertyId: string): 'complete' | 'partial' | 'none' {
    const propertyRatings = ratings.filter(r => r.property_id === propertyId);
    if (propertyRatings.length === 0) return 'none';
    if (propertyRatings.length === criteria.length) return 'complete';
    return 'partial';
  }

  function getPropertyBadges(property: Property) {
    const badges = [];
    const status = getRatingStatus(property.id);

    if (status === 'complete') {
      badges.push({
        icon: CheckCircle,
        text: 'Fully Rated',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        iconColor: 'text-green-600'
      });
    } else if (status === 'partial') {
      badges.push({
        icon: AlertCircle,
        text: 'Partial Rating',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        iconColor: 'text-yellow-600'
      });
    } else if (property.date_viewed) {
      badges.push({
        icon: Clock,
        text: 'Viewed',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
        iconColor: 'text-blue-600'
      });
    } else {
      badges.push({
        icon: MapPin,
        text: 'Not Viewed',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-600',
        iconColor: 'text-gray-500'
      });
    }

    const propertyRatings = ratings.filter(r => r.property_id === property.id);
    if (propertyRatings.length > 0) {
      const avgScore = propertyRatings.reduce((sum, r) => sum + r.score, 0) / propertyRatings.length;
      if (avgScore >= 2.5) {
        badges.push({
          icon: TrendingUp,
          text: 'Top Pick',
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-800',
          iconColor: 'text-purple-600'
        });
      }
    }

    if (property.latitude && property.longitude) {
      badges.push({
        icon: MapPinned,
        text: 'Mapped',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        iconColor: 'text-green-600'
      });
    } else {
      badges.push({
        icon: MapPinOff,
        text: 'Not Mapped',
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        iconColor: 'text-red-600'
      });
    }

    return badges;
  }

  const displayProperties = properties.filter(p => showArchived ? p.archived : !p.archived);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Properties</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            {showArchived ? 'Show Active' : 'Show Archived'}
          </button>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Add Property
            </button>
          )}
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4">
          {geocodeError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <p className="text-sm">{geocodeError}</p>
              <p className="text-xs mt-1">Please verify the address and try again. The property will still be saved but won't appear on the map.</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Sunset Apartments"
                required
              />
            </div>

            <div className="md:col-span-2">
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

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Neighborhood *
              </label>
              <input
                type="text"
                value={formData.neighborhood}
                onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Capitol Hill"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price ($/month)
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="2500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Viewed
              </label>
              <input
                type="date"
                value={formData.date_viewed}
                onChange={(e) => setFormData({ ...formData, date_viewed: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bedrooms
              </label>
              <input
                type="number"
                step="0.5"
                value={formData.bedrooms}
                onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bathrooms
              </label>
              <input
                type="number"
                step="0.5"
                value={formData.bathrooms}
                onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Square Footage
              </label>
              <input
                type="number"
                value={formData.sqft}
                onChange={(e) => setFormData({ ...formData, sqft: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="1200"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Listing URL
              </label>
              <input
                type="url"
                value={formData.listing_url}
                onChange={(e) => setFormData({ ...formData, listing_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Additional notes about this property..."
                maxLength={2000}
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isGeocoding}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isGeocoding && <Loader2 size={16} className="animate-spin" />}
              {isGeocoding ? 'Finding location...' : `${editingId ? 'Update' : 'Save'} Property`}
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

      {displayProperties.length === 0 && !isAdding && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">
            {showArchived ? 'No archived properties.' : 'No properties yet. Add your first property to get started.'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayProperties.map(property => {
          const status = getRatingStatus(property.id);
          return (
            <div key={property.id} className="bg-white rounded-lg shadow-md p-5 space-y-3">
              <div>
                <h3 className="font-semibold text-lg text-gray-900">{property.name}</h3>
                <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                  <MapPin size={14} />
                  {property.neighborhood}
                </div>
                {property.date_viewed && (
                  <p className="text-xs text-gray-500 mt-1">
                    Viewed {new Date(property.date_viewed).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 mt-2">
                {getPropertyBadges(property).map((badge, idx) => {
                  const Icon = badge.icon;
                  return (
                    <span
                      key={idx}
                      className={`${badge.bgColor} ${badge.textColor} text-xs px-2 py-1 rounded-full flex items-center gap-1 font-medium`}
                    >
                      <Icon size={12} className={badge.iconColor} />
                      {badge.text}
                    </span>
                  );
                })}
              </div>

              <p className="text-sm text-gray-600">{property.address}</p>

              <div className="flex gap-4 text-sm text-gray-700">
                {property.price && <span>${property.price.toLocaleString()}/mo</span>}
                {property.bedrooms && <span>{property.bedrooms} bed</span>}
                {property.bathrooms && <span>{property.bathrooms} bath</span>}
              </div>

              {property.sqft && (
                <p className="text-sm text-gray-600">{property.sqft.toLocaleString()} sqft</p>
              )}

              {property.notes && (
                <p className="text-sm text-gray-700 italic">{property.notes}</p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => onRate(property.id)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  <Star size={16} />
                  Rate
                </button>
                <button
                  onClick={() => startEdit(property)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleArchive(property.id, property.archived)}
                  className="p-2 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                  title={property.archived ? 'Unarchive' : 'Archive'}
                >
                  <Archive size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
