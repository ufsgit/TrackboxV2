import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-quotations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="report-container" style="display: flex; flex-direction: column; gap: 32px;">
      
      <!-- Header -->
      <div class="flex justify-between items-center" style="flex-wrap: wrap; gap: 16px;">
        <div>
          <h2 class="fw-bold mb-2" style="color: #1e293b;">Quotations</h2>
          <p class="text-muted mb-0" style="font-size: 0.95rem;">Manage client quotations and proposals</p>
        </div>
        <!-- <button class="btn btn-primary" (click)="openCreateModal()" style="padding: 10px 24px; border-radius: 12px; font-weight: 600; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2); border: none; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);">
          <i class="bi bi-plus-lg me-2"></i> Create Quotation
        </button> -->
      </div>

      <!-- KPI Cards (4 Cards) -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon icon-blue"><i class="bi bi-file-earmark-text"></i></div>
          <div class="stat-info">
            <label>Total Quotations</label>
            <h3>128</h3>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-orange"><i class="bi bi-hourglass-split"></i></div>
          <div class="stat-info">
            <label>Pending Approval</label>
            <h3>24</h3>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-green"><i class="bi bi-check-circle"></i></div>
          <div class="stat-info">
            <label>Accepted</label>
            <h3>82</h3>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-slate"><i class="bi bi-clock-history"></i></div>
          <div class="stat-info">
            <label>Expired</label>
            <h3>15</h3>
          </div>
        </div>
      </div>

      <!-- Data Table -->
      <div class="chart-card" style="background: white; border-radius: 24px; box-shadow: 0 4px 12px -4px rgba(17, 24, 39, 0.05); border: 1px solid rgba(229, 231, 235, 0.8); overflow: hidden;">
        <div class="flex justify-between items-center" style="padding: 24px 32px; border-bottom: 1px solid #f1f5f9;">
          <h5 class="fw-bold mb-0" style="color: #1e293b; font-size: 1.15rem;">Recent Quotations</h5>
          
          <div class="flex gap-2" style="gap: 10px;">
             <input type="text" [(ngModel)]="searchTerm" class="form-control" placeholder="Search quotations..." style="border-radius: 12px; padding: 8px 16px; border: 1px solid #e2e8f0; font-size: 0.9rem;">
             <button class="btn btn-light" (click)="showAction('Filters Menu Toggled')" style="border-radius: 12px; font-weight: 600; color: #475569; border: 1px solid #e2e8f0;"><i class="bi bi-filter"></i> Filter</button>
          </div>
        </div>
        
        <div class="table-responsive p-0">
          <table style="width: 100%; border-collapse: collapse; text-align: left; min-width: 800px;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                <th style="padding: 16px 32px; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Quote #</th>
                <th style="padding: 16px 20px; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Client</th>
                <th style="padding: 16px 20px; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Date</th>
                <th style="padding: 16px 20px; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Amount</th>
                <th style="padding: 16px 20px; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Status</th>
                <th style="padding: 16px 32px; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let quote of filteredQuotations; let last = last" [ngStyle]="{'border-bottom': last ? 'none' : '1px solid #f1f5f9'}" style="transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
                <td style="padding: 20px 32px; font-weight: 700; color: #3b82f6; font-size: 0.95rem;">
                  {{ quote.id }}
                </td>
                <td style="padding: 20px 20px;">
                  <div style="font-weight: 700; color: #1e293b; font-size: 0.95rem;">{{ quote.client }}</div>
                  <div style="font-size: 0.8rem; color: #64748b;">{{ quote.email }}</div>
                </td>
                <td style="padding: 20px 20px; color: #475569; font-size: 0.9rem;">
                  {{ quote.date }}
                </td>
                <td style="padding: 20px 20px; font-weight: 700; color: #0f172a; font-size: 0.95rem;">
                  {{ quote.amount }}
                </td>
                <td style="padding: 20px 20px;">
                  <span [ngClass]="getStatusClass(quote.status)">
                    {{ quote.status }}
                  </span>
                </td>
                <td style="padding: 20px 32px; text-align: right;">
                  <button class="btn btn-sm btn-light me-2" (click)="openQuoteModal(quote)" style="border-radius: 8px; border: 1px solid #e2e8f0; color: #475569;" title="View/Edit"><i class="bi bi-pencil"></i></button>
                  <button class="btn btn-sm btn-light" (click)="showAction('Downloading PDF for ' + quote.id)" style="border-radius: 8px; border: 1px solid #e2e8f0; color: #475569;" title="Download PDF"><i class="bi bi-download"></i></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Quote Modal -->
      <div *ngIf="isQuoteModalOpen && editingQuote" style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); z-index: 1050; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.2s ease-out;">
        <div style="background: white; border-radius: 24px; padding: 32px; width: 600px; max-width: 90vw; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);">
           <h3 style="font-weight: 800; color: #1e293b; margin-bottom: 24px; font-size: 1.5rem;">Quotation Details</h3>
           
           <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 32px;">
             <div>
               <label style="display: block; font-size: 0.85rem; font-weight: 700; color: #475569; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;">Quote #</label>
               <input type="text" class="form-control" [(ngModel)]="editingQuote.id" style="border-radius: 12px; border: 1px solid #cbd5e1; padding: 12px 16px; font-size: 0.95rem; box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);">
             </div>
             <div>
               <label style="display: block; font-size: 0.85rem; font-weight: 700; color: #475569; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;">Date</label>
               <input type="date" class="form-control" [(ngModel)]="editingQuote.date" style="border-radius: 12px; border: 1px solid #cbd5e1; padding: 12px 16px; font-size: 0.95rem; box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);">
             </div>
             <div style="grid-column: span 2;">
               <label style="display: block; font-size: 0.85rem; font-weight: 700; color: #475569; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;">Client Name</label>
               <input type="text" class="form-control" [(ngModel)]="editingQuote.client" style="border-radius: 12px; border: 1px solid #cbd5e1; padding: 12px 16px; font-size: 0.95rem; box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);">
             </div>
             <div style="grid-column: span 2;">
               <label style="display: block; font-size: 0.85rem; font-weight: 700; color: #475569; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;">Client Email</label>
               <input type="email" class="form-control" [(ngModel)]="editingQuote.email" style="border-radius: 12px; border: 1px solid #cbd5e1; padding: 12px 16px; font-size: 0.95rem; box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);">
             </div>
             <div>
               <label style="display: block; font-size: 0.85rem; font-weight: 700; color: #475569; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;">Amount</label>
               <input type="text" class="form-control" [(ngModel)]="editingQuote.amount" style="border-radius: 12px; border: 1px solid #cbd5e1; padding: 12px 16px; font-size: 0.95rem; box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);">
             </div>
             <div>
               <label style="display: block; font-size: 0.85rem; font-weight: 700; color: #475569; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;">Status</label>
               <select class="form-select" [(ngModel)]="editingQuote.status" style="border-radius: 12px; border: 1px solid #cbd5e1; padding: 12px 16px; font-size: 0.95rem; box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);">
                 <option>Pending Approval</option>
                 <option>Sent</option>
                 <option>Accepted</option>
                 <option>Rejected</option>
                 <option>Expired</option>
               </select>
             </div>
           </div>

           <div style="display: flex; justify-content: flex-end; gap: 12px;">
             <button class="btn btn-light" (click)="closeQuoteModal()" style="border-radius: 12px; font-weight: 700; padding: 10px 24px; color: #475569; border: 1px solid #e2e8f0; transition: all 0.2s;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='white'">Cancel</button>
             <button class="btn btn-primary" (click)="submitQuote()" style="border-radius: 12px; font-weight: 700; padding: 10px 24px; background: linear-gradient(135deg, #6366f1, #4f46e5); border: none; box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.4); transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform='translateY(0)'">Save Quotation</button>
           </div>
        </div>
      </div>

      <!-- Toast Notification -->
      <div *ngIf="toastMessage" style="position: fixed; bottom: 32px; right: 32px; background: #1e293b; color: white; padding: 16px 24px; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2); z-index: 9999; display: flex; align-items: center; gap: 12px; animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);">
        <i class="bi bi-check-circle-fill text-emerald-400" style="font-size: 1.2rem;"></i>
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
    .stat-card:nth-child(4) { background: linear-gradient(145deg, #f8fafc 0%, #ffffff 100%); border-color: #f1f5f9; }
    
    .stat-card:nth-child(1):hover { box-shadow: 0 20px 32px -10px rgba(59, 130, 246, 0.28); border-color: #bfdbfe; }
    .stat-card:nth-child(2):hover { box-shadow: 0 20px 32px -10px rgba(245, 158, 11, 0.28); border-color: #fde68a; }
    .stat-card:nth-child(3):hover { box-shadow: 0 20px 32px -10px rgba(16, 185, 129, 0.28); border-color: #bbf7d0; }
    .stat-card:nth-child(4):hover { box-shadow: 0 20px 32px -10px rgba(100, 116, 139, 0.28); border-color: #cbd5e1; }

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
    .icon-slate { background: linear-gradient(135deg, #cbd5e1 0%, #64748b 100%); color: #fff; }

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
    .status-pending { background: #fffbeb; color: #d97706; }
    .status-accepted { background: #f0fdf4; color: #15803d; }
    .status-rejected { background: #fef2f2; color: #ef4444; }
    .status-expired { background: #f1f5f9; color: #475569; }
  `]
})
export class QuotationsComponent {
  searchTerm: string = '';
  toastMessage: string | null = null;
  toastTimeout: any;
  
  isCreateModalOpen = false;
  isViewModalOpen = false;
  selectedQuote: any = null;
  isQuoteModalOpen = false;
  editingQuote: any = null;

  quotations = [
    { id: 'QT-2023-1042', client: 'Acme Corp', email: 'billing@acmecorp.com', date: 'Oct 24, 2023', amount: '₹12,450.00', status: 'Pending Approval' },
    { id: 'QT-2023-1041', client: 'Global Industries', email: 'procurement@global.inc', date: 'Oct 22, 2023', amount: '₹8,200.00', status: 'Accepted' },
    { id: 'QT-2023-1040', client: 'Stark Enterprises', email: 'tony@stark.com', date: 'Oct 15, 2023', amount: '₹145,000.00', status: 'Expired' },
    { id: 'QT-2023-1039', client: 'Wayne Tech', email: 'bruce@wayne.com', date: 'Oct 10, 2023', amount: '₹45,200.00', status: 'Rejected' },
    { id: 'QT-2023-1038', client: 'Dunder Mifflin', email: 'michael@dunder.com', date: 'Oct 05, 2023', amount: '₹1,250.00', status: 'Accepted' },
  ];

  getStatusClass(status: string): string {
    const base = 'status-badge ';
    if (status === 'Pending Approval') return base + 'status-pending';
    if (status === 'Accepted') return base + 'status-accepted';
    if (status === 'Rejected') return base + 'status-rejected';
    if (status === 'Expired') return base + 'status-expired';
    return base;
  }

  get filteredQuotations() {
    if (!this.searchTerm) return this.quotations;
    const term = this.searchTerm.toLowerCase();
    return this.quotations.filter(q => 
      q.id.toLowerCase().includes(term) || 
      q.client.toLowerCase().includes(term) ||
      q.status.toLowerCase().includes(term)
    );
  }

  openQuoteModal(quote: any = null) {
    if (quote) {
      this.editingQuote = { ...quote };
    } else {
      this.editingQuote = {
        id: 'QT-' + new Date().getFullYear() + '-' + Math.floor(100 + Math.random() * 900),
        client: '',
        email: '',
        date: new Date().toISOString().split('T')[0],
        amount: '',
        status: 'Pending Approval'
      };
    }
    this.isQuoteModalOpen = true;
  }

  closeQuoteModal() {
    this.isQuoteModalOpen = false;
    this.editingQuote = null;
  }

  submitQuote() {
    this.toastMessage = 'Quotation saved successfully!';
    setTimeout(() => this.toastMessage = '', 3000);
    this.closeQuoteModal();
  }

  openViewModal(quote: any) {
    this.selectedQuote = quote;
    this.isViewModalOpen = true;
  }

  closeViewModal() {
    this.isViewModalOpen = false;
    this.selectedQuote = null;
  }

  showAction(message: string) {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastMessage = message;
    this.toastTimeout = setTimeout(() => {
      this.toastMessage = null;
    }, 3000);
  }
}
