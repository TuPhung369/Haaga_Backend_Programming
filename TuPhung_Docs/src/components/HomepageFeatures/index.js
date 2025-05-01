import React from "react";
import clsx from "clsx";
import styles from "./styles.module.css";

const FeatureList = [
  {
    title: "Multi-factor Authentication",
    Svg: require("@site/static/img/undraw_docusaurus_mountain.svg").default,
    description: (
      <>
        Secure your enterprise with advanced authentication including TOTP with
        replay protection and seamless OAuth2 integration with Google, Facebook,
        and GitHub.
      </>
    ),
  },
  {
    title: "Kanban Task Management",
    Svg: require("@site/static/img/undraw_docusaurus_tree.svg").default,
    description: (
      <>
        Streamline project workflows with our intuitive Kanban board featuring
        drag-and-drop functionality, task assignments, and real-time progress
        tracking.
      </>
    ),
  },
  {
    title: "Language AI Development",
    Svg: require("@site/static/img/undraw_docusaurus_react.svg").default,
    description: (
      <>
        Enhance communication skills across your organization with our advanced
        speech recognition and processing tools powered by SpeechBrain
        technology.
      </>
    ),
  },
];

const TechStackList = [
  {
    title: "Modern Frontend",
    items: [
      "React 18",
      "TypeScript",
      "Redux Toolkit",
      "Ant Design",
      "TailwindCSS",
    ],
  },
  {
    title: "Robust Backend",
    items: [
      "Spring Boot",
      "Spring Security",
      "Spring Data JPA",
      "JWT Authentication",
      "WebSockets",
    ],
  },
  {
    title: "Advanced Technologies",
    items: [
      "SpeechBrain",
      "Hibernate",
      "PostgreSQL",
      "Real-time Communication",
      "AI Processing",
    ],
  },
];

function Feature({ Svg, title, description }) {
  return (
    <div className={clsx("col col--4")}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

function TechStack({ title, items }) {
  return (
    <div className={clsx("col col--4")}>
      <div className={styles.techStackCard}>
        <h3>{title}</h3>
        <ul className={styles.techList}>
          {items.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <>
      <section className={styles.features}>
        <div className="container">
          <div className={styles.sectionTitle}>
            <h2>Key Features</h2>
            <p>
              Discover what makes Enterprise Nexus the ultimate solution for
              modern enterprises
            </p>
          </div>
          <div className="row">
            {FeatureList.map((props, idx) => (
              <Feature key={idx} {...props} />
            ))}
          </div>
        </div>
      </section>

      <section className={styles.techStack}>
        <div className="container">
          <div className={styles.sectionTitle}>
            <h2>Cutting-Edge Technology Stack</h2>
            <p>
              Built with the latest technologies to ensure performance,
              security, and scalability
            </p>
          </div>
          <div className="row">
            {TechStackList.map((props, idx) => (
              <TechStack key={idx} {...props} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

