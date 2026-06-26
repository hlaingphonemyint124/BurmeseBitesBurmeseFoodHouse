import React, { useEffect, useRef, useState } from 'react';
import { Star, Users, Award, Clock } from 'lucide-react';

const STATS = [
  { icon: <Star size={22} />,  label: 'Average Rating', value: 4.9,   suffix: '',   decimals: 1 },
  { icon: <Users size={22} />, label: 'Happy Guests',   value: 12000, suffix: 'K+', decimals: 0, divisor: 1000 },
  { icon: <Award size={22} />, label: 'Years of Craft', value: 15,    suffix: '+',  decimals: 0 },
  { icon: <Clock size={22} />, label: 'Years in Bangkok', value: 8,   suffix: '',   decimals: 0 },
];

function useCountUp(target, decimals = 0, divisor = 1, active) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    const duration = 1800;
    const start = performance.now();
    const raf = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setVal(parseFloat(((target * ease) / divisor).toFixed(decimals)));
      if (t < 1) requestAnimationFrame(raf);
      else setVal(parseFloat((target / divisor).toFixed(decimals)));
    };
    requestAnimationFrame(raf);
  }, [active, target]);
  return val;
}

function StatItem({ icon, label, value, suffix, decimals, divisor = 1, delay, active }) {
  const count = useCountUp(value, decimals, divisor, active);
  return (
    <div className="stats-bar__item reveal-item" style={{ animationDelay: `${delay}ms` }}>
      <span className="stats-bar__icon">{icon}</span>
      <div>
        <div className="stats-bar__value">{count}{suffix}</div>
        <div className="stats-bar__label">{label}</div>
      </div>
    </div>
  );
}

export default function StatsSection() {
  const ref = useRef(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setActive(true); obs.disconnect(); } }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="stats-bar" ref={ref}>
      <div className="container stats-bar__inner">
        {STATS.map(({ icon, label, value, suffix, decimals, divisor }, i) => (
          <StatItem key={label} icon={icon} label={label} value={value} suffix={suffix}
            decimals={decimals} divisor={divisor} delay={i * 140} active={active} />
        ))}
      </div>
    </div>
  );
}
