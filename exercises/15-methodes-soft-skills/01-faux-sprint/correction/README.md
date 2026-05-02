# Correction — Faux sprint d'équipe

> Sprint réel-fictif réalisé par une équipe de 3 dev (Alice, Bob, Carol) sur le projet *taskly* — **pas une démo Scrum-académique**. Un sprint avec un incident, des choix imparfaits, et 2 actions de rétro réellement actionnables. **C'est ce qu'un bon sprint pro ressemble en pratique.**
>
> Lis-la **après ton propre sprint**. Compare la **discipline**, pas le contenu — chaque équipe a son style.

## Sommaire

1. [Vue d'ensemble — 7 artefacts](#1-vue-densemble--7-artefacts)
2. [Ce qui rend ce sprint « bon »](#2-ce-qui-rend-ce-sprint--bon-)
3. [Backlog priorisé MoSCoW + capacité](#3-backlog-priorisé-moscow--capacité)
4. [PR review en Conventional Comments](#4-pr-review-en-conventional-comments)
5. [ADR + post-mortem reliés](#5-adr--post-mortem-reliés)
6. [Rétro qui produit 2 actions](#6-rétro-qui-produit-2-actions)
7. [Anti-patterns à reconnaître](#7-anti-patterns-à-reconnaître)
8. [Pour aller plus loin](#8-pour-aller-plus-loin)

---

## 1. Vue d'ensemble — 7 artefacts

```
sprint-output/
├── BACKLOG.md                          ← 8 tickets MoSCoW + capacité + sprint goal
├── TASK-101.md                          ← exemple de ticket bien écrit
├── PR-42-review.md                      ← trace de revue d'une PR (Conventional Comments)
├── ADR-007-stockage-token-oauth.md      ← décision technique capturée
├── POST_MORTEM-2026-05-09.md            ← post-mortem blameless complet
├── RETRO-Sprint-1.md                    ← rétro avec 2 actions concrètes
└── SPRINT_REPORT.md                     ← bilan chiffré du sprint
```

| Artefact | Lignes | Quand produit | Public cible |
|----------|--------|---------------|--------------|
| `BACKLOG.md` | 38 | J0 (planning) | équipe + PO + stakeholders |
| `TASK-101.md` | 42 | J0 (planning) | dev qui prend le ticket |
| `PR-42-review.md` | 99 | J5 (review en cours) | auteur de la PR |
| `ADR-007-...md` | 60 | J6 (décision prise) | équipe + futurs devs |
| `POST_MORTEM-...md` | 80 | J9 (incident résolu) | équipe + ops + management |
| `RETRO-Sprint-1.md` | 57 | J10 (fin de sprint) | équipe |
| `SPRINT_REPORT.md` | 52 | J10 + 1 (bilan) | stakeholders + management |

**Total ~430 lignes de doc** pour un sprint de 2 semaines à 3 personnes. Ça paraît beaucoup, mais c'est ce qu'attend une équipe pro mature : **la doc rend l'équipe asynchrone et lisible** par un nouveau dev qui arrive.

## 2. Ce qui rend ce sprint « bon »

### 2.1 Sprint goal mémorable en 1 phrase

> **« Permettre la connexion via Google OAuth + page profil utilisable en self-service. »**

Test : **chacun des 3 devs peut le dire de tête au daily du J5**. Si non → goal trop vague.

### 2.2 Capacité explicite et marge

```markdown
## Capacité
- Alice : 8 j-h (5 j × 1.6 h/j focus net)
- Bob : 8 j-h
- Carol : 4 j-h (à 50 %, en formation 2 j)
- Total : 20 j-h
- Estimé sélectionné : 13 j-h
- Marge : 35 %
```

**35 % de marge** = absorber les imprévus (tickets bugs urgents, blocages, refinement). Sans marge → sprint qui finit en panique systématiquement.

### 2.3 Tickets DoR — pris sans demander

```markdown
# TASK-101 — Connexion via Google OAuth

## Contexte
Aujourd'hui les users s'inscrivent via email/password. On veut OAuth Google pour
réduire la friction signup (~30 % d'abandons mesurés).

## User story
En tant que visiteur, je veux me connecter avec mon compte Google,
afin d'éviter de créer un mot de passe supplémentaire.

## Critères d'acceptation
- [ ] Bouton « Continuer avec Google » sur /sign-in
- [ ] OAuth flow PKCE (authlib)
- [ ] Compte créé en DB au 1er login si inconnu
- [ ] Redirection vers /dashboard après succès
- [ ] Erreur explicite si Google refuse (401, 403)

## Out of scope
- GitHub OAuth (TASK-102)
- Suppression du compte Google (TASK-110)
- Choix UI du bouton (Carol propose 2 designs après ce ticket)

## Estimation : M (3 j)
## Priorité MoSCoW : Must
## Dépendances : TASK-100 (Google Cloud Console projet créé)
```

Tout est là : **contexte (pourquoi)**, **user story**, **AC testables**, **out of scope explicite**, **estimation**, **dépendances**. Bob peut le prendre lundi matin sans demander.

## 3. Backlog priorisé MoSCoW + capacité

```markdown
# BACKLOG — Sprint 1

## Sprint goal
Permettre la connexion via Google OAuth + page profil utilisable en self-service.

## Must (à livrer absolument — 9 j-h)
- [ ] TASK-101 : OAuth Google (M, 3 j) — Bob
- [ ] TASK-103 : Page profil read-only (S, 2 j) — Alice
- [ ] TASK-104 : Page profil édition (M, 3 j) — Alice
- [ ] TASK-100 : Setup Google Cloud Console (XS, 1 j) — Bob

## Should (livrer si possible — 3 j-h)
- [ ] TASK-105 : Avatar uploadable (S, 2 j) — Carol
- [ ] TASK-106 : Tracker analytics login (XS, 1 j) — Bob

## Could (bonus si tout va bien — 1 j-h)
- [ ] TASK-107 : Dark mode preference saved (XS, 1 j) — Carol

## Won't this sprint (explicit)
- TASK-102 : GitHub OAuth (Sprint 2)
- TASK-108 : 2FA SMS (Sprint 3)
- TASK-110 : Delete Google account (Sprint 2)
```

**Won't explicite** = stakeholders ne peuvent pas reprocher l'absence en review. Ils savaient.

## 4. PR review en Conventional Comments

Extrait de `PR-42-review.md` :

```markdown
### `praise:` Excellente séparation OAuth callback / création user
La fonction `findOrCreateUser` est testable isolément, c'est exactement ce
qu'il fallait. Bravo pour la factorisation.

### `suggestion:` Extraire les codes d'erreur OAuth en const
Plutôt que les strings inline, ça permettra de typer le switch.

### `question:` Pourquoi `state` en localStorage et pas en cookie ?
Le state CSRF traditionnellement va en cookie HttpOnly. J'ai loupé un détail ?

### `issue (blocking):` Token Google brut stocké en DB
Ligne 42, le token est en clair. Il **doit être chiffré au repos** —
voir TASK-101 AC point 6. À discuter ensemble — peut-être un ADR ?

### `nitpick:` Espace double ligne 17
Pas grave, prettier le fixerait.
```

**Ratio sain** : 1 praise / 1 suggestion / 1 question / 1 issue / 1 nitpick. La review n'est ni complaisante ni hostile. Elle débloque un point critique (issue blocking) tout en reconnaissant ce qui est bien fait.

L'issue blocking → mène à l'ADR-007 (cf. § 5).

## 5. ADR + post-mortem reliés

### ADR-007 — Stockage chiffré des tokens OAuth

```markdown
## Statut
Acceptée — 2026-05-08

## Contexte
La PR #42 propose de stocker les access tokens Google en clair dans la table
`oauth_accounts`. Ces tokens donnent accès aux API Google de l'user (profile,
calendar selon scopes). Une fuite = compromission massive.

## Décision
Chiffrer les tokens au repos avec AES-256-GCM, clé dérivée d'un secret
serveur (`OAUTH_TOKENS_KEY`, 32 octets, dans Vault Fly).

## Conséquences
- ✅ Fuite DB seule = impossible de réutiliser les tokens
- ✅ Rotation de clé possible (re-chiffrement en arrière-plan)
- ❌ +2 ms par lookup (déchiffrement)
- ❌ Code de chiffrement à tester rigoureusement (modes IV, etc.)

## Alternatives considérées
1. Plain text — rejeté pour la fuite triviale.
2. Vault HashiCorp — overkill pour 3 dev.
3. KMS Google — coût + complexité, pas justifié à 100 users.
```

### POST_MORTEM-2026-05-09 — référence l'ADR

> Le J9, un attaquant a tenté de rejouer un token OAuth volé via XSS. **L'ADR-007
> nous a sauvés** — le token étant chiffré, le rejeu a échoué côté API Google.

L'ADR n'est pas un papier qui dort dans `docs/`. **Il sert quand un incident touche son sujet**. C'est la valeur d'avoir capturé la décision avec son contexte.

### Format post-mortem blameless

```markdown
# Post-mortem 2026-05-09 — Tentative de rejeu de token OAuth

## Résumé exécutif (3 lignes)
Le 2026-05-09 entre 14h32 et 14h47 UTC, des erreurs 401 ont surgi.
Cause : tentative de rejeu d'un token volé via XSS sur un site tiers.
Impact : 0 user impacté (chiffrement ADR-007 a bloqué l'attaque).

## Timeline (UTC)
- 14:32 — Better Stack alerte sur 8× 401 sur /auth/google/callback
- 14:35 — Bob commence le diagnostic
- 14:40 — Identifie une IP unique qui rejoue le même token
- 14:45 — Block IP côté Cloudflare
- 14:47 — Erreurs s'arrêtent

## Root cause
Token OAuth Google d'un user volé via XSS sur https://other-site.example
(pas notre app). L'attaquant a tenté de l'utiliser sur notre callback.

## Contributing factors
1. Notre code : aucun — ADR-007 a fonctionné comme prévu.
2. Process : pas de monitoring sur le pattern « rejeu ».
3. Outillage : le bloc Cloudflare manuel a pris 5 min — automatiser via WAF.

## Action items
| # | Action | Owner | Deadline | Severity |
|---|--------|-------|----------|----------|
| 1 | Règle WAF Cloudflare auto-block sur 5+ 401 même token | Bob | S+1 | 1 |
| 2 | Alerte Slack si ratio 401/200 > 5 % sur 5 min | Carol | S+1 | 1 |
| 3 | Documenter procédure block IP dans runbook | Alice | S+1 | 2 |
| 4 | Audit XSS sur sites partenaires connus | Bob | S+2 | 3 |
| 5 | Considérer rotation des access tokens à chaque login | équipe | S+4 | 3 |

## What went well
- Détection en 3 min via Better Stack.
- ADR-007 a tenu — le chiffrement a fait son boulot.
- Équipe sereine, coordination Slack efficace.

## What we got lucky on
- L'attaquant utilisait un seul token. À l'avenir, il pourrait paralléliser.
```

**Aucune mention de personne en mauvais terme** : Bob a fait la mitigation, mais il n'est pas pointé pour quoi que ce soit. Les actions visent **les systèmes** (WAF, alerte, runbook), pas « former Bob ». **C'est ça, blameless.**

## 6. Rétro qui produit 2 actions

```markdown
# Rétro Sprint 1

## Format Start / Stop / Continue

### Start
- Pair programming sur les ADR — la décision OAuth aurait gagné à être discutée à 3.

### Stop
- PR > 400 lignes — la PR #42 faisait 612 lignes, review pénible.

### Continue
- Async dailies (gain de temps, qualité égale).
- Marge 35 % de capacité (a permis de gérer l'incident sans déraper).

## Actions (2 max)
| # | Action | Owner | Deadline |
|---|--------|-------|----------|
| 1 | Mob programming 1 h sur chaque ADR à venir | Alice (anime) | dès Sprint 2 |
| 2 | Hard limit 400 lignes / PR ; CI qui warn au-delà | Carol | S+1 |

## Pas inclus volontairement
- « Améliorer la doc » (trop vague, pas actionnable).
- « Refactor le module auth » (pas un sujet de rétro, c'est un ticket backlog).
```

**2 actions seulement**. Concrètes. Owner. Deadline. Pas 8 actions vagues qui ne seront pas suivies.

**« Pas inclus volontairement »** est explicite — montre la **discipline** d'éliminer les actions mal cadrées.

## 7. Anti-patterns à reconnaître

| Anti-pattern | Symptôme | Fix |
|---|---|---|
| **Daily de 45 min** | Tu discutes des solutions techniques | Coupe à 15 min strict ; détails techniques en thread après |
| **PR de 1500 lignes** | Reviewer fait `LGTM` sans relire | CI qui bloque > 400 lignes ; split en commits préparatoires |
| **« LGTM » sans relire** | Reviewer ne cite rien de précis | Demander **1 chose précise** : « cite-moi 1 truc qui t'a plu » |
| **Rétro qui pleure** | Liste de 8 frustrations sans action | L'animateur impose **2 actions** owner + deadline |
| **Post-mortem qui blâme** | Mention de noms en posture accusatrice | Relire, remplacer chaque « Bob a fait X » par « le système a permis X » |
| **Tickets vagues** | « Améliorer la perf » | DoR strict : pas de ticket sans AC testables |
| **Sprint goal flou** | Personne ne peut le réciter à J5 | « Une phrase mémorable » : si ça prend 3 phrases, c'est trop |
| **Tout en `Must`** | Pas de Won't explicite | Forcer ratio 60/20/15/5 (Must/Should/Could/Won't) |

## 8. Pour aller plus loin

- **Sprint #2 sur les actions de rétro** : reprends les 2 actions, vérifie qu'elles sont tenues. Sinon, ta rétro = théâtre.

- **Mesurer le lead time sur 3 sprints** : `(date PR mergée − date ticket created)`. Tendance descendante = équipe qui apprend. Voir [Accelerate (DORA)](https://itrevolution.com/product/accelerate/).

- **Pair programming Loom** : enregistre 30 min de pair sur un ticket complexe et regarde ensemble. La revue d'enregistrement révèle des automatismes invisibles en live.

- **Mob programming sur l'ADR** : 3-4 personnes, 1 clavier, 1 écran. Décision technique en 1 h au lieu d'un thread Slack qui s'éternise.

- **Game day** : couper la DB pendant 5 min en staging, mesurer le RTO réel. À faire **trimestriellement** — révèle les divergences runbook vs réalité.

- **Inviter un dev externe** en review d'un sprint complet pour un feedback indépendant. Coût : 2 h de leur temps. Bénéfice : feedback honnête qu'aucun coéquipier n'oserait formuler.

- **Comparer ton équipe aux profils DORA** : Elite, High, Medium, Low. Métriques : deployment frequency, lead time, MTTR, change failure rate. Si tu es « Low », identifie 1 levier (typiquement : automatisation des déploiements).
