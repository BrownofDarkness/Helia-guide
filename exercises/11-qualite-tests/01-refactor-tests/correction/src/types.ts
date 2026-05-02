export interface CartItem {
  /** Prix unitaire HT en centimes */
  price: number;
  /** Quantité (entier > 0) */
  qty: number;
}

export type UserTier = 'standard' | 'vip';

export interface User {
  tier: UserTier;
}

export interface OrderInput {
  items: CartItem[];
  code?: string;
  user?: User;
}

export interface OrderResult {
  /** Nombre total d'articles (somme des quantités) */
  itemCount: number;
  /** Sous-total HT (avant remise et port) en centimes */
  subtotalCents: number;
  /** Montant de la remise en centimes */
  discountCents: number;
  /** Montant TVA en centimes */
  vatCents: number;
  /** Frais de port en centimes */
  shippingCents: number;
  /** Total TTC à payer en centimes */
  totalCents: number;
  /** Affichage formaté (ex. "$20.40") */
  display: string;
}
