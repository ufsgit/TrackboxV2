import { Component, OnInit, OnDestroy, ElementRef, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { SocketService } from '../../core/services/socket.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-inbox',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inbox.component.html',
  styleUrls: ['./inbox.component.css']
})
export class InboxComponent implements OnInit, OnDestroy {
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  @Input() isEmbedded: boolean = false;
  @Input() embeddedConvoId?: number;
  @Output() closeEmbedded = new EventEmitter<void>();

  conversations: any[] = [];
  selectedConvo: any = null;
  messages: any[] = [];
  newMessage = '';
  loadingConvos = false;
  loadingMessages = false;
  currentUser: any = null;
  currentChannel: string = '';
  searchQuery = '';
  showChannelFilter = false;
  showHeaderMenu = false;
  currentAssignment = 'all'; // 'all' or 'me'

  // Product Picker
  showProductPicker = false;
  products: any[] = [];
  loadingProducts = false;
  productSearch = '';

  // Quick Actions & Input Extras
  showEmojiPicker = false;
  showAgentPicker = false;
  loadingAgents = false;
  availableAgents: any[] = [];
  agents: any[] = [];

  // Sidebar State
  showSidebar = localStorage.getItem('inboxSidebarOpen') === 'true';

  toggleSidebar() {
    this.showSidebar = !this.showSidebar;
    localStorage.setItem('inboxSidebarOpen', String(this.showSidebar));
  }

  // Custom Modal/Dialog States
  showEditContactModal = false;
  isEditingLeadMode = false;
  editContactForm: any = {};
  showAddTagModal = false;
  newTagName = '';
  suggestedTags = ['VIP', 'Warm Lead', 'Cold Lead', 'Support', 'Customer', 'Follow Up', 'Prospect', 'Spam'];
  showConfirmModal = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmType = 'danger'; // 'danger' | 'success' | 'primary'
  confirmActionCallback: () => void = () => {};

  // Template Picker
  showTemplatePicker = false;
  templates: any[] = [];
  loadingTemplates = false;
  templateSearch = '';
  sendingTemplate = false;

  // Attach File Menu
  showAttachMenu = false;

  // Shared Media Library
  showSharedLibrary = false;
  sharedLibraryFiles: any[] = [];
  loadingSharedLibrary = false;
  sharedLibrarySearch = '';
  uploadingToLibrary = false;

  // Voice Recording
  isRecording = false;
  private mediaRecorder: any = null;
  private audioChunks: Blob[] = [];

  // Toast notifications
  toasts: Array<{ id: number; message: string; type: 'success' | 'danger' | 'info' }> = [];
  private nextToastId = 0;

  showToast(message: string, type: 'success' | 'danger' | 'info' = 'success') {
    const id = this.nextToastId++;
    this.toasts.push({ id, message, type });
    setTimeout(() => {
      this.removeToast(id);
    }, 4000);
  }

