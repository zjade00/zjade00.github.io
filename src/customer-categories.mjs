import { accountTotals } from './account-totals.mjs';

export function daysUntilExpiry(expires, now = new Date()) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(expires || '');
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  const expiry = new Date(Date.UTC(year, month - 1, day));
  if (expiry.getUTCFullYear() !== year || expiry.getUTCMonth() !== month - 1 || expiry.getUTCDate() !== day) return null;
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((expiry.getTime() - today) / 86400000);
}

export function categoryCustomers(customers, category, now = new Date()) {
  if (category === 'archived-customers') {
    return customers.filter(c => c.archivedAt).sort((a, b) => b.archivedAt.localeCompare(a.archivedAt));
  }
  const active = customers.filter(c => !c.archivedAt);
  if (category === 'watch' || category === 'confirmed') return active.filter(c => c.risk === category);
  if (category === 'expiry') {
    return active.filter(c => {
      const days = daysUntilExpiry(c.expires, now);
      return days !== null && days >= 1 && days <= 3;
    }).sort((a, b) => daysUntilExpiry(a.expires, now) - daysUntilExpiry(b.expires, now) || a.id - b.id);
  }
  return [];
}

export function archiveCustomerRecords(customers, cars, customerId, now = new Date().toISOString()) {
  const customer = customers.find(c => c.id === customerId && !c.archivedAt);
  if (!customer) return { customers, cars };
  const car = cars.find(c => c.id === customer.carId);
  return {
    customers: customers.map(c => c.id === customerId ? { ...c, archivedAt: now, archivedCarName: car?.name || '原账号不可用' } : c),
    cars: cars.map(c => c.id === customer.carId && !c.archivedAt ? {
      ...c, updatedAt: now, quota: Math.max(0, c.quota - customer.quota),
      customers: c.customers.filter(id => id !== customerId),
    } : c),
  };
}

export function archiveCarRecords(cars, customers, carId, now = new Date().toISOString()) {
  return cars.map(car => car.id === carId && !car.archivedAt ? {
    ...car, archivedAt: now,
    archivedTotals: accountTotals(customers, car.id),
    archivedCustomers: customers.filter(c => c.carId === car.id && !c.archivedAt).map(c => ({ ...c, tags: [...c.tags] })),
  } : car);
}
