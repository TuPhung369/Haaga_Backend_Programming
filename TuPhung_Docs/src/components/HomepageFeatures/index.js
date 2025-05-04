import React, { useState } from "react";
import clsx from "clsx";
import styles from "./styles.module.css";

// Import icons from react-icons
import {
  FaShieldAlt,
  FaGoogle,
  FaFacebook,
  FaGithub,
  FaLock,
  FaTasks,
  FaChartLine,
  FaUsers,
  FaExchangeAlt,
  FaMicrophone,
  FaBrain,
  FaRobot,
  FaLanguage,
  FaComments,
} from "react-icons/fa";
import {
  SiReact,
  SiTypescript,
  SiRedux,
  SiAntdesign,
  SiTailwindcss,
  SiSpring,
  SiSpringboot,
  SiJsonwebtokens,
  SiSocketdotio, // Changed from SiWebsocket which doesn't exist
  SiPostgresql,
  SiHibernate,
  SiOpenai,
} from "react-icons/si";
import { BsKanban, BsArrowsMove } from "react-icons/bs";
import { IoIosRocket } from "react-icons/io";
import { MdSecurity, MdUpdate } from "react-icons/md";
import { GiArtificialIntelligence } from "react-icons/gi";

const FeatureList = [
  {
    title: "Multi-factor Authentication",
    FeatureIcon: (props) => <FaShieldAlt {...props} />,
    description: (
      <>
        Secure your enterprise with advanced authentication including TOTP with
        replay protection and seamless OAuth2 integration with Google, Facebook,
        and GitHub.
      </>
    ),
    icons: [
      { icon: <FaShieldAlt size={24} />, label: "Advanced Security" },
      { icon: <FaGoogle size={24} />, label: "Google OAuth" },
      { icon: <FaFacebook size={24} />, label: "Facebook Login" },
      { icon: <FaGithub size={24} />, label: "GitHub Integration" },
      { icon: <FaLock size={24} />, label: "TOTP Protection" },
    ],
    color: "#4285F4",
  },
  {
    title: "Kanban Task Management",
    FeatureIcon: (props) => <BsKanban {...props} />,
    description: (
      <>
        Streamline project workflows with our intuitive Kanban board featuring
        drag-and-drop functionality, task assignments, and real-time progress
        tracking.
      </>
    ),
    icons: [
      { icon: <BsKanban size={24} />, label: "Kanban Boards" },
      { icon: <BsArrowsMove size={24} />, label: "Drag & Drop" },
      { icon: <FaTasks size={24} />, label: "Task Management" },
      { icon: <FaUsers size={24} />, label: "Team Assignments" },
      { icon: <FaChartLine size={24} />, label: "Progress Tracking" },
    ],
    color: "#34A853",
  },
  {
    title: "Language AI Development",
    FeatureIcon: (props) => <FaBrain {...props} />,
    description: (
      <>
        Enhance communication skills across your organization with our advanced
        speech recognition and processing tools powered by SpeechBrain
        technology.
      </>
    ),
    icons: [
      { icon: <FaMicrophone size={24} />, label: "Speech Recognition" },
      { icon: <FaBrain size={24} />, label: "SpeechBrain" },
      { icon: <FaLanguage size={24} />, label: "Language Processing" },
      { icon: <FaRobot size={24} />, label: "AI Models" },
      { icon: <FaComments size={24} />, label: "Communication Tools" },
    ],
    color: "#FBBC05",
  },
];

