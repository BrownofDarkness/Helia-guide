# ADR-0001 : Découpage modulaire du pricing par responsabilité

## Statut

Accepté — 2026-04-29

## Contexte

Le code initial regroupait toute la logique de pricing dans une fonction unique de
~80 lignes (`computeOrderTotal`). Cette fonction mélangeait :

- itération sur les items (cart logic)
- application de promotions (discount logic)
- calcul de TVA (vat logic)
- calcul des frais de port (shipping logic)
- formatage de l'affichage

Conséquences observées :
- Tests difficiles : impossible de tester la TVA sans monter un panier complet.
- Bug-prone : ajouter une nouvelle promotion modifie une fonction qui touche à tout.
- Difficilement extensible (ex. promotions futures avec dates de validité).

## Décision

Découper le pricing en **5 modules** par responsabilité :

| Module | Responsabilité |
|--------|---------------|
| `cart.ts` | Calcul du sous-total et comptage des items |
| `discount.ts` | Application des codes promo + bonus VIP |
| `vat.ts` | Calcul de la TVA |
| `shipping.ts` | Calcul des frais de port |
| `format.ts` | Formatage cents → string `"$X.XX"` |
| `pricing.ts` | Orchestrateur : compose les modules ci-dessus |

Chaque module **n'a qu'une raison de changer** (Single Responsibility Principle).

## Conséquences

✅ Tests unitaires triviaux : chaque module testé isolément, ~5-10 tests par module.
✅ Couverture > 95 % atteinte sans effort.
✅ Ajout d'une nouvelle promotion = modification de `discount.ts` uniquement.
✅ Constantes (TVA, seuils) extraites dans `constants.ts` — modifiables sans toucher la logique.

❌ Plus de fichiers (5 modules + constantes + types vs 1 fichier).
❌ Légère indirection : un nouveau dev doit lire `pricing.ts` puis suivre les imports.

Le compromis est largement positif : la testabilité et l'extensibilité gagnés valent
l'overhead de quelques fichiers supplémentaires.

## Alternatives considérées

### A — Garder une seule fonction avec sous-fonctions privées

```ts
function computeOrderTotal(input: OrderInput): OrderResult {
  function computeSubtotal() { ... }
  function applyDiscount() { ... }
  // ...
}
```

❌ Sous-fonctions non testables (privées au scope de la fonction parente).
❌ Pas réutilisable si on veut juste calculer une TVA ailleurs.

### B — Pattern Strategy (classes Discount, FlatDiscount, etc.)

```ts
class PercentDiscount implements DiscountStrategy { ... }
class FlatDiscount implements DiscountStrategy { ... }
```

❌ Sur-ingénierie pour 4 codes promo. La simple `Record<string, DiscountRule>`
   suffit et reste extensible.

✅ À reconsidérer si on dépasse 20+ types de promotions ou si elles deviennent
   contextuelles (combos, périodes, segmentation).

## Révision

À ré-évaluer si le pricing devient asynchrone (ex. récupération des promotions
depuis une DB), ou si on doit gérer plusieurs devises.
