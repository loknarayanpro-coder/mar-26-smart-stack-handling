import React from 'react';
import Sidebar from './Sidebar';
import '../dashboard.css'; // Import new styles
import '../assistant.css';
import SmartAssistant from './SmartAssistant';
import GlobalStockAlertBanner from './GlobalStockAlertBanner';

const Layout = ({ children, role }) => {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    return (
        <div className="app-container">
            {/* Mobile Sidebar Overlay */}
            <div className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>

            {/* Sidebar */}
            <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <Sidebar role={role} onClose={() => setIsSidebarOpen(false)} />
            </div>

            {/* Main Content */}
            <main className="main-content">
                {/* Mobile Header */}
                <div className="mobile-header d-md-none">
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="hamburger-btn">
                        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                    </button>
                    <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Smart Stock</span>
                </div>

                <GlobalStockAlertBanner />

                {children}
            </main>

            <SmartAssistant />
        </div>
    );
};

export default Layout;
