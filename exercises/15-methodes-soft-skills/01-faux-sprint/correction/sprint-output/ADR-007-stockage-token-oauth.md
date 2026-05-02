# ADR-007 — Stockage chiffré des tokens OAuth provider

**Date** : 2026-04-30
**Statut** : accepté
**Décideurs** : @alice (lead), @bob (auteur), @carol (front)

## Contexte

Suite à l'introduction d'OAuth GitHub (TASK-101), nous devons stocker durablement le `access_token` GitHub :

- pour pouvoir interroger `/user/orgs`, `/user/repos` côté serveur quand l'utilisateur est offline,
- pour permettre la révocation côté GitHub si un compte est compromis.

Le token GitHub a un **scope** `read:user user:email` — pas critique mais pas anodin (lecture d'orgs privées si l'user en a).

L'app gère ~5k utilisateurs aujourd'hui, prévision 50k en 18 mois. Postgres 17 hébergé sur Fly Managed Postgres.

## Décision

Nous stockons les tokens OAuth **chiffrés** en colonne `oauth_accounts.token_encrypted` (TEXT) :

- Algorithme : **AES-256-GCM**, clé 256 bits.
- IV unique par enregistrement, stocké préfixé au ciphertext (12 octets).
- Tag GCM 16 octets vérifié au déchiffrement.
- Clé maître `ENCRYPTION_KEY` lue depuis env (Fly secret).
- Helpers `encrypt(plain)` / `decrypt(cipher)` dans `src/crypto.ts`.

**Pas de KMS externe** pour V1 — Fly secrets suffisent compte tenu de la sensibilité.

## Conséquences

### Positives
- **Confidentialité au repos** garantie même si dump DB exfiltré.
- **Auditabilité** : tout accès passe par le helper `decrypt()` qu'on peut logger.
- **Migration future** vers KMS (AWS, GCP, Vault) facilitée par l'abstraction du helper.

### Négatives
- Coût CPU négligeable (~0,5 ms par chiffrement, sans impact perceptible).
- **Rotation de la clé** = procédure manuelle (ré-encryption batch). Documenté dans `runbooks/rotate-encryption-key.md`.
- Si `ENCRYPTION_KEY` est perdue, **toutes les sessions OAuth sont irrécupérables** — l'utilisateur devra se reconnecter. Acceptable car c'est un access_token, pas une donnée fonctionnelle.

### Alternatives écartées

#### A. Stockage en clair
- **Refus** : risque inacceptable en cas de fuite DB (RGPD + crédibilité).

#### B. KMS (AWS, GCP, Vault) dès V1
- **Refus pour V1** : complexité d'intégration disproportionnée pour notre échelle. À reconsidérer en V2 si on déploie multi-cloud ou si compliance fort.

#### C. Hash one-way (bcrypt-like)
- **Refus** : on a besoin de **récupérer** le token pour appeler GitHub côté serveur, donc chiffrement réversible obligatoire.

#### D. Crypto natif Node `crypto.subtle` vs lib externe
- **Choix** : Node `crypto` natif (`createCipheriv`/`createDecipheriv`). Pas de dépendance.

## Références

- TASK-101 — Implémentation
- RFC-014 — Authentification multi-provider
- OWASP Cryptographic Storage Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html
