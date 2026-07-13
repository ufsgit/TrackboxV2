import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ecommerce',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ecommerce.component.html',
  styleUrls: ['./ecommerce.component.css']
})
export class EcommerceComponent {
  products = [
    { name: 'Wireless Headphones', price: '2,999', stock: 45 },
    { name: 'Smart Watch Series 7', price: '4,499', stock: 22 },
    { name: 'Bluetooth Speaker', price: '1,299', stock: 89 },
    { name: 'USB-C Fast Charger', price: '799', stock: 156 },
  ];
}
