import React from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import HomepageFeatures from "@site/src/components/HomepageFeatures";

import styles from "./index.module.css";

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx("hero hero--primary", styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <p className={styles.heroDescription}>
          Revolutionize your enterprise management with our cutting-edge
          platform featuring advanced AI capabilities, real-time collaboration
          tools, and enterprise-grade security.
        </p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/intro"
          >
            Explore Documentation
          </Link>
          <Link className={styles.demoButton} to="/docs/video/project-video">
            <span className={styles.demoButtonIcon}>▶</span> Watch Demo
          </Link>
        </div>
      </div>
    </header>
  );
}

function HomepageHighlights() {
  return (
    <section className={styles.highlights}>
      <div className="container">
        <div className="row">
          <div className="col col--4">
            <div className={styles.highlightCard}>
              <h3>Enterprise-Grade Security</h3>
              <p>
                Multi-layered encryption with dynamically generated keys for
                tokens and TOTP secrets
              </p>
            </div>
          </div>
          <div className="col col--4">
            <div className={styles.highlightCard}>
              <h3>Real-time Collaboration</h3>
              <p>
                WebSocket-based messaging system for instant team communication
              </p>
            </div>
          </div>
          <div className="col col--4">
            <div className={styles.highlightCard}>
              <h3>AI Productivity Assistants</h3>
              <p>Intelligent virtual assistants to automate routine tasks</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HomepageTestimonial() {
  return (
    <section className={styles.testimonial}>
      <div className="container">
        <div className={styles.testimonialInner}>
          <h2>My Vision for Enterprise Solutions</h2>
          <blockquote>
            Enterprise Nexus represents my approach to modern business
            challenges. By integrating advanced AI capabilities with
            enterprise-grade security, I've designed a platform that prioritizes
            both innovation and data protection. This project showcases my
            skills in full-stack development and my passion for creating
            solutions that make a real difference.
          </blockquote>
          <p className={styles.testimonialAuthor}>
            — Tu Phung, Full-Stack Developer
          </p>
        </div>
      </div>
    </section>
  );
}

function HomepageCTA() {
  return (
    <section className={styles.cta}>
      <div className="container">
        <h2>Explore My Technical Expertise</h2>
        <p>
          Dive into the documentation to see how I've implemented advanced
          features and architectural patterns in this full-stack project.
        </p>
        <div className={styles.ctaButtons}>
          <Link className="button button--primary button--lg" to="/docs/intro">
            Documentation
          </Link>
          <Link
            className="button button--outline button--lg"
            to="https://github.com/TuPhung369/Haaga_Backend_Programming"
            style={{ marginLeft: "15px" }}
          >
            Discover on GitHub
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`Welcome to ${siteConfig.title}`}
      description="Enterprise Nexus - A cutting-edge enterprise management platform featuring advanced AI capabilities, real-time collaboration tools, and enterprise-grade security."
    >
      <HomepageHeader />
      <main>
        <HomepageHighlights />
        <HomepageFeatures />
        <HomepageTestimonial />
        <HomepageCTA />
      </main>
    </Layout>
  );
}

