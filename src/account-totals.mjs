export function customerCost(customer) {
  return Math.round((customer.quotaType === 'exclusive' ? 200 : customer.quotaType === 'web' ? 100 : Number(customer.quota) * 8) * 100) / 100;
}

export function customerProfit(customer) {
  return Math.round((Number(customer.fee) - customerCost(customer)) * 100) / 100;
}

export function accountTotals(customers, carId) {
  let costCents = 0;
  let profitCents = 0;
  let spentHundredths = 0;
  for (const customer of customers) {
    if (customer.carId !== carId) continue;
    if (customer.quotaType !== 'web' && customer.quotaType !== 'exclusive') spentHundredths += Math.round(Number(customer.quota) * 100);
    const cost = Math.round(customerCost(customer) * 100);
    costCents += cost;
    profitCents += Math.round(Number(customer.fee) * 100) - cost;
  }
  return { cost: costCents / 100, profit: profitCents / 100, spent: spentHundredths / 100 };
}
