import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

export interface SettingCard {
  id: string;
  title: string;
  category: 'system' | 'general';
  categoryLabel: string;
  description: string;
  icon: string;
  gradient: string;
  route: string;
  queryParams?: any;
  permission?: string;
  roles?: string[];
  isUfsOnly?: boolean;
}

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './system-settings.component.html',
  styleUrls: ['./system-settings.component.css']
})
export class SystemSettingsComponent implements OnInit {
  searchQuery: string = '';
  selectedFilter: 'all' | 'system' | 'general' = 'all';

  cards: SettingCard[] = [
    // --- SYSTEM SETTINGS ---
    {
      id: 'teams',
      title: 'Teams & Users',
      category: 'system',
      categoryLabel: 'System',
      description: 'Manage organizational teams, assign managers, and configure team member permissions.',
      icon: 'bi-people-fill',
      gradient: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
      route: '/system-settings/teams',
      permission: 'Teams'
    },
    {
      id: 'branch',
      title: 'Branch Management',
      category: 'system',
      categoryLabel: 'System',
      description: 'Manage physical company branches, regional office locations, and branch head assignments.',
      icon: 'bi-building',
      gradient: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)',
      route: '/system-settings/branch',
      permission: 'Branch'
    },
    {
      id: 'department',
      title: 'Department Management',
      category: 'system',
      categoryLabel: 'System',
      description: 'Configure corporate departments, operational units, and functional divisions.',
      icon: 'bi-diagram-3-fill',
      gradient: 'linear-gradient(135deg, #9333ea 0%, #c084fc 100%)',
      route: '/system-settings/department',
      permission: 'Department'
    },
    {
      id: 'status',
      title: 'Lead Status',
      category: 'system',
      categoryLabel: 'System',
      description: 'Customize CRM pipeline stages, lead workflow statuses, and conversion milestones.',
      icon: 'bi-activity',
      gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
      route: '/system-settings/status',
      permission: 'Lead Status'
    },
    {
      id: 'designation',
      title: 'Designation Management',
      category: 'system',
      categoryLabel: 'System',
      description: 'Set up job titles, designations, and employee functional hierarchy roles.',
      icon: 'bi-person-badge-fill',
      gradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
      route: '/system-settings/designation',
      permission: 'Designation'
    },
    {
      id: 'intakes',
      title: 'Intakes',
      category: 'system',
      categoryLabel: 'Application',
      description: 'Configure academic session intakes, semester start schedules, and admissions.',
      icon: 'bi-calendar3',
      gradient: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
      route: '/system-settings/intakes',
      permission: 'Intake'
    },
    {
      id: 'years',
      title: 'Academic Years',
      category: 'system',
      categoryLabel: 'Application',
      description: 'Manage student cohort years, fiscal academic cycles, and reporting calendar years.',
      icon: 'bi-calendar-event',
      gradient: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
      route: '/system-settings/years',
      permission: 'Year'
    },
    {
      id: 'app-statuses',
      title: 'Application Statuses',
      category: 'system',
      categoryLabel: 'Application',
      description: 'Track university applicant milestones, admission paperwork, and visa progress stages.',
      icon: 'bi-mortarboard-fill',
      gradient: 'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)',
      route: '/system-settings/app-statuses',
      permission: 'Application Status'
    },
    {
      id: 'enquiry-fors',
      title: 'Enquiry For',
      category: 'system',
      categoryLabel: 'System',
      description: 'Manage service offerings, study destinations, and target interest categories.',
      icon: 'bi-question-circle-fill',
      gradient: 'linear-gradient(135deg, #db2777 0%, #ec4899 100%)',
      route: '/system-settings/enquiry-fors',
      permission: 'Enquiry For'
    },
    {
      id: 'document-type',
      title: 'Document Types',
      category: 'system',
      categoryLabel: 'System',
      description: 'Define mandatory applicant documents, passport verification, and KYC checklists.',
      icon: 'bi-file-earmark-text-fill',
      gradient: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
      route: '/system-settings/document-type',
      permission: 'Document Type'
    },
    {
      id: 'receipt-types',
      title: 'Receipt Types',
      category: 'system',
      categoryLabel: 'System',
      description: 'Configure fee vouchers, payment receipt classifications, and accounting types.',
      icon: 'bi-receipt-cutoff',
      gradient: 'linear-gradient(135deg, #65a30d 0%, #84cc16 100%)',
      route: '/system-settings/receipt-types'
    },
    {
      id: 'universities',
      title: 'Universities',
      category: 'system',
      categoryLabel: 'System',
      description: 'Manage partner universities, international campuses, and partner institutions directory.',
      icon: 'bi-buildings-fill',
      gradient: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
      route: '/system-settings/universities',
      permission: 'Universities',
      roles: ['admin', 'superadmin', 'manager']
    },
    {
      id: 'courses',
      title: 'Courses',
      category: 'system',
      categoryLabel: 'System',
      description: 'Manage course listings, degrees, syllabi, requirements, and educational programs.',
      icon: 'bi-book-fill',
      gradient: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
      route: '/system-settings/courses',
      permission: 'Courses'
    },
    {
      id: 'channels',
      title: 'Source / Channels',
      category: 'system',
      categoryLabel: 'System',
      description: 'Configure acquisition channels, lead generation channels, and referral origins.',
      icon: 'bi-chat-left-dots-fill',
      gradient: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
      route: '/system-settings/channels',
      permission: 'Channel'
    },

