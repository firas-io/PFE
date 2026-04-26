'use client';
import React from 'react';

export const SummaryCards = ({ summary }) => (
  <div className="row g-3 mb-3">
    <div className="col-md-3">
      <div className="card h-100">
        <div className="card-body">
          <div className="text-secondary small">Taux global</div>
          <div className="h2 mb-1">{summary?.completion_rate ?? 0}%</div>
          <div className="text-secondary small">{summary?.completed_logs ?? 0} complétions</div>
        </div>
      </div>
    </div>
    <div className="col-md-3">
      <div className="card h-100">
        <div className="card-body">
          <div className="text-secondary small">Aujourd'hui</div>
          <div className="h2 mb-1">{summary?.today_rate ?? 0}%</div>
          <div className="text-secondary small">
            {summary?.today_completed ?? 0}/{summary?.today_logs ?? 0} logs
          </div>
        </div>
      </div>
    </div>
    <div className="col-md-3">
      <div className="card h-100">
        <div className="card-body">
          <div className="text-secondary small">Habitudes actives</div>
          <div className="h2 mb-1">{summary?.active_habits ?? 0}</div>
          <div className="text-secondary small">sur {summary?.total_habits ?? 0} habitudes</div>
        </div>
      </div>
    </div>
    <div className="col-md-3">
      <div className="card h-100">
        <div className="card-body">
          <div className="text-secondary small">Logs totaux</div>
          <div className="h2 mb-1">{summary?.total_logs ?? 0}</div>
          <div className="text-secondary small">dont {summary?.partial_logs ?? 0} partiels</div>
        </div>
      </div>
    </div>
  </div>
);
