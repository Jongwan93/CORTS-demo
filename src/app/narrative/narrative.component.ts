import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-narrative',
  imports: [CommonModule, FormsModule],
  templateUrl: './narrative.component.html',
})
export class NarrativeComponent {
  @Input() combinedEntries: any[] = [];
  @Input() narrativeCommentText: string = '';

  @Output() narrativeCommentTextChange = new EventEmitter<string>();
  @Output() saveChanges = new EventEmitter<void>();
  @Output() saveChangesExit = new EventEmitter<void>();
  @Output() reload = new EventEmitter<void>();

  onTextChange(newText: string) {
    this.narrativeCommentText = newText;
    this.narrativeCommentTextChange.emit(newText);
  }
}
