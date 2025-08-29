
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Check,
  Package,
  Loader2,
  Clock,
  Receipt,
  TrendingUp,
  AlertTriangle,
  Download,
  QrCode,
  Printer,
  Menu,
  ChevronDown,
  Sun,
  Moon,
  BarChart3,
} from "lucide-react";
import {
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";

import { currency } from "./utils/currency";
import { LOGO, DEFAULT_PRODUCTS } from "./utils/constants";
import usePersistedState from "./hooks/usePersistedState";
import useResponsiveGrid from "./hooks/useResponsiveGrid";
import useWindowWidth from "./hooks/useWindowWidth";
import useOfflineStatus from "./hooks/useOfflineStatus";
import TabButton from "./components/TabButton.jsx";
import ProductCard from "./components/POS/ProductCard.jsx";

export default function App() {
  const [products, setProducts] = usePersistedState("pos_products", DEFAULT_PRODUCTS);
  const [cart, setCart] = usePersistedState("pos_cart", []);
  const [sales, setSales] = usePersistedState("pos_sales", []);
  const [discount, setDiscount] = usePersistedState("pos_discount", 0);
  const [taxPercent, setTaxPercent] = usePersistedState("pos_tax", 0);
  const [lowStockThreshold, setLowStockThreshold] = usePersistedState("pos_low_threshold", 3);
  const [profile, setProfile] = usePersistedState("pos_profile", {
    shopName: "99 Market",
    owner: "Harsh",
    phone: "+91-90000-00000",
    gstin: "",
    address: "Main Road, City, State",
    hours: "9:00 AM – 9:00 PM",
    avatar: "https://ui-avatars.com/api/?name=99+M&background=f97316&color=fff&bold=true",
  });
  const [theme, setTheme] = usePersistedState("pos_theme", "light");

  const [activeTab, setActiveTab] = useState("POS");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [payMode, setPayMode] = useState("CASH");
  const [showLowStock, setShowLowStock] = useState(false);
  const [sku, setSku] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const focusedCartIdRef = useRef(null);
  const ww = useWindowWidth();
  const gridLayout = useResponsiveGrid();
  const isOffline = useOfflineStatus();

  useEffect(() => {
    const map = { POS: '#pos', PAYMENTS: '#payments', ANALYTICS: '#analytics', PROFILE: '#profile' };
    window.location.hash = map[activeTab] || '#pos';
  }, [activeTab]);
  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace('#','');
      if (h === 'payments') setActiveTab('PAYMENTS');
      else if (h === 'analytics') setActiveTab('ANALYTICS');
      else if (h === 'profile') setActiveTab('PROFILE');
      else setActiveTab('POS');
    };
    window.addEventListener('hashchange', onHash);
    onHash();
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const categories = useMemo(() => ["All", ...Array.from(new Set(products.map(p => p.category)))], [products]);
  const cartQtyById = useMemo(() => { const m = new Map(); cart.forEach(i => m.set(i.id, (m.get(i.id)||0)+i.qty)); return m; }, [cart]);
  const remainingStock = (id) => { const p = products.find(x => x.id === id); const inCart = cartQtyById.get(id)||0; return Math.max(0, (p?.stock||0) - inCart); };

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = products.filter(p => {
      const matchesQ = !q || [p.name, p.sku, p.category].some(v => v.toLowerCase().includes(q));
      const matchesC = category === "All" || p.category === category;
      return matchesQ && matchesC;
    });
    if (showLowStock) out = out.filter(p => remainingStock(p.id) <= Number(lowStockThreshold||0));
    return out;
  }, [products, query, category, showLowStock, cartQtyById, lowStockThreshold]);

  const totals = useMemo(() => {
    const items = cart.reduce((a, c) => a + c.qty, 0);
    const subTotal = cart.reduce((a, c) => a + c.qty * c.priceSnapshot, 0);
    const disc = Math.min(Number(discount||0), subTotal);
    const taxable = Math.max(0, subTotal - disc);
    const tax = (Number(taxPercent||0)/100) * taxable;
    const net = taxable + tax;
    return { items, subTotal, disc, tax, net };
  }, [cart, discount, taxPercent]);

  const todaySales = useMemo(() => {
    const todayStr = new Date().toDateString();
    const list = sales.filter(s => new Date(s.time).toDateString() === todayStr);
    const total = list.reduce((a, s) => a + (s.net ?? s.amount ?? 0), 0);
    return { list, total, count: list.length };
  }, [sales]);

  const lowStockItems = useMemo(() => products.filter(p => { const rem = remainingStock(p.id); return rem <= Number(lowStockThreshold||0) && rem > 0; }), [products, cartQtyById, lowStockThreshold]);
  const outOfStockItems = useMemo(() => products.filter(p => remainingStock(p.id) === 0), [products, cartQtyById]);

  const addToCart = (p) => { const rem = remainingStock(p.id); if (rem<=0) return; setCart(prev => { const i = prev.findIndex(x => x.id === p.id); if (i===-1) return [...prev, { id:p.id, name:p.name, qty:1, priceSnapshot:p.price }]; const cp=[...prev]; cp[i] = { ...cp[i], qty: cp[i].qty+1 }; return cp; }); focusedCartIdRef.current = p.id; if (ww < 1024) setCartOpen(true); };
  const inc = (id) => { const rem = remainingStock(id); if (rem<=0) return; setCart(prev => prev.map(i => i.id===id ? { ...i, qty: i.qty+1 } : i)); focusedCartIdRef.current = id; };
  const dec = (id) => { setCart(prev => prev.flatMap(i => i.id!==id ? [i] : (i.qty-1<=0?[]:[{...i, qty:i.qty-1}]))); focusedCartIdRef.current = id; };
  const removeLine = (id) => { setCart(prev => prev.filter(i => i.id !== id)); focusedCartIdRef.current = null; };
  const clearCart = () => { setCart([]); focusedCartIdRef.current = null; };

  useEffect(() => {
    const onKey = (e) => {
      if (activeTab !== 'POS') return;
      if (e.ctrlKey && e.key === "Enter") { e.preventDefault(); checkout(); return; }
      const id = focusedCartIdRef.current;
      if (!id) return;
      if (e.key === "+" || e.key === "=") { e.preventDefault(); inc(id); }
      if (e.key === "-") { e.preventDefault(); dec(id); }
      if (e.key === "Delete") { e.preventDefault(); removeLine(id); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inc, dec, removeLine, activeTab]);

  const onQuickAdd = () => { const code = sku.trim(); if (!code) return; const p = products.find(x => x.sku === code || x.id === code); if (p) addToCart(p); setSku(""); };

  const printReceipt = (sale) => {
    const s = sale || {
      id: Math.random().toString(36).slice(2),
      time: new Date().toISOString(),
      mode: payMode,
      items: cart.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.priceSnapshot })),
      subTotal: totals.subTotal,
      discount: totals.disc,
      taxPercent: Number(taxPercent || 0),
      tax: totals.tax,
      net: totals.net,
    };
    const html = `<!doctype html>
<html><head><meta charset="utf-8" /><title>Receipt ${s.id}</title>
<style>body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu;margin:20px} .title{font-weight:700;font-size:18px} .muted{color:#666} table{width:100%;border-collapse:collapse;margin-top:10px} th,td{text-align:left;padding:6px;border-bottom:1px dashed #ddd} .right{text-align:right} .total{font-weight:700;font-size:16px} @media print{button{display:none}}</style></head>
<body>
  <div class="title">${profile.shopName} — POS</div>
  <div class="muted">${profile.address}${profile.gstin ? ' • GSTIN: ' + profile.gstin : ''}</div>
  <div class="muted">Bill #${s.id} • ${new Date(s.time).toLocaleString()} • Mode: ${s.mode}</div>
  <table>
    <thead><tr><th>Item</th><th>Qty</th><th class="right">Price</th><th class="right">Amount</th></tr></thead>
    <tbody>${s.items.map(i => `<tr><td>${i.name}</td><td>${i.qty}</td><td class="right">${currency(i.price)}</td><td class="right">${currency(i.qty*i.price)}</td></tr>`).join("")}</tbody>
    <tfoot>
      <tr><td colspan="3" class="right">Sub Total</td><td class="right">${currency(s.subTotal || s.items.reduce((a,i)=>a+i.qty*i.price,0))}</td></tr>
      <tr><td colspan="3" class="right">Discount</td><td class="right">-${currency(s.discount || 0)}</td></tr>
      <tr><td colspan="3" class="right">Tax (${s.taxPercent || 0}%)</td><td class="right">${currency(s.tax || 0)}</td></tr>
      <tr><td colspan="3" class="right total">Net Total</td><td class="right total">${currency(s.net)}</td></tr>
    </tfoot>
  </table>
  <p class="muted">Thank you! No returns without receipt.</p>
  <button onclick="window.print()">Print</button>
</body></html>`;
    const win = window.open("", "_blank", "width=420,height=600"); if (!win) return; win.document.open(); win.document.write(html); win.document.close(); setTimeout(() => win.print(), 300);
  };

  const buildCSVString = (rows) => {
    const header = ["id","time","mode","subTotal","discount","taxPercent","tax","net","items"];
    const lines = [header.join(",")];
    rows.forEach(r => {
      const items = (r.items || []).map(i => `${i.name} x${i.qty} @${i.price}`).join(" | ");
      const vals = [r.id, r.time, r.mode, r.subTotal ?? "", r.discount ?? "", r.taxPercent ?? "", r.tax ?? "", r.net ?? r.amount ?? "", items];
      lines.push(vals.map(v => `"${String(v).replace(/"/g,'""')}"`).join(","));
    });
    return lines.join("\\n");
  };

  const exportCSV = (rows, filename = "payments.csv") => {
    const csv = buildCSVString(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const checkout = async () => {
    if (!cart.length || isLoading) return;
    setIsLoading(true);
    try {
      await new Promise(r => setTimeout(r, 600));
      setProducts(prev => prev.map(p => { const line = cart.find(i => i.id === p.id); if (!line) return p; return { ...p, stock: Math.max(0, p.stock - line.qty) }; }));
      const sale = { id: Math.random().toString(36).slice(2), time: new Date().toISOString(), subTotal: totals.subTotal, discount: totals.disc, taxPercent: Number(taxPercent||0), tax: totals.tax, net: totals.net, amount: totals.net, mode: payMode, items: cart.map(i => ({ id:i.id, name:i.name, qty:i.qty, price:i.priceSnapshot })) };
      setSales(prev => [sale, ...prev]); clearCart(); setIsLoading(false);
      const toast = document.createElement('div'); toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 transform transition-all duration-300'; toast.innerHTML = `✅ Sale completed! Amount: ${currency(totals.net)} <button id="pos-print-btn" style="margin-left:8px;background:#fff;color:#16a34a;padding:4px 8px;border-radius:8px;">Print</button>`; document.body.appendChild(toast); toast.querySelector('#pos-print-btn')?.addEventListener('click', () => printReceipt(sale)); setTimeout(() => { toast.style.transform = 'translateX(140%)'; setTimeout(() => document.body.removeChild(toast), 300); }, 2200);
    } finally {
      setIsLoading(false);
    }
  };

  const [modeFilter, setModeFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const applyQuickRange = (label) => {
    const now = new Date();
    const startOfDay = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
    if (label === 'TODAY') { setFromDate(startOfDay(now).toISOString().slice(0,10)); setToDate(now.toISOString().slice(0,10)); }
    else if (label === '7D') { const s = new Date(now); s.setDate(now.getDate()-6); setFromDate(startOfDay(s).toISOString().slice(0,10)); setToDate(now.toISOString().slice(0,10)); }
    else if (label === '30D') { const s = new Date(now); s.setDate(now.getDate()-29); setFromDate(startOfDay(s).toISOString().slice(0,10)); setToDate(now.toISOString().slice(0,10)); }
    else { setFromDate(""); setToDate(""); }
    setPage(1);
  };

  const filteredSales = useMemo(() => sales.filter(s => {
    if (modeFilter !== "ALL" && s.mode !== modeFilter) return false;
    const t = new Date(s.time).getTime();
    if (fromDate && t < new Date(fromDate).getTime()) return false;
    if (toDate) { const end = new Date(toDate); end.setHours(23,59,59,999); if (t > end.getTime()) return false; }
    return true;
  }), [sales, modeFilter, fromDate, toDate]);

  const totalPages = Math.max(1, Math.ceil(filteredSales.length / pageSize));
  const pageSales = filteredSales.slice((page-1)*pageSize, page*pageSize);

  const [anaRange, setAnaRange] = useState(7);
  const lastNDays = (n=7) => { const arr=[]; const now = new Date(); for (let i=n-1;i>=0;i--){ const d = new Date(now); d.setDate(now.getDate()-i); arr.push(new Date(d.getFullYear(), d.getMonth(), d.getDate())); } return arr; };
  const days = lastNDays(anaRange);
  const salesByDay = days.map(d => { const key = d.toDateString(); const total = sales.filter(s => new Date(s.time).toDateString()===key).reduce((a,s)=>a+(s.net??s.amount??0),0); return { date: `${d.getDate()}/${d.getMonth()+1}`, total }; });
  const movingAvg = salesByDay.map((row, idx, arr) => ({ date: row.date, ma: (arr.slice(Math.max(0, idx-2), idx+1).reduce((a,r)=>a+r.total,0))/Math.min(idx+1,3) }));
  const payModeAgg = ['CASH','UPI','CARD','CREDIT'].map(m => ({ name:m, value: sales.filter(s=>s.mode===m).reduce((a,s)=>a+(s.net??s.amount??0),0) }));
  const productAggMap = useMemo(() => { const m = new Map(); sales.forEach(s => s.items.forEach(i => m.set(i.name, (m.get(i.name)||0) + i.qty))); return m; }, [sales]);
  const topProducts = Array.from(productAggMap.entries()).map(([name,qty])=>({name, qty})).sort((a,b)=>b.qty-a.qty).slice(0,7);

  const rootClass = theme === 'dark' ? 'dark' : '';

  const touchStart = useRef(null);
  const handleTouchStart = (e) => { touchStart.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => { if (!touchStart.current) return; const diff = touchStart.current - e.changedTouches[0].clientX; if (Math.abs(diff) > 100) { if (diff > 0) setCartOpen(true); else setCartOpen(false); } touchStart.current = null; };

  return (
    <div className={`${rootClass} min-h-screen`} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 md:px-4 py-3 flex items-center gap-3">
          <button aria-label="Toggle sidebar" className="md:hidden p-2 rounded-lg border bg-white dark:bg-neutral-900 dark:border-neutral-800" onClick={()=>setSidebarOpen(!sidebarOpen)}><Menu className="h-5 w-5"/></button>
          <div className="flex items-center gap-2">
            <img src={LOGO[theme === 'dark' ? 'dark' : 'light']} alt={profile.shopName} className="h-8 md:h-10 w-auto object-contain"/>
            <div className="font-bold text-lg md:text-xl bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">{profile.shopName} — POS</div>
          </div>
          <div className="hidden md:flex items-center gap-2 ml-2">
            <div className="relative w-56 lg:w-72">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-neutral-400" />
              <input aria-label="Search products" value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search name, SKU, category..." className="w-full pl-10 pr-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white/80 dark:bg-neutral-800" />
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 ml-2">
            {['POS','PAYMENTS','ANALYTICS','PROFILE'].map(tab => (
              <TabButton key={tab} label={tab} active={activeTab===tab} onClick={()=>setActiveTab(tab)} />
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <button onClick={()=>setTheme(theme==='dark'?'light':'dark')} className="px-2 py-1 rounded-xl border bg-white dark:bg-neutral-900 dark:border-neutral-700 inline-flex items-center gap-1 text-sm" title="Toggle theme">
              {theme==='dark'? <Sun className="h-4 w-4"/> : <Moon className="h-4 w-4"/>}
              <span className="hidden sm:inline">{theme==='dark'?'Light':'Dark'}</span>
            </button>
            {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
              <button onClick={()=>setShowLowStock(!showLowStock)} className={`hidden sm:flex items-center gap-1 text-sm font-semibold px-3 py-1 rounded-xl transition-colors ${showLowStock? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'}`}>
                <AlertTriangle className="h-4 w-4" /> {lowStockItems.length + outOfStockItems.length} Low Stock
              </button>
            )}
            <div className="hidden sm:flex text-sm items-center gap-1 text-green-700 dark:text-green-400 font-semibold bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/40 px-3 py-1 rounded-xl"><TrendingUp className="h-4 w-4"/> Today: {currency(todaySales.total)} ({todaySales.count})</div>
            <button onClick={()=>setCartOpen(true)} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-500 text-white shadow-sm"><ShoppingCart className="h-5 w-5"/><span className="font-medium">{totals.items}</span></button>
            <div className="relative">
              <button className="flex items-center gap-2 px-2 py-1 rounded-xl border bg-white dark:bg-neutral-900 dark:border-neutral-700"><img src={profile.avatar} alt="avatar" className="h-7 w-7 rounded-full"/><span className="hidden sm:block text-sm font-semibold">{profile.owner}</span><ChevronDown className="h-4 w-4"/></button>
            </div>
          </div>
        </div>
        <div className="md:hidden px-3 pb-3 max-w-7xl mx-auto flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-neutral-400" />
            <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search products" className="w-full pl-10 pr-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white/80 dark:bg-neutral-800" />
          </div>
          <div className="flex gap-1">
            {['POS','PAYMENTS'].map(tab => <TabButton key={tab} label={tab} active={activeTab===tab} onClick={()=>setActiveTab(tab)} />)}
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full grid grid-cols-12 gap-3 md:gap-4 px-3 md:px-4 py-3">
        <aside className={`${sidebarOpen? 'block' : 'hidden'} md:block col-span-12 md:col-span-3 lg:col-span-2 space-y-3`}>
          <div className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">Categories</div>
          <div className="grid grid-cols-2 md:block gap-2">
            {categories.map((c) => (
              <button key={c} onClick={() => setCategory(c)} className={`w-full text-left px-3 py-2 rounded-xl border transition-all ${category===c? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white border-orange-400 shadow-sm' : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 hover:bg-orange-50 hover:border-orange-200'}`}>
                <div className="text-sm font-medium">{c}</div>
                <div className="text-xs opacity-75">{c === "All" ? products.length : products.filter(p => p.category === c).length} items</div>
              </button>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-2xl border bg-white/80 dark:bg-neutral-900/70 border-neutral-200 dark:border-neutral-700 space-y-2">
            <div className="font-semibold text-sm">Bill Settings</div>
            <label className="block text-xs text-neutral-600 dark:text-neutral-400">Discount (₹)</label>
            <input type="number" value={discount} onChange={e=>setDiscount(Number(e.target.value))} className="w-full rounded-xl border px-3 py-1 bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700" />
            <label className="block text-xs text-neutral-600 dark:text-neutral-400">Tax (%)</label>
            <input type="number" value={taxPercent} onChange={e=>setTaxPercent(Number(e.target.value))} className="w-full rounded-xl border px-3 py-1 bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700" />
            <label className="block text-xs text-neutral-600 dark:text-neutral-400">Low-stock threshold</label>
            <input type="number" value={lowStockThreshold} onChange={e=>setLowStockThreshold(Number(e.target.value))} className="w-full rounded-xl border px-3 py-1 bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700" />
          </div>
          <div className="mt-3 p-3 rounded-2xl border bg-white/80 dark:bg-neutral-900/70 border-neutral-200 dark:border-neutral-700">
            <div className="text-sm font-semibold mb-2 flex items-center gap-2"><QrCode className="h-4 w-4"/> Quick Add</div>
            <div className="relative">
              <input value={sku} onChange={(e)=>setSku(e.target.value)} onKeyDown={(e)=>e.key==='Enter'&&onQuickAdd()} placeholder="Scan/Type SKU & Enter" className="w-full pl-3 pr-16 py-2 rounded-xl border bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700"/>
              <button onClick={onQuickAdd} className="absolute right-1 top-1.5 px-3 py-1 rounded-lg text-white bg-orange-500 hover:bg-orange-600 text-sm">Add</button>
            </div>
          </div>
        </aside>

        <main className={`${activeTab==='POS'? '' : 'hidden md:block'} col-span-12 md:col-span-6 lg:col-span-7`}>
          {showLowStock && (
            <div className="mb-3 md:mb-4 p-3 bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 rounded-xl"><div className="font-semibold text-amber-800 dark:text-amber-400 mb-1">⚠️ Inventory Alert</div><div className="text-sm text-amber-700 dark:text-amber-300">Showing {lowStockItems.length} low stock and {outOfStockItems.length} out-of-stock items</div></div>
          )}
          <div className={`grid ${gridLayout} gap-3 md:gap-4 auto-rows-fr`}>
            {filteredProducts.map((p) => {
              const rem = remainingStock(p.id); const low = rem <= Number(lowStockThreshold||0) && rem > 0; const oos = rem===0;
              return (
                <ProductCard key={p.id} product={p} rem={rem} low={low} oos={oos} onAdd={addToCart} />
              );
            })}
          </div>
        </main>

        <section className={`${activeTab==='POS'? '' : 'hidden md:block'} col-span-12 md:col-span-3 lg:col-span-3`}>
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white/80 dark:bg-neutral-900/70 backdrop-blur p-4 sticky top-24 shadow-sm max-h-[70vh] overflow-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold text-lg">Cart ({totals.items})</div>
              {cart.length ? (<button onClick={clearCart} className="text-sm text-red-600 hover:text-red-700 hover:underline inline-flex items-center gap-1"><Trash2 className="h-4 w-4"/> Clear</button>) : null}
            </div>
            {cart.length===0 ? (
              <div className="text-center py-8 text-neutral-500"><ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50"/><div className="text-sm">Cart is empty</div><div className="text-xs">Tap a product or scan SKU</div></div>
            ) : (
              <div className="space-y-2">
                {cart.map((line)=>{
                  const rem = remainingStock(line.id); const focused = focusedCartIdRef.current===line.id;
                  return (
                    <div key={line.id} className={`flex items-center gap-2 rounded-xl border p-3 bg-white dark:bg-neutral-900 ${focused? 'ring-2 ring-orange-300' : 'border-neutral-200 dark:border-neutral-700'}`} onMouseEnter={()=>{focusedCartIdRef.current=line.id;}}>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium line-clamp-2">{line.name}</div>
                        <div className="text-xs text-neutral-500 flex items-center gap-2"><span>{currency(line.priceSnapshot)}</span><span>•</span><span className="font-medium">{currency(line.qty*line.priceSnapshot)}</span></div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={()=>dec(line.id)} className="h-8 w-8 rounded-full border border-neutral-300 dark:border-neutral-700 flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-neutral-800"><Minus className="h-4 w-4"/></button>
                        <div className="w-9 text-center text-sm font-bold">{line.qty}</div>
                        <button onClick={()=>inc(line.id)} disabled={rem<=0} className={`h-8 w-8 rounded-full border flex items-center justify-center ${rem<=0? 'border-neutral-200 text-neutral-300 cursor-not-allowed' : 'border-neutral-300 dark:border-neutral-700 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300'}`}><Plus className="h-4 w-4"/></button>
                      </div>
                      <button onClick={()=>removeLine(line.id)} className="ml-1 text-neutral-400 hover:text-red-600"><Trash2 className="h-4 w-4"/></button>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-4 border-t dark:border-neutral-800 pt-4 space-y-2">
              <div>
                <label className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">Payment Mode</label>
                <select value={payMode} onChange={(e)=>setPayMode(e.target.value)} className="mt-1 w-full rounded-xl border border-neutral-300 dark:border-neutral-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white dark:bg-neutral-800">
                  <option value="CASH">💵 Cash</option>
                  <option value="UPI">📱 UPI</option>
                  <option value="CARD">💳 Card</option>
                  <option value="CREDIT">📝 Credit</option>
                </select>
              </div>
              <div className="space-y-2 text-sm bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3">
                <div className="flex items-center justify-between"><span>Items</span><span className="font-medium">{totals.items}</span></div>
                <div className="flex items-center justify-between"><span>Sub Total</span><span className="font-medium">{currency(totals.subTotal)}</span></div>
                <div className="flex items-center justify-between"><span>Discount</span><span className="font-medium">-{currency(totals.disc)}</span></div>
                <div className="flex items-center justify-between"><span>Tax ({Number(taxPercent||0)}%)</span><span className="font-medium">{currency(totals.tax)}</span></div>
                <div className="flex items-center justify-between text-lg font-bold border-t dark:border-neutral-700 pt-2"><span>Net Total</span><span className="text-orange-600">{currency(totals.net)}</span></div>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>printReceipt()} disabled={cart.length===0} className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-neutral-700 dark:text-neutral-200 border ${cart.length===0? 'bg-neutral-100 cursor-not-allowed' : 'bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}><Printer className="h-5 w-5"/> Preview</button>
                <button onClick={checkout} disabled={cart.length===0} className={`flex-[2] inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-white font-semibold transition-all ${cart.length===0? 'bg-neutral-300 cursor-not-allowed' : 'bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 active:scale-95 shadow-lg'}`} title="Ctrl+Enter to Checkout"><Check className="h-5 w-5"/> Checkout {totals.net>0 && `• ${currency(totals.net)}`}</button>
              </div>
            </div>
          </div>
        </section>

        <section className={`${activeTab==='PAYMENTS'? '' : 'hidden'} col-span-12`}>
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 p-3 md:p-4">
            <div className="flex flex-col md:flex-row md:items-end gap-2 md:gap-3 mb-3">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 flex-1">
                <div>
                  <label className="text-xs text-neutral-600 dark:text-neutral-400">Mode</label>
                  <select value={modeFilter} onChange={(e)=>{setModeFilter(e.target.value); setPage(1);}} className="w-full rounded-xl border px-3 py-2 bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700">
                    <option value="ALL">All</option><option value="CASH">Cash</option><option value="UPI">UPI</option><option value="CARD">Card</option><option value="CREDIT">Credit</option>
                  </select>
                </div>
                <div><label className="text-xs text-neutral-600 dark:text-neutral-400">From</label><input type="date" value={fromDate} onChange={e=>{setFromDate(e.target.value); setPage(1);}} className="w-full rounded-xl border px-3 py-2 bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700"/></div>
                <div><label className="text-xs text-neutral-600 dark:text-neutral-400">To</label><input type="date" value={toDate} onChange={e=>{setToDate(e.target.value); setPage(1);}} className="w-full rounded-xl border px-3 py-2 bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700"/></div>
                <div className="flex items-end gap-2">
                  <div className="inline-flex gap-1"><button onClick={()=>applyQuickRange('TODAY')} className="px-2 py-1 rounded-lg border text-xs">Today</button><button onClick={()=>applyQuickRange('7D')} className="px-2 py-1 rounded-lg border text-xs">7D</button><button onClick={()=>applyQuickRange('30D')} className="px-2 py-1 rounded-lg border text-xs">30D</button><button onClick={()=>applyQuickRange('ALL')} className="px-2 py-1 rounded-lg border text-xs">All</button></div>
                </div>
                <div className="flex items-end">
                  <div className="w-full rounded-xl border px-3 py-2 bg-neutral-50 dark:bg-neutral-800 text-sm">Total: <span className="font-semibold">{currency(filteredSales.reduce((a,s)=>a+(s.net??s.amount??0),0))}</span></div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>exportCSV(filteredSales)} className="inline-flex items-center gap-1 text-sm px-3 py-2 rounded-xl border bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700"><Download className="h-4 w-4"/> Export CSV</button>
              </div>
            </div>
            <div className="overflow-auto rounded-xl border sticky top-20">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 dark:bg-neutral-800 sticky top-0">
                  <tr className="text-left">
                    <th className="py-2 px-2">Time</th>
                    <th className="py-2 px-2">Mode</th>
                    <th className="py-2 px-2 text-right">Net</th>
                    <th className="py-2 px-2">Items</th>
                    <th className="py-2 px-2">Print</th>
                  </tr>
                </thead>
                <tbody>
                  {pageSales.map((s)=> (
                    <tr key={s.id} className="border-t dark:border-neutral-800">
                      <td className="py-2 px-2 whitespace-nowrap">{new Date(s.time).toLocaleString()}</td>
                      <td className="py-2 px-2"><span className="text-xs bg-neutral-100 dark:bg-neutral-700 px-2 py-0.5 rounded-full">{s.mode}</span></td>
                      <td className="py-2 px-2 text-right font-semibold">{currency(s.net ?? s.amount)}</td>
                      <td className="py-2 px-2 text-neutral-600 dark:text-neutral-300 truncate" title={s.items.map(i=>`${i.name} x${i.qty}`).join(', ')}>{s.items.length} items</td>
                      <td className="py-2 px-2"><button onClick={()=>printReceipt(s)} className="text-sm px-2 py-1 rounded-lg border bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 inline-flex items-center gap-1"><Printer className="h-4 w-4"/> Print</button></td>
                    </tr>
                  ))}
                  {filteredSales.length === 0 && (
                    <tr><td colSpan={5} className="py-6 text-center text-neutral-500">No matching payments</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="text-xs text-neutral-500">Showing {(page-1)*pageSize + 1}-{Math.min(page*pageSize, filteredSales.length)} of {filteredSales.length}</div>
              <div className="flex items-center gap-2">
                <select value={pageSize} onChange={(e)=>{setPageSize(Number(e.target.value)); setPage(1);}} className="rounded-xl border px-2 py-1 bg-white dark:bg-neutral-900">
                  {[10,20,50].map(n => <option key={n} value={n}>{n}/page</option>)}
                </select>
                <div className="inline-flex items-center gap-1">
                  <button disabled={page===1} onClick={()=>setPage(p=>Math.max(1,p-1))} className={`px-3 py-1 rounded-lg border ${page===1? 'opacity-50 cursor-not-allowed' : ''}`}>Prev</button>
                  <span className="text-sm">{page}/{totalPages}</span>
                  <button disabled={page===totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))} className={`px-3 py-1 rounded-lg border ${page===totalPages? 'opacity-50 cursor-not-allowed' : ''}`}>Next</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={`${activeTab==='ANALYTICS'? '' : 'hidden'} col-span-12`}>
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 p-3 md:p-4 mb-3 flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2"><BarChart3 className="h-5 w-5"/><span className="font-semibold">Analytics</span></div>
            <div className="inline-flex items-center gap-2 text-sm"><span>Range</span>
              {[7,14,30,90].map(n => (
                <button key={n} onClick={()=>setAnaRange(n)} className={`px-2 py-1 rounded-lg border ${anaRange===n? 'bg-orange-500 text-white border-orange-500' : ''}`}>{n}D</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-12 gap-3 md:gap-4">
            <div className="col-span-12 lg:col-span-8 rounded-2xl border bg-white/70 dark:bg-neutral-900/70 p-3 md:p-4">
              <div className="font-semibold mb-2">Net Sales (Last {anaRange} Days)</div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesByDay} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(v)=>currency(v)} />
                    <Line type="monotone" dataKey="total" dot={false} stroke="#f97316" />
                    <Line type="monotone" dataKey="ma" data={movingAvg} dot={false} stroke="#6366f1" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-4 rounded-2xl border bg-white/70 dark:bg-neutral-900/70 p-3 md:p-4">
              <div className="font-semibold mb-2">Payment Modes</div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={payModeAgg} dataKey="value" nameKey="name" outerRadius={90} label>
                      {payModeAgg.map((_, i) => <Cell key={i} fill={["#22c55e","#3b82f6","#f97316","#a78bfa"][i%4]} />)}
                    </Pie>
                    <Legend />
                    <Tooltip formatter={(v)=>currency(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="col-span-12 rounded-2xl border bg-white/70 dark:bg-neutral-900/70 p-3 md:p-4">
              <div className="font-semibold mb-2">Top Products (by Qty)</div>
              <div className="h-64">
                {topProducts.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProducts} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" hide={ww < 640} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="qty" fill="#f97316" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-neutral-500">No sales yet — make your first sale to see insights.</div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className={`${activeTab==='PROFILE' ? '' : 'hidden'} col-span-12`}>
          <div className="grid grid-cols-12 gap-3 md:gap-4">
            <div className="col-span-12 lg:col-span-4 rounded-2xl border bg-white/70 dark:bg-neutral-900/70 p-4">
              <div className="flex items-center gap-3">
                <img src={profile.avatar} className="h-16 w-16 rounded-2xl" alt="shop avatar" />
                <div>
                  <div className="font-bold text-lg">{profile.shopName}</div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-300">Owner: {profile.owner}</div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">Hours: {profile.hours}</div>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div><span className="text-neutral-500">Phone:</span> {profile.phone}</div>
                <div><span className="text-neutral-500">GSTIN:</span> {profile.gstin || '-'}</div>
                <div><span className="text-neutral-500">Address:</span> {profile.address}</div>
              </div>
              <div className="mt-4">
                <button onClick={() => { localStorage.clear(); location.reload(); }} className="text-sm px-3 py-2 rounded-xl border bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800">Reset demo data</button>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-8 rounded-2xl border bg-white/70 dark:bg-neutral-900/70 p-4">
              <div className="font-semibold mb-2">Edit Profile & Theme</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className="text-xs text-neutral-600">Shop Name</label><input value={profile.shopName} onChange={(e)=>setProfile({...profile, shopName:e.target.value})} className="w-full rounded-xl border px-3 py-2 bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700"/></div>
                <div><label className="text-xs text-neutral-600">Owner</label><input value={profile.owner} onChange={(e)=>setProfile({...profile, owner:e.target.value})} className="w-full rounded-xl border px-3 py-2 bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700"/></div>
                <div><label className="text-xs text-neutral-600">Phone</label><input value={profile.phone} onChange={(e)=>setProfile({...profile, phone:e.target.value})} className="w-full rounded-xl border px-3 py-2 bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700"/></div>
                <div><label className="text-xs text-neutral-600">GSTIN</label><input value={profile.gstin} onChange={(e)=>setProfile({...profile, gstin:e.target.value})} className="w-full rounded-xl border px-3 py-2 bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700"/></div>
                <div><label className="text-xs text-neutral-600">Hours</label><input value={profile.hours} onChange={(e)=>setProfile({...profile, hours:e.target.value})} className="w-full rounded-xl border px-3 py-2 bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700"/></div>
                <div className="md:col-span-2"><label className="text-xs text-neutral-600">Address</label><textarea value={profile.address} onChange={(e)=>setProfile({...profile, address:e.target.value})} className="w-full rounded-xl border px-3 py-2 bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700" rows={3} /></div>
                <div className="md:col-span-2"><label className="text-xs text-neutral-600">Avatar URL</label><input value={profile.avatar} onChange={(e)=>setProfile({...profile, avatar:e.target.value})} className="w-full rounded-xl border px-3 py-2 bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700"/></div>
                <div className="md:col-span-2">
                  <label className="text-xs text-neutral-600">Theme</label>
                  <div className="mt-1 inline-flex gap-2">
                    <button onClick={()=>setTheme('light')} className={`px-3 py-1 rounded-lg border ${theme==='light' ? 'bg-orange-500 text-white border-orange-500' : ''}`}>Light</button>
                    <button onClick={()=>setTheme('dark')} className={`px-3 py-1 rounded-lg border ${theme==='dark' ? 'bg-orange-500 text-white border-orange-500' : ''}`}>Dark</button>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-sm text-green-700 dark:text-green-400">Changes auto-save.</div>
            </div>
          </div>
        </section>
      </div>

      {activeTab==='POS' && (
        <div className="md:hidden sticky bottom-0 z-30 bg-white/90 dark:bg-neutral-900/90 backdrop-blur border-t dark:border-neutral-800">
          <div className="max-w-7xl mx-auto px-3 py-2 flex items-center gap-2">
            <div className="flex-1">
              <div className="text-xs text-neutral-500">Net Total</div>
              <div className="text-lg font-bold text-orange-600">{currency(totals.net)}</div>
            </div>
            <button onClick={()=>setCartOpen(true)} className="px-3 py-2 rounded-xl border bg-white dark:bg-neutral-900 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" /> {totals.items}
            </button>
            <button onClick={checkout} disabled={cart.length===0} className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-white font-semibold ${cart.length===0? 'bg-neutral-300' : 'bg-orange-500'}`}>
              Checkout
            </button>
          </div>
        </div>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={()=>setCartOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 rounded-t-3xl p-4 max-h-[85vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Cart ({totals.items})</div>
              <button onClick={()=>setCartOpen(false)} className="text-sm">Close</button>
            </div>
            {cart.length===0 ? (
              <div className="text-center text-neutral-500 py-8">Cart is empty</div>
            ) : (
              <div className="space-y-2">
                {cart.map((line)=> (
                  <div key={line.id} className="flex items-center gap-2 rounded-xl border p-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium line-clamp-2">{line.name}</div>
                      <div className="text-xs text-neutral-500">{currency(line.priceSnapshot)} • {currency(line.qty*line.priceSnapshot)}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={()=>dec(line.id)} className="h-8 w-8 rounded-full border flex items-center justify-center"><Minus className="h-4 w-4" /></button>
                      <div className="w-8 text-center text-sm font-bold">{line.qty}</div>
                      <button onClick={()=>inc(line.id)} className="h-8 w-8 rounded-full border flex items-center justify-center"><Plus className="h-4 w-4" /></button>
                    </div>
                    <button onClick={()=>removeLine(line.id)} className="ml-1 text-neutral-400"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-sm"><span>Sub Total</span><span className="font-medium">{currency(totals.subTotal)}</span></div>
              <div className="flex items-center justify-between text-sm"><span>Discount</span><span className="font-medium">-{currency(totals.disc)}</span></div>
              <div className="flex items-center justify-between text-sm"><span>Tax ({taxPercent}%)</span><span className="font-medium">{currency(totals.tax)}</span></div>
              <div className="flex items-center justify-between text-lg font-bold"><span>Net</span><span className="text-orange-600">{currency(totals.net)}</span></div>
              <button onClick={checkout} disabled={isLoading || cart.length === 0} className={`w-full rounded-xl px-4 py-3 text-white font-semibold ${cart.length === 0 || isLoading ? 'bg-neutral-300' : 'bg-orange-500 active:scale-95'}`}>
                {isLoading ? (<span className="flex items-center justify-center gap-2"><Loader2 className="h-5 w-5 animate-spin" />Processing...</span>) : (`Checkout • ${currency(totals.net)}`)}
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            <div className="mt-2 font-medium">Processing...</div>
          </div>
        </div>
      )}

      {isOffline && (
        <div className="fixed bottom-4 left-4 bg-amber-500 text-white px-4 py-2 rounded-xl shadow-lg">
          You are offline. Changes will sync when back online.
        </div>
      )}

      <button onClick={() => alert('Keyboard Shortcuts:\\n\\nCtrl+Enter: Checkout\\n+/-: Adjust quantity\\nDel: Remove item\\nAlt+1-9: Quick category switch')} className="fixed bottom-4 right-4 h-12 w-12 bg-orange-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-orange-600">?</button>

      <footer className="py-6 text-center text-xs text-neutral-400">
        Responsive POS — Data persists in localStorage. Tabs: POS • Payments • Analytics • Profile. Shortcuts (POS):
        <kbd>Ctrl+Enter</kbd> checkout, <kbd>+</kbd>/<kbd>-</kbd> adjust, <kbd>Del</kbd> remove.
      </footer>
    </div>
  );
}
