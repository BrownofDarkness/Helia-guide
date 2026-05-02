/**
 * Constantes métier — extraites des magic numbers du code original.
 * En prod, ces valeurs viendraient probablement de la DB ou d'un fichier de config.
 */

export const VAT_RATE = 0.2;

/** Frais de port en centimes */
export const SHIPPING_FEE_CENTS = 590;

/** Seuil de gratuité du port (50 €) en centimes */
export const FREE_SHIPPING_THRESHOLD_CENTS = 5000;

/** Bonus VIP : 5 % supplémentaires sur le total */
export const VIP_DISCOUNT_RATE = 0.05;
