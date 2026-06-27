// All calls go to the backend via the Vite proxy (/api -> localhost:4000).

async function req(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let detail;
    try {
      detail = await res.json();
    } catch {
      detail = { error: res.statusText };
    }
    const err = new Error(detail.error || 'request_failed');
    err.detail = detail;
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export const api = {
  health: () => req('GET', '/api/health'),

  getStore: () => req('GET', '/api/store'),
  updateStore: (patch) => req('PUT', '/api/store', patch),
  rollKeys: () => req('POST', '/api/store/roll-keys'),

  getProducts: () => req('GET', '/api/products'),
  createProduct: (p) => req('POST', '/api/products', p),
  updateProduct: (id, p) => req('PUT', `/api/products/${id}`, p),
  deleteProduct: (id) => req('DELETE', `/api/products/${id}`),
  getCheckout: (id) => req('GET', `/api/products/${id}/checkout`),

  getTransactions: () => req('GET', '/api/transactions'),
  confirmCheckout: (payload) => req('POST', '/api/checkout/confirm', payload),

  getCustomers: () => req('GET', '/api/customers'),

  seed: () => req('POST', '/api/seed'),
  reset: (keepStore) => req('POST', '/api/reset', { keepStore }),
};
