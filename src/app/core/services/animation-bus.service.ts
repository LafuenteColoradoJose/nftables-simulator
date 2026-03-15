import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface PacketAnimation {
  id: number;
  source: string;
  dest: string;
  verdict: string;
  protocol: string;
}

@Injectable({ providedIn: 'root' })
export class AnimationBusService {
  private animationSubject = new Subject<PacketAnimation>();
  readonly animation$ = this.animationSubject.asObservable();

  emitAnimation(source: string, dest: string, verdict: string, protocol: string) {
    this.animationSubject.next({
      id: Date.now() + Math.random(),
      source,
      dest,
      verdict,
      protocol
    });
  }
}