    // --- GENERAL & LEAD SETTINGS ---
    {
      id: 'channels-manager',
      title: 'Channels Manager',
      category: 'general',
      categoryLabel: 'Communication',
      description: 'Connect official WhatsApp Cloud API, QR-based web instances, and SMS gateways.',
      icon: 'bi-cpu-fill',
      gradient: 'linear-gradient(135deg, #15803d 0%, #22c55e 100%)',
      route: '/settings',
      queryParams: { tab: 'whatsapp' },
      permission: 'Channels Manager'
    },
    {
      id: 'users-agents',
      title: 'Users & Agents',
      category: 'general',
      categoryLabel: 'General',
      description: 'Manage CRM agent credentials, login accounts, and module permission privileges.',
      icon: 'bi-person-lines-fill',
      gradient: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)',
      route: '/settings',
      queryParams: { tab: 'team' },
      permission: 'Users / Agents'
    },
    {
      id: 'lead-fields',
      title: 'Lead Fields',
      category: 'general',
      categoryLabel: 'Leads',
      description: 'Configure dynamic lead fields, custom attributes, and lead form inputs.',
      icon: 'bi-list-columns-reverse',
      gradient: 'linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)',
      route: '/settings',
      queryParams: { tab: 'lead-fields' },
      permission: 'Lead Fields'
    },
    {
      id: 'field-categories',
      title: 'Field Categories',
      category: 'general',
      categoryLabel: 'Leads',
      description: 'Organize custom fields into structured tabs like Personal Details, Academics, and Tests.',
      icon: 'bi-folder-fill',
      gradient: 'linear-gradient(135deg, #ca8a04 0%, #facc15 100%)',
      route: '/settings',
      queryParams: { tab: 'field-categories' },
      permission: 'Field Categories'
    },
    {
      id: 'excel-import',
      title: 'Excel Import',
      category: 'general',
      categoryLabel: 'Data',
      description: 'Bulk upload leads from CSV or Excel files with duplicate phone number validation.',
      icon: 'bi-file-earmark-excel-fill',
      gradient: 'linear-gradient(135deg, #16a34a 0%, #4ade80 100%)',
      route: '/excel-import'
    },
    {
      id: 'source-categories',
      title: 'Source Categories',
      category: 'general',
      categoryLabel: 'Leads',
      description: 'Group individual lead sources into high-level categories (e.g. Paid Ads, Social, Referrals).',
      icon: 'bi-tag-fill',
      gradient: 'linear-gradient(135deg, #e11d48 0%, #fb7185 100%)',
      route: '/settings',
      queryParams: { tab: 'source-categories' },
      permission: 'Source Categories'
    },
    {
      id: 'api-webhooks',
      title: 'API & Webhooks',
      category: 'general',
      categoryLabel: 'Developer',
      description: 'Manage secure API authorization keys, incoming lead webhooks, and endpoint callbacks.',
      icon: 'bi-code-slash',
      gradient: 'linear-gradient(135deg, #475569 0%, #64748b 100%)',
      route: '/settings',
      queryParams: { tab: 'api' },
      permission: 'API & Webhooks'
    },
    {
      id: 'integrations',
      title: 'Integrations',
      category: 'general',
      categoryLabel: 'General',
      description: 'Connect Facebook Lead Ads, Google Ads, Zapier, Webhooks, and external CRM services.',
      icon: 'bi-plug-fill',
      gradient: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
      route: '/settings',
      queryParams: { tab: 'integrations' },
      permission: 'Integrations'
    },
    {
      id: 'help-video',
      title: 'Help Video Management',
      category: 'general',
      categoryLabel: 'Support',
      description: 'Upload and organize staff onboarding tutorials, walkthroughs, and training videos.',
      icon: 'bi-camera-video-fill',
      gradient: 'linear-gradient(135deg, #b91c1c 0%, #ef4444 100%)',
      route: '/settings',
      queryParams: { tab: 'help-video' },
      isUfsOnly: true
    }
  ];

  constructor(public authService: AuthService, private router: Router) {}

  ngOnInit() {}

  get currentUser(): any {
    const stored = localStorage.getItem('uc_user');
    return stored ? JSON.parse(stored) : null;
  }

  get isUfsUser(): boolean {
    const u = this.currentUser;
    if (!u) return false;
    if (u.is_dev === 1 || u.is_dev === true || u.isDev === true) return true;
    const username = (u.username || '').toLowerCase().trim();
    const email = (u.email || '').toLowerCase().trim();
    return username === 'ufs' || email === 'ufs' || email === 'ufs@trackbox.in';
  }

  hasAccess(card: SettingCard): boolean {
    if (card.isUfsOnly && !this.isUfsUser) return false;
    if (card.roles && card.roles.length > 0) {
      if (this.authService.hasRole(...card.roles)) return true;
    }
    if (card.permission) {
      return this.authService.hasPermission(card.permission, 'view');
    }
    return true;
  }

  get filteredCards(): SettingCard[] {
    return this.cards.filter(c => {
      if (!this.hasAccess(c)) return false;
      if (this.selectedFilter !== 'all' && c.category !== this.selectedFilter) return false;
      if (this.searchQuery && this.searchQuery.trim() !== '') {
        const q = this.searchQuery.toLowerCase().trim();
        return c.title.toLowerCase().includes(q) || 
               c.description.toLowerCase().includes(q) || 
               c.categoryLabel.toLowerCase().includes(q);
      }
      return true;
    });
  }

  get systemCount(): number {
    return this.cards.filter(c => c.category === 'system' && this.hasAccess(c)).length;
  }

  get generalCount(): number {
    return this.cards.filter(c => c.category === 'general' && this.hasAccess(c)).length;
  }

  get totalCount(): number {
    return this.cards.filter(c => this.hasAccess(c)).length;
  }

  navigateTo(card: SettingCard) {
    if (card.queryParams) {
      this.router.navigate([card.route], { queryParams: card.queryParams });
    } else {
      this.router.navigate([card.route]);
    }
  }

  clearSearch() {
    this.searchQuery = '';
  }
}