  removeToast(id: number) {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  emojis = ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🙈', '🙉', '🙊', '💋', '💌', '💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💔', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💣', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤'];

  constructor(
    private api: ApiService,
    private socket: SocketService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.currentUser = JSON.parse(localStorage.getItem('uc_user') || '{}');
    
    if (this.isEmbedded && this.embeddedConvoId) {
      this.loadConversations(this.embeddedConvoId);
    } else {
      this.route.queryParams.subscribe(params => {
        const convoId = params['convoId'];
        if (convoId) {
          this.loadConversations(Number(convoId));
        } else {
          this.loadConversations();
        }
      });
    }

    this.setupSocketListeners();
  }

  ngOnDestroy() {
    // Unsubscribe from socket if needed
  }

  setupSocketListeners() {
    if (this.currentUser?.businessId) {
      this.socket.joinBusiness(this.currentUser.businessId);
      
      this.socket.on('new_message').subscribe((data: any) => {
        const convo = this.conversations.find(c => c.id === data.conversationId);
        if (convo) {
          convo.last_message = data.message.content;
          convo.last_message_at = data.message.created_at;
          // Move to top
          this.conversations = [convo, ...this.conversations.filter(c => c.id !== convo.id)];
        } else {
          // If a filter is applied, only load if it matches
          if (!this.currentChannel) {
             this.loadConversations();
          }
        }

        if (this.selectedConvo?.id === data.conversationId) {
          this.messages.push(data.message);
          this.scrollToBottom();
        }
      });
    }
  }

  filterByChannel(channel: string) {
    this.currentChannel = channel;
    this.selectedConvo = null; // Reset selection
    this.messages = [];
    this.loadConversations();
  }

  filterByAssignment(type: string) {
    this.currentAssignment = type;
    this.selectedConvo = null; // Reset selection
    this.messages = [];
    this.loadConversations();
  }

  onSearch() {
    this.loadConversations();
  }

  loadConversations(convoIdToSelect?: number) {
    this.loadingConvos = true;
    const params: any = {};
    if (this.currentChannel) params.channel = this.currentChannel;
    if (this.searchQuery) params.search = this.searchQuery;
    if (this.currentAssignment === 'me') params.assigned_to = 'me';

    this.api.get('/conversations', params).subscribe({
      next: (res: any) => {
        this.conversations = res.data;
        this.loadingConvos = false;
        
        if (convoIdToSelect) {
          const convo = this.conversations.find(c => c.id === convoIdToSelect);
          if (convo) {
            this.selectConversation(convo);
          } else if (this.conversations.length > 0 && !this.selectedConvo) {
            this.selectConversation(this.conversations[0]);
          }
        } else if (this.conversations.length > 0 && !this.selectedConvo) {
          this.selectConversation(this.conversations[0]);
        }
      },
      error: (err) => {
        this.loadingConvos = false;
        console.error('Failed to load conversations', err);
        // We don't alert here if it's a 401 because the interceptor handles it
        if (err.status !== 401) {
          this.showToast('Failed to load conversations: ' + (err.error?.message || 'Server error'), 'danger');
        }
      }
    });
  }

  selectConversation(convo: any) {
    this.selectedConvo = convo;
    this.loadMessages(convo.id);
  }

  loadMessages(convoId: number) {
    this.loadingMessages = true;
    this.api.get(`/conversations/${convoId}/messages`).subscribe({
      next: (res: any) => {
        this.messages = res.data;
        this.loadingMessages = false;
        this.scrollToBottom();
      },
      error: () => this.loadingMessages = false
    });
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedConvo) return;

    const content = this.newMessage;
    this.newMessage = '';

    this.api.post(`/conversations/${this.selectedConvo.id}/messages`, { content }).subscribe({
      next: (res: any) => {
        if (res.success) {
          // Message will likely come back via socket too, but we can optimistically add it
          // Or wait for the API response
          if (!this.messages.find(m => m.id === res.data.id)) {
            this.messages.push(res.data);
            this.scrollToBottom();
          }
          // Update last message in sidebar
          const convo = this.conversations.find(c => c.id === this.selectedConvo.id);
          if (convo) convo.last_message = content;
        }
      },
      error: (err) => {
        this.showToast('Failed to send: ' + (err.error?.message || 'Error'), 'danger');
      }
    });
  }

  updateStatus(status: string) {
    if (!this.selectedConvo) return;
    this.api.patch(`/conversations/${this.selectedConvo.id}/status`, { status }).subscribe({
      next: () => {
        this.selectedConvo.status = status;
        if (status === 'resolved') {
          // Show a small toast or just reload
          this.loadConversations();
        }
      }
    });
  }

  assignToMe() {
    if (!this.selectedConvo || !this.currentUser?.id) {
      console.warn('Cannot assign: Selected convo or current user ID missing', {convo: this.selectedConvo, user: this.currentUser});
      return;
    }
    this.api.patch(`/conversations/${this.selectedConvo.id}/assign`, { agent_id: this.currentUser.id }).subscribe({
      next: () => {
        this.selectedConvo.assigned_to = this.currentUser.id;
        this.selectedConvo.assigned_name = this.currentUser.name;
        this.showToast('Conversation assigned to you successfully', 'success');
      },
      error: (err) => this.showToast('Failed to assign conversation: ' + (err.error?.message || 'Error'), 'danger')
    });
  }

