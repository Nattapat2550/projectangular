import { Component } from '@angular/core';
import { ApiService } from '../../core/services/api.service';


@Component({
standalone: true,
selector: 'app-settings',
templateUrl: './settings.component.html'
})
export class SettingsComponent {
constructor(private api: ApiService) {}
}