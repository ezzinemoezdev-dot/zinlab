# ZinLab — gestion du laboratoire informatique

Base de projet Next.js + TypeScript + Supabase. L'interface de connexion et le tableau de bord sont opérationnels une fois Supabase configuré. Le module Classes permet d'ajouter des classes. Les modules Séances, Appel, Notes, Postes et Historique ont leur schéma SQL prêt mais leur interface métier doit être développée dans les étapes suivantes.

## Prérequis
- Node.js 20.9 ou plus récent
- VS Code
- Un projet Supabase

## 1. Installer
Dans le terminal VS Code, depuis le dossier `zinlab` :

```bash
npm install
```

## 2. Créer la base de données
1. Créez un projet sur https://supabase.com.
2. Ouvrez **SQL Editor** dans le tableau de bord Supabase.
3. Copiez tout le contenu de `supabase/schema.sql`, puis cliquez **Run**.
4. Dans Authentication > Users, créez votre compte administrateur avec votre e-mail et un mot de passe fort.
5. Dans SQL Editor, remplacez `VOTRE_EMAIL` par votre e-mail exact et exécutez :

```sql
update public.profiles
set role = 'admin', full_name = 'Administrateur ZinLab'
where id = (select id from auth.users where email = 'VOTRE_EMAIL');
```

Ne donnez jamais le rôle admin à un compte non fiable. Les nouveaux comptes sont enseignants par défaut.

## 3. Configurer les clés
Dans Supabase : Project Settings > API (ou Connect selon l'interface), copiez l'URL du projet et la clé publique/publishable. Créez `.env.local` à la racine du projet à partir de `.env.example` :

```env
NEXT_PUBLIC_SUPABASE_URL=https://VOTRE-PROJET.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=votre_cle_publique
```

N'utilisez jamais une clé `service_role` ou `secret` dans une variable `NEXT_PUBLIC_*`, dans le navigateur, ou dans Git.

## 4. Lancer en local

```bash
npm run dev
```

Ouvrez http://localhost:3000. Connectez-vous avec le compte créé dans Supabase. Les inscriptions publiques ne sont pas proposées : l'administration crée/invite les comptes depuis Supabase Authentication.

## 5. Vérifier avant publication

```bash
npm run build
```

Avant d'utiliser des données réelles d'élèves, faites tester les politiques RLS avec des comptes enseignant et administrateur distincts. Ce dépôt est une base fonctionnelle de départ, pas encore une version complète certifiée pour la production : les interfaces des modules métier et les règles fines d'accès par classe restent à terminer.

## Structure

- `app/page.tsx` : connexion, tableau de bord, gestion initiale des classes, langue FR/AR
- `app/globals.css` : styles responsive
- `lib/supabase/client.ts` : client Supabase côté navigateur
- `supabase/schema.sql` : schéma relationnel, rôles, politiques RLS et postes PC01–PC30
- `.env.example` : variables nécessaires

## Tables de la base
`profiles`, `classes`, `students`, `sessions`, `attendance`, `computers`, `computer_assignments`, `assignments`, `grades`.
