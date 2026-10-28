const fs = require('fs');

// 1. Update contacts.component.ts
const tsPath = 'frontend/src/app/features/contacts/contacts.component.ts';
let ts = fs.readFileSync(tsPath, 'utf8');

const oldLoadAgents = /loadAgents\(\)\s*\{[\s\S]*?this\.api\.get\('\/settings\/team'\)\.subscribe\(\{[\s\S]*?\}\);\s*\}/;

const newLoadAgents = `loadAgents() {
    this.api.get('/settings/team').subscribe({
      next: (res: any) => {
        if (res.success && Array.isArray(res.data)) {
          this.employees = res.data;
          // Load all active team members/agents/counselors/admins so no one is missing, sorted alphabetically
          this.agents = [...res.data]
            .filter((u: any) => u && u.is_active !== 0 && u.is_active !== false)
            .sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
        }
      }
    });
  }`;

if (oldLoadAgents.test(ts)) {
  ts = ts.replace(oldLoadAgents, newLoadAgents);
  console.log('Updated loadAgents in contacts.component.ts');
} else {
  console.log('loadAgents regex not matched');
}

fs.writeFileSync(tsPath, ts, 'utf8');

// 2. Update contacts.component.html
const htmlPath = 'frontend/src/app/features/contacts/contacts.component.html';
let html = fs.readFileSync(htmlPath, 'utf8');

const commentedTagRegex = /<!--\s*<button class="leads-dropdown-btn dropdown-toggle"[\s\S]*?<\/button>\s*-->/;
const uncommentedTagButton = `<button class="leads-dropdown-btn dropdown-toggle" [class.filter-applied]="!!activeTag" type="button" (click)="toggleFilterDropdown('tag', $event)" aria-expanded="false">
          <i class="bi bi-tag me-1 text-muted"></i>
          <span>{{ activeTag || 'All Tags' }}</span>
          <i class="bi bi-chevron-down chevron-down-icon"></i>
        </button>`;

if (commentedTagRegex.test(html)) {
  html = html.replace(commentedTagRegex, uncommentedTagButton);
  console.log('Uncommented Tags dropdown button in HTML');
} else {
  console.log('Commented tag button regex not matched');
}

fs.writeFileSync(htmlPath, html, 'utf8');

// 3. Update contacts.component.css
const cssPath = 'frontend/src/app/features/contacts/contacts.component.css';
let css = fs.readFileSync(cssPath, 'utf8');

const scrollbarCss = `
.custom-dropdown-menu {
  max-height: 320px !important;
  overflow-y: auto !important;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f8fafc;
}
.custom-dropdown-menu::-webkit-scrollbar {
  width: 6px;
}
.custom-dropdown-menu::-webkit-scrollbar-track {
  background: #f8fafc;
  border-radius: 4px;
}
.custom-dropdown-menu::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
.custom-dropdown-menu::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
`;

if (!css.includes('scrollbar-color: #cbd5e1 #f8fafc')) {
  css += scrollbarCss;
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log('Appended custom dropdown scrollbar CSS');
}

console.log('Finished updating frontend files');

