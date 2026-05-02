# Correction — Bibliothèque personnelle

> Cet exercice n'a pas **une** bonne réponse. Il a **des bonnes réponses**, qui se distinguent par la qualité de la justification, pas par le contenu exact.
>
> Cette correction présente **un** dossier d'analyse cohérent. Si tu as choisi Laravel + VPS au lieu de Next.js + Supabase, et que ton ADR le justifie proprement, ta réponse est aussi valide. Le but est de t'apprendre à **défendre des choix**, pas à les recopier.

## Sommaire

1. [Vue d'ensemble du dossier](#1-vue-densemble-du-dossier)
2. [Décisions principales et leur logique](#2-décisions-principales-et-leur-logique)
3. [Le piège n°1 — sur-modélisation](#3-le-piège-n1--sur-modélisation)
4. [Le piège n°2 — sur-ingénierie d'architecture](#4-le-piège-n2--sur-ingénierie-darchitecture)
5. [Le piège n°3 — tout en Must](#5-le-piège-n3--tout-en-must)
6. [Auto-évaluation : ce que ton dossier devrait vérifier](#6-auto-évaluation--ce-que-ton-dossier-devrait-vérifier)
7. [Pièges réels rencontrés](#7-pièges-réels-rencontrés)
8. [Pour aller plus loin](#8-pour-aller-plus-loin)

---

## 1. Vue d'ensemble du dossier

| Fichier | Contenu | Volume |
|---------|---------|--------|
| `01-personas.md` | Marie (principale) + Paul (secondaire — l'emprunteur) | ~1 page |
| `02-user-stories.md` | 6 stories Must/Should + 5 Won't explicites | ~2 pages |
| `03-mcd.md` | MCD Mermaid → MLD → SQL Postgres avec index | ~2 pages |
| `04-c4-architecture.md` | C4 niveau 1 + 2, stack JAMstack | ~1.5 page |
| `05-adr-001-stack.md` | ADR avec 4 alternatives écartées | ~1.5 page |
| `06-wireframe.md` | ASCII mobile + desktop + lois UX | ~1 page |

**Total** : ~9 pages de Markdown. C'est volontairement court — un dossier d'analyse de 50 pages n'est jamais lu.

## 2. Décisions principales et leur logique

### 2.1 Pourquoi une JAMstack et pas un monolithe Laravel ?

Le critère décisif vient du brief de Marie : **« je n'ai pas envie d'apprendre un truc compliqué »**. Une stack 100 % managée (Vercel + Supabase) lui livre la valeur **sans dette opérationnelle** : pas de serveur à patcher, pas de SSL à renouveler, pas de backup à scripter.

Si Marie avait écrit « budget illimité, je veux contrôler 100 % », un VPS + Laravel aurait été plus pédagogique pour le dev (toi) et économique sur 5 ans. **Le choix dépend du contexte, pas de tes préférences techniques.**

### 2.2 Pourquoi 6 user stories et pas 30 ?

Re-lecture brute du brief :

| Phrase de Marie | Story |
|-----------------|-------|
| « lister tous mes livres avec photo de couverture » | US-01 (lister), US-02 (photo via ISBN) |
| « savoir lesquels j'ai lus, lesquels je veux lire » | US-03 (statut) |
| « savoir lesquels j'ai prêtés à qui » | US-04 (prêts) |
| « chercher rapidement par titre ou auteur » | US-05 (recherche) |
| « voir mes statistiques » | US-06 (stats) |

**Cinq besoins explicites + un nice-to-have.** Tout le reste (notations, partage social, app native, scan ISBN caméra) est **imaginé par le dev**, pas demandé. La discipline pédagogique de cet exercice : ne pas ajouter de stories juste parce qu'on a des idées.

### 2.3 Pourquoi un emprunteur en texte libre, pas une entité `personne` ?

Le brief ne mentionne **aucun login pour les amis**. Si on crée une entité `personne` aujourd'hui, on construit un système d'auth, des écrans de gestion d'amis, des relations FK… pour zéro besoin réel.

Quand Marie viendra dire « je veux que mes amis voient leur liste de prêts en cours », **alors** on créera l'entité. C'est le principe **YAGNI** appliqué à la modélisation : *You Aren't Gonna Need It* — modéliser pour le besoin actuel, pas le besoin imaginé.

### 2.4 Pourquoi un enum `statut` au lieu d'une table ?

Trois valeurs fixes (`non_lu`, `en_cours`, `lu`), pas évolutives, jamais de jointure utile dessus. Une table aurait ajouté une jointure pour zéro bénéfice — et un coût : un écran d'admin pour gérer les statuts, des migrations à chaque changement.

Règle : **enum si fixe et < 10 valeurs**, table si évolutif ou portant des attributs propres.

### 2.5 Pourquoi un index GIN full-text français ?

US-05 demande « chercher rapidement ». Sur 1000+ livres, un `WHERE titre ILIKE '%harry%'` fait un scan séquentiel. Un index GIN sur `to_tsvector('french', titre || ' ' || isbn)` permet la recherche en < 10 ms même à 100 000 livres.

C'est une décision de **performance pré-calculée**, pas une optimisation prématurée : on sait dès la modélisation que la recherche est centrale.

## 3. Le piège n°1 — sur-modélisation

Beaucoup d'apprenants sortent un MCD à 8 entités : `livre`, `auteur`, `co_auteur`, `traducteur`, `editeur`, `collection`, `etagere`, `note`, `tag`…

**Test mental** : pour chaque entité, *quelle story du brief la justifie* ? Si tu ne peux pas pointer une story, l'entité est de la dette.

| Entité ajoutée par excès | Justifiable par une story ? |
|--------------------------|-----------------------------|
| `editeur` | ❌ Marie n'a jamais demandé à filtrer par éditeur |
| `etagere` | ❌ Pas un besoin métier — gérable en filtre custom plus tard |
| `note` (rating) | ❌ Pas dans le brief — V2 si Marie le demande |
| `tag` | ❌ Idem |

**Garder uniquement ce que les stories exigent.** Le MCD juste-suffisant est un signe de maturité, pas un manque d'imagination.

## 4. Le piège n°2 — sur-ingénierie d'architecture

Tentation de débutant : « je vais faire des microservices, ça fait pro ». Pour 1 utilisatrice et 1000 livres ?

| Choix | Pourquoi non | Pourquoi oui |
|-------|--------------|--------------|
| Microservices | 1 utilisatrice. Aucun besoin de scaler indépendamment. Ça multiplie l'opérabilité par 5. | Si Marie ouvre une plateforme SaaS pour 100k clients : oui, splitter `auth` / `livres` / `prets`. |
| Event-driven (Kafka) | Pas de flux temps-réel, pas de découplage entre services (il n'y en a qu'un). | Si on faisait de l'analytics distribuée. Pas le cas. |
| Monorepo Nx + 4 apps | Aucune raison de séparer le front du back côté code. Une app Next.js fait les deux. | Si on avait un mobile natif + un dashboard admin séparés. |

**Le piège** : si l'architecture impressionne plus qu'elle ne sert, elle est mauvaise. Pour ce brief, le bon mot est **« simple »** — un monolithe Next.js + Supabase couvre tous les besoins en 200 lignes de code.

## 5. Le piège n°3 — tout en Must

Si tu prioritises 6 stories en MoSCoW et que tu écris :

> Must : 1, 2, 3, 4, 5, 6
> Should : (vide)
> Could : (vide)
> Won't : (vide)

→ **tu n'as rien priorisé.** MoSCoW marche seulement si tu as le courage de mettre des choses en Could et Won't.

La correction met **5 idées en Won't explicite** :

> ❌ Won't (V1) : notation par étoiles, partage public, app mobile native, import/export GoodReads, multi-utilisateurs.

Pourquoi rendre l'absence visible ? Parce que **« on n'aura pas X »** force le client à valider l'absence. Si Marie répond « ah si, je voudrais l'export », tu sais immédiatement qu'il faut renégocier le scope.

Sans Won't, tu vas re-découvrir le besoin **après le dev**, c'est-à-dire trop tard.

## 6. Auto-évaluation : ce que ton dossier devrait vérifier

Coche en lisant le tien à la suite (pas en parallèle de la correction) :

- [ ] **Le persona principal a une phrase-clé** qui pourrait être citée littéralement par Marie
- [ ] **Chaque story a 3 critères Gherkin** vérifiables (pas « le système doit être rapide » — combien de ms ?)
- [ ] **MoSCoW : ≥ 1 Won't explicite** (sinon tu n'as pas priorisé)
- [ ] **Le MCD a 3–5 entités, pas 8+** (ou bien tu peux justifier chacune par une story)
- [ ] **Le SQL inclut au moins 1 index** justifié par une story de recherche/listing
- [ ] **Le C4 niveau 2 montre où vit chaque container** (Vercel, Supabase, navigateur…)
- [ ] **L'ADR a ≥ 2 alternatives écartées** avec raison concrète (pas « moins bien »)
- [ ] **Le wireframe distingue mobile et desktop** dans la disposition (pas juste « plus petit »)

Si 6/8 sont coches, ton dossier est solide. Si < 4, **relis la section « Pièges »** et reprends.

## 7. Pièges réels rencontrés

Cet exercice étant **sans code**, les pièges sont conceptuels — mais ils reviennent dans tous les projets pros. Les trois pièges des sections 3–5 ci-dessus sont les classiques :

1. **Sur-modélisation** : ajouter des entités « au cas où ». Coût : migrations futures, écrans d'admin inutiles, code mort.
2. **Sur-ingénierie d'archi** : choisir une stack pour impressionner. Coût : opérabilité explosive, courbe d'apprentissage pour le client.
3. **Tout en Must** : pas de priorité = pas de plan. Coût : on découvre le scope-creep en cours de dev.

Tu retrouveras les mêmes patterns dans des contextes très différents — un MCP server qui a 12 tools quand 4 suffisent, un microservice qui a son propre Kafka pour 100 events/jour, un sprint qui contient 18 stories « critiques ».

## 8. Pour aller plus loin

- **Refais l'exercice sur un brief différent.** Brief de remplacement : « Mon père tient un petit commerce, il veut suivre ses commandes en ligne. Il a 70 ans, ne fait pas de tech ». Voir ce qui change dans tes choix vs Marie.
- **Mène un vrai entretien.** Trouve un proche qui collecte quelque chose (livres, vinyles, plantes, recettes…). Demande-lui comment il s'organise actuellement. Compare ses besoins **réels** avec ce que tu aurais imaginé pour lui. Il y aura des surprises — c'est tout l'intérêt.
- **Implémente la V1.** Cet exercice te donne le plan. Le projet de l'axe 5 ou 7 te demandera de coder une UI. Si tu boucles le dossier ici puis tu codes là, tu auras vécu le cycle complet besoin → conception → code.
- **Lis l'ADR de la correction puis écris le tien sur un sujet pro.** ADR sur le choix de ton ORM, de ton runtime, de ta lib de logs. C'est le format le plus utile au quotidien dans une équipe — et le moins enseigné.
