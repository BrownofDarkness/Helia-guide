# Lean Canvas — Tasky Pro (side-SaaS)

> Exemple rempli — projet fictif d'Alice Dupont. Cas : SaaS de gestion de tâches d'équipe avec auth Google + sub Stripe. Cible : startups 5–30 personnes mécontentes de Notion / Asana sur la lourdeur.

## 1. Problème (top 3)

1. Notion / Asana ont **20+ features inutiles** quand on est 5 personnes — courbe d'apprentissage qui repousse les nouvelles recrues.
2. Le **prix par siège** s'envole quand on est 15+ ($10–20/seat/mois × 15 = $150–300/mois).
3. **Pas d'API simple** pour automatiser des workflows métier (hooks Zapier facturent à la tâche, lents).

**Solutions actuelles** (workarounds, concurrents) :
- Notion / Asana / Linear / ClickUp — tous trop lourds pour < 30 personnes.
- Trello — gratuit mais primitif, pas d'API moderne.
- Google Sheets + Slack — gratuit mais aucun process.

## 2. Segments clients

- **Cible primaire** : startups SaaS B2B, 5–30 personnes, équipe technique majoritaire.
- **Early adopters** : équipes qui **ont déjà migré 2+ fois** d'outil de gestion en 2 ans (douleur prouvée). Souvent le CTO/lead ops.

## 3. Proposition de valeur unique

> **« La gestion de tâches d'une équipe de 5 à 30 personnes — sans le bagage Notion. 30 secondes d'onboarding, API REST native, $5/seat. »**

**High-level concept** : « Linear pour les équipes qui ne sont pas des géants tech ».

## 4. Solution

- Auth OAuth Google (1 clic).
- 5 features uniquement : tâches, projets, vues filtrées, commentaires, assignations.
- API REST publique gratuite (rate-limit) + webhooks signés.
- Import CSV depuis Asana / Notion / Trello en 1 clic.
- Pas de drag-and-drop visuel custom — clavier first (Cmd+K everywhere).

## 5. Canaux

- **Content marketing** : 1 post technique / semaine sur dev.to + IndieHackers (« comment on a buildé un SaaS multi-tenant en 80 h »).
- **Lancement Product Hunt** au mois 4 (pré-lancement Twitter).
- **Pas de SEO direct** au début — long terme.
- **Bouche-à-oreille** Slack communautés (Reflect, BootstrappedFounders, Rands).
- **Free tier généreux** (jusqu'à 10 users) — viralité au sein de l'équipe.

## 6. Sources de revenus

| Plan | Prix | Cible | Estimation 12 mois |
|------|------|-------|---------------------|
| Free | $0 | < 10 users | Volume + lead gen |
| Team | $5/seat/mois | 10–30 users | **Cœur de cible** |
| Business | $9/seat/mois | 30+ users | Long terme |
| API self-host | $200/mois flat | gros clients privés | Niche |

**Hypothèse 12 mois** : 50 équipes × 12 seats × $5 = **$3000 MRR**.

## 7. Structure de coûts

- **Infra** : Vercel + Fly Postgres + Sentry + Resend = ~$50/mois.
- **Outils** : Linear (interne), Figma, GitHub Pro = $30/mois.
- **Marketing** : $0 au début, $200/mois après mois 6 (ads ciblées).
- **Mon temps** : 12 h/semaine × 50 semaines = 600 h. À TJM 850 = **510 K€ de coût d'opportunité** (mais c'est du soir / week-end).

**Break-even infra** : ~10 équipes payantes (~$600 MRR couvre infra + outils + ads).

## 8. Métriques clés

- **Activation rate** : % d'équipes qui invitent un 2e user dans les 7 jours après signup.
- **Conversion free → paid** : cible 5 % à 90 jours.
- **MRR croissance** : objectif +30 % par mois les 6 premiers mois.
- **Churn mensuel** : < 5 % (au-dessus = produit pas adopté).
- **NPS** : > 40 dès la V1.

## 9. Avantage déloyal

> ⚠️ **Honnêtement, je n'ai pas d'avantage déloyal solide à ce stade.**

Ce que je **n'ai pas** :
- Pas de réseau client pré-existant.
- Pas de donnée propriétaire.
- Pas de marque / communauté installée.

Ce que je **construis** :
- **Connaissance domaine** : 5 ans dans des équipes de 5–30, douleur vécue.
- **Vitesse d'exécution** : full-stack solo capable de shipper 1 feature / semaine.
- **Audience** : 1500 followers tech sur Twitter à shipping → ~5K en 6 mois si je publie régulièrement.

**À 12 mois si traction** : la communauté autour du projet devient l'avantage. Avant ça, je dois assumer que je suis vulnérable et compenser par la **qualité du produit** + le **prix imbattable**.

---

## Auto-évaluation

- ✅ Problème vécu personnellement (j'étais le CTO qui migrait Notion → Linear → Asana → Notion en 2 ans).
- ✅ Segment précis (taille d'équipe, profil tech).
- ⚠️ Avantage déloyal **faible** — assumé. Stratégie de compensation explicite.
- ✅ Métriques chiffrées et atteignables.
- ✅ Structure de coûts honnête (j'inclus le coût d'opportunité).
