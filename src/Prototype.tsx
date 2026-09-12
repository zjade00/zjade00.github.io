// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import {
  BottomSheet as MobileBottomSheet,
  KeyboardInput,
  MobileScroll,
} from "./mobile";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  Pencil1Icon,
  PlusIcon,
} from "@radix-ui/react-icons";
import "./prototype.css";
type Risk = "safe" | "unknown" | "watch" | "confirmed";
type State = "green" | "orange" | "red";
function BottomSheet({ snap, ...props }: any) {
  return (
    <MobileBottomSheet
      {...props}
      snap={typeof snap === "number" ? snap : 0.9}
    />
  );
}
function MobileTextField({ onValueChange, ...props }: any) {
  return (
    <KeyboardInput {...props} onChange={(e) => onValueChange(e.target.value)} />
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
  tags: string[];
  usage: string;
  reason?: string;
  note?: string;
  special?: string;
  joined: string;
  expires: string;
  lastLogin: string;
  device: "Windows" | "Mac" | "Linux";
};
type Car = {
  id: number;
  name: string;
  state: State;
  quota: number;
  customers: number[];
};
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
    [tab, setTab] = useState<"cars" | "customers">("cars"),
    [selectedId, setSelectedId] = useState<number | null>(null),
    [page, setPage] = useState(1),
    [carFilter, setCarFilter] = useState<"all" | State>("all"),
    [query, setQuery] = useState(""),
    [applied, setApplied] = useState(""),
    [sheet, setSheet] = useState(false),
    [risk, setRisk] = useState<Risk | null>(null),
    [tagFilter, setTags] = useState<string[]>([]),
    [sort, setSort] = useState<"default" | "profit" | "priority">("priority");
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);
  useEffect(
    () => localStorage.setItem("cm2-cars", JSON.stringify(cars)),
    [cars],
  );
  useEffect(
    () => localStorage.setItem("cm2-customers", JSON.stringify(customers)),
    [customers],
  );
  const selected = cars.find((c) => c.id === selectedId);
  const ask = (label: string, current = "") => window.prompt(label, current)?.trim();
  const addCar = () => {
    const name = ask("请输入车组名称");
    if (!name) return;
    const stateText = ask("账号状态：绿色 / 橙色 / 红色", "绿色");
    const state: State = stateText === "红色" ? "red" : stateText === "橙色" ? "orange" : "green";
    const id = Date.now();
    setCars((items) => [...items, { id, name, state, quota: 0, customers: [] }]);
  };
  const addCustomer = () => {
    if (!cars.length) return window.alert("请先新增一个车账号。 ");
    const name = ask("客户姓名"); if (!name) return;
    const wechat = ask("微信名或微信号", "") || "";
    const carName = ask(`所属账号：${cars.map((c) => c.name).join("、")}`, cars[0].name);
    const car = cars.find((c) => c.name === carName) || cars[0];
    const fee = Number(ask("收费金额（元）", "0")) || 0;
    const quota = Number(ask("购买额度百分比，例如 10", "10")) || 0;
    const joined = ask("上车时间（YYYY-MM-DD）", new Date().toISOString().slice(0, 10)) || "";
    const expires = ask("到期时间（YYYY-MM-DD）", "") || "";
    const lastLogin = ask("最后登录时间（YYYY-MM-DD HH:mm）", "") || "";
    const deviceText = ask("设备型号：Windows / Mac / Linux", "Windows");
    const device: Customer["device"] = deviceText?.toLowerCase() === "mac" ? "Mac" : deviceText?.toLowerCase() === "linux" ? "Linux" : "Windows";
    const id = Date.now();
    const item: Customer = { id, name, wechat, carId: car.id, risk: "unknown", fee, quota, tags: [], usage: "不清楚", joined, expires, lastLogin, device };
    setCustomers((items) => [...items, item]);
    setCars((items) => items.map((c) => c.id === car.id ? { ...c, quota: c.quota + quota, customers: [...c.customers, id] } : c));
  };
  const editCustomer = (c: Customer) => {
    const name = ask("客户姓名", c.name); if (!name) return;
    const fee = Number(ask("收费金额（元）", String(c.fee))) || 0;
    const quota = Number(ask("购买额度百分比", String(c.quota))) || 0;
    const status = ask("客户状态：可信 / 未判断 / 需留意 / 已确定", labels[c.risk]);
    const risk: Risk = status === "可信" ? "safe" : status === "需留意" ? "watch" : status === "已确定" ? "confirmed" : "unknown";
    const selectedTags = (ask(`客户标签，用逗号分隔：${preset.join("、")}`, c.tags.join(",")) || "").split(/[,，]/).map((t) => t.trim()).filter(Boolean);
    const usage = ask("估算用量：不清楚 / 较少 / 一般 / 偏多 / 很多", c.usage) || c.usage;
    const reason = risk === "watch" ? ask(`需留意原因：${reasons.join("、")}`, c.reason || reasons[0]) : "";
    const note = ask("简短说明", c.note || "") || "";
    const special = ask("特殊备注", c.special || "") || "";
    const joined = ask("上车时间（YYYY-MM-DD）", c.joined) || c.joined;
    const expires = ask("到期时间（YYYY-MM-DD）", c.expires) || c.expires;
    const lastLogin = ask("最后登录时间（YYYY-MM-DD HH:mm）", c.lastLogin || "") || "";
    const deviceText = ask("设备型号：Windows / Mac / Linux", c.device || "Windows");
    const device: Customer["device"] = deviceText?.toLowerCase() === "mac" ? "Mac" : deviceText?.toLowerCase() === "linux" ? "Linux" : "Windows";
    setCustomers((items) => items.map((x) => x.id === c.id ? { ...x, name, fee, quota, risk, tags: selectedTags, usage, reason, note, special, joined, expires, lastLogin, device } : x));
    setCars((items) => items.map((car) => car.id === c.carId ? { ...car, quota: Math.max(0, car.quota - c.quota + quota) } : car));
  };
  const visible = useMemo(() => {
    let a = customers.filter((c) =>
      selectedId ? c.carId === selectedId : true,
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
        ? x.fee - x.quota * 8 - (y.fee - y.quota * 8)
        : sort === "priority"
          ? score(x.risk) - score(y.risk) ||
            x.fee - x.quota * 8 - (y.fee - y.quota * 8)
          : x.id - y.id,
    );
  }, [customers, selectedId, applied, risk, tagFilter, sort]);
  const counts = (car: Car) =>
    (["safe", "unknown", "watch", "confirmed"] as Risk[]).map(
      (r) =>
        customers.filter((c) => car.customers.includes(c.id) && c.risk === r)
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
              <button className="link" onClick={() => setSheet(true)}>
                编辑
              </button>
            </header>
            <section className="summary">
              <div>
                <span>总额度</span>
                <b>100%</b>
              </div>
              <div>
                <span>已拼</span>
                <b>{selected.quota}%</b>
              </div>
              <div>
                <span>已拼成本</span>
                <b>¥{selected.quota * 8}</b>
              </div>
              <div>
                <span>利润</span>
                <b className="pos">
                  ¥
                  {customers
                    .filter((c) => c.carId === selected.id)
                    .reduce((s, c) => s + c.fee - c.quota * 8, 0)}
                </b>
              </div>
              <p>
                客户状态 <Counts v={counts(selected)} />
              </p>
            </section>
            <div className="section-head">
              <h2>本车客户 · {visible.length} 人</h2>
              <button onClick={() => setSheet(true)}>优先处理⌄</button>
            </div>
            <div className="customer-list">
              {visible.map((c) => (
                <Card c={c} key={c.id} onEdit={editCustomer} />
              ))}
            </div>
          </main>
        </MobileScroll>
        <Sheet
          open={sheet}
          close={() => setSheet(false)}
          car={selected}
          rename={(name) =>
            setCars((a) =>
              a.map((c) => (c.id === selected.id ? { ...c, name } : c)),
            )
          }
          changeState={(state) => setCars((a) => a.map((c) => c.id === selected.id ? { ...c, state } : c))}
          risk={risk}
          setRisk={setRisk}
          tags={tagFilter}
          setTags={setTags}
          sort={sort}
          setSort={setSort}
        />
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
                {cars.length === 0 && (
                  <div className="empty-state"><h2>还没有车账号</h2><p>点击右上角的＋，先添加你的第一个车组。</p><button className="primary" onClick={addCar}>新增车账号</button></div>
                )}
                {cars
                  .filter((c) => carFilter === "all" || c.state === carFilter)
                  .filter((c) => c.name.includes(query))
                  .slice((page - 1) * 10, page * 10)
                  .map((c) => (
                    <button
                      key={c.id}
                      className="car-row"
                      onClick={() => setSelectedId(c.id)}
                    >
                      <span className={`car-name ${c.state}`}>
                        <i className={`dot ${c.state}`} />
                        {c.name}
                      </span>
                      <Counts v={counts(c)} />
                      <ChevronRightIcon />
                    </button>
                  ))}
              </div>
              {cars.length > 10 && <div className="pages">
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
                <span>共 {cars.length} 个账号</span>
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
      <nav className="nav">
        <button
          className={tab === "cars" ? "on" : ""}
          onClick={() => setTab("cars")}
        >
          ▣<small>车账号</small>
        </button>
        <button
          className={tab === "customers" ? "on" : ""}
          onClick={() => setTab("customers")}
        >
          ♙<small>客户</small>
        </button>
      </nav>
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
  setSort: (s: "default" | "profit" | "priority") => void;
  addCustomer: () => void;
  editCustomer: (c: Customer) => void;
}) {
  let w = list.filter((c) => c.risk === "watch").length,
    r = list.filter((c) => c.risk === "confirmed").length;
  const income = list.reduce((sum, c) => sum + c.fee, 0);
  const profit = list.reduce((sum, c) => sum + c.fee - c.quota * 8, 0);
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
        <button className="active" onClick={() => setSort("priority")}>
          优先处理
        </button>
      </div>
      <div className="customer-list compact">
        {list.length === 0 && (
          <div className="empty-state"><h2>还没有客户</h2><p>新增客户后，收费、成本和利润会自动计算。</p><button className="primary" onClick={addCustomer}>新增客户</button></div>
        )}
        {list.slice(0, 6).map((c) => (
          <Card c={c} key={c.id} onEdit={editCustomer} />
        ))}
      </div>
    </>
  );
}
function Card({ c, onEdit }: { c: Customer; onEdit: (c: Customer) => void }) {
  let cost = c.quota * 8,
    p = c.fee - cost;
  return (
    <article className="customer-card">
      <div className="card-head">
        <h3>{c.name}</h3>
        <span className={`risk ${c.risk}`}>
          {c.risk === "confirmed" ? "已确定（老鼠屎）" : labels[c.risk]}
        </span>
        {c.risk === "confirmed" && <em>需移出</em>}
      </div>
      <p>微信：{c.wechat}</p>
      <div className="money">
        <span>
          收费 <b>¥{c.fee}</b>
        </span>
        <span>
          购买额度 <b>{c.quota}%</b>
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
      <button className="edit" onClick={() => onEdit(c)}>编辑</button>
    </article>
  );
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
  sort: "default" | "profit" | "priority";
  setSort: (s: "default" | "profit" | "priority") => void;
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
                ["priority", "优先处理"],
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
