import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ivr',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ivr.component.html',
  styleUrls: ['./ivr.component.css']
})
export class IvrComponent {
  flows = [
    { name: 'Main Office IVR', number: '+911234599999', active: true },
    { name: 'Support Hotline', number: '+911234588888', active: true },
    { name: 'Sales Inquiry', number: '+911234577777', active: false },
  ];
}
