import React from 'react';
import {
  HeroSection,
  StatsSection,
  FeaturedDishesSection,
  ReviewsPreviewSection,
  CTABannerSection,
} from '../../components/public/page-sections';
import './Home.css';

export default function Home() {
  return (
    <div className="home">
      <HeroSection />
      <StatsSection />
      <FeaturedDishesSection />
      <ReviewsPreviewSection />
      <CTABannerSection />
    </div>
  );
}