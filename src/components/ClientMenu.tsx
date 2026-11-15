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

      <footer className="box-border border-t border-slate-200 bg-white px-4 py-7 text-center lg:ml-64 lg:w-[calc(100%-16rem)]">
        <p className="text-xs font-black text-slate-800">WINNOVA <span className="text-blue-600">ELECTRONIC</span></p>
        <p className="mt-1 text-[10px] text-slate-400">Tecnología, confianza y atención para ti.</p>
        <Link href="/login" className="mt-2 inline-block text-[10px] font-bold text-blue-600">Acceso al sistema POS</Link>
      </footer>
    </div>
  );
}
