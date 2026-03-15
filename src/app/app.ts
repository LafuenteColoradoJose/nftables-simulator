import { Component, signal, viewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from './layout/navbar.component';
import { NetworkDiagramComponent, PacketAnimation } from './features/network-diagram/network-diagram.component';
import { RuleEditorComponent } from './features/rule-editor/rule-editor.component';
import { PacketTesterComponent, PacketConfig } from './features/packet-tester/packet-tester.component';
import { ResultLogComponent, LogEntry } from './features/result-log/result-log.component';
import { ReferenceSidebarComponent } from './layout/reference-sidebar.component';
import { ChallengeSidebarComponent } from './features/challenges/challenge-sidebar.component';
import { NETWORK_HOSTS } from './core/data/topology.data';
import { NftablesParserService } from './core/services/nftables-parser.service';
import { SimulationEngineService } from './core/services/simulation-engine.service';
import { SimulatedPacket } from './core/models/nftables.model';

@Component({
  selector: 'app-root',
  imports: [
    FormsModule,
    NavbarComponent,
    NetworkDiagramComponent,
    RuleEditorComponent,
    PacketTesterComponent,
    ResultLogComponent,
    ReferenceSidebarComponent,
    ChallengeSidebarComponent
  ],
  template: `
    <div class="flex flex-col h-dvh overflow-hidden bg-bg-primary">
      <!-- Navbar -->
      <app-navbar
        (referenceClick)="toggleReference()"
        (challengesClick)="toggleChallenges()"
        (resetClick)="resetSimulator()"
      />

      <!-- Contenido principal -->
      <div class="flex flex-1 overflow-hidden">
        <!-- Área principal (3 paneles) -->
        <main class="flex-1 flex flex-col overflow-hidden min-w-0">
          <!-- Fila superior: Diagrama de red -->
          <section class="flex-1 min-h-0 border-b border-border-default">
            <app-network-diagram [packetAnimation]="packetAnimation()" />
          </section>

          <!-- Fila inferior: Editor + Tester + Log -->
          <section class="h-[45%] flex min-h-0 overflow-hidden">
            <!-- Editor de reglas -->
            <div class="flex-1 min-w-0 border-r border-border-default">
              <app-rule-editor [(rules)]="editorContent" (applyRules)="onApplyRules($event)" />
            </div>

            <!-- Tester de paquetes -->
            <div class="w-56 shrink-0 border-r border-border-default">
              <app-packet-tester (packetLaunched)="onPacketLaunched($event)" />
            </div>

            <!-- Log de resultados -->
            <div class="w-72 shrink-0">
              <app-result-log />
            </div>
          </section>
        </main>

        <!-- Sidebar: Referencia rápida o Retos -->
        @if (showReference() || showChallenges()) {
          <div class="w-80 shrink-0 overflow-hidden border-l border-border-default h-full bg-bg-secondary flex flex-col">
            @if (showReference()) {
              <app-reference-sidebar class="flex-1 overflow-hidden" />
            }
            @if (showChallenges()) {
              <app-challenge-sidebar class="flex-1 overflow-hidden" (loadInitialRules)="onLoadChallengeRules($event)" />
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      height: 100dvh;
    }
  `,
})
export class App {
  /** Estado global de la UI */
  protected readonly showReference = signal(true);
  protected readonly showChallenges = signal(false);
  protected readonly editorContent = signal('');
  protected readonly packetAnimation = signal<PacketAnimation | null>(null);

  /** Servicios de Simulación */
  private readonly parser = inject(NftablesParserService);
  private readonly engine = inject(SimulationEngineService);

  /** Referencias a componentes hijos */
  private readonly resultLog = viewChild(ResultLogComponent);

  /** Acciones de la navbar */
  protected toggleReference(): void {
    if (!this.showReference()) {
      this.showChallenges.set(false);
      this.showReference.set(true);
    } else {
      this.showReference.set(false);
    }
  }

  protected toggleChallenges(): void {
    if (!this.showChallenges()) {
      this.showReference.set(false);
      this.showChallenges.set(true);
    } else {
      this.showChallenges.set(false);
    }
  }

  protected resetSimulator(): void {
    this.editorContent.set('');
    this.resultLog()?.clearLog();
    // Parse empty ruleset to clear engine
    this.onApplyRules('');
  }

  protected onLoadChallengeRules(rules: string): void {
    this.editorContent.set(rules);
    this.onApplyRules(rules);
  }

  /** Aplicar reglas del editor */
  protected onApplyRules(rules: string): void {
    const parseResult = this.parser.parseRuleset(rules);
    
    if (parseResult.success) {
      let msg = 'Reglas cargadas correctamente.';
      if (parseResult.warnings.length > 0) {
        msg += ` (${parseResult.warnings.length} warnings. Ver consola)`;
        console.warn('Warnings de parseo:', parseResult.warnings);
      }
      this.resultLog()?.addEntry({
        timestamp: new Date().toLocaleTimeString('es-ES'),
        source: 'sistema', destination: 'router', protocol: 'n/a', port: null,
        result: 'accept', matchedRule: msg, chain: 'nft-parser'
      });
    } else {
      console.error('Errores en reglas:', parseResult.errors);
      this.resultLog()?.addEntry({
        timestamp: new Date().toLocaleTimeString('es-ES'),
        source: 'sistema', destination: 'router', protocol: 'n/a', port: null,
        result: 'reject', matchedRule: `Error: ${parseResult.errors[0]}`, chain: 'nft-parser'
      });
    }
  }

  /** Lanzar un paquete de prueba */
  protected onPacketLaunched(packet: PacketConfig): void {
    const simPacket: SimulatedPacket = {
      sourceIp: packet.source,
      sourceInterface: null,
      destIp: packet.destination,
      destInterface: null,
      protocol: packet.protocol,
      destPort: packet.destPort,
      connState: packet.connState
    };

    const evalResult = this.engine.evaluatePacket(simPacket);
    
    // Para logs en consola
    console.log(`[TEST] ${packet.source} -> ${packet.destination} (${packet.protocol}:${packet.destPort})`);
    evalResult.logs.forEach(l => console.log(l));

    const sourceHost = packet.source === 'internet'
      ? 'Internet'
      : NETWORK_HOSTS.find(h => h.id === packet.source)?.ip ?? packet.source;

    const destHost = packet.destination === 'internet'
      ? 'Internet'
      : NETWORK_HOSTS.find(h => h.id === packet.destination)?.ip ?? packet.destination;

    const entry: LogEntry = {
      timestamp: new Date().toLocaleTimeString('es-ES'),
      source: sourceHost,
      destination: destHost,
      protocol: packet.protocol,
      port: packet.protocol !== 'icmp' ? packet.destPort : null,
      result: evalResult.finalVerdict as any,
      matchedRule: evalResult.matchedRule ? `Regla id ${evalResult.matchedRule.id}` : 'Política por defecto',
      chain: evalResult.chainEvaluated || 'routing',
    };

    this.resultLog()?.addEntry(entry);

    // Animación visual
    this.packetAnimation.set({
      id: Date.now(),
      source: packet.source,
      dest: packet.destination,
      verdict: evalResult.finalVerdict,
      protocol: packet.protocol
    });
  }
}
