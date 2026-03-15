import { Injectable, signal } from '@angular/core';

export interface PacketAnimation {
  id: number;
  source: string;
  dest: string;
  verdict: string;
  protocol: string;
}

@Injectable({ providedIn: 'root' })
export class AnimationBusService {
  readonly animationSignal = signal<PacketAnimation | null>(null);

  emitAnimation(source: string, dest: string, verdict: string, protocol: string) {
    this.animationSignal.set(null); // Force signal update even if object is similar
    
    // Adding a tiny tick to ensure change detection catches the rapid set if using `effect`
    setTimeout(() => {
        this.animationSignal.set({
          id: Date.now() + Math.random(),
          source,
          dest,
          verdict,
          protocol
        });
    }, 10);
  }
}
