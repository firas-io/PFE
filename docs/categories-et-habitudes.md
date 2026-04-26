# Catégories d’habitudes et champs dynamiques — Guide complet

Ce document explique **à quoi sert la fonctionnalité**, **comment elle est câblée** dans HabitFlow, et **comment l’utiliser ou l’étendre** sans tout relire le code.

---

## 1. En deux phrases : qu’est-ce que c’est ?

- Une **habitude** a toujours un champ texte `categorie` (ex. `sport`, `autre`). Ce n’est **pas** une collection Mongo séparée : c’est une **valeur contrôlée** par une liste officielle définie dans le code backend.
- En plus, une habitude peut avoir **`categorie_champs`** : un petit objet JSON (ex. `{ "distance": 5, "duree": 30 }`) qui stocke les valeurs des **champs spécifiques** à la catégorie (distance, humeur, montant, etc.).

Le frontend affiche une **grille de catégories**, des **champs qui changent** selon la catégorie, et une **carte visuelle** (layout) dans la liste des habitudes.

---

## 2. Schéma mental (données)

```
Habitude (document Mongo "habits")
├── nom, description, statut, … (comme avant)
├── categorie          → string, slug officiel OU ancienne valeur inconnue (lecture OK)
└── categorie_champs   → objet optionnel { nomDuChamp: valeur, … }
```

- **Lecture** : une habitude avec une `categorie` bizarre en base **continue d’être affichée** (pas d’erreur au GET).
- **Écriture** (création / modification / clone avec override) : la `categorie` doit être **dans la liste officielle**, sinon erreur **`HAB-CAT-001`**.

---

## 3. Où est définie la « vérité » des catégories ?

**Fichier unique côté backend :**

`backend/src/shared/constants/categories.js`

Il contient :

| Export | Rôle |
|--------|------|
| `CATEGORIES` | Objet : une entrée par slug (`sport`, `autre`, …) avec `label`, `icon`, `color`, `layout`, `description`, `fields` |
| `CATEGORY_SLUGS` | Liste de tous les slugs autorisés |
| `getCategory(slug)` | Retourne la config ou `null` |
| `isValidCategory(slug)` | `true` / `false` |
| `getPublicCategories()` | Tableau exposé par l’API `GET /categories` |
| `resolveCategorieSlug(input)` | Normalise une chaîne (accents, espaces → snake_case) + **alias** historiques |
| `LEGACY_CATEGORY_ALIASES` | Ex. `education` → `apprentissage` |

**Important :** pour ajouter une catégorie « ticket » plus tard, on ajoute une ligne dans `CATEGORIES` avec **`layout: "default"`**. Le frontend utilisera automatiquement `DefaultLayout` sans nouveau fichier React.

---

## 4. API — routes catégories

Toutes les routes ci-dessous exigent un **JWT valide** (header `Authorization: Bearer …`).

### `GET /categories`

Retourne le catalogue public (métadonnées + `fields`) pour alimenter le frontend (sélecteur, champs dynamiques, layouts).

### `GET /categories/:slug`

Retourne **une** catégorie. Si le slug n’existe pas :

- **HTTP 404**
- Corps du type : `{ "code": "CAT-001", "message": "Catégorie inconnue" }`

### Exemples `curl`

Remplace `TOKEN` par ton access token après login.

```bash
curl -sS -H "Authorization: Bearer TOKEN" http://localhost:5000/categories
```

```bash
curl -sS -H "Authorization: Bearer TOKEN" http://localhost:5000/categories/sport
```

---

## 5. Habitudes — validation de la catégorie

Logique dans `backend/src/modules/habits/services/habits.service.js` (et normalisation dans `backend/src/utils/habit-normalize.js`).

### Création `POST /habits`

- Si **aucune** `categorie` n’est envoyée (ou vide) → le serveur met **`autre`** par défaut.
- Si une `categorie` est envoyée → elle doit être **valide** (`isValidCategory`), sinon :
  - **HTTP 400**
  - `code`: **`HAB-CAT-001`**
  - Message listant les slugs acceptés.

### Modification `PUT /habits/:id`

- Si le corps **ne contient pas** `categorie` → la catégorie en base **n’est pas changée** par ce champ.
- Si le corps **contient** `categorie` → même validation que la création.

### `categorie_champs`

- Accepté sous **`categorie_champs`** ou **`categorieChamps`** dans le JSON.
- Le serveur **filtre** les clés : seules les propriétés dont le `name` existe dans `fields` de la **catégorie effective** (nouvelle catégorie ou ancienne si pas modifiée) sont conservées. Le reste est ignoré (pas d’erreur bloquante).

