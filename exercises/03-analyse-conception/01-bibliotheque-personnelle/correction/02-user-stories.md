# User stories — bibliothèque personnelle

Priorisation MoSCoW indiquée à droite.

---

## US-01 — Lister tous mes livres `[Must]`

**En tant que** Marie,
**je veux** voir la liste complète de mes livres avec titre, auteur, statut de lecture,
**afin de** savoir ce que je possède sans fouiller dans mes étagères.

### Critères

```gherkin
Étant donné que ma bibliothèque contient des livres
Quand j'ouvre la page d'accueil
Alors je vois la liste paginée de tous mes livres
Et chaque ligne montre titre, auteur, statut (lu / non lu / en cours)
Et je peux trier par titre, auteur, ou date d'ajout
```

---

## US-02 — Ajouter un livre `[Must]`

**En tant que** Marie,
**je veux** ajouter rapidement un livre en saisissant un ISBN ou en remplissant manuellement,
**afin d'** avoir une collection à jour sans perdre de temps.

### Critères

```gherkin
Étant donné que je veux ajouter un livre
Quand je saisis un ISBN valide
Alors le système pré-remplit titre, auteur, image de couverture (via Open Library API)
Et je peux ajouter / corriger des champs avant de valider

Et quand je n'ai pas l'ISBN
Alors je peux saisir manuellement titre, auteur, genre
```

---

## US-03 — Marquer un livre comme lu/à lire/en cours `[Must]`

**En tant que** Marie,
**je veux** changer le statut de lecture d'un livre en un clic,
**afin de** savoir où j'en suis sans réfléchir.

### Critères

```gherkin
Étant donné que je vois un livre dans ma liste
Quand je clique sur l'icône de statut
Alors le statut bascule entre 3 valeurs : non lu → en cours → lu → non lu
Et la date de lecture est enregistrée quand le statut passe à « lu »
```

---

## US-04 — Suivre mes prêts `[Must]`

**En tant que** Marie,
**je veux** noter à qui j'ai prêté un livre et depuis quand,
**afin de** récupérer mes livres prêtés et oubliés.

### Critères

```gherkin
Étant donné que je sélectionne un livre
Quand je clique sur « prêter »
Alors je peux saisir un nom (texte libre) et une date
Et le livre apparaît avec un badge orange « prêté à X depuis Y jours »

Et quand je le récupère
Alors je clique « rendu » et le badge disparaît
```

---

## US-05 — Chercher dans ma bibliothèque `[Must]`

**En tant que** Marie,
**je veux** chercher un livre par titre ou auteur,
**afin de** retrouver instantanément un livre dans une collection de centaines.

### Critères

```gherkin
Étant donné que ma bibliothèque contient 300 livres
Quand je tape « tolkien » dans la barre de recherche
Alors je vois en moins de 200 ms tous les livres dont titre ou auteur contient « tolkien »
Et la recherche est insensible à la casse et aux accents
```

---

## US-06 — Statistiques `[Should]`

**En tant que** Marie,
**je veux** voir mes statistiques de lecture (nombre lu cette année, genre préféré),
**afin de** suivre mes habitudes de lecture.

```gherkin
Quand je vais sur la page Stats
Alors je vois : nombre de livres lus cette année, top 3 des genres lus,
livre le plus ancien dans la liste « à lire »
```

---

## Won't have (V1 explicitement reportées)

- Échange / partage public avec d'autres utilisateurs (pas demandé)
- Synchronisation avec Goodreads (complexité d'API, V2 si besoin)
- Application mobile native (la web responsive suffit largement pour Marie)
- Système de notation à étoiles (Marie n'a pas exprimé ce besoin)
- Photo manuelle de la couverture (l'ISBN + Open Library suffisent)

## Répartition MoSCoW

- **Must** : 5 stories (≈ 70 %) — couvre les besoins exprimés explicitement
- **Should** : 1 story (≈ 15 %) — bonus apprécié mais pas vital
- **Could** : 0 (V1 reste minimaliste)
- **Won't** : 5 — explicitement reportées
