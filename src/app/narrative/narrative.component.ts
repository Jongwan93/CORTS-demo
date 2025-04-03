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

  typeClassMap: { [key: string]: string } = {
    incident: 'report-comment',
    narrative: 'narrative-comment',
    als: 'als-comment',
    vsa: 'vsa-comment',
    general: 'general-comment',
    system: 'system-comment',
  };

  onTextChange(newText: string) {
    this.narrativeCommentText = newText;
    this.narrativeCommentTextChange.emit(newText);
  }
}
