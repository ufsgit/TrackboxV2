const fs = require('fs');
const htmlPath = 'd:/nandan/trackbox folder/TrackboxV2/frontend/src/app/shared/layout/layout.component.html';
let htmlContent = fs.readFileSync(htmlPath, 'utf8');

const startTag = '<div class="mega-menu two-col align-right" *ngIf="isSettingsOpen">';
const endTag = '</div>\r\n        </div>\r\n\r\n      </ng-container>';
const endTagLF = '</div>\n        </div>\n\n      </ng-container>';

const newPanel = `<div class="settings-mega-panel" *ngIf="isSettingsOpen">
            <!-- Mega Menu Top Header Bar -->
            <div class="smp-header">
              <div class="smp-header-title">
                <div class="smp-header-icon">
                  <i class="bi bi-sliders2-vertical"></i>
                </div>
                <div>
                  <div class="smp-title">System Settings & Controls</div>
                  <div class="smp-subtitle">Manage organization structure, academics, pipeline & integrations</div>
                </div>
              </div>
              <a routerLink="/system-settings" class="smp-hub-btn" (click)="isSettingsOpen = false">
                <i class="bi bi-grid-fill"></i>
                <span>Management Hub</span>
                <i class="bi bi-arrow-right"></i>
              </a>
            </div>

            <!-- 4 Thematic Columns Grid -->
            <div class="smp-grid">
              <!-- Column 1: Organization -->
              <div class="smp-col">
                <div class="smp-col-header">
                  <span class="smp-col-badge badge-blue">Organization</span>
                </div>
                <div class="smp-col-items">
                  <a *ngIf="authService.hasPermission('Teams', 'view')" routerLink="/system-settings/teams" routerLinkActive="active" class="smp-item" (click)="isSettingsOpen = false">
                    <span class="smp-icon icon-indigo"><i class="bi bi-people-fill"></i></span>
                    <span class="smp-label">Teams & Users</span>
                  </a>
                  <a *ngIf="authService.hasPermission('Branch', 'view')" routerLink="/system-settings/branch" routerLinkActive="active" class="smp-item" (click)="isSettingsOpen = false">
                    <span class="smp-icon icon-sky"><i class="bi bi-building"></i></span>
                    <span class="smp-label">Branch</span>
                  </a>
                  <a *ngIf="authService.hasPermission('Department', 'view')" routerLink="/system-settings/department" routerLinkActive="active" class="smp-item" (click)="isSettingsOpen = false">
                    <span class="smp-icon icon-purple"><i class="bi bi-diagram-3-fill"></i></span>
                    <span class="smp-label">Department</span>
                  </a>
                  <a *ngIf="authService.hasPermission('Designation', 'view')" routerLink="/system-settings/designation" routerLinkActive="active" class="smp-item" (click)="isSettingsOpen = false">
                    <span class="smp-icon icon-amber"><i class="bi bi-person-badge-fill"></i></span>
                    <span class="smp-label">Designation</span>
                  </a>
                  <a *ngIf="authService.hasPermission('Users / Agents', 'view')" routerLink="/settings" [queryParams]="{tab: 'team'}" class="smp-item" (click)="isSettingsOpen = false">
                    <span class="smp-icon icon-blue"><i class="bi bi-person-lines-fill"></i></span>
                    <span class="smp-label">Users / Agents</span>
                  </a>
                </div>
              </div>

              <!-- Column 2: Academics -->
              <div class="smp-col">
                <div class="smp-col-header">
                  <span class="smp-col-badge badge-violet">Academics</span>
                </div>
                <div class="smp-col-items">
                  <a *ngIf="authService.hasPermission('Universities', 'view') || authService.hasRole('admin', 'superadmin', 'manager')" routerLink="/system-settings/universities" routerLinkActive="active" class="smp-item" (click)="isSettingsOpen = false">
                    <span class="smp-icon icon-violet"><i class="bi bi-buildings-fill"></i></span>
                    <span class="smp-label">Universities</span>
                  </a>
                  <a *ngIf="authService.hasPermission('Courses', 'view')" routerLink="/system-settings/courses" routerLinkActive="active" class="smp-item" (click)="isSettingsOpen = false">
                    <span class="smp-icon icon-orange"><i class="bi bi-book-fill"></i></span>
                    <span class="smp-label">Courses</span>
                  </a>
                  <a *ngIf="authService.hasPermission('Application Status', 'view')" routerLink="/system-settings/app-statuses" routerLinkActive="active" class="smp-item" (click)="isSettingsOpen = false">
                    <span class="smp-icon icon-indigo"><i class="bi bi-mortarboard-fill"></i></span>
                    <span class="smp-label">Application Status</span>
                  </a>
                  <a *ngIf="authService.hasPermission('Intake', 'view')" routerLink="/system-settings/intakes" routerLinkActive="active" class="smp-item" (click)="isSettingsOpen = false">
                    <span class="smp-icon icon-cyan"><i class="bi bi-calendar3"></i></span>
                    <span class="smp-label">Intake</span>
                  </a>
                  <a *ngIf="authService.hasPermission('Year', 'view')" routerLink="/system-settings/years" routerLinkActive="active" class="smp-item" (click)="isSettingsOpen = false">
                    <span class="smp-icon icon-blue"><i class="bi bi-calendar-event"></i></span>
                    <span class="smp-label">Academic Year</span>
                  </a>
                </div>
              </div>

              <!-- Column 3: Leads & Pipeline -->
              <div class="smp-col">
                <div class="smp-col-header">
                  <span class="smp-col-badge badge-emerald">Leads & Pipeline</span>
                </div>
                <div class="smp-col-items">
                  <a *ngIf="authService.hasPermission('Lead Status', 'view')" routerLink="/system-settings/status" routerLinkActive="active" class="smp-item" (click)="isSettingsOpen = false">
                    <span class="smp-icon icon-emerald"><i class="bi bi-activity"></i></span>
                    <span class="smp-label">Lead Status</span>
                  </a>
                  <a *ngIf="authService.hasPermission('Enquiry For', 'view')" routerLink="/system-settings/enquiry-fors" routerLinkActive="active" class="smp-item" (click)="isSettingsOpen = false">
                    <span class="smp-icon icon-rose"><i class="bi bi-question-circle-fill"></i></span>
                    <span class="smp-label">Enquiry For</span>
                  </a>
                  <a *ngIf="authService.hasPermission('Lead Fields', 'view')" routerLink="/settings" [queryParams]="{tab: 'lead-fields'}" class="smp-item" (click)="isSettingsOpen = false">
                    <span class="smp-icon icon-indigo"><i class="bi bi-list-columns-reverse"></i></span>
                    <span class="smp-label">Lead Fields</span>
                  </a>
                  <a *ngIf="authService.hasPermission('Field Categories', 'view')" routerLink="/settings" [queryParams]="{tab: 'field-categories'}" class="smp-item" (click)="isSettingsOpen = false">
                    <span class="smp-icon icon-amber"><i class="bi bi-folder-fill"></i></span>
                    <span class="smp-label">Field Categories</span>
                  </a>
                  <a *ngIf="authService.hasPermission('Document Type', 'view')" routerLink="/system-settings/document-type" routerLinkActive="active" class="smp-item" (click)="isSettingsOpen = false">
                    <span class="smp-icon icon-teal"><i class="bi bi-file-earmark-text-fill"></i></span>
                    <span class="smp-label">Document Type</span>
                  </a>
                  <a routerLink="/system-settings/receipt-types" routerLinkActive="active" class="smp-item" (click)="isSettingsOpen = false">
                    <span class="smp-icon icon-lime"><i class="bi bi-receipt-cutoff"></i></span>
                    <span class="smp-label">Receipt Type</span>
                  </a>
                </div>
              </div>

              <!-- Column 4: Channels & Integrations -->
              <div class="smp-col">
                <div class="smp-col-header">
                  <span class="smp-col-badge badge-teal">Channels & Integrations</span>
                </div>
                <div class="smp-col-items">
                  <a *ngIf="authService.hasPermission('Channels Manager', 'view')" routerLink="/settings" [queryParams]="{tab: 'whatsapp'}" class="smp-item" (click)="isSettingsOpen = false">
                    <span class="smp-icon icon-green"><i class="bi bi-cpu-fill"></i></span>
                    <span class="smp-label">Channels Manager</span>
                  </a>
                  <a *ngIf="authService.hasPermission('Channel', 'view')" routerLink="/system-settings/channels" routerLinkActive="active" class="smp-item" (click)="isSettingsOpen = false">
                    <span class="smp-icon icon-sky"><i class="bi bi-chat-left-dots-fill"></i></span>
                    <span class="smp-label">Source </span>
                  </a>
                  <a *ngIf="authService.hasPermission('Source Categories', 'view')" routerLink="/settings" [queryParams]="{tab: 'source-categories'}" class="smp-item" (click)="isSettingsOpen = false">
                    <span class="smp-icon icon-rose"><i class="bi bi-tag-fill"></i></span>
                    <span class="smp-label">Source Categories</span>
                  </a>
                  <a routerLink="/excel-import" class="smp-item" (click)="isSettingsOpen = false">
                    <span class="smp-icon icon-green"><i class="bi bi-file-earmark-excel-fill"></i></span>
                    <span class="smp-label">Excel Import</span>
                  </a>
                  <a *ngIf="authService.hasPermission('API & Webhooks', 'view')" routerLink="/settings" [queryParams]="{tab: 'api'}" class="smp-item" (click)="isSettingsOpen = false">
                    <span class="smp-icon icon-slate"><i class="bi bi-code-slash"></i></span>
                    <span class="smp-label">API & Webhooks</span>
                  </a>
                  <a *ngIf="authService.hasPermission('Integrations', 'view')" routerLink="/settings" [queryParams]="{tab: 'integrations'}" class="smp-item" (click)="isSettingsOpen = false">
                    <span class="smp-icon icon-blue"><i class="bi bi-plug-fill"></i></span>
                    <span class="smp-label">Integrations</span>
                  </a>
                  <a *ngIf="isUfsUser" routerLink="/settings" [queryParams]="{tab: 'help-video'}" class="smp-item" (click)="isSettingsOpen = false">
                    <span class="smp-icon icon-red"><i class="bi bi-camera-video-fill"></i></span>
                    <span class="smp-label">Help Videos</span>
                  </a>
                </div>
              </div>
            </div>

            <!-- Footer Strip -->
            <div class="smp-footer">
              <span class="smp-footer-text">
                <i class="bi bi-info-circle me-1"></i>
                Looking for detailed search or cards overview?
              </span>
              <a routerLink="/system-settings" class="smp-footer-link" (click)="isSettingsOpen = false">
                Open full Management Hub ➜
              </a>
            </div>
          </div>`;

const startIndex = htmlContent.indexOf(startTag);
if (startIndex !== -1) {
  let endIndex = htmlContent.indexOf(endTag, startIndex);
  let endTagLen = 0;
  if (endIndex !== -1) {
    endTagLen = '</div>'.length; // only replace up to the first closing div of the menu
  } else {
    endIndex = htmlContent.indexOf(endTagLF, startIndex);
  }
  
  // Find where mega-menu closes (before the closing div of settings-dropdown-wrapper)
  const afterStart = htmlContent.substring(startIndex);
  const closingIdx = afterStart.indexOf('</div>\r\n        </div>') !== -1
    ? afterStart.indexOf('</div>\r\n        </div>')
    : afterStart.indexOf('</div>\n        </div>');

  if (closingIdx !== -1) {
    const fullEnd = startIndex + closingIdx + '</div>'.length;
    htmlContent = htmlContent.substring(0, startIndex) + newPanel + htmlContent.substring(fullEnd);
    fs.writeFileSync(htmlPath, htmlContent, 'utf8');
    console.log('Successfully replaced Settings menu with executive 4-column panel!');
  } else {
    console.log('Could not find closing </div>');
  }
} else {
  console.log('Could not find startTag');
}

