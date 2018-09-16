import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `<h1>DemoApp</h1>
    <p>You are logged in as {{username}}.</p>
    <p>
      <button (click)='login()'>Log in</button>
      <button (click)='logout()'>Log out</button>
      <button (click)='refresh()'>Refresh</button>
    </p>
    <p>Access Token</p><pre>{{token | json}}</pre>
    <p>Claims</p><pre>{{claims | json}}</pre>
  `,
  styles: []
})
export class AppComponent {
  username = 'TODO';
  token = 'TODO';
  claims = 'TODO';

  constructor() { }

  login() { }
  logout() { }
  refresh() { }
}
