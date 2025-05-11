import React, { useState, useEffect, useRef } from "react";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import styles from "./category.module.css";

// Import backend document data
const backendDocs = [
  {
    title: "Structure",
    description: "Overview of the backend project structure",
    link: "/docs/backend/structure",
    icon: "🏗️",
    status: "stable",
    lastUpdated: "3W ago",
    category: "Core",
  },
  {
    title: "API",
    description: "API endpoints and documentation",
    link: "/docs/backend/api",
    icon: "🔌",
    status: "updated",
    lastUpdated: "1W ago",
    category: "Integration",
  },
  {
    title: "Authentication",
    description: "User authentication and authorization",
    link: "/docs/backend/auth",
    icon: "🔐",
    status: "stable",
    lastUpdated: "1W ago",
    category: "Security",
  },
  {
    title: "Database",
    description: "Database schema and data management",
    link: "/docs/backend/database",
    icon: "💾",
    status: "updated",
    lastUpdated: "2W ago",
    category: "Data",
  },
  {
    title: "User Management",
    description: "User data and profile management",
    link: "/docs/backend/user-management",
    icon: "👫",
    status: "stable",
    lastUpdated: "2W ago",
    category: "Core",
  },
  {
    title: "WebSockets",
    description: "Real-time communication implementation",
    link: "/docs/backend/websockets",
    icon: "🔄",
    status: "stable",
    lastUpdated: "4D ago",
    category: "Integration",
  },
  {
    title: "Exception Handling",
    description: "Error handling and exception management",
    link: "/docs/backend/exception-handling",
    icon: "⚠️",
    status: "stable",
    lastUpdated: "3W ago",
    category: "Core",
  },
  {
    title: "Speech Processing",
    description: "Speech recognition and processing features",
    link: "/docs/backend/speech-processing",
    icon: "🎤",
    status: "new",
    lastUpdated: "2D ago",
    category: "Features",
  },
];

// Group docs by category
const groupedDocs = backendDocs.reduce((acc, doc) => {
  if (!acc[doc.category]) {
    acc[doc.category] = [];
  }
  acc[doc.category].push(doc);
  return acc;
}, {});

// Backend stats for visual display
const backendStats = [
  { label: "API Endpoints", value: "120+", icon: "🔌" },
  { label: "Microservices", value: "8", icon: "🧩" },
  { label: "Database Tables", value: "45", icon: "💾" },
  { label: "Avg Response Time", value: "85ms", icon: "⚡" },
];

// API health status
const apiHealthStatus = [
  { name: "Authentication API", status: "operational", uptime: "99.9%" },
  { name: "User API", status: "operational", uptime: "100%" },
  { name: "Data API", status: "operational", uptime: "99.8%" },
  { name: "WebSocket Service", status: "operational", uptime: "99.7%" },
];

function DocCard({ title, description, link, icon }) {
  return (
    <div className={styles.docCard}>
      <div className={styles.docCardIcon}>{icon}</div>
      <div className={styles.docCardContent}>
        <h3 className={styles.docCardTitle}>
          <Link to={link}>{title}</Link>
        </h3>
        <p className={styles.docCardDescription}>{description}</p>
      </div>
    </div>
  );
}

function DocItem({
  title,
  description,
  link,
  icon,
  category,
  status,
  lastUpdated,
}) {
  return (
    <tr className={styles.docItem}>
      <td className={styles.docTitleCell}>
        <div className={styles.docTitleWrapper}>
          <div className={styles.docIcon}>{icon}</div>
          <Link to={link} className={styles.docTitle}>
            {title}
          </Link>
        </div>
        <p className={styles.docDescription}>{description}</p>
      </td>
      <td className={styles.docCategoryCell}>
        <span className={styles.docCategory}>{category}</span>
      </td>
      <td className={styles.docStatusCell}>
        <span
          className={`${styles.docStatus} ${
            styles[`status${status.charAt(0).toUpperCase() + status.slice(1)}`]
          }`}
        >
          {status}
        </span>
      </td>
    </tr>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon}>{icon}</div>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}

function ApiStatusItem({ name, status, uptime }) {
  return (
    <div className={styles.apiStatusItem}>
      <div className={styles.apiStatusName}>{name}</div>
      <div className={styles.apiStatusIndicator}>
        <span className={`${styles.statusDot} ${styles[status]}`}></span>
        <span className={styles.apiStatusText}>{status}</span>
      </div>
      <div className={styles.apiStatusUptime}>{uptime}</div>
    </div>
  );
}

