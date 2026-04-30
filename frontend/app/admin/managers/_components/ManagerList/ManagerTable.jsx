'use client';
import React from 'react';

import { userDepartment, userFirstName, userLastName } from '@/lib/userDisplay';
import { Actions } from './Actions/Actions';

export const ManagerTable = ({ managers, onRefetch }) => {
  if (managers.length === 0) {
    return (
      <div className="adm-empty">
        <div className="adm-empty-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <p>Aucun manager trouvé.</p>
      </div>
    );
  }

  return (
    <>
      {/* ── Desktop ── */}
      <div className="card d-none d-md-block">
        <div className="table-responsive">
          <table className="table card-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Département</th>
                <th>Statut</th>
                <th style={{ width: 1 }} />
              </tr>
            </thead>
            <tbody>
              {managers.map((m) => (
                <tr key={m._id}>
                  <td><div className="fw-medium">{userFirstName(m)} {userLastName(m)}</div></td>
                  <td className="text-secondary">{m.email}</td>
                  <td>{userDepartment(m) || <span className="text-secondary">—</span>}</td>
                  <td>
                    {m.isActive
                      ? <span className="adm-status adm-status--active">Actif</span>
                      : <span className="adm-status adm-status--inactive">Désactivé</span>}
                  </td>
                  <td><Actions manager={m} onRefetch={onRefetch} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Mobile ── */}
      <div className="d-md-none" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {managers.map((m) => (
          <div key={m._id} className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <div className="fw-semibold">{userFirstName(m)} {userLastName(m)}</div>
                  <div className="text-secondary" style={{ fontSize: 12 }}>{m.email}</div>
                </div>
                {m.isActive
                  ? <span className="adm-status adm-status--active">Actif</span>
                  : <span className="adm-status adm-status--inactive">Désactivé</span>}
              </div>
              {userDepartment(m) && <div className="text-secondary mb-2" style={{ fontSize: 12 }}>{userDepartment(m)}</div>}
              <Actions manager={m} onRefetch={onRefetch} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
