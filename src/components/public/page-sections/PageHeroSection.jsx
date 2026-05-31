import React from 'react';

export default function PageHeroSection({ bgUrl, label, title, subtitle, labelColor = '#E8A84A' }) {
  return (
    <div className="page-hero">
      <div
        className="page-hero__bg"
        style={{ backgroundImage: `url(${bgUrl})` }}
      />
      <div className="page-hero__overlay" />
      <div className="container page-hero__content">
        <span className="section-label" style={{ color: labelColor }}>{label}</span>
        <h1 className="page-hero__title">{title}</h1>
        {subtitle && <p className="page-hero__sub">{subtitle}</p>}
      </div>
    </div>
  );
}
