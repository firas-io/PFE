# Rapport d’audit — Rôles, permissions, navigation et UI (HabitFlow)

Date de référence : avril 2026. Portée : backend Fastify + frontend Next.js du dépôt **habitflow-backend** (racine avec `backend/` et `frontend/`).

---

## 1. Rôles identifiés et permissions (backend)

Les rôles par défaut sont créés dans `backend/src/fixtures/setup-admin.js` (collection Mongo `roles`).

### 1.1 `admin`

- **Description** : accès total au système.
- **Permissions** : `ALL`, `OFF_DAYS_MANAGE`, `TICKETS_MANAGE`, `ADMIN_STATS_VIEW`.
- **Effet** : `ALL` satisfait toutes les vérifications `verifyAbility` (voir `backend/src/plugins/auth.plugin.js`).

### 1.2 `manager`

- **Description** : responsable d’équipe.
- **Permissions** : `MANAGER_USERS_VIEW`, `MANAGER_USERS_MANAGE`, `HABITS_VIEW`, `HABITS_CREATE`, `HABITS_MANAGE`, `LOGS_VIEW`, `LOGS_MANAGE`, `PROGRESS_VIEW`, `ONBOARDING_VIEW`, `REMINDERS_VIEW`, `SESSIONS_VIEW`.
- **Remarque** : pas de `USERS_MANAGE` ni `TICKETS_MANAGE` — ne peut pas CRUD les managers globaux ni la file admin des tickets catégories.

### 1.3 `utilisateur`

- **Description** : utilisateur standard.
- **Permissions** : `SELF_VIEW`, `SELF_EDIT`, `HABITS_VIEW`, `HABITS_CREATE`, `HABITS_MANAGE`, `LOGS_VIEW`, `LOGS_MANAGE`, `PROGRESS_VIEW`, `ONBOARDING_VIEW`, `REMINDERS_VIEW`, `SESSIONS_VIEW`.

### 1.4 Mapping abilities → permissions

Fichier : `backend/src/plugins/auth.plugin.js`, objet `ABILITY_MAP` (ex. `read:Habit` → `HABITS_VIEW`, `manage:Ticket` → `TICKETS_MANAGE`).

---

## 2. Inventaire des routes protégées (vue d’ensemble)

Convention générale :

- **`verifyAccessToken`** : JWT valide + utilisateur actif + hydratation `request.user` (email, `role`, `permissions`).
- **`verifyAbility([{ action, subject }])`** : au moins une des permissions listées dans `ABILITY_MAP` pour cette paire action/sujet, **ou** `ALL`.

Exemples déjà relevés dans le code :

| Zone | Exemple de protection |
|------|------------------------|
| Habitudes (liste admin) | `read:Habit` (`HABITS_VIEW`) sur `GET /habits` |
| Habitudes perso | `GET /habits/my` : token seulement |
| Utilisateurs | `GET /users` : `read:User` |
| Managers CRUD | `GET/POST/PATCH/DELETE /managers` : `manage:Manager` → `USERS_MANAGE` (**réservé admin avec ALL ou USERS_MANAGE**) |
| Utilisateurs d’un manager | `/managers/users` : `read/manage:ManagerUser` |
| Rôles | `/roles` : `read/manage:Role` |
| Jours off | création / MAJ : `manage:OffDay` |
| Tickets catégories (file admin) | `GET /category-tickets`, `PATCH .../status` : `manage:Ticket` |
| Tickets « mes tickets » | `GET /category-tickets/my`, `POST`, `DELETE` : token seulement |
| Stats admin | `GET /admin/stats` : `read:AdminStats` |
| Progression | `GET /progress/*` : token seulement |

Pour une liste exhaustive, ouvrir chaque fichier `**/routes/*.js` sous `backend/src/modules/`.

---

## 3. Authentification frontend

- **Stockage** : `localStorage` via `frontend/src/services/auth.service.ts` (`habitflow_token`, `habitflow_refresh_token`, `habitflow_user`).
- **Login** : `frontend/app/login/_components/LoginForm/LoginForm.jsx` — enregistre l’utilisateur, redirige `admin` → `/admin`, `manager` → `/admin/my-users`, sinon → `/dashboard`.
- **Refresh** : `frontend/src/services/api.service.ts` — après rotation des tokens, **fusion** de l’objet `user` renvoyé par `/refresh` dans `localStorage` (alignement rôle + permissions après changement de rôle côté DB).

### 3.1 Évolution récente (cohérence UI / backend)

- **Login + LDAP + refresh** renvoient désormais `user.permissions` (tableau de strings), identique à ce qui est mis dans le JWT côté serveur.
- **Utilitaire client** : `frontend/src/utils/permissions.ts` — `hasPermission`, `hasAnyPermission`, `canAccessAdminShell`, `canManageManagersCrud`, `canManageCategoryTickets` (pour extensions UI sans dupliquer la logique).

---

## 4. Sidebar et garde-fous par rôle