export default function BackendCategory() {
  const { siteConfig } = useDocusaurusContext();
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [columnFilters, setColumnFilters] = useState({
    category: null,
    status: null,
    lastUpdated: null,
  });
  const [activeFilterDropdown, setActiveFilterDropdown] = useState(null);
  const dropdownRef = useRef(null);

  // Reset sort config on component mount
  useEffect(() => {
    setSortConfig({ key: null, direction: "asc" });
    console.log("Component mounted, reset sortConfig");
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveFilterDropdown(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  // Handle sorting
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key) {
      if (sortConfig.direction === "asc") {
        direction = "desc";
      } else {
        // If already desc, clicking again will remove sorting
        setSortConfig({ key: null, direction: "asc" });
        return;
      }
    }
    setSortConfig({ key, direction });

    // Log the current sort config for debugging
    console.log("Sort Config:", { key, direction });
  };

  // Get sorted and filtered docs
  const getSortedAndFilteredDocs = () => {
    // First apply search and category filter
    let filtered = backendDocs.filter((doc) => {
      const matchesSearch =
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMainFilter =
        activeFilter === "All" || doc.category === activeFilter;

      // Apply column filters
      const matchesCategoryFilter =
        !columnFilters.category || doc.category === columnFilters.category;
      const matchesStatusFilter =
        !columnFilters.status || doc.status === columnFilters.status;

      return (
        matchesSearch &&
        matchesMainFilter &&
        matchesCategoryFilter &&
        matchesStatusFilter
      );
    });

    // Then sort if needed
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  };

  const filteredDocs = getSortedAndFilteredDocs();

  // Get unique categories for filter
  const categories = ["All", ...Object.keys(groupedDocs)];

  // Get unique statuses for filter
  const statuses = [...new Set(backendDocs.map((doc) => doc.status))];

  // Toggle filter dropdown
  const toggleFilterDropdown = (column) => {
    setActiveFilterDropdown(activeFilterDropdown === column ? null : column);
  };

  // Apply column filter
  const applyColumnFilter = (column, value) => {
    setColumnFilters({
      ...columnFilters,
      [column]: value === columnFilters[column] ? null : value,
    });
  };

  return (
    <Layout
      title="Backend Documentation"
      description="Enterprise Nexus Backend Documentation"
    >
      <div className={styles.dashboardPage}>
        <div className={styles.dashboardMain}>
          <div className={styles.dashboardHeader}>
            <h1 className={styles.dashboardTitle}>
              <span className={styles.headerIcon}>⚙️</span>
              Backend Documentation
            </h1>
          </div>

          <div className={styles.dashboardContent}>
            {/* Content header removed as requested */}

            <div className={styles.techStackContainer}>
              <div className={styles.techStackTitle}>Tech Stack</div>
              <div className={styles.techStackTags}>
                <span className={styles.techStackTag}>
                  <span style={{ marginRight: "8px" }}>🍃</span>
                  Springboot
                </span>
                <span className={styles.techStackTag}>
                  <span style={{ marginRight: "8px" }}>⚡</span>
                  FastAPI
                </span>
                <span className={styles.techStackTag}>
                  <span style={{ marginRight: "8px" }}>🔄</span>
                  n8n
                </span>
                <span className={styles.techStackTag}>
                  <span style={{ marginRight: "8px" }}>🔌</span>
                  WebSockets
                </span>
                <span className={styles.techStackTag}>
                  <span style={{ marginRight: "8px" }}>💾</span>
                  MySQL
                </span>
              </div>
            </div>

            <div className={styles.statsGrid}>
              {backendStats.map((stat, idx) => (
                <StatCard key={idx} {...stat} />
              ))}
            </div>

            <div className={styles.docsTable}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>
                      <div
                        className={styles.columnHeader}
                        onClick={() => handleSort("title")}
                        data-sorted={sortConfig.key === "title"}
                      >
                        Document
                        <span className={styles.columnIcon}>
                          {sortConfig.direction === "asc" ? "↑" : "↓"}
                        </span>
                      </div>
                    </th>
                    <th width="150">
                      <div className={styles.columnFilterContainer}>
                        <div
                          className={styles.columnHeader}
                          onClick={() => handleSort("category")}
                          data-sorted={sortConfig.key === "category"}
                        >
                          Category
                          <span className={styles.columnIcon}>
                            {sortConfig.direction === "asc" ? "↑" : "↓"}
                          </span>
                        </div>
                        {activeFilterDropdown === "category" && (
                          <div
                            className={styles.columnFilterDropdown}
                            ref={dropdownRef}
                          >
                            <input
                              type="text"
                              placeholder="Search categories..."
                              className={styles.filterSearch}
                              onClick={(e) => e.stopPropagation()}
                            />
                            {Object.keys(groupedDocs).map((category) => (
                              <div
                                key={category}
                                className={`${styles.filterOption} ${
                                  columnFilters.category === category
                                    ? styles.filterOptionActive
                                    : ""
                                }`}
                                onClick={() =>
                                  applyColumnFilter("category", category)
                                }
                              >
                                {category}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </th>
                    <th width="120">
                      <div className={styles.columnFilterContainer}>
                        <div
                          className={styles.columnHeader}
                          onClick={() => handleSort("status")}
                          data-sorted={sortConfig.key === "status"}
                        >
                          Status
                          <span className={styles.columnIcon}>
                            {sortConfig.direction === "asc" ? "↑" : "↓"}
                          </span>
                        </div>
                        {activeFilterDropdown === "status" && (
                          <div
                            className={styles.columnFilterDropdown}
                            ref={dropdownRef}
                          >
                            {statuses.map((status) => (
                              <div
                                key={status}
                                className={`${styles.filterOption} ${
                                  columnFilters.status === status
                                    ? styles.filterOptionActive
                                    : ""
                                }`}
                                onClick={() =>
                                  applyColumnFilter("status", status)
                                }
                              >
                                {status}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocs.map((doc, idx) => (
                    <DocItem key={idx} {...doc} />
                  ))}
                </tbody>
              </table>

              {filteredDocs.length === 0 && (
                <div className={styles.noResults}>
                  <div className={styles.noResultsIcon}>🔍</div>
                  <h3 className={styles.noResultsTitle}>No documents found</h3>
                  <p className={styles.noResultsText}>
                    Try adjusting your search or filter to find what you're
                    looking for.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

