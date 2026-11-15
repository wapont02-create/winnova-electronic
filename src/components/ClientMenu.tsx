
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

type OrderType = 'Delivery' | 'Retiro en tienda' | 'Envío nacional';
type PaymentMethod = 'Pago Móvil' | 'Binance' | 'PayPal';

const BRAND = 'WINNOVA ELECTRONIC';
const WHATSAPP_PHONE = '584129269308';

const PAYMENT_DETAILS: Record<PaymentMethod, { title: string; details: string[] }> = {
  'Pago Móvil': {
    title: 'Pago Móvil - Banesco',
    details: [
      'Banco: Banesco',
      'Código: 0134',
      'Teléfono: 04143065287',
      'Cédula/RIF: 14972818',
    ],
  },
  Binance: {
    title: 'Binance',
    details: ['Correo de pago: thepiano3@hotmail.com'],
  },
  PayPal: {
    title: 'PayPal',
    details: ['Correo de pago: willieaponte@hotmail.com'],
  },
};

export default function ClientMenu({
  initialCategories,
}: {
  initialCategories: MenuCategory[];
}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [step, setStep] = useState(1);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerDocument, setCustomerDocument] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const [orderType, setOrderType] = useState<OrderType | ''>('');
  const [deliveryZone, setDeliveryZone] = useState('Guarenas');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [destinationState, setDestinationState] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [shippingCompany, setShippingCompany] = useState('Zoom');

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Pago Móvil');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);

  const [exchangeRate, setExchangeRate] = useState(778.33);
  const [isLoadingExchangeRate, setIsLoadingExchangeRate] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadExchangeRate = async () => {
      try {
        const response = await fetch('/api/exchange-rate', {
          method: 'GET',
          cache: 'no-store',
        });
        const data = await response.json();

        if (isMounted && response.ok && data?.success && Number(data.rate) > 0) {
          setExchangeRate(Number(data.rate));
        }
      } catch (error) {
        console.error('Error obteniendo la tasa:', error);
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
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
        },
      ];
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

  const getItemQuantity = (id: number) =>
    cart.find((item) => item.id === id)?.quantity || 0;

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const deliveryCost =
    orderType === 'Delivery' && deliveryZone === 'Guatire' ? 2 : 0;

  const totalPrice = (subtotalPrice + deliveryCost).toFixed(2);
  const totalBs = (Number(totalPrice) * exchangeRate).toFixed(2);

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10';

  const selectClass = `${inputClass} appearance-none`;

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      alert('Dato copiado correctamente.');
    } catch {
      alert('No se pudo copiar automáticamente. Mantén presionado el dato para copiarlo.');
    }
  };

  const validateStep = () => {
    if (step === 1) {
      if (!customerName.trim() || !customerPhone.trim()) {
        alert('Completa tu nombre y teléfono.');
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!orderType) {
        alert('Selecciona cómo deseas recibir tu compra.');
        return false;
      }

      if (orderType === 'Delivery' && !deliveryAddress.trim()) {
        alert('Escribe la dirección exacta del delivery.');
        return false;
      }

      if (
        orderType === 'Envío nacional' &&
        (!recipientName.trim() ||
          !recipientPhone.trim() ||
          !destinationState.trim() ||
          !destinationCity.trim() ||
          !deliveryAddress.trim() ||
          !shippingCompany)
      ) {
        alert('Completa todos los datos del destinatario y del envío nacional.');
        return false;
      }

      return true;
    }

    if (step === 3) {
      if (!paymentReference.trim()) {
        alert('Escribe la referencia del pago.');
        return false;
      }

      if (!paymentProof) {
        alert('Adjunta la imagen del comprobante de pago.');
        return false;
      }

      if (!paymentProof.type.startsWith('image/')) {
        alert('El comprobante debe ser una imagen.');
        return false;
      }

      if (paymentProof.size > 8 * 1024 * 1024) {
        alert('La imagen no puede superar los 8 MB.');
        return false;
      }

      return true;
    }

    return true;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    setStep((current) => Math.min(current + 1, 4));
  };

  const submitOrder = async () => {
    if (!validateStep() || isSubmitting) return;

    if (isLoadingExchangeRate) {
      alert('Espera a que se actualice la tasa de cambio.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Primero se carga el comprobante en ImgBB.
      const uploadData = new FormData();
      uploadData.append('image', paymentProof as File);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });

      const uploadResult = await uploadResponse.json();

      if (!uploadResponse.ok || !uploadResult?.success || !uploadResult?.url) {
        throw new Error(uploadResult?.error || 'No se pudo subir el comprobante.');
      }

      // Luego se registra el pedido con la URL del comprobante.
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerDocument: customerDocument.trim(),
          orderType,
          deliveryZone: orderType === 'Delivery' ? deliveryZone : '',
          deliveryAddress: deliveryAddress.trim(),
          items: cart,
          total: Number(totalPrice),
          totalBs: Number(totalBs),
          exchangeRate,
          paymentMethod,
          paymentReference: paymentReference.trim(),
          paymentProofUrl: uploadResult.url,
          shippingCompany: orderType === 'Envío nacional' ? shippingCompany : '',
          recipientName: orderType === 'Envío nacional' ? recipientName.trim() : customerName.trim(),
          recipientPhone: orderType === 'Envío nacional' ? recipientPhone.trim() : customerPhone.trim(),
          destinationState: orderType === 'Envío nacional' ? destinationState.trim() : '',
          destinationCity: orderType === 'Envío nacional' ? destinationCity.trim() : '',
          created_at: new Date().toISOString(),
        }),
      });

      const orderResult = await orderResponse.json();

      if (!orderResponse.ok || !orderResult?.success) {
        throw new Error(orderResult?.message || 'No se pudo registrar el pedido.');
      }

      let message = `🖥️ *NUEVO PEDIDO - ${BRAND}*\n\n`;
      message += `🧾 *Pedido:* #${orderResult.orderId}\n`;
      message += `👤 *Cliente:* ${customerName}\n`;
      message += `📞 *Teléfono:* ${customerPhone}\n`;
      message += `🚚 *Entrega:* ${orderType}\n`;

      if (orderType === 'Delivery') {
        message += `📍 *Zona:* ${deliveryZone}\n`;
        message += `🏠 *Dirección:* ${deliveryAddress}\n`;
      }

      if (orderType === 'Envío nacional') {
        message += `📦 *Empresa:* ${shippingCompany}\n`;
        message += `👤 *Destinatario:* ${recipientName}\n`;
        message += `📞 *Teléfono destinatario:* ${recipientPhone}\n`;
        message += `📍 *Destino:* ${destinationCity}, ${destinationState}\n`;
        message += `🏠 *Dirección:* ${deliveryAddress}\n`;
        message += `ℹ️ *Envío:* Cobro a destino\n`;
      }

      message += `💳 *Pago:* ${paymentMethod}\n`;
      message += `🔢 *Referencia:* ${paymentReference}\n`;
      message += `🧾 *Comprobante:* ${uploadResult.url}\n\n`;
      message += `-----------------------------\n`;

      cart.forEach((item) => {
        message += `• ${item.quantity} x ${item.name} - $${(item.price * item.quantity).toFixed(2)}\n`;
      });

      message += `-----------------------------\n`;
      message += `Subtotal: $${subtotalPrice.toFixed(2)}\n`;

      if (orderType === 'Delivery') {
        message += `Delivery: ${deliveryCost === 0 ? 'GRATIS' : `$${deliveryCost.toFixed(2)}`}\n`;
      }

      if (orderType === 'Retiro en tienda') {
        message += `Retiro en tienda: GRATIS\n`;
      }

      message += `*TOTAL: $${totalPrice}*\n`;
      message += `Total Bs.: ${totalBs}\n`;
      message += `Tasa BCV: ${exchangeRate.toFixed(2)}\n`;
      message += `\n_Estado: pendiente de verificación del pago._`;

      const whatsappUrl =
        `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;

      setCart([]);
      setIsCartOpen(false);
      setStep(1);
      setPaymentReference('');
      setPaymentProof(null);
      setOrderType('');
      setDeliveryAddress('');
      setRecipientName('');
      setRecipientPhone('');
      setDestinationState('');
      setDestinationCity('');
      setCustomerName('');
      setCustomerPhone('');
      setCustomerDocument('');

      alert(`¡Pedido #${orderResult.orderId} registrado! Está pendiente de verificación del pago.`);
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      alert(
        'No se pudo completar el pedido: ' +
          (error instanceof Error ? error.message : 'Error desconocido'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#F3F6FB] font-sans text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200 bg-white px-5 py-6 shadow-sm lg:flex">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-800 text-white shadow-lg">
            <span className="text-xl">⌘</span>
          </div>
          <div>
            <p className="text-xs font-black text-slate-950">WINNOVA</p>
            <p className="text-[10px] font-bold tracking-widest text-blue-600">ELECTRONIC</p>
          </div>
        </div>

        <p className="mb-3 mt-7 px-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
          Menú principal
        </p>

        <nav className="space-y-1">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="w-full rounded-xl bg-blue-50 px-3 py-3 text-left text-xs font-extrabold text-blue-700">
            ⌂ Inicio
          </button>
          <button onClick={() => document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })} className="w-full rounded-xl px-3 py-3 text-left text-xs font-bold text-slate-600 hover:bg-slate-50">
            ▦ Tienda
          </button>
          <button onClick={() => document.getElementById('categorias')?.scrollIntoView({ behavior: 'smooth' })} className="w-full rounded-xl px-3 py-3 text-left text-xs font-bold text-slate-600 hover:bg-slate-50">
            ◈ Categorías
          </button>
          <button onClick={() => setIsCartOpen(true)} className="w-full rounded-xl px-3 py-3 text-left text-xs font-bold text-slate-600 hover:bg-slate-50">
            🛒 Mi carrito ({totalItems})
          </button>
        </nav>

        <div className="mt-auto rounded-2xl bg-[#071A36] p-4 text-white">
          <p className="text-[9px] font-black uppercase tracking-widest text-cyan-300">Winnova Tech</p>
          <p className="mt-2 text-xs font-bold">Tecnología para conectar con lo que necesitas.</p>
          <Link href="/login" className="mt-4 inline-flex text-[10px] font-bold text-cyan-300">
            Acceso POS →
          </Link>
        </div>
      </aside>

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl lg:pl-64">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div>
            <p className="text-sm font-black text-slate-950 sm:text-base">
              WINNOVA <span className="text-blue-600">ELECTRONIC</span>
            </p>
            <p className="text-[10px] font-semibold text-slate-500">
              {isLoadingExchangeRate
                ? 'Actualizando tasa...'
                : `Tasa BCV: Bs. ${exchangeRate.toFixed(2)}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600 sm:block">
              🔐 Acceso POS
            </Link>
            <button onClick={() => setIsCartOpen(true)} className="rounded-xl bg-blue-600 px-4 py-3 text-xs font-extrabold text-white">
              🛒 Carrito ({totalItems})
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pb-36 pt-5 sm:px-6 lg:ml-64 lg:w-[calc(100%-16rem)] lg:max-w-none">
        <section className="relative isolate overflow-hidden rounded-[28px] bg-[#071A36] px-5 py-8 text-white shadow-xl sm:px-9 sm:py-10">
          <div className="absolute -right-20 -top-28 -z-10 h-80 w-80 rounded-full bg-blue-500/30 blur-3xl" />
          <div className="absolute -bottom-32 right-1/4 -z-10 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />

          <div className="max-w-2xl">
            <div className="mb-4 inline-flex rounded-full border border-blue-300/25 bg-blue-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-200">
              Tecnología para tu día a día
            </div>
            <h1 className="text-3xl font-black leading-tight sm:text-5xl">
              Conecta con lo que <span className="text-cyan-300">necesitas.</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-blue-100/75 sm:text-base">
              Explora nuestro catálogo, encuentra tus productos favoritos y compra de forma rápida y sencilla.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-[11px] font-semibold">
              <span className="rounded-xl border border-white/10 bg-white/10 px-3 py-2">✓ Compra fácil</span>
              <span className="rounded-xl border border-white/10 bg-white/10 px-3 py-2">✓ Atención personalizada</span>
              <span className="rounded-xl border border-white/10 bg-white/10 px-3 py-2">✓ Precios en USD y Bs</span>
            </div>
          </div>

          <div className="mt-7 max-w-xl">
            <input
              type="text"
              placeholder="Buscar productos, marcas o categorías..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-white/15 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>
        </section>

        <section id="categorias" className="sticky top-[72px] z-30 -mx-4 mt-5 border-b border-slate-200 bg-[#F3F6FB]/95 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
          <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
            <button onClick={() => setSelectedCategory('Todos')} className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-extrabold ${selectedCategory === 'Todos' ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>
              Todos los productos
            </button>
            {initialCategories.map((cat, idx) => (
              <button key={`${cat.category}-${idx}`} onClick={() => setSelectedCategory(cat.category)} className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-extrabold ${selectedCategory === cat.category ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>
                {cat.category}
              </button>
            ))}
          </div>
        </section>

        <section id="catalogo" className="pt-7">
          <div className="mb-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Catálogo Winnova</p>
            <h2 className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">Explora nuestros productos</h2>
          </div>

          {filteredCategories.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-5 py-20 text-center">
              <p className="font-bold text-slate-800">No encontramos productos</p>
              <button onClick={() => { setSearchQuery(''); setSelectedCategory('Todos'); }} className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white">
                Ver catálogo
              </button>
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
                      <article key={product.id} className="group flex min-w-0 flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                        <div className="relative h-52 overflow-hidden bg-gradient-to-br from-slate-100 to-blue-50 sm:h-56">
                          {validImage ? (
                            <img src={imageUrl} alt={product.name} loading="lazy" className="h-full w-full object-contain p-3 transition duration-300" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-5xl text-blue-300">⌁</div>
                          )}
                          <span className="absolute left-3 top-3 rounded-lg bg-white/90 px-2.5 py-1 text-[9px] font-black uppercase text-blue-700">Disponible</span>
                          <span className="absolute bottom-3 right-3 rounded-xl bg-[#071A36]/95 px-3 py-2 text-sm font-black text-white">
                            ${Number(product.price || 0).toFixed(2)}
                          </span>
                        </div>

                        <div className="flex flex-1 flex-col p-4">
                          <h4 className="line-clamp-2 min-h-10 text-sm font-extrabold text-slate-900">{product.name}</h4>
                          <p className="mt-1 line-clamp-2 min-h-9 text-xs text-slate-500">
                            {product.description || 'Producto disponible en nuestro catálogo.'}
                          </p>
                          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                            <span className="text-[10px] font-semibold text-slate-400">Precio en USD</span>
                            {qty === 0 ? (
                              <button onClick={() => addToCart(product)} className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-extrabold text-white">
                                + Agregar
                              </button>
                            ) : (
                              <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-1">
                                <button onClick={() => updateQuantity(product.id, -1)} className="h-7 w-7 rounded-lg bg-white font-black text-blue-700">−</button>
                                <span className="w-4 text-center text-xs font-black text-blue-800">{qty}</span>
                                <button onClick={() => updateQuantity(product.id, 1)} className="h-7 w-7 rounded-lg bg-blue-600 font-black text-white">+</button>
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

      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur-xl sm:p-4">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400">Productos: {totalItems}</p>
              <p className="text-base font-black text-slate-950">
                ${totalItems > 0 ? subtotalPrice.toFixed(2) : '0.00'}
              </p>
            </div>
            <button onClick={() => { setStep(1); setIsCartOpen(true); }} className="rounded-xl bg-blue-600 px-5 py-3 text-xs font-extrabold text-white">
              Ver carrito →
            </button>
          </div>
        </div>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setIsCartOpen(false); }}>
          <aside className="flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur-xl">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Winnova Electronic</p>
                <h2 className="text-lg font-black text-slate-950">Finalizar compra</h2>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="h-9 w-9 rounded-xl bg-slate-100 text-slate-600">✕</button>
            </div>

            <div className="border-b border-slate-100 px-5 py-4">
              <div className="grid grid-cols-4 gap-2 text-center">
                {['Contacto', 'Entrega', 'Pago', 'Confirmar'].map((label, index) => (
                  <div key={label}>
                    <div className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${step >= index + 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {index + 1}
                    </div>
                    <p className={`mt-1 text-[9px] font-bold ${step === index + 1 ? 'text-blue-700' : 'text-slate-400'}`}>{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 space-y-5 p-5">
              <section className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase text-slate-700">Tu carrito</h3>
                  <span className="text-[10px] font-bold text-slate-400">{totalItems} unidades</span>
                </div>
                {cart.length === 0 ? (
                  <p className="py-5 text-center text-xs text-slate-500">Tu carrito está vacío.</p>
                ) : (
                  <div className="space-y-2">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-2 text-xs">
                        <span className="min-w-0 flex-1 font-semibold text-slate-700">{item.quantity} × {item.name}</span>
                        <span className="font-bold text-slate-900">${(item.price * item.quantity).toFixed(2)}</span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateQuantity(item.id, -1)} className="h-6 w-6 rounded bg-white font-black">−</button>
                          <button onClick={() => updateQuantity(item.id, 1)} className="h-6 w-6 rounded bg-blue-600 font-black text-white">+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {step === 1 && (
                <section className="space-y-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">¿Quién realiza la compra?</h3>
                    <p className="mt-1 text-xs text-slate-500">Indícanos tus datos para registrar el pedido.</p>
                  </div>
                  <label className="block space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Nombre y apellido</span>
                    <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Tu nombre completo" className={inputClass} />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Teléfono</span>
                    <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="0412-0000000" className={inputClass} />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Cédula o RIF (opcional)</span>
                    <input value={customerDocument} onChange={(e) => setCustomerDocument(e.target.value)} placeholder="Documento de identidad" className={inputClass} />
                  </label>
                </section>
              )}

              {step === 2 && (
                <section className="space-y-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">¿Cómo recibirás tu compra?</h3>
                    <p className="mt-1 text-xs text-slate-500">Selecciona una modalidad de entrega.</p>
                  </div>

                  {([
                    ['Delivery', '🛵', 'Delivery en Guarenas o Guatire'],
                    ['Retiro en tienda', '🏬', 'Retirar personalmente en tienda'],
                    ['Envío nacional', '📦', 'Envío nacional por agencia'],
                  ] as [OrderType, string, string][]).map(([value, icon, label]) => (
                    <button key={value} onClick={() => setOrderType(value)} className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left ${orderType === value ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/10' : 'border-slate-200 bg-white'}`}>
                      <span className="text-2xl">{icon}</span>
                      <span className="flex-1">
                        <span className="block text-xs font-black text-slate-900">{label}</span>
                        <span className="mt-1 block text-[10px] font-semibold text-slate-500">
                          {value === 'Delivery' ? 'Guarenas GRATIS · Guatire $2.00' : value === 'Retiro en tienda' ? 'Sin costo adicional' : 'Zoom o MRW · cobro a destino'}
                        </span>
                      </span>
                      <span className={`h-5 w-5 rounded-full border-2 ${orderType === value ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`} />
                    </button>
                  ))}

                  {orderType === 'Delivery' && (
                    <div className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-3">
                      <label className="block space-y-1.5">
                        <span className="text-[10px] font-bold uppercase text-slate-500">Zona de delivery</span>
                        <select value={deliveryZone} onChange={(e) => setDeliveryZone(e.target.value)} className={selectClass}>
                          <option value="Guarenas">Guarenas — GRATIS</option>
                          <option value="Guatire">Guatire — $2.00</option>
                        </select>
                      </label>
                      <label className="block space-y-1.5">
                        <span className="text-[10px] font-bold uppercase text-slate-500">Dirección exacta</span>
                        <textarea value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="Urbanización, calle, casa, edificio y referencia..." className={inputClass} rows={3} />
                      </label>
                    </div>
                  )}

                  {orderType === 'Envío nacional' && (
                    <div className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-3">
                      <div className="rounded-xl bg-white p-3 text-xs font-semibold text-blue-800">
                        El costo del envío se paga al recibir el paquete directamente a la empresa de transporte. No se suma a tu compra.
                      </div>
                      <label className="block space-y-1.5">
                        <span className="text-[10px] font-bold uppercase text-slate-500">Empresa de envío</span>
                        <select value={shippingCompany} onChange={(e) => setShippingCompany(e.target.value)} className={selectClass}>
                          <option value="Zoom">Zoom</option>
                          <option value="MRW">MRW</option>
                        </select>
                      </label>
                      <label className="block space-y-1.5">
                        <span className="text-[10px] font-bold uppercase text-slate-500">Nombre del destinatario</span>
                        <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Nombre y apellido" className={inputClass} />
                      </label>
                      <label className="block space-y-1.5">
                        <span className="text-[10px] font-bold uppercase text-slate-500">Teléfono del destinatario</span>
                        <input value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} placeholder="Teléfono de contacto" className={inputClass} />
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="space-y-1.5">
                          <span className="text-[10px] font-bold uppercase text-slate-500">Estado</span>
                          <input value={destinationState} onChange={(e) => setDestinationState(e.target.value)} placeholder="Estado" className={inputClass} />
                        </label>
                        <label className="space-y-1.5">
                          <span className="text-[10px] font-bold uppercase text-slate-500">Ciudad</span>
                          <input value={destinationCity} onChange={(e) => setDestinationCity(e.target.value)} placeholder="Ciudad" className={inputClass} />
                        </label>
                      </div>
                      <label className="block space-y-1.5">
                        <span className="text-[10px] font-bold uppercase text-slate-500">Dirección o agencia de destino</span>
                        <textarea value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="Dirección completa o agencia donde recibirá..." className={inputClass} rows={3} />
                      </label>
                    </div>
                  )}
                </section>
              )}

              {step === 3 && (
                <section className="space-y-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Realiza tu pago</h3>
                    <p className="mt-1 text-xs text-slate-500">Selecciona el método y utiliza los datos indicados.</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {(['Pago Móvil', 'Binance', 'PayPal'] as PaymentMethod[]).map((method) => (
                      <button key={method} onClick={() => setPaymentMethod(method)} className={`rounded-xl border px-2 py-3 text-[10px] font-black ${paymentMethod === method ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600'}`}>
                        {method}
                      </button>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                    <p className="text-xs font-black text-blue-900">{PAYMENT_DETAILS[paymentMethod].title}</p>
                    <div className="mt-3 space-y-3">
                      {PAYMENT_DETAILS[paymentMethod].details.map((detail) => {
                        const value = detail.includes(':') ? detail.split(':').slice(1).join(':').trim() : detail;
                        return (
                          <div key={detail} className="flex items-center justify-between gap-2 rounded-xl bg-white p-2.5">
                            <span className="text-[11px] font-semibold text-slate-700">{detail}</span>
                            <button onClick={() => copyText(value)} className="shrink-0 rounded-lg bg-blue-600 px-2.5 py-1.5 text-[9px] font-black text-white">
                              Copiar
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-black text-slate-800">Monto a pagar</p>
                    <p className="mt-1 text-2xl font-black text-blue-700">${totalPrice}</p>
                    <p className="text-xs font-bold text-slate-500">Bs. {totalBs}</p>
                    <p className="mt-2 text-[10px] text-slate-500">Tasa BCV: {exchangeRate.toFixed(2)}</p>
                  </div>

                  <label className="block space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Referencia o número de operación</span>
                    <input value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder="Número de referencia del pago" className={inputClass} />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Comprobante de pago</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPaymentProof(e.target.files?.[0] || null)}
                      className="block w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
                    />
                    <span className="block text-[10px] text-slate-400">Formatos de imagen. Tamaño máximo: 8 MB.</span>
                    {paymentProof && (
                      <span className="block text-xs font-bold text-emerald-700">
                        ✓ {paymentProof.name}
                      </span>
                    )}
                  </label>
                </section>
              )}

              {step === 4 && (
                <section className="space-y-4">
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <p className="text-sm font-black text-emerald-800">Revisa tu pedido</p>
                    <p className="mt-1 text-xs text-emerald-700">Al confirmar, enviaremos tu pedido para verificación del pago.</p>
                  </div>

                  <div className="space-y-2 rounded-2xl border border-slate-200 p-4 text-xs">
                    <div className="flex justify-between gap-3"><span className="text-slate-500">Cliente</span><strong>{customerName}</strong></div>
                    <div className="flex justify-between gap-3"><span className="text-slate-500">Teléfono</span><strong>{customerPhone}</strong></div>
                    <div className="flex justify-between gap-3"><span className="text-slate-500">Entrega</span><strong>{orderType}</strong></div>
                    {orderType === 'Delivery' && <div className="flex justify-between gap-3"><span className="text-slate-500">Zona</span><strong>{deliveryZone}</strong></div>}
                    {orderType === 'Envío nacional' && <div className="flex justify-between gap-3"><span className="text-slate-500">Agencia</span><strong>{shippingCompany}</strong></div>}
                    <div className="flex justify-between gap-3"><span className="text-slate-500">Método de pago</span><strong>{paymentMethod}</strong></div>
                    <div className="flex justify-between gap-3"><span className="text-slate-500">Referencia</span><strong>{paymentReference}</strong></div>
                    <div className="my-2 h-px bg-slate-200" />
                    <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><strong>${subtotalPrice.toFixed(2)}</strong></div>
                    {orderType === 'Delivery' && <div className="flex justify-between"><span className="text-slate-500">Delivery</span><strong>{deliveryCost === 0 ? 'GRATIS' : `$${deliveryCost.toFixed(2)}`}</strong></div>}
                    {orderType === 'Envío nacional' && <div className="flex justify-between"><span className="text-slate-500">Envío</span><strong>Cobro a destino</strong></div>}
                    <div className="flex justify-between pt-2 text-sm font-black"><span>Total USD</span><span>${totalPrice}</span></div>
                    <div className="flex justify-between font-black text-blue-700"><span>Total Bs.</span><span>{totalBs}</span></div>
                  </div>

                  <p className="text-[10px] leading-relaxed text-slate-500">
                    Al confirmar aceptas que el pedido quede pendiente hasta que WINNOVA ELECTRONIC verifique el pago y confirme la disponibilidad.
                  </p>
                </section>
              )}
            </div>

            <div className="sticky bottom-0 border-t border-slate-100 bg-white p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Total de la compra</span>
                <span className="text-lg font-black text-slate-950">${totalPrice}</span>
              </div>

              <div className="flex gap-2">
                {step > 1 && (
                  <button onClick={() => setStep((current) => current - 1)} disabled={isSubmitting} className="flex-1 rounded-xl border border-slate-200 px-3 py-3 text-xs font-black text-slate-600 disabled:opacity-50">
                    ← Atrás
                  </button>
                )}

                {step < 4 ? (
                  <button onClick={nextStep} disabled={cart.length === 0} className="flex-1 rounded-xl bg-blue-600 px-3 py-3 text-xs font-black text-white disabled:opacity-50">
                    Continuar →
                  </button>
                ) : (
                  <button onClick={submitOrder} disabled={isSubmitting || isLoadingExchangeRate} className="flex-1 rounded-xl bg-emerald-600 px-3 py-3 text-xs font-black text-white disabled:opacity-50">
                    {isSubmitting ? 'Registrando pedido...' : 'Confirmar pedido ✓'}
                  </button>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}

      <footer className="w-full border-t border-slate-200 bg-white px-4 py-7 text-center lg:ml-64 lg:w-[calc(100%-16rem)]">
        <p className="text-xs font-black text-slate-800">WINNOVA <span className="text-blue-600">ELECTRONIC</span></p>
        <p className="mt-1 text-[10px] text-slate-400">Tecnología, confianza y atención para ti.</p>
        <Link href="/login" className="mt-2 inline-block text-[10px] font-bold text-blue-600">Acceso al sistema POS</Link>
      </footer>
    </div>
  );
}
