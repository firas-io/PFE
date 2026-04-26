'use client';
import React from 'react';
import { userDepartment, userFirstName, userLastName } from '@/lib/userDisplay';
import { Actions } from './Actions/Actions';

export const MyUserTable = ({ users, onRefetch }) => (
  <div className="card">
    <div className="table-responsive">
      <table className="table table-vcenter card-table">
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
              <td>
                <div className="fw-medium">{userFirstName(u)} {userLastName(u)}</div>
              </td>
              <td>{u.email}</td>
              <td>{userDepartment(u) || '-'}</td>
              <td>
                {u.isActive ? (
                  <span className="badge bg-success">Actif</span>
                ) : (
                  <span className="badge bg-secondary">Désactivé</span>
                )}
              </td>
              <td>
                <Actions user={u} onRefetch={onRefetch} />
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={5} className="text-center text-secondary py-4">
                Aucun utilisateur dans votre équipe.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);
