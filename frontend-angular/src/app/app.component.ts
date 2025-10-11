import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';


@Component({
standalone: true,
selector: 'app-root',
imports: [RouterOutlet, RouterLink],
template: `
<header class="container flex items-center justify-between py-6">
<a routerLink="/" class="link"><strong>Project</strong></a>
<nav class="flex items-center gap-6">
<a routerLink="/about" class="link">About</a>
<a routerLink="/contact" class="link">Contact</a>
<a routerLink="/login" class="btn btn-outline">Login</a>
</nav>
</header>
<main>
<router-outlet/>
</main>
<footer class="container py-6 text-muted">© {{new Date().getFullYear()}}</footer>
`
})
export class AppComponent {}