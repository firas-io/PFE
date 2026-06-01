"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/src/services/api.service";

// Set maximum par rôle — l'admin ne peut pas dépasser ces permissions
const MAX_PERMISSIONS: Record<string, { code: string; label: string; group: string }[]> = {
  manager: [
    { code: "MANAGER_USERS_VIEW",   label: "Voir les membres de son équipe",      group: "Équipe" },
    { code: "MANAGER_USERS_MANAGE", label: "Gérer les membres de son équipe",      group: "Équipe" },
    { code: "HABITS_VIEW",          label: "Voir les habitudes",                   group: "Habitudes" },
    { code: "HABITS_CREATE",        label: "Créer des habitudes",                  group: "Habitudes" },
    { code: "HABITS_MANAGE",        label: "Gérer les habitudes de l'équipe",      group: "Habitudes" },
    { code: "LOGS_VIEW",            label: "Voir les logs de l'équipe",            group: "Logs" },
    { code: "LOGS_MANAGE",          label: "Gérer les logs de l'équipe",           group: "Logs" },
    { code: "STATS_VIEW",           label: "Voir les statistiques équipe",         group: "Stats & Progrès" },
    { code: "PROGRESS_VIEW",        label: "Voir la progression personnelle",      group: "Stats & Progrès" },
    { code: "OFFDAYS_VIEW",         label: "Voir les jours off",                   group: "Jours off" },
  ],
  utilisateur: [
    { code: "HABITS_VIEW",          label: "Voir ses habitudes",                   group: "Habitudes" },
    { code: "HABITS_CREATE",        label: "Créer des habitudes",                  group: "Habitudes" },
    { code: "HABITS_MANAGE",        label: "Gérer ses propres habitudes",          group: "Habitudes" },
    { code: "LOGS_VIEW",            label: "Voir ses logs",                        group: "Logs" },
    { code: "LOGS_MANAGE",          label: "Gérer ses logs",                       group: "Logs" },
    { code: "PROGRESS_VIEW",        label: "Voir sa progression",                  group: "Stats & Progrès" },
    { code: "OFFDAYS_VIEW",         label: "Voir les jours off",                   group: "Jours off" },
  ],
};

const ROLE_LABELS: Record<string, string> = {
  manager:     "Manager",
  utilisateur: "Utilisateur standard",
};

interface Role { _id: string; nom: string; permissions: string[]; }

export default function RolePermissions() {
  const [roles, setRoles]       = useState<Role[]>([]);
  const [original, setOriginal] = useState<Record<string, string[]>>({});
  const [saving, setSaving]     = useState<Record<string, boolean>>({});
  const [saved, setSaved]       = useState<Record<string, boolean>>({});
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Role[]>("/roles")
      .then(data => {
        setRoles(data);
        const orig: Record<string, string[]> = {};
        data.forEach(r => { orig[r._id] = [...r.permissions]; });
        setOriginal(orig);
      })
      .catch(() => setError("Impossible de charger les rôles"));
  }, []);

  function isDirty(role: Role) {
    const orig = original[role._id] ?? [];
    if (orig.length !== role.permissions.length) return true;
    return role.permissions.some(p => !orig.includes(p));
  }

  function toggle(role: Role, code: string) {
    const updated = role.permissions.includes(code)
      ? role.permissions.filter(p => p !== code)
      : [...role.permissions, code];
    setRoles(prev => prev.map(r => r._id === role._id ? { ...r, permissions: updated } : r));
    setSaved(prev => ({ ...prev, [role._id]: false }));
  }

  async function save(role: Role) {
    setSaving(prev => ({ ...prev, [role._id]: true }));
    setError(null);
    try {
      await apiFetch(`/roles/${role._id}/permissions`, {
        method: "PATCH",
        body: JSON.stringify({ permissions: role.permissions }),
      });
      setSaved(prev => ({ ...prev, [role._id]: true }));
      setOriginal(prev => ({ ...prev, [role._id]: [...role.permissions] }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur de sauvegarde");
    } finally {
      setSaving(prev => ({ ...prev, [role._id]: false }));
    }
  }

  function reset(role: Role) {
    const orig = original[role._id] ?? [];
    setRoles(prev => prev.map(r => r._id === role._id ? { ...r, permissions: [...orig] } : r));
    setSaved(prev => ({ ...prev, [role._id]: false }));
  }

  const editableRoles = roles.filter(r => r.nom !== "admin");

  if (!roles.length && !error) return <div className="text-muted">Chargement…</div>;

  return (
    <>
      {error && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center mb-3">
          <span>{error}</span>
          <button className="btn-close" onClick={() => setError(null)} />
        </div>
      )}

      <div className="row g-3">
        {editableRoles.map(role => {
          const maxPerms = MAX_PERMISSIONS[role.nom] ?? [];
          const groups   = [...new Set(maxPerms.map(p => p.group))];
          const dirty    = isDirty(role);
          const activeCount = maxPerms.filter(p => role.permissions.includes(p.code)).length;

          return (
            <div key={role._id} className="col-12 col-xl-6">
              <div className={`card h-100 ${dirty ? "border-warning" : ""}`}>

                <div className="card-header d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-2">
                    <span className="fw-semibold">{ROLE_LABELS[role.nom] ?? role.nom}</span>
                    {dirty && (
                      <span className="badge bg-warning text-dark" style={{ fontSize: 11 }}>
                        Non sauvegardé
                      </span>
                    )}
                    {saved[role._id] && !dirty && (
                      <span className="badge bg-success" style={{ fontSize: 11 }}>Sauvegardé ✓</span>
                    )}
                  </div>
                  <div className="d-flex gap-2">
                    {dirty && (
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => reset(role)} disabled={saving[role._id]}>
                        Annuler
                      </button>
                    )}
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => save(role)}
                      disabled={saving[role._id] || !dirty}
                    >
                      {saving[role._id] ? "Sauvegarde…" : "Sauvegarder"}
                    </button>
                  </div>
                </div>

                <div className="card-body p-0" style={{ overflowY: "auto", maxHeight: 420 }}>
                  {groups.map(group => (
                    <div key={group}>
                      <div className="px-3 py-1 text-secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", background: "var(--tblr-bg-surface-secondary, #f6f8fb)" }}>
                        {group}
                      </div>
                      <ul className="list-group list-group-flush">
                        {maxPerms.filter(p => p.group === group).map(({ code, label }) => {
                          const active = role.permissions.includes(code);
                          return (
                            <li
                              key={code}
                              className="list-group-item d-flex justify-content-between align-items-center py-2 px-3"
                              style={{ cursor: "pointer" }}
                              onClick={() => toggle(role, code)}
                            >
                              <span className="small">{label}</span>
                              <div className="form-check form-switch mb-0" onClick={e => e.stopPropagation()}>
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  role="switch"
                                  checked={active}
                                  onChange={() => toggle(role, code)}
                                />
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>

                <div className="card-footer text-secondary d-flex justify-content-between" style={{ fontSize: 12 }}>
                  <span>{activeCount} / {maxPerms.length} permissions actives</span>
                  <span>{activeCount === maxPerms.length ? "Toutes actives" : `${maxPerms.length - activeCount} désactivée(s)`}</span>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
