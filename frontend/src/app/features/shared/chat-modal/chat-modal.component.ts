import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InboxComponent } from '../../inbox/inbox.component';

@Component({
  selector: 'app-chat-modal',
  standalone: true,
  imports: [CommonModule, InboxComponent],
  templateUrl: './chat-modal.component.html',
  styleUrls: ['./chat-modal.component.css']
})
export class ChatModalComponent {
  @Input() contactId!: number;
  @Input() convoId!: number;
  @Output() close = new EventEmitter<void>();

  closeModal() {
    this.close.emit();
  }
}
