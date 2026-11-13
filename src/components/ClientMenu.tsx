
'use client';

import { useEffect, useState, useMemo } from 'react';
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

export default function ClientMenu({
  initialCategories,
}: {
  initialCategories: MenuCategory[];
}) {
  const [cart, setCart] = useState<
    {
      id: number;
      name: string;
      price: number;
      quantity: number;
    }[]
  >([]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  // El cliente debe seleccionar obligatoriamente la modalidad.
  const [orderType, setOrderType] = useState('');
  const [deliveryZone, setDeliveryZone] = useState('Guarenas');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Pago Móvil (Bs)');

  // Tasa de cambio BCV
  const [exchangeRate, setExchangeRate] = useState(778.33);
  const [isLoadingExchangeRate, setIsLoadingExchangeRate] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ============================================================
  // CARGAR TASA BCV
  // ============================================================
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

        if (
          isMounted &&
          response.ok &&
          data?.success &&
          Number(data.rate) > 0
        ) {
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

  // ============================================================
  // FILTRADO DE PRODUCTOS
  // ============================================================
  const filteredCategories = useMemo(() => {
