                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Dirección Exacta:
                      </label>

                      <input
                        type="text"
                        placeholder="Ej. Urb. Trapichito, Calle 3..."
                        value={deliveryAddress}
                        onChange={(e) =>
                          setDeliveryAddress(e.target.value)
                        }
                        className="w-full bg-[#111B17] border border-[#243A32] rounded-xl px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>
                )}

                {/* MÉTODO DE PAGO */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Método de Pago:
                  </label>

                  <select
                    value={paymentMethod}
                    onChange={(e) =>
                      setPaymentMethod(e.target.value)
                    }
                    className="w-full bg-[#080D0C] border border-[#243A32] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#007F66]"
                  >
                    <option value="Pago Móvil (Bs)">
                      📱 Pago Móvil (Bolívares)
                    </option>

                    <option value="Efectivo / Divisas">
                      💵 Efectivo Divisas ($)
                    </option>

                    <option value="Zelle / Binance">
                      🌐 Zelle / Binance
                    </option>
                  </select>
                </div>

                {/* DESGLOSE FINANCIERO */}
                <div className="bg-[#080D0C] p-3.5 rounded-2xl border border-[#243A32] space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal Productos:</span>
                    <span>${subtotalPrice.toFixed(2)}</span>
                  </div>

                  {orderType === 'Delivery' && (
                    <div className="flex justify-between text-slate-400">
                      <span>
                        Envío Delivery ({deliveryZone}):
                      </span>

                      <span>${deliveryCost.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-black text-sm text-emerald-300 pt-2 border-t border-[#243A32]">
                    <span>Total USD:</span>
                    <span>${totalPrice}</span>
                  </div>

                  <div className="flex justify-between font-bold text-slate-300">
                    <span>
                      Total Bolívares (Tasa {exchangeRate.toFixed(2)}):
                    </span>

                    <span>Bs. {totalBs}</span>
                  </div>
                </div>

                {/* CONFIRMAR PEDIDO */}
                <button
                  onClick={checkoutWhatsApp}
                  disabled={
                    isSubmitting ||
                    isLoadingExchangeRate ||
                    !orderType
                  }
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-2xl font-extrabold text-xs sm:text-sm shadow-xl shadow-emerald-600/30 transition flex items-center justify-center gap-2"
                >
                  {isSubmitting
                    ? 'Procesando...'
                    : isLoadingExchangeRate
                    ? 'Actualizando tasa...'
                    : !orderType
                    ? 'Selecciona cómo recibir tu pedido'
                    : '🟢 Confirmar y Enviar Pedido'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 bg-[#080D0C]">
        <p>Tech Store • Guarenas y Guatire.</p>
      </footer>
    </div>
  );
}