### Templates d’habitudes

`backend/src/modules/habit-templates/services/habit-templates.service.js` : si la catégorie résolue n’est pas valide (données anciennes), elle est **forcée à `autre`** pour ne pas bloquer la création depuis un template.

---

## 6. Frontend — fichiers et rôles

### Types TypeScript

| Fichier | Contenu |
|---------|---------|
| `frontend/src/types/category.types.ts` | `Category`, `CategoryField`, types de layout, etc. |
| `frontend/src/types/habit.types.ts` | `Habit` inclut `categorie_champs` |

### Chargement des catégories (une fois par session)

| Fichier | Rôle |
|---------|------|
| `frontend/hooks/useCategories.ts` | Appelle `GET /categories`, **met en cache** le résultat (module + React), expose `categories`, `loading`, `error`, `getBySlug` |

### Composants habitudes

| Fichier | Rôle |
|---------|------|
| `frontend/components/habits/CategorySelector.tsx` | Grille cliquable des catégories (icône Lucide, couleur, état sélectionné) |
| `frontend/components/habits/DynamicFields.tsx` | Rend les champs (`number`, `text`, `duration`, `select`, `boolean`) selon la catégorie |
| `frontend/components/habits/resolveLucideIcon.ts` | Transforme le nom d’icône string (ex. `"Dumbbell"`) en composant Lucide |
| `frontend/components/habits/layoutTypes.ts` | Types des props des layouts |

### Layouts (carte visuelle dans la liste)

Dossier : `frontend/components/habits/layouts/`

| Fichier | Quand l’utiliser |
|---------|------------------|
| `DefaultLayout.tsx` | `layout: "default"` ou catégorie **inconnue** côté catalogue |
| `SportLayout.tsx`, `StudyLayout.tsx`, … | Une catégorie « premium » avec `layout` correspondant |
| `index.ts` | Export `layouts` et fonction **`getLayout(clé)`** : retourne le bon composant, sinon `DefaultLayout` |

Dans **`frontend/app/dashboard/habits/_components/HabitList/HabitTable.jsx`**, pour chaque habitude :

1. `useCategories().getBySlug(habit.categorie)` → métadonnées API ou rien si slug inconnu.
2. `getLayout(categoryMeta?.layout)` → composant React.
3. **`showFooter={false}`** sur le layout : les boutons d’action (compléter, éditer, …) restent ceux du composant **`Actions`** existant, pour garder clone / pause / etc.

### Formulaire création / édition (dashboard)

| Fichier | Changement |
|---------|------------|
| `HabitForm.jsx` | `CategorySelector` + `DynamicFields` ; reset de `categorie_champs` quand la catégorie change |
| `AddHabitModal.jsx` / `UpdateHabitModal.jsx` | Envoient `categorie_champs` dans le JSON vers l’API |

### Constantes d’affichage (labels sans appel API)

`frontend/app/dashboard/habits/_constants/index.js` et `frontend/app/admin/habits/_constants/index.js` : labels pour l’admin et filtres ; la **source fonctionnelle** des champs reste **`GET /categories`**.

---

## 7. Les 9 catégories et leurs layouts

| Slug | Layout (clé technique) | Rôle du layout |
|------|------------------------|----------------|
| `sport` | `sport` | Graphique distance/durée, badge intensité |
| `apprentissage` | `study` | Barre pages, sujet |
| `bien_etre` | `wellness` | Humeur + courbe sommeil indicative |
| `travail` | `productivity` | Compteur tâches + mini heatmap |
| `sante` | `health` | Timeline / type d’action |
| `finance` | `finance` | Montant coloré + mini courbe |
| `social` | `social` | Type d’interaction + jauge durée |
| `creativite` | `creativity` | Image si URL d’image dans `production` |
| `autre` | `default` | Carte générique (fallback universel) |

Si une habitude a un slug **absent** du fichier `categories.js` (données anciennes), le frontend utilise **`default`** pour le layout et `DefaultLayout` adapte l’affichage avec un **fallback** (libellé = slug brut, champs type « notes »).

---

## 8. Comment tester, étape par étape

### Backend

