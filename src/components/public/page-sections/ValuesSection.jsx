import React from 'react';
import { Heart, Leaf, Award, Globe } from 'lucide-react';

const VALUES = [
  { icon: <Heart size={24}/>,  title: 'Family Recipes',    desc: 'Every dish is rooted in recipes passed through three generations of our family in Mandalay and Yangon.' },
  { icon: <Leaf size={24}/>,   title: 'Fresh & Seasonal',  desc: 'We source fresh herbs, spices, and produce daily — many imported directly from Myanmar suppliers.' },
  { icon: <Award size={24}/>,  title: 'Culinary Heritage', desc: 'Our head chef trained under Myanmar master cooks and spent years researching regional Burmese flavour traditions.' },
  { icon: <Globe size={24}/>,  title: 'A Cultural Bridge', desc: "We believe food builds understanding. BurmeseBites is our way of sharing Myanmar's warmth with the world." },
];

export default function ValuesSection() {
  return (
    <section className="page-section-alt">
      <div className="container">
        <div className="about-values__head">
          <span className="section-label">What We Stand For</span>
          <h2 className="section-title">Our Philosophy</h2>
        </div>
        <div className="about-values">
          {VALUES.map(v => (
            <div key={v.title} className="about-value-card">
              <div className="about-value-card__icon">{v.icon}</div>
              <h4>{v.title}</h4>
              <p>{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
