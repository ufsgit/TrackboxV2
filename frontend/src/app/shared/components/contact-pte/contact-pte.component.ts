import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-contact-pte',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact-pte.component.html',
  styleUrls: ['./contact-pte.component.css']
})
export class ContactPteComponent implements OnInit, OnChanges {
  @Input() contactId: number | null = null;
  @Input() studentName: string = '';
  @Input() contact: any = null;
  @Output() statusChange = new EventEmitter<string>();

  loading = false;
  submitting = false;
  pte: any = null;

  // Active sub-section tab
  activeSection: 'overview' | 'referral' | 'batches' | 'attendance' | 'mock_tests' | 'exams' | 'results' = 'overview';

  // Modals
  showEnrollModal = false;
  isEditing = false;
  enrollForm: any = this.getEmptyEnrollForm();

  showAttendanceModal = false;
  attendanceForm: any = { session_date: new Date().toISOString().slice(0, 10), session_title: 'Daily Practice', status: 'Present', remarks: '' };

  showMockModal = false;
  mockForm: any = { test_date: new Date().toISOString().slice(0, 10), test_title: 'Full Mock Test', overall_score: 65, listening: 65, reading: 65, speaking: 65, writing: 65, comments: '' };

  showExamModal = false;
  examForm: any = { booking_date: new Date().toISOString().slice(0, 10), exam_date: '', venue: 'Pearson VUE Center', mode: 'Offline Center', notes: '' };

  showResultModal = false;
  resultForm: any = { exam_date: new Date().toISOString().slice(0, 10), overall_score: 65, listening: 65, reading: 65, speaking: 65, writing: 65, next_action: 'Proceed to University Application', remarks: '' };

  // Dropdown lists
  batches: any[] = [];
  trainers: any[] = [];

  statusList = [
    'Recommended',
    'Referred',
    'Joined',
    'Training',
    'Mock Test',
    'Exam Booked',
    'Result Pending',
    'Result Received',
    'Target Achieved',
    'Target Not Achieved',
    'Application Pending',
    'Application Created',
    'Completed',
    'Dropped'
  ];

  packageOptions = [
    'Standard Coaching (30 Days)',
    'Comprehensive Mastery (60 Days)',
    'Crash Course (15 Days)',
    'Weekend Fast-Track',
    'One-on-One Mentorship'
  ];

  // Visual Progression Stages
  conversionStages = [
    { key: 'Recommended', label: 'Recommended', icon: 'bi-lightbulb' },
    { key: 'Referred', label: 'Referred', icon: 'bi-person-check' },
    { key: 'Joined', label: 'Joined', icon: 'bi-person-badge' },
    { key: 'Training', label: 'Training / Mocks', icon: 'bi-book' },
    { key: 'Exam Booked', label: 'Exam Booked', icon: 'bi-calendar-event' },
    { key: 'Target Achieved', label: 'Target Achieved', icon: 'bi-trophy' },
    { key: 'Application Created', label: 'Application', icon: 'bi-mortarboard' }
  ];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadStatuses();
    this.loadPackages();
    this.loadBatches();
    this.loadTrainers();

