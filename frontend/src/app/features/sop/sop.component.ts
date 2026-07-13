import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { SOP_DATA, SopSection } from './sop.data';

@Component({
  selector: 'app-sop',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sop.component.html',
  styleUrls: ['./sop.component.css']
})
export class SopComponent implements OnInit, OnDestroy {
  sopData: SopSection[] = [];
  filteredData: SopSection[] = [];
  searchQuery = '';
  currentModuleTitle = 'Standard Operating Procedures';
  
  // State
  activeSectionId: string | null = null;
  allowMultipleOpen = false; // single-open by default
  openSections: Set<string> = new Set();
  
  private routeSub: Subscription = new Subscription();

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Listen for query params to load specific module SOP
    this.routeSub.add(
      this.route.queryParams.subscribe(params => {
        const module = params['module'] || 'crm'; // default to crm if none provided
        
        if (module && SOP_DATA[module]) {
          this.sopData = SOP_DATA[module];
          
          // Set a nice title based on the module
          const titleMap: Record<string, string> = {
            'leads': 'Lead Management SOP',
            'crm': 'CRM & Sales SOP',
            'operation': 'Operations & Service SOP',
            'hr': 'Human Resources SOP'
          };
          this.currentModuleTitle = titleMap[module] || 'Standard Operating Procedures';
        } else {
          this.sopData = SOP_DATA['crm'];
          this.currentModuleTitle = 'CRM & Sales SOP';
        }
        
        this.onSearch(); // Refresh filter
        
        // Auto-expand the first section by default
        if (this.sopData.length > 0) {
          setTimeout(() => {
            this.openSection(this.sopData[0].id);
            this.scrollToSection(this.sopData[0].id);
          }, 100);
        }
      })
    );
  }

  ngOnDestroy(): void {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
  }

  onSearch() {
    const query = this.searchQuery.toLowerCase();
    if (!query) {
      this.filteredData = this.sopData;
      return;
    }
    
    this.filteredData = this.sopData.filter(section => 
      section.title.toLowerCase().includes(query) || 
      section.content.toLowerCase().includes(query)
    );
  }

  toggleSection(id: string) {
    if (this.allowMultipleOpen) {
      if (this.openSections.has(id)) {
        this.openSections.delete(id);
        if (this.activeSectionId === id) this.activeSectionId = null;
      } else {
        this.openSections.add(id);
        this.activeSectionId = id; // update active for styling
      }
    } else {
      // Single open mode
      if (this.activeSectionId === id) {
        this.activeSectionId = null;
        this.openSections.clear();
      } else {
        this.activeSectionId = id;
        this.openSections.clear();
        this.openSections.add(id);
      }
    }
  }

  openSection(id: string) {
    if (!this.allowMultipleOpen) {
      this.openSections.clear();
    }
    this.openSections.add(id);
    this.activeSectionId = id;
  }

  isOpen(id: string): boolean {
    return this.openSections.has(id);
  }

  scrollToSection(id: string) {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
