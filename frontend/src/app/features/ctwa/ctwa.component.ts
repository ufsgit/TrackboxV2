import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ctwa',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ctwa.component.html',
  styleUrls: ['./ctwa.component.css']
})
export class CtwaComponent {
  links = [
    { name: 'Instagram Bio Link', shortCode: 'ur_bio', message: 'Hi, I saw your Instagram profile...', clicks: 1240, conversions: 85 },
    { name: 'Facebook Ad - Summer', shortCode: 'fb_sum', message: 'I want to know more about the summer sale', clicks: 3500, conversions: 210 },
  ];
}
