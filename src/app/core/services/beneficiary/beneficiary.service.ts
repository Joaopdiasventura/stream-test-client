import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CreateBeneficiaryDto } from '../../../shared/dtos/beneficiary/create-beneficiary.dto';
import { Observable } from 'rxjs';
import { Message } from '../../../shared/interfaces/messages/message';

declare const API_URL: string;

@Injectable({
  providedIn: 'root',
})
export class BeneficiaryService {
  private readonly apiUrl = API_URL + '/beneficiary';
  private readonly http = inject(HttpClient);

  public reset(): Observable<Message> {
    return this.http.delete<Message>(this.apiUrl);
  }
}
