// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  Pencil1Icon,
  PlusIcon,
} from "@radix-ui/react-icons";
import "./prototype.css";
import { accountTotals, customerCost, customerProfit } from "./account-totals.mjs";
import { archiveCarRecords, archiveCustomerRecords, categoryCustomers, daysUntilExpiry } from "./customer-categories.mjs";
type Category = "expiry" | "archived-cars" | "archived-customers" | "watch" | "confirmed";
type Risk = "safe" | "unknown" | "watch" | "confirmed";
type State = "green" | "orange" | "red";
function BottomSheet({ open, onOpenChange, title, children }: any) {
  return <Dialog.Root open={open} onOpenChange={onOpenChange} modal={false}>
    {open && <div className="native-sheet-backdrop" onClick={() => onOpenChange(false)} />}
    <Dialog.Content className="native-sheet" aria-describedby={undefined}
      onOpenAutoFocus={(event) => event.preventDefault()}
      onCloseAutoFocus={(event) => event.preventDefault()}
      onInteractOutside={(event) => event.preventDefault()}>
      <div className="native-sheet-header"><Dialog.Title>{title}</Dialog.Title><Dialog.Close aria-label="关闭编辑">关闭</Dialog.Close></div>
      <div className="native-sheet-body">{children}</div>
    </Dialog.Content>
  </Dialog.Root>;
}
function MobileScroll({ className, children }: any) {
  return <div className={`native-page ${className || ""}`}>{children}</div>;
}
function MobileTextField({ onValueChange, ...props }: any) {
  return (
    <input {...props} onChange={(e) => onValueChange(e.target.value)} />
  );
}
type Customer = {
  id: number;
  name: string;
  wechat: string;
  carId: number;
  risk: Risk;
  fee: number;
  quota: number;
  quotaType?: "percentage" | "web" | "exclusive" | "web_percentage";
  webCost?: number;
  tags: string[];
  usage: string;
  reason?: string;
  note?: string;
  special?: string;
  joined: string;
  expires: string;
  lastLogin: string;
  device: "Windows" | "Mac" | "Linux";
  archivedAt?: string;
  archivedCarName?: string;
};
type Car = {
  id: number;
  name: string;
  state: State;
  quota: number;
  customers: number[];
  spent?: number;
  cost?: number;
  profit?: number;
  remaining?: number;
  resets?: number;
  totalQuota?: number;
  updatedAt?: string;
  archivedAt?: string;
  archivedTotals?: { spent: number; cost: number; profit: number };
  archivedCustomers?: Customer[];
};
const carFields = [
  ["spent", "已拼多少", "%"], ["cost", "已拼成本", "元"], ["profit", "利润", "元"],
  ["remaining", "剩余额度", "%"], ["resets", "重置次数", "次"], ["totalQuota", "总拼额度", "%"],
] as const;
const seedCars: Car[] = [];
const seedCustomers: Customer[] = [];
const labels: Record<Risk, string> = {
  safe: "可信",
  unknown: "未判断",
  watch: "需留意",
  confirmed: "已确定",
};
const preset = [
  "好说话",
  "事儿少",
  "沟通顺畅",
  "配合度高",
  "事儿多",
  "不好说话",
];
const reasons = [
  "暂未找到真正的嫌疑人",
  "账号额度消耗异常",
  "用量情况有出入，有嫌疑",
];
function load<T>(k: string, v: T): T {
  try {
    return JSON.parse(localStorage.getItem(k) || "") || v;
  } catch {
    return v;
  }
}
export default function Prototype() {
  const [cars, setCars] = useState<Car[]>(() => load("cm2-cars", seedCars)),
    [customers, setCustomers] = useState<Customer[]>(() => load("cm2-customers", seedCustomers)),
    [tab, setTab] = useState<"cars" | "customers" | "categories">("cars"),
    [category, setCategory] = useState<Category | null>(null),
    [today, setToday] = useState(() => new Date()),
    [selectedId, setSelectedId] = useState<number | null>(null),
    [page, setPage] = useState(1),
    [carFilter, setCarFilter] = useState<"all" | State>("all"),
    [query, setQuery] = useState(""),
    [applied, setApplied] = useState(""),
    [sheet, setSheet] = useState(false),
    [risk, setRisk] = useState<Risk | null>(null),
    [tagFilter, setTags] = useState<string[]>([]),
    [sort, setSort] = useState<"default" | "profit" | "risk">("risk"),
    [customerForm, setCustomerForm] = useState<{ open: boolean; customer?: Customer }>({ open: false }),
    [carForm, setCarForm] = useState(false),
    [priorityOpen, setPriorityOpen] = useState(false);
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).then((registration) => registration.update()).catch(() => undefined);
    }
  }, []);
  useEffect(() => {
    const refresh = () => setToday(new Date());
    const timer = window.setInterval(refresh, 60000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, []);
  useEffect(
    () => localStorage.setItem("cm2-cars", JSON.stringify(cars)),
    [cars],
  );
  useEffect(
    () => localStorage.setItem("cm2-customers", JSON.stringify(customers)),
    [customers],
  );
  const activeCars = useMemo(() => cars.filter(c => !c.archivedAt), [cars]);
  const selected = activeCars.find((c) => c.id === selectedId);
  const ownerValues = useMemo(() => selected ? {
    name: selected.name,
    state: selected.state,
    ...accountTotals(customers, selected.id),
    remaining: selected.remaining ?? 100,
    resets: selected.resets ?? 0,
    totalQuota: selected.totalQuota ?? 0,
  } : undefined, [selected, customers]);
  const addCar = () => {
    const id = Date.now();
    setCars((items) => [...items, { id, name: `新车账号${items.length + 1}`, state: "green", quota: 0, customers: [], spent: 0, cost: 0, profit: 0, remaining: 100, resets: 0, updatedAt: new Date().toISOString() }]);
    setSelectedId(id);
    setCarForm(true);
  };
  const addCustomer = () => activeCars.length && setCustomerForm({ open: true });
  const editCustomer = (c: Customer) => setCustomerForm({ open: true, customer: c });
  const changeTab = (next: "cars" | "customers" | "categories") => {
    (document.activeElement as HTMLElement)?.blur?.();
    setCarForm(false); setCustomerForm({ open: false }); setSheet(false); setPriorityOpen(false);
    setSelectedId(null); setTab(next); setCategory(null);
  };
  const navigation = <nav className="nav" aria-label="主要分类"><button className={tab === "cars" ? "on" : ""} onClick={() => changeTab("cars")}>▣<small>车账号</small></button><button className={tab === "customers" ? "on" : ""} onClick={() => changeTab("customers")}>♙<small>客户</small></button><button className={tab === "categories" ? "on" : ""} onClick={() => changeTab("categories")}>▦<small>分类</small></button></nav>;
  const saveCustomer = (item: Omit<Customer, "id">) => {
    const old = customerForm.customer;
    const id = old?.id ?? Date.now();
    setCustomers((items) => old ? items.map((x) => x.id === id ? { ...x, ...item } : x) : [...items, { ...item, id }]);
    setCars((items) => items.map((car) => car.archivedAt ? car : ({ ...car,
      updatedAt: old?.carId === car.id || item.carId === car.id ? new Date().toISOString() : car.updatedAt,
      quota: Math.max(0, car.quota - (old?.carId === car.id ? old.quota : 0) + (item.carId === car.id ? item.quota : 0)),
      customers: [...car.customers.filter((x) => x !== id), ...(item.carId === car.id ? [id] : [])],
    })));
    setCustomerForm({ open: false });
  };
  const removeCustomer = () => {
    const customer = customerForm.customer;
    if (!customer) return;
    const archived = archiveCustomerRecords(customers, cars, customer.id);
    setCustomers(archived.customers);
    setCars(archived.cars);
    setCustomerForm({ open: false });
  };
  const removeCar = () => {
    if (!selected) return;
    setCars((items) => archiveCarRecords(items, customers, selected.id));
    setCarForm(false); setPriorityOpen(false); setCustomerForm({ open: false });
    setSelectedId(null); setTab("cars"); setPage(1);
  };
  const customerEditor = <CustomerFormSheet open={customerForm.open} close={() => setCustomerForm({ open: false })} customer={customerForm.customer} cars={activeCars} save={saveCustomer} remove={removeCustomer} />;
  const visible = useMemo(() => {
    let a = customers.filter((c) =>
      !c.archivedAt && (selectedId ? c.carId === selectedId : true),
    );
    if (applied)
      a = a.filter((c) =>
        (c.name + c.wechat).toLowerCase().includes(applied.toLowerCase()),
      );
    if (risk) a = a.filter((c) => c.risk === risk);
    if (tagFilter.length)
      a = a.filter((c) => tagFilter.every((t) => c.tags.includes(t)));
    const score = (r: Risk) =>
      ({ confirmed: 0, watch: 1, unknown: 2, safe: 3 })[r];
    return [...a].sort((x, y) =>
      sort === "profit"
        ? customerProfit(x) - customerProfit(y)
        : sort === "risk"
          ? score(x.risk) - score(y.risk) ||
            customerProfit(x) - customerProfit(y)
        : x.id - y.id,
    );
  }, [customers, selectedId, applied, risk, tagFilter, sort]);
  const counts = (car: Car) =>
    (["safe", "unknown", "watch", "confirmed"] as Risk[]).map(
      (r) =>
        customers.filter((c) => !c.archivedAt && c.carId === car.id && c.risk === r)
          .length,
    );
  if (selected)
    return (
      <>
        <MobileScroll className="app-screen">
          <main className="screen detail">
            <header className="detail-head">
              <button className="bare" onClick={() => setSelectedId(null)}>
                <ChevronLeftIcon />
              </button>
              <div className="car-title">
                <i className={`dot ${selected.state}`} />
                <b>{selected.name}</b>
              </div>
              <button className="link" onClick={() => setCarForm(true)}>
                编辑
              </button>
            </header>
            <section className="summary">
              {carFields.map(([key, label, unit]) => <div key={key}>
                <span>{label}</span>
                <b className={key === "profit" ? (ownerValues.profit < 0 ? "neg" : "pos") : ""}>{unit === "元" ? `¥${ownerValues[key]}` : `${ownerValues[key]}${unit}`}</b>
              </div>)}
              <small className="owner-updated">最后更新时间：{selected.updatedAt ? new Date(selected.updatedAt).toLocaleString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }) : "尚未记录"}</small>
            </section>
            <p className="owner-customer-counts">客户状态 <Counts v={counts(selected)} /></p>
            <div className="section-head">
              <h2>本车客户 · {visible.length} 人</h2>
              <button onClick={() => setPriorityOpen(true)}>优先处理⌄</button>
            </div>
            <div className="customer-list">
              {visible.map((c) => (
                <Card c={c} key={c.id} onEdit={editCustomer} />
              ))}
            </div>
          </main>
        </MobileScroll>
        <CarEditSheet open={carForm} close={() => setCarForm(false)} values={ownerValues} remove={removeCar} save={(values) => setCars((a) => a.map((c) => c.id === selected.id ? { ...c, ...values, updatedAt: new Date().toISOString() } : c))} />
        <PrioritySheet open={priorityOpen} close={() => setPriorityOpen(false)} setSort={setSort} />
        {customerEditor}
        {navigation}
      </>
    );
  return (
    <>
      <MobileScroll className="app-screen">
        <main className="screen">
          {tab === "cars" ? (
            <>
              <header className="page-head">
                <div>
                  <h1>车账号</h1>
                  <p>先看状态，再找客户</p>
                  <a className="version-link" href="/update.html?v=categories-r1">分类归档版 · 检查更新</a>
                </div>
                <button className="primary square" onClick={addCar} aria-label="新增车账号">
                  <PlusIcon />
                </button>
              </header>
              <div className="search">
                <MagnifyingGlassIcon />
                <MobileTextField
                  value={query}
                  onValueChange={setQuery}
                  placeholder="搜索车名或账号"
                  aria-label="搜索车名或账号"
                />
              </div>
              <div className="filters">
                {(
                  [
                    ["all", "全部"],
                    ["red", "红色"],
                    ["orange", "橙色"],
                    ["green", "绿色"],
                  ] as const
                ).map(([v, l]) => (
                  <button
                    key={v}
                    className={carFilter === v ? "active" : ""}
                    onClick={() => setCarFilter(v)}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <div className="car-list">
                {activeCars.length === 0 && (
                  <div className="empty-state"><h2>还没有车账号</h2><p>点击右上角的＋，先添加你的第一个车组。</p><button className="primary" onClick={addCar}>新增车账号</button></div>
                )}
                {activeCars
                  .filter((c) => carFilter === "all" || c.state === carFilter)
                  .filter((c) => c.name.includes(query))
                  .slice((page - 1) * 10, page * 10)
                  .map((c) => (
                    <button
                      key={c.id}
                      className="car-row"
                      onClick={() => setSelectedId(c.id)}
                    >
                      <span className="car-row-copy"><span className={`car-name ${c.state}`}><i className={`dot ${c.state}`} />{c.name}</span><span className="car-status-line">客户状态 <Counts v={counts(c)} /></span></span>
                      <ChevronRightIcon />
                    </button>
                  ))}
              </div>
              {activeCars.length > 10 && <div className="pages">
                <button onClick={() => setPage(1)}>‹</button>
                <button
                  className={page === 1 ? "on" : ""}
                  onClick={() => setPage(1)}
                >
                  1
                </button>
                <button
                  className={page === 2 ? "on" : ""}
                  onClick={() => setPage(2)}
                >
                  2
                </button>
                <button onClick={() => setPage(2)}>›</button>
                <span>共 {activeCars.length} 个账号</span>
              </div>}
              <div className="legend">
                <span>
                  <i className="dot green" />
                  可信
                </span>
                <span>
                  <i className="dot unknown" />
                  未判断
                </span>
                <span>
                  <i className="dot orange" />
                  需留意
                </span>
                <span>
                  <i className="dot red" />
                  已确定
                </span>
              </div>
            </>
          ) : tab === "categories" ? (
            <Categories customers={customers} cars={cars} category={category} setCategory={setCategory} now={today} editCustomer={editCustomer} />
          ) : (
              <CustomerHome
                list={visible}
              query={query}
              setQuery={setQuery}
              search={() => setApplied(query)}
              open={() => setSheet(true)}
              setRisk={setRisk}
                setSort={setSort}
                addCustomer={addCustomer}
                editCustomer={editCustomer}
            />
          )}
        </main>
      </MobileScroll>
      {navigation}
      <Sheet
        open={sheet}
        close={() => setSheet(false)}
        risk={risk}
        setRisk={setRisk}
        tags={tagFilter}
        setTags={setTags}
        sort={sort}
        setSort={setSort}
      />
      {customerEditor}
    </>
  );
}
function CustomerHome({
  list,
  query,
  setQuery,
  search,
  open,
  setRisk,
  setSort,
  addCustomer,
  editCustomer,
}: {
  list: Customer[];
  query: string;
  setQuery: (v: string) => void;
  search: () => void;
  open: () => void;
  setRisk: (r: Risk | null) => void;
  setSort: (s: "default" | "profit" | "risk") => void;
  addCustomer: () => void;
  editCustomer: (c: Customer) => void;
}) {
  let w = list.filter((c) => c.risk === "watch").length,
    r = list.filter((c) => c.risk === "confirmed").length;
  const income = list.reduce((sum, c) => sum + c.fee, 0);
  const profit = list.reduce((sum, c) => sum + customerProfit(c), 0);
  return (
    <>
      <header className="page-head">
        <h1>客户</h1>
        <button className="primary add" onClick={addCustomer}>
          <PlusIcon /> 新增
        </button>
      </header>
      <div className="stats">
        <div>
          <span>客户总数</span>
          <b>{list.length}</b>
        </div>
        <div>
          <span>本月收入</span>
          <b className="pos">¥{income}</b>
        </div>
        <div>
          <span>本月净利润</span>
          <b className={profit < 0 ? "neg" : "pos"}>¥{profit}</b>
        </div>
        <div>
          <span>待核查客户数</span>
          <b>{w + r}</b>
          <small>
            <i className="dot orange" />
            {w}　<i className="dot red" />
            {r}
          </small>
        </div>
      </div>
      <div className="search-line">
        <div className="search">
          <MagnifyingGlassIcon />
          <MobileTextField
            value={query}
            onValueChange={setQuery}
            placeholder="姓名 / 微信名 / 微信号"
            aria-label="搜索客户"
          />
        </div>
        <button className="primary" onClick={search}>
          检索
        </button>
      </div>
      <div className="selects">
        <button onClick={open}>所属账号⌄</button>
        <button onClick={open}>客户标签⌄</button>
        <button onClick={open}>客户状态⌄</button>
      </div>
      <div className="quick">
        <button onClick={() => setRisk("watch")}>需留意</button>
        <button onClick={() => setRisk("confirmed")}>已确定</button>
        <button onClick={() => setSort("profit")}>低利润优先</button>
        <button onClick={open}>事儿多</button>
        <button className="active" onClick={() => setSort("risk")}>
          按客户状态
        </button>
      </div>
      <div className="customer-list compact">
        {list.length === 0 && (
          <div className="empty-state"><h2>还没有客户</h2><p>新增客户后，收费、成本和利润会自动计算。</p><button className="primary" onClick={addCustomer}>新增客户</button></div>
        )}
        {list.map((c) => (
          <Card c={c} key={c.id} onEdit={editCustomer} />
        ))}
      </div>
    </>
  );
}
function Card({ c, onEdit }: { c: Customer; onEdit?: (c: Customer) => void }) {
  let cost = customerCost(c),
    p = customerProfit(c);
  return (
    <article className="customer-card">
      <div className="card-head">
        <h3>{c.name}</h3>
        <span className={`risk ${c.risk}`}>
          {c.risk === "confirmed" ? "已确定（老鼠屎）" : labels[c.risk]}
        </span>
        {c.risk === "confirmed" && !c.archivedAt && onEdit && <em>需移出</em>}
      </div>
      <div className="money">
        <span>
          收费 <b>¥{c.fee}</b>
        </span>
        <span>
          购买额度 <b>{c.quotaType === "exclusive" ? "web独享" : c.quotaType === "web" ? "Web" : c.quotaType === "web_percentage" ? `Web + ${c.quota}%` : `${c.quota}%`}</b>
        </span>
        <span>
          成本 <b>¥{cost}</b>
        </span>
        <span>
          净利润{" "}
          <b className={p < 0 ? "neg" : "pos"}>
            {p < 0 ? "-" : ""}¥{Math.abs(p)}
          </b>
        </span>
      </div>
      <div className="tag-list">
        {c.tags.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
      <p>
        估算用量：<b>{c.usage}</b>
      </p>
      {c.reason && <p className="reason">原因：{c.reason}</p>}
      {c.note && <p>简短说明：{c.note}</p>}
      {c.special && <p>特殊备注：{c.special}</p>}
      <div className="dates">
        <span>上车时间：{c.joined}</span>
        <span>到期时间：{c.expires}</span>
        <span>最后登录时间：{c.lastLogin || "未填写"}</span>
        <span>设备型号：{c.device || "Windows"}</span>
      </div>
      {onEdit && !c.archivedAt && <button className="edit" onClick={() => onEdit(c)}>编辑</button>}
    </article>
  );
}
function Categories({ customers, cars, category, setCategory, now, editCustomer }: { customers: Customer[]; cars: Car[]; category: Category | null; setCategory: (c: Category | null) => void; now: Date; editCustomer: (c: Customer) => void }) {
  const titles = { expiry: "到期提醒", "archived-cars": "归档车辆", "archived-customers": "归档用户", watch: "需留意客户", confirmed: "老鼠屎客户" };
  const archivedCars = cars.filter(c => c.archivedAt).sort((a, b) => b.archivedAt!.localeCompare(a.archivedAt!));
  const list = category ? categoryCustomers(customers, category, now) : [];
  const count = (key: Category) => key === "archived-cars" ? archivedCars.length : categoryCustomers(customers, key, now).length;
  const entry = (key: Category, detail: string, color = "") => <button className={`category-entry ${color}`} onClick={() => setCategory(key)}><span><strong>{titles[key]}</strong><small>{detail}</small></span><b>{count(key)}</b><ChevronRightIcon /></button>;
  const archivedDate = (value: string) => new Date(value).toLocaleString("zh-CN", { hour12: false });
  return <div className="categories-page">
    <header className="top"><div>{category && <button className="category-back" onClick={() => setCategory(null)}>‹ 返回分类</button>}<h1>{category ? titles[category] : "分类"}</h1></div></header>
    {!category ? <div className="category-menu">
      {entry("expiry", "明天起 3 天内到期", "expiry")}
      <section className="archive-group"><h2>归档</h2>{entry("archived-cars", "已退订的车辆记录")}{entry("archived-customers", "已下车的客户记录")}</section>
      {entry("watch", "橙色 · 需要留意", "watch")}
      {entry("confirmed", "红色 · 已确定", "confirmed")}
    </div> : <>
      <p className="category-caption">共 {count(category)} {category === "archived-cars" ? "辆车" : "位客户"}</p>
      {count(category) === 0 && <div className="empty"><h2>暂无{titles[category]}</h2></div>}
      {category === "archived-cars" ? archivedCars.map(car => {
        const totals = { ...car, ...car.archivedTotals };
        return <section className="archive-car" key={car.id}>
          <h2 className={`car-name ${car.state}`}><i className={`dot ${car.state}`} />{car.name}</h2>
          <p className="category-caption">归档时间：{archivedDate(car.archivedAt!)}</p>
          <div className="archive-stats">{carFields.map(([key, label, unit]) => <div key={key}><span>{label}</span><b>{totals[key] ?? 0}{unit}</b></div>)}</div>
          <h3>归档时客户 · {car.archivedCustomers?.length || 0}</h3>
          {car.archivedCustomers?.map(c => <Card key={c.id} c={c} />)}
        </section>;
      }) : list.map((c: Customer) => {
        const days = daysUntilExpiry(c.expires, now);
        const parent = cars.find(car => car.id === c.carId);
        return <section className="category-customer" key={c.id}>
          {category === "expiry" && <div className={`expiry-label day-${days}`}>{["", "明天到期", "后天到期", "大后天到期"][days]} · {c.expires}</div>}
          <p className="category-caption">所属账号：{c.archivedCarName || parent?.name || "原账号不可用"}{!c.archivedAt && parent?.archivedAt ? "（已归档）" : ""}</p>
          {c.archivedAt && <p className="category-caption">归档时间：{archivedDate(c.archivedAt)}</p>}
          <Card c={c} onEdit={c.archivedAt ? undefined : editCustomer} />
        </section>;
      })}
    </>}
  </div>;
}
function Counts({ v }: { v: number[] }) {
  return (
    <span className="counts">
      {v.map((n, i) => (
        <span key={i}>
          <i className={`dot ${["green", "unknown", "orange", "red"][i]}`} />
          {n}
        </span>
      ))}
    </span>
  );
}
function CarEditSheet({ open, close, values, save, remove }: any) {
  const [form, setForm] = useState(values);
  useEffect(() => { if (open) setForm(values); }, [values, open]);
  return <BottomSheet open={open} onOpenChange={(v) => !v && close()} title="编辑车主数据"><div className="sheet car-edit-form">
    <label className="field"><span>账号名称</span><input type="text" value={form.name || ""} placeholder="填写车账号名称" onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
    <fieldset className="owner-state"><legend>账号额度状态</legend><div className="choices three">
      {([['green', '绿色 · 正常'], ['orange', '橙色 · 有点快'], ['red', '红色 · 非常快']] as const).map(([state, label]) => <button key={state} type="button" aria-pressed={form.state === state} className={form.state === state ? 'selected' : ''} onClick={() => setForm({ ...form, state })}><i className={`dot ${state}`} />{label}</button>)}
    </div></fieldset>
    {carFields.map(([key,label,unit]) => <label className="field" key={key}><span>{label}（{unit}）{["spent", "cost", "profit"].includes(key) && " · 自动汇总"}</span><input type="number" readOnly={["spent", "cost", "profit"].includes(key)} step={key === "resets" ? "1" : "any"} value={form[key]} onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })} /></label>)}<div className="delete-record"><button type="button" className="danger-button" onClick={remove}>退订</button><p>退订后保留到归档车辆；客户仍可在客户页管理。</p></div><div className="actions"><button onClick={close}>取消</button><button className="primary" disabled={!form.name?.trim()} onClick={() => { const { spent, cost, profit, ...manualValues } = form; if (!form.name?.trim()) return; save({ ...manualValues, name: form.name.trim() }); close(); }}>保存</button></div></div></BottomSheet>;
}