const TechStackList = [
  {
    title: "Modern Frontend",
    items: [
      { icon: <SiReact size={20} color="#61DAFB" />, name: "React 18" },
      { icon: <SiTypescript size={20} color="#3178C6" />, name: "TypeScript" },
      { icon: <SiRedux size={20} color="#764ABC" />, name: "Redux Toolkit" },
      { icon: <SiAntdesign size={20} color="#0170FE" />, name: "Ant Design" },
      {
        icon: <SiTailwindcss size={20} color="#06B6D4" />,
        name: "TailwindCSS",
      },
    ],
    color: "#61DAFB",
    gradient: "linear-gradient(135deg, #61DAFB20 0%, #3178C620 100%)",
  },
  {
    title: "Robust Backend",
    items: [
      { icon: <SiSpringboot size={20} color="#6DB33F" />, name: "Spring Boot" },
      { icon: <SiSpring size={20} color="#6DB33F" />, name: "Spring Security" },
      { icon: <SiSpring size={20} color="#6DB33F" />, name: "Spring Data JPA" },
      {
        icon: <SiJsonwebtokens size={20} color="#000000" />,
        name: "JWT Authentication",
      },
      { icon: <SiSocketdotio size={20} color="#010101" />, name: "WebSockets" },
    ],
    color: "#6DB33F",
    gradient: "linear-gradient(135deg, #6DB33F20 0%, #00000020 100%)",
  },
  {
    title: "Advanced Technologies",
    items: [
      { icon: <FaBrain size={20} color="#FF5A5F" />, name: "SpeechBrain" },
      { icon: <SiHibernate size={20} color="#59666C" />, name: "Hibernate" },
      { icon: <SiPostgresql size={20} color="#336791" />, name: "PostgreSQL" },
      {
        icon: <MdUpdate size={20} color="#FF9900" />,
        name: "Real-time Communication",
      },
      {
        icon: <GiArtificialIntelligence size={20} color="#00C7B7" />,
        name: "AI Processing",
      },
    ],
    color: "#FF5A5F",
    gradient: "linear-gradient(135deg, #FF5A5F20 0%, #00C7B720 100%)",
  },
];

function Feature({ FeatureIcon, title, description, icons, color }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={styles.homeCol}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={styles.featureCard}
        style={{
          borderColor: isHovered ? color : "transparent",
          boxShadow: isHovered ? `0 10px 30px ${color}20` : "",
        }}
      >
        <div className="text--center padding-horiz--md">
          <h3 style={{ color: color }}>{title}</h3>

          {/* Biểu tượng chính ở giữa */}
          <div className={styles.featureSvg}>
            <FeatureIcon size={120} color={color} />
          </div>

          <p>{description}</p>

          <div className={styles.featureIconsContainer}>
            {icons.map((iconItem, idx) => (
              <div key={idx} className={styles.featureIconItem}>
                <div className={styles.featureIcon} style={{ color: color }}>
                  {iconItem.icon}
                </div>
                <div className={styles.featureIconLabel}>{iconItem.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TechStack({ title, items, color, gradient }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={styles.homeCol}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={styles.techStackCard}
        style={{
          borderColor: isHovered ? color : "transparent",
          background: isHovered ? gradient : "",
          transform: isHovered ? "translateY(-10px)" : "",
        }}
      >
        <h3 style={{ color: color }}>{title}</h3>
        <ul className={styles.techList}>
          {items.map((item, idx) => (
            <li key={idx} className={styles.techItem}>
              <div className={styles.techIcon}>{item.icon}</div>
              <div className={styles.techName}>{item.name}</div>
            </li>
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
        <div className={styles.homeContainer}>
          <div className={styles.sectionTitle}>
            <h2>Key Features</h2>
            <p>
              Discover what makes Enterprise Nexus the ultimate solution for
              modern enterprises
            </p>
            <div className={styles.titleUnderline}></div>
          </div>
          <div className={styles.homeRow}>
            {FeatureList.map((props, idx) => (
              <Feature key={idx} {...props} />
            ))}
          </div>
        </div>
      </section>

      <section className={styles.techStack}>
        <div className={styles.homeContainer}>
          <div className={styles.sectionTitle}>
            <h2>Cutting-Edge Technology Stack</h2>
            <p>
              Built with the latest technologies to ensure performance,
              security, and scalability
            </p>
            <div className={styles.titleUnderline}></div>
          </div>
          <div className={styles.homeRow}>
            {TechStackList.map((props, idx) => (
              <TechStack key={idx} {...props} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

