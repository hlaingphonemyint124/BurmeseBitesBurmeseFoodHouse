import React from 'react';
import { Star, Users, Award, Clock } from 'lucide-react';

const STATS = [
  { icon: <Star size={22} />,  label: 'Average Rating', value: '4.9' },
  { icon: <Users size={22} />, label: 'Happy Guests',    value: '12K+' },
  { icon: <Award size={22} />, label: 'Years of Craft',  value: '15+' },
  { icon: <Clock size={22} />, label: 'Years in Bangkok', value: '8' },
];

export default function StatsSection() {
  return (
    <div className="stats-bar">
      <div className="container stats-bar__inner">
        {STATS.map(({ icon, label, value }) => (
          <div key={label} className="stats-bar__item">
            <span className="stats-bar__icon">{icon}</span>
            <div>
              <div className="stats-bar__value">{value}</div>
              <div className="stats-bar__label">{label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
