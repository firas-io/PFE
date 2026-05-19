"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/src/services/api.service";

const ALL_PERMISSIONS: { code: string; label: string }[] = [
  { code: "HABITS_VIEW",       label: "Voir les habitudes" },
  { code: "HABITS_MANAGE",     label: "Gérer les habitudes" },
  { code: "HABITS_CREATE",     label: "Créer des habitudes" },
  { code: "LOGS_VIEW",         label: "Voir les logs" },
  { code: "LOGS_MANAGE",       label: "Gérer les logs" },
  { code: "USERS_VIEW",        label: "Voir les utilisateurs" },
  { code: "USERS_MANAGE",      label: "Gérer les utilisateurs" },
  { code: "TICKETS_MANAGE",    label: "Gérer les tickets" },
  { code: "ADMIN_STATS_VIEW",  label: "Voir les statistiques admin" },
  { code: "CATEGORIES_MANAGE", label: "Gérer les catégories" },
  { code: "SELF_VIEW",         label: "Voir son propre profil" },
  { code: "SELF_EDIT",         label: "Modifier son propre profil" },
  { code: "MANAGERS_MANAGE",   label: "Gérer les managers" },
  { code: "MANAGER_USERS_MANAGE", label: "Gérer les utilisateurs du manager" },
  { code: "OFFDAYS_VIEW",      label: "Voir les jours off" },
  { code: "OFF_DAYS_MANAGE",   label: "Gérer les jours off" },
];

interface Role {
  _id: string;
  nom: string;
  permissions: string[];
}

export default function RolePermissions() {
  const [roles, setRoles]       = useState<Role[]>([]);
  const [saving, setSaving]     = useState<Record<string, boolean>>({});
  const [saved, setSaved]       = useState<Record<string, boolean>>({});
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Role[]>("/roles").then(setRoles).catch(() => setError("Impossible de charger les rôles"));
  }, []);

  function togglePermission(role: Role, perm: string) {
    const has     = role.permissions.includes(perm);
    const updated = has ? role.permissions.filter(p => p !== perm) : [...role.permissions, perm];
    setRoles(prev => prev.map(r => r._id === role._id ? { ...r, permissions: updated } : r));
    // Mark as unsaved
    setSaved(prev => ({ ...prev, [role._id]: false }));
  }

  async function savePermissions(role: Role) {
    setSaving(prev => ({ ...prev, [role._id]: true }));
    try {
      await apiFetch(`/roles/${role._id}/permissions`, {
        method: "PATCH",
        body: JSON.stringify({ permissions: role.permissions }),
      });
      setSaved(prev => ({ ...prev, [role._id]: true }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur de sauvegarde");
    } finally {
      setSaving(prev => ({ ...prev, [role._id]: false }));
    }
  }

  // Do not show admin role (its permissions cannot be changed)
  const editableRoles = roles.filter(r => r.nom !== "admin");

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!roles.length) return <div className="text-muted">Chargement…</div>;

  return (
    <div className="row g-3">
      {editableRoles.map(role => (
        <div key={role._id} className="col-12 col-md-6">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span className="fw-semibold text-capitalize">{role.nom}</span>
              <div className="d-flex align-items-center gap-2">
                {saved[role._id] && <span className="badge bg-success">Sauvegardé ✓</span>}
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => savePermissions(role)}
                  disabled={saving[role._id]}
                >
                  {saving[role._id] ? "…" : "Sauvegarder"}
                </button>
              </div>
            </div>
            <div className="card-body p-0">
              <ul className="list-group list-group-flush">
                {ALL_PERMISSIONS.map(({ code, label }) => (
                  <li key={code} className="list-group-item d-flex justify-content-between align-items-center py-2 px-3">
                    <span className="small">{label}</span>
                    <div className="form-check form-switch mb-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id={`${role._id}-${code}`}
                        checked={role.permissions.includes(code)}
                        onChange={() => togglePermission(role, code)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
