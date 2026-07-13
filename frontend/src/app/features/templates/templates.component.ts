import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-templates',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './templates.component.html',
  styleUrls: ['./templates.component.css']
})
export class TemplatesComponent implements OnInit {
  templates: any[] = [];
  loading = false;
  showModal = false;
  showGuide = true;

  newTemplate: any = {
    name: '',
    category: 'MARKETING',
    language: 'en_US',
    header_type: 'TEXT',
    header_content: '',
    body: '',
    footer: '',
    buttons: []
  };

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadTemplates();
  }

  loadTemplates() {
    this.loading = true;
    this.api.get('/templates').subscribe({
      next: (res: any) => {
        this.templates = res.data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  saveTemplate() {
    if (!this.newTemplate.name || !this.newTemplate.body) return;

    this.api.post('/templates', this.newTemplate).subscribe({
      next: (res: any) => {
        if (res.success) {
          // Auto-submit to Meta for approval
          this.api.post(`/templates/${res.data.id}/submit`, {}).subscribe({
            next: () => {
              this.loadTemplates();
              this.showModal = false;
              this.resetNewTemplate();
            }
          });
        }
      },
      error: (err) => alert(err.error?.message || 'Error creating template')
    });
  }

  deleteTemplate(id: number) {
    if (!confirm('Are you sure you want to delete this template?')) return;
    this.api.delete(`/templates/${id}`).subscribe({
      next: () => this.loadTemplates()
    });
  }

  syncTemplates() {
    this.loading = true;
    // In a real app, this would hit Meta API to fetch approved templates
    this.api.get('/templates/sync').subscribe({
      next: () => this.loadTemplates(),
      error: () => this.loadTemplates() // Fallback to load even if sync fails
    });
  }

  addButton() {
    if (!this.newTemplate.buttons) this.newTemplate.buttons = [];
    if (this.newTemplate.buttons.length < 3) {
      this.newTemplate.buttons.push({ type: 'QUICK_REPLY', text: '' });
    }
  }

  removeButton(index: number) {
    this.newTemplate.buttons.splice(index, 1);
  }

  resetNewTemplate() {
    this.newTemplate = {
      name: '',
      category: 'MARKETING',
      language: 'en_US',
      header_type: 'TEXT',
      header_content: '',
      body: '',
      footer: '',
      buttons: []
    };
  }
}
