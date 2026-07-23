import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../../core/services/api.service';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.css']
})
export class TimelineComponent implements OnInit, OnChanges {
  @Input() contactId!: number;
  
  timelineEvents: any[] = [];
  loading = false;
  error = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    if (this.contactId) {
      this.fetchTimeline();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contactId'] && !changes['contactId'].firstChange) {
      this.fetchTimeline();
    }
  }

  fetchTimeline() {
    this.loading = true;
    this.error = '';
    this.api.get(`/timeline/${this.contactId}`).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.timelineEvents = res.data;
        } else {
          this.error = res.message || 'Failed to load timeline';
        }
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Error loading timeline';
        this.loading = false;
      }
    });
  }
}

