import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { Subscription } from 'rxjs';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-visa-leads-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './visa-leads-report.component.html',
  styleUrls: ['./visa-leads-report.component.scss']
})
export class VisaLeadsReportComponent implements OnInit, OnDestroy {
  activeStatus: string = 'all';
  loading: boolean = true;
  refreshing: boolean = false;

  // Search & Filter
  searchQuery: string = '';
  searchTimeout: any;

  // Pagination
  currentPage: number = 1;
  pageSize: number = 20;
  totalCount: number = 0;
  totalPages: number = 1;
  totalAllVisas: number = 0;

  // Data
  leads: any[] = [];
  statusSummary: any[] = [];

  private sub: Subscription = new Subscription();

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.sub.add(
      this.route.queryParams.subscribe(params => {
        if (params['status']) {
          this.activeStatus = params['status'];
        } else {
          this.activeStatus = 'all';
        }
        this.currentPage = 1;
        this.fetchLeads();
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  goBack(): void {
    this.router.navigate(['/crm-dashboard']);
  }

  fetchLeads(isRefresh: boolean = false): void {
    if (isRefresh) {
      this.refreshing = true;
    } else {
      this.loading = true;
    }

    const params: any = {
      status: this.activeStatus,
      search: this.searchQuery.trim(),
      page: this.currentPage,
      limit: this.pageSize
    };

    this.api.get('/visas/leads-report', params).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.refreshing = false;
        if (res && res.success && res.data) {
          this.leads = res.data.leads || [];
          this.totalCount = res.data.pagination?.total || 0;
          this.totalPages = res.data.pagination?.totalPages || 1;
          this.totalAllVisas = res.data.totalAll || 0;
          this.statusSummary = res.data.statusSummary || [];
        }
      },
      error: (err: any) => {
        console.error('Error fetching visa leads report:', err);
        this.loading = false;
        this.refreshing = false;
        this.leads = [];
      }
    });
  }

  switchStatus(statusName: string): void {
    if (this.activeStatus === statusName) return;
    this.activeStatus = statusName;
    this.currentPage = 1;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { status: statusName },
      queryParamsHandling: 'merge'
    });
  }

  onSearchChange(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.currentPage = 1;
      this.fetchLeads();
    }, 300);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.currentPage = 1;
    this.fetchLeads();
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.currentPage = page;
    this.fetchLeads();
  }

  getActiveStatusInfo(): { label: string; color: string; tint: string } {
    if (this.activeStatus === 'all') {
      return {
        label: 'All Visa Leads',
        color: '#2563EB',
        tint: 'rgba(37, 99, 235, 0.12)'
      };
    }
    const match = (this.statusSummary || []).find(s => s.name?.toLowerCase() === this.activeStatus?.toLowerCase());
    const color = match?.color || '#4f46e5';
    return {
      label: match?.name || this.activeStatus,
      color: color,
      tint: this.hexToRgba(color, 0.12)
    };
  }

  getInitials(name: string): string {
    if (!name) return 'V';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  getLocation(city?: string, country?: string): string {
    return [city, country].filter(v => !!v && v.trim() !== '').join(', ');
  }

  hexToRgba(hex: string, alpha: number = 0.12): string {
    if (!hex) return 'rgba(79, 70, 229, 0.12)';
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    if (c.length === 6) {
      const num = parseInt(c, 16);
      return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
    }
    return 'rgba(79, 70, 229, 0.12)';
  }

  exportToExcel(): void {
    if (!this.leads || this.leads.length === 0) return;

    const exportRows = this.leads.map((item, idx) => ({
      '#': idx + 1,
      'Lead / Student': item.contact_name,
      'Phone': item.contact_phone,
      'Email': item.contact_email,
      'Address': item.contact_address || '',
      'Visa Type': item.visa_type,
      'Visa Status': item.visa_status,
      'Application Ref #': item.application_no || '',
      'Assigned Staff': item.assigned_staff_name || '',
      'Visa Date': item.visa_date || '',
      'Submission Date': item.submission_date || '',
      'Created At': item.created_at || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Visa Leads');
    const filename = `visa_leads_${this.activeStatus}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
  }
}
