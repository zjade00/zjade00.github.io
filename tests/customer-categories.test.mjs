import test from 'node:test';
import assert from 'node:assert/strict';
import { daysUntilExpiry, categoryCustomers, archiveCustomerRecords, archiveCarRecords } from '../src/customer-categories.mjs';
import { accountTotals } from '../src/account-totals.mjs';
const now = new Date(2026, 8, 13, 23, 55);
const base = { id: 1, name: '测试客户', carId: 7, quota: 10, quotaType: 'web_percentage', fee: 250, tags: ['好说话'], risk: 'watch', expires: '2026-09-14', note: '保留备注' };
const car = { id: 7, name: '测试车', state: 'red', quota: 10, customers: [1], remaining: 90, resets: 2, totalQuota: 100 };
test('expiry follows calendar dates, includes all three future days and excludes other records', () => {
  const rows = ['2026-09-16','2026-09-13','2026-09-15','2026-09-14','2026-09-17','','2026-02-30'].map((expires,id)=>({...base,id,expires}));
  rows.push({...base,id:10,archivedAt:'2026-09-13'});
  assert.deepEqual(categoryCustomers(rows,'expiry',now).map(c=>c.expires),['2026-09-14','2026-09-15','2026-09-16']);
  assert.equal(daysUntilExpiry('2027-01-01',new Date(2026,11,31)),1);
  assert.equal(daysUntilExpiry('2028-03-01',new Date(2028,1,28)),2);
  assert.equal(daysUntilExpiry('2026-02-30',now),null);
  assert.equal(categoryCustomers(Array.from({length:20},(_,id)=>({...base,id})),'expiry',now).length,20);
});
test('risk lists exclude archived customers', () => {
  const rows=[base,{...base,id:2,risk:'confirmed'},{...base,id:3,archivedAt:'2026-09-13'}];
  assert.deepEqual(categoryCustomers(rows,'watch').map(c=>c.id),[1]);
  assert.deepEqual(categoryCustomers(rows,'confirmed').map(c=>c.id),[2]);
});
test('customer archive retains information, excludes totals, and is idempotent', () => {
  const result=archiveCustomerRecords([base],[car],1,'2026-09-13T12:00:00Z');
  assert.equal(result.customers.length,1);
  assert.equal(result.customers[0].note,base.note);
  assert.equal(result.customers[0].archivedCarName,car.name);
  assert.deepEqual(result.cars[0].customers,[]);
  assert.deepEqual(accountTotals(result.customers,7),{spent:0,cost:0,profit:0});
  assert.deepEqual(archiveCustomerRecords(result.customers,result.cars,1),result);
  assert.equal(categoryCustomers(JSON.parse(JSON.stringify(result.customers)),'archived-customers').length,1);
});
test('car archive freezes totals and members without archiving active customers', () => {
  const customers=[{...base,tags:[...base.tags]}];
  const cars=archiveCarRecords([car],customers,7,'2026-09-13T12:00:00Z');
  assert.deepEqual(cars[0].archivedTotals,{spent:10,cost:180,profit:70});
  assert.equal(customers[0].archivedAt,undefined);
  customers[0].fee=300; customers[0].tags.push('事儿少');
  assert.equal(cars[0].archivedCustomers[0].fee,250);
  assert.deepEqual(cars[0].archivedCustomers[0].tags,['好说话']);
  assert.equal(JSON.parse(JSON.stringify(cars))[0].archivedCustomers[0].note,base.note);
});
