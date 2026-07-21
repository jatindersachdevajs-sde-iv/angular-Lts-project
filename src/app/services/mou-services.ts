import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { StorageService } from './storage.service';

import { Observable } from 'rxjs';
// import { environment } from 'src/environments/environment';



const AUTH_API = 'https://projectsapi.lpu.in/';//'https://projectsapi.lpu.in/'; //'https://projectsapi.lpu.in/';
const AUTH_API_LOCAL = 'https://projectsapi.lpu.in/';
const AUTH_API_LOCALs = 'https://projectsapi.lpu.in/'; //'https://localhost:7125/'; 
const AUTH_API_LOCAs = 'https://projectsapi.lpu.in/'; //'https://localhost:7125/';  


// const AUTH_API = 'https://localhost:7135/';//'https://projectsapi.lpu.in/'; //'https://projectsapi.lpu.in/';
// const AUTH_API_LOCAL = 'https://localhost:7135/';
// const AUTH_API_LOCALs = 'https://localhost:7135/'; //'https://localhost:7125/'; 
// const AUTH_API_LOCAs = 'https://localhost:7135/'; //'https://localhost:7125/';  

@Injectable({
  providedIn: 'root'
})
export class MouServices {
  FileData: string | undefined;
  fileName: string | undefined;

  constructor(private http: HttpClient, private storage: StorageService) { }

  // added on 14-May-26

