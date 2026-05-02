# Wireframe — page principale (liste des livres)

## Mobile (< 768 px)

```
┌──────────────────────────────────┐
│ ☰   Ma Bibliothèque         🔍   │  ← header sticky
├──────────────────────────────────┤
│                                  │
│ ┌──────────────────────────────┐ │
│ │ 🔍 Chercher titre, auteur…   │ │  ← barre recherche
│ └──────────────────────────────┘ │
│                                  │
│ Filtres : [tous ▾] [statut ▾]   │
│                                  │
│ ────────────────────────────     │
│ ┌────┐  Le seigneur des anneaux  │
│ │ 📕 │  J. R. R. Tolkien         │  ← carte livre
│ └────┘  ✓ Lu        ⋮           │
│ ────────────────────────────     │
│ ┌────┐  1984                     │
│ │ 📘 │  George Orwell            │
│ └────┘  📤 Prêté à Paul (12j)    │  ← badge prêt
│ ────────────────────────────     │
│ ┌────┐  Sapiens                  │
│ │ 📗 │  Y. N. Harari             │
│ └────┘  📖 En cours    ⋮        │
│ ────────────────────────────     │
│                                  │
├──────────────────────────────────┤
│        ➕ (FAB)                  │  ← bouton ajout flottant
└──────────────────────────────────┘
```

## Desktop (≥ 1024 px)

```
┌────────────────────────────────────────────────────────────────┐
│  📚 Ma Bibliothèque         🔍 …            👤 Marie ▾         │  ← header
├────────────┬───────────────────────────────────────────────────┤
│  Filtres   │  📚 Mes livres  ·  Lus 142 / À lire 18 / Prêtés 3 │
│            │                                                   │
│  Statut    │  ┌──────────┬──────────┬──────────┬──────────┐    │
│  ☐ Tous    │  │  📕      │  📘      │  📗      │  📕      │    │
│  ☐ Non lu  │  │ Tolkien  │ Orwell   │ Harari   │ ...      │    │
│  ☑ Lu      │  │ ✓ Lu     │ 📤 Prêté │ 📖 En c. │          │    │
│  ☐ Prêté   │  └──────────┴──────────┴──────────┴──────────┘    │
│            │                                                   │
│  Genre     │  ┌──────────┬──────────┬──────────┬──────────┐    │
│  ☐ Roman   │  │ ...      │ ...      │ ...      │ ...      │    │
│  ☐ Essai   │  │          │          │          │          │    │
│  ☐ ...     │  └──────────┴──────────┴──────────┴──────────┘    │
│            │                                                   │
│  + Ajouter │  ← Précédente    page 1 sur 8    Suivante →       │
└────────────┴───────────────────────────────────────────────────┘
```

## Notes de design — lois UX appliquées

- **Loi de Hick** : un seul CTA principal (« + Ajouter »), pas de menu surchargé.
- **Loi de Fitts** : sur mobile, FAB en bas à droite (zone du pouce naturelle, cible accessible 44×44+ px). Sur desktop, l'ajout est en bord de sidebar (proche infini).
- **Loi de Miller** : 4 colonnes max sur desktop — au-delà la lecture diagonale devient pénible.
- **Loi de Jakob** : recherche en haut (convention universelle), avatar utilisateur en haut à droite, FAB à la Material Design.
- **Mobile-first** : la version mobile a été dessinée d'abord ; le desktop ajoute filtres latéraux et plus de colonnes, sans repenser la structure.

## Composants identifiés (pour le design system)

- `BookCard` (variants : compact mobile, grid desktop)
- `Badge` (variants : statut lu, en cours, prêté)
- `SearchBar`
- `FilterSidebar` (desktop) / `FilterDrawer` (mobile)
- `FloatingActionButton` (mobile)
- `Pagination`

## Wireframe Excalidraw / Figma

(En vrai projet, on exporterait un PNG ici. Le wireframe ASCII suffit pour l'apprentissage.)
