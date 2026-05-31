import React from 'react';

const TEAM = [
  {
    name: 'Daw Mya Sein',
    role: 'Founder & Head Chef',
    bio: "Born in Mandalay, Daw Mya brought her grandmother's recipes to Bangkok in 2009. Her Ohn No Khao Swe is legendary.",
    img: 'https://images.unsplash.com/photo-1607631568010-a87245c0daf8?w=400&q=80',
  },
  {
    name: 'Ko Zaw Linn',
    role: 'Sous Chef',
    bio: "Specialising in curries and sambals, Ko Zaw trained in Yangon's finest kitchens before joining BurmeseBites in 2015.",
    img: 'https://images.unsplash.com/photo-1583394293214-0b7f7c74a8eb?w=400&q=80',
  },
  {
    name: 'Ma Thida Kyaw',
    role: 'Pastry & Desserts',
    bio: 'Ma Thida is the genius behind our Mont Lone Yay Paw and Sanwin Makin — traditional sweets reimagined with flair.',
    img: 'https://images.unsplash.com/photo-1607631568010-a87245c0daf8?w=400&q=80',
  },
];

export default function TeamSection() {
  return (
    <section className="page-section-alt">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span className="section-label">The People</span>
          <h2 className="section-title">Meet Our Team</h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Passionate cooks who bring Myanmar's culinary traditions to life, every single day.
          </p>
        </div>
        <div className="about-team">
          {TEAM.map(member => (
            <div key={member.name} className="team-card">
              <div className="team-card__img">
                <img src={member.img} alt={member.name} loading="lazy" />
              </div>
              <div className="team-card__body">
                <h4 className="team-card__name">{member.name}</h4>
                <span className="team-card__role">{member.role}</span>
                <p className="team-card__bio">{member.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
