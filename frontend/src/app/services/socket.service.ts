import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { Mensaje, Pedido } from '../models';

export interface EventoSolicitudAfiliacion {
  tipo: 'TIENDA' | 'REPARTIDOR';
  id: string;
  nombre: string;
  detalle?: string;
  creado_en?: string;
}

export interface EventoSolicitudActualizada {
  tipo: 'TIENDA' | 'REPARTIDOR';
  id: string;
  estado: string;
}

export interface EventoPedidoActualizado {
  pedido: Pedido;
  accion: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket | null = null;
  readonly conectado = signal<boolean>(false);

  private readonly nuevoMensajeSubject = new Subject<Mensaje>();
  private readonly solicitudAfiliacionSubject = new Subject<EventoSolicitudAfiliacion>();
  private readonly solicitudActualizadaSubject = new Subject<EventoSolicitudActualizada>();
  private readonly pedidoActualizadoSubject = new Subject<EventoPedidoActualizado>();

  readonly nuevoMensaje$ = this.nuevoMensajeSubject.asObservable();
  readonly solicitudAfiliacion$ = this.solicitudAfiliacionSubject.asObservable();
  readonly solicitudActualizada$ = this.solicitudActualizadaSubject.asObservable();
  readonly pedidoActualizado$ = this.pedidoActualizadoSubject.asObservable();

  constructor() {
    this.conectar();
  }

  conectar(): void {
    if (this.socket) return;

    const baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
    this.socket = io(baseUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1500,
    });

    this.socket.on('connect', () => {
      this.conectado.set(true);
    });

    this.socket.on('disconnect', () => {
      this.conectado.set(false);
    });

    this.socket.on('mensaje:nuevo', (mensaje: Mensaje) => {
      this.nuevoMensajeSubject.next(mensaje);
    });

    this.socket.on('solicitud:afiliacion', (payload: EventoSolicitudAfiliacion) => {
      this.solicitudAfiliacionSubject.next(payload);
    });

    this.socket.on('solicitud:actualizada', (payload: EventoSolicitudActualizada) => {
      this.solicitudActualizadaSubject.next(payload);
    });

    this.socket.on('pedido:actualizado', (payload: EventoPedidoActualizado) => {
      this.pedidoActualizadoSubject.next(payload);
    });
  }
}

