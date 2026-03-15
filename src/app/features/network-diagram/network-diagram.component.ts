import { Component, signal, computed, effect, inject } from '@angular/core';
import { ROUTER_CONFIG, NETWORK_HOSTS, NETWORK_SEGMENTS } from '../../core/data/topology.data';
import { NetworkHost, RouterConfig, NetworkSegment } from '../../core/models/network.model';
import { AnimationBusService, PacketAnimation } from '../../core/services/animation-bus.service';

interface NodePosition {
  x: number;
  y: number;
}

@Component({
  selector: 'app-network-diagram',
  template: `
    <section class="relative w-full h-full" aria-label="Diagrama de topología de red">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        [attr.viewBox]="'0 0 ' + svgWidth + ' ' + svgHeight"
        class="w-full h-full"
        role="img"
        aria-label="Topología de red con router, DMZ y LAN"
      >
        <defs>
          <!-- Glow filter para nodos activos -->
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
          <!-- Gradiente de línea WAN -->
          <linearGradient id="grad-wan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#f87171" stop-opacity="0.6"/>
            <stop offset="100%" stop-color="#f87171" stop-opacity="0.15"/>
          </linearGradient>
          <!-- Gradiente de línea DMZ -->
          <linearGradient id="grad-dmz" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#fbbf24" stop-opacity="0.5"/>
            <stop offset="100%" stop-color="#fbbf24" stop-opacity="0.15"/>
          </linearGradient>
          <!-- Gradiente de línea LAN -->
          <linearGradient id="grad-lan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#34d399" stop-opacity="0.5"/>
            <stop offset="100%" stop-color="#34d399" stop-opacity="0.15"/>
          </linearGradient>
        </defs>

        <!-- ═══ ZONAS DE RED (fondos) ═══ -->
        <!-- Zona WAN -->
        <rect x="190" y="10" width="220" height="65" rx="12" fill="#f87171" fill-opacity="0.06" stroke="#f87171" stroke-opacity="0.15" stroke-width="1"/>
        <text x="300" y="32" text-anchor="middle" fill="#f87171" font-size="11" font-weight="600" font-family="var(--font-sans)">INTERNET (WAN)</text>

        <!-- Zona DMZ -->
        <rect x="20" y="225" width="195" height="180" rx="12" fill="#fbbf24" fill-opacity="0.05" stroke="#fbbf24" stroke-opacity="0.15" stroke-width="1"/>
        <text x="117" y="248" text-anchor="middle" fill="#fbbf24" font-size="11" font-weight="600" font-family="var(--font-sans)">DMZ — 192.168.200.0/24</text>

        <!-- Zona LAN -->
        <rect x="245" y="225" width="340" height="180" rx="12" fill="#34d399" fill-opacity="0.05" stroke="#34d399" stroke-opacity="0.15" stroke-width="1"/>
        <text x="415" y="248" text-anchor="middle" fill="#34d399" font-size="11" font-weight="600" font-family="var(--font-sans)">LAN — 192.168.100.0/24</text>

        <!-- ═══ LÍNEAS DE CONEXIÓN ═══ -->
        <!-- Internet → Router -->
        <line x1="300" y1="55" x2="300" y2="100" stroke="url(#grad-wan)" stroke-width="2.5" stroke-dasharray="6 3"/>

        <!-- Router → DMZ (eth1) -->
        <path d="M 260 155 Q 200 185 117 265" fill="none" stroke="url(#grad-dmz)" stroke-width="2"/>
        <text x="168" y="198" fill="#fbbf24" font-size="9" font-family="var(--font-mono)" opacity="0.7">eth1</text>

        <!-- Router → LAN (eth2) -->
        <path d="M 340 155 Q 380 185 415 265" fill="none" stroke="url(#grad-lan)" stroke-width="2"/>
        <text x="395" y="198" fill="#34d399" font-size="9" font-family="var(--font-mono)" opacity="0.7">eth2</text>

        <!-- DMZ: Switch → Apache -->
        <line x1="117" y1="285" x2="117" y2="310" stroke="#fbbf24" stroke-opacity="0.25" stroke-width="1.5"/>

        <!-- LAN: Switch → Hosts -->
        <line x1="415" y1="285" x2="315" y2="310" stroke="#34d399" stroke-opacity="0.25" stroke-width="1.5"/>
        <line x1="415" y1="285" x2="415" y2="310" stroke="#34d399" stroke-opacity="0.25" stroke-width="1.5"/>
        <line x1="415" y1="285" x2="515" y2="310" stroke="#34d399" stroke-opacity="0.25" stroke-width="1.5"/>

        <!-- ═══ NODO: INTERNET ═══ -->
        <g class="cursor-pointer" role="button" tabindex="0"
           [attr.aria-label]="'Internet WAN'"
           (click)="selectNode('internet')"
           (keydown.enter)="selectNode('internet')"
           (keydown.space)="selectNode('internet')">
          <circle cx="300" cy="55" r="14" fill="#0a0e17" stroke="#f87171" stroke-width="1.5"
                  [attr.filter]="selectedNode() === 'internet' ? 'url(#glow)' : null"/>
          <text x="300" y="59" text-anchor="middle" fill="#f87171" font-size="13">🌐</text>
        </g>

        <!-- ═══ NODO: ROUTER ═══ -->
        <g class="cursor-pointer" role="button" tabindex="0"
           [attr.aria-label]="'Router Firewall - Debian 12 - nftables'"
           (click)="selectNode('router')"
           (keydown.enter)="selectNode('router')"
           (keydown.space)="selectNode('router')">
          <rect x="255" y="100" width="90" height="55" rx="10"
                fill="#1a2332" stroke="#38bdf8" stroke-width="1.5"
                [class]="selectedNode() === 'router' ? 'animate-pulse' : ''"
                [attr.filter]="selectedNode() === 'router' ? 'url(#glow)' : null"/>
          <text x="300" y="121" text-anchor="middle" fill="#38bdf8" font-size="20">🛡️</text>
          <text x="300" y="138" text-anchor="middle" fill="#e2e8f0" font-size="9.5" font-weight="600" font-family="var(--font-sans)">Router</text>
          <text x="300" y="150" text-anchor="middle" fill="#94a3b8" font-size="7.5" font-family="var(--font-mono)">nftables</text>
        </g>

        <!-- Etiqueta eth0 -->
        <text x="318" y="92" fill="#f87171" font-size="9" font-family="var(--font-mono)" opacity="0.7">eth0</text>

        <!-- ═══ SWITCHES / BARRAS DE RED ═══ -->
        <!-- Switch DMZ -->
        <rect x="87" y="270" width="60" height="15" rx="4" fill="#1e293b" stroke="#fbbf24" stroke-opacity="0.3" stroke-width="1"/>
        <text x="117" y="281" text-anchor="middle" fill="#fbbf24" font-size="7" font-family="var(--font-mono)" opacity="0.6">switch</text>

        <!-- Switch LAN -->
        <rect x="380" y="270" width="70" height="15" rx="4" fill="#1e293b" stroke="#34d399" stroke-opacity="0.3" stroke-width="1"/>
        <text x="415" y="281" text-anchor="middle" fill="#34d399" font-size="7" font-family="var(--font-mono)" opacity="0.6">switch</text>

        <!-- ═══ NODO: APACHE (DMZ) ═══ -->
        <g class="cursor-pointer" role="button" tabindex="0"
           [attr.aria-label]="'Servidor Apache - 192.168.200.2 - DMZ'"
           (click)="selectNode('apache')"
           (keydown.enter)="selectNode('apache')"
           (keydown.space)="selectNode('apache')">
          <rect x="72" y="310" width="90" height="82" rx="10"
                fill="#1a2332" stroke="#fbbf24" stroke-width="1.2"
                [attr.stroke-opacity]="selectedNode() === 'apache' ? '1' : '0.4'"
                [attr.filter]="selectedNode() === 'apache' ? 'url(#glow)' : null"/>
          <text x="117" y="336" text-anchor="middle" fill="#fbbf24" font-size="22">🖥️</text>
          <text x="117" y="355" text-anchor="middle" fill="#e2e8f0" font-size="9" font-weight="600" font-family="var(--font-sans)">Apache</text>
          <text x="117" y="367" text-anchor="middle" fill="#94a3b8" font-size="8" font-family="var(--font-mono)">.200.2</text>
          <text x="117" y="381" text-anchor="middle" fill="#64748b" font-size="7" font-family="var(--font-mono)">HTTP HTTPS SSH</text>
        </g>

        <!-- ═══ NODO: ADMIN (LAN) ═══ -->
        <g class="cursor-pointer" role="button" tabindex="0"
           [attr.aria-label]="'Admin PC - 192.168.100.50 - LAN'"
           (click)="selectNode('admin')"
           (keydown.enter)="selectNode('admin')"
           (keydown.space)="selectNode('admin')">
          <rect x="270" y="310" width="90" height="82" rx="10"
                fill="#1a2332" stroke="#34d399" stroke-width="1.2"
                [attr.stroke-opacity]="selectedNode() === 'admin' ? '1' : '0.4'"
                [attr.filter]="selectedNode() === 'admin' ? 'url(#glow)' : null"/>
          <text x="315" y="336" text-anchor="middle" fill="#34d399" font-size="22">🖥️</text>
          <text x="315" y="355" text-anchor="middle" fill="#e2e8f0" font-size="9" font-weight="600" font-family="var(--font-sans)">Admin</text>
          <text x="315" y="367" text-anchor="middle" fill="#94a3b8" font-size="8" font-family="var(--font-mono)">.100.50</text>
          <text x="315" y="381" text-anchor="middle" fill="#a78bfa" font-size="7" font-family="var(--font-mono)">🔑 Administrador</text>
        </g>

        <!-- ═══ NODO: EMPLEADO 1 (LAN) ═══ -->
        <g class="cursor-pointer" role="button" tabindex="0"
           [attr.aria-label]="'Empleado 1 PC - 192.168.100.2 - LAN'"
           (click)="selectNode('empleado1')"
           (keydown.enter)="selectNode('empleado1')"
           (keydown.space)="selectNode('empleado1')">
          <rect x="370" y="310" width="90" height="82" rx="10"
                fill="#1a2332" stroke="#34d399" stroke-width="1.2"
                [attr.stroke-opacity]="selectedNode() === 'empleado1' ? '1' : '0.4'"
                [attr.filter]="selectedNode() === 'empleado1' ? 'url(#glow)' : null"/>
          <text x="415" y="336" text-anchor="middle" fill="#34d399" font-size="22">💻</text>
          <text x="415" y="355" text-anchor="middle" fill="#e2e8f0" font-size="9" font-weight="600" font-family="var(--font-sans)">Empleado 1</text>
          <text x="415" y="367" text-anchor="middle" fill="#94a3b8" font-size="8" font-family="var(--font-mono)">.100.2</text>
          <text x="415" y="381" text-anchor="middle" fill="#64748b" font-size="7" font-family="var(--font-mono)">Usuario</text>
        </g>

        <!-- ═══ NODO: EMPLEADO 2 (LAN) ═══ -->
        <g class="cursor-pointer" role="button" tabindex="0"
           [attr.aria-label]="'Empleado 2 PC - 192.168.100.3 - LAN'"
           (click)="selectNode('empleado2')"
           (keydown.enter)="selectNode('empleado2')"
           (keydown.space)="selectNode('empleado2')">
          <rect x="470" y="310" width="90" height="82" rx="10"
                fill="#1a2332" stroke="#34d399" stroke-width="1.2"
                [attr.stroke-opacity]="selectedNode() === 'empleado2' ? '1' : '0.4'"
                [attr.filter]="selectedNode() === 'empleado2' ? 'url(#glow)' : null"/>
          <text x="515" y="336" text-anchor="middle" fill="#34d399" font-size="22">💻</text>
          <text x="515" y="355" text-anchor="middle" fill="#e2e8f0" font-size="9" font-weight="600" font-family="var(--font-sans)">Empleado 2</text>
          <text x="515" y="367" text-anchor="middle" fill="#94a3b8" font-size="8" font-family="var(--font-mono)">.100.3</text>
          <text x="515" y="381" text-anchor="middle" fill="#64748b" font-size="7" font-family="var(--font-mono)">Usuario</text>
        </g>
        <!-- ═══ ANIMACIONES DE PAQUETES ═══ -->
        @for (anim of activeAnimations(); track anim.id) {
          <g>
            <!-- Paquete en movimiento -->
            <circle r="7" [attr.fill]="anim.color" filter="url(#glow)">
              <animateMotion 
                [attr.path]="anim.path" 
                [attr.dur]="anim.dur" 
                fill="freeze"
                calcMode="linear"
              />
              <animate 
                attributeName="opacity" 
                values="1;1;0" 
                keyTimes="0;0.9;1" 
                [attr.dur]="anim.dur" 
                fill="freeze" 
              />
            </circle>

            <!-- Expansión al finalizar (Explosión red o onda de éxito) -->
            <circle r="7" fill="none" [attr.stroke]="anim.color" stroke-width="2.5" filter="url(#glow)">
              <animateMotion [attr.path]="anim.path" [attr.dur]="anim.dur" fill="freeze" calcMode="linear"/>
              <animate attributeName="opacity" values="0;0;1;0" keyTimes="0;0.8;0.9;1" [attr.dur]="anim.dur" fill="freeze" />
              <animate attributeName="r" [attr.values]="anim.isDrop ? '7;7;25;35' : '7;7;15;22'" keyTimes="0;0.8;0.9;1" [attr.dur]="anim.dur" fill="freeze" />
              @if (anim.isDrop) {
                 <!-- Si lo tira el firewall, pintamos unas aspas tachadas grandes -->
                 <animate attributeName="stroke-dasharray" values="100;100;6 6;2 10" keyTimes="0;0.8;0.9;1" [attr.dur]="anim.dur" fill="freeze" />
              }
            </circle>
          </g>
        }

      </svg>

      <!-- ═══ PANEL DE INFO DEL NODO SELECCIONADO ═══ -->
      @if (selectedNodeInfo(); as info) {
        <aside
          class="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-bg-panel/95 backdrop-blur-sm
                 border border-border-default shadow-lg shadow-black/30"
          role="complementary"
          [attr.aria-label]="'Información de ' + info.name"
        >
          <div class="flex items-start gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h3 class="text-sm font-semibold text-text-primary truncate">{{ info.name }}</h3>
                <span class="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold"
                      [class]="info.zone === 'DMZ' ? 'bg-accent-amber/15 text-accent-amber'
                             : info.zone === 'LAN' ? 'bg-accent-green/15 text-accent-green'
                             : 'bg-accent-blue/15 text-accent-blue'">
                  {{ info.zone }}
                </span>
              </div>
              <p class="text-xs text-text-muted mb-1.5">{{ info.description }}</p>
              <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <span class="text-text-secondary">
                  <span class="text-text-muted">IP:</span>
                  <span class="font-mono text-accent-cyan ml-1">{{ info.ip }}</span>
                </span>
                <span class="text-text-secondary">
                  <span class="text-text-muted">OS:</span>
                  <span class="ml-1">{{ info.os }}</span>
                </span>
                @if (info.services && info.services.length > 0) {
                  <span class="text-text-secondary">
                    <span class="text-text-muted">Servicios:</span>
                    @for (svc of info.services; track svc.name) {
                      <span class="ml-1 px-1 py-0.5 rounded bg-bg-hover text-accent-purple font-mono text-[10px]">
                        {{ svc.name }}:{{ svc.port }}
                      </span>
                    }
                  </span>
                }
              </div>
              <!-- Interfaces del router -->
              @if (info.interfaces) {
                <div class="flex flex-wrap gap-2 mt-1.5">
                  @for (iface of info.interfaces; track iface.name) {
                    <span class="px-1.5 py-0.5 rounded text-[10px] font-mono border"
                          [class]="iface.zone === 'WAN' ? 'border-accent-red/30 text-accent-red'
                                 : iface.zone === 'DMZ' ? 'border-accent-amber/30 text-accent-amber'
                                 : 'border-accent-green/30 text-accent-green'">
                      {{ iface.name }}: {{ iface.ip }}
                    </span>
                  }
                </div>
              }
            </div>
            <button
              type="button"
              (click)="selectNode(null)"
              class="shrink-0 p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
              aria-label="Cerrar panel de información"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </aside>
      }
    </section>
  `,
})
export class NetworkDiagramComponent {
  protected readonly svgWidth = 600;
  protected readonly svgHeight = 420;

