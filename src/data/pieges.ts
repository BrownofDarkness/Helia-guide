/**
 * Source de vérité des pièges réels rencontrés en construisant le guide.
 *
 * Chaque entrée capture un vrai bug — pas un cas hypothétique.
 * La page /pieges/ les liste tous, et certains sont aussi posés inline
 * dans les axes pertinents.
 *
 * Conventions :
 * - id : slug court, kebab-case
 * - category : 'deps' | 'build' | 'auth' | 'security' | 'tests' | 'perf' | 'a11y' | 'env' | 'cors' | 'db'
 * - axe : sous-axe pertinent ('8.0', '12.3', etc.) — le piège y sera idéalement posé inline
 */

export interface Piege {
  id: string;
  title: string;
  category:
    | 'deps'
    | 'build'
    | 'auth'
    | 'security'
    | 'tests'
    | 'perf'
    | 'a11y'
    | 'env'
    | 'cors'
    | 'db';
  axe: string;
  symptom: string;
  cause: string;
  fix: string;
  lesson: string;
  /** Date YYYY-MM-DD à laquelle le piège a été rencontré (optionnel, pour le journal) */
  date?: string;
}

export const pieges: Piege[] = [
  {
    id: 'foreach-await',
    title: '`await` dans `forEach` ne fait rien',
    category: 'tests',
    axe: '6.2',
    symptom: `// On attend que chaque insert finisse avant le suivant... pas vraiment.
items.forEach(async (item) => {
  await db.execute({ sql: 'INSERT ...', args: [item] });
});
console.log('done');  // s'affiche AVANT que les inserts soient finis`,
    cause: `\`Array.prototype.forEach\` **ignore** la valeur de retour du callback. Même si tu mets \`async\`, la Promise retournée n'est pas \`await\`-ée. Le code continue immédiatement, et tes inserts s'exécutent dans le désordre (souvent en parallèle).`,
    fix: `Utiliser \`for...of\` (séquentiel) ou \`Promise.all(.map(...))\` (parallèle) :

\`\`\`ts
// ✅ Séquentiel : 1 insert puis le suivant
for (const item of items) {
  await db.execute({ sql: 'INSERT ...', args: [item] });
}

// ✅ Parallèle : tous les inserts en même temps
await Promise.all(items.map(item =>
  db.execute({ sql: 'INSERT ...', args: [item] })
));
\`\`\`

**Choisir** : séquentiel si l'ordre compte ou si tu veux pas saturer la DB. Parallèle si l'ordre n'importe pas et tu veux la perf.`,
    lesson: `Règle d'or : \`forEach\` n'est jamais le bon choix avec \`async\`. Utilise \`for...of\` quand tu veux séquentiel, \`Promise.all\` quand tu veux parallèle. Si tu vois \`forEach(async ...)\` dans une PR, c'est presque toujours un bug.`,
  },

  {
    id: 'react-key-index',
    title: 'React `key={index}` casse les listes réordonnables',
    category: 'perf',
    axe: '7.2',
    symptom: `// Liste de tâches qu'on peut réordonner ou supprimer
{tasks.map((task, index) => (
  <Task key={index} task={task} />
))}
// Bug visible : input qui ne suit pas son item après un réordonnement,
// state local qui se mélange entre items, animations buggées.`,
    cause: `React utilise \`key\` pour **identifier** chaque élément entre deux renders. Si tu utilises \`index\`, supprimer l'item 0 fait que l'item 1 hérite de la \`key=0\` — React croit que c'est le même composant, conserve son state local, son input value, son DOM.`,
    fix: `Toujours utiliser un **id stable** (souvent \`task.id\` venant de la DB) :

\`\`\`tsx
{tasks.map(task => (
  <Task key={task.id} task={task} />
))}
\`\`\`

Cas particulier : si tu as une liste **read-only et qui n'est jamais réordonnée** (un tableau de stats statique), \`key={index}\` est OK. Mais ne fais pas l'erreur de partir de \`index\` puis ajouter le tri/filtre/reorder plus tard.`,
    lesson: `\`key={index}\` est un **piège qui ne se révèle pas immédiatement**. Tout marche jusqu'au jour où l'utilisateur réordonne sa liste, puis « bizarrement » l'input value se mélange. Préviens le bug en utilisant des IDs stables dès le départ.`,
  },

  {
    id: 'use-effect-stale-closure',
    title: 'useEffect avec dépendance manquante = stale closure',
    category: 'tests',
    axe: '7.2',
    symptom: `function Counter() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      console.log(count);  // affiche toujours 0 !
    }, 1000);
    return () => clearInterval(id);
  }, []);  // ← dependency array vide
  // ...
}`,
    cause: `Le \`useEffect\` capture \`count\` au 1er render (valeur 0). Le tableau de deps \`[]\` dit à React « ne ré-exécute jamais cet effet ». Donc le \`setInterval\` continue de logger 0, même quand \`count\` change ailleurs. C'est le **stale closure**.`,
    fix: `Trois options :

1. **Mettre la dep** (correct mais recreate l'interval à chaque change) :
   \`\`\`ts
   useEffect(() => { ... }, [count]);
   \`\`\`

2. **Utiliser le setter callback** pour ne pas dépendre du state actuel :
   \`\`\`ts
   useEffect(() => {
     const id = setInterval(() => setCount(c => c + 1), 1000);
     return () => clearInterval(id);
   }, []);
   \`\`\`

3. **Ref** si tu veux la valeur courante sans re-render :
   \`\`\`ts
   const countRef = useRef(count);
   useEffect(() => { countRef.current = count; });
   \`\`\`

**Le linter \`react-hooks/exhaustive-deps\` détecte ce piège** — l'activer en CI bloquante.`,
    lesson: `99 % des bugs React du quotidien viennent de stale closures + dépendances manquantes. Active \`react-hooks/exhaustive-deps\` en \`error\` (pas \`warning\`) dans ESLint. Quand tu as besoin de l'ignorer (rare), c'est presque toujours le signal qu'il faut refactorer.`,
  },

  {
    id: 'ts-as-cast',
    title: 'TypeScript `as` ment au compilateur',
    category: 'tests',
    axe: '6.4',
    symptom: `const user = response.data as User;
// 1 mois plus tard, l'API a changé et user.email n'existe plus
// → bug runtime "Cannot read property 'toLowerCase' of undefined"
// → 0 erreur TypeScript`,
    cause: `\`as User\` est un **type assertion**, pas une vérification runtime. Tu dis au compilateur « fais-moi confiance, c'est un User ». Si la vraie data n'a pas la forme attendue, TS n'a aucun moyen de le savoir.`,
    fix: `Utiliser **Zod** (ou Valibot, ArkType) pour valider runtime :

\`\`\`ts
import { z } from 'zod';

const UserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string(),
});

// Au lieu de :
const user = response.data as User;

// Faire :
const user = UserSchema.parse(response.data);
// → throw immédiat si la forme est invalide, message précis
\`\`\`

\`as\` reste OK pour les cas où **tu sais** quelque chose que TS ne peut pas inférer (ex. après un \`if (typeof x === 'string')\`, le narrowing ne marche plus dans une closure → \`as string\` raisonnable).`,
    lesson: `Règle d'or 2026 : **inputs externes (API, JSON, localStorage, formulaires) → toujours validation runtime**. Le typage statique TS protège du bug en interne, pas à la frontière. Zod parse > as cast 9 fois sur 10.`,
  },

  {
    id: 'cls-image-sans-dimensions',
    title: 'Image sans `width`+`height` plombe le CLS',
    category: 'perf',
    axe: '13.2',
    symptom: `<img src="/hero.jpg" />
<!-- Lighthouse : CLS 0.4 (cible : ≤ 0.1) -->
<!-- Le contenu en dessous saute quand l'image charge -->`,
    cause: `Sans \`width\` et \`height\` (ou aspect-ratio CSS), le navigateur ne sait pas combien de place réserver. Quand l'image charge, le contenu en dessous est poussé → **Cumulative Layout Shift**. Pénalisé par Lighthouse et Google Search.`,
    fix: `Toujours fournir les dimensions intrinsèques :

\`\`\`html
<img
  src="/hero.jpg"
  width="1024"
  height="600"
  alt="..."
/>
\`\`\`

Le navigateur calcule le ratio (1024/600) et réserve la place avant le téléchargement. **Ratio préservé** même si CSS \`max-width: 100%; height: auto;\`.

Pour les images responsives (\`srcset\`), donne les dimensions de la version par défaut — le ratio sera identique pour toutes les variantes.`,
    lesson: `Sur 9 sites sur 10, \`width\`+\`height\` manquants sont la première cause de mauvais CLS. C'est gratuit à corriger, ça améliore le SEO et l'UX. **Linter HTML** ou test Lighthouse en CI bloquant te le rappelle automatiquement.`,
  },

  {
    id: 'docker-copy-cache-invalidation',
    title: 'Dockerfile mal ordonné → cache npm invalidé à chaque build',
    category: 'build',
    axe: '4.4',
    symptom: `# Dockerfile naïf :
FROM node:24-alpine
WORKDIR /app
COPY . .                    ← copie tout
RUN npm ci                   ← chaque modif de code → ré-install complet (5 min)`,
    cause: `Docker invalide le cache à partir de la 1ère ligne modifiée. Si tu \`COPY . .\` avant \`RUN npm ci\`, **toute modification de code source** invalide \`COPY\` → invalide tout ce qui suit, y compris l'install npm long.`,
    fix: `Copier d'abord les **fichiers de lock**, installer les deps, **puis** copier le reste :

\`\`\`dockerfile
FROM node:24-alpine
WORKDIR /app
COPY package*.json ./       ← change rarement
RUN npm ci                   ← cache OK la plupart du temps
COPY . .                     ← change souvent, mais après l'install
RUN npm run build
\`\`\`

Avec \`--mount=type=cache\` (BuildKit) :
\`\`\`dockerfile
RUN --mount=type=cache,target=/root/.npm npm ci
\`\`\`

Build de **5 min → 30 s** sur changement de code.`,
    lesson: `Ordonner ton Dockerfile **du moins changeant au plus changeant** est la 1ère règle de Docker. Toujours : OS deps → lock files → install → code source → build. Mémo : le cache Docker est ton ami, mais il faut le mériter.`,
  },

  {
    id: 'jsonb-sans-gin',
    title: 'JSONB Postgres sans index GIN → seq scan systématique',
    category: 'perf',
    axe: '9.1',
    symptom: `-- Schéma
CREATE TABLE products (id SERIAL, metadata JSONB);

-- Query métier
SELECT * FROM products WHERE metadata @> '{"color": "red"}';
-- EXPLAIN : Seq Scan, 800 ms sur 100K rows`,
    cause: `Sans index GIN, Postgres ne peut pas accéder rapidement aux clés/valeurs JSONB. Il fait un \`Seq Scan\` qui parse chaque \`metadata\` row par row.`,
    fix: `Créer un **index GIN** sur la colonne JSONB :

\`\`\`sql
CREATE INDEX products_metadata_idx ON products USING GIN (metadata);
\`\`\`

Pour les filtres sur **une seule clé** souvent utilisée (\`metadata->>'color'\`), un index plat ou expression :
\`\`\`sql
CREATE INDEX products_color_idx ON products ((metadata->>'color'));
\`\`\`

Le GIN couvre tous les opérateurs JSONB (\`@>\`, \`?\`, \`?|\`, \`?&\`). L'index expression est plus petit mais ne sert que ce filtre précis.`,
    lesson: `Si tu utilises JSONB en colonne, **toujours** un index GIN (ou expression) sur ce qui est filtré. Sinon tu as choisi JSONB pour la flexibilité mais tu paies le prix de la lenteur. Linter SQL en review : « JSONB sans index → flag ».`,
  },

  {
    id: 'cors-star-credentials',
    title: 'CORS `*` avec credentials → bloqué par le navigateur',
    category: 'cors',
    axe: '12.0',
    symptom: `// Backend
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Credentials', 'true');

// Console navigateur :
// "The value of the 'Access-Control-Allow-Origin' header in the response
//  must not be the wildcard '*' when the request's credentials mode is 'include'."`,
    cause: `La spec CORS interdit explicitement la combinaison \`Origin: *\` + \`Credentials: true\`. C'est une protection : si n'importe quelle origine peut envoyer des credentials, c'est CSRF garanti.`,
    fix: `Allow-list explicite des origines autorisées :

\`\`\`ts
const ALLOWED_ORIGINS = new Set([
  'https://app.example.com',
  'http://localhost:5173',  // dev
]);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');  // ← important pour le cache
  }
  next();
});
\`\`\`

\`Vary: Origin\` est crucial : sans, un proxy peut servir la mauvaise réponse à un autre origin.`,
    lesson: `\`Access-Control-Allow-Origin: *\` n'est valide **que** sans credentials (API publique read-only). Dès que tu envoies un cookie ou un Authorization header, allow-list explicite obligatoire. C'est la 1ère vuln à chercher en audit.`,
  },

  {
    id: 'env-secrets-bundled',
    title: 'Secrets `.env` qui finissent dans le bundle client',
    category: 'security',
    axe: '12.0',
    symptom: `// .env
DATABASE_PASSWORD=hunter2

// Code Vite/Next/CRA :
console.log(import.meta.env.DATABASE_PASSWORD);
// → en prod, "hunter2" est visible dans le JS bundle !`,
    cause: `Les bundlers frontend (Vite, Next.js, Webpack) injectent **toutes** les variables d'environnement au build. Tu retrouves \`hunter2\` en clair dans le \`.js\` servi au navigateur. Tout visiteur peut l'extraire.`,
    fix: `Convention de nommage : préfixer les vars **publiques** (≠ secrètes) :

| Bundler | Préfixe public |
|---------|------------------|
| Vite | \`VITE_\` |
| Next.js | \`NEXT_PUBLIC_\` |
| Create React App | \`REACT_APP_\` |
| Astro | \`PUBLIC_\` |

\`\`\`bash
# .env
NEXT_PUBLIC_API_URL=https://api.example.com  ← OK, public
DATABASE_PASSWORD=hunter2                     ← reste serveur, jamais bundlé
\`\`\`

**Au build**, vérifier le bundle :
\`\`\`bash
grep -r "hunter2" dist/   # doit retourner 0 résultat
\`\`\``,
    lesson: `Toute variable accessible sans préfixe est en danger. Audit de bundle 1× par sprint : \`grep\` les valeurs sensibles dans \`dist/\`. Et **toujours** \`.env\` dans \`.gitignore\` — la fuite la plus courante.`,
  },

  {
    id: 'git-pull-merge-pourri',
    title: '`git pull` crée des merge commits parasites',
    category: 'env',
    axe: '4.2',
    symptom: `# Tu as commit local "feat: X". Quelqu'un push sur main pendant.
git pull
# → merge commit "Merge branch 'main' of github.com/..."
# Historique pollué de "Merge branch" partout`,
    cause: `\`git pull\` par défaut = \`fetch + merge\`. Si tu as des commits locaux non-pushés et que la branche distante a avancé, Git crée un commit de merge — qui n'apporte aucune valeur historique.`,
    fix: `Configurer \`pull.rebase\` :

\`\`\`bash
git config --global pull.rebase true
\`\`\`

Désormais \`git pull\` = \`fetch + rebase\` → tes commits locaux sont rejoués au-dessus de \`origin/main\`, historique linéaire.

**Alternative** par défaut :
\`\`\`bash
git config --global pull.ff only
\`\`\`
Refuse le pull s'il faut merge → t'oblige à choisir explicitement \`--rebase\` ou \`--no-ff\`.`,
    lesson: `Un historique Git linéaire (rebase) se lit en 30 sec, un historique fait de merges parasites en 30 min. Configure \`pull.rebase=true\` une fois pour toutes — c'est le réglage qu'aucun cours ne donne.`,
  },

  {
    id: 'timing-attack-string-compare',
    title: 'Comparer secrets avec `===` = timing attack',
    category: 'security',
    axe: '12.3',
    symptom: `// Vérification de webhook signature
function verify(received, expected) {
  return received === expected;  // ← vulnérable
}`,
    cause: `\`===\` sur string s'arrête au 1er caractère différent. La différence de temps entre « 1er char faux » et « 100e char faux » est mesurable sur le réseau (10-100 ns). Un attaquant peut **deviner le secret caractère par caractère** en mesurant la latence.`,
    fix: `Utiliser une comparaison **constant-time** :

\`\`\`ts
import { timingSafeEqual } from 'node:crypto';

function verify(received: string, expected: string): boolean {
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;  // length OK to leak
  return timingSafeEqual(a, b);
}
\`\`\`

Toujours faire la check de longueur **avant** \`timingSafeEqual\` — cette fonction throw si les buffers font des tailles différentes.`,
    lesson: `Toute comparaison de **secret** (token, signature, password hash) doit être constant-time. \`===\` est OK pour les ID publics (email, username). Mémo : si la valeur fuite donne accès à quelque chose, comparaison constant-time obligatoire.`,
  },

  {
    id: 'react-state-deep-mutation',
    title: 'Muter le state React imbriqué ne re-render pas',
    category: 'tests',
    axe: '7.2',
    symptom: `const [user, setUser] = useState({ name: 'Alice', address: { city: 'Lyon' } });

function changeCity() {
  user.address.city = 'Paris';  // mutation directe
  setUser(user);                 // ← React voit la même référence, ne re-render pas
}`,
    cause: `React utilise une **comparaison référentielle** (\`Object.is\`) pour décider de re-render. Si tu mutes l'objet en place, la référence reste identique → React croit que rien n'a changé.`,
    fix: `Toujours créer un **nouvel objet** pour les modifs imbriquées :

\`\`\`ts
setUser({
  ...user,
  address: { ...user.address, city: 'Paris' }
});
\`\`\`

Pour les structures profondes, utiliser **Immer** :
\`\`\`ts
import { produce } from 'immer';

setUser(produce(user, draft => {
  draft.address.city = 'Paris';  // OK, Immer fait le clone derrière
}));
\`\`\`

Ou refactorer le state en plusieurs \`useState\` plats si possible.`,
    lesson: `Règle d'or React : **state immuable**. Toute modif = nouvel objet/array. Si ton state a 3+ niveaux de profondeur, c'est souvent le signal pour le scinder ou utiliser \`useReducer\` + Immer.`,
  },

  {
    id: 'fk-sans-index',
    title: 'Foreign Key sans index → DELETE/UPDATE catastrophiques',
    category: 'perf',
    axe: '9.1',
    symptom: `-- Schéma sans index sur la FK
CREATE TABLE order_lines (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(id) ON DELETE CASCADE,
  -- pas d'index sur order_id !
  ...
);

-- DELETE FROM orders WHERE id = 42;
-- → seq scan sur order_lines (10M rows) pour trouver les lignes à cascader
-- → 8 secondes au lieu de 5 ms`,
    cause: `Postgres (et la plupart des SGBD) ne créent **pas** automatiquement d'index sur la colonne FK enfant. Pour vérifier qu'aucun enfant ne référence un parent à supprimer, il scanne toute la table enfant.`,
    fix: `Toujours indexer les colonnes FK :

\`\`\`sql
CREATE INDEX order_lines_order_id_idx ON order_lines(order_id);
\`\`\`

Audit script :
\`\`\`sql
SELECT
  c.conname,
  c.conrelid::regclass AS table,
  a.attname AS column
FROM pg_constraint c
JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
WHERE c.contype = 'f'
  AND NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = c.conrelid
      AND a.attnum = ANY(i.indkey)
  );
-- Liste les FK sans index — à indexer
\`\`\``,
    lesson: `Postgres indexe la **PK** automatiquement, mais **pas** les FK côté enfant. Toujours créer ces index. Sur une grosse table avec CASCADE, l'oubli peut transformer un DELETE en panne de 30 secondes en prod.`,
  },

  {
    id: 'cookie-httponly-oublie',
    title: 'Cookie de session sans `httpOnly` → vol par XSS',
    category: 'security',
    axe: '12.0',
    symptom: `// Pose de cookie sans flags
res.cookie('session', token);

// Conséquence :
// document.cookie → "session=eyJhbGc..." accessible au JS
// Une faille XSS = vol immédiat du token`,
    cause: `Sans \`httpOnly\`, le cookie est lisible via \`document.cookie\` côté JS. Un XSS (même petit) = exfiltration vers le serveur de l'attaquant.`,
    fix: `Toujours les 4 flags critiques sur un cookie de session :

\`\`\`ts
res.cookie('session', token, {
  httpOnly: true,   // pas accessible à JS
  secure: true,     // HTTPS only
  sameSite: 'lax',  // anti-CSRF (sauf navigations top-level)
  maxAge: 86400_000,
  path: '/',
});
\`\`\`

| Flag | Si absent → exploitable comment |
|------|------------------------------------|
| \`httpOnly\` | XSS exfiltre le cookie |
| \`secure\` | MITM en HTTP intercepte en clair |
| \`sameSite\` | CSRF cross-site |
| \`maxAge\` | Cookie persistant indéfiniment |`,
    lesson: `Un cookie de session **doit** être httpOnly+secure+sameSite. Pas négociable. Linter de sécurité (Snyk, Semgrep) le détecte automatiquement. Audit OWASP A05 le check en premier.`,
  },

  {
    id: 'parseint-sans-radix',
    title: '`parseInt` sans radix peut interpréter en octal',
    category: 'tests',
    axe: '6.1',
    symptom: `parseInt('010');     // → 8 dans certains navigateurs anciens (octal)
parseInt('0x10');    // → 16 (hex)
parseInt('010', 10); // → 10, comportement attendu`,
    cause: `\`parseInt\` sans 2e argument tente de **deviner la base** depuis le préfixe. Strings commençant par \`0\` ont été interprétées en octal (jusqu'à ES5), \`0x\` en hex.`,
    fix: `**Toujours** passer le radix :

\`\`\`ts
parseInt(input, 10);  // décimal explicite
\`\`\`

Ou utiliser \`Number()\` (plus strict, ne tolère pas les chars trailing) :
\`\`\`ts
Number('42');     // → 42
Number('42abc');  // → NaN (vs parseInt = 42)
\`\`\`

Linter ESLint : \`radix: error\` détecte automatiquement.`,
    lesson: `Tout littéral numérique parsé d'une string → \`parseInt(s, 10)\` ou \`Number(s)\`. Toujours préciser. Linter ESLint en CI = jamais de surprise.`,
  },

  {
    id: 'localhost-vs-127',
    title: '`localhost` ≠ `127.0.0.1` quand IPv6 est activé',
    category: 'env',
    axe: '4.4',
    symptom: `// Le serveur écoute sur 127.0.0.1:3000
const server = app.listen(3000, '127.0.0.1');

// Le client tente :
fetch('http://localhost:3000/health');
// → ECONNREFUSED parfois, surtout sur Windows / macOS récent`,
    cause: `\`localhost\` résoud en IPv6 (\`::1\`) **avant** IPv4 (\`127.0.0.1\`) sur la plupart des OS modernes. Si ton serveur écoute uniquement sur IPv4 \`127.0.0.1\`, le client peut taper sur \`::1\` et échouer.`,
    fix: `Trois options :

1. **Bind sur tout** (le plus simple en dev) :
   \`\`\`ts
   app.listen(3000, '0.0.0.0');  // IPv4 + IPv6
   \`\`\`

2. **Utiliser \`localhost\` partout** côté serveur ET client :
   \`\`\`ts
   app.listen(3000, 'localhost');
   \`\`\`

3. **Forcer IPv4 dans Node** :
   \`\`\`bash
   NODE_OPTIONS='--dns-result-order=ipv4first' node server.js
   \`\`\``,
    lesson: `Sur Windows/macOS récents, IPv6 est résolu en premier. Toujours \`0.0.0.0\` ou \`localhost\` (pas \`127.0.0.1\` strict) en dev. C'est le piège #1 quand un dev passe d'un OS à un autre dans une équipe.`,
  },

  {
    id: 'lcp-font-cdn-distant',
    title: 'Font Google CDN plombe le LCP sur mobile bridé',
    category: 'perf',
    axe: '13.2',
    symptom: `<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Inter">
<!-- Lighthouse mobile bridé : LCP 4.2 s, dont 1.8 s pour télécharger la font -->`,
    cause: `Le navigateur doit : (1) résoudre DNS \`fonts.googleapis.com\`, (2) télécharger le CSS, (3) résoudre DNS \`fonts.gstatic.com\`, (4) télécharger les fichiers \`.woff2\`. 4 round-trips réseau **avant** de pouvoir afficher le 1er texte.`,
    fix: `Self-host les fonts + preload + \`font-display: swap\` :

\`\`\`html
<!-- Préchargement explicite -->
<link
  rel="preload"
  href="/fonts/Inter-Regular.woff2"
  as="font"
  type="font/woff2"
  crossorigin
/>

<style>
  @font-face {
    font-family: 'Inter';
    src: url('/fonts/Inter-Regular.woff2') format('woff2');
    font-display: swap;  /* affiche font système, swap quand prête */
    font-weight: 400;
  }
</style>
\`\`\`

Outils : [\`fontsource\`](https://fontsource.org/) (npm package par font), [\`Fontsquirrel webfont generator\`](https://www.fontsquirrel.com/tools/webfont-generator).

**Gain typique** : LCP 4.2 s → 2.1 s sur mobile bridé.`,
    lesson: `Les fonts Google CDN sont pratiques mais **plombent** le LCP. Self-host est gratuit, plus rapide, et ne bave pas de PII vers Google (RGPD). Sur tout projet pro 2026, self-host par défaut.`,
  },

  {
    id: 'docker-bind-mount-ecrase-node-modules',
    title: 'Bind mount `./` écrase `node_modules` du container',
    category: 'build',
    axe: '4.4',
    symptom: `# docker-compose.yml
volumes:
  - ./:/app   # bind mount tout le repo

# → "Cannot find module 'tsx'"
# Pourtant npm install a marché dans le Dockerfile`,
    cause: `Le bind mount \`./:/app\` **écrase** le \`/app/node_modules\` du container avec celui (vide ou OS-incompatible) de l'hôte. Particulièrement vicieux quand l'hôte est macOS/Windows et le container Linux : les binaires natifs (\`@node-rs/argon2\`, \`better-sqlite3\`) sont incompatibles.`,
    fix: `Volume anonyme par-dessus pour préserver \`node_modules\` du container :

\`\`\`yaml
services:
  api:
    build: .
    volumes:
      - ./:/app
      - /app/node_modules   # ← volume anonyme, masque le bind
\`\`\`

Le 2e volume "remet" les \`node_modules\` du container par-dessus le bind mount.

**Alternative cleaner** : ne bind que les dossiers source :
\`\`\`yaml
volumes:
  - ./src:/app/src
  - ./package.json:/app/package.json
\`\`\``,
    lesson: `Le bind mount \`./:/app\` est tentant mais casse \`node_modules\` cross-OS. Volume anonyme \`/app/node_modules\` ou bind sélectif. Pattern à mémoriser sur tout Compose dev.`,
  },

  {
    id: 'env-vite-rebuild',
    title: 'Variable `.env` modifiée non prise en compte par Vite/Next',
    category: 'env',
    axe: '4.4',
    symptom: `# Tu modifies .env :
# VITE_API_URL=https://new-api.example.com

# Tu rafraîchis le navigateur :
console.log(import.meta.env.VITE_API_URL);
// → toujours l'ancienne valeur`,
    cause: `Vite (et Next.js) **inlineent** les vars d'env au moment du **build**, pas du runtime. Modifier \`.env\` ne change rien tant que le serveur dev n'est pas redémarré.`,
    fix: `Restart hard :

\`\`\`bash
# Ctrl+C, puis :
npm run dev
\`\`\`

Pour les vars **runtime** (non-bundlées) côté serveur Node, utiliser \`process.env\` directement — il est lu à chaque request, pas inliné.

**Astuce dev** : log les vars au démarrage pour repérer les vieilles valeurs :
\`\`\`ts
console.log('Loaded env:', { API_URL: process.env.API_URL });
\`\`\``,
    lesson: `Vars d'env bundlées (\`VITE_*\`, \`NEXT_PUBLIC_*\`) = restart obligatoire après changement. Vars serveur (\`process.env.X\`) = lues à chaque request. Si une var "ne se met pas à jour", check d'abord ce point.`,
  },

  {
    id: 'github-actions-secret-leak',
    title: 'Secrets GitHub Actions exposés dans les logs',
    category: 'security',
    axe: '14.1',
    symptom: `# .github/workflows/deploy.yml
- name: Deploy
  run: |
    echo "Deploying with $API_KEY"   # ← log expose le secret
  env:
    API_KEY: \${{ secrets.API_KEY }}`,
    cause: `GitHub Actions **masque automatiquement** les secrets dans les logs s'il les détecte tels quels. Mais : (1) si tu fais \`echo\` ou pipe vers un outil, ils peuvent **fuir** par d'autres canaux. (2) Si tu transformes le secret (concat, base64), GH ne masque plus.`,
    fix: `Ne **jamais** \`echo\` un secret. Pour le passer à un outil :

\`\`\`yaml
- name: Deploy
  run: ./deploy.sh
  env:
    API_KEY: \${{ secrets.API_KEY }}
# → API_KEY est dans l'env du process, pas dans le shell command
\`\`\`

Si tu DOIS transformer (rare) :
\`\`\`yaml
- name: Mask transformed
  run: |
    TRANSFORMED=$(echo "\${{ secrets.API_KEY }}" | base64)
    echo "::add-mask::$TRANSFORMED"  # ré-enregistre comme masque
    echo "TRANSFORMED=$TRANSFORMED" >> $GITHUB_ENV
\`\`\`

**Audit** : check les logs de tes workflows public pour secrets visibles. Si un secret a fuité, **rotation immédiate** dans le service concerné.`,
    lesson: `GH Actions masque les secrets *connus*. Toute transformation (base64, concat, hash partiel) **casse** le masquage. Règle : passer en env var au process, jamais dans une commande shell. Rotation rapide en cas de doute.`,
  },

  {
    id: 'service-worker-stale-cache',
    title: 'Service Worker garde une vieille version en cache',
    category: 'perf',
    axe: '13.2',
    symptom: `// Tu déploies une nouvelle version.
// Les utilisateurs ouvrent le site.
// → ils voient l'ancienne version pendant des jours.
// Pourquoi ? Service Worker qui sert depuis le cache.`,
    cause: `Stratégie **cache-first** sans expiration : le SW sert depuis le cache, sans vérifier le serveur. Tant que le cache n'est pas invalidé, les users voient l'ancienne version.`,
    fix: `Trois stratégies :

1. **Network-first** (recommandé pour la coquille HTML) :
   \`\`\`ts
   // Tente le réseau, fallback cache si offline
   self.addEventListener('fetch', (e) => {
     e.respondWith(
       fetch(e.request)
         .then(r => { caches.open('v1').then(c => c.put(e.request, r.clone())); return r; })
         .catch(() => caches.match(e.request))
     );
   });
   \`\`\`

2. **Stale-while-revalidate** : sert le cache, met à jour en arrière-plan.

3. **Versioning du SW** : changer le nom du cache à chaque release force la migration :
   \`\`\`ts
   const CACHE_NAME = 'app-v' + import.meta.env.VITE_BUILD_ID;
   \`\`\`

Outil moderne : [Workbox](https://developer.chrome.com/docs/workbox/) gère ces stratégies en quelques lignes.`,
    lesson: `Service Worker en cache-first sans versioning = users bloqués sur l'ancienne version pendant des semaines. **Versionner le cache** + utiliser network-first sur le HTML. Tester le déploiement en mode incognito + cache disable pour voir la "vraie" expérience.`,
  },

  {
    id: 'oauth-redirect-uri-mismatch',
    title: 'OAuth `redirect_uri` mismatch en prod',
    category: 'auth',
    axe: '10.0',
    symptom: `# Ça marche en local : http://localhost:5173/auth/callback
# En prod : https://app.example.com/auth/callback
# → Erreur Google : "redirect_uri_mismatch"`,
    cause: `Les providers OAuth (Google, GitHub, Clerk) exigent que le \`redirect_uri\` envoyé soit **exactement** dans la liste configurée côté provider — http vs https, port, trailing slash, tout compte.`,
    fix: `Configurer **toutes** les URLs valides côté provider :

\`\`\`
http://localhost:5173/auth/callback     ← dev
https://preview-*.app.example.com/auth/callback  ← previews Vercel
https://app.example.com/auth/callback    ← prod
\`\`\`

Côté code, calculer le \`redirect_uri\` dynamiquement à partir de l'origine de la request :
\`\`\`ts
const redirectUri = new URL('/auth/callback', request.headers.origin).toString();
\`\`\`

**Ne JAMAIS** hardcoder \`https://app.example.com/...\` — ça casse en preview.`,
    lesson: `OAuth est strict sur \`redirect_uri\`. Toujours déclarer dev + previews + prod côté provider. Calculer dynamiquement côté code. La 1ère erreur de tout projet OAuth est ce mismatch.`,
  },

  {
    id: 'rate-limit-derriere-cdn',
    title: 'Rate-limit basé sur IP cassé derrière un CDN',
    category: 'security',
    axe: '12.3',
    symptom: `// Middleware de rate-limit
const ip = req.socket.remoteAddress;
// → derrière Cloudflare/Vercel, c'est l'IP du proxy, pas du client
// → tous les utilisateurs partagent le même rate-limit bucket = blocage massif`,
    cause: `Quand ton app est derrière un CDN ou load balancer, \`socket.remoteAddress\` retourne l'IP du **proxy**, pas du client. Tous tes users semblent venir de la même IP → rate-limit s'applique à eux globalement.`,
    fix: `Lire la **vraie IP** dans les headers du proxy :

\`\`\`ts
function getClientIp(req: Request): string {
  // Cloudflare
  const cf = req.headers.get('cf-connecting-ip');
  if (cf) return cf;

  // Vercel / Render / proxies standards
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();

  // Fly.io
  const fly = req.headers.get('fly-client-ip');
  if (fly) return fly;

  return req.socket.remoteAddress ?? 'unknown';
}
\`\`\`

⚠️ **Faille** : ces headers sont **forgeables** par le client si tu n'es pas derrière un proxy de confiance. Toujours :
1. Configurer le proxy pour **écraser** les valeurs entrantes (pas append).
2. N'utiliser ces headers que **derrière** un proxy connu.

Pour Express/Hono : \`app.set('trust proxy', 1)\` ou config équivalente.`,
    lesson: `Derrière un CDN, \`remoteAddress\` ment. Toujours lire \`X-Forwarded-For\` (ou \`CF-Connecting-IP\` côté Cloudflare). Vérifier que le proxy de confiance écrase ces headers — sinon un attaquant peut spoof son IP.`,
  },

  {
    id: 'zod-4-vs-validator',
    title: 'Zod 4 incompatible avec @hono/zod-validator',
    category: 'deps',
    axe: '6.4',
    date: '2026-04-30',
    symptom: `npm error code ERESOLVE
peer zod@"^3.19.1" from @hono/zod-validator@0.4.3
Found: zod@4.4.1`,
    cause: `Zod 4 a introduit des breaking changes dans son API interne. Beaucoup de libs de l'écosystème (validators, ORM intégrations) ont des peer dependencies fixées sur Zod 3 et n'ont pas encore publié de version compatible Zod 4.`,
    fix: `Deux options selon le contexte :
- **Conservateur** : downgrade Zod à \`^3.23.8\` dans \`package.json\` — fonctionne avec tout l'écosystème actuel.
- **Bleeding edge** : vérifier si \`@hono/zod-validator@0.5+\` est sorti, qui supporte Zod 4. Pour les autres libs, idem.`,
    lesson: `Avant d'upgrader une dépendance « cœur » (Zod, React, TypeScript, ORM), faire \`npm ls\` ou \`npm-check-updates --doctor\` pour repérer les peer-deps qui ne suivront pas. Une migration majeure ne se fait jamais seule — elle entraîne tout son écosystème.`,
  },

  {
    id: 'better-sqlite3-windows-build',
    title: 'better-sqlite3 ne compile pas sur Windows + Node 24',
    category: 'build',
    axe: '4.4',
    date: '2026-04-30',
    symptom: `npm error gyp ERR! stack ... node-gyp rebuild
better-sqlite3 ... not ok
node -v v24.14.1`,
    cause: `\`better-sqlite3\` est un module **natif C++** : il doit être compilé via \`node-gyp\`. Sous Windows, ça exige les Visual C++ Build Tools (~ 5 GB). Sous Node 24 (très récent), les binaires prébuilds ne sont pas toujours encore publiés au moment de la sortie de Node, ce qui force la compilation locale.`,
    fix: `Trois options par ordre de préférence :
1. **Migrer vers \`@libsql/client\`** (fork Turso de SQLite, **binaires prébuilds** pour toutes plateformes, pas de compilation). Drizzle a un driver \`drizzle-orm/libsql\` quasi drop-in. C'est ce que ce guide utilise.
2. Installer les Build Tools Windows : \`npm install --global windows-build-tools\` (ou Visual Studio Installer → « C++ Build Tools »).
3. Downgrader Node à 22 LTS où les prébuilds existent.`,
    lesson: `Pour un projet pédagogique ou multi-plateforme, **éviter les modules natifs** quand un équivalent pure-JS / WASM existe. La friction d'installation tue les contributions. \`@libsql/client\`, \`@noble/hashes\`, \`@node-rs/argon2\` (lui-même prébuild) sont des bons défauts 2026.`,
  },

  {
    id: 'hono-jwt-alg-required',
    title: 'hono/jwt verify échoue : « JwtAlgorithmRequired »',
    category: 'auth',
    axe: '8.0',
    date: '2026-04-30',
    symptom: `JwtAlgorithmRequired: JWT verification requires "alg" option to be specified
    at verifyToken (src/lib/jwt.ts:22)`,
    cause: `Depuis Hono 4.x, \`verify(token, secret)\` ne prend plus d'algorithme par défaut — il faut le passer explicitement. C'est une **mesure de sécurité** : ne pas spécifier l'algorithme rend l'app vulnérable à l'attaque dite **alg-confusion** (un attaquant qui forge un token \`alg=none\` ou en HS256 contre une clé RS256 publique).`,
    fix: `Passer explicitement l'algorithme à \`sign\` ET \`verify\` :

\`\`\`ts
const ALG = 'HS256' as const;

export async function signToken(userId: number) {
  return sign({ sub: String(userId), exp: ... }, JWT_SECRET, ALG);
}
export async function verifyToken(token: string) {
  return verify(token, JWT_SECRET, ALG);
}
\`\`\``,
    lesson: `Pour les libs sécurité, **toujours lire le changelog avant d'upgrader**. Quand une lib bouge ses defaults dans le sens « plus strict », c'est généralement parce qu'on a corrigé une vulnérabilité connue. Suivre les releases JWT / Auth0 / hono (channel security) vaut le coup.`,
  },

  {
    id: 'vitest-windows-spawn-tinypool',
    title: 'Vitest 2/3 + Node 24 + Windows : Tinypool meurt sur les tests qui spawn',
    category: 'tests',
    axe: '2.0',
    date: '2026-04-30',
    symptom: `Error: Worker exited unexpectedly
    at ChildProcess.onUnexpectedExit (.../tinypool/dist/index.js:118:30)
Emitted 'error' event on Tinypool instance

# ou bien
Error: Channel closed (ERR_IPC_CHANNEL_CLOSED)`,
    cause: `Vitest exécute chaque fichier de test dans un worker (Tinypool). Sous Node 24 + Windows, dès qu'un test fait du \`spawnSync\` (par exemple pour tester un CLI), l'IPC entre le worker Tinypool et son parent se casse — les workers sortent en plein vol et tout le run échoue avant même d'avoir démarré le test.

Le problème est connu côté Vitest et n'a pas de fix simple : le pool 'forks' déclenche \`ERR_IPC_CHANNEL_CLOSED\`, le pool 'threads' fait crasher le worker. Lié à des changements internes IPC dans Node 24.`,
    fix: `Pour les exercices qui ont besoin de **lancer un sous-processus** (CLI, serveur), **ne pas utiliser Vitest**. Soit :

- Utiliser **\`node:test\`** (le runner intégré, pas de pool de workers).
- Ou écrire un **mini-runner custom** (10–20 lignes : un tableau de \`{name, fn}\` et un \`for\` qui try/catch). C'est ce que ce guide fait pour mini-curl.

Et toujours utiliser **\`spawn\` async (pas \`spawnSync\`)** quand le parent est aussi un process Node — voir piège suivant.

Pour les tests qui ne spawn pas (test unitaire d'une fonction, ou test d'une route HTTP via \`fetch\` sur un serveur in-process), **Vitest reste OK** sous Node 24 + Windows.`,
    lesson: `Un test runner avec worker pool est une optimisation : ça parallélise. Mais ça ajoute une dépendance complexe sur l'IPC du système. Quand cette IPC bouge (Node majeur, OS spécifique), les frameworks **avec** worker pool cassent en premier.

Pour les **tests d'intégration de CLIs**, un script de 50 lignes en \`node:child_process\` est souvent plus robuste qu'un framework. Connaître les deux options vaut le coup.`,
  },

  {
    id: 'spawnsync-node-tsx-windows',
    title: 'spawnSync depuis Node se fait killer (status 143) quand parent et enfant utilisent tsx',
    category: 'tests',
    axe: '2.0',
    date: '2026-04-30',
    symptom: `// Test : spawnSync(node, ['--import', 'tsx', 'cli.ts', ...], { encoding: 'utf-8' })
status: 143
signal: null
stdout: ''
stderr: ''
elapsed: ~30000 ms (= timeout par défaut)`,
    cause: `\`spawnSync\` **bloque l'event loop** du process parent. Quand parent et enfant chargent tous les deux \`tsx\` (loader TypeScript), le loader \`tsx\` utilise des workers internes qui ont besoin que l'event loop tourne pour s'initialiser. Le parent bloqué = l'enfant ne peut pas finir son init (ports, named pipes), un timeout interne tire un SIGTERM (status 143), et le \`stdout\` reste vide.

Le même appel depuis bash/zsh (parent qui n'est pas Node) marche en <2s. Le bug est l'interaction parent-Node × enfant-Node × \`--import tsx\` × Windows.`,
    fix: `Utiliser **\`spawn\` (asynchrone) wrappé dans une Promise** au lieu de \`spawnSync\` :

\`\`\`ts
import { spawn } from 'node:child_process';

function runCli(args: string[]) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ['--import', 'tsx', ENTRY, ...args]);
    let stdout = '', stderr = '';
    child.stdout.setEncoding('utf-8');
    child.stderr.setEncoding('utf-8');
    child.stdout.on('data', d => stdout += d);
    child.stderr.on('data', d => stderr += d);
    child.on('close', (status) => resolve({ status, stdout, stderr }));
  });
}

// Tests deviennent async
test('GET 200', async () => {
  const r = await runCli(['http://...']);
  assertEqual(r.status, 0);
});
\`\`\``,
    lesson: `Sur Node, \`spawnSync\` est commode mais **bloque tout**. Si l'enfant a besoin de l'event loop du parent (pour de l'IPC, des hooks de loader, du \`SharedArrayBuffer\`), \`spawnSync\` le suffoque silencieusement.

Règle : **dès qu'un test fait du subprocess en Node, utiliser \`spawn\` async**, jamais \`spawnSync\`. Le coût en lignes est nul (10 lignes de wrapper) et c'est plus prévisible.`,
  },

  {
    id: 'vitest-jsdom-matchmedia-missing',
    title: 'Tests Vitest crashent : « window.matchMedia is not a function »',
    category: 'tests',
    axe: '7.0',
    date: '2026-04-30',
    symptom: `TypeError: window.matchMedia is not a function
    at E node_modules/next-themes/dist/index.mjs:1:3278
    at mountStateImpl node_modules/react-dom/cjs/react-dom-client.development.js:8268:24
    at Object.useState …`,
    cause: `jsdom (utilisé par Vitest avec \`environment: 'jsdom'\`) n'implémente **pas** \`window.matchMedia\` — c'est une API navigateur que jsdom a choisi de ne pas mocker par défaut. Toute lib qui répond aux media queries (next-themes, MUI dark mode, ChakraUI, code custom \`prefers-color-scheme\`) crashe au premier render dans un test.

Le même test passe en Playwright/Cypress (vrai navigateur) mais explose en Vitest dès qu'un Client Component se monte.`,
    fix: `Créer un \`vitest.setup.ts\` qui mocke \`matchMedia\`, et le déclarer dans \`vitest.config.ts\` :

\`\`\`ts
// vitest.setup.ts
import { vi } from 'vitest';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),       // deprecated mais utilisé par certaines libs
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
\`\`\`

\`\`\`ts
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
});
\`\`\`

Mocker **toutes** les méthodes (\`addListener\`, \`removeListener\`, etc.) — sinon une lib qui les utilise crashe en cascade.`,
    lesson: `jsdom est une approximation du navigateur, pas un clone. Quand un test crashe sur \`window.X is not a function\`, c'est presque toujours une API que jsdom n'a pas implémentée : \`matchMedia\`, \`IntersectionObserver\`, \`ResizeObserver\`, \`scrollTo\`, \`localStorage\` (en partie), \`crypto.subtle\`.

Garde un \`vitest.setup.ts\` standard avec ces 4–5 polyfills dès le début d'un projet React/Next — tu gagnes des jours de debugging plus tard.`,
  },

  {
    id: 'grep-P-windows-locale',
    title: 'Scripts shell qui utilisent `grep -P` cassent sur git-bash Windows',
    category: 'env',
    axe: '4.2',
    date: '2026-04-30',
    symptom: `grep: -P supports only unibyte and UTF-8 locales

# Sur Linux ou macOS le même script fonctionne sans problème.
# Sous git-bash Windows, le PCRE de grep refuse d'opérer dans la locale par défaut.`,
    cause: `Le binaire \`grep\` distribué avec git-for-Windows a été compilé sans support PCRE complet, ou bien la locale Windows par défaut (\`C\` ou cp1252) n'est pas compatible avec le mode \`-P\`. C'est une limitation du portage MSYS de grep, pas un bug.

Beaucoup de scripts CI/test écrits sur Linux font \`grep -oP 'pattern'\` et plantent silencieusement quand un dev tente de les rejouer sous Windows.`,
    fix: `Utiliser **\`sed -E\`** (POSIX, marche partout) au lieu de \`grep -P\`. La capture passe par un groupe \`\\1\` :

\`\`\`bash
# ❌ Cassé sous git-bash Windows
time_ms=$(echo "$output" | grep -oP 'Time: \\K[\\d.]+')

# ✅ Portable POSIX
time_ms=$(echo "$output" | grep "Time:" | tail -1 | sed -E 's/.*Time: ([0-9]+\\.[0-9]+).*/\\1/')
\`\`\`

Alternatives :
- **ripgrep** (\`rg\`) si tu peux dépendre d'un binaire externe.
- Locale forcée : \`LC_ALL=C.UTF-8 grep -P …\` (parfois insuffisant sous Windows).
- \`awk '{print $2}'\` si la position dans la ligne est stable.`,
    lesson: `Si un script shell est censé tourner cross-OS (Linux/Mac/Windows), reste **POSIX strict** : \`sed\`, \`awk\`, \`grep\` (sans \`-P\`), \`tr\`. Les extensions GNU (\`grep -P\`, \`sed -i\` sans backup, \`xargs -d\`, \`mktemp -d\`) cassent souvent quelque part.

Mémo : avant de commit un script shell, mentalement check chaque flag — est-ce POSIX ? Si non, ya-t-il un équivalent ? Cinq minutes de discipline économisent une heure de debug Windows plus tard.`,
  },

  {
    id: 'pydantic-email-extra-missing',
    title: 'Pydantic v2 + EmailStr : « email-validator is not installed »',
    category: 'deps',
    axe: '8.0',
    date: '2026-04-30',
    symptom: `ImportError: email-validator is not installed,
run \`pip install 'pydantic[email]'\`

Apparait au premier import du module qui contient un BaseModel avec EmailStr,
souvent à la collecte des tests :
  ERROR tests/test_api.py
  Interrupted: 1 error during collection`,
    cause: `Pydantic v2 ne ship pas \`email-validator\` par défaut pour ne pas alourdir l'install. \`EmailStr\` (et \`HttpUrl\` qui valide aussi via DNS) ont besoin de cette dep optionnelle. Si on a juste \`pydantic\` dans \`pyproject.toml\`, la première utilisation crashe — pas au démarrage du serveur, mais à l'import du module concerné (ce qui peut se produire en collecte de tests, et masquer la cause).`,
    fix: `Toujours déclarer \`pydantic[email]\` dans les deps :

\`\`\`toml
# pyproject.toml
dependencies = [
  "pydantic[email]>=2.10",
  # ...
]
\`\`\`

Puis \`uv sync\` (ou \`pip install -e .\`).

Si tu utilises aussi \`HttpUrl\` qui fait des résolutions DNS au runtime, elle est OK avec \`pydantic[email]\` — c'est le même paquet d'extras.`,
    lesson: `Les **extras** Pydantic (\`[email]\`, \`[timezone]\`) sont opt-in pour économiser quelques Mo. C'est aussi le cas pour des libs comme \`passlib[argon2]\`, \`uvicorn[standard]\`, \`requests[security]\`. Quand une lib propose des extras dans sa doc, scrute-les dès le départ : la lib t'évitera 30 minutes de debugging plus tard.

Mémo : si tu vois un \`ImportError: X is not installed\` après un \`uv sync\` qui semblait OK, c'est presque toujours un extra manquant.`,
  },

  {
    id: 'hono-zvalidator-400-vs-422',
    title: '@hono/zod-validator renvoie 400 au lieu de 422',
    category: 'tests',
    axe: '8.0',
    date: '2026-04-30',
    symptom: `// Test
expect(res.status).toBe(422);
// Reçu : 400
AssertionError: expected 400 to be 422`,
    cause: `Le \`zValidator\` de Hono renvoie un **400 Bad Request** par défaut quand la validation échoue. Mais la convention REST moderne (RFC 4918) dit que **422 Unprocessable Entity** est plus précis quand la requête est syntaxiquement valide mais sémantiquement invalide (un email mal formé, un champ requis absent…). Beaucoup d'APIs et de tests modernes attendent donc 422.`,
    fix: `Wrapper \`zValidator\` dans un helper qui force 422 :

\`\`\`ts
// src/lib/validator.ts
import { zValidator } from '@hono/zod-validator';
import type { ZodSchema } from 'zod';

export function validate<T extends ZodSchema>(target: 'json' | 'query' | 'param', schema: T) {
  return zValidator(target, schema, (result, c) => {
    if (!result.success) {
      return c.json(
        { error: 'Validation failed', issues: result.error.issues },
        422
      );
    }
  });
}
\`\`\`

Puis dans les routes : \`validate('json', MySchema)\` au lieu de \`zValidator(...)\`.`,
    lesson: `Quand un framework expose des defaults qui ne matchent pas ta convention (codes HTTP, format d'erreur, schéma de réponse), **wrap-le dans un helper** plutôt que de l'utiliser brut partout. Tu écris la convention **une fois**, et tu peux la changer **une fois** au lieu de 30 fois.`,
  },
];
