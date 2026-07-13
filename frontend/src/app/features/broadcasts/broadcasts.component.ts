import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-broadcasts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './broadcasts.component.html',
  styleUrls: ['./broadcasts.component.css']
})
export class BroadcastsComponent implements OnInit {
  broadcasts: any[] = [];
  loading = false;
  saving = false;
  showModal = false;
  activeChannel = 'whatsapp';

  templates: any[] = [];
  availableTags: string[] = [];
  selectedTags: string[] = [];
  audienceCount = 0;
  
  newBroadcast: any = {
    name: '',
    template_id: '',
    channel: 'whatsapp',
    scheduled_at: null
  };

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadBroadcasts();
    this.loadTemplates();
    this.loadTags();
  }

  loadBroadcasts() {
    this.loading = true;
    this.api.get('/broadcasts').subscribe({
      next: (res: any) => {
        this.broadcasts = res.data.map((b: any) => ({
          ...b,
          progress: b.total_recipients ? Math.round((b.total_sent / b.total_recipients) * 100) : 0,
          readRate: b.total_sent ? Math.round((b.total_read / b.total_sent) * 100) : 0
        }));
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  loadTemplates() {
    this.api.get('/templates').subscribe({
      next: (res: any) => this.templates = res.data
    });
  }

  loadTags() {
    this.api.get('/contacts/tags').subscribe({
      next: (res: any) => this.availableTags = res.data
    });
  }

  toggleTag(tag: string) {
    const idx = this.selectedTags.indexOf(tag);
    if (idx > -1) this.selectedTags.splice(idx, 1);
    else this.selectedTags.push(tag);
    this.updateAudienceCount();
  }

  updateAudienceCount() {
    const params = {
      tags: this.selectedTags.join(','),
      channel: this.activeChannel
    };
    this.api.get('/broadcasts/audience-count', params).subscribe({
      next: (res: any) => this.audienceCount = res.data.count
    });
  }

  saveBroadcast() {
    if (!this.newBroadcast.name || !this.newBroadcast.template_id || this.saving) return;
    this.saving = true;

    const payload = {
      ...this.newBroadcast,
      target_tags: this.selectedTags,
      channel: this.activeChannel
    };

    this.api.post('/broadcasts', payload).subscribe({
      next: (res: any) => {
        if (res.success) {
          if (!this.newBroadcast.scheduled_at) {
            this.api.post(`/broadcasts/${res.data.id}/send`, {}).subscribe({
              next: () => {
                this.loadBroadcasts();
                this.showModal = false;
                this.resetForm();
                this.saving = false;
              },
              error: () => this.saving = false
            });
          } else {
            this.loadBroadcasts();
            this.showModal = false;
            this.resetForm();
            this.saving = false;
          }
        } else {
          this.saving = false;
        }
      },
      error: (err) => {
        this.saving = false;
        alert(err.error?.message || 'Error creating broadcast');
      }
    });
  }

  resetForm() {
    this.newBroadcast = { name: '', template_id: '', channel: this.activeChannel, scheduled_at: null };
    this.selectedTags = [];
    this.audienceCount = 0;
  }

  deleteBroadcast(id: number) {
    if (!confirm('Are you sure you want to delete this broadcast?')) return;
    this.api.delete(`/broadcasts/${id}`).subscribe({
      next: () => this.loadBroadcasts()
    });
  }

  setChannel(channel: string) {
    this.activeChannel = channel;
    this.newBroadcast.channel = channel;
    this.updateAudienceCount();
  }
}
