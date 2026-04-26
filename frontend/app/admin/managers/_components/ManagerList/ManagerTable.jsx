'use client';
import React from 'react';
import { userDepartment, userFirstName, userLastName } from '@/lib/userDisplay';
import { Actions } from './Actions/Actions';

export const ManagerTable = ({ managers, onRefetch }) => (
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
          {managers.map((m) => (
            <tr key={m._id}>
              <td>
                <div className="fw-medium">{userFirstName(m)} {userLastName(m)}</div>
              </td>
              <td>{m.email}</td>
              <td>{userDepartment(m) || '-'}</td>
              <td>
                {m.isActive ? (
                  <span className="badge bg-success">Actif</span>
                ) : (
                  <span className="badge bg-secondary">Désactivé</span>
                )}
              </td>
              <td>
                <Actions manager={m} onRefetch={onRefetch} />
              </td>
            </tr>
          ))}
          {managers.length === 0 && (
            <tr>
              <td colSpan={5} className="text-center text-secondary py-4">
                Aucun manager.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);
