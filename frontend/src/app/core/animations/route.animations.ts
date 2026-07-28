import { trigger, transition, style, query, animate, group } from '@angular/animations';

export const routeTransitionAnimations = trigger('routeAnimations', [
  transition('* => *', [
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
      })
    ], { optional: true }),
    query(':enter', [
      style({ opacity: 0 })
    ], { optional: true }),
    group([
      query(':leave', [
        animate('150ms cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 0 }))
      ], { optional: true }),
      query(':enter', [
        animate('250ms 150ms cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1 }))
      ], { optional: true })
    ])
  ])
]);