  GetMouCategories(): Observable<any> {
    let token = this.storage.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + token)
      .set('Content-Type', 'application/json');
    return this.http.get(
      AUTH_API + 'api/Mou/GetMouCategoriesProperties',
      { headers }
    );


  }
  GetRenewedMouDetails(Id: any): Observable<any> {
    let authToken = this.storage.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
      .set('Content-Type', 'application/json');
    return this.http.get(AUTH_API + 'api/Mou/GetRenewedMouDetails?MouId=' + Id, { headers });
    // return this.http.get(AUTH_API + 'api/Mou/GetUIDWiseMouDocumentDetails?Uid=' + Id, { headers });
  }



  GetEmployeeDetails(): Observable<any> {
    let token = this.storage.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + token)
      .set('Content-Type', 'application/json');
    return this.http.get(
      AUTH_API + 'api/Mou/GetEmployeeDetails',
      { headers }
    );
  }

  MouRenewalDetails(dataSoft: FormData): Observable<any> {
    let authToken = this.storage.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
    return this.http.post(AUTH_API + 'api/Mou/MouRenewalInsertNewRecord', dataSoft, { headers }

    );
  }


  MouDocumentUpload(dataSoft: FormData): Observable<any> {
    let authToken = this.storage.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
    return this.http.post(AUTH_API + 'api/Mou/MouDocumentInsert', dataSoft, { headers }
    );
  }

  GetAllUploadedDocuments(): Observable<any> {
    let authToken = this.storage.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
      .set('Content-Type', 'application/json');
    return this.http.get(AUTH_API + 'api/Mou/GetAllUploadedDocuments', { headers }
      // return this.http.get(AUTH_API_LOCAL + 'api/Mou/GetAllUploadedDocuments', { headers }
    );
  }
  ApproveDocument(dataSoft: FormData): Observable<any> {
    let authToken = this.storage.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
    return this.http.post(
      AUTH_API + 'api/Mou/ApprovalAction',
      dataSoft,
      { headers });
  }


  MouDocumentUpdateFile(dataSoft: FormData): Observable<any> {
    let authToken = this.storage.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
    return this.http.post(
      AUTH_API + 'api/Mou/MouDocumentUpdateFile',
      dataSoft,
      { headers }
    );
  }

  GetUIDWiseUploadedDocuments(Id: any): Observable<any> {
    let authToken = this.storage.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
      .set('Content-Type', 'application/json');
    return this.http.get(AUTH_API + 'api/Mou/GetUIDWiseMouDocumentDetails?Uid=' + Id, { headers });
    // return this.http.get(AUTH_API + 'api/Mou/GetUIDWiseMouDocumentDetails?Uid=' + Id, { headers });
  }

  MouActivityInsert(dataSoft: FormData): Observable<any> {
    let authToken = this.storage.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
    return this.http.post(
      AUTH_API + 'api/Mou/MouActivityInsert',
      dataSoft,
      { headers }
    );
  }

  GetUIDWiseMouActivityDetails(Id: any): Observable<any> {
    let authToken = this.storage.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
      .set('Content-Type', 'application/json');
    return this.http.get(AUTH_API + 'api/Mou/GetUIDWiseMouActivityDetails?Uid=' + Id, { headers });
  }

  GetAllUploadedActivities(): Observable<any> {
    let authToken = this.storage.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
      .set('Content-Type', 'application/json');
    return this.http.get(AUTH_API + 'api/Mou/GetAllMouActivityDetails', { headers });
  }

  MouActivityUpdateFile(dataSoft: FormData): Observable<any> {
    let authToken = this.storage.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
    return this.http.post(
      AUTH_API + 'api/Mou/MouActivityUpdateFile',
      dataSoft,
      { headers }
    );
  }

  ApproveActivity(dataSoft: FormData): Observable<any> {
    let authToken = this.storage.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
    return this.http.post(
      AUTH_API + 'api/Mou/ActivityApprovalAction',
      dataSoft,
      { headers }
    );
  }

  GetEmployeeData(): Observable<any> {
    let authToken = this.storage.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
      .set('Content-Type', 'application/json');
    return this.http.get(
      AUTH_API + 'api/Mou/GetAllEmployeeData',
      { headers }
    );
  }
  MouDocumentsforApproval(EmployeeCode: any): Observable<any> {
    let authToken = this.storage.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
      .set('Content-Type', 'application/json');
    return this.http.get(
      AUTH_API + 'api/Mou/GetMouDocumentsforApproval?Uid=' + EmployeeCode,
      { headers }
    );
  }

  MouNewActivityPlanAddNew(dataSoft: FormData): Observable<any> {
    let authToken = this.storage.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
    //.set('Authorization', 'Bearer ' + this.Localtoken)
    return this.http.post(
      AUTH_API + 'api/Mou/MouNewActivityPlan',
      // AUTH_API + 'api/Mou/MouNewActivityPlan',
      dataSoft,
      { headers }
    );

  }
  InsertMouActivityActionTaken(dataSoft: FormData): Observable<any> {
    let authToken = this.storage.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
    //.set('Authorization', 'Bearer ' + this.Localtoken)
    return this.http.post(
      AUTH_API + 'api/Mou/MouActivityActionTakenInsert',
      // AUTH_API + 'api/Mou/MouActivityActionTakenInsert',
      dataSoft,
      { headers }
    );

  }
  MouDocumentstoTakeAction(Uid: any): Observable<any> {
    let authToken = this.storage.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
      .set('Content-Type', 'application/json');
    return this.http.get(
      AUTH_API_LOCALs + 'api/Mou/GetMouDocumentstoTakeAction?Uid=' + Uid,

      { headers }
    );
  }


  MouActionsTakenData(Uid: any, SessionId: any): Observable<any> {
    let authToken = this.storage.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
      .set('Content-Type', 'application/json');
    return this.http.get(
      AUTH_API + 'api/Mou/GetMouActivityActionTakenWithSession?Uid=' + Uid + '&SessionId=' + SessionId,
      { headers }
    );
  }
  ApproveMouActionTakenDocument(dataSoft: FormData): Observable<any> {
    let authToken = this.storage.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
    return this.http.post(
      AUTH_API_LOCAs + 'api/Mou/MouActionTakenDocumentApproval',
      dataSoft,
      { headers }
    );

  }

  MOUGetAllActivitiesAssigned(EmployeeCode: any): Observable<any> {
    let authToken = this.storage.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
      .set('Content-Type', 'application/json');
    return this.http.get(
      AUTH_API + 'api/Mou/GetAllActivitiesAssigned?Uid=' + EmployeeCode,
      { headers }
    );
  }

  UpdateSchoolDivision(dataSoft: FormData): Observable<any> {
    let authToken = this.storage.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
    //.set('Authorization', 'Bearer ' + this.Localtoken)
    return this.http.post(
      AUTH_API + 'api/Mou/MouUpdateSchoolInvolved',
      dataSoft,
      { headers });

  }

  MouActivityandActionDetails(StartDate: any, endDate: any): Observable<any> {
    let authToken = this.storage.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
      .set('Content-Type', 'application/json');
    return this.http.get(
      AUTH_API_LOCAL + 'api/Mou/GetAllMouActivityAndActionDetails?StartDate=' + StartDate + '&EndDate=' + endDate,
      { headers }
    );
  }

  GetAllMouActivities(): Observable<any> {
    let token = this.storage.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + token)
      .set('Content-Type', 'application/json');
    return this.http.get(
      AUTH_API_LOCAL + 'api/Mou/GetAllMouActivityCategories', { headers }
    );
  }

  UpdateMOUActionPlanMaster(dataSoft: FormData): Observable<any> {
    let authToken = this.storage.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
    return this.http.post(
      AUTH_API_LOCAL + 'api/Mou/MOUActionPlanMaster',
      dataSoft,
      { headers });

  }


  GetAllMouDocumentDetails(): Observable<any> {
    let authToken = this.storage.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
      .set('Content-Type', 'application/json');
    return this.http.get(AUTH_API + 'api/Mou/GetAllMouDocumentDetails', { headers });
  }

  GetMouActivityActionTakenDetails(Id: any): Observable<any> {
    let token = this.storage.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + token)
      .set('Content-Type', 'application/json');
    return this.http.get(
      AUTH_API_LOCAL + 'api/Mou/GetMouActivityActionTakenDetails?Mouid=' + Id,
      { headers }
    );
  }
  GetAllMouActivitiesForAdminAction(Session: any): Observable<any> {
    let authToken = this.storage.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
      .set('Content-Type', 'application/json');
    return this.http.get(
      AUTH_API_LOCAL + 'api/Mou/GetAllMouActivitiesForAdminAction?SessionId=' + Session,
      { headers }
    );
  }

  GetAllMouActivitiesForExportToExcel(Uid: any): Observable<any> {
    let authToken = this.storage.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
      .set('Content-Type', 'application/json');
    return this.http.get(
      AUTH_API + 'api/Mou/GetAllMouActivitiesForExportToExcel?UID=' + Uid,
      { headers }
    );
  }


  GetMouDocumentToAssignActivity(EmployeeCode: any): Observable<any> {
    let authToken = this.storage.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
      .set('Content-Type', 'application/json');
    return this.http.get(
      AUTH_API + 'api/Mou/GetMouDocumentsToAssignActivity?Uid=' + EmployeeCode,
      { headers }
    );
  }


  GetAllOBPPlannerSessions(): Observable<any> {
    let token = this.storage.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + token)
      .set('Content-Type', 'application/json');
    return this.http.get(
      AUTH_API + 'api/LpuObpAutomation/GetOBPPlannerSessions', { headers }
    );
  }

  GetAllActivitiesAssignedwithSession(EmployeeCode: any, SessionId: any): Observable<any> {
    let authToken = this.storage.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
      .set('Content-Type', 'application/json');
    return this.http.get(
      AUTH_API + 'api/Mou/GetAllActivitiesAssignedwithSession?Uid=' + EmployeeCode + '&SessionId=' + SessionId,
      // 'https://localhost:7135/api/Mou/GetAllActivitiesAssignedwithSession?Uid=' + EmployeeCode + '&SessionId=' + SessionId,

      { headers }
    );
  }
  GetMouDocumentsToAssignActivityWithSession(EmployeeCode: any, SessionId: any): Observable<any> {
    let authToken = this.storage.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
      .set('Content-Type', 'application/json');
    return this.http.get(
      AUTH_API + 'api/Mou/GetMouDocumentsToAssignActivityWithSession?Uid=' + EmployeeCode + '&SessionId=' + SessionId,
      { headers }
    );
  }


  ActivityPlanUpdateUID(DataToSend: FormData): Observable<any> {
    let authToken = this.storage.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
    return this.http.post(
      AUTH_API + 'api/Mou/MouActivityPlanUpdateUID',
      DataToSend,
      { headers }
    );
  }

  GetAllActivities(): Observable<any> {
    let token = this.storage.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + token)
      .set('Content-Type', 'application/json');
    return this.http.get(
      AUTH_API + 'api/Mou/GetMouActivityProperties', { headers }
    );
  }

  downloadMOUFile(fileUrl: string): Observable<Blob> {
    const payload = {
      fileName: fileUrl,
      folderPath: ""
    };
    const token = this.storage.getUser();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': '*/*',
      'Authorization': `Bearer ${token}`
    });
    return this.http.post(AUTH_API + 'api/Mou/DownloadMOUFiles/MOUDownloadFiles', payload, {
      headers: headers,
      responseType: 'blob'
    });
  }

  downloadMOUFileWithFolder(fileUrl: string, folderPath: any): Observable<Blob> {
    const payload = {
      fileName: fileUrl,
      folderPath: folderPath
    };
    const token = this.storage.getUser();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': '*/*',
      'Authorization': `Bearer ${token}`
    });
    return this.http.post(AUTH_API + 'api/Mou/DownloadMOUFiles/MOUDownloadFiles', payload, { headers: headers, responseType: 'blob' });
  }





  MouReminderEmail(dataSoft: FormData): Observable<any> {
    let authToken = this.storage.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
    return this.http.post(
      //  'https://localhost:7135/api/Mou/MouSendPendingReminderEmail',
      AUTH_API + 'api/Mou/MouSendPendingReminderEmail',
      dataSoft,
      { headers }
    );

  }


  ReassignNewUID(dataSoft: FormData): Observable<any> {
    let authToken = this.storage.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
    return this.http.post(
      //  'https://localhost:7135/api/Mou/MouSendPendingReminderEmail',
      AUTH_API + 'api/Mou/ReassingActivitytoNewUID',
      dataSoft,
      { headers }
    );

  }




  MouActionTakenDocumentsOperations(dataSoft: FormData): Observable<any> {
    let authToken = this.storage.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
    return this.http.post(
      //  'https://localhost:7135/api/Mou/MouActionTakenDocumentsOperations',
      AUTH_API + 'api/Mou/MouActionTakenDocumentsOperations',
      dataSoft,
      { headers }
    );

  }


  GetAllActionTakenUploadedDocument(dataSoft: FormData): Observable<any> {
    let authToken = this.storage.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
    return this.http.post(
      //  'https://localhost:7135/api/Mou/MouActionTakenDocumentsOperations',
      AUTH_API + 'api/Mou/GetUploadedDocumentDetails',
      dataSoft,
      { headers }
    );


  }
  GetAllCategories(): Observable<any> {
    let authToken = this.storage.getUser();
    let headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + authToken)
    return this.http.get(
      //  'https://localhost:7135/api/Mou/MouActionTakenDocumentsOperations',
      AUTH_API + 'api/Mou/GetMouCategoriesProperties',
      { headers }
    );
  }

}

