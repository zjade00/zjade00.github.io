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
};
type Car = {
  id: number;
  name: string;
  state: State;
  quota: number;
  customers: number[];
};
const carNames = [
  "星河主号",
  "工作室 A",
  "ChatGPT-03",
  "小敏专用车",
  "Plus 共享 05",
  "创作组",
  "论文组 A",
  "备用主号",
  "设计组",
  "测试车",
  "海外主号",
  "图像组",
  "写作组",
  "翻译组",
  "备用 02",
  "团队账户",
  "数据组",
  "临时车",
  "Plus 共享 19",
  "备用 03",
];
const seedCars: Car[] = carNames.map((name, i) => ({
  id: i + 1,
  name,
  state: (["red", "orange", "red", "green", "orange", "green"] as State[])[
    i % 6
  ],
  quota: [70, 60, 80, 50, 60, 40][i % 6],
  customers:
    i === 0
      ? [1, 2, 3, 4, 5, 6]
      : i < 5
        ? Array.from({ length: i === 4 ? 3 : 4 }, (_, j) => 7 + (i - 1) * 4 + j)
        : [],
}));
const seedCustomers: Customer[] = [
  {
    id: 1,
    name: "阿杰",
    wechat: "ajie_08",
    carId: 1,
    risk: "confirmed",
    fee: 120,
    quota: 20,
    tags: ["事儿多", "不好说话"],
    usage: "很多",
    note: "已确认用量超出很多。",
    special: "晚上联系。",
    joined: "2026-06-30",
    expires: "2026-09-30",
  },
  {
    id: 2,
    name: "小李",
    wechat: "xiaoli_09",
    carId: 1,
    risk: "watch",
    fee: 150,
    quota: 10,
    tags: ["好说话", "事儿少"],
    usage: "偏多",
    reason: "用量情况有出入，有嫌疑",
    note: "前后描述不一致。",
    special: "工作日晚上方便联系。",
    joined: "2026-05-30",
    expires: "2026-09-30",
  },
  {
    id: 3,
    name: "小陈",
    wechat: "chen_12",
    carId: 1,
    risk: "safe",
    fee: 200,
    quota: 20,
    tags: ["沟通顺畅"],
    usage: "一般",
    joined: "2026-07-12",
    expires: "2026-10-12",
  },
  {
    id: 4,
    name: "王姐",
    wechat: "wangjie",
    carId: 1,
    risk: "unknown",
    fee: 130,
    quota: 10,
    tags: ["配合度高"],
    usage: "不清楚",
    joined: "2026-08-01",
    expires: "2026-10-01",
  },
  {
    id: 5,
    name: "小周",
    wechat: "zhou_22",
    carId: 1,
    risk: "watch",
    fee: 160,
    quota: 10,
    tags: ["事儿少"],
    usage: "偏多",
    reason: "账号额度消耗异常",
    joined: "2026-04-18",
    expires: "2026-10-18",
  },
  {
    id: 6,
    name: "林哥",
    wechat: "lin88",
    carId: 1,
    risk: "safe",
    fee: 180,
    quota: 10,
    tags: ["好说话"],
    usage: "较少",
    joined: "2026-02-05",
    expires: "2026-10-05",
  },
  ...Array.from({ length: 16 }, (_, i): Customer => ({
    id: i + 7,
    name: `客户${i + 7}`,
    wechat: `wx_${i + 7}`,
    carId: Math.min(5, Math.floor(i / 4) + 2),
    risk: i % 7 === 0 ? "watch" : "safe",
    fee: 160,
    quota: 10,
    tags: ["沟通顺畅"],
    usage: "一般",
    joined: "2026-08-01",
    expires: "2026-10-01",
  })),
];
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
  const [cars, setCars] = useState<Car[]>(() => load("cm-cars", seedCars)),
    [customers] = useState(seedCustomers),
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
  useEffect(
    () => localStorage.setItem("cm-cars", JSON.stringify(cars)),
    [cars],
  );
  const selected = cars.find((c) => c.id === selectedId);
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
                <Card c={c} key={c.id} />
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
                <button className="primary square">
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
              <div className="pages">
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
                <span>共 20 个账号</span>
              </div>
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
}: {
  list: Customer[];
  query: string;
  setQuery: (v: string) => void;
  search: () => void;
  open: () => void;
  setRisk: (r: Risk | null) => void;
  setSort: (s: "default" | "profit" | "priority") => void;
}) {
  let w = list.filter((c) => c.risk === "watch").length,
    r = list.filter((c) => c.risk === "confirmed").length;
  return (
    <>
      <header className="page-head">
        <h1>客户</h1>
        <button className="primary add">
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
          <b className="pos">¥3,450</b>
        </div>
        <div>
          <span>本月净利润</span>
          <b className="pos">¥1,050</b>
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
        {list.slice(0, 6).map((c) => (
          <Card c={c} key={c.id} />
        ))}
      </div>
    </>
  );
}
function Card({ c }: { c: Customer }) {
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
      </div>
      <button className="edit">编辑</button>
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