1. Démarrer l’API (`npm run dev` dans `backend/` après `npm install` si besoin).
2. Se connecter (`POST /login` ou équivalent) et récupérer le **access token**.
3. `GET /categories` → tu dois voir **9** objets avec `slug`, `label`, `fields`, `layout`.
4. `POST /habits` sans `categorie` → document créé avec `categorie: "autre"`.
5. `POST /habits` avec `"categorie": "invalide"` → **400**, `HAB-CAT-001`.
6. `GET /habits/my` → les habitudes existantes s’affichent toujours, même avec une vieille catégorie.

### Frontend

1. `cd frontend` puis `npm run build` (vérifie TypeScript + build).
2. Page **Dashboard → Mes habitudes** :
   - ouvrir **Créer** : grille de catégories, changer de catégorie → les champs en dessous changent ;
   - enregistrer, rouvrir l’habitude → les valeurs de `categorie_champs` doivent réapparaître.
3. La **liste** : chaque carte doit refléter le layout (sport, finance, etc.).

---

## 9. Dépannage courant

| Problème | Piste |
|----------|--------|
| `401` sur `/categories` | Token manquant, expiré, ou mauvais header `Authorization` |
| `HAB-CAT-001` à la sauvegarde | Slug non présent dans `CATEGORIES` / `CATEGORY_SLUGS` |
| Champs vides après édition | Vérifier que le modal envoie bien `categorie_champs` ; vérifier que les **noms** des champs correspondent à ceux du backend |
| Icône « cercle » partout | Nom `icon` dans `categories.js` ne correspond pas à un export Lucide (corriger le string) |
| Image créativité ne s’affiche pas | Le champ `production` doit être une **URL** se terminant par `.png`, `.jpg`, etc. (voir `CreativityLayout.tsx`) |

---

## 10. Fichiers touchés (liste de référence)

### Backend — nouveaux

- `backend/src/shared/constants/categories.js`
- `backend/src/modules/categories/controllers/categories.controller.js`
- `backend/src/modules/categories/routes/categories.routes.js`
- `backend/src/modules/categories/index.js`

### Backend — modifiés

- `backend/src/app.js`
- `backend/src/utils/habit-normalize.js`
- `backend/src/modules/habits/services/habits.service.js`
- `backend/src/modules/habits/constants/habits.constants.js`
- `backend/src/modules/habit-templates/services/habit-templates.service.js`

### Frontend — nouveaux

- `frontend/src/types/category.types.ts`
- `frontend/hooks/useCategories.ts`
- `frontend/components/habits/resolveLucideIcon.ts`
- `frontend/components/habits/CategorySelector.tsx`
- `frontend/components/habits/DynamicFields.tsx`
- `frontend/components/habits/layoutTypes.ts`
- `frontend/components/habits/layouts/*.tsx` + `layouts/index.ts`

### Frontend — modifiés

- `frontend/app/dashboard/habits/_components/HabitForm/HabitForm.jsx`
- `frontend/app/dashboard/habits/_components/AddHabitModal/AddHabitModal.jsx`
- `frontend/app/dashboard/habits/_components/UpdateHabitModal/UpdateHabitModal.jsx`
- `frontend/app/dashboard/habits/_constants/index.js`
- `frontend/app/dashboard/habits/_components/HabitList/HabitTable.jsx`
- `frontend/src/types/habit.types.ts`
- `frontend/app/admin/habits/_constants/index.js`

---

## 11. Ce qui n’a pas été fait (volontairement)

- **Pas de shadcn/ui** dans le dépôt : formulaire modal Bootstrap + composants Tailwind sur le dashboard.
- **Pas de SWR** : cache simple dans `useCategories` (pas dans `package.json`).
- **Graphiques** des layouts : basés sur les **valeurs actuelles** des champs, pas sur l’historique des logs (pas d’endpoint dédié).
- **Formulaire admin** : liste de catégories encore en partie statique ; on peut plus tard brancher `CategorySelector` + `useCategories` comme sur le dashboard.

---

## 12. Glossaire rapide

| Terme | Signification |
|--------|-----------------|
| **Slug** | Identifiant technique stable (`sport`, `autre`) |
| **Layout** | Clé qui choisit quel composant React dessine la carte (`sport`, `default`, …) |
| **`categorie_champs`** | Objet JSON des réponses aux champs dynamiques de la catégorie |
| **`HAB-CAT-001`** | Erreur métier : catégorie non autorisée à l’écriture |
| **`CAT-001`** | Erreur métier : slug inconnu sur `GET /categories/:slug` |

Si un passage te bloque encore, indique **le fichier** ou **l’écran** (ex. « modal création ») et ce que tu vois (message d’erreur, capture), et on pourra zoomer dessus dans un prochain message.