function PrioritySheet({ open, close, setSort }: { open: boolean; close: () => void; setSort: (s: "risk" | "profit") => void }) {
  return <BottomSheet open={open} onOpenChange={(v) => !v && close()} title="优先处理" snap="small"><div className="sheet priority-sheet"><button className="wide" onClick={() => { setSort("risk"); close(); }}>按客户状态排列<span>已确定 → 需留意 → 未判断 → 可信</span></button><button className="wide" onClick={() => { setSort("profit"); close(); }}>按利润状态排列<span>利润低的优先</span></button></div></BottomSheet>;
}

function CustomerFormSheet({ open, close, customer, cars, save, remove }: { open: boolean; close: () => void; customer?: Customer; cars: Car[]; save: (v: Omit<Customer, "id">) => void; remove: () => void }) {
  const blank = { name: "", wechat: "", carId: cars[0]?.id ?? 0, risk: "unknown" as Risk, fee: 0, quota: 0, quotaType: "percentage", webCost: "", tags: [] as string[], usage: "不清楚", reason: "", note: "", special: "", joined: "", expires: "", lastLogin: "", device: "Windows" as Customer["device"] };
  const [form, setForm] = useState(blank);
  useEffect(() => setForm(customer ? { ...blank, ...customer } : blank), [customer, open]);
  const update = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));
  const hasPercentage = ["percentage", "web_percentage"].includes(form.quotaType ?? "percentage");
  const hasWeb = ["web", "web_percentage"].includes(form.quotaType);
  return <BottomSheet open={open} onOpenChange={(v) => !v && close()} title={customer ? "编辑客户" : "新增客户"} snap="large"><div className="sheet customer-form">
    <label className="field"><span>微信名</span><input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="填写微信名" /></label>
    <label className="field"><span>所属账号</span><select value={form.carId} onChange={(e) => update('carId', Number(e.target.value))}>{!cars.some((c) => c.id === form.carId) && <option value={form.carId}>原车已退订，请重新选择账号</option>}{cars.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
    <label className="field"><span>收费金额（元）</span><input type="number" value={form.fee} onChange={(e) => update('fee', Number(e.target.value))} /></label>
    <fieldset className="quota-options"><legend>购买额度类型</legend><p>百分比与 Web 可同时选择</p>
      <label><input type="checkbox" checked={hasPercentage} onChange={(e) => update('quotaType', e.target.checked ? (hasWeb ? 'web_percentage' : 'percentage') : (hasWeb ? 'web' : ''))} />百分比</label>
      <label><input type="checkbox" checked={hasWeb} onChange={(e) => update('quotaType', e.target.checked ? (hasPercentage ? 'web_percentage' : 'web') : (hasPercentage ? 'percentage' : ''))} />Web</label>
      <label><input type="checkbox" checked={form.quotaType === 'exclusive'} onChange={(e) => update('quotaType', e.target.checked ? 'exclusive' : '')} />web独享</label>
    </fieldset>
    <div className="form-grid">
      {hasPercentage && <label className="field"><span>购买额度（%）</span><input type="number" min="0" value={form.quota} onChange={(e) => update('quota', Number(e.target.value))} /></label>}
      {hasWeb && <label className="field"><span>Web 成本（元）</span><input type="number" readOnly value={100} /></label>}
      {form.quotaType === 'exclusive' && <label className="field"><span>web独享成本（元）</span><input type="number" readOnly value={200} /></label>}
    </div>
    {form.quotaType && <p className="quota-preview">成本合计：¥{customerCost(form)} · 净利润：¥{customerProfit(form)}</p>}
    <div className="form-grid"><label className="field"><span>上车时间</span><input type="date" value={form.joined} onChange={(e) => update('joined', e.target.value)} /></label><label className="field"><span>到期时间</span><input type="date" value={form.expires} onChange={(e) => update('expires', e.target.value)} /></label></div>
    <div className="form-grid"><label className="field"><span>最后登录时间</span><input type="datetime-local" value={form.lastLogin} onChange={(e) => update('lastLogin', e.target.value)} /></label><label className="field"><span>设备型号</span><select value={form.device} onChange={(e) => update('device', e.target.value)}><option>Windows</option><option>Mac</option><option>Linux</option></select></label></div>
    <label className="field"><span>客户状态</span><select value={form.risk} onChange={(e) => update('risk', e.target.value)}><option value="safe">可信</option><option value="unknown">未判断</option><option value="watch">需留意</option><option value="confirmed">已确定（老鼠屎）</option></select></label>
    {form.risk === 'watch' && <label className="field"><span>需留意原因</span><select value={form.reason} onChange={(e) => update('reason', e.target.value)}>{reasons.map((x) => <option key={x}>{x}</option>)}</select></label>}
    <label className="field"><span>客户标签（可多选）</span><div className="choices">{preset.map((t) => <button type="button" key={t} className={form.tags.includes(t) ? 'selected' : ''} onClick={() => update('tags', form.tags.includes(t) ? form.tags.filter((x) => x !== t) : [...form.tags, t])}>{t}</button>)}</div></label>
    <label className="field"><span>估算用量</span><select value={form.usage} onChange={(e) => update('usage', e.target.value)}><option>不清楚</option><option>较少</option><option>一般</option><option>偏多</option><option>很多</option></select></label>
    <label className="field"><span>简短说明</span><textarea value={form.note} onChange={(e) => update('note', e.target.value)} placeholder="填写特殊要求或说明" /></label>
    {customer && <div className="delete-record"><button type="button" className="danger-button" onClick={remove}>下车</button><p>下车后保留到归档用户，不再计入当前客户汇总。</p></div>}
    <div className="actions"><button onClick={close}>取消</button><button className="primary" disabled={!form.name.trim() || !form.quotaType} onClick={() => form.name.trim() && form.quotaType && save({ ...form, quota: hasPercentage ? form.quota : 0, webCost: undefined })}>保存客户</button></div>
  </div></BottomSheet>;
}

