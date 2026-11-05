import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-excel-export-btn',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './excel-export-btn.component.html',
  styleUrls: ['./excel-export-btn.component.css']
})
export class ExcelExportBtnComponent {
  /**
   * API endpoint to fetch export data from (e.g. '/export/won-lost')
   */
  @Input() endpoint: string = '';

  /**
   * Filter parameters to pass to the endpoint (e.g. { dateRange: 'today', ... })
   */
  @Input() filters: any = {};

  /**
   * Default filename without extension
   */
  @Input() fileName: string = 'Report_Export';

  /**
   * Optional button label text
   */
  @Input() buttonText: string = 'Export Excel';

  exporting: boolean = false;

  constructor(private api: ApiService) {}

  private formatDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  exportToExcel(): void {
    if (!this.endpoint) {
      console.error('[ExcelExportBtn] No endpoint provided for export');
      return;
    }

    if (this.exporting) return;
    this.exporting = true;

    // Resolve dateRange into explicit startDate & endDate if not already explicitly provided
    const cleanParams: any = {};
    const input = { ...(this.filters || {}) };

    const now = new Date();
    const range = (input.dateRange || '').toLowerCase();

    if (!input.startDate || !input.endDate) {
      if (range === 'today') {
        const todayStr = this.formatDate(now);
        input.startDate = todayStr;
        input.endDate = todayStr;
      } else if (range === 'yesterday') {
        const y = new Date();
        y.setDate(now.getDate() - 1);
        const yStr = this.formatDate(y);
        input.startDate = yStr;
        input.endDate = yStr;
      } else if (range === 'this_week') {
        const day = now.getDay();
        const diffToMonday = (day === 0 ? -6 : 1) - day;
        const monday = new Date(now);
        monday.setDate(now.getDate() + diffToMonday);
        input.startDate = this.formatDate(monday);
        input.endDate = this.formatDate(now);
      } else if (range === 'this_month') {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        input.startDate = this.formatDate(firstDay);
        input.endDate = this.formatDate(now);
      } else if (range === 'last_month') {
        const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        input.startDate = this.formatDate(firstDayLastMonth);
        input.endDate = this.formatDate(lastDayLastMonth);
      } else if (range === 'ytd') {
        const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
        input.startDate = this.formatDate(firstDayOfYear);
        input.endDate = this.formatDate(now);
      } else if (range === 'prev_year') {
        const firstDayPrevYear = new Date(now.getFullYear() - 1, 0, 1);
        const lastDayPrevYear = new Date(now.getFullYear() - 1, 11, 31);
        input.startDate = this.formatDate(firstDayPrevYear);
        input.endDate = this.formatDate(lastDayPrevYear);
      }
    }

    // Clean up empty/undefined filters
    Object.keys(input).forEach(k => {
      if (input[k] !== undefined && input[k] !== null && input[k] !== '') {
        cleanParams[k] = input[k];
      }
    });

    this.api.get(this.endpoint, cleanParams).subscribe({
      next: (res: any) => {
        this.exporting = false;
        const rows = res.data || [];
        if (!Array.isArray(rows) || rows.length === 0) {
          Swal.fire({
            icon: 'info',
            title: 'No Records Found',
            text: 'There is no data matching the current filter to export.',
            confirmButtonColor: '#4f46e5'
          });
          return;
        }

        this.generateExcelFile(rows);
      },
      error: (err: any) => {
        this.exporting = false;
        console.error('[ExcelExportBtn] Export failed:', err);
        Swal.fire({
          icon: 'error',
          title: 'Export Failed',
          text: err.error?.message || err.message || 'Failed to export data to Excel.',
          confirmButtonColor: '#4f46e5'
        });
      }
    });
  }

  private generateExcelFile(data: any[]): void {
    try {
      const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
      const workbook: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

      // Auto-size columns based on maximum cell lengths
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      const colWidths: any[] = [];
      for (let C = range.s.c; C <= range.e.c; ++C) {
        let maxLen = 10;
        for (let R = range.s.r; R <= range.e.r; ++R) {
          const cell = worksheet[XLSX.utils.encode_cell({ r: R, c: C })];
          if (cell && cell.v) {
            const len = String(cell.v).length;
            if (len > maxLen) maxLen = len;
          }
        }
        colWidths.push({ wch: Math.min(maxLen + 3, 50) });
      }
      worksheet['!cols'] = colWidths;

      const dateStr = new Date().toISOString().slice(0, 10);
      const safeFileName = `${this.fileName}_${dateStr}.xlsx`;

      XLSX.writeFile(workbook, safeFileName);
    } catch (error: any) {
      console.error('[ExcelExportBtn] Error building Excel file:', error);
      Swal.fire({
        icon: 'error',
        title: 'File Generation Failed',
        text: 'Failed to create the Excel file. Please try again.',
        confirmButtonColor: '#4f46e5'
      });
    }
  }
}