  protected readonly router = ROUTER_CONFIG;
  protected readonly hosts = NETWORK_HOSTS;
  protected readonly segments = NETWORK_SEGMENTS;

  /** Nodo actualmente seleccionado */
  readonly selectedNode = signal<string | null>(null);
  
  /** Lista de animaciones SVG activas */
  readonly activeAnimations = signal<{id: number, path: string, color: string, isDrop: boolean, dur: string}[]>([]);

  private animationBus = inject(AnimationBusService);

  constructor() {
    effect(() => {
      const anim = this.animationBus.animationSignal();
      if (anim) {
        this.triggerAnimation(anim);
      }
    });
  }

  /** Información del nodo seleccionado */
  readonly selectedNodeInfo = computed(() => {
    const id = this.selectedNode();
    if (!id) return null;

    if (id === 'router') {
      return {
        name: this.router.name,
        ip: 'Múltiples interfaces',
        zone: 'WAN' as const,
        os: this.router.os,
        description: this.router.description,
        services: null as any,
        interfaces: this.router.interfaces,
      };
    }

    if (id === 'internet') {
      return {
        name: 'Internet (WAN)',
        ip: 'Red pública',
        zone: 'WAN' as const,
        os: 'N/A',
        description: 'Conexión a Internet a través del proveedor (ISP). Representa el tráfico externo entrante y saliente.',
        services: null as any,
        interfaces: null as any,
      };
    }

    const host = this.hosts.find(h => h.id === id);
    if (!host) return null;

    return {
      name: host.name,
      ip: host.ip,
      zone: host.zone,
      os: host.os,
      description: host.description,
      services: host.services,
      interfaces: null as any,
    };
  });