function Sheet({
  open,
  close,
  car,
  rename,
  changeState,
  risk,
  setRisk,
  tags,
  setTags,
  sort,
  setSort,
}: {
  open: boolean;
  close: () => void;
  car?: Car;
  rename?: (s: string) => void;
  changeState?: (s: State) => void;
  risk: Risk | null;
  setRisk: (r: Risk | null) => void;
  tags: string[];
  setTags: (t: string[]) => void;
  sort: "default" | "profit" | "risk";
  setSort: (s: "default" | "profit" | "risk") => void;
}) {
  const [name, setName] = useState(car?.name || "");
  useEffect(() => setName(car?.name || ""), [car]);
  return (
    <BottomSheet
      open={open}
      onOpenChange={(v) => !v && close()}
      title="筛选客户"
      snap="large"
    >
      <div className="sheet">
        {car && (
          <section>
            <label>当前车账号</label>
            <div className="rename">
              <MobileTextField
                value={name}
                onValueChange={setName}
                aria-label="车组名称"
              />
              <button onClick={() => rename?.(name)}>
                <Pencil1Icon />
              </button>
            </div>
            <small>可修改车组名称</small>
            <label className="sub-label">账号额度状态</label>
            <div className="choices three">
              <button className={car.state === "green" ? "selected" : ""} onClick={() => changeState?.("green")}><i className="dot green" />正常</button>
              <button className={car.state === "orange" ? "selected" : ""} onClick={() => changeState?.("orange")}><i className="dot orange" />有点快</button>
              <button className={car.state === "red" ? "selected" : ""} onClick={() => changeState?.("red")}><i className="dot red" />非常快</button>
            </div>
          </section>
        )}
        <section>
          <label>所属账号</label>
          <button className="wide">
            <span>
              <i className="dot red" /> {car?.name || "全部账号"}
            </span>
            ⌄
          </button>
        </section>
        <section>
          <label>客户状态</label>
          <div className="choices four">
            {(["safe", "unknown", "watch", "confirmed"] as Risk[]).map((r) => (
              <button
                key={r}
                className={risk === r ? "selected" : ""}
                onClick={() => setRisk(risk === r ? null : r)}
              >
                <i
                  className={`dot ${r === "safe" ? "green" : r === "confirmed" ? "red" : r === "watch" ? "orange" : "unknown"}`}
                />
                {labels[r]}
              </button>
            ))}
          </div>
        </section>
        <section>
          <label>需留意原因</label>
          {reasons.map((x, i) => (
            <label className="check" key={x}>
              <input type="checkbox" defaultChecked={i === 2} />
              {x}
            </label>
          ))}
        </section>
        <section>
          <label>客户标签</label>
          <div className="choices">
            {preset.map((t) => (
              <button
                key={t}
                className={tags.includes(t) ? "selected" : ""}
                onClick={() =>
                  setTags(
                    tags.includes(t)
                      ? tags.filter((x) => x !== t)
                      : [...tags, t],
                  )
                }
              >
                {t}
              </button>
            ))}
            <button className="dashed">＋ 自定义标签</button>
          </div>
        </section>
        <section>
          <label>排列方式</label>
          <div className="choices three">
            {(
              [
                ["default", "默认"],
                ["profit", "低利润优先"],
                ["risk", "按客户状态"],
              ] as const
            ).map(([v, l]) => (
              <button
                key={v}
                className={sort === v ? "selected" : ""}
                onClick={() => setSort(v)}
              >
                {l}
              </button>
            ))}
          </div>
        </section>
        <div className="actions">
          <button
            onClick={() => {
              setRisk(null);
              setTags([]);
              setSort("default");
            }}
          >
            重置
          </button>
          <button className="primary" onClick={close}>
            查看结果
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
