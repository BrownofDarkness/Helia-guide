# PR #42 — feat(auth): GitHub OAuth route (TASK-101)

> Trace de revue de cette PR — pédagogique. Les commentaires suivent
> [Conventional Comments](https://conventionalcomments.org/).

## Description (auteur)
Ajoute le flow OAuth GitHub côté API : `/auth/github/login` (init) et
`/auth/github/callback` (échange code → session). Stocke le token GitHub chiffré
en base. Lié à TASK-101 et RFC-014.

## Comment tester
1. `npm install && npm run db:migrate`
2. Configurer une OAuth App GitHub : `http://localhost:3000/auth/github/callback`
3. Coller `GITHUB_CLIENT_ID` et `GITHUB_CLIENT_SECRET` dans `.env`
4. `npm run dev`, ouvrir `http://localhost:3000/auth/github/login`

## Captures
*(Loom de 1 min jointe)*

---

## Commentaires reviewer (@alice)

### `src/routes/auth/github.ts:34`

```ts
const code = c.req.query('code');
const stateParam = c.req.query('state');
// ...
const session = await exchangeCode(code);
```

**alice — issue (blocking):** la valeur `state` est lue mais jamais comparée à un état signé / stocké. Un attaquant peut déclencher un callback arbitraire sans avoir initié le flow → CSRF.

→ Suggestion : signer `state` au `/login` (HMAC + nonce) et vérifier au `/callback` (incl. expiration < 10 min). Voir RFC-014 §3.2.

### `src/routes/auth/github.ts:51`

```ts
const userInfo = await fetch('https://api.github.com/user', {
  headers: { Authorization: `Bearer ${token}` },
});
```

**alice — issue (blocking):** pas de timeout. Si GitHub timeout 30s, notre worker bloque pendant 30s.

→ Ajouter `AbortController` 5s + handler 503 si timeout.

### `src/routes/auth/github.ts:67`

```ts
const encrypted = encrypt(token);
db.insert(oauth_accounts).values({ user_id, token_encrypted: encrypted });
```

**alice — praise:** 👏 le chiffrement AES-256-GCM avec key rotation envisagée dès maintenant — propre.

**alice — suggestion (non-blocking):** extraire `encrypt`/`decrypt` dans `src/crypto.ts` partagé pour réutilisation par les futurs providers (TASK-106 prépare ça).

### `tests/auth/github.test.ts:12`

**alice — question:** est-ce que le test couvre le cas « email privé » (l'utilisateur n'a pas activé son email public) ? Si non, ajouter — c'est un edge case courant.

### Global

**alice — chore:** typo dans le commit message « auth/git_hub » → « auth/github »

---

## Réponses auteur (@bob)

> @alice Excellent feedback, merci.
>
> 1. **state CSRF** : tu as raison — j'avais commencé l'implémentation et oublié de finir.
>    Push d'un commit avec HMAC + nonce + expiration 10 min. AC #1 mis à jour.
> 2. **Timeout fetch** : ajouté `AbortController` 5s + 503 explicite.
> 3. **Extract `encrypt`/`decrypt`** : fait, dans `src/crypto.ts` avec tests unitaires dédiés.
> 4. **Test email privé** : ajouté, fait fail puis pass.
> 5. **Typo commit** : rebase + force-push ✅

## Statut final
✅ approve par @alice après les 5 commits suivants.
✅ approve par @carol (review front, OK pour eux).
Mergé.

---

## Bilan reviewer

| Type de commentaire | Nombre |
|---------------------|--------|
| `praise:` | 1 |
| `issue (blocking):` | 2 |
| `suggestion (non-blocking):` | 1 |
| `question:` | 1 |
| `chore:` | 1 |

Ratio sain : 1 praise pour 2 critiques bloquantes, suggestions non bloquantes
explicites. La discussion a duré ~ 30 min étalée sur 2 jours (pas un blocage).
