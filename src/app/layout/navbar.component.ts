import { Component, output } from '@angular/core';

@Component({
  selector: 'app-navbar',
  template: `
    <header class="flex items-center justify-between px-4 py-2 border-b border-border-default bg-bg-secondary">
      <div class="flex items-center gap-3">
        <!-- Logo / Nombre -->
        <div class="flex items-center gap-2">
          <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-green/15">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-accent-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h1 class="text-lg font-semibold text-text-primary tracking-tight">
            nftables <span class="text-accent-green">Simulator</span>
          </h1>
        </div>

        <!-- Separador -->
        <div class="hidden sm:block w-px h-6 bg-border-default" aria-hidden="true"></div>

        <!-- Subtítulo y Enlace al creador -->
        <div class="hidden sm:flex items-center gap-2">
          <p class="text-xs text-text-muted">Simulador de firewall Linux</p>
          <span class="text-text-muted/50 text-xs">•</span>
          <a href="https://www.joselafuente.dev/" target="_blank" rel="noopener noreferrer" 
             class="text-xs text-text-muted hover:text-accent-cyan transition-colors duration-200">
            por <span class="font-medium text-text-secondary">José Lafuente</span>
          </a>
        </div>
      </div>

      <nav class="flex items-center gap-1" aria-label="Acciones principales">
        <!-- Botón Retos -->
        <button
          type="button"
          (click)="challengesClick.emit()"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-text-secondary
                 hover:text-accent-amber hover:bg-accent-amber/10 transition-colors duration-200"
          aria-label="Ver retos disponibles"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <span class="hidden md:inline">Retos</span>
        </button>

        <!-- Botón Referencia -->
        <button
          type="button"
          (click)="referenceClick.emit()"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-text-secondary
                 hover:text-accent-blue hover:bg-accent-blue/10 transition-colors duration-200"
          aria-label="Abrir referencia rápida de nftables"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          <span class="hidden md:inline">Referencia</span>
        </button>

        <!-- Botón Reset -->
        <button
          type="button"
          (click)="resetClick.emit()"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-text-secondary
                 hover:text-accent-red hover:bg-accent-red/10 transition-colors duration-200"
          aria-label="Reiniciar el simulador"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          <span class="hidden md:inline">Reset</span>
        </button>
      </nav>
    </header>
  `,
})
export class NavbarComponent {
  challengesClick = output<void>();
  referenceClick = output<void>();
  resetClick = output<void>();
}
