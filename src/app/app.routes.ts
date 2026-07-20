import { Routes } from '@angular/router';
import { Home } from './pages/home/home';

export const routes: Routes = [
  {
    path: '',
    component: Home
  },
  {
    path: 'MouNewRequest/:loginName', 
    loadChildren: () => import('./pages/mou-documents-uploads/mou-documents-uploads.module').then(m => m.MouDocumentsUploadsModule)
  },
  {
    path: 'mou-documents-report/:loginName',
    loadChildren: () => import('./pages/mou-documents-report/mou-documents-report.module')
        .then(m => m.MouDocumentsReportModule)
},
{
    // Backward compatibility for old capitalized URL
    path: 'MouDocumentsReport/:loginName',
    redirectTo: 'mou-documents-report/:loginName',
    pathMatch: 'full'
}
];