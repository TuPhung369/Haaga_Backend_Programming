import React, { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

const stats = [
  {
    number: 99.9,
    suffix: '%',
    label: 'Uptime Guarantee',
    description: 'Enterprise-grade reliability',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z"/>
        <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0"/>
      </svg>
    ),
  },
  {
    number: 10000,
    suffix: '+',
    label: 'API Requests',
    description: 'Handled per minute',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
        <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"/>
        <path d="M5 6.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0m1.5 1.5a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0m1.5 1.5a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0m1.5 1.5a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0M8 6.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0m3.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5m-1.5 1.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5m-1.5 1.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5m-1.5 1.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5m7.5-7.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5m-1.5 1.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5m-1.5 1.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5m-1.5 1.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5"/>
      </svg>
    ),
  },
  {
    number: 256,
    suffix: '-bit',
    label: 'Encryption',
    description: 'Military-grade security',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2m3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2M5 8h6a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1"/>
      </svg>
    ),
  },
  {
    number: 98,
    suffix: '%',
    label: 'Customer Satisfaction',
    description: 'Based on user feedback',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
        <path d="M4.285 9.567a.5.5 0 0 1 .683.183A3.5 3.5 0 0 0 8 11.5a3.5 3.5 0 0 0 3.032-1.75.5.5 0 1 1 .866.5A4.5 4.5 0 0 1 8 12.5a4.5 4.5 0 0 1-3.898-2.25.5.5 0 0 1 .183-.683M7 6.5C7 7.328 6.552 8 6 8s-1-.672-1-1.5S5.448 5 6 5s1 .672 1 1.5m4 0c0 .828-.448 1.5-1 1.5s-1-.672-1-1.5S9.448 5 10 5s1 .672 1 1.5"/>
      </svg>
    ),
  },
];

function AnimatedNumber({ number, suffix, duration = 2000 }) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let start = 0;
    const end = number;
    const incrementTime = duration / end;
    const step = end / 100;

    const timer = setInterval(() => {
      start += step;
      setCount(Math.min(start, end));
      if (start >= end) {
        clearInterval(timer);
      }
    }, incrementTime);

    return () => {
      clearInterval(timer);
    };
  }, [isVisible, number, duration]);

  return (
    <span ref={ref} className={styles.animatedNumber}>
      {number < 100 ? count.toFixed(1) : Math.floor(count)}
      {suffix}
    </span>
  );
}

export default function HomepageStats() {
  return (
    <section className={styles.statsSection}>
      <div className={styles.homeContainer}>
        <div className={styles.sectionTitle}>
          <h2>Enterprise Nexus by the Numbers</h2>
          <p>Delivering exceptional performance at scale</p>
          <div className={styles.titleUnderline}></div>
        </div>
        <div className={styles.statsGrid}>
          {stats.map((stat, idx) => (
            <div key={idx} className={styles.statCard}>
              <div className={styles.statIcon}>{stat.icon}</div>
              <div className={styles.statContent}>
                <div className={styles.statNumber}>
                  <AnimatedNumber number={stat.number} suffix={stat.suffix} />
                </div>
                <div className={styles.statLabel}>{stat.label}</div>
                <div className={styles.statDescription}>{stat.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}