import { Injectable } from '@angular/core';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import confetti from 'canvas-confetti';


@Injectable({
  providedIn: 'root'
})
export class AnimationService {

  constructor() { }

  triggerConfetti() {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    
    frame();
  }

  triggerConversionSuccess() {
    this.triggerConfetti();
  }
}
