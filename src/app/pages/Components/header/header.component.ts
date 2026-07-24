import { Component, OnInit } from '@angular/core';
import { NgbRatingConfig, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { MouMenuComponent } from '../mou-menu/mou-menu.component';

@Component({
  selector: 'app-physio-header',
  standalone: true,
  imports: [CommonModule, NgbModule, MouMenuComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class PhysioHeaderComponent implements OnInit {
  isMouPage: boolean = false;
 
  constructor(private router: Router) { }

  ngOnInit(): void {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.checkMouPage(event.urlAfterRedirects);
    });
    // Check initial route
    this.checkMouPage(this.router.url);
  }

  checkMouPage(url: string): void {
    const lowerUrl = url.toLowerCase();
    this.isMouPage = lowerUrl.includes('mou');
  }

}
