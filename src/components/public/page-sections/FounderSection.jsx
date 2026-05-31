import React from 'react';

export default function FounderSection() {
  return (
    <section className="page-section">
      <div className="container about-founder">
        <div className="about-founder__img">
          <img src="https://images.unsplash.com/photo-1607631568010-a87245c0daf8?w=700&q=80" alt="Daw Mya, Founder" />
        </div>
        <div className="about-founder__text">
          <span className="section-label">The Beginning</span>
          <h2 className="section-title">
            From Mandalay's<br />
            <em>Streets to Bangkok</em>
          </h2>
          <p>
            BurmeseBites was born from homesickness and a mission. When Daw Mya Sein moved to Bangkok
            in 2007, she found almost no authentic Burmese food. She began cooking for friends, sharing
            the flavours she missed — the silky coconut broths, the tangy tea leaf salads, the fragrant curries.
          </p>
          <p style={{ marginTop: 16 }}>
            By 2009, demand had grown enough to open a small kitchen. Today, BurmeseBites seats 60 guests
            and has become one of Bangkok's most beloved destination restaurants — but our recipes, our warmth,
            and our mission remain the same.
          </p>
          <div className="ornament"><span>✦</span></div>
          <blockquote className="about-founder__quote">
            "When I cook, I'm not just feeding people. I'm showing them a piece of my country — its
            generosity, its complexity, its soul."
            <cite>— Daw Mya Sein, Founder</cite>
          </blockquote>
        </div>
      </div>
    </section>
  );
}
