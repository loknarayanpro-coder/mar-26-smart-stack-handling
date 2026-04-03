import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const POLL_MS = 90000;

const GlobalStockAlertBanner = () => {
    const [count, setCount] = useState(0);
    const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('lowStockBannerDismissed') === '1');

    const refresh = useCallback(async () => {
        try {
            const res = await api.get('/products/alerts');
            const data = Array.isArray(res.data) ? res.data : [];
            setCount(data.length);
        } catch {
            setCount(0);
        }
    }, []);

    useEffect(() => {
        refresh();
        const id = setInterval(refresh, POLL_MS);
        return () => clearInterval(id);
    }, [refresh]);

    const handleDismiss = () => {
        sessionStorage.setItem('lowStockBannerDismissed', '1');
        setDismissed(true);
    };

    if (count === 0 || dismissed) return null;

    return (
        <div className="global-stock-alert" role="alert">
            <div className="global-stock-alert-inner">
                <span className="global-stock-alert-icon" aria-hidden>⚠️</span>
                <div className="global-stock-alert-text">
                    <strong>{count} product{count !== 1 ? 's' : ''} below stock threshold</strong>
                    <span> Restock soon. Emails go to admins when mail is configured.</span>
                </div>
                <div className="global-stock-alert-actions">
                    <Link to="/inventory?filter=low-stock" className="btn btn-primary btn-sm">
                        View items
                    </Link>
                    <Link to="/alerts" className="btn btn-secondary btn-sm">
                        Settings
                    </Link>
                    <button type="button" className="global-stock-alert-dismiss" onClick={handleDismiss} aria-label="Dismiss alert">
                        ×
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GlobalStockAlertBanner;
