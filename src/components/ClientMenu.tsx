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
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-xl">
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

      <main className="mx-auto w-full max-w-7xl px-4 pb-32 pt-5 sm:px-6 sm:pt-8">
        <section className="relative isolate overflow-hidden rounded-[28px] bg-[#071A36] px-5 py-7 text-white shadow-xl shadow-blue-950/10 sm:px-9 sm:py-10 lg:px-12">
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

        <section className="sticky top-[72px] z-30 -mx-4 mt-5 border-b border-slate-200 bg-[#F3F6FB]/95 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
          <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button onClick={() => setSelectedCategory('Todos')} className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-extrabold transition ${selectedCategory === 'Todos' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700'}`}>Todos los productos</button>
            {initialCategories.map((cat, idx) => (
              <button key={`${cat.category}-${idx}`} onClick={() => setSelectedCategory(cat.category)} className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-extrabold transition ${selectedCategory === cat.category ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700'}`}>{cat.category}</button>
            ))}
          </div>
        </section>

        <section className="pt-7">
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
