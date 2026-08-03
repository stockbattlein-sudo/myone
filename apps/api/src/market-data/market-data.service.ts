import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';

export interface Tick {
  symbol: string;
  priceInPaise: number;
  timestamp: number;
}

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);
  
  // Simulated stock baseline prices in paise
  private prices: Record<string, number> = {
    RELIANCE: 245000, // ₹2,450.00
    TCS: 342000,      // ₹3,420.00
    HDFCBANK: 161000, // ₹1,610.00
    INFY: 145000,     // ₹1,450.00
    ICICIBANK: 95000, // ₹950.00
  };

  private readonly tickSubject = new Subject<Tick>();
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.startSimulation();
  }

  /**
   * Returns an Observable stream of market tick updates
   */
  getTickStream(): Observable<Tick> {
    return this.tickSubject.asObservable();
  }

  /**
   * Retrieves the current price of a symbol in paise
   */
  getCurrentPrice(symbol: string): number {
    return this.prices[symbol.toUpperCase()] || 10000; // default ₹100.00
  }

  /**
   * Starts a background synthetic market generator simulating random walks
   */
  private startSimulation() {
    this.logger.log('📈 Starting simulated Indian market price tick stream...');
    
    this.intervalId = setInterval(() => {
      const symbols = Object.keys(this.prices);
      
      symbols.forEach((symbol) => {
        const currentPrice = this.prices[symbol];
        
        // Random walk: Brownian motion style fluctuation (-0.15% to +0.15%)
        const percentChange = (Math.random() - 0.5) * 0.003;
        const delta = Math.round(currentPrice * percentChange);
        
        // Apply change and ensure price stays positive
        const newPrice = Math.max(100, currentPrice + delta);
        this.prices[symbol] = newPrice;

        this.tickSubject.next({
          symbol,
          priceInPaise: newPrice,
          timestamp: Date.now(),
        });
      });
    }, 1000); // 1-second ticks
  }

  onModuleDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
