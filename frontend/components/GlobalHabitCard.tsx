"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Zap, Globe } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface GlobalHabit {
  _id: string;
  nom: string;
  description?: string;
  categorie?: string;
  frequence?: string;
  priorite?: string;
  objectif_valeur?: number;
  objectif_unite?: string;
  isActivated: boolean;
  userSettings?: {
    note?: string;
    objectif_perso?: string;
    priorite_perso?: string;
    statut_perso?: string;
  } | null;
}

interface Props {
  habit: GlobalHabit;
  onRefresh: () => void;
}

const FREQ_LABELS: Record<string, string> = {
  daily: "Quotidien",
  weekly: "Hebdomadaire",
  monthly: "Mensuel",
  specific_days: "Jours spécifiques",
  times_per_week: "X fois/semaine",
};

export default function GlobalHabitCard({ habit, onRefresh }: Props) {
  const [loading, setLoading]   = useState(false);
  const [note, setNote]         = useState(habit.userSettings?.note ?? "");
  const [objectif, setObjectif] = useState(habit.userSettings?.objectif_perso ?? "");
  const [priorite, setPriorite] = useState(habit.userSettings?.priorite_perso ?? "");
  const [saving, setSaving]     = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function activate() {
    setLoading(true);
    try {
      await apiFetch(`/habits/${habit._id}/activate`, { method: "POST" });
      onRefresh();
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    setSaving(true);
    try {
      await apiFetch(`/habits/${habit._id}/my-settings`, {
        method: "PATCH",
        body: JSON.stringify({ note, objectif_perso: objectif, priorite_perso: priorite }),
      });
      onRefresh();
    } finally {
      setSaving(false);
    }
  }

  async function archiveHabit() {
    if (!confirm("Retirer cette habitude de votre espace ?")) return;
    try {
      await apiFetch(`/habits/${habit._id}/my-settings`, {
        method: "PATCH",
        body: JSON.stringify({ statut_perso: "archive" }),
      });
      onRefresh();
    } catch {/* ignore */}
  }

  const activated = habit.isActivated;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
      style={{
        background: "#FFFFFF",
        borderRadius: 14,
        border: `1.5px solid ${activated ? "#C7D2FE" : "#E5E7EB"}`,
        overflow: "hidden",
        position: "relative",
        boxShadow: activated ? "0 2px 12px rgba(67,56,202,0.08)" : "0 1px 4px rgba(0,0,0,0.04)",
        transition: "box-shadow 0.2s, border-color 0.2s",
      }}
    >
      {/* Left accent bar */}
      <div
        style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
          background: activated ? "#4338CA" : "#D1D5DB",
          borderRadius: "14px 0 0 14px",
        }}
      />

      <div style={{ padding: "14px 14px 12px 18px" }}>
        {/* Top row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>

          {/* Globe icon */}
          <div style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            background: activated ? "#EEF2FF" : "#F3F4F6",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Globe size={16} color={activated ? "#4338CA" : "#9CA3AF"} />
          </div>

          {/* Name + badges */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 14, fontWeight: 700,
              color: "#1E1B4B", lineHeight: 1.3,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {habit.nom}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
              {habit.categorie && (
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: "2px 8px",
                  borderRadius: 20, background: "#EEF2FF", color: "#4338CA",
                }}>
                  {habit.categorie}
                </span>
              )}
              {habit.frequence && (
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: "2px 8px",
                  borderRadius: 20, background: "#F3F4F6", color: "#6B7280",
                  border: "1px solid #E5E7EB",
                }}>
                  {FREQ_LABELS[habit.frequence] ?? habit.frequence}
                </span>
              )}
              {habit.objectif_valeur ? (
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: "2px 8px",
                  borderRadius: 20, background: "#F0FDF4", color: "#059669",
                  border: "1px solid #D1FAE5",
                }}>
                  {habit.objectif_valeur} {habit.objectif_unite}
                </span>
              ) : null}
            </div>
            {habit.description && (
              <p style={{ fontSize: 12, color: "#64748B", margin: "6px 0 0", lineHeight: 1.5 }}>
                {habit.description}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            {!activated ? (
              <button
                onClick={activate}
                disabled={loading}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "6px 14px", borderRadius: 8,
                  background: loading ? "#6366F1" : "#4338CA",
                  color: "#fff", fontSize: 12, fontWeight: 700,
                  border: "none", cursor: loading ? "default" : "pointer",
                  opacity: loading ? 0.7 : 1,
                  transition: "opacity 0.15s, background 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                <Zap size={12} />
                {loading ? "…" : "Activer"}
              </button>
            ) : (
              <button
                onClick={() => setExpanded(v => !v)}
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "5px 10px", borderRadius: 8,
                  background: expanded ? "#EEF2FF" : "transparent",
                  color: "#4338CA", fontSize: 12, fontWeight: 600,
                  border: "1.5px solid #C7D2FE", cursor: "pointer",
                  transition: "background 0.15s",
                }}
              >
                Paramètres
                <ChevronDown
                  size={13}
                  style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
                />
              </button>
            )}
          </div>
        </div>

        {/* Activated indicator */}
        {activated && !expanded && (
          <div style={{
            marginTop: 10, fontSize: 11, fontWeight: 600, color: "#4338CA",
            display: "flex", alignItems: "center", gap: 4,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#4338CA", display: "inline-block",
            }} />
            Habitude activée
          </div>
        )}
      </div>

      {/* Expandable settings */}
      <AnimatePresence initial={false}>
        {activated && expanded && (
          <motion.div
            key="settings"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div style={{
              borderTop: "1px solid #E5E7EB",
              padding: "14px 16px 14px 18px",
              display: "flex", flexDirection: "column", gap: 12,
            }}>

              {/* Note */}
              <div>
                <label style={{
                  fontSize: 11, fontWeight: 600, color: "#64748B",
                  display: "flex", alignItems: "center", gap: 6, marginBottom: 5,
                }}>
                  Note personnelle
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: "1px 6px",
                    borderRadius: 20, background: "#EFF6FF", color: "#3B82F6",
                    letterSpacing: "0.03em",
                  }}>
                    Visible par vous uniquement
                  </span>
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Votre note privée…"
                  style={{
                    width: "100%", padding: "8px 10px",
                    borderRadius: 8, border: "1.5px solid #E5E7EB",
                    fontSize: 12, color: "#1E1B4B", background: "#FAFAFA",
                    resize: "none", outline: "none", fontFamily: "inherit",
                    transition: "border-color 0.15s",
                    boxSizing: "border-box",
                  }}
                  onFocus={e => (e.target.style.borderColor = "#4338CA")}
                  onBlur={e => (e.target.style.borderColor = "#E5E7EB")}
                />
              </div>

              {/* Objectif + Priorité */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 5 }}>
                    Objectif personnel
                  </label>
                  <input
                    type="text"
                    value={objectif}
                    onChange={e => setObjectif(e.target.value)}
                    placeholder="ex: 30 min/jour"
                    style={{
                      width: "100%", padding: "7px 10px",
                      borderRadius: 8, border: "1.5px solid #E5E7EB",
                      fontSize: 12, color: "#1E1B4B", background: "#FAFAFA",
                      outline: "none", fontFamily: "inherit",
                      transition: "border-color 0.15s",
                      boxSizing: "border-box",
                    }}
                    onFocus={e => (e.target.style.borderColor = "#4338CA")}
                    onBlur={e => (e.target.style.borderColor = "#E5E7EB")}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 5 }}>
                    Priorité
                  </label>
                  <select
                    value={priorite}
                    onChange={e => setPriorite(e.target.value)}
                    style={{
                      width: "100%", padding: "7px 10px",
                      borderRadius: 8, border: "1.5px solid #E5E7EB",
                      fontSize: 12, color: "#1E1B4B", background: "#FAFAFA",
                      outline: "none", fontFamily: "inherit",
                      transition: "border-color 0.15s",
                      boxSizing: "border-box", cursor: "pointer",
                    }}
                    onFocus={e => (e.target.style.borderColor = "#4338CA")}
                    onBlur={e => (e.target.style.borderColor = "#E5E7EB")}
                  >
                    <option value="">— Défaut —</option>
                    <option value="high">Haute</option>
                    <option value="medium">Moyenne</option>
                    <option value="low">Basse</option>
                  </select>
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  style={{
                    padding: "7px 16px", borderRadius: 8,
                    background: saving ? "#6366F1" : "#4338CA",
                    color: "#fff", fontSize: 12, fontWeight: 700,
                    border: "none", cursor: saving ? "default" : "pointer",
                    opacity: saving ? 0.7 : 1,
                    transition: "opacity 0.15s",
                  }}
                >
                  {saving ? "Enregistrement…" : "Enregistrer"}
                </button>
                <button
                  onClick={archiveHabit}
                  style={{
                    padding: "7px 16px", borderRadius: 8,
                    background: "transparent", color: "#EF4444",
                    fontSize: 12, fontWeight: 600,
                    border: "1.5px solid #FECACA", cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => ((e.target as HTMLButtonElement).style.background = "#FEF2F2")}
                  onMouseLeave={e => ((e.target as HTMLButtonElement).style.background = "transparent")}
                >
                  Retirer
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
