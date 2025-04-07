import { Directive, ElementRef, Renderer2, OnDestroy } from '@angular/core';
import { CorStateService } from './corStatus.service';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[appDisableIf]',
  standalone: true,
})
export class DisableIfClosed implements OnDestroy {
  private subscription: Subscription;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private corStateService: CorStateService
  ) {
    this.subscription = this.corStateService.isDisabled$.subscribe(
      (isDisabled) => {
        this.renderer.setProperty(
          this.el.nativeElement,
          'disabled',
          isDisabled
        );
      }
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
