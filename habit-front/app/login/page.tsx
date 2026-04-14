"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_BASE } from "@/lib/api";
import { setToken, setUser } from "@/lib/auth";
import { AuthHeader } from "@/components/AuthHeader";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
   const [useLdap, setUseLdap] = useState(false);

  const isFormValid = useMemo(() => email.trim().length > 0 && password.length > 0, [email, password]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setError(null);
    try {
      const path = useLdap ? "/login/ldap" : "/login";
      const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          mot_de_passe: password,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
      }

      if (!data?.token) throw new Error("Token manquant dans la réponse du serveur.");

      setToken(String(data.token));
      setUser(data.user ?? null);
      const role = data.user?.role;
      if (role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur de connexion";
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
            <AuthHeader title="Authentification" />

            <div className="d-flex justify-content-end mb-3">
              <Link href="/" className="btn btn-sm btn-outline-secondary">
                Retour
              </Link>
            </div>

            <div className="btn-group w-100 mb-4" role="group" aria-label="Type de connexion">
              <button
                type="button"
                className={`btn ${useLdap ? "btn-outline-secondary" : "btn-primary"}`}
                onClick={() => setUseLdap(false)}
                disabled={loading}
              >
                Base de données
              </button>
              <button
                type="button"
                className={`btn ${useLdap ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => setUseLdap(true)}
                disabled={loading}
              >
                LDAP
              </button>
            </div>

            <form onSubmit={onSubmit}>
              <div className="mb-3">
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

              {useLdap ? (
                <div className="alert alert-info py-2" role="status">
                  Connexion LDAP activée.
                </div>
              ) : null}

              <div className="mb-3">
                <label className="form-label">Mot de passe</label>
                <input
                  className="form-control"
                  value={password}
                  type="password"
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              {error ? (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              ) : null}

              <button className="btn btn-primary w-100" type="submit" disabled={!isFormValid || loading}>
                {loading ? "Connexion..." : useLdap ? "Se connecter via LDAP" : "Se connecter"}
              </button>
            </form>
            <div className="mt-3 text-center text-secondary">
              Pas encore de compte ?{" "}
              <Link href="/signup" className="text-primary">
                Créer un compte
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

