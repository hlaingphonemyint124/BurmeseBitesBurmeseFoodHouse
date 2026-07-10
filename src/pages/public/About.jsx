import React from 'react';
import { Link } from 'react-router-dom';
import {
  PageHeroSection,
  FounderSection,
  ValuesSection,
  TimelineSection,
  TeamSection,
} from '../../components/public/page-sections';
import './About.css';

export default function About() {
  return (
    <div className="about-page">
      <PageHeroSection
        bgUrl="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1400&q=80"
        label="Our Heritage"
        title="Our Story"
        subtitle="A love letter to Myanmar, cooked fresh every day"
      />
      <FounderSection />
      <ValuesSection />
      <TimelineSection />
      <TeamSection />

      {/* CTA */}
      <section className="about-cta">
        <div className="container about-cta__inner">
          <div>
            <h2>Come Experience It Yourself</h2>
            <p>Every table is a story. We'd love to share ours with you.</p>
          </div>
          <div className="about-cta__btns">
            <Link to="/reservation" className="btn btn-primary">Reserve a Table</Link>
            <Link to="/menu" className="btn btn-outline">View Our Menu</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
