import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sms',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sms.component.html',
  styleUrls: ['./sms.component.css']
})
export class SmsComponent {
  campaigns = [
    { name: 'OTP Verification', senderId: 'URBCHT', status: 'Sent', recipients: 1250 },
    { name: 'Weekend Sale Alert', senderId: 'SALES', status: 'Sent', recipients: 5000 },
    { name: 'Draft Promo', senderId: 'URBCHT', status: 'Draft', recipients: 0 },
  ];
}