  selectNode(id: string | null): void {
    this.selectedNode.set(this.selectedNode() === id ? null : id);
  }

  /** Función para inyectar una nueva animación en el ecosistema SVG */
  private triggerAnimation(anim: PacketAnimation) {
    const isDrop = anim.verdict === 'drop' || anim.verdict === 'reject';
    const color = anim.verdict === 'accept' ? '#34d399' : '#f87171'; // Verde si accept, Rojo si drop/reject
    const dur = isDrop ? '0.6s' : '1.2s'; // Cae rápido si es router, tarda si viaja
    
    let path = this.getHostToRouterPath(anim.source);
    
    // Si isDrop es falso y dest no es router, agregamos el path hacia el destino
    if (!isDrop && anim.dest !== 'router') {
      const destPath = this.getRouterToHostPath(anim.dest);
      // Evitamos el salto borrando el move inicial del segundo path
      path += ' ' + destPath.replace('M 300 125 ', '');
    }

    const newAnim = { id: anim.id, path, color, isDrop, dur };
    
    // Añadir al SVG
    this.activeAnimations.update(arr => [...arr, newAnim]);

    // Limpiarlo del DOM después de que termine la animación
    setTimeout(() => {
      this.activeAnimations.update(arr => arr.filter(a => a.id !== newAnim.id));
    }, isDrop ? 1000 : 1500);
  }

