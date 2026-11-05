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
   * Filter parameters to pass to the endpoint (e.g. { dateRange: 'ytd', search: '...' })
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

  exportToExcel(): void {
    if (!this.endpoint) {
      console.error('[ExcelExportBtn] No endpoint provided for export');
      return;
    }

    if (this.exporting) return;
    this.exporting = true;

    // Clean up empty/undefined filters
    const cleanParams: any = {};
    if (this.filters) {
      Object.keys(this.filters).forEach(k => {
        if (this.filters[k] !== undefined && this.filters[k] !== null && this.filters[k] !== '') {
          cleanParams[k] = this.filters[k];
        }
      });
    }

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
    } catch (err: any) {
      console.error('[ExcelExportBtn] Error building Excel file:', err);
      Swal.fire('Error', 'Failed to generate Excel file on client.', 'error');
    }
  }
}

