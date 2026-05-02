# 5 stories STAR — Alice Dupont

> Chaque story tient en 2-3 minutes racontée. Pour les entretiens comportementaux.

---

## Story 1 — Migration Vue 2 → Vue 3 sans downtime

> Question type : « Décris une réalisation dont tu es fière. »

**S** — Beta Corp, marketplace 200k visiteurs/mois sur Vue 2.6, EOL annoncée. La direction voulait migrer en Vue 3 mais craignait un downtime sur cette plateforme à fort enjeu commercial.

**T** — Je devais piloter la migration en tant que Frontend Lead, sans dégrader UX ni perfs, et en gardant l'équipe (3 devs frontend) productive sur les features.

**A** — J'ai proposé un plan en 3 phases : 1) compat Vue 2.7 + Composition API pour préparer le code, 2) migration progressive page par page avec un wrapper qui rendait Vue 3 dans une enveloppe Vue 2, 3) cutover final en 1 PR atomique. J'ai écrit un RFC consultable, documenté chaque étape, et organisé un dry-run en staging avec dump prod anonymisé.

**R** — Migration terminée en 3 mois. **Aucun downtime**, aucune régression visible utilisateur. Bundle JS **-30 %**, ce qui a contribué à **+12 % de taux de conversion mobile** mesuré post-migration. RFC réutilisé par 2 autres équipes pour leurs propres migrations.

---

## Story 2 — L'incident de migration DB un vendredi 14h

> Question type : « Parle-moi d'un échec. »

**S** — Acme Inc., j'étais lead sur le déploiement d'une feature qui ajoutait une colonne NOT NULL à la table `orders` (8M lignes). On l'a déployé un vendredi 14h.

**T** — Mon job de lead : revue technique + go/no-go déploiement.

**A** — La migration a verrouillé la table. La prod a renvoyé 5xx pendant 35 min. J'ai mené le rollback (12 min), puis animé un post-mortem blameless. J'avais validé la migration sans demander une simulation à volumétrie réelle — cause racine. J'ai assumé publiquement.

**R** — 5 actions correctives mises en place : linter de migration qui bloque les `ALTER TABLE` sur > 1M lignes sans review explicite, staging avec dump prod anonymisé, fenêtre de déploiement encadrée (pas après jeudi 16h), runbook « migration bloquante », validation env Zod au boot. **Aucun incident similaire en 8 mois.** Le post-mortem a été présenté en all-hands et est devenu le template de l'équipe.

---

## Story 3 — Le désaccord sur le state management

> Question type : « Décris un désaccord avec un collègue. »

**S** — Notre nouveau dev senior chez Acme voulait introduire Redux + RTK sur un projet où on utilisait Zustand depuis 18 mois. L'équipe (4 devs) était divisée.

**T** — Je voulais éviter à la fois la prise de décision dictatoriale et le statut quo par défaut. Trouver une décision qu'on assumerait collectivement.

**A** — J'ai proposé d'écrire un RFC de comparaison à deux mains avec lui : forces / faiblesses des deux dans NOTRE contexte, pas dans l'absolu. On a interviewé les 4 devs, listé les pain points avec Zustand (3 réels), évalué si Redux les résout (en partie) ou si refactor Zustand suffit (oui pour 2 sur 3). On a proposé un essai sur 1 sub-feature en Redux avant décision globale.

**R** — Après 3 semaines d'essai, l'équipe a voté unanimement pour rester sur Zustand avec une discipline plus stricte (1 store = 1 domaine, types stricts). Le collègue a accepté car la décision était documentée et data-driven. **Pas de friction depuis**, et il est devenu allié sur d'autres décisions techniques.

---

## Story 4 — Le choix entre Drizzle et Prisma

> Question type : « Une décision technique difficile. »

**S** — Lancement d'un nouveau service backend chez Acme. Contraintes : edge-compatible (Cloudflare Workers à terme), TypeScript strict, équipe habituée à Prisma.

**T** — Choisir l'ORM. La sélection touchait 5 services à venir.

**A** — J'ai écrit un ADR avec 4 alternatives (Prisma, Drizzle, raw SQL avec types, Kysely). Critères : edge-compatible, perf, expérience dev, migration story, maintenabilité 3 ans. J'ai prototypé en 2 jours sur les 2 options finalistes (Drizzle vs Prisma 6 avec Edge Adapter). Drizzle gagnait sur l'edge et le runtime, Prisma sur la DX. J'ai partagé l'ADR à 3 séniors externes pour challenge avant décision.

**R** — Choix de Drizzle, documenté dans ADR-007. **18 mois plus tard** : 5 services en prod sur Drizzle, 0 incident lié à l'ORM, perfs OK. Si je devais refaire le choix avec les capacités 2026 de Prisma 7, je referais probablement la même décision pour les services edge, mais Prisma resterait défendable pour les services Node classiques.

---

## Story 5 — Apprendre Three.js en 3 mois pour un projet client

> Question type : « Comment apprends-tu une nouvelle techno ? »

**S** — Un client avait besoin d'un configurateur 3D pour leur SaaS de mobilier. Je n'avais jamais touché à Three.js. Délai : 3 mois.

**T** — Livrer un configurateur production-ready ou décliner la mission.

**A** — Méthode Feynman : j'ai suivi *Three.js Journey* (Bruno Simon) **en codant** chaque exemple. J'ai fait un mini-projet de cube tournant le jour 3, puis un loader GLB jour 7, puis le premier prototype client jour 21. À chaque étape, j'écrivais en clair pour moi pourquoi ça marchait. Avant chaque pull-request client, je faisais relire à un dev 3D senior trouvé sur Discord (rétribué pour 3 sessions).

**R** — Configurateur livré dans les délais. **96 % Lighthouse mobile** avec scène GLB compressée Draco (2 MB → 380 KB). Le client a renouvelé pour 6 mois supplémentaires. **Apprentissage durable** : Three.js fait maintenant partie de mes compétences avec 2 autres projets depuis.

---

## Méta-discipline

J'ai relu chacune et vérifié :

- ✅ « Je » dans les Action (sauf Story 3 où c'est explicitement collaboratif).
- ✅ Chiffre / fait dans chaque Result.
- ✅ Pas de blâme nominatif (Story 3 : « notre nouveau dev senior », pas son nom).
- ✅ Leçon explicite dans Story 2 (échec).
- ✅ Toutes en 2-3 min racontées (chronométré).
