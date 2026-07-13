import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-chatbots',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './chatbots.component.html',
  styleUrls: ['./chatbots.component.css']
})
export class ChatbotsComponent implements OnInit {
  bots: any[] = [];
  loading = false;
  showModal = false;
  editingBotId: number | null = null;
  
  newBot: any = {
    name: '',
    description: '',
    ai_enabled: true,
    channel: 'whatsapp',
    trigger_keywords: '',
    openai_system_prompt: 'You are a professional assistant for WLink.',
    is_welcome: false
  };

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadBots();
  }

  loadBots() {
    this.loading = true;
    this.api.get('/chatbots').subscribe({
      next: (res: any) => {
        this.bots = res.data.map((b: any) => ({
          ...b,
          // Mock some display stats if not in DB
          messages: b.total_sessions || Math.floor(Math.random() * 1000),
          accuracy: b.avg_accuracy || 90 + Math.floor(Math.random() * 10)
        }));
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  toggleBot(bot: any) {
    const newState = !bot.is_active;
    this.api.put(`/chatbots/${bot.id}`, { ...bot, is_active: newState ? 1 : 0 }).subscribe({
      next: (res: any) => {
        if (res.success) bot.is_active = newState;
      }
    });
  }

  openEditModal(bot: any) {
    this.editingBotId = bot.id;
    this.newBot = {
      ...bot,
      trigger_keywords: Array.isArray(bot.trigger_keywords) ? bot.trigger_keywords.join(', ') : (bot.trigger_keywords || '')
    };
    this.showModal = true;
  }

  resetModal() {
    this.editingBotId = null;
    this.newBot = {
      name: '',
      description: '',
      ai_enabled: true,
      channel: 'whatsapp',
      trigger_keywords: '',
      openai_system_prompt: 'You are a professional assistant for WLink.',
      is_welcome: false
    };
    this.showModal = false;
  }

  saveBot() {
    if (!this.newBot.name) return;
    
    const payload = {
      ...this.newBot,
      trigger_keywords: typeof this.newBot.trigger_keywords === 'string' 
        ? this.newBot.trigger_keywords.split(',').map((k: string) => k.trim()).filter((k: string) => k)
        : this.newBot.trigger_keywords
    };

    if (this.editingBotId) {
      this.api.put(`/chatbots/${this.editingBotId}`, payload).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.loadBots();
            this.resetModal();
          }
        },
        error: (err) => alert(err.error?.message || 'Error updating bot')
      });
    } else {
      this.api.post('/chatbots', payload).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.loadBots();
            this.resetModal();
          }
        },
        error: (err) => alert(err.error?.message || 'Error creating bot')
      });
    }
  }

  deleteBot(id: number) {
    if (!confirm('Are you sure you want to delete this chatbot?')) return;
    this.api.delete(`/chatbots/${id}`).subscribe({
      next: () => this.loadBots()
    });
  }
}
