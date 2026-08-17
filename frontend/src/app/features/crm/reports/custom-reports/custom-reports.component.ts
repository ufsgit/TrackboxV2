import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-custom-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './custom-reports.component.html',
  styleUrl: './custom-reports.component.css'
})
export class CustomReportsComponent implements OnInit {
  activeTab: string = 'employee';
  loading: boolean = false;
  
  // Filters
  startDate: string = '';
  endDate: string = '';
  studentStatus: string = 'Converted';
  
  // Data
  employeeData: any[] = [];
  studentData: any[] = [];
  followUpData: any[] = [];
  teamData: any[] = [];
  todaysData: any[] = [];
  rawData: any[] = [];
  
  // Charts
  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: { legend: { display: false } }
  };
  barChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{ data: [], backgroundColor: '#4f46e5', label: 'Conversions' }]
  };

  constructor(private api: ApiService) {
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(today.getMonth() - 1);
    this.endDate = today.toISOString().split('T')[0];
    this.startDate = lastMonth.toISOString().split('T')[0];
  }

  ngOnInit() {
    this.loadData();
  }

  setTab(tab: string) {
    this.activeTab = tab;
    this.loadData();
  }

  loadData() {
    this.loading = true;
    let url = '';
    let params: any = {};
    
    switch (this.activeTab) {
      case 'employee':
        url = '/analytics/custom/employee-productivity';
        params = { startDate: this.startDate, endDate: this.endDate };
        break;
      case 'student':
        url = '/analytics/custom/student-pipeline';
        params = { status: this.studentStatus };
        break;
      case 'followup':
        url = '/analytics/custom/follow-up';
        params = { startDate: this.startDate, endDate: this.endDate };
        break;
      case 'team':
        url = '/analytics/custom/team-productivity';
        break;
      case 'today':
        url = '/analytics/custom/todays-activity';
        break;
      case 'raw':
        url = '/analytics/custom/raw-data';
        break;
    }
    
    this.api.get(url, params).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          this.bindData(this.activeTab, res.data);
        }
      },
      error: () => {
        this.loading = false;
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load report data' });
      }
    });
  }

  bindData(tab: string, data: any[]) {
    if (tab === 'employee') {
      this.employeeData = data;
      this.barChartData = {
        labels: data.map(d => `${d.employeeName || 'Unassigned'} (${d.employeeCode || '-'})`),
        datasets: [{ data: data.map(d => d.conversionCount), backgroundColor: '#4f46e5', label: 'Conversions' }]
      };
    } else if (tab === 'student') {
      this.studentData = data;
    } else if (tab === 'followup') {
      this.followUpData = data;
    } else if (tab === 'team') {
      this.teamData = data;
    } else if (tab === 'today') {
      this.todaysData = data;
    } else if (tab === 'raw') {
      this.rawData = data;
    }
  }

  exportRawData() {
    if (!this.rawData || this.rawData.length === 0) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No data available to export' });
      return;
    }
    
    const headers = ['ID', 'Employee Name', 'Contact Name', 'Status', 'Date'];
    const csvData = this.rawData.map(row => [
      row.id,
      `"${row.employeeName || 'Unassigned'}"`,
      `"${row.contactName || ''}"`,
      `"${row.status || ''}"`,
      `"${new Date(row.date).toLocaleString()}"`
    ]);
    
    const csvContent = [headers.join(','), ...csvData.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `raw_data_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
