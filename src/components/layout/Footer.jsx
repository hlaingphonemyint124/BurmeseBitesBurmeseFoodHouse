import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, Instagram, Facebook } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__top">
        <div className="container footer__grid">
          {/* Brand */}
          <div className="footer__brand">
            <div className="footer__logo">
              <img src="/logo.png" alt="BurmeseBites" className="footer__logo-img" />
            </div>
            <p className="footer__tagline">
              Bringing the warmth, spice, and soul of Myanmar to your table. 
              Every dish tells a story of our heritage.
            </p>
            <div className="footer__socials">
              <a href="#" aria-label="Instagram" className="footer__social"><Instagram size={18} /></a>
              <a href="#" aria-label="Facebook"  className="footer__social"><Facebook size={18} /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer__col">
            <h4>Explore</h4>
            <ul>
              {[
                ['/', 'Home'],
                ['/menu', 'Our Menu'],
                ['/gallery', 'Gallery'],
                ['/reservation', 'Book a Table'],
                ['/about', 'Our Story'],
                ['/reviews', 'Reviews'],
              ].map(([to, label]) => (
                <li key={to}><Link to={to}>{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Hours */}
          <div className="footer__col">
            <h4>Opening Hours</h4>
            <ul className="footer__hours">
              <li><span>Monday – Friday</span><span>11:30 – 22:00</span></li>
              <li><span>Saturday</span><span>11:00 – 23:00</span></li>
              <li><span>Sunday</span><span>11:00 – 21:00</span></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="footer__col">
            <h4>Find Us</h4>
            <ul className="footer__contact">
              <li>
                <MapPin size={14} />
                <span>123 Sukhumvit Soi 11<br/>Khlong Toei, Bangkok 10110</span>
              </li>
              <li>
                <Phone size={14} />
                <a href="tel:+66012345678">+66 01 234 5678</a>
              </li>
              <li>
                <Mail size={14} />
                <a href="mailto:hello@burmesebitesrestaurant.com">hello@burmesebitesrestaurant.com</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="footer__bottom">
        <div className="container">
          <p>© {new Date().getFullYear()} BurmeseBites. All rights reserved.</p>
          <p>Crafted with ♥ in Bangkok</p>
        </div>
      </div>
    </footer>
  );
}