    if (this.contactId) {
      this.loadPteDetails();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contactId'] && !changes['contactId'].firstChange && this.contactId) {
      this.loadPteDetails();
    }
  }

  loadStatuses(): void {
    this.api.get('/pte/statuses').subscribe({
      next: (res: any) => {
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          this.statusList = res.data.map((s: any) => s.name);
        }
      },
      error: () => {}
    });
  }

  loadPackages(): void {
    this.api.get('/pte/packages').subscribe({
      next: (res: any) => {
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          this.packageOptions = res.data.map((p: any) => p.name);
        }
      },
      error: () => {}
    });
  }

  loadPteDetails(): void {
    if (!this.contactId) return;
    this.loading = true;
    this.api.get(`/pte/contact/${this.contactId}`).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res && res.success && res.data) {
          this.pte = res.data;
          this.statusChange.emit(this.pte.status);
        } else {
          this.pte = null;
          this.statusChange.emit('');
        }
      },
      error: (err: any) => {
        console.error('Error fetching PTE details:', err);
        this.loading = false;
        this.pte = null;
      }
    });
  }

  loadBatches(): void {
    this.api.get('/pte/batches').subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.batches = res.data || [];
        }
      }
    });
  }

  loadTrainers(): void {
    this.api.get('/pte/trainers').subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.trainers = res.data || [];
        }
      }
    });
  }

  getEmptyEnrollForm(): any {
    return {
      status: 'Recommended',
      package_name: 'Standard Coaching (30 Days)',
      target_score: 65,
      current_score: null,
      batch_id: null,
      trainer_id: null,
      recommendation_date: new Date().toISOString().slice(0, 10),
      referral_date: new Date().toISOString().slice(0, 10),
      join_date: '',
      followup_date: '',
      followup_remarks: '',
      remarks: ''
    };
  }

  openEnrollModal(isEdit: boolean = false): void {
    this.isEditing = isEdit;
    if (isEdit && this.pte) {
      this.enrollForm = {
        status: this.pte.status || 'Recommended',
        package_name: this.pte.package_name || 'Standard Coaching (30 Days)',
        target_score: this.pte.target_score || 65,
        current_score: this.pte.current_score || null,
        batch_id: this.pte.batch_id || null,
        trainer_id: this.pte.trainer_id || null,
        recommendation_date: this.pte.recommendation_date ? this.pte.recommendation_date.slice(0, 10) : '',
        referral_date: this.pte.referral_date ? this.pte.referral_date.slice(0, 10) : '',
        join_date: this.pte.join_date ? this.pte.join_date.slice(0, 10) : '',
        followup_date: this.pte.followup_date ? this.pte.followup_date.slice(0, 10) : '',
        followup_remarks: this.pte.followup_remarks || '',
        remarks: this.pte.remarks || ''
      };
    } else {
      this.enrollForm = this.getEmptyEnrollForm();
    }
    this.showEnrollModal = true;
  }

  saveEnrollment(): void {
    if (!this.contactId) return;
    this.submitting = true;

    // Resolve trainer name from list
    if (this.enrollForm.trainer_id) {
      const match = this.trainers.find(t => t.id === Number(this.enrollForm.trainer_id));
      if (match) this.enrollForm.trainer_name = match.name;
    }

    this.api.post(`/pte/contact/${this.contactId}`, this.enrollForm).subscribe({
      next: (res: any) => {
        this.submitting = false;
        this.showEnrollModal = false;
        Swal.fire({
          icon: 'success',
          title: 'Saved',
          text: res.message || 'PTE enrollment updated successfully',
          timer: 1600,
          showConfirmButton: false
        });
        this.loadPteDetails();
        this.loadBatches();
      },
      error: (err: any) => {
        this.submitting = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.error?.message || err.message || 'Failed to save PTE enrollment'
        });
      }
    });
  }

  // Attendance
  openAttendanceModal(): void {
    this.attendanceForm = {
      session_date: new Date().toISOString().slice(0, 10),
      session_title: 'Class Practice Session',
      status: 'Present',
      remarks: '',
      batch_id: this.pte?.batch_id || null
    };
    this.showAttendanceModal = true;
  }

  saveAttendance(): void {
    if (!this.contactId || !this.pte) return;
    this.submitting = true;
    const payload = {
      ...this.attendanceForm,
      pte_student_id: this.pte.id
    };

    this.api.post(`/pte/contact/${this.contactId}/attendance`, payload).subscribe({
      next: () => {
        this.submitting = false;
        this.showAttendanceModal = false;
        this.loadPteDetails();
      },
      error: (err: any) => {
        this.submitting = false;
        Swal.fire('Error', err.error?.message || err.message, 'error');
      }
    });
  }

  deleteAttendance(id: number): void {
    Swal.fire({
      title: 'Delete Attendance?',
      text: 'Remove this session record?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete'
    }).then(result => {
      if (result.isConfirmed) {
        this.api.delete(`/pte/attendance/${id}`).subscribe({
          next: () => this.loadPteDetails()
        });
      }
    });
  }

  // Mock Tests
  openMockModal(): void {
    this.mockForm = {
      test_date: new Date().toISOString().slice(0, 10),
      test_title: 'Full Practice Mock',
      overall_score: 65,
      listening: 65,
      reading: 65,
      speaking: 65,
      writing: 65,
      comments: ''
    };
    this.showMockModal = true;
  }

  saveMockTest(): void {
    if (!this.contactId || !this.pte) return;
    this.submitting = true;
    const payload = {
      ...this.mockForm,
      pte_student_id: this.pte.id
    };

    this.api.post(`/pte/contact/${this.contactId}/mock-tests`, payload).subscribe({
      next: () => {
        this.submitting = false;
        this.showMockModal = false;
        this.loadPteDetails();
      },
      error: (err: any) => {
        this.submitting = false;
        Swal.fire('Error', err.error?.message || err.message, 'error');
      }
    });
  }

  deleteMock(id: number): void {
    Swal.fire({
      title: 'Delete Mock Test?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete'
    }).then(r => {
      if (r.isConfirmed) {
        this.api.delete(`/pte/mock-tests/${id}`).subscribe({
          next: () => this.loadPteDetails()
        });
      }
    });
  }

  // Exams
  openExamModal(): void {
    this.examForm = {
      booking_date: new Date().toISOString().slice(0, 10),
      exam_date: '',
      venue: 'Pearson VUE Authorized Center',
      mode: 'Offline Center',
      notes: ''
    };
    this.showExamModal = true;
  }

  saveExam(): void {
    if (!this.contactId || !this.pte) return;
    this.submitting = true;
    const payload = {
      ...this.examForm,
      pte_student_id: this.pte.id
    };

    this.api.post(`/pte/contact/${this.contactId}/exams`, payload).subscribe({
      next: () => {
        this.submitting = false;
        this.showExamModal = false;
        this.loadPteDetails();
      },
      error: (err: any) => {
        this.submitting = false;
        Swal.fire('Error', err.error?.message || err.message, 'error');
      }
    });
  }

  // Official Results (PTE-003)
  openResultModal(exam?: any): void {
    this.resultForm = {
      exam_id: exam ? exam.id : null,
      exam_date: exam ? exam.exam_date?.slice(0, 10) : new Date().toISOString().slice(0, 10),
      overall_score: 65,
      listening: 65,
      reading: 65,
      speaking: 65,
      writing: 65,
      next_action: 'Proceed to University Application',
      remarks: ''
    };
    this.showResultModal = true;
  }

  saveResult(): void {
    if (!this.contactId || !this.pte) return;
    this.submitting = true;
    const payload = {
      ...this.resultForm,
      pte_student_id: this.pte.id
    };

    this.api.post(`/pte/contact/${this.contactId}/results`, payload).subscribe({
      next: (res: any) => {
        this.submitting = false;
        this.showResultModal = false;
        if (res.data?.isTargetAchieved) {
          Swal.fire({
            icon: 'success',
            title: '🎉 Target Achieved!',
            html: `<strong>Congratulations!</strong> Student achieved overall score of <b>${res.data.overallScore}</b> (Target: ${res.data.targetScore}).<br><br><b>PTE-003:</b> An automatic <b>Application Follow-up Task</b> has been generated for the counsellor.`,
            confirmButtonColor: '#16a34a'
          });
        } else {
          Swal.fire({
            icon: 'info',
            title: 'Result Recorded',
            text: `Overall Score: ${res.data?.overallScore} (Target was: ${res.data?.targetScore}). Further coaching advised.`
          });
        }
        this.loadPteDetails();
      },
      error: (err: any) => {
        this.submitting = false;
        Swal.fire('Error', err.error?.message || err.message, 'error');
      }
    });
  }

  // Helpers
  isStageReached(stageKey: string): boolean {
    if (!this.pte) return false;
    const order = ['Recommended', 'Referred', 'Joined', 'Training', 'Mock Test', 'Exam Booked', 'Result Pending', 'Result Received', 'Target Achieved', 'Application Pending', 'Application Created', 'Completed'];
    const currentIdx = order.indexOf(this.pte.status);
    const stageIdx = order.indexOf(stageKey);
    return currentIdx >= stageIdx && stageIdx !== -1;
  }

  getStatusBadgeClass(status?: string): string {
    const s = (status || this.pte?.status || '').toLowerCase();
    if (s.includes('target achieved')) return 'badge-success-glow';
    if (s.includes('joined') || s.includes('training')) return 'badge-primary-glow';
    if (s.includes('exam') || s.includes('mock')) return 'badge-warning-glow';
    if (s.includes('decline') || s.includes('dropped') || s.includes('not achieved')) return 'badge-danger-glow';
    return 'badge-info-glow';
  }
}
