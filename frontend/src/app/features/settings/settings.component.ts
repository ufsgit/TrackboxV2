import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { CourseManagementComponent } from './course-management/course-management.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, CourseManagementComponent],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  activeTab = localStorage.getItem('activeSettingsTab') || 'whatsapp';

  setActiveTab(tab: string) {
    this.activeTab = tab;
    localStorage.setItem('activeSettingsTab', tab);
  }
  showToken = false;
  showFbToken = false;
  showIgToken = false;
  showIgSecret = false;
  saving = false;
  testing = false;
  saveSuccess = '';
  saveError = '';

  business: any = {};
  team: any[] = [];
  billingData: any = null;
  showInvite = false;
  newAgent = { name: '', email: '', role: 'agent' };

  // Channels Manager (Multi-account)
  socialAccounts: any[] = [];
  showAddChannelModal = false;
  editingAccount: any = null;
  newChannel: any = {
    platform: 'whatsapp',
    account_name: '',
    phone_number: '',
    phone_id: '',
    account_id: '',
    token: '',
    verify_token: '',
    waba_id: '',
    app_id: '',
    app_secret: ''
  };

  webhookUrl = '';
  fbWebhookUrl = '';
  igWebhookUrl = '';

  // ── Lead Fields ──────────────────────────────────
  leadFields: any[] = [];
  leadFieldsLoading = false;
  showAddFieldModal = false;
  editingField: any = null;
  fieldSaving = false;
  newField: any = {
    label: '',
    field_type: 'text',
    options: '',
    is_required: false,
    display_order: 0
  };
  readonly FIELD_TYPES = [
    { value: 'text',     label: 'Text',         icon: 'bi-type' },
    { value: 'number',   label: 'Number',       icon: 'bi-123' },
    { value: 'dropdown', label: 'Dropdown',     icon: 'bi-chevron-down' },
    { value: 'date',     label: 'Date',         icon: 'bi-calendar3' },
    { value: 'dob',      label: 'Date of Birth', icon: 'bi-cake2' },
    { value: 'email',    label: 'Email',        icon: 'bi-envelope' },
    { value: 'phone',    label: 'Phone',        icon: 'bi-telephone' },
    { value: 'textarea', label: 'Textarea',     icon: 'bi-textarea-t' },
  ];
  // ─────────────────────────────────────────────────

  billingPlans = [
    { key: 'starter', name: 'Starter', price: 999, contacts: 1000, broadcasts: 5, agents: 1 },
    { key: 'pro', name: 'Pro', price: 2999, contacts: 10000, broadcasts: 50, agents: 5 },
    { key: 'enterprise', name: 'Enterprise', price: 9999, contacts: 100000, broadcasts: 500, agents: 25 },
  ];

  integrations = [
    { key: 'whatsapp', name: 'WhatsApp Business', desc: 'Official WhatsApp Business API integration', icon: 'bi-whatsapp', color: '#25D366' },
    { key: 'instagram', name: 'Instagram DM', desc: 'Connect your Instagram Business account', icon: 'bi-instagram', color: '#E1306C' },
    { key: 'facebook', name: 'Facebook Messenger', desc: 'Chat with customers on your Facebook Page', icon: 'bi-messenger', color: '#0084FF' },
    { key: 'openai', name: 'OpenAI (GPT-4)', desc: 'Power your chatbots with AI intelligence', icon: 'bi-robot', color: '#10b981' },
    { key: 'woocommerce', name: 'WooCommerce', desc: 'Sync products and orders automatically', icon: 'bi-cart3', color: '#9333ea' },
    { key: 'shopify', name: 'Shopify', desc: 'Import your Shopify catalog', icon: 'bi-bag', color: '#95BF47' },
  ];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadBusiness();
    this.loadSocialAccounts();
    const base = window.location.origin.replace('4200', '3000') + '/api/webhooks';
    this.webhookUrl = `${base}/whatsapp`;
    this.fbWebhookUrl = `${base}/facebook`;
    this.igWebhookUrl = `${base}/instagram`;
  }

  loadBusiness() {
    this.api.get('/settings/business').subscribe({
      next: (res: any) => {
        if (res.success) this.business = res.data;
      },
      error: () => {
        // Use default empty object
        this.business = { name: '', whatsapp_number: '', whatsapp_token: '', whatsapp_phone_id: '', fb_page_id: '', fb_token: '', ig_account_id: '', ig_token: '', ig_app_id: '', ig_app_secret: '', fb_verify_token: 'wlink_fb_verify_token', waba_id: '' };
      }
    });
  }

  loadSocialAccounts() {
    this.api.get('/settings/social-accounts').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.socialAccounts = res.data;
        }
      },
      error: (err) => {
        this.saveError = err.error?.message || 'Failed to load social accounts.';
      }
    });
  }

  openAddChannel() {
    this.editingAccount = null;
    this.newChannel = {
      platform: 'whatsapp',
      account_name: '',
      phone_number: '',
      phone_id: '',
      account_id: '',
      token: '',
      verify_token: 'wlink_verify_token_' + Math.random().toString(36).substring(2, 9),
      waba_id: '',
      app_id: '',
      app_secret: ''
    };
    this.showAddChannelModal = true;
  }

  openEditChannel(account: any) {
    this.editingAccount = account;
    this.newChannel = {
      platform: account.platform,
      account_name: account.account_name || '',
      phone_number: account.phone_number || '',
      phone_id: account.phone_id || '',
      account_id: account.account_id || '',
      token: account.token || '',
      verify_token: account.verify_token || '',
      waba_id: account.waba_id || '',
      app_id: account.app_id || '',
      app_secret: account.app_secret || ''
    };
    this.showAddChannelModal = true;
  }

  closeChannelModal() {
    this.showAddChannelModal = false;
    this.editingAccount = null;
  }

  saveSocialAccount() {
    this.saving = true;
    this.saveSuccess = '';
    this.saveError = '';

    const payload = this.newChannel;
    const request = this.editingAccount 
      ? this.api.put(`/settings/social-accounts/${this.editingAccount.id}`, payload)
      : this.api.post('/settings/social-accounts', payload);

    request.subscribe({
      next: (res: any) => {
        this.saving = false;
        if (res.success) {
          this.saveSuccess = this.editingAccount 
            ? 'Channel updated successfully!' 
            : 'New channel connected successfully!';
          this.loadSocialAccounts();
          this.closeChannelModal();
          setTimeout(() => this.saveSuccess = '', 5000);
        }
      },
      error: (err) => {
        this.saving = false;
        this.saveError = err.error?.message || 'Failed to save channel configuration.';
        setTimeout(() => this.saveError = '', 7000);
      }
    });
  }

  deleteSocialAccount(id: number) {
    if (!confirm('Are you sure you want to disconnect this channel? This will stop all message routing for this account.')) {
      return;
    }
    this.api.delete(`/settings/social-accounts/${id}`).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.saveSuccess = 'Channel disconnected successfully.';
          this.loadSocialAccounts();
          setTimeout(() => this.saveSuccess = '', 5000);
        }
      },
      error: (err) => {
        this.saveError = err.error?.message || 'Failed to disconnect channel.';
        setTimeout(() => this.saveError = '', 7000);
      }
    });
  }

  toggleSocialAccountActive(account: any) {
    const updatedStatus = account.is_active ? 0 : 1;
    this.api.put(`/settings/social-accounts/${account.id}`, {
      account_name: account.account_name,
      phone_number: account.phone_number,
      phone_id: account.phone_id,
      account_id: account.account_id,
      token: account.token,
      verify_token: account.verify_token,
      waba_id: account.waba_id,
      app_id: account.app_id,
      app_secret: account.app_secret,
      is_active: updatedStatus
    }).subscribe({
      next: (res: any) => {
        if (res.success) {
          account.is_active = updatedStatus;
          this.saveSuccess = `Channel ${updatedStatus ? 'enabled' : 'disabled'} successfully.`;
          setTimeout(() => this.saveSuccess = '', 3000);
        }
      },
      error: (err) => {
        this.saveError = err.error?.message || 'Failed to toggle channel status.';
        setTimeout(() => this.saveError = '', 5000);
      }
    });
  }

  testSocialAccountConnection(account: any) {
    account.testing = true;
    account.testResult = null;
    
    this.api.post(`/settings/social-accounts/${account.id}/test`, {}).subscribe({
      next: (res: any) => {
        account.testing = false;
        if (res.success) {
          account.testResult = {
            success: true,
            message: account.platform === 'whatsapp' 
              ? `Connected: ${res.data.verified_name || 'Verified'}`
              : (account.platform === 'instagram'
                  ? `Connected: @${res.data.username || 'Instagram'}`
                  : `Connected: ${res.data.name || 'Facebook Page'}`)
          };
        } else {
          account.testResult = {
            success: false,
            message: res.message || 'Connection failed.'
          };
        }
      },
      error: (err) => {
        account.testing = false;
        account.testResult = {
          success: false,
          message: err.error?.message || 'Connection failed. Verify API token.'
        };
      }
    });
  }

  loadTeam() {
    this.api.get('/settings/team').subscribe({
      next: (res: any) => {
        if (res.success) this.team = res.data;
      }
    });
  }

  loadBilling() {
    this.api.get('/settings/billing').subscribe({
      next: (res: any) => {
        if (res.success) this.billingData = res.data;
      }
    });
  }

  saveWhatsAppConfig() {
    this.saving = true;
    this.saveSuccess = '';
    this.saveError = '';

    this.api.put('/settings/business', {
      name: this.business.name,
      whatsapp_number: this.business.whatsapp_number,
      whatsapp_token: this.business.whatsapp_token,
      whatsapp_phone_id: this.business.whatsapp_phone_id,
      waba_id: this.business.waba_id,
      fb_page_id: this.business.fb_page_id,
      fb_token: this.business.fb_token,
      ig_account_id: this.business.ig_account_id,
      ig_token: this.business.ig_token,
      ig_app_id: this.business.ig_app_id,
      ig_app_secret: this.business.ig_app_secret,
      fb_verify_token: this.business.fb_verify_token
    }).subscribe({
      next: (res: any) => {
        this.saving = false;
        if (res.success) {
          this.saveSuccess = 'Meta API credentials saved successfully!';
          this.business = res.data;
          setTimeout(() => this.saveSuccess = '', 5000);
        }
      },
      error: (err) => {
        this.saving = false;
        this.saveError = err.error?.message || 'Failed to save. Please try again.';
        setTimeout(() => this.saveError = '', 5000);
      }
    });
  }

  testConnection() {
    this.testing = true;
    this.saveSuccess = '';
    this.saveError = '';

    if (!this.business.whatsapp_token || !this.business.whatsapp_phone_id) {
      this.saveError = 'Please enter and save your Access Token and Phone Number ID first.';
      this.testing = false;
      return;
    }

    this.api.post('/settings/whatsapp/test', {}).subscribe({
      next: (res: any) => {
        this.testing = false;
        if (res.success) {
          this.saveSuccess = `✅ Connection successful! Business: ${res.data.verified_name} (${res.data.display_phone_number})`;
          setTimeout(() => this.saveSuccess = '', 7000);
        } else {
          this.saveError = `❌ Connection failed: ${res.message}`;
          setTimeout(() => this.saveError = '', 7000);
        }
      },
      error: (err) => {
        this.testing = false;
        this.saveError = err.error?.message || 'Failed to connect to the Meta API. Check your credentials.';
        setTimeout(() => this.saveError = '', 7000);
      }
    });
  }

  testInstagramConnection() {
    this.testing = true;
    this.saveSuccess = '';
    this.saveError = '';

    if (!this.business.ig_token || !this.business.ig_account_id) {
      this.saveError = 'Please enter and save your Instagram Token and Account ID first.';
      this.testing = false;
      return;
    }

    this.api.post('/settings/instagram/test', {}).subscribe({
      next: (res: any) => {
        this.testing = false;
        if (res.success) {
          this.saveSuccess = `✅ Instagram Connected! Account: @${res.data.username}`;
          setTimeout(() => this.saveSuccess = '', 7000);
        } else {
          this.saveError = `❌ Instagram Failed: ${res.message}`;
          setTimeout(() => this.saveError = '', 7000);
        }
      },
      error: (err) => {
        this.testing = false;
        this.saveError = err.error?.message || 'Failed to connect to the Instagram API.';
        setTimeout(() => this.saveError = '', 7000);
      }
    });
  }

  inviteAgent() {
    if (!this.newAgent.name || !this.newAgent.email) return;
    this.api.post('/settings/team', this.newAgent).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.team.push(res.data);
          this.newAgent = { name: '', email: '', role: 'agent' };
          this.showInvite = false;
        }
      }
    });
  }

  removeAgent(id: number) {
    this.api.delete(`/settings/team/${id}`).subscribe({
      next: () => {
        this.team = this.team.filter(t => t.id !== id);
      }
    });
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text || '');
    this.saveSuccess = 'Copied to clipboard!';
    setTimeout(() => this.saveSuccess = '', 2000);
  }

  isIntegrated(key: string): boolean {
    switch(key) {
      case 'whatsapp':
      case 'instagram':
      case 'facebook':
        return this.socialAccounts.some(acc => acc.platform === key);
      case 'openai': return false; // Not implemented yet
      default: return false;
    }
  }

  connectIntegration(key: string) {
    if (['whatsapp', 'instagram', 'facebook'].includes(key)) {
      this.activeTab = 'whatsapp';
      setTimeout(() => {
        const el = document.querySelector('.api-form-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }

  // ── Lead Fields ──────────────────────────────────────────────────────────

  loadLeadFields() {
    this.leadFieldsLoading = true;
    this.api.get('/settings/lead-fields').subscribe({
      next: (res: any) => {
        if (res.success) this.leadFields = res.data;
        this.leadFieldsLoading = false;
      },
      error: () => this.leadFieldsLoading = false
    });
  }

  openAddFieldModal() {
    this.editingField = null;
    this.newField = { label: '', field_type: 'text', options: '', is_required: false, display_order: this.leadFields.length };
    this.showAddFieldModal = true;
  }

  openEditFieldModal(field: any) {
    this.editingField = field;
    this.newField = {
      label: field.label,
      field_type: field.field_type,
      options: Array.isArray(field.options) ? field.options.join('\n') : '',
      is_required: !!field.is_required,
      display_order: field.display_order || 0
    };
    this.showAddFieldModal = true;
  }

  closeFieldModal() {
    this.showAddFieldModal = false;
    this.editingField = null;
    this.fieldSaving = false;
  }

  saveLeadField() {
    if (!this.newField.label || !this.newField.field_type) {
      this.saveError = 'Label and field type are required.';
      setTimeout(() => this.saveError = '', 4000);
      return;
    }
    this.fieldSaving = true;
    this.saveError = '';
    this.saveSuccess = '';

    const payload = {
      label: this.newField.label,
      field_type: this.newField.field_type,
      options: this.newField.field_type === 'dropdown'
        ? this.newField.options.split('\n').map((o: string) => o.trim()).filter((o: string) => o)
        : [],
      is_required: this.newField.is_required,
      display_order: parseInt(this.newField.display_order) || 0
    };

    const req = this.editingField
      ? this.api.put(`/settings/lead-fields/${this.editingField.id}`, payload)
      : this.api.post('/settings/lead-fields', payload);

    req.subscribe({
      next: (res: any) => {
        this.fieldSaving = false;
        if (res.success) {
          this.saveSuccess = this.editingField ? 'Field updated successfully!' : 'New field added!';
          this.loadLeadFields();
          this.closeFieldModal();
          setTimeout(() => this.saveSuccess = '', 4000);
        }
      },
      error: (err: any) => {
        this.fieldSaving = false;
        this.saveError = err.error?.message || 'Failed to save field.';
        setTimeout(() => this.saveError = '', 5000);
      }
    });
  }

  deleteLeadField(id: number) {
    if (!confirm('Delete this field? All saved values for this field will also be removed from contacts.')) return;
    this.api.delete(`/settings/lead-fields/${id}`).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.saveSuccess = 'Field deleted.';
          this.loadLeadFields();
          setTimeout(() => this.saveSuccess = '', 3000);
        }
      },
      error: (err: any) => {
        this.saveError = err.error?.message || 'Failed to delete field.';
        setTimeout(() => this.saveError = '', 5000);
      }
    });
  }

  getFieldTypeLabel(type: string): string {
    return this.FIELD_TYPES.find(t => t.value === type)?.label || type;
  }

  getFieldTypeIcon(type: string): string {
    return this.FIELD_TYPES.find(t => t.value === type)?.icon || 'bi-type';
  }
}
