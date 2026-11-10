import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  handleConnection(client: Socket) {
    this.logger.debug(`Cliente Socket conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Cliente Socket desconectado: ${client.id}`);
  }

  @SubscribeMessage('unirse_sala')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { sala: string },
  ) {
    if (payload?.sala) {
      client.join(payload.sala);
    }
    return { ok: true, sala: payload?.sala };
  }

  emitirNuevoMensaje(mensaje: any): void {
    if (!this.server) return;
    this.server.emit('mensaje:nuevo', mensaje);
  }

  emitirSolicitudAfiliacion(payload: {
    tipo: 'TIENDA' | 'REPARTIDOR';
    id: string;
    nombre: string;
    detalle?: string;
    creado_en?: Date | string;
  }): void {
    if (!this.server) return;
    this.server.emit('solicitud:afiliacion', {
      ...payload,
      creado_en: payload.creado_en || new Date().toISOString(),
    });
  }

  emitirSolicitudActualizada(payload: {
    tipo: 'TIENDA' | 'REPARTIDOR';
    id: string;
    estado: string;
  }): void {
    if (!this.server) return;
    this.server.emit('solicitud:actualizada', payload);
  }

  emitirPedidoActualizado(pedido: any, accion: string): void {
    if (!this.server) return;
    this.server.emit('pedido:actualizado', {
      pedido,
      accion,
      timestamp: new Date().toISOString(),
    });
  }
}

