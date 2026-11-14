
import { NextResponse } from 'next/server';
import { runQuery } from '@/db/client';

async function sql(db: any, query: string, params: any[] = []) {
  return params.length > 0
    ? await db.sql(query, ...params)
    : await db.sql(query);
}

function extractRows(result: any): any[] {
  if (Array.isArray(result)) return result;
  if (result?.rows && Array.isArray(result.rows)) return result.rows;
  return [];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      customerName,
      customerPhone,
      customerDocument,
      orderType,
      deliveryZone,
      deliveryAddress,
      items,
      total,
      totalBs,
      exchangeRate,
      paymentMethod,
      paymentReference,
      paymentProofUrl,
      shippingCompany,
      recipientName,
      recipientPhone,
      destinationState,
      destinationCity,
      created_at,
    } = body;

    const name = String(customerName ?? '').trim();
    const phone = String(customerPhone ?? '').trim();
    const document = String(customerDocument ?? '').trim();
    const reference = String(paymentReference ?? '').trim();
    const proofUrl = String(paymentProofUrl ?? '').trim();
    const address = String(deliveryAddress ?? '').trim();
    const recipient = String(recipientName ?? name).trim();
    const recipientTel = String(recipientPhone ?? phone).trim();
    const state = String(destinationState ?? '').trim();
    const city = String(destinationCity ?? '').trim();
    const company = String(shippingCompany ?? '').trim();

    const allowedOrderTypes = [
      'Delivery',
      'Retiro en tienda',
      'Envío nacional',
    ];

    const allowedPayments = [
      'Pago Móvil',
      'Binance',
      'PayPal',
    ];

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, message: 'El nombre y teléfono del cliente son obligatorios.' },
        { status: 400 }
      );
    }

    if (!allowedOrderTypes.includes(String(orderType))) {
      return NextResponse.json(
        { success: false, message: 'Selecciona una modalidad de entrega válida.' },
        { status: 400 }
      );
    }

    if (!allowedPayments.includes(String(paymentMethod))) {
      return NextResponse.json(
        { success: false, message: 'Selecciona un método de pago válido.' },
        { status: 400 }
      );
    }

    if (!reference || !proofUrl) {
      return NextResponse.json(
        { success: false, message: 'Debes indicar la referencia y adjuntar el comprobante de pago.' },
        { status: 400 }
      );
    }

    if (orderType === 'Delivery') {
      if (!['Guarenas', 'Guatire'].includes(String(deliveryZone))) {
        return NextResponse.json(
          { success: false, message: 'La zona de delivery no es válida.' },
          { status: 400 }
        );
      }

      if (!address) {
        return NextResponse.json(
          { success: false, message: 'Debes indicar la dirección exacta del delivery.' },
          { status: 400 }
        );
      }
    }

    if (orderType === 'Envío nacional') {
      if (!['Zoom', 'MRW'].includes(company) || !state || !city || !address) {
        return NextResponse.json(
          { success: false, message: 'Completa la empresa de envío, estado, ciudad y dirección de destino.' },
          { status: 400 }
        );
      }
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'El pedido debe contener al menos un producto.' },
        { status: 400 }
      );
    }

    const normalizedItems = items.map((item: any) => ({
      product_id: Number(item.id ?? item.product_id),
      quantity: Number(item.quantity),
      price: Number(item.price),
    }));

    const invalidItem = normalizedItems.find(
      (item) =>
        !Number.isInteger(item.product_id) ||
        item.product_id <= 0 ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0 ||
        !Number.isFinite(item.price) ||
        item.price < 0
    );

    if (invalidItem) {
      return NextResponse.json(
        { success: false, message: 'Uno o más productos del pedido no son válidos.' },
        { status: 400 }
      );
    }

    const subtotal = normalizedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const deliveryCost =
      orderType === 'Delivery' && deliveryZone === 'Guatire' ? 2 : 0;

    const expectedTotal = Number((subtotal + deliveryCost).toFixed(2));
    const receivedTotal = Number(total);
    const rate = Number(exchangeRate);
    const receivedBs = Number(totalBs);

    if (
      !Number.isFinite(receivedTotal) ||
      !Number.isFinite(rate) ||
      rate <= 0 ||
      !Number.isFinite(receivedBs)
    ) {
      return NextResponse.json(
        { success: false, message: 'Los totales o la tasa de cambio no son válidos.' },
        { status: 400 }
      );
    }

    if (Math.abs(receivedTotal - expectedTotal) > 0.02) {
      return NextResponse.json(
        { success: false, message: 'El total enviado no coincide con los productos y el delivery.' },
        { status: 400 }
      );
    }

    if (Math.abs(receivedBs - Number((expectedTotal * rate).toFixed(2))) > 1) {
      return NextResponse.json(
        { success: false, message: 'El total en bolívares no coincide con la tasa indicada.' },
        { status: 400 }
      );
    }

    const result = await runQuery(async (db) => {
      let customerId: number | null = null;

      if (phone) {
        const rows = extractRows(
          await sql(db, 'SELECT id FROM customers WHERE phone = ? LIMIT 1', [phone])
        );
        if (rows.length) customerId = Number(rows[0].id);
      }

      if (!customerId && document) {
        const rows = extractRows(
          await sql(db, 'SELECT id FROM customers WHERE rif_ci = ? LIMIT 1', [document])
        );
        if (rows.length) customerId = Number(rows[0].id);
      }

      if (!customerId) {
        const rows = extractRows(
          await sql(db, 'SELECT id FROM customers WHERE name = ? LIMIT 1', [name])
        );
        if (rows.length) customerId = Number(rows[0].id);
      }

      if (!customerId) {
        const rows = extractRows(
          await sql(
            db,
            `INSERT INTO customers (name, rif_ci, phone)
             VALUES (?, ?, ?) RETURNING id`,
            [name, document || null, phone]
          )
        );

        if (!rows.length) throw new Error('No se pudo registrar el cliente.');
        customerId = Number(rows[0].id);
      }

      const saleRows = extractRows(
        await sql(
          db,
          `INSERT INTO sales (
            customer_id,
            total_usd,
            payment_method,
            created_at,
            cash_register_id,
            total_ves,
            exchange_rate,
            status,
            source,
            order_type,
            delivery_zone,
            delivery_address,
            payment_reference,
            payment_proof_url,
            shipping_company,
            recipient_name,
            recipient_phone,
            destination_state,
            destination_city
          ) VALUES (?, ?, ?, ?, NULL, ?, ?, 'pendiente', 'web', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          RETURNING id`,
          [
            customerId,
            expectedTotal,
            String(paymentMethod),
            created_at ? String(created_at) : new Date().toISOString(),
            Number((expectedTotal * rate).toFixed(2)),
            rate,
            String(orderType),
            orderType === 'Delivery' ? String(deliveryZone) : '',
            address || null,
            reference,
            proofUrl,
            orderType === 'Envío nacional' ? company : null,
            recipient,
            recipientTel,
            orderType === 'Envío nacional' ? state : null,
            orderType === 'Envío nacional' ? city : null,
          ]
        )
      );

      if (!saleRows.length) throw new Error('No se pudo registrar el pedido.');

      const saleId = Number(saleRows[0].id);

      for (const item of normalizedItems) {
        await sql(
          db,
          `INSERT INTO sale_items (
            sale_id,
            product_id,
            quantity,
            price_at_sale
          ) VALUES (?, ?, ?, ?)`,
          [saleId, item.product_id, item.quantity, item.price]
        );
      }

      return { saleId, customerId };
    });

    return NextResponse.json({
      success: true,
      orderId: result.saleId,
      saleId: result.saleId,
      customerId: result.customerId,
      status: 'pendiente',
      message: 'Pedido recibido. Está pendiente de verificación del pago.',
    });
  } catch (error) {
    console.error('POST /api/orders error:', error);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error
          ? error.message
          : 'Error interno al procesar el pedido.',
      },
      { status: 500 }
    );
  }
}
