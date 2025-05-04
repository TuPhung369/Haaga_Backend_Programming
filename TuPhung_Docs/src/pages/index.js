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
      <div className={clsx("container", styles.homeContainer)}>
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <p className={styles.heroDescription}>
          Revolutionize your enterprise management with our cutting-edge
          platform featuring advanced AI capabilities, real-time collaboration
          tools, and enterprise-grade security.
        </p>
        <div className={styles.buttons}>
          <Link className={styles.primaryButton} to="/docs/intro">
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
      <div className={clsx("container", styles.homeContainer)}>
        <div className={styles.sectionTitle}>
          <h2>Key Highlights</h2>
          <p>Core capabilities that power our enterprise platform</p>
        </div>
        <div className={styles.highlightsGrid}>
          <div className={styles.highlightCardContainer}>
            <div className={styles.highlightCard}>
              <div className={styles.highlightCardIcon}>
                <i className="fa fa-shield-alt"></i>
              </div>
              <h3>Enterprise-Grade Security</h3>
              <p>
                Multi-layered encryption with dynamically generated keys for
                tokens and TOTP secrets
              </p>
            </div>
          </div>
          <div className={styles.highlightCardContainer}>
            <div className={styles.highlightCard}>
              <div className={styles.highlightCardIcon}>
                <i className="fa fa-comments"></i>
              </div>
              <h3>Real-time Collaboration</h3>
              <p>
                WebSocket-based messaging system for instant team communication
              </p>
            </div>
          </div>
          <div className={styles.highlightCardContainer}>
            <div className={styles.highlightCard}>
              <div className={styles.highlightCardIcon}>
                <i className="fa fa-robot"></i>
              </div>
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
      <div className={clsx("container", styles.homeContainer)}>
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
      <div className={clsx("container", styles.homeContainer)}>
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
      <div className={styles.pageWrapper}>
        <div className={styles.pageWrapper}>
        <HomepageHeader />
          <main>
            <HomepageHighlights />
            <HomepageFeatures />
            <HomepageTestimonial />
            <HomepageCTA />
          </main>
      </div>
      </div>
    </Layout>
  );
}

