import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-delivery-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="report-container" style="display: flex; flex-direction: column; gap: 32px;">
      
      <!-- Header -->
      <div class="flex justify-between items-center" style="flex-wrap: wrap; gap: 16px;">
        <div>
          <h2 class="fw-bold mb-2" style="color: #1e293b;">Delivery Management</h2>
          <p class="text-muted mb-0" style="font-size: 0.95rem;">Track shipments, deliveries, and logistics</p>
        </div>
        <button class="btn btn-primary" (click)="showAction('Exporting Delivery Report...')" style="padding: 10px 24px; border-radius: 12px; font-weight: 600; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2); border: none; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);">
          <i class="bi bi-box-arrow-up-right me-2"></i> Export Report
        </button>
      </div>

      <!-- KPI Cards (4 Cards) -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon icon-blue"><i class="bi bi-truck"></i></div>
          <div class="stat-info">
            <label>In Transit</label>
            <h3>34</h3>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-orange"><i class="bi bi-box-seam"></i></div>
          <div class="stat-info">
            <label>Out for Delivery</label>
            <h3>12</h3>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-green"><i class="bi bi-check2-all"></i></div>
          <div class="stat-info">
            <label>Delivered (Today)</label>
            <h3>48</h3>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-red"><i class="bi bi-exclamation-triangle"></i></div>
          <div class="stat-info">
            <label>Delayed</label>
            <h3>3</h3>
          </div>
        </div>
      </div>

      <!-- Data Table -->
      <div class="chart-card" style="background: white; border-radius: 24px; box-shadow: 0 4px 12px -4px rgba(17, 24, 39, 0.05); border: 1px solid rgba(229, 231, 235, 0.8); overflow: hidden;">
        <div class="flex justify-between items-center" style="padding: 24px 32px; border-bottom: 1px solid #f1f5f9;">
          <h5 class="fw-bold mb-0" style="color: #1e293b; font-size: 1.15rem;">Live Deliveries</h5>
          
          <div class="flex gap-2" style="gap: 10px;">
             <input type="text" [(ngModel)]="searchTerm" class="form-control" placeholder="Search tracking #..." style="border-radius: 12px; padding: 8px 16px; border: 1px solid #e2e8f0; font-size: 0.9rem;">
             <button class="btn btn-light" (click)="showAction('Filters Menu Toggled')" style="border-radius: 12px; font-weight: 600; color: #475569; border: 1px solid #e2e8f0;"><i class="bi bi-filter"></i> Filter</button>
          </div>
        </div>
        
        <div class="table-responsive p-0">
          <table style="width: 100%; border-collapse: collapse; text-align: left; min-width: 900px;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                <th style="padding: 16px 32px; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Tracking #</th>
                <th style="padding: 16px 20px; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Product</th>
                <th style="padding: 16px 20px; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Destination</th>
                <th style="padding: 16px 20px; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Expected Date</th>
                <th style="padding: 16px 20px; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Status</th>
                <th style="padding: 16px 32px; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; text-align: right;">Delivery Person</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let delivery of filteredDeliveries; let last = last" [ngStyle]="{'border-bottom': last ? 'none' : '1px solid #f1f5f9'}" style="transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
                <td style="padding: 20px 32px; font-weight: 700; color: #3b82f6; font-size: 0.95rem; cursor: pointer; text-decoration: underline;" (click)="openViewModal(delivery)">
                  {{ delivery.tracking }}
                </td>
                <td style="padding: 20px 20px; font-weight: 600; color: #1e293b; font-size: 0.9rem;">
                  {{ delivery.product }}
                </td>
                <td style="padding: 20px 20px; color: #475569; font-size: 0.9rem;">
                  {{ delivery.destination }}
                </td>
                <td style="padding: 20px 20px; font-weight: 600; color: #0f172a; font-size: 0.9rem;">
                  {{ delivery.date }}
                </td>
                <td style="padding: 20px 20px;">
                  <span [ngClass]="getStatusClass(delivery.status)">
                    {{ delivery.status }}
                  </span>
                </td>
                <td style="padding: 20px 32px; text-align: right;">
                  <div style="display: flex; align-items: center; justify-content: flex-end; gap: 12px;">
                    <div style="font-weight: 600; color: #334155; font-size: 0.9rem;">{{ delivery.person }}</div>
                    <div class="avatar-circle" [ngStyle]="{'background': delivery.color}">{{ delivery.person.charAt(0) }}</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- View Modal -->
      <div *ngIf="isViewModalOpen && selectedDelivery" style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); z-index: 1050; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.2s ease-out;">
        <div style="background: white; border-radius: 24px; padding: 32px; width: 550px; max-width: 90vw; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);">
           <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px;">
             <h3 style="font-weight: 800; color: #1e293b; margin: 0; font-size: 1.5rem;">Delivery Tracking Details</h3>
             <span [ngClass]="getStatusClass(selectedDelivery.status)" style="font-size: 0.8rem; padding: 6px 14px; border-radius: 8px;">{{ selectedDelivery.status }}</span>
           </div>
           
           <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 36px; background: #f8fafc; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0;">
             <div>
               <label style="display: block; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Tracking #</label>
               <div style="font-weight: 700; color: #3b82f6; font-size: 1.05rem;">{{ selectedDelivery.tracking }}</div>
             </div>
             <div>
               <label style="display: block; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Expected Date</label>
               <div style="font-weight: 700; color: #1e293b; font-size: 1.05rem;">{{ selectedDelivery.date }}</div>
             </div>
             <div style="grid-column: span 2;">
               <label style="display: block; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Product / Shipment</label>
               <div style="font-weight: 700; color: #1e293b; font-size: 1.05rem;">{{ selectedDelivery.product }}</div>
             </div>
             <div style="grid-column: span 2; display: flex; align-items: center; gap: 16px; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: -8px;">
               <div style="flex: 1;">
                 <label style="display: block; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Destination</label>
                 <div style="font-weight: 600; color: #0f172a; font-size: 1rem;"><i class="bi bi-geo-alt-fill text-blue-500 me-2"></i>{{ selectedDelivery.destination }}</div>
               </div>
               <div style="flex: 1; border-left: 1px solid #e2e8f0; padding-left: 16px;">
                 <label style="display: block; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Delivery Person</label>
                 <div style="display: flex; align-items: center; gap: 10px;">
                   <div class="avatar-circle" [ngStyle]="{'background': selectedDelivery.color}" style="width: 28px; height: 28px; font-size: 0.7rem;">{{ selectedDelivery.person.charAt(0) }}</div>
                   <div style="font-weight: 600; color: #0f172a; font-size: 0.95rem;">{{ selectedDelivery.person }}</div>
                 </div>
               </div>
             </div>
           </div>

           <div style="display: flex; justify-content: flex-end;">
             <button class="btn btn-light" (click)="closeViewModal()" style="border-radius: 12px; font-weight: 700; padding: 10px 32px; border: 1px solid #cbd5e1; color: #475569; transition: all 0.2s;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='white'">Close</button>
           </div>
        </div>
      </div>
      
      <!-- Toast Notification -->
      <div *ngIf="toastMessage" style="position: fixed; bottom: 32px; right: 32px; background: #1e293b; color: white; padding: 16px 24px; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); z-index: 9999; display: flex; align-items: center; gap: 12px; animation: slideIn 0.3s ease-out;">
        <i class="bi bi-info-circle-fill text-blue-400"></i>
        <span style="font-weight: 600; font-size: 0.95rem;">{{ toastMessage }}</span>
      </div>
      
    </div>
  `,
  styles: [`
    @keyframes slideIn {
      from { transform: translateY(100px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { transform: translateY(20px) scale(0.95); opacity: 0; }
      to { transform: translateY(0) scale(1); opacity: 1; }
    }
    .avatar-circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: white;
      font-size: 0.85rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    /* 3D Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 24px;
      perspective: 1200px;
    }
    .stat-card {
      background: #fff;
      border: 1px solid rgba(229, 231, 235, 0.8);
      border-radius: 24px;
      padding: 32px 28px;
      display: flex;
      align-items: center;
      gap: 20px;
      transition: all 0.45s cubic-bezier(0.25, 0.8, 0.25, 1);
      position: relative;
      overflow: hidden;
      box-shadow: 0 4px 12px -4px rgba(17, 24, 39, 0.05);
      transform-style: preserve-3d;
      transform: perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px);
    }
    .stat-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; height: 6px;
      background: transparent;
      transition: all 0.4s ease;
    }
    .stat-card::after {
      content: '';
      position: absolute;
      top: 0; left: -100%; width: 100%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent);
      transition: all 0.65s cubic-bezier(0.25, 0.8, 0.25, 1);
      pointer-events: none;
      transform: skewX(-20deg) translateZ(5px);
    }
    .stat-card:hover {
      transform: perspective(1000px) translateY(-8px) rotateX(6deg) rotateY(-6deg) translateZ(12px);
      box-shadow: 0 24px 38px -8px rgba(17, 24, 39, 0.12), 0 10px 18px -10px rgba(17, 24, 39, 0.08);
      border-color: transparent;
    }
    .stat-card:hover::after {
      left: 200%;
    }
    
    .stat-card:nth-child(1) { background: linear-gradient(145deg, #eff6ff 0%, #ffffff 100%); border-color: #dbeafe; }
    .stat-card:nth-child(2) { background: linear-gradient(145deg, #fffbeb 0%, #ffffff 100%); border-color: #fef3c7; }
    .stat-card:nth-child(3) { background: linear-gradient(145deg, #f0fdf4 0%, #ffffff 100%); border-color: #dcfce7; }
    .stat-card:nth-child(4) { background: linear-gradient(145deg, #fff1f2 0%, #ffffff 100%); border-color: #ffe4e6; }
    
    .stat-card:nth-child(1):hover { box-shadow: 0 20px 32px -10px rgba(59, 130, 246, 0.28); border-color: #bfdbfe; }
    .stat-card:nth-child(2):hover { box-shadow: 0 20px 32px -10px rgba(245, 158, 11, 0.28); border-color: #fde68a; }
    .stat-card:nth-child(3):hover { box-shadow: 0 20px 32px -10px rgba(16, 185, 129, 0.28); border-color: #bbf7d0; }
    .stat-card:nth-child(4):hover { box-shadow: 0 20px 32px -10px rgba(225, 29, 72, 0.28); border-color: #fecdd3; }

    .stat-icon {
      width: 50px;
      height: 50px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      box-shadow: inset 0 2px 4px rgba(255,255,255,0.1);
      transition: transform 0.45s cubic-bezier(0.25, 0.8, 0.25, 1);
      transform: translateZ(0px);
      flex-shrink: 0;
    }
    .stat-card:hover .stat-icon {
      transform: translateZ(42px) scale(1.08);
      box-shadow: 0 12px 24px -6px rgba(0, 0, 0, 0.2);
    }
    
    .icon-blue { background: linear-gradient(135deg, #74B9FF 0%, #0984E3 100%); color: #fff; }
    .icon-orange { background: linear-gradient(135deg, #FFEAA7 0%, #FDCB6E 100%); color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,0.1); }
    .icon-green { background: linear-gradient(135deg, #55EFC4 0%, #00B894 100%); color: #fff; }
    .icon-red { background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%); color: #e11d48; text-shadow: 0 1px 2px rgba(255,255,255,0.5); }

    .stat-info {
      transition: transform 0.45s cubic-bezier(0.25, 0.8, 0.25, 1);
      transform: translateZ(0px);
    }
    .stat-card:hover .stat-info {
      transform: translateZ(28px);
    }
    .stat-info label {
      display: block;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin-bottom: 4px;
    }
    .stat-info h3 {
      font-size: 1.8rem;
      font-weight: 800;
      color: #1e293b;
      line-height: 1.1;
      margin: 0;
      font-family: 'Inter', sans-serif;
    }
    
    /* Status Badges */
    .status-badge {
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      display: inline-block;
    }
    .status-transit { background: #eff6ff; color: #1d4ed8; }
    .status-out { background: #fffbeb; color: #d97706; }
    .status-delivered { background: #dcfce7; color: #166534; }
    .status-delayed { background: #fef2f2; color: #ef4444; }
  `]
})
export class DeliveryManagementComponent {
  searchTerm: string = '';
  toastMessage: string | null = null;
  toastTimeout: any;

  isViewModalOpen = false;
  selectedDelivery: any = null;

  deliveries = [
    { tracking: 'TRK-8829104', product: 'Server Rack Enterprise X1', destination: 'Miami, FL', date: 'Oct 24, 2023', status: 'In Transit', person: 'FedEx Freight', color: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
    { tracking: 'TRK-8829105', product: 'Office Laptops (50 Units)', destination: 'Austin, TX', date: 'Oct 24, 2023', status: 'Out for Delivery', person: 'Dave Smith', color: 'linear-gradient(135deg, #06b6d4, #0891b2)' },
    { tracking: 'TRK-8829106', product: 'Networking Switches', destination: 'Seattle, WA', date: 'Oct 22, 2023', status: 'Delivered', person: 'UPS Logistics', color: 'linear-gradient(135deg, #f43f5e, #e11d48)' },
    { tracking: 'TRK-8829107', product: 'Aeron Chairs (20 Units)', destination: 'Denver, CO', date: 'Oct 25, 2023', status: 'Delayed', person: 'Freightways', color: 'linear-gradient(135deg, #f59e0b, #d97706)' },
    { tracking: 'TRK-8829108', product: 'Standing Desks (10 Units)', destination: 'New York, NY', date: 'Oct 26, 2023', status: 'In Transit', person: 'DHL Supply Chain', color: 'linear-gradient(135deg, #10b981, #059669)' },
  ];

  getStatusClass(status: string): string {
    const base = 'status-badge ';
    if (status === 'In Transit') return base + 'status-transit';
    if (status === 'Out for Delivery') return base + 'status-out';
    if (status === 'Delivered') return base + 'status-delivered';
    if (status === 'Delayed') return base + 'status-delayed';
    return base;
  }

  get filteredDeliveries() {
    if (!this.searchTerm) return this.deliveries;
    const term = this.searchTerm.toLowerCase();
    return this.deliveries.filter(d => 
      d.tracking.toLowerCase().includes(term) || 
      d.product.toLowerCase().includes(term) ||
      d.status.toLowerCase().includes(term)
    );
  }

  openViewModal(delivery: any) {
    this.selectedDelivery = delivery;
    this.isViewModalOpen = true;
  }

  closeViewModal() {
    this.isViewModalOpen = false;
    this.selectedDelivery = null;
  }

  showAction(message: string) {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastMessage = message;
    this.toastTimeout = setTimeout(() => {
      this.toastMessage = null;
    }, 3000);
  }
}
