# Exercice 3.1 — Bibliothèque personnelle

> **Axe** : 3 — Analyse & conception
> **Difficulté** : intermédiaire
> **Durée estimée** : 4 à 8 heures
> **Prérequis** : axe 3 entièrement lu

## 🎯 Objectifs pédagogiques

- Pratiquer le recueil du besoin à partir d'un brief flou
- Rédiger des user stories avec critères d'acceptation
- Construire un MCD et le traduire en SQL
- Tracer une architecture C4 lisible
- Rédiger un ADR
- Produire une maquette basse fidélité

## 📋 Le brief client

> **De** : marie@dupont.fr
> **À** : toi@dev.fr
> **Sujet** : un petit projet pour ma bibliothèque
>
> Bonjour,
>
> J'ai des **centaines de livres** chez moi et je perds le fil. Je voudrais un site
> où je pourrais :
>
> - lister tous mes livres avec photo de couverture
> - savoir lesquels j'ai lus, lesquels je veux lire
> - savoir lesquels j'ai prêtés à qui (et qui ne me les a jamais rendus !)
> - chercher rapidement par titre ou auteur
> - voir mes statistiques (nombre lu cette année, genre préféré, etc.)
>
> Idéalement accessible depuis mon téléphone aussi. Je n'ai pas envie d'apprendre
> un truc compliqué. Budget serré.
>
> Quand pouvez-vous me proposer quelque chose ?
>
> Marie

## ✅ Livrables attendus

Tu vas produire un **dossier d'analyse** dans `canevas/` (à compléter), composé de :

### 1. `01-personas.md` — Persona principal

Décris Marie en persona structuré : objectifs, frustrations, compétences tech, phrase-clé. Ajoute un persona secondaire si pertinent (ex. ami emprunteur).

### 2. `02-user-stories.md` — 5 user stories prioritaires

Format INVEST + critères d'acceptation Gherkin. Inclus la priorisation MoSCoW.

### 3. `03-mcd.md` — Modèle de données

- **MCD** en Mermaid ER diagram (entités, associations, cardinalités)
- **MLD** : transformation en tables avec clés
- **MPD** : SQL `CREATE TABLE` PostgreSQL pour 4–6 tables

### 4. `04-c4-architecture.md` — Architecture cible

- C4 niveau 1 (Context) en Mermaid
- C4 niveau 2 (Container) en Mermaid
- Une stack proposée justifiée (langage, framework, hébergement)

### 5. `05-adr-001-stack.md` — Architecture Decision Record

Choix de la stack technique au format ADR (Statut / Contexte / Décision / Conséquences / Alternatives).

### 6. `06-wireframe.md` — Wireframe basse fidélité

Wireframe ASCII (ou capture Excalidraw exportée en PNG) de la **page principale** (liste des livres) en mobile et desktop.

## ✅ Critères d'acceptation pour ton dossier

Ton dossier doit :

- [ ] Avoir **un persona principal** documenté avec phrase-clé
- [ ] Inclure **5 user stories** au moins, dont 3 critères Gherkin chacune
- [ ] Présenter une **priorisation MoSCoW** explicite (~60% Must, 20% Should, 20% Could)
- [ ] Avoir un **MCD lisible** avec au moins 3 entités et leurs cardinalités
- [ ] Inclure le **SQL CREATE TABLE** correspondant, avec types et contraintes
- [ ] Présenter une **archi C4 niveaux 1 et 2** cohérente avec le besoin (pas surdimensionnée)
- [ ] Avoir un **ADR** avec au moins 2 alternatives explicitement écartées et motivées
- [ ] Inclure un **wireframe** mobile + desktop de la page principale
- [ ] Tenir en **~10 pages** au total (concis > exhaustif)

## 💡 Indices

<details>
<summary>1. Quelles entités identifier ?</summary>

Re-lis le brief en notant les **noms communs** (ce qui devient souvent des entités) :
- livre, auteur, catégorie/genre, prêt, ami/emprunteur, statut de lecture

Pas tout n'a besoin d'être une entité ! « Statut de lecture » peut être un simple `enum` sur la table livre.
</details>

<details>
<summary>2. Quelle stack proposer ?</summary>

Marie a un budget serré et ne veut pas apprendre. C'est un cas typique pour :
- **JAMstack** : Next.js + Supabase + Vercel — tout gratuit jusqu'à un certain point
- **Monolithe simple** : Laravel/Django + Postgres sur un VPS
- **No-code** : Notion ou Airtable adapté ?

L'ADR doit justifier pourquoi tu as choisi l'un et pas les autres.
</details>

<details>
<summary>3. Comment prioriser les 5 user stories ?</summary>

Reviens au brief et identifie ce qui résout **le problème principal** : « je perds le fil ».
- Listing des livres + recherche = Must
- Marquer lu/à lire = Must
- Suivi des prêts (la frustration explicite !) = Must
- Stats = Could ou Should
- Photo de couverture = Could (au début, juste un titre suffit)
</details>

## 🔑 Correction

Une fois ton dossier complet (ou si tu sèches sur une partie), regarde [`correction/`](./correction/) pour comparer.

## 📚 Pour aller plus loin

- Refais le même exercice sur un brief plus exotique (gestion de courses, suivi sportif, planning de groupe).
- Mène un vrai entretien avec un ami sur sa façon d'organiser ses livres (ou autre chose). Compare ses besoins réels avec ce que Marie « disait ».
- Implémente la V1 de cette bibliothèque — bon prochain mini-projet.
