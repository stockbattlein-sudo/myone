import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { MarketDataService } from './market-data.service';
import { Subscription } from 'rxjs';

@WebSocketGateway({
  cors: {
    origin: '*', // Allow connections from Next.js dev server
  },
  namespace: 'ticks',
})
export class MarketDataGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(MarketDataGateway.name);
  private tickSubscription!: Subscription;

  constructor(private readonly marketDataService: MarketDataService) {}

  afterInit(server: Server) {
    this.logger.log('📡 WebSockets Ticker Gateway Initialized');
    
    // Subscribe to price tick events and broadcast them to all client sockets
    this.tickSubscription = this.marketDataService.getTickStream().subscribe((tick) => {
      this.server.emit('price-tick', tick);
    });
  }

  handleConnection(client: Socket) {
    this.logger.log(`🔌 Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`🔌 Client disconnected: ${client.id}`);
  }

  onModuleDestroy() {
    if (this.tickSubscription) {
      this.tickSubscription.unsubscribe();
    }
  }
}
