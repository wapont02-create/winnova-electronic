'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  description?: string;
  image?: string;
}

interface MenuCategory {
  category: string;
  items: MenuItem[];
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

const BRAND = 'WINNOVA ELECTRONIC';
const WHATSAPP_PHONE = '584129269308'; // Sustituir por el WhatsApp de la tienda cuando corresponda.
const BLUE = '#1677FF';

export default function ClientMenu({
  initialCategories,
}: {
  initialCategories: MenuCategory[];
}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [orderType, setOrderType] = useState('');
  const [deliveryZone, setDeliveryZone] = useState('Guarenas');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Pago Móvil (Bs)');
  const [exchangeRate, setExchangeRate] = useState(778.33);
  const [isLoadingExchangeRate, setIsLoadingExchangeRate] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadExchangeRate = async () => {
      try {
        setIsLoadingExchangeRate(true);
        const response = await fetch('/api/exchange-rate', {
          method: 'GET',
          cache: 'no-store',
        });
        const data = await response.json();
        if (isMounted && response.ok && data?.success && Number(data.rate) > 0) {
          setExchangeRate(Number(data.rate));
        }
      } catch (error) {
        console.error('Error obteniendo la tasa de cambio:', error);
      } finally {
        if (isMounted) setIsLoadingExchangeRate(false);
      }
    };
    loadExchangeRate();
    const interval = setInterval(loadExchangeRate, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const filteredCategories = useMemo(
    () =>
      initialCategories
        .map((cat) => ({
          ...cat,
          items: cat.items.filter(
            (item) =>
              item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (item.description || '').toLowerCase().includes(searchQuery.toLowerCase()),
          ),
        }))
        .filter(
          (cat) =>
            (selectedCategory === 'Todos' || cat.category === selectedCategory) &&
            cat.items.length > 0,
        ),
    [initialCategories, searchQuery, selectedCategory],
  );

  const addToCart = (product: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id !== id) return item;
          const quantity = item.quantity + delta;
          return quantity > 0 ? { ...item, quantity } : null;
        })
        .filter((item): item is CartItem => item !== null),
    );
  };

  const getItemQuantity = (id: number) => cart.find((item) => item.id === id)?.quantity || 0;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryCost = orderType === 'Delivery' ? (deliveryZone === 'Guarenas' ? 2 : 3) : 0;
  const totalPrice = (subtotalPrice + deliveryCost).toFixed(2);
  const totalBs = (Number(totalPrice) * exchangeRate).toFixed(2);

  const checkoutWhatsApp = async () => {
    if (cart.length === 0) return alert('Agrega al menos un producto al carrito.');
    if (!orderType) return alert('Por favor selecciona cómo deseas recibir tu pedido.');
    if (!customerName.trim() || !customerPhone.trim()) {
      return alert('Por favor ingresa tu Nombre y Teléfono de contacto.');
    }
    if (orderType === 'Delivery' && !deliveryAddress.trim()) {
      return alert('Por favor ingresa la dirección exacta para el delivery.');
    }
    if (isLoadingExchangeRate) {
      return alert('Estamos actualizando la tasa de cambio. Intenta nuevamente en unos segundos.');
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerDocument: '',
          orderType,
          deliveryZone: orderType === 'Delivery' ? deliveryZone : '',
          deliveryAddress: orderType === 'Delivery' ? deliveryAddress.trim() : '',
          items: cart,
          total: Number(totalPrice),
          totalBs: Number(totalBs),
          exchangeRate,
          paymentMethod,
          created_at: new Date().toISOString(),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || data?.error || 'Error al registrar el pedido.');
      }
    } catch (error: any) {
      alert('Hubo un problema al registrar el pedido: ' + (error?.message || 'Error'));
      setIsSubmitting(false);
      return;
    } finally {
      setIsSubmitting(false);
    }

    let message = `🖥️ *NUEVO PEDIDO - ${BRAND}* 🖥️\n\n`;
    message += `👤 *Cliente:* ${customerName}\n`;
    message += `📞 *Teléfono:* ${customerPhone}\n`;
    message += `📍 *Servicio:* ${orderType}${orderType === 'Delivery' ? ` (${deliveryZone})` : ''}\n`;
    if (orderType === 'Delivery') message += `🏠 *Dirección:* ${deliveryAddress}\n`;
    message += `💳 *Pago:* ${paymentMethod}\n`;
    message += `-----------------------------------\n`;
    cart.forEach((item) => {
      message += `• ${item.quantity}x ${item.name} ($${(item.price * item.quantity).toFixed(2)})\n`;
    });
    message += `-----------------------------------\n`;
    if (orderType === 'Delivery') message += `🛵 *Delivery:* $${deliveryCost.toFixed(2)}\n`;
    message += `💵 *TOTAL USD:* $${totalPrice}\n`;
    message += `🇻🇪 *TOTAL BS (Tasa ${exchangeRate.toFixed(2)}):* Bs. ${totalBs}`;
    window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const inputClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10';
  const selectClass = `${inputClass} appearance-none`;

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#F3F6FB] font-sans text-slate-900 selection:bg-blue-200">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200 bg-white px-5 py-6 shadow-sm lg:flex">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-800 text-white shadow-lg shadow-blue-600/25">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4M7 9h10M7 12h6" /></svg>
          </div>
          <div><p className="text-xs font-black tracking-tight text-slate-950">WINNOVA</p><p className="text-[10px] font-bold tracking-[0.16em] text-blue-600">ELECTRONIC</p></div>
        </div>
        <p className="mb-3 mt-7 px-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Menú principal</p>
        <nav className="space-y-1">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex w-full items-center gap-3 rounded-xl bg-blue-50 px-3 py-3 text-left text-xs font-extrabold text-blue-700"><span className="text-base">⌂</span> Inicio</button>
          <button onClick={() => document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-bold text-slate-600 transition hover:bg-slate-50 hover:text-blue-700"><span className="text-base">▦</span> Tienda</button>
          <button onClick={() => document.getElementById('categorias')?.scrollIntoView({ behavior: 'smooth' })} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-bold text-slate-600 transition hover:bg-slate-50 hover:text-blue-700"><span className="text-base">◈</span> Categorías</button>
          <button onClick={() => setIsCartOpen(true)} className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-xs font-bold text-slate-600 transition hover:bg-slate-50 hover:text-blue-700"><span className="flex items-center gap-3"><span className="text-base">🛒</span> Mi carrito</span>{totalItems > 0 && <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-black text-white">{totalItems}</span>}</button>
        </nav>
        <div className="mt-auto rounded-2xl bg-[#071A36] p-4 text-white"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-300">Winnova Tech</p><p className="mt-2 text-xs font-bold leading-relaxed">Tecnología para conectar con lo que necesitas.</p><Link href="/login" className="mt-4 inline-flex text-[10px] font-bold text-cyan-300 hover:text-white">Acceso POS →</Link></div>
      </aside>
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-xl lg:pl-64">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-800 text-white shadow-lg shadow-blue-600/25">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="13" rx="2" />
                <path d="M8 21h8M12 17v4M7 9h10M7 12h6" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black tracking-tight text-slate-950 sm:text-base">WINNOVA <span className="text-blue-600">ELECTRONIC</span></p>
              <p className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 sm:text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {isLoadingExchangeRate ? 'Actualizando tasa...' : `Tasa BCV: Bs. ${exchangeRate.toFixed(2)}`}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link href="/login" className="hidden items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 sm:flex">
              <span>🔐</span> Acceso POS
            </Link>
            <button onClick={() => setIsCartOpen(true)} className="relative flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-95 sm:px-4">
              <span>🛒</span><span className="hidden xs:inline">Mi carrito</span>
              {totalItems > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-black text-blue-700">{totalItems}</span>}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pb-32 pt-5 sm:px-6 sm:pt-8 lg:ml-64 lg:max-w-none">
        <section id="inicio" className="relative isolate overflow-hidden rounded-[28px] bg-[#071A36] px-5 py-7 text-white shadow-xl shadow-blue-950/10 sm:px-9 sm:py-10 lg:px-12">
          <div className="absolute -right-20 -top-28 -z-10 h-80 w-80 rounded-full bg-blue-500/30 blur-3xl" />
          <div className="absolute -bottom-32 right-1/4 -z-10 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-300/25 bg-blue-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-200 sm:text-xs">
                <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_#67e8f9]" /> Tecnología para tu día a día
              </div>
              <h1 className="max-w-2xl text-3xl font-black leading-[1.08] tracking-tight sm:text-5xl">Conecta con lo que <span className="text-cyan-300">necesitas.</span></h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-blue-100/75 sm:text-base">Explora nuestro catálogo de tecnología, encuentra tus productos favoritos y realiza tu pedido de forma rápida y sencilla.</p>
              <div className="mt-6 flex flex-wrap gap-2 text-[11px] font-semibold text-blue-50/90 sm:text-xs">
                <span className="rounded-xl border border-white/10 bg-white/10 px-3 py-2">✓ Compra fácil</span>
                <span className="rounded-xl border border-white/10 bg-white/10 px-3 py-2">✓ Atención personalizada</span>
                <span className="rounded-xl border border-white/10 bg-white/10 px-3 py-2">✓ Precios en USD y Bs</span>
              </div>
            </div>
            <div className="hidden lg:flex lg:justify-end">
              <div className="relative flex h-52 w-64 items-center justify-center rounded-[32px] border border-white/15 bg-gradient-to-br from-white/15 to-white/[0.03] shadow-2xl backdrop-blur-sm">
                <div className="absolute inset-4 rounded-[24px] border border-dashed border-cyan-200/20" />
                <svg viewBox="0 0 180 150" className="h-40 w-48 text-cyan-200" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="43" y="15" width="94" height="120" rx="13" />
                  <rect x="53" y="27" width="74" height="88" rx="5" fill="currentColor" fillOpacity=".08" />
                  <path d="M82 125h16M66 48h48M66 61h33M66 74h43" />
                  <circle cx="90" cy="95" r="7" />
                  <path d="m20 48 9-9 9 9M29 39v30M141 96l9 9 9-9m-9 9V75" />
                </svg>
                <span className="absolute bottom-4 right-5 rounded-lg bg-cyan-300 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-blue-950">Winnova Tech</span>
              </div>
            </div>
          </div>
          <div className="mt-7 max-w-xl">
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">⌕</span>
              <input type="text" placeholder="Buscar productos, marcas o categorías..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full rounded-2xl border border-white/15 bg-white px-11 py-3.5 text-sm text-slate-900 shadow-xl outline-none placeholder:text-slate-400 focus:ring-4 focus:ring-cyan-300/20" />
              {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-3 px-2 text-slate-400 hover:text-slate-800" aria-label="Limpiar búsqueda">✕</button>}
            </div>
          </div>
        </section>

        <section id="categorias" className="sticky top-[72px] z-30 -mx-4 mt-5 border-b border-slate-200 bg-[#F3F6FB]/95 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
          <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button onClick={() => setSelectedCategory('Todos')} className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-extrabold transition ${selectedCategory === 'Todos' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700'}`}>Todos los productos</button>
            {initialCategories.map((cat, idx) => (
              <button key={`${cat.category}-${idx}`} onClick={() => setSelectedCategory(cat.category)} className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-extrabold transition ${selectedCategory === cat.category ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700'}`}>{cat.category}</button>
            ))}
          </div>
        </section>

        <section id="catalogo" className="pt-7">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Catálogo Winnova</p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">Explora nuestros productos</h2>
            </div>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold text-slate-500">{filteredCategories.reduce((sum, cat) => sum + cat.items.length, 0)} productos</span>
          </div>

          {filteredCategories.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-5 py-20 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-3xl">🔎</div>
              <p className="font-bold text-slate-800">No encontramos productos</p>
              <p className="mt-1 text-xs text-slate-500">Prueba con otro nombre o selecciona una categoría diferente.</p>
              <button onClick={() => { setSearchQuery(''); setSelectedCategory('Todos'); }} className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700">Ver todo el catálogo</button>
            </div>
          ) : (
            filteredCategories.map((cat, idx) => (
              <div key={`${cat.category}-${idx}`} className="mb-10">
                <div className="mb-4 flex items-center gap-3">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">{cat.category}</h3>
                  <span className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">{cat.items.length}</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {cat.items.map((product) => {
                    const imageUrl = typeof product.image === 'string' ? product.image.trim() : '';
                    const validImage = imageUrl && imageUrl !== 'NULL' && imageUrl !== 'EMPTY_STRING';
                    const qty = getItemQuantity(product.id);
                    return (
                      <article key={product.id} className="group flex min-w-0 flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5">
                        <div className="relative h-52 overflow-hidden bg-gradient-to-br from-slate-100 to-blue-50 sm:h-56">
                          {validImage ? (
                            <img src={imageUrl} alt={product.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          ) : null}
                          {!validImage && <div className="absolute inset-0 flex flex-col items-center justify-center text-blue-300"><div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-blue-100 bg-white/80 text-4xl shadow-sm">⌁</div><span className="mt-3 text-[9px] font-black uppercase tracking-[0.22em] text-blue-400">Winnova Electronic</span></div>}
                          <div className="absolute left-3 top-3 rounded-lg border border-white/70 bg-white/90 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-blue-700 shadow-sm">Disponible</div>
                          <div className="absolute bottom-3 right-3 rounded-xl bg-[#071A36]/95 px-3 py-2 text-sm font-black text-white shadow-lg">${Number(product.price || 0).toFixed(2)}</div>
                        </div>
                        <div className="flex flex-1 flex-col p-4">
                          <h4 className="line-clamp-2 min-h-10 text-sm font-extrabold leading-snug text-slate-900 transition group-hover:text-blue-700">{product.name}</h4>
                          <p className="mt-1 line-clamp-2 min-h-9 text-xs leading-relaxed text-slate-500">{product.description || 'Producto disponible en nuestro catálogo. Consulta los detalles y realiza tu pedido.'}</p>
                          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                            <span className="text-[10px] font-semibold text-slate-400">Precio en USD</span>
                            {qty === 0 ? (
                              <button onClick={() => addToCart(product)} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 active:scale-95"><span className="text-base leading-none">+</span> Agregar</button>
                            ) : (
                              <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-1">
                                <button onClick={() => updateQuantity(product.id, -1)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-sm font-black text-blue-700 shadow-sm hover:bg-blue-100" aria-label="Disminuir cantidad">−</button>
                                <span className="w-4 text-center text-xs font-black text-blue-800">{qty}</span>
                                <button onClick={() => updateQuantity(product.id, 1)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-sm font-black text-white shadow-sm hover:bg-blue-700" aria-label="Aumentar cantidad">+</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </section>
      </main>

      {totalItems === 0 && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-4 border-t border-slate-200 bg-white/95 px-2 py-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:hidden">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex flex-col items-center gap-1 py-1 text-[9px] font-bold text-blue-700"><span className="text-lg">⌂</span>Inicio</button>
          <button onClick={() => document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })} className="flex flex-col items-center gap-1 py-1 text-[9px] font-bold text-slate-500"><span className="text-lg">▦</span>Tienda</button>
          <button onClick={() => document.getElementById('categorias')?.scrollIntoView({ behavior: 'smooth' })} className="flex flex-col items-center gap-1 py-1 text-[9px] font-bold text-slate-500"><span className="text-lg">◈</span>Categorías</button>
          <button onClick={() => setIsCartOpen(true)} className="flex flex-col items-center gap-1 py-1 text-[9px] font-bold text-slate-500"><span className="text-lg">🛒</span>Carrito</button>
        </nav>
      )}

      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-12px_40px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-4">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-600/25">{totalItems}</div>
              <div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Total de tu compra</p><p className="truncate text-base font-black text-slate-950">${totalPrice} <span className="text-[11px] font-semibold text-slate-500">· Bs. {totalBs}</span></p></div>
            </div>
            <button onClick={() => setIsCartOpen(true)} className="shrink-0 rounded-xl bg-blue-600 px-5 py-3 text-xs font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-95">Ver carrito <span className="ml-1">→</span></button>
          </div>
        </div>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setIsCartOpen(false); }}>
          <aside className="flex h-full w-full max-w-lg flex-col overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur-xl">
              <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">Winnova Electronic</p><h2 className="mt-0.5 text-lg font-black text-slate-950">Tu carrito</h2></div>
              <button onClick={() => setIsCartOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900" aria-label="Cerrar carrito">✕</button>
            </div>
            <div className="flex-1 space-y-5 p-5">
              {cart.length === 0 ? (
                <div className="py-16 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-3xl">🛒</div><p className="mt-4 font-bold text-slate-800">Tu carrito está vacío</p><p className="mt-1 text-xs text-slate-500">Agrega productos del catálogo para continuar.</p><button onClick={() => setIsCartOpen(false)} className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white">Explorar productos</button></div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between"><h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Productos seleccionados</h3><span className="text-[10px] font-bold text-slate-400">{totalItems} unidades</span></div>
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="min-w-0 flex-1"><p className="line-clamp-2 text-xs font-extrabold text-slate-900">{item.name}</p><p className="mt-1 text-[11px] font-bold text-blue-700">${item.price.toFixed(2)} c/u</p></div>
                      <div className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white p-1"><button onClick={() => updateQuantity(item.id, -1)} className="h-7 w-7 rounded-lg bg-slate-100 text-sm font-black text-slate-700 hover:bg-slate-200">−</button><span className="w-4 text-center text-xs font-black">{item.quantity}</span><button onClick={() => updateQuantity(item.id, 1)} className="h-7 w-7 rounded-lg bg-blue-600 text-sm font-black text-white hover:bg-blue-700">+</button></div>
                    </div>
                  ))}
                </div>
              )}

              {cart.length > 0 && <>
                <div className="h-px bg-slate-100" />
                <section className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Datos de contacto</h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="space-y-1.5"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Nombre</span><input type="text" placeholder="Tu nombre y apellido" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputClass} /></label>
                    <label className="space-y-1.5"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Teléfono</span><input type="text" placeholder="0412-0000000" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className={inputClass} /></label>
                  </div>
                </section>
                <section className="space-y-3">
                  <label className="block space-y-1.5"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">¿Cómo deseas recibir tu pedido?</span><select value={orderType} onChange={(e) => setOrderType(e.target.value)} required className={selectClass}><option value="" disabled>Selecciona una modalidad</option><option value="Delivery">🛵 Delivery a domicilio</option><option value="Pickup">🏃 Retirar en local (Pickup)</option><option value="Local / Mesa">🏬 Compra en local / Mesa</option></select></label>
                  {!orderType && <p className="text-[10px] font-semibold text-amber-600">Selecciona una modalidad para calcular el total.</p>}
                  {orderType === 'Delivery' && <div className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-3"><label className="block space-y-1.5"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Zona de delivery</span><select value={deliveryZone} onChange={(e) => setDeliveryZone(e.target.value)} className={selectClass}><option value="Guarenas">Guarenas ($2.00)</option><option value="Guatire">Guatire ($3.00)</option></select></label><label className="block space-y-1.5"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Dirección exacta</span><input type="text" placeholder="Urbanización, calle, casa o referencia..." value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} className={inputClass} /></label></div>}
                  <label className="block space-y-1.5"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Método de pago</span><select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={selectClass}><option value="Pago Móvil (Bs)">📱 Pago Móvil (Bolívares)</option><option value="Efectivo / Divisas">💵 Efectivo / Divisas ($)</option><option value="Zelle / Binance">🌐 Zelle / Binance</option></select></label>
                </section>
                <section className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex justify-between text-xs text-slate-500"><span>Subtotal productos</span><span className="font-bold text-slate-800">${subtotalPrice.toFixed(2)}</span></div>
                  {orderType === 'Delivery' && <div className="flex justify-between text-xs text-slate-500"><span>Delivery ({deliveryZone})</span><span className="font-bold text-slate-800">${deliveryCost.toFixed(2)}</span></div>}
                  <div className="my-2 h-px bg-slate-200" />
                  <div className="flex justify-between text-sm font-black text-slate-950"><span>Total USD</span><span>${totalPrice}</span></div>
                  <div className="flex justify-between text-xs font-bold text-blue-700"><span>Total en Bs. <span className="font-medium text-slate-400">(BCV {exchangeRate.toFixed(2)})</span></span><span>Bs. {totalBs}</span></div>
                </section>
                <button onClick={checkoutWhatsApp} disabled={isSubmitting || isLoadingExchangeRate || !orderType} className="w-full rounded-2xl bg-blue-600 px-4 py-4 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? 'Procesando pedido...' : isLoadingExchangeRate ? 'Actualizando tasa...' : !orderType ? 'Selecciona cómo recibir tu pedido' : 'Confirmar pedido por WhatsApp →'}</button>
                <p className="text-center text-[10px] leading-relaxed text-slate-400">Al confirmar, registraremos tu pedido y abriremos WhatsApp para continuar la atención.</p>
              </>}
            </div>
          </aside>
        </div>
      )}

      <footer className="border-t border-slate-200 bg-white px-4 py-7 text-center lg:ml-64">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-1">
          <p className="text-xs font-black tracking-wide text-slate-800">WINNOVA <span className="text-blue-600">ELECTRONIC</span></p>
          <p className="text-[10px] text-slate-400">Tecnología, confianza y atención para ti.</p>
          <Link href="/login" className="mt-2 text-[10px] font-bold text-blue-600 hover:text-blue-800">Acceso al sistema POS</Link>
        </div>
      </footer>
    </div>
  );
}
