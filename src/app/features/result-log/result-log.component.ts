import { Component, signal } from '@angular/core';
import { UpperCasePipe } from '@angular/common';

export interface LogEntry {
  timestamp: string;
  source: string;
  destination: string;
  protocol: string;
  port: number | null;
  result: 'accept' | 'drop' | 'reject';
  matchedRule: string | null;
  chain: string;
}

@Component({
  selector: 'app-result-log',
  imports: [UpperCasePipe],
  template: `
    <section class="flex flex-col h-full" aria-label="Log de resultados">
      <!-- Header -->
      <header class="flex items-center justify-between px-3 py-2 border-b border-border-default bg-bg-secondary/50">
        <div class="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-accent-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <h2 class="text-sm font-semibold text-text-primary">Log</h2>
          @if (entries().length > 0) {
            <span class="text-[10px] text-text-muted font-mono">({{ entries().length }})</span>
          }
        </div>
        @if (entries().length > 0) {
          <button
            type="button"
            (click)="clearLog()"
            class="px-2 py-0.5 rounded text-[10px] text-text-muted hover:text-accent-red
                   hover:bg-accent-red/10 transition-colors"
            aria-label="Limpiar log"
          >
            Limpiar
          </button>
        }
      </header>

      <!-- Log entries -->
      <div class="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-[11px] leading-relaxed">
        @if (entries().length === 0) {
          <div class="flex flex-col items-center justify-center h-full text-text-muted text-center px-4">
            <span class="text-2xl mb-2" aria-hidden="true">📋</span>
            <p class="text-xs">Lanza un paquete para ver los resultados aquí</p>
          </div>
        } @else {
          @for (entry of entries(); track $index) {
            <div class="flex items-start gap-1.5 px-2 py-1.5 rounded-lg"
                 [class]="entry.result === 'accept' ? 'bg-accent-green/5'
                        : entry.result === 'drop' ? 'bg-accent-red/5'
                        : 'bg-accent-amber/5'"
                 role="log">
              <span class="shrink-0 mt-0.5"
                    [class]="entry.result === 'accept' ? 'text-accent-green'
                           : entry.result === 'drop' ? 'text-accent-red'
                           : 'text-accent-amber'"
                    aria-hidden="true">
                {{ entry.result === 'accept' ? '✅' : entry.result === 'drop' ? '🚫' : '❌' }}
              </span>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1 flex-wrap">
                  <span class="text-text-muted">{{ entry.timestamp }}</span>
                  <span class="text-accent-cyan">{{ entry.source }}</span>
                  <span class="text-text-muted">→</span>
                  <span class="text-accent-purple">{{ entry.destination }}</span>
                  <span class="text-text-muted">|</span>
                  <span class="text-text-secondary">{{ entry.protocol.toUpperCase() }}</span>
                  @if (entry.port) {
                    <span class="text-accent-amber">:{{ entry.port }}</span>
                  }
                </div>
                <div class="text-text-muted mt-0.5">
                  chain {{ entry.chain }}
                  @if (entry.matchedRule) {
                    | regla: <span class="text-text-secondary">{{ entry.matchedRule }}</span>
                  } @else {
                    | <span class="text-text-secondary italic">política por defecto</span>
                  }
                  |
                  <span [class]="entry.result === 'accept' ? 'text-accent-green font-semibold'
                               : entry.result === 'drop' ? 'text-accent-red font-semibold'
                               : 'text-accent-amber font-semibold'">
                    {{ entry.result | uppercase }}
                  </span>
                </div>
              </div>
            </div>
          }
        }
      </div>
    </section>
  `,
})
export class ResultLogComponent {
  readonly entries = signal<LogEntry[]>([]);

  addEntry(entry: LogEntry): void {
    this.entries.update(list => [entry, ...list]);
  }

  clearLog(): void {
    this.entries.set([]);
  }
}
