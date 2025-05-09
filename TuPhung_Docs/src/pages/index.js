import React from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import HomepageFeatures from "@site/src/components/HomepageFeatures";
import HomepageStats from "@site/src/components/HomepageStats";
import HomepageDemo from "@site/src/components/HomepageDemo";
import HomepageSecurity from "@site/src/components/HomepageSecurity";

import styles from "./index.module.css";

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  const [isVisible, setIsVisible] = React.useState(false);
  const [displayText, setDisplayText] = React.useState("");
  const [isTypingComplete, setIsTypingComplete] = React.useState(false);
  const [showSubtitle, setShowSubtitle] = React.useState(false);
  const [showDescription, setShowDescription] = React.useState(false);

  // Text to be typed
  const fullText = siteConfig.title;

  React.useEffect(() => {
    // Trigger animation after component mounts
    setIsVisible(true);

    // Typewriter effect
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < fullText.length) {
        setDisplayText(fullText.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typingInterval);
        setIsTypingComplete(true);

        // Show subtitle after typing is complete with a delay
        setTimeout(() => {
          setShowSubtitle(true);

          // Show description after subtitle appears
          setTimeout(() => {
            setShowDescription(true);
          }, 500);
        }, 300);
      }
    }, 100); // Adjust typing speed here

    // Optional: Add scroll animation for background parallax effect
    const handleScroll = () => {
      const header = document.querySelector(`.${styles.heroBanner}`);
      if (header) {
        const scrollPosition = window.scrollY;
        header.style.backgroundPositionY = `${scrollPosition * 0.5}px`;
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearInterval(typingInterval);
    };
  }, [fullText]);

  return (
    <header
      className={clsx(
        "hero hero--primary",
        styles.heroBanner,
        isVisible && styles.visible
      )}
    >
      <div className={clsx("container", styles.homeContainer)}>
        <div className={styles.heroContent}>
          <div className={styles.heroTextContent}>
            <h1 className={clsx("hero__title", styles.typewriter)}>
              {displayText}
              {!isTypingComplete && <span className={styles.cursor}></span>}
            </h1>
            <p
              className={clsx(
                "hero__subtitle",
                styles.fadeIn,
                showSubtitle && styles.visible
              )}
            >
              {siteConfig.tagline}
            </p>
            <p
              className={clsx(
                styles.heroDescription,
                styles.fadeIn,
                showDescription && styles.visible
              )}
            >
              <span className={styles.highlightText}>Revolutionize</span> your
              enterprise management with our cutting-edge platform featuring{" "}
              <span className={styles.highlightText}>
                advanced AI capabilities
              </span>
              , real-time collaboration tools, and{" "}
              <span className={styles.highlightText}>
                enterprise-grade security
              </span>
              .
            </p>
            <div
              className={clsx(
                styles.buttons,
                styles.fadeIn,
                showDescription && styles.visible
              )}
            >
              <Link
                className={styles.primaryButton}
                to="/docs/intro"
                aria-label="Explore Documentation"
              >
                <span className={styles.buttonText}>Explore Documentation</span>
                <span className={styles.buttonIcon}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path
                      fillRule="evenodd"
                      d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"
                    />
                  </svg>
                </span>
              </Link>
              <Link
                className={styles.demoButton}
                to="/docs/video/project-video"
                aria-label="Watch Demo Video"
              >
                <span className={styles.demoButtonIcon}></span>
                <span className={styles.buttonText}>Watch Demo</span>
              </Link>
            </div>
          </div>
          {/* Image section removed */}
        </div>


      </div>

      <div className={styles.heroWave}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
          <path
            fill="#ffffff"
            fillOpacity="0.05"
            d="M0,288L48,272C96,256,192,224,288,197.3C384,171,480,149,576,165.3C672,181,768,235,864,250.7C960,267,1056,245,1152,224C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          ></path>
        </svg>
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M8 0c-.69 0-1.843.265-2.928.56-1.11.3-2.229.655-2.887.87a1.54 1.54 0 0 0-1.044 1.262c-.596 4.477.787 7.795 2.465 9.99a11.8 11.8 0 0 0 2.517 2.453c.386.273.744.482 1.048.625.28.132.581.24.829.24s.548-.108.829-.24a7 7 0 0 0 1.048-.625 11.8 11.8 0 0 0 2.517-2.453c1.678-2.195 3.061-5.513 2.465-9.99a1.54 1.54 0 0 0-1.044-1.263 62.5 62.5 0 0 0-2.887-.87C9.843.266 8.69 0 8 0m0 5a1.5 1.5 0 0 1 .5 2.915l.385 1.99a.5.5 0 0 1-.491.595h-.788a.5.5 0 0 1-.49-.595l.384-1.99A1.5 1.5 0 0 1 8 5" />
                </svg>
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M16 8c0 3.866-3.582 7-8 7a9 9 0 0 1-2.347-.306c-.584.296-1.925.864-4.181 1.234-.2.032-.352-.176-.273-.362.354-.836.674-1.95.77-2.966C.744 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7M5 8a1 1 0 1 0-2 0 1 1 0 0 0 2 0m4 0a1 1 0 1 0-2 0 1 1 0 0 0 2 0m3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2" />
                </svg>
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M6 12.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5M3 8.062C3 6.76 4.235 5.765 5.53 5.886a26.6 26.6 0 0 0 4.94 0C11.765 5.765 13 6.76 13 8.062v1.157a.93.93 0 0 1-.765.935c-.845.147-2.34.346-4.235.346s-3.39-.2-4.235-.346A.93.93 0 0 1 3 9.219zm4.542-.827a.25.25 0 0 0-.217.068l-.92.9a24.8 24.8 0 0 1-1.871-.183.25.25 0 0 0-.068.495c.55.076 1.232.149 2.02.193a.25.25 0 0 0 .189-.071l.754-.736.847 1.71a.25.25 0 0 0 .404.062l.932-.97a25 25 0 0 0 1.922-.188.25.25 0 0 0-.068-.495c-.538.074-1.207.145-1.98.189a.25.25 0 0 0-.166.076l-.754.785-.842-1.7a.25.25 0 0 0-.182-.135" />
                  <path d="M8.5 1.866a1 1 0 1 0-1 0V3h-2A4.5 4.5 0 0 0 1 7.5V8a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1v1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1v-.5A4.5 4.5 0 0 0 10.5 3h-2zM14 7.5V13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.5A3.5 3.5 0 0 1 5.5 4h5A3.5 3.5 0 0 1 14 7.5" />
                </svg>
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
        <HomepageHeader />
        <main>
          <HomepageHighlights />
          <HomepageFeatures />
          <HomepageStats />
          <HomepageDemo />
          <HomepageSecurity />
          <HomepageTestimonial />
          <HomepageCTA />
        </main>
      </div>
    </Layout>
  );
}

