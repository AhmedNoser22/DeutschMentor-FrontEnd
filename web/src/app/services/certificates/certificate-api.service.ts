import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_SETTINGS } from '../../core/config/app-settings';
import { Certificate, CertificateSlot, VerifyCertificateResult } from '../../models/certificates/certificate.models';

@Injectable({ providedIn: 'root' })
export class CertificateApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${APP_SETTINGS.apiBaseUrl}/api/certificates`;

  list(): Observable<CertificateSlot[]> {
    return this.http.get<CertificateSlot[]>(this.base);
  }

  get(id: string): Observable<Certificate> {
    return this.http.get<Certificate>(`${this.base}/${id}`);
  }

  pdf(id: string): Observable<Blob> {
    return this.http.get(`${this.base}/${id}/pdf`, { responseType: 'blob' });
  }

  verify(code: string): Observable<VerifyCertificateResult> {
    return this.http.get<VerifyCertificateResult>(`${this.base}/verify/${encodeURIComponent(code)}`);
  }
}