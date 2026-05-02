/**
 * Glossaire central du guide.
 *
 * Format : `key: { short, axe?, exemple? }`
 * - key   : forme canonique (lowercase, sans accent ni pluriel)
 * - short : définition courte (≤ 25 mots)
 * - axe   : sous-section qui développe le terme (lien dans le glossaire)
 * - exemple : phrase courte qui montre le terme en contexte
 */

export interface GlossaireEntry {
  short: string;
  axe?: string;
  exemple?: string;
}

export const glossaire: Record<string, GlossaireEntry> = {
  // ===== JS / TS =====
  closure: {
    short: "Fonction qui se souvient des variables disponibles à l'endroit où elle a été créée.",
    axe: '6.1',
    exemple: "Un compteur dans une fonction qui retient sa valeur entre deux appels.",
  },
  hoisting: {
    short: "Comportement JS qui « remonte » les déclarations en haut de leur scope avant l'exécution.",
    axe: '6.1',
  },
  prototype: {
    short: "Objet parent dont chaque objet JS hérite des propriétés et méthodes.",
    axe: '6.1',
  },
  promise: {
    short: "Représentation d'une opération asynchrone qui finira par réussir ou échouer.",
    axe: '6.2',
    exemple: "`fetch(url)` retourne une Promise qu'on attend avec `await`.",
  },
  async: {
    short: "Mot-clé qui transforme une fonction en fonction asynchrone retournant une Promise.",
    axe: '6.2',
  },
  'event loop': {
    short: "Boucle qui orchestre l'exécution de tâches courtes et asynchrones dans Node ou le navigateur.",
    axe: '6.2',
  },

  // ===== Web =====
  http: {
    short: "Protocole texte qui permet à un client de demander une ressource à un serveur sur le web.",
    axe: '2.2',
  },
  dns: {
    short: "Annuaire d'Internet : transforme un nom de domaine en adresse IP.",
    axe: '2.1',
  },
  tls: {
    short: "Couche de chiffrement qui garantit la confidentialité d'une connexion HTTPS.",
    axe: '2.3',
  },
  cors: {
    short: "Mécanisme du navigateur qui contrôle quels sites peuvent appeler ton API depuis le frontend.",
    axe: '12.2',
  },

  // ===== Frontend =====
  flexbox: {
    short: "Système CSS de mise en page sur un axe (lignes ou colonnes), idéal pour aligner des éléments.",
    axe: '5.2',
  },
  grid: {
    short: "Système CSS de mise en page en deux dimensions (lignes + colonnes).",
    axe: '5.2',
  },
  aria: {
    short: "Attributs HTML qui ajoutent du sens accessibilité quand le HTML natif ne suffit pas.",
    axe: '13.4',
  },
  ssr: {
    short: "Server-Side Rendering — la page HTML est construite côté serveur avant d'être envoyée au navigateur.",
    axe: '7.4',
  },
  ssg: {
    short: "Static Site Generation — la page HTML est générée au build et servie telle quelle.",
    axe: '7.4',
  },
  rsc: {
    short: "React Server Components — composants React qui rendent côté serveur sans embarquer leur JS chez le client.",
    axe: '7.2',
  },

  // ===== Backend / DB =====
  api: {
    short: "Interface qui permet à un programme d'appeler les fonctions d'un autre programme.",
  },
  rest: {
    short: "Style d'API qui mappe les actions sur des verbes HTTP (GET, POST, PUT, DELETE).",
    axe: '8.0',
  },
  jwt: {
    short: "JSON Web Token — jeton signé qui permet de vérifier l'identité d'un utilisateur sans interroger la DB.",
    axe: '8.0',
  },
  argon2id: {
    short: "Algorithme de hash de mot de passe résistant aux attaques GPU, recommandé par OWASP en 2026.",
    axe: '12.3',
  },
  orm: {
    short: "Object-Relational Mapper — bibliothèque qui te laisse manipuler ta DB via du code orienté objet plutôt que du SQL.",
    axe: '9.3',
  },
  sql: {
    short: "Langage standardisé pour interroger et manipuler une base de données relationnelle.",
    axe: '9.1',
  },
  rls: {
    short: "Row-Level Security — règles Postgres qui filtrent automatiquement les lignes selon l'utilisateur.",
    axe: '10.5',
  },

  // ===== DevOps =====
  ci: {
    short: "Continuous Integration — chaque push est automatiquement testé pour détecter les régressions vite.",
    axe: '14.1',
  },
  cd: {
    short: "Continuous Delivery / Deployment — chaque commit validé est déployé automatiquement (ou prêt à l'être).",
    axe: '14.1',
  },
  oidc: {
    short: "OpenID Connect — protocole qui laisse une plateforme prouver à un cloud que ton job CI est légitime, sans secret long-lived.",
    axe: '14.1',
  },
  iac: {
    short: "Infrastructure as Code — décrire l'infra (serveurs, DB, DNS) dans des fichiers versionnés au lieu de cliquer.",
    axe: '14.2',
  },

  // ===== Sécurité =====
  xss: {
    short: "Cross-Site Scripting — l'attaquant injecte du JavaScript dans une page consultée par un autre utilisateur.",
    axe: '12.2',
  },
  csrf: {
    short: "Cross-Site Request Forgery — un site malveillant force ton navigateur à envoyer une requête authentifiée à ta place.",
    axe: '12.2',
  },
  sqli: {
    short: "SQL Injection — l'attaquant glisse du SQL dans un champ pour détourner la requête.",
    axe: '12.3',
  },
  rgpd: {
    short: "Règlement européen sur la protection des données personnelles, en vigueur depuis 2018.",
    axe: '12.4',
  },
  csp: {
    short: "Content Security Policy — en-tête HTTP qui dit au navigateur quelles sources de scripts/styles il peut charger.",
    axe: '12.2',
  },
  hsts: {
    short: "HTTP Strict Transport Security — en-tête qui force le navigateur à utiliser HTTPS pour ce domaine.",
    axe: '12.2',
  },
  idor: {
    short: "Insecure Direct Object Reference — accéder à la ressource d'un autre utilisateur en changeant un ID dans l'URL.",
    axe: '12.3',
  },
  ssrf: {
    short: "Server-Side Request Forgery — l'attaquant force ton serveur à appeler une URL interne/sensible.",
    axe: '12.3',
  },
  oauth: {
    short: "Protocole standard qui permet à un utilisateur d'autoriser une app tierce à accéder à ses données chez un autre service (Google, GitHub).",
    axe: '8.0',
  },
  passkey: {
    short: "Méthode d'authentification sans mot de passe basée sur la cryptographie asymétrique et le device de l'utilisateur.",
    axe: '8.0',
  },

  // ===== Frontend additionnels =====
  dom: {
    short: "Document Object Model — représentation arborescente de la page HTML que JavaScript peut lire et modifier.",
    axe: '6.1',
  },
  hydration: {
    short: "Étape côté client où le navigateur attache les écouteurs JS au HTML rendu côté serveur, le rendant interactif.",
    axe: '7.4',
  },
  hmr: {
    short: "Hot Module Replacement — recharge à chaud les modules modifiés sans perdre l'état de l'app pendant le dev.",
    axe: '7.5',
  },
  spa: {
    short: "Single Page Application — site qui ne recharge pas la page entière, mais met à jour des morceaux via JS.",
    axe: '7.1',
  },
  islands: {
    short: "Pattern Astro où la page est statique sauf des « îlots » React/Vue/Svelte hydratés à la demande.",
    axe: '7.4',
  },
  bundle: {
    short: "Fichier(s) JS/CSS final(s) servi(s) au navigateur, produit(s) par un outil de build (Vite, Webpack, Rollup).",
    axe: '7.5',
  },
  reactivity: {
    short: "Mécanisme par lequel un framework re-rend automatiquement l'UI quand l'état change (signals, refs, hooks).",
    axe: '7.1',
  },

  // ===== Web additionnels =====
  url: {
    short: "Uniform Resource Locator — adresse unique d'une ressource sur le web (https://example.com/page?id=42).",
    axe: '2.2',
  },
  cookie: {
    short: "Petit fichier que le serveur dépose dans ton navigateur pour reconnaître ta session ou tes préférences.",
    axe: '8.0',
  },
  session: {
    short: "État persistant qui identifie un utilisateur entre plusieurs requêtes (souvent via un cookie).",
    axe: '8.0',
  },
  cdn: {
    short: "Content Delivery Network — réseau de serveurs répartis dans le monde qui sert les fichiers statiques près de l'utilisateur.",
    axe: '13.2',
  },
  lcp: {
    short: "Largest Contentful Paint — temps avant que le plus grand élément visible (souvent l'image hero) s'affiche. Cible : ≤ 2,5 s.",
    axe: '13.1',
  },
  inp: {
    short: "Interaction to Next Paint — latence perçue entre une interaction utilisateur et la prochaine peinture. Cible : ≤ 200 ms.",
    axe: '13.1',
  },
  cls: {
    short: "Cumulative Layout Shift — mesure des sauts de mise en page pendant le chargement. Cible : ≤ 0,1.",
    axe: '13.1',
  },
  tbt: {
    short: "Total Blocking Time — temps cumulé pendant lequel le main thread est bloqué (>50ms). Proxy de l'INP en lab. Cible : ≤ 200 ms.",
    axe: '13.1',
  },
  ttfb: {
    short: "Time To First Byte — temps avant que le navigateur reçoive le 1er octet du serveur. Influence direct sur LCP.",
    axe: '13.1',
  },
  fcp: {
    short: "First Contentful Paint — temps avant que le navigateur peigne le 1er pixel utile. Indicateur de réactivité perçue.",
    axe: '13.1',
  },
  'core web vitals': {
    short: "Trio de métriques perf de Google : LCP (chargement), INP (interactivité), CLS (stabilité visuelle). Pénalise le SEO si rouges.",
    axe: '13.1',
  },
  rum: {
    short: "Real User Monitoring — collecte de métriques perf chez les vrais utilisateurs (vs benchs en lab).",
    axe: '13.1',
  },
  wcag: {
    short: "Web Content Accessibility Guidelines — standard W3C de l'accessibilité web. Niveaux A, AA (cible légale), AAA.",
    axe: '13.4',
  },
  rgaa: {
    short: "Référentiel Général d'Amélioration de l'Accessibilité — déclinaison française des WCAG. Obligatoire pour les sites publics FR.",
    axe: '13.4',
  },
  eaa: {
    short: "European Accessibility Act — directive UE 2019/882 qui impose l'accessibilité numérique aux services privés depuis juin 2025.",
    axe: '13.4',
  },
  sse: {
    short: "Server-Sent Events — flux unidirectionnel du serveur vers le client via HTTP, plus simple qu'un WebSocket.",
    axe: '16.2',
  },
  websocket: {
    short: "Connexion TCP persistante bi-directionnelle entre client et serveur, utilisée pour chat, jeu, collab live.",
    axe: '8.5',
  },
  graphql: {
    short: "Langage de requête où le client choisit les champs qu'il veut. 1 endpoint, schéma typé, idéal pour BFF.",
    axe: '8.5',
  },
  grpc: {
    short: "Protocole RPC binaire haute perf de Google sur HTTP/2 avec Protobuf. Standard pour microservices internes.",
    axe: '8.5',
  },
  protobuf: {
    short: "Protocol Buffers — format de sérialisation binaire compact et typé, utilisé par gRPC.",
    axe: '8.5',
  },
  rpc: {
    short: "Remote Procedure Call — appel d'une fonction sur un serveur distant comme si elle était locale.",
    axe: '8.5',
  },
  ddd: {
    short: "Domain-Driven Design — méthode pour modéliser un logiciel autour des concepts métier, par bounded contexts.",
    axe: '8.4',
  },
  'bounded context': {
    short: "Périmètre dans lequel un mot a un sens précis. Justifie le découpage en microservices ou modules.",
    axe: '8.4',
  },
  cqrs: {
    short: "Command Query Responsibility Segregation — séparer les commandes (écrits) et queries (lectures) avec 2 modèles distincts.",
    axe: '8.4',
  },
  'event sourcing': {
    short: "Pattern de persistance qui stocke la séquence d'événements plutôt que l'état actuel. Powerful mais complexe.",
    axe: '8.4',
  },
  saga: {
    short: "Transaction distribuée découpée en étapes locales avec compensations en cas d'échec. Pour microservices.",
    axe: '8.4',
  },
  modulith: {
    short: "Monolith modulaire — 1 process, N modules avec frontières strictes. Le bon défaut 2026 pour 80 % des cas.",
    axe: '8.4',
  },
  outbox: {
    short: "Pattern qui garantit l'atomicité entre un write DB et la publication d'un event sur un broker externe.",
    axe: '8.4',
  },

  // ===== Backend / DB additionnels =====
  middleware: {
    short: "Fonction qui s'exécute entre la requête entrante et le handler final (auth, logs, validation).",
    axe: '8.0',
  },
  idempotence: {
    short: "Une opération est idempotente si la rejouer produit le même résultat — important pour les retry réseau.",
    axe: '8.0',
  },
  webhook: {
    short: "URL que tu fournis à un service tiers (Stripe, GitHub) pour qu'il te notifie d'un événement.",
    axe: '10.2',
  },
  openapi: {
    short: "Standard pour décrire une API REST en YAML/JSON (anciennement Swagger).",
    axe: '8.0',
  },
  index: {
    short: "Structure de données qui accélère la recherche dans une table SQL — comme l'index d'un livre.",
    axe: '9.1',
  },
  transaction: {
    short: "Bloc d'opérations DB qui réussissent toutes ou échouent toutes ensemble (atomicité ACID).",
    axe: '9.1',
  },
  'n+1': {
    short: "Anti-pattern ORM : 1 requête + N requêtes filles au lieu d'un join — explose vite la latence.",
    axe: '13.3',
  },
  migration: {
    short: "Script versionné qui modifie le schéma DB de façon reproductible (CREATE TABLE, ALTER TABLE).",
    axe: '9.3',
  },
  baas: {
    short: "Backend-as-a-Service — service qui te fournit auth + DB + storage clé en main (Firebase, Supabase, Appwrite).",
    axe: '10.1',
  },

  // ===== DevOps additionnels =====
  docker: {
    short: "Outil qui empaquette une appli avec ses dépendances dans un conteneur reproductible.",
    axe: '4.4',
  },
  conteneur: {
    short: "Process isolé qui embarque son propre système de fichiers et ses dépendances (Docker, Podman).",
    axe: '4.4',
  },
  kubernetes: {
    short: "Orchestrateur qui déploie, scale et gère des conteneurs sur un cluster de machines.",
    axe: '14.4',
  },
  terraform: {
    short: "Outil de référence pour décrire l'infrastructure cloud en HCL (langage déclaratif).",
    axe: '14.2',
  },
  slo: {
    short: "Service Level Objective — objectif chiffré de fiabilité (99,5 % de dispo sur 30 jours).",
    axe: '14.5',
  },
  sli: {
    short: "Service Level Indicator — la mesure technique réelle utilisée pour évaluer un SLO.",
    axe: '14.5',
  },
  mttr: {
    short: "Mean Time To Recovery — temps moyen pour revenir à un état sain après un incident.",
    axe: '14.6',
  },
  postmortem: {
    short: "Document qui analyse un incident sans blâmer une personne, pour en tirer des actions concrètes.",
    axe: '14.6',
  },
  runbook: {
    short: "Document court et actionnable qu'un on-call lit à 3h du matin pour résoudre une alerte.",
    axe: '14.6',
  },

  // ===== Méthodes & outils =====
  agile: {
    short: "Famille de méthodes (Scrum, Kanban, ShapeUp) qui privilégient livraisons fréquentes et adaptation au changement.",
    axe: '15.1',
  },
  scrum: {
    short: "Méthode agile à cycles courts (sprints) avec rôles définis (PO, Scrum Master, équipe).",
    axe: '15.1',
  },
  kanban: {
    short: "Méthode agile en flux continu, sans sprints, avec une limite de tâches en cours (WIP).",
    axe: '15.1',
  },
  mvp: {
    short: "Minimum Viable Product — la plus petite version qui livre déjà de la valeur et permet d'apprendre.",
    axe: '3.2',
  },
  kpi: {
    short: "Key Performance Indicator — métrique clé suivie en continu pour piloter un produit.",
    axe: '17.4',
  },
  okr: {
    short: "Objectives & Key Results — format de pilotage à objectif qualitatif + résultats chiffrés observables.",
    axe: '17.4',
  },
  raci: {
    short: "Matrice tâches × personnes : Responsible, Accountable, Consulted, Informed.",
    axe: '17.4',
  },
  swot: {
    short: "Matrice 2×2 d'analyse stratégique : Strengths, Weaknesses, Opportunities, Threats.",
    axe: '17.4',
  },
  star: {
    short: "Format de réponse aux entretiens comportementaux : Situation, Task, Action, Result.",
    axe: '17.3',
  },
  adr: {
    short: "Architecture Decision Record — document court qui capture une décision technique, son contexte et ses conséquences.",
    axe: '15.3',
  },
  rfc: {
    short: "Request For Comments — document qui propose une décision technique et invite l'équipe à commenter avant validation.",
    axe: '15.3',
  },

  // ===== Spécialisations =====
  pwa: {
    short: "Progressive Web App — site web installable, capable de fonctionner hors-ligne et de recevoir des notifications push.",
    axe: '16.1',
  },
  crdt: {
    short: "Conflict-free Replicated Data Type — structure de données qui permet plusieurs édits simultanés convergeant tous au même état final.",
    axe: '16.2',
  },
  llm: {
    short: "Large Language Model — modèle d'IA générative entraîné sur du texte (Claude, GPT, Mistral, Gemini).",
    axe: '16.4',
  },
  rag: {
    short: "Retrieval-Augmented Generation — on recherche les bons morceaux de doc avant de les donner au LLM pour qu'il réponde sans inventer.",
    axe: '16.4',
  },
  embedding: {
    short: "Vecteur numérique qui représente le sens d'un texte, utilisé pour comparer la similarité de deux phrases.",
    axe: '16.4',
  },
  edge: {
    short: "Compute exécuté sur un réseau de petits serveurs proches géographiquement de l'utilisateur (~50 ms de latence).",
    axe: '16.5',
  },
  wasm: {
    short: "WebAssembly — format binaire compact qui tourne dans le navigateur ou côté serveur à des perfs proches du natif.",
    axe: '16.5',
  },
};

/**
 * Forme canonique : lowercase, sans accent, dépluralisation simple.
 * Permet d'utiliser <Term>closures</Term> et trouver l'entrée "closure".
 */
export function canonicalKey(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/s$/, '')
    .trim();
}
