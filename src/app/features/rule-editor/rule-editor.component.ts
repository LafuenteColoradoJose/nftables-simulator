import { Component, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-rule-editor',
  imports: [FormsModule],
  template: `
    <section class="flex flex-col h-full" aria-label="Editor de reglas nftables">
      <!-- Header -->
      <header class="flex items-center justify-between px-3 py-2 border-b border-border-default bg-bg-secondary/50">
        <div class="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-accent-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
          </svg>
          <h2 class="text-sm font-semibold text-text-primary">Reglas nftables</h2>
        </div>
        <div class="flex items-center gap-1">
          <button
            type="button"
            (click)="applyRules.emit(rules())"
            class="px-2.5 py-1 rounded-md text-xs font-medium text-bg-primary bg-accent-green
                   hover:bg-accent-green/85 transition-colors duration-200"
            aria-label="Aplicar las reglas escritas"
          >
            ▶ Aplicar
          </button>
          <button
            type="button"
            (click)="resetEditor()"
            class="px-2.5 py-1 rounded-md text-xs font-medium text-text-secondary
                   hover:text-accent-red hover:bg-accent-red/10 transition-colors duration-200"
            aria-label="Limpiar el editor"
          >
            Limpiar
          </button>
        </div>
      </header>

      <!-- Editor de código -->
      <div class="relative flex-1 overflow-hidden">
        <!-- Números de línea -->
        <div class="absolute top-0 left-0 w-10 h-full bg-bg-primary/60 border-r border-border-default
                    flex flex-col pt-3 items-end pr-2 text-[11px] text-text-muted font-mono
                    leading-[1.65rem] select-none overflow-hidden pointer-events-none"
             aria-hidden="true">
          @for (num of lineNumbers(); track num) {
            <span>{{ num }}</span>
          }
        </div>

        <!-- Textarea -->
        <textarea
          [ngModel]="rules()"
          (ngModelChange)="onRulesChange($event)"
          class="w-full h-full resize-none bg-transparent text-accent-green font-mono text-sm
                 leading-[1.65rem] pt-3 pb-3 pl-12 pr-3 outline-none placeholder:text-text-muted/50
                 caret-accent-green"
          spellcheck="false"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          placeholder="# Escribe tus reglas nftables aquí...
# Ejemplo:
nft add table inet filter
nft add chain inet filter input { type filter hook input priority 0 \; policy drop \; }
nft add rule inet filter input ct state established,related accept
nft add rule inet filter input iifname eth2 tcp dport 22 ip saddr 192.168.100.50 accept"
          aria-label="Editor de reglas nftables. Escribe tus reglas aquí."
        ></textarea>
      </div>

      <!-- Barra de estado -->
      <footer class="flex items-center justify-between px-3 py-1.5 border-t border-border-default
                     bg-bg-secondary/50 text-[10px] text-text-muted font-mono">
        <span>{{ lineCount() }} líneas</span>
        <span class="flex items-center gap-1">
          <span class="inline-block w-1.5 h-1.5 rounded-full bg-accent-green/60" aria-hidden="true"></span>
          nftables syntax
        </span>
      </footer>
    </section>
  `,
})
export class RuleEditorComponent {
  /** Contenido del editor (two-way binding) */
  readonly rules = model<string>('');

  /** Evento al aplicar reglas */
  readonly applyRules = output<string>();

  /** Número de líneas del editor */
  protected readonly lineCount = () => {
    const text = this.rules();
    if (!text) return 0;
    return text.split('\n').length;
  };

  /** Array de números de línea para renderizar */
  protected readonly lineNumbers = () => {
    const count = Math.max(this.lineCount(), 20);
    return Array.from({ length: count }, (_, i) => i + 1);
  };

  protected resetEditor(): void {
    this.rules.set('');
  }

  protected onRulesChange(value: string): void {
    this.rules.set(value);
  }
}
