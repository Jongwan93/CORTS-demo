import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-query',
  standalone: true,
  imports: [RouterModule, FormsModule],
  templateUrl: './query.component.html',
  styleUrls: ['./query.component.css']
})
export class QueryComponent {
  EnableDate(asObjectID: string) {
    const isChecked = (event?.target as HTMLInputElement).checked;
    document.getElementById(`${asObjectID}From`)?.toggleAttribute("disabled", isChecked);
    document.getElementById(`${asObjectID}To`)?.toggleAttribute("disabled", isChecked);
  }
  

  SetDirection(direction: string) {
    console.log(`Direction: ${direction}`);
  }
}
