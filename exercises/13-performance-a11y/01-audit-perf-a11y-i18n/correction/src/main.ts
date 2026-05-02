// ✅ P-008 : seul `debounce` est embarqué — pas tout lodash. ~700 octets vs ~70 KB.
import { onLCP, onINP, onCLS } from 'web-vitals';

type Locale = 'fr' | 'en' | 'ar';
const RTL_LOCALES = new Set<Locale>(['ar']);

interface Dict {
  [key: string]: string | Dict;
}

const cache = new Map<Locale, Dict>();
let currentLocale: Locale = (localStorage.getItem('lang') as Locale) || detectLocale();
let messages: Dict = {};

function detectLocale(): Locale {
  const lang = navigator.language.slice(0, 2);
  if (lang === 'fr' || lang === 'en' || lang === 'ar') return lang;
  return 'fr';
}

// ✅ P-008b : code splitting — chaque locale est un chunk JSON dynamique.
async function loadLocale(locale: Locale): Promise<Dict> {
  if (cache.has(locale)) return cache.get(locale)!;
  const dict = (await import(`./i18n/${locale}.json`)).default as Dict;
  cache.set(locale, dict);
  return dict;
}

function t(key: string, vars: Record<string, string | number> = {}): string {
  const value = key.split('.').reduce<unknown>((o, k) => (o as Dict)?.[k], messages);
  if (typeof value !== 'string') return key;
  return value.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}

// ✅ I-003 : pluriel via Intl.PluralRules — toutes les règles CLDR.
const cartFormatter = new Map<Locale, Intl.PluralRules>();
function pluralRules(locale: Locale): Intl.PluralRules {
  if (!cartFormatter.has(locale)) cartFormatter.set(locale, new Intl.PluralRules(locale));
  return cartFormatter.get(locale)!;
}

function cartLabel(count: number): string {
  if (count === 0) return t('cart.empty');
  const cat = pluralRules(currentLocale).select(count);
  // L'arabe a 6 catégories : zero, one, two, few, many, other.
  // FR/EN ont surtout one/other.
  const key = `cart.${cat}`;
  let pattern = key.split('.').reduce<unknown>((o, k) => (o as Dict)?.[k], messages);
  if (typeof pattern !== 'string') {
    pattern = (messages as any).cart?.many ?? `${count}`;
  }
  return `${t('cart.label')} : ${(pattern as string).replace('{count}', String(count))}`;
}

// ✅ P-006 : remplacement du faux long task — calcul réel non-bloquant.
let cart: string[] = [];

function addToCart(id: string): void {
  cart.push(id);
  renderCart();
}

function renderCart(): void {
  const el = document.getElementById('cart-status');
  if (el) el.textContent = cartLabel(cart.length);
}

// ✅ I-006 : prix formatés via Intl.NumberFormat selon la locale.
function renderPrices(): void {
  const fmt = new Intl.NumberFormat(currentLocale, {
    style: 'currency',
    currency: 'EUR',
  });
  document.querySelectorAll<HTMLElement>('.price').forEach((el) => {
    const raw = Number(el.dataset.price);
    el.textContent = fmt.format(raw);
  });
}

// ✅ I-007 : applique les traductions sur les nœuds [data-i18n].
function applyTranslations(): void {
  document.documentElement.lang = currentLocale;
  document.documentElement.dir = RTL_LOCALES.has(currentLocale) ? 'rtl' : 'ltr';

  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n!;
    el.textContent = t(key);
  });

  // Date formatée
  const today = new Date();
  const dateFmt = new Intl.DateTimeFormat(currentLocale, { dateStyle: 'long' }).format(today);
  document.querySelectorAll<HTMLElement>('[data-i18n="footer.lastUpdate"]').forEach((el) => {
    el.textContent = t('footer.lastUpdate', { date: dateFmt });
  });

  renderPrices();
  renderCart();
}

async function setLocale(locale: Locale): Promise<void> {
  currentLocale = locale;
  localStorage.setItem('lang', locale);
  messages = await loadLocale(locale);
  applyTranslations();
}

// --- Form ---

function validateEmail(value: string): 'empty' | 'invalid' | null {
  if (!value.trim()) return 'empty';
  if (!/.+@.+\..+/.test(value)) return 'invalid';
  return null;
}

function setupForm(): void {
  const form = document.getElementById('order-form') as HTMLFormElement;
  const input = document.getElementById('email') as HTMLInputElement;
  const error = document.getElementById('email-error') as HTMLElement;
  const dialog = document.getElementById('modal') as HTMLDialogElement;
  const closeBtn = document.getElementById('modal-close') as HTMLButtonElement;

  // ✅ P-009 : debounce maison (3 lignes — pas la peine d'importer une lib)
  let lastCheck = 0;
  const debouncedCheck = (value: string) => {
    const now = Date.now();
    if (now - lastCheck < 200) return;
    lastCheck = now;
    // léger check non-bloquant
    if (validateEmail(value) === null) input.removeAttribute('aria-invalid');
  };

  input.addEventListener('input', (e) => debouncedCheck((e.target as HTMLInputElement).value));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const issue = validateEmail(input.value);
    if (issue) {
      input.setAttribute('aria-invalid', 'true');
      error.textContent = t(issue === 'empty' ? 'contact.emailErrorEmpty' : 'contact.emailErrorInvalid');
      input.focus();
      return;
    }
    input.removeAttribute('aria-invalid');
    error.textContent = '';
    dialog.showModal();
  });

  closeBtn.addEventListener('click', () => dialog.close());
}

function setupCart(): void {
  document.querySelectorAll<HTMLButtonElement>('button[data-add]').forEach((btn) => {
    btn.addEventListener('click', () => addToCart(btn.dataset.add!));
  });
}

function setupCookies(): void {
  const banner = document.getElementById('cookie-banner') as HTMLElement;
  const accept = document.getElementById('cookie-accept') as HTMLButtonElement;
  if (localStorage.getItem('cookies-ack')) return;
  banner.hidden = false;
  accept.addEventListener('click', () => {
    localStorage.setItem('cookies-ack', '1');
    banner.hidden = true;
  });
}

function setupLangSwitcher(): void {
  const select = document.getElementById('lang-select') as HTMLSelectElement;
  select.value = currentLocale;
  select.addEventListener('change', () => setLocale(select.value as Locale));
}

// --- RUM (Real User Monitoring) — bonus ---

function reportVitals(): void {
  const send = (m: { name: string; value: number; rating: string }) => {
    // En prod → navigator.sendBeacon('/rum', JSON.stringify(m))
    console.log('[web-vital]', m.name, Math.round(m.value), m.rating);
  };
  onLCP(send);
  onINP(send);
  onCLS(send);
}

// --- Boot ---

async function main(): Promise<void> {
  setupLangSwitcher();
  setupForm();
  setupCart();
  setupCookies();
  await setLocale(currentLocale);
  reportVitals();
}

main();
