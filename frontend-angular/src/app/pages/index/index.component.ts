import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';


@Component({
standalone: true,
selector: 'app-index',
imports: [RouterLink],
templateUrl: './index.component.html',
styleUrls: ['./index.component.css']
})
export class IndexComponent {}