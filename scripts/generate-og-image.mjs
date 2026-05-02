#!/usr/bin/env node
/**
 * Génère public/og-image.png (1200×630) depuis un SVG inline.
 * Reprend l'identité visuelle d'Helia : logo + nom + tagline + dots persona.
 *
 * Usage : node scripts/generate-og-image.mjs
 */
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const OUTPUT = 'public/og-image.png';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <!-- Lueur radiale subtile en haut à droite -->
    <radialGradient id="bgGlow" cx="78%" cy="22%" r="80%">
      <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.18"/>
      <stop offset="50%" stop-color="#3b82f6" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#0a0a0d" stop-opacity="0"/>
    </radialGradient>

    <!-- Soleil central du logo : cream → ambre → orange -->
    <radialGradient id="sunGrad" cx="40%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#fef3c7"/>
      <stop offset="60%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </radialGradient>

    <!-- Pattern de points subtils en arrière-plan -->
    <pattern id="dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1" fill="#ffffff" opacity="0.04"/>
    </pattern>
  </defs>

  <!-- Background sombre + lueur + dots -->
  <rect width="1200" height="630" fill="#0a0a0d"/>
  <rect width="1200" height="630" fill="url(#dots)"/>
  <rect width="1200" height="630" fill="url(#bgGlow)"/>

  <!-- LOGO HELIA — 5 chevrons orbitaux + soleil, centré en (270, 315) -->
  <g transform="translate(270, 315)">
    <g fill="none" stroke-width="13" stroke-linecap="round" stroke-linejoin="round">
      <path d="M -26 -68 L 0 -100 L 26 -68" stroke="#c97744" transform="rotate(0)"/>
      <path d="M -26 -68 L 0 -100 L 26 -68" stroke="#4a8aaf" transform="rotate(72)"/>
      <path d="M -26 -68 L 0 -100 L 26 -68" stroke="#5a9469" transform="rotate(144)"/>
      <path d="M -26 -68 L 0 -100 L 26 -68" stroke="#b974a8" transform="rotate(216)"/>
      <path d="M -26 -68 L 0 -100 L 26 -68" stroke="#7569a5" transform="rotate(288)"/>
    </g>
    <circle r="26" fill="url(#sunGrad)"/>
    <circle cx="-9" cy="-9" r="8" fill="#ffffff" opacity="0.5"/>
  </g>

  <!-- TEXTE à droite -->
  <g font-family="'Segoe UI', Roboto, system-ui, -apple-system, sans-serif" fill="#ffffff">
    <!-- Helia (très gros) -->
    <text x="510" y="230" font-size="128" font-weight="700" letter-spacing="-3">Helia</text>

    <!-- Tagline -->
    <text x="510" y="290" font-size="34" font-weight="400" fill="#a3a3a3">Guide francophone du développeur web</text>

    <!-- Stats — séparateurs middle dot -->
    <text x="510" y="362" font-size="24" font-weight="500" fill="#737373" letter-spacing="0.5">17 axes  ·  5 parcours  ·  280 termes  ·  32 pièges</text>

    <!-- 5 dots des personas + noms juste en dessous -->
    <g>
      <circle cx="520" cy="430" r="10" fill="#c97744"/>
      <circle cx="552" cy="430" r="10" fill="#4a8aaf"/>
      <circle cx="584" cy="430" r="10" fill="#5a9469"/>
      <circle cx="616" cy="430" r="10" fill="#b974a8"/>
      <circle cx="648" cy="430" r="10" fill="#7569a5"/>
    </g>
    <text x="510" y="470" font-size="16" font-weight="400" fill="#525252" letter-spacing="0.3">Marie  ·  Hugo  ·  Sami  ·  Léa  ·  Yanis</text>

    <!-- CTA — bouton ambre arrondi qui appelle au clic -->
    <g>
      <rect x="510" y="510" width="265" height="58" rx="29" fill="#fbbf24"/>
      <text x="642" y="548" font-size="24" font-weight="700" fill="#0a0a0d" text-anchor="middle" letter-spacing="0.2">Démarrer  →</text>
    </g>
  </g>

  <!-- URL bas-droite (signature discrète) -->
  <text x="1140" y="595" font-family="'Cascadia Mono', 'JetBrains Mono', Consolas, monospace"
        font-size="18" fill="#404040" text-anchor="end">helia-52w.pages.dev</text>

  <!-- Bordure-trait haut, accent gradient des 5 personas -->
  <defs>
    <linearGradient id="topAccent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#c97744"/>
      <stop offset="25%" stop-color="#4a8aaf"/>
      <stop offset="50%" stop-color="#5a9469"/>
      <stop offset="75%" stop-color="#b974a8"/>
      <stop offset="100%" stop-color="#7569a5"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="1200" height="4" fill="url(#topAccent)"/>
</svg>`;

mkdirSync(dirname(OUTPUT), { recursive: true });

await sharp(Buffer.from(svg))
  .png({ quality: 90, compressionLevel: 9 })
  .toFile(OUTPUT);

const stats = await sharp(OUTPUT).metadata();
console.log(`✓ ${OUTPUT} généré — ${stats.width}×${stats.height}`);
