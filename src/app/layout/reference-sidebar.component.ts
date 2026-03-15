import { Component, signal } from '@angular/core';

interface CheatSection {
  title: string;
  commands: CheatCommand[];
}

interface CheatCommand {
  syntax: string;
  description: string;
}

@Component({
  selector: 'app-reference-sidebar',
  template: `
    <aside class="flex flex-col h-full w-full bg-bg-panel border-l border-border-default"
           role="complementary" aria-label="Referencia rápida de nftables">
      <!-- Header -->
      <header class="flex items-center justify-between px-3 py-2 border-b border-border-default">
        <div class="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-accent-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          <h2 class="text-sm font-semibold text-text-primary">Referencia</h2>
        </div>
      </header>

      <!-- Contenido -->
      <div class="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        @for (section of sections; track section.title) {
          <details class="group" [attr.open]="expandedSection() === section.title ? '' : null">
            <summary
              class="flex items-center justify-between cursor-pointer py-1.5 text-xs font-semibold
                     text-accent-blue uppercase tracking-wider select-none
                     hover:text-accent-cyan transition-colors"
              (click)="toggleSection(section.title, $event)"
            >
              {{ section.title }}
              <svg xmlns="http://www.w3.org/2000/svg"
                   class="w-3.5 h-3.5 text-text-muted transition-transform duration-200
                          group-open:rotate-90"
                   viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </summary>
            <div class="mt-1 space-y-1.5 pb-2">
              @for (cmd of section.commands; track cmd.syntax) {
                <div class="group/cmd rounded-lg px-2 py-1.5 bg-bg-primary/40 hover:bg-bg-hover
                            transition-colors cursor-pointer"
                     role="button" tabindex="0"
                     [attr.aria-label]="'Copiar: ' + cmd.syntax"
                     (click)="copyCommand(cmd.syntax)"
                     (keydown.enter)="copyCommand(cmd.syntax)"
                     (keydown.space)="copyCommand(cmd.syntax)">
                  <code class="block text-[11px] font-mono text-accent-green leading-snug break-all">
                    {{ cmd.syntax }}
                  </code>
                  <p class="text-[10px] text-text-muted mt-0.5 leading-snug">{{ cmd.description }}</p>
                </div>
              }
            </div>
          </details>
        }
      </div>

      <!-- Feedback de copia -->
      @if (showCopied()) {
        <div class="mx-3 mb-2 py-1.5 text-center text-[10px] text-accent-green bg-accent-green/10
                    rounded-lg font-medium animate-pulse" role="status" aria-live="polite">
          ✓ Copiado al portapapeles
        </div>
      }
    </aside>
  `,
})
export class ReferenceSidebarComponent {
  protected readonly expandedSection = signal<string | null>('Tablas');
  protected readonly showCopied = signal(false);

  protected readonly sections: CheatSection[] = [
    {
      title: 'Tablas',
      commands: [
        { syntax: 'nft add table inet filter', description: 'Crear tabla inet (IPv4+IPv6)' },
        { syntax: 'nft list tables', description: 'Listar todas las tablas' },
        { syntax: 'nft delete table inet filter', description: 'Eliminar tabla' },
        { syntax: 'nft list ruleset', description: 'Ver todas las reglas activas' },
        { syntax: 'nft flush ruleset', description: 'Borrar todas las reglas' },
      ],
    },
    {
      title: 'Cadenas',
      commands: [
        { syntax: 'nft add chain inet filter input { type filter hook input priority 0 \\; policy drop \\; }', description: 'Cadena input con política DROP' },
        { syntax: 'nft add chain inet filter forward { type filter hook forward priority 0 \\; policy drop \\; }', description: 'Cadena forward con política DROP' },
        { syntax: 'nft add chain inet filter output { type filter hook output priority 0 \\; policy accept \\; }', description: 'Cadena output con política ACCEPT' },
      ],
    },
    {
      title: 'Reglas básicas',
      commands: [
        { syntax: 'nft add rule inet filter input ct state established,related accept', description: 'Aceptar conexiones establecidas' },
        { syntax: 'nft add rule inet filter input iifname "lo" accept', description: 'Aceptar tráfico localhost' },
        { syntax: 'nft add rule inet filter input tcp dport 22 accept', description: 'Permitir SSH' },
        { syntax: 'nft add rule inet filter input tcp dport {80, 443} accept', description: 'Permitir HTTP y HTTPS' },
        { syntax: 'nft add rule inet filter input icmp type echo-request accept', description: 'Permitir ping' },
      ],
    },
    {
      title: 'Filtrado por IP',
      commands: [
        { syntax: 'nft add rule inet filter input ip saddr 192.168.100.50 accept', description: 'Aceptar tráfico desde IP específica' },
        { syntax: 'nft add rule inet filter input ip saddr 192.168.100.0/24 accept', description: 'Aceptar tráfico desde subred' },
        { syntax: 'nft add rule inet filter forward ip daddr 192.168.200.2 tcp dport 80 accept', description: 'Forward HTTP a servidor DMZ' },
      ],
    },
    {
      title: 'NAT',
      commands: [
        { syntax: 'nft add table ip nat', description: 'Crear tabla NAT' },
        { syntax: 'nft add chain ip nat postrouting { type nat hook postrouting priority 100 \\; }', description: 'Cadena NAT postrouting' },
        { syntax: 'nft add rule ip nat postrouting oifname "eth0" masquerade', description: 'Masquerade (NAT) para salida a Internet' },
        { syntax: 'nft add chain ip nat prerouting { type nat hook prerouting priority -100 \\; }', description: 'Cadena NAT prerouting (DNAT)' },
        { syntax: 'nft add rule ip nat prerouting iifname "eth0" tcp dport 80 dnat to 192.168.200.2', description: 'Port forwarding HTTP a DMZ' },
      ],
    },
    {
      title: 'Sets',
      commands: [
        { syntax: 'nft add rule inet filter input tcp dport {22, 80, 443} accept', description: 'Set anónimo de puertos' },
        { syntax: 'nft add set inet filter allowed_ips { type ipv4_addr \\; }', description: 'Crear set nombrado de IPs' },
        { syntax: 'nft add element inet filter allowed_ips { 192.168.100.50, 192.168.100.2 }', description: 'Añadir IPs al set' },
      ],
    },
    {
      title: 'Logging',
      commands: [
        { syntax: 'nft add rule inet filter input log prefix "INPUT-DROP: " drop', description: 'Loguear y dropear' },
        { syntax: 'nft add rule inet filter forward counter', description: 'Contar paquetes en forward' },
        { syntax: 'nft add rule inet filter input limit rate 10/second accept', description: 'Rate limiting' },
      ],
    },
  ];

  protected toggleSection(title: string, event: Event): void {
    event.preventDefault();
    this.expandedSection.set(this.expandedSection() === title ? null : title);
  }

  protected async copyCommand(syntax: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(syntax);
      this.showCopied.set(true);
      setTimeout(() => this.showCopied.set(false), 1500);
    } catch {
      // Fallback si clipboard API no disponible (SSR)
    }
  }
}
