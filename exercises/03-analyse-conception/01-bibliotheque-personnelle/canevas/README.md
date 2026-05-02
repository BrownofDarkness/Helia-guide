# Canevas — Bibliothèque personnelle

> Pas de code dans cet exercice. Tu reçois un email flou d'une amie (« j'ai des centaines de livres, je perds le fil ») et tu dois en sortir un **dossier d'analyse exécutable** que tu pourrais donner à un dev pour qu'il code la V1 sans avoir besoin de te poser une seule question.

## Ce que tu vas faire

Tu remplis 6 fichiers, dans cet ordre :

| Étape | Fichier | Ce qui sort |
|-------|---------|-------------|
| 1 | `01-personas.md` | Marie + un persona secondaire si pertinent (l'ami emprunteur ?) |
| 2 | `02-user-stories.md` | 5 stories au format INVEST + critères Gherkin + priorisation MoSCoW |
| 3 | `06-wireframe.md` | Wireframe ASCII mobile + desktop de la page principale |
| 4 | `03-mcd.md` | MCD Mermaid → MLD → SQL `CREATE TABLE` Postgres |
| 5 | `04-c4-architecture.md` | C4 niveau 1 (Context) + niveau 2 (Container) + stack proposée |
| 6 | `05-adr-001-stack.md` | ADR de la stack avec ≥ 2 alternatives écartées et motivées |

À la fin, tu auras vécu **le truc le moins enseigné en autodidacte mais le plus rentable en pro** : transformer un besoin en plan.

## Pré-requis

Aucun outil à installer. Juste un éditeur Markdown.

Optionnel : un compte gratuit sur [excalidraw.com](https://excalidraw.com/) si tu préfères dessiner ton wireframe à la main et exporter en PNG (vs ASCII art).

## Démarrer

Ouvre `01-personas.md` et lis le tableau vide. Avant d'écrire quoi que ce soit, **relis le brief client dans `../README.md`** et surligne :

- les **noms communs** (« livres », « auteur », « ami », « prêt »…) → futurs candidats à entité
- les **frustrations** explicites (« je perds le fil », « ne me les a jamais rendus ! ») → priorités absolues
- les **contraintes implicites** (« téléphone », « budget serré », « pas envie d'apprendre ») → influencent la stack

C'est ce passage de surlignage qui vaut la moitié de l'exercice. Ne l'ignore pas.

## Ordre suggéré (et pourquoi)

```
1. Personas      → savoir POUR QUI on conçoit
2. User stories  → savoir QUOI livrer en premier
3. Wireframe     → cristalliser la story principale en UI
4. MCD           → identifier les données nécessaires aux stories
5. C4            → choisir HOW (mais maintenant tu sais quoi)
6. ADR           → justifier ton choix de stack par écrit
```

Si tu fais le MCD avant les stories, tu modélises ce qui pourrait servir, pas ce qui doit servir. La donnée suit le besoin, pas l'inverse.

## Critères d'acceptation

Re-lis `../README.md` § « Critères d'acceptation pour ton dossier ». En résumé :

- 1 persona principal (phrase-clé incluse)
- 5 stories minimum, 3 critères Gherkin chacune, MoSCoW explicite
- MCD ≥ 3 entités + cardinalités + SQL avec types et contraintes
- C4 niveaux 1 + 2 cohérents avec le besoin (pas surdimensionné)
- ADR avec ≥ 2 alternatives explicitement écartées
- Wireframe mobile + desktop de la page principale
- Le tout en ~10 pages au total

## Bloqué ?

- **Tu hésites entre persona principal et secondaire** → Marie est l'utilisatrice du système. Paul (ami emprunteur) ne se logge pas, il *interagit avec* Marie. Persona secondaire = quelqu'un dont les besoins influencent la conception sans être l'utilisateur direct.
- **Tu listes 30 user stories** → tu sur-imagines. Reviens au brief : 5 besoins explicites + 1 nice-to-have (les stats). Le reste appartient à la V2.
- **Tu mets « statut de lecture » comme entité séparée** → trois valeurs fixes (`à lire`, `en cours`, `lu`), jamais de jointure utile dessus → un `enum` suffit. Modéliser pour modéliser, c'est de la dette.
- **Tu hésites entre Next.js+Supabase et Laravel+VPS** → c'est exactement la question que doit trancher l'ADR. Liste les 2 options avec leurs conséquences (coût, dette opérationnelle, courbe d'apprentissage, vendor lock-in). La bonne réponse dépend du contexte que tu écris dans l'ADR.
- **Tu sèches sur le wireframe** → ASCII art suffit. Pas besoin de Figma. Une boîte = un bloc, le but est de fixer la **structure** de la page, pas son look.

## Ne commit pas

Aucun secret n'est attendu pour cet exercice. Si tu fais ton wireframe en PNG, vérifie que tu n'as rien d'autre dans le screenshot (notification email…).

## Comparer avec la correction

Quand ton dossier est complet, ouvre `../correction/`. Compare **point par point**, pas en bloc — tu vas voir des choix différents (c'est normal) et ce qui compte c'est que tes choix soient **justifiables**, pas identiques.
