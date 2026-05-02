'use client';

import { useState } from 'react';

export function UpgradeButton() {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    const response = await fetch('/api/checkout', { method: 'POST' });
    const { url } = await response.json();
    if (url) window.location.href = url;
  }

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? 'Redirection…' : 'Passer à Pro — 9 €/mois'}
    </button>
  );
}
