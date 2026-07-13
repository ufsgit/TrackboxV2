import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface Course {
  id?: number;
  name: string;
  amount: number;
  duration?: string;
  description?: string;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  constructor(private api: ApiService) {}

  getCourses(): Observable<any> {
    return this.api.get('/courses');
  }

  createCourse(course: Course): Observable<any> {
    return this.api.post('/courses', course);
  }

  updateCourse(id: number, course: Course): Observable<any> {
    return this.api.put(`/courses/${id}`, course);
  }

  deleteCourse(id: number): Observable<any> {
    return this.api.delete(`/courses/${id}`);
  }
}
