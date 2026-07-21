import {
  AfterViewInit,
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  Renderer2
} from '@angular/core';

/**
 * Mirrors a horizontally-scrollable element's scrollbar at the TOP of its
 * container, in addition to the native scrollbar that already sits at the
 * bottom. Lets users grab a horizontal scrollbar as soon as a wide grid
 * comes into view, instead of having to scroll to the bottom of the page
 * first.
 *
 * Usage:
 *   <div appTopScrollSync>...</div>                 -> host itself scrolls
 *   <div appTopScrollSync=".datatable-body">...</div> -> a descendant scrolls
 *     (e.g. ngx-datatable's internally-scrolling body)
 */
@Directive({
  selector: '[appTopScrollSync]',
  standalone: true
})
export class TopScrollSyncDirective implements AfterViewInit, OnDestroy {
  @Input('appTopScrollSync') scrollTargetSelector = '';

  private topBar?: HTMLDivElement;
  private topBarSpacer?: HTMLDivElement;
  private scrollTarget?: HTMLElement;
  private resizeObserver?: ResizeObserver;
  private mutationObserver?: MutationObserver;
  private isSyncingFromTop = false;
  private isSyncingFromTarget = false;
  private retryHandle?: number;

  private readonly onTargetScroll = (): void => {
    if (!this.topBar || !this.scrollTarget) {
      return;
    }
    if (this.isSyncingFromTop) {
      this.isSyncingFromTop = false;
      return;
    }
    this.isSyncingFromTarget = true;
    this.topBar.scrollLeft = this.scrollTarget.scrollLeft;
  };

  private readonly onTopBarScroll = (): void => {
    if (!this.topBar || !this.scrollTarget) {
      return;
    }
    if (this.isSyncingFromTarget) {
      this.isSyncingFromTarget = false;
      return;
    }
    this.isSyncingFromTop = true;
    this.scrollTarget.scrollLeft = this.topBar.scrollLeft;
  };

  constructor(private host: ElementRef<HTMLElement>, private renderer: Renderer2) { }

  ngAfterViewInit(): void {
    this.locateScrollTarget();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.mutationObserver?.disconnect();
    this.scrollTarget?.removeEventListener('scroll', this.onTargetScroll);
    this.topBar?.removeEventListener('scroll', this.onTopBarScroll);
    if (this.retryHandle) {
      window.clearTimeout(this.retryHandle);
    }
    this.topBar?.remove();
  }

  private locateScrollTarget(): void {
    const hostEl = this.host.nativeElement;
    const target = this.scrollTargetSelector
      ? hostEl.querySelector<HTMLElement>(this.scrollTargetSelector)
      : hostEl;

    if (!target) {
      // Third-party grid bodies (e.g. ngx-datatable) can render a tick late.
      this.retryHandle = window.setTimeout(() => this.locateScrollTarget(), 100);
      return;
    }

    this.scrollTarget = target;
    this.buildTopBar();
    this.observeSize();
    this.refreshSpacerWidth();

    this.scrollTarget.addEventListener('scroll', this.onTargetScroll);
    this.topBar!.addEventListener('scroll', this.onTopBarScroll);
  }

  private buildTopBar(): void {
    this.topBar = this.renderer.createElement('div');
    this.renderer.addClass(this.topBar, 'top-scroll-sync-bar');

    this.topBarSpacer = this.renderer.createElement('div');
    this.renderer.addClass(this.topBarSpacer, 'top-scroll-sync-spacer');

    this.renderer.appendChild(this.topBar, this.topBarSpacer);
    this.renderer.insertBefore(this.host.nativeElement.parentNode, this.topBar, this.host.nativeElement);
  }

  private observeSize(): void {
    if (typeof ResizeObserver !== 'undefined' && this.scrollTarget) {
      this.resizeObserver = new ResizeObserver(() => this.refreshSpacerWidth());
      this.resizeObserver.observe(this.scrollTarget);
    }
    if (typeof MutationObserver !== 'undefined' && this.scrollTarget) {
      this.mutationObserver = new MutationObserver(() => this.refreshSpacerWidth());
      this.mutationObserver.observe(this.scrollTarget, { childList: true, subtree: true });
    }
  }

  private refreshSpacerWidth(): void {
    if (!this.scrollTarget || !this.topBarSpacer || !this.topBar) {
      return;
    }
    const scrollWidth = this.scrollTarget.scrollWidth;
    this.renderer.setStyle(this.topBarSpacer, 'width', `${scrollWidth}px`);
    this.renderer.setStyle(
      this.topBar,
      'display',
      scrollWidth > this.scrollTarget.clientWidth ? 'block' : 'none'
    );
  }
}
