"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_BASE } from "@/lib/api";
import { AuthHeader } from "@/components/AuthHeader";

export default function SignupPage() {
  const router = useRouter();
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isFormValid = useMemo(
    () =>
      nom.trim().length > 0 &&
      prenom.trim().length > 0 &&
      email.trim().length > 0 &&
      password.length >= 6,
    [nom, prenom, email, password]
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: nom.trim(),
          prenom: prenom.trim(),
          email: email.trim(),
          mot_de_passe: password,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        let backendError: string | null = null;
        if (data && typeof data === "object") {
          const record = data as Record<string, unknown>;
          if (typeof record.error === "string") {
            backendError = record.error;
          }
        }
        const msg = backendError || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      setSuccess("Compte créé avec succès. Vous pouvez maintenant vous connecter.");
      // Option: rediriger après un court délai
      setTimeout(() => router.push("/login"), 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l’inscription";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="container container-tight py-4">
        <div className="card">
          <div className="card-body p-5">
            <AuthHeader title="Créer un compte" />

            <div className="d-flex justify-content-end mb-3">
              <Link href="/" className="btn btn-sm btn-outline-secondary">
                Retour
              </Link>
            </div>

            <form onSubmit={onSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Nom</label>
                  <input
                    className="form-control"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Prénom</label>
                  <input
                    className="form-control"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-3 mt-3">
                <label className="form-label">Email</label>
                <input
                  className="form-control"
                  value={email}
                  type="email"
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Mot de passe</label>
                <input
                  className="form-control"
                  value={password}
                  type="password"
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <div className="form-text">Au moins 6 caractères.</div>
              </div>

              {error ? (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              ) : null}

              {success ? (
                <div className="alert alert-success" role="alert">
                  {success}
                </div>
              ) : null}

              <button className="btn btn-primary w-100" type="submit" disabled={!isFormValid || loading}>
                {loading ? "Création en cours..." : "Créer le compte"}
              </button>
            </form>

            <div className="mt-3 text-center text-secondary">
              Déjà un compte ?{" "}
              <Link href="/login" className="text-primary">
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