### 4.1 Espace **/dashboard** (`DashboardShell`)

- Liens : tableau de bord, habitudes, analytiques, historique, calendrier, avancement, tickets.
- **Correction** : lien conditionnel **« Administration »** (admin) ou **« Équipe »** (manager) vers `/admin` ou `/admin/my-users`, visible uniquement si `role` ∈ `{ admin, manager }` (fonction `canAccessAdminShell`).
- Les routes API sous-jacentes restent protégées côté serveur ; ce lien évite de chercher l’URL à la main.

### 4.2 Espace **/admin** (`app/admin/layout.tsx`)

- **Garde** : `useEffect` redirige vers `/login` si l’utilisateur n’est pas `admin` ni `manager` (inchangé, comportement sûr).
- **Corrections navigation** :
  - Sections **« Vue d’ensemble »** et **« Administration »** (admin uniquement).
  - Icônes Tabler sur chaque entrée pour lisibilité.
  - **Admin** : liens explicites vers `/admin/users`, `/admin/managers`, `/admin/notes` (auparavant, managers et notes étaient absents du menu latéral tout en ayant des pages).
  - **Manager** : lien « Mes utilisateurs » conservé (sans bloc Administration).

### 4.3 Page **/admin/managers**

- **Garde** : `ManagerList` redirige les non-admins vers `/admin` via `useEffect` + message d’attente (évite un écran d’erreur API répétée pour un manager).

---

## 5. Incohérences relevées (et statut)

| Sujet | Avant | Après |
|--------|--------|--------|
| Objet `user` en localStorage sans `permissions` | Impossible de conditionner l’UI sur les droits fins sans décoder le JWT | `permissions` inclus au login / refresh |
| Refresh token | Mettait à jour les tokens mais pas le profil stocké | Fusion de `data.user` après `/refresh` |
| Menu admin sans « Managers » / « Notes » | Pages atteignables seulement par URL | Entrées de menu pour l’admin |
| Manager sur `/admin/managers` | Message d’avertissement statique | Redirection vers `/admin` |

**Non traité dans cette passe** (complexité ou hors périmètre court) :

- Page dédiée **file admin des tickets** (`GET /category-tickets` avec `TICKETS_MANAGE`) : pas d’écran dans `app/admin/` ; à ajouter si besoin métier.
- **Harmonisation complète** du design system (toutes les pages) : seules des variables CSS légères et la sidebar admin ont été touchées ; le reste du dashboard Tailwind existant est inchangé.
- **Gating fin** des pages dashboard (ex. masquer « Analytiques » sans `STATS_VIEW`) : les routes `progress` sont ouvertes à tout utilisateur connecté ; seul un audit route-par-route des modules stats permettrait d’aligner sans casser les usages actuels.

---

## 6. Améliorations frontend réalisées dans cette passe

1. **Permissions exposées** au client (login / refresh) + merge au refresh.
2. **`permissions.ts`** : helpers réutilisables.
3. **Sidebar admin** : groupement, icônes, liens Managers + Notes, libellé « Utilisateurs & rôles ».
4. **Sidebar utilisateur** : lien rapide vers l’espace admin / équipe pour les rôles concernés.
5. **CSS** : classes `.admin-nav-section` + mode sombre ; variables `--section-gap` et `--radius-card` dans `:root` pour évolutions futures.
6. **Garde** managers : redirection propre pour les non-admins.

---

## 7. Points à surveiller / dette technique

1. **Rôle `manager` et permission `HABITS_VIEW`** : cohérent avec la liste des habitudes côté API ; vérifier dans les *controllers* que les managers ne voient que les habitudes autorisées (règle métier métier hors navigation).
2. **`HABITS_CREATE` dans les fixtures** : non référencé dans `ABILITY_MAP` ; l’API peut s’appuyer sur d’autres chemins (`HABITS_MANAGE`). Éviter d’ajouter des permissions « mortes » sans les utiliser dans le code.
3. **Utilisateurs déjà connectés** avant déploiement : sans nouveau login, `permissions` peut être absent dans `localStorage` jusqu’au prochain **refresh automatique** (401) ou reconnexion — acceptable ; option : appeler `GET /profile` au montage du shell pour re-synchroniser (non implémenté ici).

---

## 8. Fichiers modifiés (cette passe audit / UI)

**Backend**

- `backend/src/modules/auth/controllers/auth.controller.js`
- `backend/src/modules/auth/services/auth.service.js`

**Frontend**

- `frontend/src/services/api.service.ts`
- `frontend/src/utils/permissions.ts` (nouveau)
- `frontend/app/admin/layout.tsx`
- `frontend/app/admin/admin-layout.css`
- `frontend/app/dashboard/_components/DashboardShell/DashboardShell.jsx`
- `frontend/app/admin/managers/_components/ManagerList/ManagerList.jsx`
- `frontend/app/globals.css`

Pour la documentation fonctionnelle des catégories d’habitudes, voir `docs/categories-et-habitudes.md`.
