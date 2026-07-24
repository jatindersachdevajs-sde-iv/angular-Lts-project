import { Component, OnInit } from '@angular/core';
import { Router, RouteConfigLoadStart, RouteConfigLoadEnd, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PhysioHeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-base',
  standalone: true,
  imports: [CommonModule, RouterModule, PhysioHeaderComponent],
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.scss']
})
export class BaseComponent implements OnInit {

  isLoading: boolean | undefined;

  constructor(private router: Router) { 

    // Spinner for lazyload modules
    router.events.forEach((event) => { 
      if (event instanceof RouteConfigLoadStart) {
        this.isLoading = true;
      } else if (event instanceof RouteConfigLoadEnd) {
        this.isLoading = false;
      }
    });

    
  }

  ngOnInit(): void {
  }

}
