import React from 'react';

const TIMELINE = [
  { year: '2009', event: "Daw Mya opens BurmeseBites in a small shophouse in Bangkok's Sukhumvit district." },
  { year: '2012', event: 'Wins "Best Hidden Gem" in Bangkok\'s annual food awards. The queue stretches around the block.' },
  { year: '2015', event: 'Expands to a full restaurant with a 60-seat dining room and private events space.' },
  { year: '2019', event: 'Featured in Condé Nast Traveller\'s "Asia\'s Most Authentic Ethnic Restaurants" list.' },
  { year: '2023', event: 'Launches online ordering and delivery — bringing Myanmar home-cooking to more of Bangkok.' },
];

export default function TimelineSection() {
  return (
    <section className="page-section">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span className="section-label">Milestones</span>
          <h2 className="section-title">Our Journey</h2>
        </div>
        <div className="about-timeline">
          {TIMELINE.map((t, i) => (
            <div
              key={t.year}
              className={`about-timeline__item ${i % 2 === 0 ? 'about-timeline__item--left' : 'about-timeline__item--right'}`}
            >
              <div className="about-timeline__card">
                <span className="about-timeline__year">{t.year}</span>
                <p>{t.event}</p>
              </div>
              <div className="about-timeline__dot" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
