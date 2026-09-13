export function accountTotals(customers, carId) {
  let costCents = 0;
  let profitCents = 0;
  for (const customer of customers) {
    if (customer.carId !== carId) continue;
    const cost = Math.round(Number(customer.quota) * 800);
    costCents += cost;
    profitCents += Math.round(Number(customer.fee) * 100) - cost;
  }
  return { cost: costCents / 100, profit: profitCents / 100 };
}
