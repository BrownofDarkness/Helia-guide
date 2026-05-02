// ⚠️ P-008 : import lodash COMPLET (~70 KB)
import _ from 'lodash';

// État global
let cart: string[] = [];

// ⚠️ P-005 : la bannière est rendue tardivement (après hydratation) → CLS
window.addEventListener('load', () => {
  setTimeout(() => {
    const banner = document.getElementById('cookie-banner');
    if (banner) banner.style.display = 'flex';
  }, 1500);
});

// ⚠️ I-002 : strings hardcodées en français
function updateCartStatus(): void {
  const el = document.getElementById('cart-status');
  if (!el) return;
  // ⚠️ I-003 : pluriel par if (faux pour AR/RU/PL)
  if (cart.length === 0) {
    el.textContent = 'Panier : 0 article';
  } else if (cart.length === 1) {
    el.textContent = 'Panier : 1 article';
  } else {
    el.textContent = `Panier : ${cart.length} articles`;
  }
}

// ⚠️ A-006 : alerte modale custom sans focus management
(window as any).addToCart = (id: string): void => {
  cart.push(id);
  updateCartStatus();

  // ⚠️ P-006 : long task synchrone à chaque clic (~300-500 ms)
  let total = 0;
  for (let i = 0; i < 20_000_000; i++) {
    total += Math.sqrt(i);
  }
  console.log('total fictif', total);
};

// ⚠️ I-002/I-004 : validation hardcodée FR + erreur uniquement par couleur
function validateEmail(value: string): boolean {
  return /.+@.+\..+/.test(value);
}

(window as any).submitForm = (e: Event): void => {
  e.preventDefault();
  const input = document.getElementById('email') as HTMLInputElement;
  const error = document.getElementById('email-error');
  if (!validateEmail(input.value)) {
    input.classList.add('error');                  // ← couleur seule
    if (error) error.textContent = '';              // ← message vide
    return;
  }
  input.classList.remove('error');
  showModal();
};

function showModal(): void {
  document.getElementById('modal')?.classList.remove('hidden');
}
(window as any).closeModal = () => {
  document.getElementById('modal')?.classList.add('hidden');
};

// ⚠️ P-009 : recompute coûteux à chaque keystroke (pas de debounce)
//            (debounce existe avec lodash mais on ne l'utilise pas)
const _unused = _.debounce; // import inutilisé qui reste dans le bundle
document.getElementById('email')?.addEventListener('input', (e) => {
  const value = (e.target as HTMLInputElement).value;
  // recompute lourd
  let s = 0;
  for (let i = 0; i < 1_000_000; i++) s += i;
  console.log('check', value, s);
});

updateCartStatus();
