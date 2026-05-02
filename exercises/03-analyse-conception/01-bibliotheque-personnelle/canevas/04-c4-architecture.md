# Architecture C4

## Niveau 1 — Context

> Le système entouré de ses utilisateurs et systèmes externes.

```mermaid
flowchart TB
  User((Marie))
  %% TODO: ajouter d'autres acteurs si pertinents
  
  subgraph Système
    Sys[Bibliothèque perso]
  end
  
  %% TODO: services externes (auth, stockage images, etc.)

  User --> Sys
```

## Niveau 2 — Container

> Le système éclaté en blocs déployables (front, back, base, etc.).

```mermaid
flowchart TB
  User((Marie))
  
  subgraph Système
    %% TODO: SPA, API, DB, etc.
  end
```

## Stack technique proposée

| Couche | Technologie | Pourquoi |
|--------|-------------|----------|
| Frontend | | |
| Backend / API | | |
| Base de données | | |
| Auth | | |
| Hébergement | | |

## Estimation

- **Volume V1** : ~ X user stories, Y jours-homme
- **Coût mensuel d'infra** : ~ Z € (justifier)
