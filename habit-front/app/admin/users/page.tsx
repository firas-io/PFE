"use client";

import { Suspense } from "react";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { getToken, getUser } from "@/lib/auth";
import { IconCircleCheck, IconEdit, IconTrash, IconUserOff, IconUserPlus } from "@tabler/icons-react";
import { createPortal } from "react-dom";

type Role = {
  _id: string;
  nom: string;
  description?: string;
  permissions?: string[];
};

type User = {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  departement?: string;
  role?: Role;
  isActive: boolean;
};

function Modal(props: {
  open: boolean;
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  size?: "md" | "lg";
}) {
  const isBrowser = typeof window !== "undefined";

  useEffect(() => {
    if (!props.open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [props.open]);

  if (!isBrowser || !props.open) return null;

  const sizeClass = props.size === "lg" ? "modal-dialog modal-lg" : "modal-dialog";
  return createPortal(
    <>
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        onClick={props.onClose}
      >
        <div className={sizeClass} onClick={(e) => e.stopPropagation()}>
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <div className="modal-title h5">{props.title}</div>
                {props.subtitle ? <div className="text-secondary small">{props.subtitle}</div> : null}
              </div>
              <button type="button" className="btn-close" onClick={props.onClose} aria-label="Close" />
            </div>
            <div className="modal-body">{props.children}</div>
            {props.footer ? <div className="modal-footer">{props.footer}</div> : null}
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>,
    document.body
  );
}

function UsersAdminPageContent() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const currentUser = getUser<{ role?: string }>();
  const isAdmin = currentUser?.role === "admin";

  function errorMessage(err: unknown, fallback: string) {
    return err instanceof Error ? err.message : fallback;
  }

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [confirmState, setConfirmState] = useState<{
    action: "delete" | "status";
    userId: string | null;
    nextIsActive?: boolean;
  }>({ action: "delete", userId: null });

  const [createForm, setCreateForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    mot_de_passe: "",
    departement: "",
    roleNom: "",
  });

  const [editForm, setEditForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    departement: "",
  });

  const [roleForm, setRoleForm] = useState({
    roleNom: "",
  });

  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersData, rolesData] = await Promise.all([apiFetch<User[]>("/users"), apiFetch<Role[]>("/roles")]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch (err: unknown) {
      setError(errorMessage(err, "Impossible de charger les données."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setToken(getToken());
  }, []);

  useEffect(() => {
    if (!token) return;
    refresh();
  }, [token, refresh]);

  const canOpenAdmin = !!token;

  function openCreate() {
    const defaultRole = roles.find((r) => r.nom === "utilisateur")?.nom || roles[0]?.nom || "";
    setCreateForm((f) => ({ ...f, roleNom: defaultRole }));
    setCreateOpen(true);
  }

  function startEdit(user: User) {
    setSelectedUser(user);
    setEditForm({
      nom: user.nom || "",
      prenom: user.prenom || "",
      email: user.email || "",
      departement: user.departement || "",
    });
    setEditOpen(true);
  }

  function startRoleEdit(user: User) {
    setSelectedUser(user);
    setRoleForm({ roleNom: user.role?.nom || "" });
    setRoleOpen(true);
  }

  function askDelete(user: User) {
    setSelectedUser(user);
    setConfirmState({ action: "delete", userId: user._id });
    setConfirmOpen(true);
  }

  function askStatusToggle(user: User) {
    const nextIsActive = !user.isActive;
    setSelectedUser(user);
    setConfirmState({ action: "status", userId: user._id, nextIsActive });
    setConfirmOpen(true);
  }

  async function onCreateSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!createForm.roleNom) throw new Error("Veuillez sélectionner un rôle.");
      await apiFetch<User>("/users/admin", {
        method: "POST",
        body: JSON.stringify({
          nom: createForm.nom.trim(),
          prenom: createForm.prenom.trim(),
          email: createForm.email.trim(),
          mot_de_passe: createForm.mot_de_passe,
          roleNom: createForm.roleNom,
          departement: createForm.departement.trim() || "",
        }),
      });
      setCreateOpen(false);
      setCreateForm({ nom: "", prenom: "", email: "", mot_de_passe: "", departement: "", roleNom: "" });
      await refresh();
    } catch (err: unknown) {
      setError(errorMessage(err, "Erreur lors de la création."));
    } finally {
      setLoading(false);
    }
  }

  async function onEditSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedUser) return;

    setError(null);
    setLoading(true);
    try {
      await apiFetch<User>(`/users/${selectedUser._id}`, {
        method: "PATCH",
        body: JSON.stringify({
          nom: editForm.nom.trim(),
          prenom: editForm.prenom.trim(),
          email: editForm.email.trim(),
          departement: editForm.departement.trim() || "",
        }),
      });
      setEditOpen(false);
      setSelectedUser(null);
      setEditForm({ nom: "", prenom: "", email: "", departement: "" });
      await refresh();
    } catch (err: unknown) {
      setError(errorMessage(err, "Erreur lors de la modification."));
    } finally {
      setLoading(false);
    }
  }

  async function onRoleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedUser) return;

    setError(null);
    setLoading(true);
    try {
      if (!roleForm.roleNom) throw new Error("Veuillez sélectionner un rôle.");
      await apiFetch(`/users/${selectedUser._id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ roleNom: roleForm.roleNom }),
      });
      setRoleOpen(false);
      setSelectedUser(null);
      setRoleForm({ roleNom: "" });
      await refresh();
    } catch (err: unknown) {
      setError(errorMessage(err, "Erreur lors du changement de rôle."));
    } finally {
      setLoading(false);
    }
  }

  async function onConfirm() {
    if (!confirmState.userId) return;
    setError(null);
    setLoading(true);
    try {
      if (confirmState.action === "delete") {
        await apiFetch(`/users/${confirmState.userId}`, { method: "DELETE" });
      } else if (confirmState.action === "status") {
        await apiFetch(`/users/${confirmState.userId}/status`, {
          method: "PATCH",
          body: JSON.stringify({ isActive: !!confirmState.nextIsActive }),
        });
      }
      setConfirmOpen(false);
      setSelectedUser(null);
      setConfirmState({ action: "delete", userId: null });
      await refresh();
    } catch (err: unknown) {
      setError(errorMessage(err, "Erreur sur l'action demandée."));
    } finally {
      setLoading(false);
    }
  }

  if (token === null) {
    return (
      <div className="page">
        <div className="container py-4 text-secondary">Chargement...</div>
      </div>
    );
  }

  if (!canOpenAdmin) {
    return (
      <div className="page">
        <div className="container py-4">
          <div className="alert alert-warning">
            Vous devez être connecté en administrateur pour accéder à cette page.
          </div>
          <Link className="btn btn-primary" href="/login">
            Aller à la connexion
          </Link>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div>
        <div className="alert alert-warning mb-3">
          Accès refusé. Seul un administrateur peut accéder à la gestion des utilisateurs.
        </div>
        <Link className="btn btn-primary" href="/admin/habits">
          Retour aux habitudes
        </Link>
      </div>
    );
  }

  const selectedLabel = selectedUser ? `${selectedUser.prenom} ${selectedUser.nom}` : "";
  
  // Safe searchParams access
  const showActiveOnlyUsers = searchParams?.get("active") === "true";
  
  const confirmText =
    confirmState.action === "delete"
      ? `Supprimer définitivement ${selectedLabel} ?`
      : `${confirmState.nextIsActive ? "Réactiver" : "Désactiver"} ${selectedLabel} ?`;

  // Filter users based on active query parameter
  const displayedUsers = showActiveOnlyUsers ? users.filter((u) => u.isActive) : users;

  return (
    <div>
      <div className="mb-3">
        <h2 className="h3 mb-1 text-primary">Gestion des Users</h2>
        <div className="text-secondary small">Administration des utilisateurs</div>
      </div>

      {error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : null}

      <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
        <div className="text-secondary">
          {loading ? "Chargement..." : `${displayedUsers.length} utilisateur(s)`}
        </div>
        <button className="btn btn-primary" type="button" onClick={openCreate}>
          <IconUserPlus size={18} className="me-2" />
          Créer un utilisateur
        </button>
      </div>

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
                <th style={{ width: 1 }} />
              </tr>
            </thead>
            <tbody>
              {displayedUsers.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div className="fw-medium">
                      {u.prenom} {u.nom}
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>{u.departement || "-"}</td>
                  <td>{u.role?.nom || "-"}</td>
                  <td>
                    {u.isActive ? (
                      <span className="badge bg-success">Actif</span>
                    ) : (
                      <span className="badge bg-secondary">Désactivé</span>
                    )}
                  </td>
                  <td>
                    <div className="btn-list flex-nowrap">
                      <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => startEdit(u)} title="Modifier">
                        <IconEdit size={16} />
                      </button>
                      <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => startRoleEdit(u)} title="Rôle">
                        <IconCircleCheck size={16} />
                      </button>
                      <button
                        className="btn btn-sm btn-outline-warning"
                        type="button"
                        onClick={() => askStatusToggle(u)}
                        title={u.isActive ? "Désactiver" : "Réactiver"}
                      >
                        <IconUserOff size={16} />
                      </button>
                      <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => askDelete(u)} title="Supprimer">
                        <IconTrash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6} className="text-center text-secondary py-4">
                    Aucun utilisateur.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
          open={createOpen}
          title="Créer un utilisateur"
          subtitle="L’admin choisit le rôle."
          onClose={() => setCreateOpen(false)}
          footer={
            <>
              <button className="btn btn-outline-secondary" type="button" onClick={() => setCreateOpen(false)} disabled={loading}>
                Annuler
              </button>
              <button className="btn btn-primary" type="submit" form="create-user-form" disabled={loading}>
                Créer
              </button>
            </>
          }
          size="lg"
        >
          <form id="create-user-form" onSubmit={onCreateSubmit}>
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label">Nom</label>
                <input className="form-control" value={createForm.nom} onChange={(e) => setCreateForm((f) => ({ ...f, nom: e.target.value }))} required />
              </div>
              <div className="col-md-3">
                <label className="form-label">Prénom</label>
                <input className="form-control" value={createForm.prenom} onChange={(e) => setCreateForm((f) => ({ ...f, prenom: e.target.value }))} required />
              </div>
              <div className="col-md-3">
                <label className="form-label">Email</label>
                <input className="form-control" type="email" value={createForm.email} onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))} required />
              </div>
              <div className="col-md-3">
                <label className="form-label">Mot de passe</label>
                <input className="form-control" type="password" value={createForm.mot_de_passe} onChange={(e) => setCreateForm((f) => ({ ...f, mot_de_passe: e.target.value }))} required />
              </div>
              <div className="col-md-4">
                <label className="form-label">Département</label>
                <input className="form-control" value={createForm.departement} onChange={(e) => setCreateForm((f) => ({ ...f, departement: e.target.value }))} />
              </div>
              <div className="col-md-8">
                <label className="form-label">Rôle</label>
                <select
                  className="form-select"
                  value={createForm.roleNom}
                  onChange={(e) => setCreateForm((f) => ({ ...f, roleNom: e.target.value }))}
                  required
                >
                  <option value="" disabled>
                    Choisir...
                  </option>
                  {roles.map((r) => (
                    <option key={r._id} value={r.nom}>
                      {r.nom}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </form>
        </Modal>

      <Modal
          open={editOpen}
          title="Modifier l’utilisateur"
          onClose={() => setEditOpen(false)}
          footer={
            <>
              <button className="btn btn-outline-secondary" type="button" onClick={() => setEditOpen(false)} disabled={loading}>
                Annuler
              </button>
              <button className="btn btn-primary" type="submit" form="edit-user-form" disabled={loading}>
                Enregistrer
              </button>
            </>
          }
        >
          <form id="edit-user-form" onSubmit={onEditSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Nom</label>
                <input className="form-control" value={editForm.nom} onChange={(e) => setEditForm((f) => ({ ...f, nom: e.target.value }))} required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Prénom</label>
                <input className="form-control" value={editForm.prenom} onChange={(e) => setEditForm((f) => ({ ...f, prenom: e.target.value }))} required />
              </div>
              <div className="col-md-12">
                <label className="form-label">Email</label>
                <input className="form-control" type="email" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} required />
              </div>
              <div className="col-md-12">
                <label className="form-label">Département</label>
                <input className="form-control" value={editForm.departement} onChange={(e) => setEditForm((f) => ({ ...f, departement: e.target.value }))} />
              </div>
            </div>
          </form>
        </Modal>

      <Modal
          open={roleOpen}
          title="Changer le rôle"
          subtitle={selectedUser ? `Utilisateur: ${selectedUser.prenom} ${selectedUser.nom}` : undefined}
          onClose={() => setRoleOpen(false)}
          footer={
            <>
              <button className="btn btn-outline-secondary" type="button" onClick={() => setRoleOpen(false)} disabled={loading}>
                Annuler
              </button>
              <button className="btn btn-primary" type="submit" form="role-user-form" disabled={loading}>
                Mettre à jour
              </button>
            </>
          }
        >
          <form id="role-user-form" onSubmit={onRoleSubmit}>
            <div className="mb-3">
              <label className="form-label">Rôle</label>
              <select className="form-select" value={roleForm.roleNom} onChange={(e) => setRoleForm({ roleNom: e.target.value })} required>
                <option value="" disabled>
                  Choisir...
                </option>
                {roles.map((r) => (
                  <option key={r._id} value={r.nom}>
                    {r.nom}
                  </option>
                ))}
              </select>
            </div>
          </form>
        </Modal>

      <Modal
          open={confirmOpen}
          title="Confirmer l’action"
          subtitle="Cette action peut être irréversible."
          onClose={() => setConfirmOpen(false)}
          footer={
            <>
              <button className="btn btn-outline-secondary" type="button" onClick={() => setConfirmOpen(false)} disabled={loading}>
                Annuler
              </button>
              <button className="btn btn-danger" type="button" onClick={onConfirm} disabled={loading}>
                Confirmer
              </button>
            </>
          }
        >
          <div className="text-secondary mb-3">{confirmText}</div>
      </Modal>
    </div>
  );
}



export default function UsersAdminPage() {
  return (
    <Suspense fallback={<div className="container py-4"><div className="spinner-border" role="status"><span className="visually-hidden">Chargement...</span></div></div>}>
      <UsersAdminPageContent />
    </Suspense>
  );
}
