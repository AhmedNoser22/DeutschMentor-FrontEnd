import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_SETTINGS } from '../../core/config/app-settings';
import { PagedResult } from '../../core/models/paged-result.model';
import { toHttpParams } from '../../core/services/query-params';
import { AdminUser } from '../../models/admin/admin-user.models';

@Injectable({ providedIn: 'root' })
export class AdminUsersApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${APP_SETTINGS.apiBaseUrl}/api/admin/users`;

  list(query: { search: string; role: string; status: string; page: number }): Observable<PagedResult<AdminUser>> {
    return this.http.get<PagedResult<AdminUser>>(this.base, { params: toHttpParams(query) });
  }

  setLocked(id: string, locked: boolean): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/${locked ? 'lock' : 'unlock'}`, {});
  }
}