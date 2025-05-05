import React, { useState } from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';
import Link from '@docusaurus/Link';

export default function HomepageDemo() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 4a.5.5 0 0 1 .5.5V6a.5.5 0 0 1-1 0V4.5A.5.5 0 0 1 8 4M3 8a5 5 0 1 1 10 0A5 5 0 0 1 3 8"/>
        <path d="M8 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2"/>
      </svg>
    ) },
    { id: 'analytics', label: 'Analytics', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
        <path d="M4 11a1 1 0 1 1 2 0v1a1 1 0 1 1-2 0zm6-4a1 1 0 1 1 2 0v5a1 1 0 1 1-2 0zM7 9a1 1 0 0 1 2 0v3a1 1 0 1 1-2 0z"/>
        <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z"/>
        <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0z"/>
      </svg>
    ) },
    { id: 'security', label: 'Security', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2m3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2M5 8h6a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1"/>
      </svg>
    ) },
  ];
  
  const getTabContent = (tabId) => {
    switch(tabId) {
      case 'dashboard':
        return (
          <div className={styles.tabContent}>
            <div className={styles.demoImageContainer}>
              <img 
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
                alt="Enterprise Nexus Dashboard" 
                className={styles.demoImage}
              />
              <div className={styles.demoOverlay}>
                <div className={styles.demoFeatures}>
                  <div className={styles.demoFeature}>
                    <div className={styles.demoFeatureIcon}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z"/>
                        <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0"/>
                      </svg>
                    </div>
                    <div className={styles.demoFeatureText}>Real-time Updates</div>
                  </div>
                  <div className={styles.demoFeature}>
                    <div className={styles.demoFeatureIcon}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>
                      </svg>
                    </div>
                    <div className={styles.demoFeatureText}>Customizable Widgets</div>
                  </div>
                  <div className={styles.demoFeature}>
                    <div className={styles.demoFeatureIcon}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M11 2a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3zM5 1a4 4 0 0 0-4 4v6a4 4 0 0 0 4 4h6a4 4 0 0 0 4-4V5a4 4 0 0 0-4-4z"/>
                      </svg>
                    </div>
                    <div className={styles.demoFeatureText}>Task Management</div>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.demoDescription}>
              <h3>Intuitive Dashboard</h3>
              <p>
                Get a comprehensive view of your enterprise operations with our intuitive dashboard. 
                Monitor key metrics, track team performance, and manage tasks all from one central location.
              </p>
              <Link to="/docs/features/dashboard" className={styles.demoLink}>
                Learn more about Dashboard features
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className={styles.demoLinkIcon}>
                  <path fillRule="evenodd" d="M4 8a.5.5 0 0 1 .5-.5h5.793L8.146 5.354a.5.5 0 1 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.293 8.5H4.5A.5.5 0 0 1 4 8"/>
                </svg>
              </Link>
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div className={styles.tabContent}>
            <div className={styles.demoImageContainer}>
              <img 
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
                alt="Enterprise Nexus Analytics" 
                className={styles.demoImage}
              />
              <div className={styles.demoOverlay}>
                <div className={styles.demoFeatures}>
                  <div className={styles.demoFeature}>
                    <div className={styles.demoFeatureIcon}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M4 11a1 1 0 1 1 2 0v1a1 1 0 1 1-2 0zm6-4a1 1 0 1 1 2 0v5a1 1 0 1 1-2 0zM7 9a1 1 0 0 1 2 0v3a1 1 0 1 1-2 0z"/>
                        <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z"/>
                        <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0z"/>
                      </svg>
                    </div>
                    <div className={styles.demoFeatureText}>Advanced Reporting</div>
                  </div>
                  <div className={styles.demoFeature}>
                    <div className={styles.demoFeatureIcon}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M0 0h1v15h15v1H0zm10 11.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 0-1 0v2.6l-3.613-4.417a.5.5 0 0 0-.74-.037L7.06 8.233 3.404 3.206a.5.5 0 0 0-.808.588l4 5.5a.5.5 0 0 0 .758.06l2.609-2.61L13.445 11H10.5a.5.5 0 0 0-.5.5"/>
                      </svg>
                    </div>
                    <div className={styles.demoFeatureText}>Predictive Analytics</div>
                  </div>
                  <div className={styles.demoFeature}>
                    <div className={styles.demoFeatureIcon}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.25-11.25v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 1.5 0m0 4v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 1.5 0"/>
                      </svg>
                    </div>
                    <div className={styles.demoFeatureText}>Data Visualization</div>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.demoDescription}>
              <h3>Powerful Analytics</h3>
              <p>
                Transform raw data into actionable insights with our powerful analytics tools. 
                Identify trends, forecast future performance, and make data-driven decisions to optimize your business operations.
              </p>
              <Link to="/docs/features/analytics" className={styles.demoLink}>
                Explore Analytics capabilities
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className={styles.demoLinkIcon}>
                  <path fillRule="evenodd" d="M4 8a.5.5 0 0 1 .5-.5h5.793L8.146 5.354a.5.5 0 1 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.293 8.5H4.5A.5.5 0 0 1 4 8"/>
                </svg>
              </Link>
            </div>
          </div>
        );
      case 'security':
        return (
          <div className={styles.tabContent}>
            <div className={styles.demoImageContainer}>
              <img 
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
                alt="Enterprise Nexus Security" 
                className={styles.demoImage}
              />
              <div className={styles.demoOverlay}>
                <div className={styles.demoFeatures}>
                  <div className={styles.demoFeature}>
                    <div className={styles.demoFeatureIcon}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2m3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2M5 8h6a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1"/>
                      </svg>
                    </div>
                    <div className={styles.demoFeatureText}>Multi-factor Authentication</div>
                  </div>
                  <div className={styles.demoFeature}>
                    <div className={styles.demoFeatureIcon}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 0c-.69 0-1.843.265-2.928.56-1.11.3-2.229.655-2.887.87a1.54 1.54 0 0 0-1.044 1.262c-.596 4.477.787 7.795 2.465 9.99a11.8 11.8 0 0 0 2.517 2.453c.386.273.744.482 1.048.625.28.132.581.24.829.24s.548-.108.829-.24a7 7 0 0 0 1.048-.625 11.8 11.8 0 0 0 2.517-2.453c1.678-2.195 3.061-5.513 2.465-9.99a1.54 1.54 0 0 0-1.044-1.263 62.5 62.5 0 0 0-2.887-.87C9.843.266 8.69 0 8 0m0 5a1.5 1.5 0 0 1 .5 2.915l.385 1.99a.5.5 0 0 1-.491.595h-.788a.5.5 0 0 1-.49-.595l.384-1.99A1.5 1.5 0 0 1 8 5"/>
                      </svg>
                    </div>
                    <div className={styles.demoFeatureText}>End-to-end Encryption</div>
                  </div>
                  <div className={styles.demoFeature}>
                    <div className={styles.demoFeatureIcon}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2m.995-14.901a1 1 0 1 0-1.99 0A5 5 0 0 0 3 6c0 1.098-.5 6-2 7h14c-1.5-1-2-5.902-2-7 0-2.42-1.72-4.44-4.005-4.901"/>
                      </svg>
                    </div>
                    <div className={styles.demoFeatureText}>Threat Detection</div>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.demoDescription}>
              <h3>Enterprise-Grade Security</h3>
              <p>
                Protect your sensitive data with our enterprise-grade security features. 
                From multi-factor authentication to end-to-end encryption, we ensure your information remains secure at all times.
              </p>
              <Link to="/docs/features/security" className={styles.demoLink}>
                Discover our security measures
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className={styles.demoLinkIcon}>
                  <path fillRule="evenodd" d="M4 8a.5.5 0 0 1 .5-.5h5.793L8.146 5.354a.5.5 0 1 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.293 8.5H4.5A.5.5 0 0 1 4 8"/>
                </svg>
              </Link>
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <section className={styles.demoSection}>
      <div className={styles.homeContainer}>
        <div className={styles.sectionTitle}>
          <h2>Experience Enterprise Nexus</h2>
          <p>See how our platform transforms enterprise management</p>
          <div className={styles.titleUnderline}></div>
        </div>
        
        <div className={styles.demoContainer}>
          <div className={styles.demoTabs}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={clsx(styles.demoTab, { [styles.activeTab]: activeTab === tab.id })}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className={styles.demoTabIcon}>{tab.icon}</span>
                <span className={styles.demoTabLabel}>{tab.label}</span>
              </button>
            ))}
          </div>
          
          <div className={styles.demoContentWrapper}>
            {getTabContent(activeTab)}
          </div>
        </div>
      </div>
    </section>
  );
}