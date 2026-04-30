'use client';
import React from 'react';
import { userDepartment, userFirstName, userLastName } from '@/lib/userDisplay';
import { Actions } from './Actions/Actions';

export const MyUserTable = ({ users, onRefetch }) => {
  if (users.length === 0) {
    return (
      <div className="adm-empty">
        <div className="adm-empty-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        </div>
        <p>Aucun utilisateur dans votre équipe.</p>
      </div>
    );
  }

  return (
    <div className="card">
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
            {users.map((u) => (
              <tr key={u._id}>
                <td><div className="fw-medium">{userFirstName(u)} {userLastName(u)}</div></td>
                <td className="text-secondary">{u.email}</td>
                <td>{userDepartment(u) || <span className="text-secondary">—</span>}</td>
                <td>
                  {u.isActive
                    ? <span className="adm-status adm-status--active">Actif</span>
                    : <span className="adm-status adm-status--inactive">Désactivé</span>}
                </td>
                <td><Actions user={u} onRefetch={onRefetch} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
