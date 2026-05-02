# [feature] — Ajouter route OAuth GitHub côté API

## Contexte
Aujourd'hui, l'auth se fait uniquement par email/password. Plusieurs utilisateurs
demandent de pouvoir se connecter via GitHub (cible : devs sur notre SaaS).

Lié à : RFC-014 (Authentification multi-provider), discussion #842.

## Critères d'acceptation
- [ ] `GET /auth/github/login` redirige vers GitHub OAuth avec `state` aléatoire signé
- [ ] `GET /auth/github/callback` valide `state`, échange le code contre un token,
      lit `/user` GitHub, crée ou met à jour l'utilisateur en DB, retourne un cookie session
- [ ] L'erreur GitHub (refus, scopes manquants) renvoie 401 avec message clair
- [ ] Token stocké chiffré (AES-256-GCM, clé depuis `ENCRYPTION_KEY` env)
- [ ] Test e2e qui passe (Playwright) — voir TASK-105

## Spec technique
- Endpoint : Hono routes `app.get('/auth/github/login', ...)` et `/callback`
- Scopes GitHub : `read:user user:email`
- DB : table `oauth_accounts` (`user_id`, `provider`, `provider_user_id`, `token_encrypted`, `created_at`)
- Variables env : `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `ENCRYPTION_KEY`

## Edge cases
- Email GitHub privé (non public) → utiliser `/user/emails`
- Utilisateur déjà inscrit avec le même email → lier les comptes (compteur en DB)
- `state` invalide / expiré (>10 min) → 400 + redirection login
- Réseau GitHub timeout → 503 + retry suggestion

## Out of scope
- UI bouton « Se connecter avec GitHub » → TASK-104
- Page profil après login → TASK-103
- Multi-provider Google / GitLab → V2

## Estimation
- T-shirt size : **M** (~ 2 jours)

## Notes
- Voir doc GitHub OAuth : https://docs.github.com/en/apps/oauth-apps
- ADR-007 — Choix de stockage chiffré (à écrire dans le sprint)

## Owner
@bob
