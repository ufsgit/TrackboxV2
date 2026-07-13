import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';

interface Feedback {
  id: string;
  customer: string;
  rating: number; // 1 to 5
  text: string;
  date: string;
  flagged: boolean;
  replied: boolean;
}

@Component({
  selector: 'app-customer-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './customer-feedback.component.html',
  styleUrl: './customer-feedback.component.css'
})
export class CustomerFeedbackComponent implements OnInit {
  avgRating = 4.2;
  totalReviews = 124;
  positiveReviews = 98;
  negativeReviews = 12;

  // View Toggle State
  activeView: 'table' | 'chart' = 'table';

  public doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' }
    }
  };
  public doughnutChartType: ChartType = 'doughnut';
  public doughnutChartData: ChartConfiguration['data'] = {
    labels: ['5 Stars', '4 Stars', '3 Stars', '2 Stars', '1 Star'],
    datasets: [
      {
        data: [65, 33, 14, 8, 4],
        backgroundColor: ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444'],
        borderWidth: 0
      }
    ]
  };

  public radarChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    }
  };
  public radarChartType: ChartType = 'radar';
  public radarChartData: ChartConfiguration['data'] = {
    labels: ['Punctuality', 'Professionalism', 'Issue Resolution', 'Communication', 'Cleanliness'],
    datasets: [
      {
        data: [85, 92, 78, 88, 95],
        label: 'Quality Score',
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: '#4f46e5',
        pointBackgroundColor: '#4f46e5',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#4f46e5'
      }
    ]
  };

  feedbacks: Feedback[] = [
    { id: 'FB-01', customer: 'Alice Johnson', rating: 5, text: 'Amazing service! The technician was very polite and finished early.', date: 'Today, 10:30 AM', flagged: false, replied: false },
    { id: 'FB-02', customer: 'Bob Smith', rating: 2, text: 'The installation was delayed by 3 hours without prior notice.', date: 'Yesterday, 2:15 PM', flagged: false, replied: false },
    { id: 'FB-03', customer: 'Charlie Davis', rating: 4, text: 'Good experience overall. The product works perfectly fine.', date: 'Oct 24, 2023', flagged: false, replied: true },
    { id: 'FB-04', customer: 'Dana White', rating: 1, text: 'Horrible! They left a mess in my living room.', date: 'Oct 23, 2023', flagged: false, replied: false },
    { id: 'FB-05', customer: 'Evan Wright', rating: 5, text: 'Very professional. Highly recommend.', date: 'Oct 22, 2023', flagged: false, replied: true },
  ];

  searchTerm: string = '';

  get filteredFeedbacks(): Feedback[] {
    if (!this.searchTerm.trim()) {
      return this.feedbacks;
    }
    const term = this.searchTerm.toLowerCase();
    return this.feedbacks.filter(fb => 
      fb.customer.toLowerCase().includes(term) ||
      fb.text.toLowerCase().includes(term)
    );
  }

  toastMessage: string | null = null;
  toastTimeout: any;

  ngOnInit() {}

  showToast(message: string) {
    this.toastMessage = message;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => { this.toastMessage = null; }, 3000);
  }

  getStars(rating: number): number[] {
    return Array(rating).fill(0);
  }

  getEmptyStars(rating: number): number[] {
    return Array(5 - rating).fill(0);
  }

  reply(fb: Feedback) {
    if (fb.replied) {
      this.showToast(`Already replied to ${fb.customer}`);
      return;
    }
    fb.replied = true;
    this.showToast(`Reply sent to ${fb.customer}`);
  }

  flag(fb: Feedback) {
    fb.flagged = !fb.flagged;
    if (fb.flagged) {
      this.showToast(`Flagged review from ${fb.customer} for moderation.`);
    } else {
      this.showToast(`Removed flag from ${fb.customer}'s review.`);
    }
  }
}
