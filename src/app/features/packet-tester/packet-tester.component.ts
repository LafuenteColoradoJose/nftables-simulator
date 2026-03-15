import { Component, signal, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NETWORK_HOSTS, ROUTER_CONFIG } from '../../core/data/topology.data';

export interface PacketConfig {
  source: string;
  destination: string;
  protocol: 'tcp' | 'udp' | 'icmp';
  destPort: number;
  connState: 'new' | 'established' | 'related';
}

@Component({
  selector: 'app-packet-tester',
  imports: [FormsModule],
  template: `
    <section class="flex flex-col h-full" aria-label="Configuración del paquete de prueba">
      <!-- Header -->
      <header class="flex items-center gap-2 px-3 py-2 border-b border-border-default bg-bg-secondary/50">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-accent-cyan" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
        <h2 class="text-sm font-semibold text-text-primary">Test de Paquetes</h2>
      </header>

      <!-- Form -->
      <div class="flex-1 overflow-y-auto p-3 space-y-3">
        <!-- Origen -->
        <div>
          <label for="pkt-source" class="block text-[11px] text-text-muted font-medium mb-1 uppercase tracking-wider">
            Origen
          </label>
          <select
            id="pkt-source"
            [ngModel]="source()"
            (ngModelChange)="source.set($event)"
            class="w-full px-2.5 py-1.5 rounded-lg bg-bg-primary border border-border-default
                   text-sm text-text-primary font-mono outline-none
                   focus:border-accent-cyan transition-colors"
          >
            <option value="internet">🌐 Internet (externo)</option>
            @for (host of hosts; track host.id) {
              <option [value]="host.id">{{ host.icon === 'server' ? '🖥️' : host.icon === 'desktop' ? '🖥️' : '💻' }} {{ host.name }} ({{ host.ip }})</option>
            }
          </select>
        </div>

        <!-- Destino -->
        <div>
          <label for="pkt-destination" class="block text-[11px] text-text-muted font-medium mb-1 uppercase tracking-wider">
            Destino
          </label>
          <select
            id="pkt-destination"
            [ngModel]="destination()"
            (ngModelChange)="destination.set($event)"
            class="w-full px-2.5 py-1.5 rounded-lg bg-bg-primary border border-border-default
                   text-sm text-text-primary font-mono outline-none
                   focus:border-accent-cyan transition-colors"
          >
            @for (host of hosts; track host.id) {
              <option [value]="host.id">{{ host.icon === 'server' ? '🖥️' : host.icon === 'desktop' ? '🖥️' : '💻' }} {{ host.name }} ({{ host.ip }})</option>
            }
            <option value="internet">🌐 Internet (externo)</option>
          </select>
        </div>

        <!-- Protocolo -->
        <div>
          <label for="pkt-protocol" class="block text-[11px] text-text-muted font-medium mb-1 uppercase tracking-wider">
            Protocolo
          </label>
          <div class="flex gap-1.5" role="radiogroup" aria-label="Protocolo del paquete">
            @for (proto of protocols; track proto) {
              <button
                type="button"
                (click)="protocol.set(proto)"
                [class]="protocol() === proto
                  ? 'flex-1 py-1.5 rounded-lg text-xs font-medium text-bg-primary bg-accent-cyan'
                  : 'flex-1 py-1.5 rounded-lg text-xs font-medium text-text-secondary bg-bg-primary border border-border-default hover:border-accent-cyan/50 transition-colors'"
                [attr.aria-pressed]="protocol() === proto"
                [attr.aria-label]="'Protocolo ' + proto.toUpperCase()"
              >
                {{ proto.toUpperCase() }}
              </button>
            }
          </div>
        </div>

        <!-- Puerto destino -->
        @if (protocol() !== 'icmp') {
          <div>
            <label for="pkt-port" class="block text-[11px] text-text-muted font-medium mb-1 uppercase tracking-wider">
              Puerto destino
            </label>
            <div class="flex gap-1.5 flex-wrap mb-1.5">
              @for (p of commonPorts; track p.port) {
                <button
                  type="button"
                  (click)="destPort.set(p.port)"
                  [class]="destPort() === p.port
                    ? 'px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/40'
                    : 'px-2 py-0.5 rounded text-[10px] font-mono text-text-muted bg-bg-primary border border-border-default hover:border-accent-cyan/30 transition-colors'"
                  [attr.aria-label]="p.label + ' puerto ' + p.port"
                >
                  {{ p.label }}:{{ p.port }}
                </button>
              }
            </div>
            <input
              type="number"
              id="pkt-port"
              [ngModel]="destPort()"
              (ngModelChange)="destPort.set($event)"
              min="1"
              max="65535"
              class="w-full px-2.5 py-1.5 rounded-lg bg-bg-primary border border-border-default
                     text-sm text-text-primary font-mono outline-none
                     focus:border-accent-cyan transition-colors"
              aria-label="Puerto de destino personalizado"
            />
          </div>
        }

        <!-- Estado de conexión -->
        <div>
          <label for="pkt-state" class="block text-[11px] text-text-muted font-medium mb-1 uppercase tracking-wider">
            Estado conexión
          </label>
          <select
            id="pkt-state"
            [ngModel]="connState()"
            (ngModelChange)="connState.set($event)"
            class="w-full px-2.5 py-1.5 rounded-lg bg-bg-primary border border-border-default
                   text-sm text-text-primary font-mono outline-none
                   focus:border-accent-cyan transition-colors"
          >
            <option value="new">new — Conexión nueva</option>
            <option value="established">established — Ya establecida</option>
            <option value="related">related — Relacionada</option>
          </select>
        </div>
      </div>

      <!-- Botón Lanzar Paquete -->
      <footer class="p-3 border-t border-border-default">
        <button
          type="button"
          (click)="launchPacket()"
          class="w-full py-2.5 rounded-xl text-sm font-semibold text-bg-primary bg-linear-to-r
                 from-accent-cyan to-accent-blue hover:opacity-90 transition-opacity duration-200
                 flex items-center justify-center gap-2 shadow-lg shadow-accent-cyan/10"
          aria-label="Lanzar paquete de prueba"
        >
          <span class="text-base">🚀</span> Lanzar Paquete
        </button>
      </footer>
    </section>
  `,
})
export class PacketTesterComponent {
  protected readonly hosts = NETWORK_HOSTS;

  /** Estado del formulario */
  readonly source = signal<string>('internet');
  readonly destination = signal<string>('apache');
  readonly protocol = signal<'tcp' | 'udp' | 'icmp'>('tcp');
  readonly destPort = signal<number>(80);
  readonly connState = signal<'new' | 'established' | 'related'>('new');

  /** Constantes */
  protected readonly protocols = ['tcp', 'udp', 'icmp'] as const;

  protected readonly commonPorts = [
    { port: 22, label: 'SSH' },
    { port: 53, label: 'DNS' },
    { port: 80, label: 'HTTP' },
    { port: 443, label: 'HTTPS' },
  ] as const;

  /** Evento de lanzamiento */
  readonly packetLaunched = output<PacketConfig>();

  protected launchPacket(): void {
    this.packetLaunched.emit({
      source: this.source(),
      destination: this.destination(),
      protocol: this.protocol(),
      destPort: this.destPort(),
      connState: this.connState(),
    });
  }
}
