// Module de pricing — VOLONTAIREMENT MAL ÉCRIT
// À refactorer en respectant les critères du README.

export function computeOrderTotal(input: any) {
  let total = 0;
  let totalQty = 0;
  for (let i = 0; i < input.items.length; i++) {
    const it = input.items[i];
    if (it.qty < 1) continue;
    let p = it.price;
    if (p < 0) p = 0;
    total += p * it.qty;
    totalQty += it.qty;
  }

  // free shipping si > 50€
  let shipping = 590;
  if (total >= 5000) shipping = 0;

  // promotions
  let discount = 0;
  if (input.code) {
    if (input.code === 'SUMMER10') discount = total * 0.10;
    else if (input.code === 'WELCOME20') discount = total * 0.20;
    else if (input.code === 'VIP50') discount = total * 0.50;
    else if (input.code === 'FLAT5') discount = 500;
  }

  // si membre VIP, 5% en plus
  if (input.user && input.user.tier === 'vip') discount += total * 0.05;

  // borne discount
  if (discount > total) discount = total;

  // 20% TVA — on suppose que les prix sont HT
  const tva = (total - discount) * 0.20;

  // total TTC
  const ttc = total - discount + tva + shipping;

  // formatage
  const formatted = '$' + (ttc / 100).toFixed(2);

  return {
    items: totalQty,
    subtotal: total,
    discount: discount,
    tva: tva,
    shipping: shipping,
    total: ttc,
    display: formatted,
  };
}

// Démo
console.log(
  computeOrderTotal({
    items: [
      { price: 1000, qty: 2 },
      { price: 2000, qty: 1 },
    ],
    code: 'SUMMER10',
    user: { tier: 'vip' },
  })
);
