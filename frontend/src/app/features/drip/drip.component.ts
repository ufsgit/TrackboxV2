import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-drip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './drip.component.html',
  styleUrls: ['./drip.component.css']
})
export class DripComponent {
  sequences = [
    { 
      name: 'Welcome & Onboarding', 
      trigger: 'User Sign-up', 
      status: 'Active', 
      inProgress: 145, 
      completed: 1205,
      steps: [
        { type: 'message', active: true },
        { type: 'delay', active: true },
        { type: 'message', active: true },
        { type: 'delay', active: false },
        { type: 'ivr', active: false }
      ]
    },
    { 
      name: 'Abandoned Checkout Recovery', 
      trigger: 'Cart Idle (20m)', 
      status: 'Active', 
      inProgress: 42, 
      completed: 850,
      steps: [
        { type: 'message', active: true },
        { type: 'delay', active: true },
        { type: 'message', active: false }
      ]
    },
    { 
      name: 'Post-Purchase Survey', 
      trigger: 'Order Delivered', 
      status: 'Draft', 
      inProgress: 0, 
      completed: 0,
      steps: [
        { type: 'delay', active: false },
        { type: 'message', active: false }
      ]
    }
  ];
}
