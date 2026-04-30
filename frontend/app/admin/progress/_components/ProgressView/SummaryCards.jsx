'use client';
import React from 'react';

export const SummaryCards = ({ summary }) => {
  return (
    <div className="adm-kpi">
      <div className="adm-kpi-card adm-kpi-card--rate">
        <div className="adm-kpi-row">
          <p className="adm-kpi-label">Taux global</p>
          <div className="adm-kpi-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
        </div>
        <p className="adm-kpi-value">
          {summary?.completion_rate ?? 0}
          <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#94A3B8' }}> %</span>
        </p>
        <p className="adm-kpi-sub">{summary?.completed_logs ?? 0} complétions</p>
      </div>

      <div className="adm-kpi-card adm-kpi-card--habits">
        <div className="adm-kpi-row">
          <p className="adm-kpi-label">Aujourd&apos;hui</p>
          <div className="adm-kpi-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
        </div>
        <p className="adm-kpi-value">
          {summary?.today_rate ?? 0}
          <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#94A3B8' }}> %</span>
        </p>
        <p className="adm-kpi-sub">{summary?.today_completed ?? 0}/{summary?.today_logs ?? 0} logs</p>
      </div>

      <div className="adm-kpi-card adm-kpi-card--users">
        <div className="adm-kpi-row">
          <p className="adm-kpi-label">Habitudes actives</p>
          <div className="adm-kpi-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
          </div>
        </div>
        <p className="adm-kpi-value">{summary?.active_habits ?? 0}</p>
        <p className="adm-kpi-sub">sur {summary?.total_habits ?? 0} habitudes</p>
      </div>

      <div className="adm-kpi-card adm-kpi-card--logs">
        <div className="adm-kpi-row">
          <p className="adm-kpi-label">Logs totaux</p>
          <div className="adm-kpi-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
        </div>
        <p className="adm-kpi-value">{summary?.total_logs ?? 0}</p>
        <p className="adm-kpi-sub">dont {summary?.partial_logs ?? 0} partiels</p>
      </div>
    </div>
  );
};
