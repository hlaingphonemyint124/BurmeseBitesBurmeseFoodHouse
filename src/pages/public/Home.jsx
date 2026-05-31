import React from 'react';
import {
  HeroSection,
  StatsSection,
  StorySection,
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
      <StorySection />
      <FeaturedDishesSection />
      <ReviewsPreviewSection />
      <CTABannerSection />
    </div>
  );
}
