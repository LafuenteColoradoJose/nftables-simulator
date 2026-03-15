import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChallengeService } from '../../core/services/challenge.service';
import { Challenge } from '../../core/models/challenge.model';

@Component({
  selector: 'app-challenge-sidebar',
  imports: [CommonModule],
  template: `
    <aside class="h-full flex flex-col bg-bg-secondary border-l border-border-default overflow-hidden">
      <!-- Header -->
      <div class="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border-default bg-bg-tertiary">
        <div class="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-accent-amber" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <h2 class="text-sm font-semibold text-text-primary tracking-wide uppercase">Retos</h2>
        </div>
      </div>

      <!-- Contenido scrolleable -->
      <div class="flex-1 overflow-y-auto w-full p-4 space-y-4">
        
        @if (!activeChallenge()) {
          <p class="text-sm text-text-muted mb-2">Selecciona un reto para poner a prueba tus conocimientos de nftables.</p>
          <!-- Lista de retos -->
          @for (c of challenges(); track c.id) {
            <button
              type="button"
              (click)="loadChallenge(c)"
              class="w-full text-left p-3 rounded-lg border border-border-default bg-bg-primary hover:border-accent-amber hover:bg-accent-amber/5 transition-colors group"
            >
              <div class="flex justify-between items-start mb-1">
                <span class="text-sm font-medium text-text-secondary group-hover:text-text-primary transition-colors">{{ c.title }}</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      [ngClass]="getDifficultyClass(c.difficulty)">
                  {{ c.difficulty }}
                </span>
              </div>
              <p class="text-xs text-text-muted line-clamp-2">{{ c.description }}</p>
            </button>
          }
        } @else {
          <!-- Reto Activo -->
          <div class="mb-4">
            <button 
              type="button" 
              (click)="clearChallenge()"
              class="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors mb-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Volver a la lista
            </button>
            
            <h3 class="text-sm font-semibold text-text-primary mb-2">{{ activeChallenge()?.title }}</h3>
            <span class="inline-block text-[10px] px-1.5 py-0.5 rounded-full font-medium mb-3"
                  [ngClass]="getDifficultyClass(activeChallenge()!.difficulty)">
              {{ activeChallenge()?.difficulty }}
            </span>
            <p class="text-xs text-text-secondary leading-relaxed bg-bg-tertiary p-3 rounded-md border border-border-default">
              {{ activeChallenge()?.description }}
            </p>
          </div>

          <!-- Botón Validar -->
          <button 
            type="button"
            (click)="validateChallenge()"
            class="w-full py-2 px-4 rounded-md bg-accent-green hover:bg-green-600 text-bg-primary font-bold text-sm shadow-sm transition-all flex justify-center items-center gap-2 mb-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            Validar Reto
          </button>

          <!-- Resultados -->
          @if (validationResults().length > 0) {
            <div class="space-y-2 border-t border-border-default pt-4">
              <h4 class="text-xs font-semibold text-text-primary uppercase tracking-wider mb-2">Comprobaciones:</h4>
              
              @for (res of validationResults(); track $index) {
                <div class="flex items-start gap-2 text-xs bg-bg-tertiary p-2 rounded border" [ngClass]="res.ok ? 'border-accent-green/30' : 'border-accent-red/30'">
                  @if (res.ok) {
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-accent-green shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  } @else {
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-accent-red shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  }
                  <span [ngClass]="res.ok ? 'text-accent-green/90' : 'text-accent-red/90'">{{ res.message }}</span>
                </div>
              }

              @if (challengePassed()) {
                <div class="mt-4 p-3 bg-accent-green/10 border border-accent-green/30 rounded-lg text-center animate-fade-in">
                   <p class="text-sm font-bold text-accent-green mt-1">¡Reto Completado! 🎉</p>
                </div>
              }
            </div>
          }
        }
      </div>
    </aside>
  `,
  styles: `
    .animate-fade-in {
      animation: fadeIn 0.3s ease-in-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-5px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `
})
export class ChallengeSidebarComponent {
  private challengeService = inject(ChallengeService);
  
  // Emisor para rellenar el editor con las reglas iniciales de un reto
  loadInitialRules = output<string>();

  challenges = this.challengeService.challenges;
  activeChallenge = this.challengeService.activeChallenge;

  validationResults = signal<{message: string, ok: boolean}[]>([]);
  challengePassed = signal(false);

  loadChallenge(challenge: Challenge) {
    this.challengeService.setActiveChallenge(challenge.id);
    this.validationResults.set([]);
    this.challengePassed.set(false);
    this.loadInitialRules.emit(challenge.initialRules);
  }

  clearChallenge() {
    this.challengeService.setActiveChallenge(null);
    this.validationResults.set([]);
    this.challengePassed.set(false);
  }

  validateChallenge() {
    const result = this.challengeService.evaluateChallenge();
    this.validationResults.set(result.results);
    this.challengePassed.set(result.passed);
  }

  getDifficultyClass(diff: string): string {
    switch (diff) {
      case 'Fácil': return 'bg-accent-green/20 text-accent-green';
      case 'Media': return 'bg-accent-amber/20 text-accent-amber';
      case 'Difícil': return 'bg-accent-red/20 text-accent-red border border-accent-red/30';
      default: return 'bg-bg-tertiary text-text-muted';
    }
  }
}
