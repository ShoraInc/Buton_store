import React from 'react';
import { MapPin, Award } from 'lucide-react';

const Features = () => {
  return (
    <div className="bg-gray-100 py-4">
      <div className="container mx-auto px-4">
        <div className="flex gap-8">
          <div className="flex items-center gap-2">
            <MapPin size={20} className="text-gray-600" />
            <span className="text-sm">Бесплатная доставка в черте города</span>
          </div>
          <div className="flex items-center gap-2">
            <Award size={20} className="text-gray-600" />
            <span className="text-sm">Профессиональное оформление</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Features;