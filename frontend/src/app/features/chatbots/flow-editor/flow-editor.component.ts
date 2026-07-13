import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-flow-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './flow-editor.component.html',
  styleUrls: ['./flow-editor.component.css']
})
export class FlowEditorComponent implements OnInit {
  botId: string | null = null;
  bot: any = null;
  loading = true;
  saving = false;
  
  nodes: any[] = [];
  selectedNode: any = null;

  nodeTypes = [
    { type: 'message', label: 'Message', icon: 'bi-chat-left-text', color: '#3b82f6' },
    { type: 'interactive', label: 'Buttons', icon: 'bi-menu-button-wide', color: '#8b5cf6' },
    { type: 'ai_response', label: 'AI Response', icon: 'bi-robot', color: '#10b981' },
    { type: 'transfer', label: 'Transfer', icon: 'bi-person-badge', color: '#f59e0b' },
    { type: 'end', label: 'End Flow', icon: 'bi-stop-circle', color: '#ef4444' }
  ];

  constructor(private route: ActivatedRoute, private api: ApiService) {}

  ngOnInit() {
    this.botId = this.route.snapshot.paramMap.get('id');
    this.loadBot();
  }

  loadBot() {
    this.api.get(`/chatbots`).subscribe((res: any) => {
      this.bot = res.data.find((b: any) => b.id.toString() === this.botId);
      if (this.bot) {
        const flow = typeof this.bot.flow === 'string' ? JSON.parse(this.bot.flow) : this.bot.flow;
        this.nodes = this.normalizeNodes(flow?.nodes || []);
      }
      this.loading = false;
    });
  }

  // Ensure all nodes and buttons have required fields (e.g. next: null)
  normalizeNodes(nodes: any[]): any[] {
    return nodes.map(node => ({
      ...node,
      next: node.next ?? null,
      buttons: (node.buttons || []).map((btn: any) => ({
        ...btn,
        next: btn.next ?? null
      }))
    }));
  }

  addNode(type: string) {
    const newNode = {
      id: 'n_' + Date.now(),
      type,
      content: type === 'message' ? 'Hello! How can I help?' : 'New Step',
      next: null,
      buttons: type === 'interactive' ? [{ id: 'btn_1', title: 'Option 1', next: null }] : [],
      x: 50 + (this.nodes.length * 20),
      y: 50 + (this.nodes.length * 20)
    };
    this.nodes.push(newNode);
    this.selectNode(newNode);
  }

  selectNode(node: any) {
    // Normalize buttons to ensure 'next' property always exists
    if (node.buttons) {
      node.buttons = node.buttons.map((btn: any) => ({ ...btn, next: btn.next ?? null }));
    }
    this.selectedNode = node;
  }

  deleteNode(id: string) {
    this.nodes = this.nodes.filter(n => n.id !== id);
    if (this.selectedNode?.id === id) this.selectedNode = null;
  }

  addButton() {
    if (!this.selectedNode || this.selectedNode.buttons.length >= 3) return;
    this.selectedNode.buttons.push({
      id: 'btn_' + (this.selectedNode.buttons.length + 1) + '_' + Math.random().toString(36).substr(2, 5),
      title: 'New Option',
      next: null
    });
  }

  saveFlow() {
    this.saving = true;
    const payload = {
      ...this.bot,
      flow: { nodes: this.nodes, edges: [] }
    };
    this.api.put(`/chatbots/${this.botId}`, payload).subscribe({
      next: () => {
        this.saving = false;
        alert('Workflow saved successfully!');
      },
      error: () => {
        this.saving = false;
        alert('Error saving workflow');
      }
    });
  }

  getTypeInfo(type: string) {
    return this.nodeTypes.find(nt => nt.type === type) || this.nodeTypes[0];
  }
}
