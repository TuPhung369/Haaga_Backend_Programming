import React from "react";
import clsx from "clsx";
import styles from "./styles.module.css";

// Security features and strengths of the project
const securityFeatures = [
  {
    name: "Token Encryption",
    logo: "🔐",
    description:
      "Advanced JWT tokens encrypted with RS256 algorithm ensuring secure authentication",
  },
  {
    name: "Refresh Token Rotation",
    logo: "🔄",
    description:
      "Automatic rotation of refresh tokens with limited lifetime to prevent token theft",
  },
  {
    name: "XSS Protection",
    logo: "🛡️",
    description:
      "Implementation of HttpOnly cookies and Content-Security-Policy headers to prevent cross-site scripting",
  },
  {
    name: "CSRF Prevention",
    logo: "🚫",
    description:
      "Double-submit cookie pattern and SameSite cookie attributes to mitigate CSRF attacks",
  },
  {
    name: "Rate Limiting",
    logo: "⏱️",
    description:
      "IP-based and user-based rate limiting to prevent brute force and DDoS attacks",
  },
  {
    name: "Data Encryption",
    logo: "📊",
    description:
      "End-to-end encryption for sensitive data with AES-256 ensuring privacy compliance",
  },
];

export default function HomepageSecurityFeatures() {
  return (
    <section className={styles.partnersSection}>
      <div className={styles.homeContainer}>
        <div className={styles.sectionTitle}>
          <h2>Security Features</h2>
          <p>
            Advanced security measures implemented to protect your data and
            prevent common vulnerabilities
          </p>
          <div className={styles.titleUnderline}></div>
        </div>

        <div className={styles.partnersGrid}>
          {securityFeatures.map((feature, idx) => (
            <div key={idx} className={styles.partnerCard}>
              <div className={styles.partnerLogo}>{feature.logo}</div>
              <div className={styles.partnerName}>{feature.name}</div>
              <div className={styles.partnerCategory}>
                {feature.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
