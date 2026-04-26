'use client';
import React from 'react';

import { userDepartment, userFirstName, userLastName } from '@/lib/userDisplay';
import { Actions } from './Actions/Actions';

export const UserTable = ({ users, roles, onRefetch, readOnly = false }) => {
  const colCount = readOnly ? 5 : 6;
  return (
    <div className="card">
      <div className="table-responsive">
        <table className="table table-vcenter card-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Département</th>
              <th>Rôle</th>
              <th>Statut</th>
              {!readOnly ? <th style={{ width: 1 }} /> : null}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>
                  <div className="fw-medium">{userFirstName(u)} {userLastName(u)}</div>
                </td>
                <td>{u.email}</td>
                <td>{userDepartment(u) || '-'}</td>
                <td>{u.role?.nom || '-'}</td>
                <td>
                  {u.isActive ? (
                    <span className="badge bg-success">Actif</span>
                  ) : (
                    <span className="badge bg-secondary">Désactivé</span>
                  )}
                </td>
                {!readOnly ? (
                  <td>
                    <Actions user={u} roles={roles} onRefetch={onRefetch} />
                  </td>
                ) : null}
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={colCount} className="text-center text-secondary py-4">
                  Aucun utilisateur.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
