import React, { useState } from 'react';
import { Clock, Sun, Moon, Calendar } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useApp } from '../../store/AppContext';
import { useAuth } from '../../store/AuthContext';
import { supabase } from '../../lib/supabase';
import type { AvailabilityType, AvailabilityHours } from '../../types';

interface AvailabilitySelectorProps {
  onSave?: () => void;
  compact?: boolean;
}

const DAYS = [
  { key: 'mon', en: 'Monday', ur: 'پیر' },
  { key: 'tue', en: 'Tuesday', ur: 'منگل' },
  { key: 'wed', en: 'Wednesday', ur: 'بدھ' },
  { key: 'thu', en: 'Thursday', ur: 'جمعرات' },
  { key: 'fri', en: 'Friday', ur: 'جمعہ' },
  { key: 'sat', en: 'Saturday', ur: 'ہفتہ' },
  { key: 'sun', en: 'Sunday', ur: 'اتوار' },
];

const AVAILABILITY_TYPES: { value: AvailabilityType; en: string; ur: string; icon: typeof Clock }[] = [
  { value: '24_hours', en: '24 Hours', ur: '24 گھنٹے', icon: Clock },
  { value: 'daytime', en: 'Daytime (8AM-6PM)', ur: 'دن (8ص-6ش)', icon: Sun },
  { value: 'night', en: 'Night (6PM-8AM)', ur: 'رات (6ش-8ص)', icon: Moon },
  { value: 'custom', en: 'Custom Hours', ur: 'مخصوص اوقات', icon: Calendar },
];

const TIME_OPTIONS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
  '20:00', '21:00', '22:00', '23:00', '00:00',
];

export const AvailabilitySelector: React.FC<AvailabilitySelectorProps> = ({
  onSave,
  compact = false,
}) => {
  const { language } = useApp();
  const { provider, refreshProvider } = useAuth();

  const [availabilityType, setAvailabilityType] = useState<AvailabilityType>(
    provider?.availability_type || '24_hours'
  );
  const [selectedDays, setSelectedDays] = useState<string[]>(
    provider?.available_days || ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  );
  const [customHours, setCustomHours] = useState<AvailabilityHours[]>(
    (provider?.availability_hours as AvailabilityHours[]) || [{ start: '09:00', end: '17:00' }]
  );
  const [isEmergencyAvailable, setIsEmergencyAvailable] = useState(
    provider?.is_emergency_available || false
  );
  const [saving, setSaving] = useState(false);

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day]
    );
  };

  const addTimeSlot = () => {
    setCustomHours([...customHours, { start: '09:00', end: '17:00' }]);
  };

  const removeTimeSlot = (index: number) => {
    setCustomHours(customHours.filter((_, i) => i !== index));
  };

  const updateTimeSlot = (index: number, field: 'start' | 'end', value: string) => {
    const updated = [...customHours];
    updated[index] = { ...updated[index], [field]: value };
    setCustomHours(updated);
  };

  const handleSave = async () => {
    if (!provider) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from('providers')
        .update({
          availability_type: availabilityType,
          available_days: selectedDays,
          availability_hours: customHours,
          is_emergency_available: isEmergencyAvailable,
        })
        .eq('id', provider.id);

      if (error) throw error;

      await refreshProvider();
      onSave?.();
    } catch (err) {
      console.error('Error saving availability:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {!compact && (
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">
            {language === 'ur' ? 'دستیابی کا شیڈول' : 'Availability Schedule'}
          </h2>
          <p className="text-gray-500 mt-1">
            {language === 'ur'
              ? 'بتائیں کہ آپ کب کام کے لیے دستیاب ہیں'
              : 'Set when you are available for work'}
          </p>
        </div>
      )}

      {/* Availability Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {language === 'ur' ? 'دستیابی کی قسم' : 'Availability Type'}
        </label>
        <div className="grid grid-cols-2 gap-3">
          {AVAILABILITY_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setAvailabilityType(type.value)}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                availabilityType === type.value
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <type.icon className={`w-5 h-5 ${
                availabilityType === type.value ? 'text-blue-600' : 'text-gray-400'
              }`} />
              <span className={`font-medium ${
                availabilityType === type.value ? 'text-blue-600' : 'text-gray-700'
              }`}>
                {language === 'ur' ? type.ur : type.en}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Hours */}
      {availabilityType === 'custom' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {language === 'ur' ? 'کام کے اوقات' : 'Working Hours'}
          </label>
          <div className="space-y-3">
            {customHours.map((slot, index) => (
              <div key={index} className="flex items-center gap-3">
                <select
                  value={slot.start}
                  onChange={(e) => updateTimeSlot(index, 'start', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
                <span className="text-gray-500">to</span>
                <select
                  value={slot.end}
                  onChange={(e) => updateTimeSlot(index, 'end', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
                {customHours.length > 1 && (
                  <button
                    onClick={() => removeTimeSlot(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addTimeSlot}
              className="text-sm text-blue-600 font-medium hover:underline"
            >
              + {language === 'ur' ? 'وقت کا خانہ شامل کریں' : 'Add time slot'}
            </button>
          </div>
        </div>
      )}

      {/* Working Days */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {language === 'ur' ? 'کام کے دن' : 'Working Days'}
        </label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((day) => (
            <button
              key={day.key}
              onClick={() => toggleDay(day.key)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedDays.includes(day.key)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {language === 'ur' ? day.ur : day.en.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      {/* Emergency Availability */}
      <Card className="bg-orange-50 border-orange-200">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isEmergencyAvailable}
            onChange={(e) => setIsEmergencyAvailable(e.target.checked)}
            className="w-5 h-5 mt-0.5 rounded border-orange-300 text-orange-600 focus:ring-orange-500"
          />
          <div>
            <p className="font-medium text-orange-800">
              {language === 'ur' ? 'ہنگامی کالوں کے لیے دستیاب' : 'Available for Emergency Calls'}
            </p>
            <p className="text-sm text-orange-700 mt-0.5">
              {language === 'ur'
                ? 'صارفین آپ کو فوری ضرورت کے لیے 24/7 رابطہ کر سکتے ہیں'
                : 'Customers can contact you 24/7 for urgent needs'}
            </p>
          </div>
        </label>
      </Card>

      <Button fullWidth onClick={handleSave} loading={saving}>
        {language === 'ur' ? 'شیڈول محفوظ کریں' : 'Save Schedule'}
      </Button>
    </div>
  );
};
