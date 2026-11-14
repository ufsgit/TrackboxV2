import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-whatsapp-qr-msg',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './whatsapp-qr-msg.component.html',
  styleUrls: ['./whatsapp-qr-msg.component.css']
})
export class WhatsappQrMsgComponent implements OnChanges, AfterViewChecked {
  @Input() isOpen = false;
  @Input() contact: any = null;
  @Output() closed = new EventEmitter<void>();
  @Output() readMarked = new EventEmitter<number>();

  @ViewChild('scrollContainer') private scrollContainer?: ElementRef;

  messages: any[] = [];
  loading = false;
  loadingMore = false;
  hasMore = true;
  private offset = 0;
  private readonly limit = 50;
  private shouldScrollToBottom = false;
  private previousScrollHeight = 0;

  private apiUrl = `${environment.apiUrl}/whatsapp-qr`;

  constructor(private http: HttpClient) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen && this.contact?.id) {
      this.resetChat();
      this.fetchMessages(true);
      // Only call markAsRead if the contact actually has unread messages
      if (this.contact.has_unread_wa === 1 || this.contact.has_unread_wa === true) {
        this.markAsRead();
      }
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  resetChat(): void {
    this.messages = [];
    this.offset = 0;
    this.hasMore = true;
    this.loading = false;
    this.loadingMore = false;
  }

  fetchMessages(isInitial = false): void {
    if (!this.contact?.id) return;
    if (isInitial) {
      this.loading = true;
    } else {
      this.loadingMore = true;
      if (this.scrollContainer) {
        this.previousScrollHeight = this.scrollContainer.nativeElement.scrollHeight;
      }
    }

    this.http.get<{ success: boolean; data: { messages: any[]; limit: number; offset: number } }>(
      `${this.apiUrl}/messages/${this.contact.id}?limit=${this.limit}&offset=${this.offset}`
    ).subscribe({
      next: (res) => {
        this.loading = false;
        this.loadingMore = false;

        if (res.success && res.data) {
          const list = res.data.messages || [];
          if (list.length < this.limit) {
            this.hasMore = false;
          }

          // list is DESC (newest to oldest)
          // reverse it to be ASC (oldest to newest)
          const newBatchAsc = [...list].reverse();

          if (isInitial) {
            this.messages = newBatchAsc;
            this.shouldScrollToBottom = true;
          } else {
            // Prepend older messages at the top
            this.messages = [...newBatchAsc, ...this.messages];

            // Maintain scroll position after prepending
            setTimeout(() => {
              if (this.scrollContainer) {
                const newScrollHeight = this.scrollContainer.nativeElement.scrollHeight;
                this.scrollContainer.nativeElement.scrollTop = newScrollHeight - this.previousScrollHeight;
              }
            }, 0);
          }

          this.offset += list.length;
        }
      },
      error: (err) => {
        this.loading = false;
        this.loadingMore = false;
        console.error('[WhatsApp QR Msg] Error loading messages:', err);
      }
    });
  }

  onScroll(event: Event): void {
    const el = event.target as HTMLElement;
    // When user scrolls to top (scrollTop === 0 or <= 10px) and there are more messages to load
    if (el.scrollTop <= 15 && !this.loading && !this.loadingMore && this.hasMore) {
      this.fetchMessages(false);
    }
  }

  markAsRead(): void {
    if (!this.contact?.id) return;
    if (!(this.contact.has_unread_wa === 1 || this.contact.has_unread_wa === true)) return;
    this.http.post<{ success: boolean }>(`${this.apiUrl}/mark-read/${this.contact.id}`, {})
      .subscribe({
        next: () => {
          this.contact.has_unread_wa = 0;
          this.readMarked.emit(this.contact.id);
        },
        error: (err) => {
          console.error('[WhatsApp QR Msg] Error marking as read:', err);
        }
      });
  }

  scrollToBottom(): void {
    try {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch (err) {}
  }

  close(): void {
    this.isOpen = false;
    this.messages = [];
    this.closed.emit();
  }
}