  private getHostToRouterPath(host: string): string {
    switch(host) {
      case 'internet': return 'M 300 55 L 300 100 L 300 125';
      case 'apache': return 'M 117 310 L 117 285 L 117 265 Q 200 185 260 155 L 300 125';
      case 'admin': return 'M 315 310 L 415 285 L 415 265 Q 380 185 340 155 L 300 125';
      case 'empleado1': return 'M 415 310 L 415 285 L 415 265 Q 380 185 340 155 L 300 125';
      case 'empleado2': return 'M 515 310 L 415 285 L 415 265 Q 380 185 340 155 L 300 125';
      default: return 'M 300 125 L 300 125';
    }
  }

  private getRouterToHostPath(host: string): string {
    switch(host) {
      case 'internet': return 'M 300 125 L 300 100 L 300 55';
      case 'apache': return 'M 300 125 L 260 155 Q 200 185 117 265 L 117 285 L 117 310';
      case 'admin': return 'M 300 125 L 340 155 Q 380 185 415 265 L 415 285 L 315 310';
      case 'empleado1': return 'M 300 125 L 340 155 Q 380 185 415 265 L 415 285 L 415 310';
      case 'empleado2': return 'M 300 125 L 340 155 Q 380 185 415 265 L 415 285 L 515 310';
      default: return 'M 300 125 L 300 125';
    }
  }
}
