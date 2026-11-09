export interface TipoCambio {
  id: number;
  moneda_origen: 'USD' | 'BOB';
  moneda_destino: 'BOB' | 'USD';
  tasa_cambio: number;
  fuente: string;
  actualizado_en?: string;
}