  openProductPicker() {
    this.showProductPicker = true;
    this.productSearch = '';
    this.loadProducts();
  }

  loadProducts() {
    this.loadingProducts = true;
    this.api.get('/ecommerce/products').subscribe({
      next: (res: any) => {
        this.products = res.data || [];
        this.loadingProducts = false;
      },
      error: () => this.loadingProducts = false
    });
  }

  get filteredProducts() {
    if (!this.productSearch.trim()) return this.products;
    const q = this.productSearch.toLowerCase();
    return this.products.filter((p: any) =>
      p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)
    );
  }

  sendProduct(product: any) {
    if (!this.selectedConvo) return;

    const content = `🛍️ *${product.name}*\n\n${product.description || ''}\n\n💰 Price: ₹${product.price}\n📦 SKU: ${product.sku || 'N/A'}\n✅ In Stock: ${product.stock > 0 ? 'Yes' : 'Out of Stock'}`;

    this.api.post(`/conversations/${this.selectedConvo.id}/messages`, { content }).subscribe({
      next: (res: any) => {
        if (res.success) {
          if (!this.messages.find(m => m.id === res.data.id)) {
            this.messages.push(res.data);
            this.scrollToBottom();
          }
          const convo = this.conversations.find(c => c.id === this.selectedConvo.id);
          if (convo) convo.last_message = `🛍️ ${product.name}`;
        }
      },
      error: (err) => this.showToast('Failed to send product: ' + (err.error?.message || 'Error'), 'danger')
    });

    this.showProductPicker = false;
  }

  // Template Picker
  openTemplatePicker() {
    if (!this.selectedConvo) return;
    this.showTemplatePicker = true;
    this.templateSearch = '';
    this.loadTemplates();
  }

  loadTemplates() {
    this.loadingTemplates = true;
    this.api.get('/templates', { status: 'approved' }).subscribe({
      next: (res: any) => {
        this.templates = res.data || [];
        this.loadingTemplates = false;
      },
      error: () => {
        this.loadingTemplates = false;
        this.showToast('Failed to load templates', 'danger');
      }
    });
  }

  get filteredTemplates() {
    if (!this.templateSearch.trim()) return this.templates;
    const q = this.templateSearch.toLowerCase();
    return this.templates.filter((t: any) =>
      t.name?.toLowerCase().includes(q) || t.body?.toLowerCase().includes(q) || t.category?.toLowerCase().includes(q)
    );
  }

  sendTemplate(template: any) {
    if (!this.selectedConvo || this.sendingTemplate) return;
    this.sendingTemplate = true;

    this.api.post(`/conversations/${this.selectedConvo.id}/messages/template`, {
      template_name: template.name,
      template_language: template.language || 'en',
      template_id: template.id
    }).subscribe({
      next: (res: any) => {
        this.sendingTemplate = false;
        if (res.success) {
          if (!this.messages.find(m => m.id === res.data.id)) {
            this.messages.push(res.data);
            this.scrollToBottom();
          }
          const convo = this.conversations.find(c => c.id === this.selectedConvo.id);
          if (convo) convo.last_message = res.data.content;
          this.showToast(`Template "${template.name}" sent successfully`, 'success');
        }
        this.showTemplatePicker = false;
      },
      error: (err) => {
        this.sendingTemplate = false;
        this.showToast('Failed to send template: ' + (err.error?.message || 'Error'), 'danger');
      }
    });
  }

  // Quick Actions
  ensureAgentsLoaded() {
    if (this.availableAgents.length === 0) {
      this.api.get('/settings/team').subscribe({
        next: (res: any) => {
          const allUsers = res.data || [];
          this.availableAgents = allUsers.filter((u: any) => u.is_active && (u.role === 'agent' || u.role === 'admin' || u.role === 'superadmin'));
        }
      });
    }
  }

  loadContactDetailsForEdit() {
    this.ensureAgentsLoaded();
    this.api.get(`/contacts/${this.selectedConvo.contact_id}`).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.editContactForm = { ...res.data };
          if (typeof this.editContactForm.tags === 'string') {
            try {
              const parsed = JSON.parse(this.editContactForm.tags);
              this.editContactForm.tags = Array.isArray(parsed) ? parsed.join(', ') : parsed;
            } catch(e) { /* ignore */ }
          } else if (Array.isArray(this.editContactForm.tags)) {
            this.editContactForm.tags = this.editContactForm.tags.join(', ');
          }
          this.showEditContactModal = true;
        }
      },
      error: () => this.showToast('Failed to load contact details', 'danger')
    });
  }

  editContact() {
    if (!this.selectedConvo) return;
    this.isEditingLeadMode = false;
    this.loadContactDetailsForEdit();
  }

  editLead() {
    if (!this.selectedConvo) return;
    this.isEditingLeadMode = true;
    this.loadContactDetailsForEdit();
  }

  saveContactEdit() {
    if (!this.selectedConvo || !this.editContactForm.name?.trim()) {
      this.showToast('Full Name is required', 'danger');
      return;
    }
    const payload = { ...this.editContactForm };
    if (payload.tags) {
      payload.tags = payload.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t);
    }
    
    this.api.put(`/contacts/${this.selectedConvo.contact_id}`, payload).subscribe({
      next: () => {
        this.selectedConvo.contact_name = payload.name;
        this.selectedConvo.contact_phone = payload.phone;
        const convo = this.conversations.find(c => c.id === this.selectedConvo.id);
        if (convo) convo.contact_name = payload.name;
        this.showEditContactModal = false;
        this.showToast('Contact details updated successfully', 'success');
      },
      error: (err) => this.showToast('Failed to update contact: ' + (err.error?.message || 'Error'), 'danger')
    });
  }

  isLead(): boolean {
    if (!this.selectedConvo || !this.selectedConvo.tags) return false;
    try {
      const tags = typeof this.selectedConvo.tags === 'string' ? JSON.parse(this.selectedConvo.tags) : this.selectedConvo.tags;
      return Array.isArray(tags) && (tags.includes('lead') || tags.includes('Lead'));
    } catch (e) {
      return false;
    }
  }

  addTag() {
    if (!this.selectedConvo) return;
    this.newTagName = '';
    this.showAddTagModal = true;
  }

  saveTag() {
    if (!this.selectedConvo || !this.newTagName.trim()) return;
    const tag = this.newTagName.trim();
    let tags = [];
    try {
      tags = typeof this.selectedConvo.tags === 'string' ? JSON.parse(this.selectedConvo.tags) : (this.selectedConvo.tags || []);
    } catch(e) { tags = []; }
    
    if (!tags.includes(tag)) {
      tags.push(tag);
      this.api.put(`/contacts/${this.selectedConvo.contact_id}`, { tags: JSON.stringify(tags) }).subscribe({
        next: () => {
          this.selectedConvo.tags = tags;
          this.showAddTagModal = false;
          this.showToast('Tag added successfully', 'success');
        },
        error: (err) => this.showToast('Failed to add tag: ' + (err.error?.message || 'Error'), 'danger')
      });
    } else {
      this.showAddTagModal = false;
    }
  }

  parsedTags(convo: any): string[] {
    if (!convo || !convo.tags) return [];
    try {
      return typeof convo.tags === 'string' ? JSON.parse(convo.tags) : convo.tags;
    } catch (e) {
      return [];
    }
  }

  removeTagFromContact(tag: string) {
    if (!this.selectedConvo) return;
    let tags: string[] = [];
    try {
      tags = typeof this.selectedConvo.tags === 'string' ? JSON.parse(this.selectedConvo.tags) : (this.selectedConvo.tags || []);
    } catch(e) { tags = []; }
    
    tags = tags.filter(t => t !== tag);
    this.api.put(`/contacts/${this.selectedConvo.contact_id}`, { tags: JSON.stringify(tags) }).subscribe({
      next: () => {
        this.selectedConvo.tags = tags;
        this.showToast('Tag removed successfully', 'success');
      },
      error: (err) => this.showToast('Failed to remove tag: ' + (err.error?.message || 'Error'), 'danger')
    });
  }

  get availableTagsToSelect(): string[] {
    const tagsSet = new Set<string>(this.suggestedTags);
    this.conversations.forEach(convo => {
      if (convo.tags) {
        try {
          const parsed = typeof convo.tags === 'string' ? JSON.parse(convo.tags) : convo.tags;
          if (Array.isArray(parsed)) {
            parsed.forEach((tag: string) => {
              if (tag && tag.trim()) {
                tagsSet.add(tag.trim());
              }
            });
          }
        } catch (e) {
          // ignore parsing error
        }
      }
    });
    return Array.from(tagsSet);
  }

  assignAgent() {
    if (!this.selectedConvo) return;
    this.showAgentPicker = true;
    this.loadingAgents = true;
    this.availableAgents = [];
    this.api.get('/settings/team').subscribe({
      next: (res: any) => {
        const allUsers = res.data || [];
        // Filter to only include active team members who can be assigned (agents or admins)
        this.availableAgents = allUsers.filter((u: any) => u.is_active && (u.role === 'agent' || u.role === 'admin' || u.role === 'superadmin'));
        this.loadingAgents = false;
      },
      error: (err) => {
        this.loadingAgents = false;
        this.showAgentPicker = false;
        this.showToast('Failed to load agents: ' + (err.error?.message || 'Error'), 'danger');
      }
    });
  }

  selectAgentToAssign(agent: any) {
    if (!this.selectedConvo || !agent) return;
    this.api.patch(`/conversations/${this.selectedConvo.id}/assign`, { agent_id: agent.id }).subscribe({
      next: () => {
        this.selectedConvo.assigned_name = agent.name;
        this.showAgentPicker = false;
        this.showToast(`Assigned conversation to ${agent.name}`, 'success');
      },
      error: (err) => this.showToast('Failed to assign: ' + (err.error?.message || 'Error'), 'danger')
    });
  }

  blockContact() {
    if (!this.selectedConvo) return;
    this.confirmTitle = 'Block Contact';
    this.confirmMessage = `Are you sure you want to block ${this.selectedConvo.contact_name}? They will no longer receive automated notifications or broadcasts.`;
    this.confirmType = 'danger';
    this.confirmActionCallback = () => {
      this.api.post(`/contacts/${this.selectedConvo.contact_id}/optout`, {}).subscribe({
        next: () => {
          this.selectedConvo.opted_in = 0;
          this.showConfirmModal = false;
          this.showToast('Contact blocked successfully', 'success');
        },
        error: (err) => this.showToast('Failed to block contact: ' + (err.error?.message || 'Error'), 'danger')
      });
    };
    this.showConfirmModal = true;
  }

  deleteSelectedConversation() {
    if (!this.selectedConvo) return;
    this.confirmTitle = 'Delete Conversation';
    this.confirmMessage = `Are you sure you want to permanently delete the conversation with ${this.selectedConvo.contact_name || this.selectedConvo.contact_phone}? This will permanently delete all messages and cannot be undone.`;
    this.confirmType = 'danger';
    this.confirmActionCallback = () => {
      this.api.delete(`/conversations/${this.selectedConvo.id}`).subscribe({
        next: () => {
          this.conversations = this.conversations.filter(c => c.id !== this.selectedConvo.id);
          this.selectedConvo = null;
          this.messages = [];
          if (this.conversations.length > 0) {
            this.selectConversation(this.conversations[0]);
          }
          this.showConfirmModal = false;
          this.showToast('Conversation deleted successfully', 'success');
        },
        error: (err) => this.showToast('Failed to delete conversation: ' + (err.error?.message || 'Error'), 'danger')
      });
    };
    this.showConfirmModal = true;
  }

  unblockContact() {
    if (!this.selectedConvo) return;
    this.confirmTitle = 'Unblock Contact';
    this.confirmMessage = `Are you sure you want to unblock ${this.selectedConvo.contact_name}? They will be eligible to receive automated updates.`;
    this.confirmType = 'success';
    this.confirmActionCallback = () => {
      this.api.post(`/contacts/${this.selectedConvo.contact_id}/optin`, { source: 'manual' }).subscribe({
        next: () => {
          this.selectedConvo.opted_in = 1;
          this.showConfirmModal = false;
          this.showToast('Contact unblocked successfully', 'success');
        },
        error: (err) => this.showToast('Failed to unblock contact: ' + (err.error?.message || 'Error'), 'danger')
      });
    };
    this.showConfirmModal = true;
  }

  // Input Extras
  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
    this.showAttachMenu = false;
  }

  addEmoji(emoji: string) {
    this.newMessage += emoji;
    this.showEmojiPicker = false;
  }

  // Toggle the attach dropdown menu
  toggleAttachMenu() {
    if (!this.selectedConvo) return;
    this.showAttachMenu = !this.showAttachMenu;
    this.showEmojiPicker = false;
  }

  // Open the Shared Media Library modal
  openSharedLibrary() {
    this.showAttachMenu = false;
    this.showSharedLibrary = true;
    this.sharedLibrarySearch = '';
    this.loadSharedLibraryFiles();
  }

  loadSharedLibraryFiles() {
    this.loadingSharedLibrary = true;
    this.api.get('/media-library').subscribe({
      next: (res: any) => {
        this.sharedLibraryFiles = res.data || [];
        this.loadingSharedLibrary = false;
      },
      error: () => {
        this.loadingSharedLibrary = false;
        this.showToast('Failed to load shared library', 'danger');
      }
    });
  }

  get filteredSharedFiles() {
    if (!this.sharedLibrarySearch.trim()) return this.sharedLibraryFiles;
    const q = this.sharedLibrarySearch.toLowerCase();
    return this.sharedLibraryFiles.filter((f: any) =>
      f.name?.toLowerCase().includes(q) || f.file_type?.toLowerCase().includes(q)
    );
  }

  // Send a file from the shared library as a message
  sendSharedFile(file: any) {
    if (!this.selectedConvo) return;
    this.api.post(`/conversations/${this.selectedConvo.id}/messages`, {
      content: '',
      message_type: file.file_type,
      media_url: file.file_url
    }).subscribe({
      next: (res: any) => {
        if (res.success) {
          if (!this.messages.find((m: any) => m.id === res.data.id)) {
            this.messages.push(res.data);
            this.scrollToBottom();
          }
          const convo = this.conversations.find((c: any) => c.id === this.selectedConvo.id);
          if (convo) convo.last_message = `📎 ${file.name}`;
          this.showToast(`"${file.name}" sent successfully`, 'success');
          this.showSharedLibrary = false;
        }
      },
      error: (err: any) => this.showToast('Failed to send file: ' + (err.error?.message || 'Error'), 'danger')
    });
  }

  // Upload a file directly to the shared library
  uploadToSharedLibrary(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.uploadingToLibrary = true;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);
    this.api.upload('/media-library', formData).subscribe({
      next: (res: any) => {
        this.uploadingToLibrary = false;
        if (res.success) {
          this.sharedLibraryFiles.unshift(res.data);
          this.showToast(`"${res.data.name}" added to shared library`, 'success');
        }
      },
      error: () => {
        this.uploadingToLibrary = false;
        this.showToast('Failed to upload to shared library', 'danger');
      }
    });
    // Reset input so the same file can be re-selected
    event.target.value = '';
  }

  // Delete a file from the shared library
  deleteSharedFile(file: any, event: Event) {
    event.stopPropagation();
    if (!confirm(`Remove "${file.name}" from the shared library?`)) return;
    this.api.delete(`/media-library/${file.id}`).subscribe({
      next: () => {
        this.sharedLibraryFiles = this.sharedLibraryFiles.filter((f: any) => f.id !== file.id);
        this.showToast(`"${file.name}" removed from library`, 'success');
      },
      error: (err: any) => this.showToast('Failed to remove file: ' + (err.error?.message || 'Error'), 'danger')
    });
  }

  // Attach file from user's device (original behaviour)
  attachFromDevice() {
    this.showAttachMenu = false;
    if (!this.selectedConvo) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx';
    
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        this.showToast(`Uploading ${file.name}...`, 'info');
        const formData = new FormData();
        formData.append('file', file);
        
        this.api.upload('/upload', formData).subscribe({
          next: (res: any) => {
             if (res.success && res.url) {
                let type = 'document';
                if (file.type.startsWith('image/')) type = 'image';
                else if (file.type.startsWith('video/')) type = 'video';
                else if (file.type.startsWith('audio/')) type = 'audio';
                
                // Extract relative path so backend can build public ngrok URL
                const relativeUrl = res.url.startsWith('http') ? new URL(res.url).pathname : res.url;
                this.api.post(`/conversations/${this.selectedConvo.id}/messages`, {
                   content: '',
                   message_type: type,
                   media_url: relativeUrl
                }).subscribe({
                   next: () => {
                     this.showToast('File sent successfully', 'success');
                   },
                   error: (err: any) => {
                     this.showToast('Failed to send file: ' + (err.error?.message || err.message), 'danger');
                   }
                });
             }
          },
          error: () => {
             this.showToast('Upload failed', 'danger');
          }
        });
      }
    };
    input.click();
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      try {
        this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
      } catch(err) { }
    }, 100);
  }

  getMediaUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const hostUrl = environment.baseUrl.replace(/\/api$/, '');
    return url.startsWith('/') ? hostUrl + url : hostUrl + '/' + url;
  }

  toggleVoiceRecording() {
    if (!this.selectedConvo) return;

    if (this.isRecording) {
      // Stop recording
      this.isRecording = false;
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
    } else {
      // Start recording
      this.audioChunks = [];
      navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        // Determine best supported MIME type for WhatsApp compatibility
        let options: any;
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options = { mimeType: 'audio/mp4' };
        } else if (MediaRecorder.isTypeSupported('audio/ogg; codecs=opus')) {
          options = { mimeType: 'audio/ogg; codecs=opus' };
        } else if (MediaRecorder.isTypeSupported('audio/webm; codecs=opus')) {
          options = { mimeType: 'audio/webm; codecs=opus' };
        }
        
        this.mediaRecorder = new MediaRecorder(stream, options);
        this.mediaRecorder.ondataavailable = (event: any) => {
          if (event.data.size > 0) {
            this.audioChunks.push(event.data);
          }
        };
        this.mediaRecorder.onstop = () => {
          stream.getTracks().forEach((t: any) => t.stop());
          
          const actualMimeType = this.mediaRecorder.mimeType || 'audio/webm';
          let ext = 'webm';
          if (actualMimeType.includes('mp4')) ext = 'm4a';
          if (actualMimeType.includes('ogg')) ext = 'ogg';

          const blob = new Blob(this.audioChunks, { type: actualMimeType });
          const file = new File([blob], `voice_${Date.now()}.${ext}`, { type: actualMimeType });

          this.showToast('Sending voice message...', 'info');
          const formData = new FormData();
          formData.append('file', file);

          this.api.upload('/upload', formData).subscribe({
            next: (res: any) => {
              if (res.success && res.url) {
                // Extract relative path so backend can build public ngrok URL
                const relativeUrl = res.url.startsWith('http') ? new URL(res.url).pathname : res.url;
                this.api.post(`/conversations/${this.selectedConvo.id}/messages`, {
                  content: '',
                  message_type: 'audio',
                  media_url: relativeUrl
                }).subscribe({
                  next: () => this.showToast('Voice message sent!', 'success'),
                  error: (err) => this.showToast('Failed to send voice message', 'danger')
                });
              }
            },
            error: () => this.showToast('Upload failed', 'danger')
          });
        };
        this.mediaRecorder.start();
        this.isRecording = true;
        this.showToast('Recording... Click mic again to stop', 'info');
      }).catch(err => {
        this.showToast('Microphone access denied', 'danger');
      });
    }
  }
}
