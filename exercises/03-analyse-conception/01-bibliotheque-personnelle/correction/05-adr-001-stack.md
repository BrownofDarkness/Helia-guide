# ADR-001 — Choix de la stack technique

## Statut

Accepté — 2026-04-29

## Contexte

Marie souhaite gérer sa bibliothèque personnelle (~ centaines de livres). Contraintes :

- **Mono-utilisatrice** (au moins en V1).
- **Budget** très serré, idéalement zéro.
- **Pas de compétences techniques** : Marie ne veut pas maintenir un serveur, pas configurer un déploiement.
- **Mobile-first** : usage principal depuis son iPhone.
- **Time-to-market** court : MVP utilisable en quelques semaines.

## Décision

**Stack JAMstack basée sur Next.js + Supabase + Vercel** :

- Next.js 15 (App Router) + Tailwind CSS pour le frontend et les API routes
- Supabase pour PostgreSQL managé, Auth (magic link) et Storage des couvertures
- Vercel pour l'hébergement (déploiement automatique depuis Git)

## Conséquences

✅ **Coût zéro** sur les free tiers Vercel et Supabase, largement suffisants pour l'usage personnel projeté.
✅ **Zéro infrastructure à gérer** : pas de serveur, pas de Kubernetes, pas de pipeline de déploiement compliqué.
✅ **HTTPS automatique** sur Vercel, certificat Let's Encrypt géré.
✅ **Stack moderne** mais pas exotique — facile à transmettre à un autre dev plus tard.
✅ **Évolutif** si Marie veut ouvrir l'app à des amis : Supabase gère multi-utilisateurs nativement (RLS).

❌ **Vendor lock-in léger** : Vercel et Supabase ont leurs spécificités. Migration possible mais demande un effort.
❌ **Free tier limité** : 500 Mo de DB, 1 Go de bande passante — largement OK ici, mais pas extensible à des milliers d'utilisateurs sans payer.
❌ **Cold start** des API routes Vercel : 200–500 ms à la 1re requête après inactivité. Acceptable pour un usage perso.

## Alternatives considérées

### A — VPS classique (OVH ~5 €/mois) avec Laravel ou Django

❌ Marie ne veut pas administrer un serveur (mises à jour, sauvegardes, monitoring).
❌ Configuration HTTPS, déploiement à scripter manuellement.
❌ Pas zéro coût.
✅ Aurait été le bon choix si Marie avait l'envie d'apprendre l'ops.

### B — Notion ou Airtable (no-code)

❌ Pas de recherche full-text performante (Notion lent à grand volume).
❌ Personnalisation limitée (couleurs, ergonomie spécifique).
❌ Coût mensuel après free tier (10 €/mois sur Notion).
✅ Aurait été tentant pour un MVP en 1 heure si la recherche n'était pas critique.

### C — App native iOS (Swift) + iCloud

❌ Coût Apple Developer (99 €/an).
❌ Marie n'utilise pas son ordinateur ? À vérifier — mais idéalement on veut tout web pour ne pas re-développer.
❌ Time-to-market plus long.

### D — Microservices avec Kubernetes

❌ Délire complet pour 1 utilisateur. Sur-ingénierie évidente.

## Révision

À ré-évaluer si Marie veut ouvrir à plusieurs utilisateurs (>10 actifs) ou si le volume dépasse 1000 livres avec usage intensif.
