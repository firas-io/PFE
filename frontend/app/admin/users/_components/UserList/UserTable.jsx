'use client';
import React from 'react';

import { userDepartment, userFirstName, userLastName } from '@/lib/userDisplay';
import { Actions } from './Actions/Actions';

export const UserTable = ({ users, roles, onRefetch, readOnly = false }) => {
  const colCount = readOnly ? 5 : 6;

  if (users.length === 0) {
    return (
      <div className="adm-empty">
        <div className="adm-empty-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <p>Aucun utilisateur trouvé.</p>
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
                <th>Rôle</th>
                <th>Statut</th>
                {!readOnly && <th style={{ width: 1 }} />}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div className="fw-medium">{userFirstName(u)} {userLastName(u)}</div>
                  </td>
                  <td className="text-secondary">{u.email}</td>
                  <td>{userDepartment(u) || <span className="text-secondary">—</span>}</td>
                  <td>{u.role?.nom || <span className="text-secondary">—</span>}</td>
                  <td>
                    {u.isActive
                      ? <span className="adm-status adm-status--active">Actif</span>
                      : <span className="adm-status adm-status--inactive">Désactivé</span>}
                  </td>
                  {!readOnly && (
                    <td><Actions user={u} roles={roles} onRefetch={onRefetch} /></td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Mobile : cards ── */}
      <div className="d-md-none" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {users.map((u) => (
          <div key={u._id} className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <div className="fw-semibold">{userFirstName(u)} {userLastName(u)}</div>
                  <div className="text-secondary" style={{ fontSize: 12 }}>{u.email}</div>
                </div>
                {u.isActive
                  ? <span className="adm-status adm-status--active">Actif</span>
                  : <span className="adm-status adm-status--inactive">Désactivé</span>}
              </div>
              <div className="d-flex flex-wrap gap-2 mb-2">
                {userDepartment(u) && <span style={{ fontSize: 12, color: '#64748B' }}>{userDepartment(u)}</span>}
                {u.role?.nom && (
                  <span className="adm-status adm-status--review">{u.role.nom}</span>
                )}
              </div>
              {!readOnly && (
                <div className="mt-2">
                  <Actions user={u} roles={roles} onRefetch={onRefetch} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
