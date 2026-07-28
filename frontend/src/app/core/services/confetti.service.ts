import { Injectable } from '@angular/core';
import confetti from 'canvas-confetti';

@Injectable({
  providedIn: 'root'
})
export class ConfettiService {

  constructor() { }

  /**
   * Fires a quick, lightweight confetti burst suitable for standard CRM success actions.
   */
  fireSuccessBurst() {
    const duration = 2000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 20, spread: 360, ticks: 60, zIndex: 10000 };

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 20 * (timeLeft / duration);
      
      // Fire from both sides
      confetti({
        ...defaults,
        particleCount,
        origin: { x: 0.1, y: Math.random() - 0.2 },
        colors: ['#10B981', '#3B82F6', '#FBBF24'] // On-brand colors
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: 0.9, y: Math.random() - 0.2 },
        colors: ['#10B981', '#3B82F6', '#FBBF24']
      });
    }, 250);
  }
}
