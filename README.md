# Sample Auth0 and Angular-OAuth2-OIDC Application

This repository demonstrates how to connect your Angular 6 application to Auth0 using the implicit flow.
It is the companion to a blog post written for [Infi](https://infi.nl).

## Disclaimers

Let's get some disclaimers out of the way.
This repository is **frozen in time**: it was created in **September 2018** and probably never updated.
So you might have to adjust the advice here for your own timeline.

Second, this repository demonstrates **how to connect the dots** but it also **glosses over details**.
It should help you get started, or grasp the idea.
But please adjust accordingly for production applications.

## Let's get started

This is a very specific, technical, pragmatic post.
It's just what we enjoy at Infi: getting those important details just right.
If you came here for fluffy content about agile, or projects, or fun stuff: better skip this post.
You've been warned!

Actually, this is one post in a series:

1. The "About" part, describing all moving parts and processes.
1. The "Gimme-teh-codez" part, that walks you through the code.

If you already know how the Implicit Flow works, you can safely skip parts of the post.
If code says more than words to you, or if you know how Auth0 works, you can safely skip the entire post, and go straight to part 2.
For the rest of us, we'll start at the beginning.

Let's get cracking!

## About the things involved

Let's first get our terminology straight.
What's what!?

### About the Implicit Flow

OAuth2 and OpenID Connect are standards for how to authenticate and (to some degree) authorize users in your systems.
It assumes this type of setup with three items:

1. An **Identity Server** application handles user accounts, passwords, 2FA, and all that good jazz.
1. **Clients** (like an Angular application) that send their users to the Id Server to log in, (after which they're redirected back to the Client).
1. Your **API**, which needs the access token on each call to verify access.

This differs from the slightly simpler (but less secure) **Resource Owner Password** flow.
With the Implicit Flow the Client never sees credentials: users trust only the Id Server with those.
On the downside, you do have some redirection going on for the user.
The user sees login screens from the Id Server, but this should not be a big problem because:

- Either it's a well-known provider, and users are right to trust it.
- Or it's your own identity server, and you can style things to make it "part of the client experience".

Oh, and this flow also quite naturally supports external Identity Providers (the "log in with Google/GitHub/etc" stuff).
Which is very nice for users.

This series focuses mainly on interaction between the **Identity Server** (Auth0) and an (Angular 6+) **Client**.
Let's dive into the details about the moving parts.

Footnote: read more about [the Implicit Flow in RFC 6749](https://tools.ietf.org/html/rfc6749#section-1.3.2).

### About the Identity Server

You can of course create your own Identity Server.
Security is hard though, so don't completely roll your own.
Instead, use an existing solution to build from.

There's good ones available for nearly every tech stack.
For .NET there's [IdentityServer](https://identityserver.io/), Java e.g. has [spring-oauth-server](https://github.com/authlete/spring-oauth-server), and so forth.

However, there are also SAAS solutions (sometimes called IDaaS) available.
For example [Okta](https://www.okta.com/), [Keycloak](https://www.keycloak.org/), and [Auth0](https://auth0.com/).
In this tutorial we use **Auth0** (a comparison is left for another time).

### About the API

In this post we won't touch on the API side of things.
The beauty of OAuth2 is that the API side of things is largely *decoupled* from the rest.
We will get to the point where access tokens are sent to a dummy API, and assume everything would work from there.

There is one important note about the flow relevant though.
Tokens are passed plainly to the API by the client application.
The format for such tokens is "JWT" (pronounced like "jot"), typically at least *signed* (JWS), or alternatively *encrypted* (JWE).
Your API can verify (or decrypt) the tokens.

To do this the API will need to get the public key (or decryption key) from the ID Server.
It typically does so "live", by calling the ID Server (cached and refreshed every so often).
But you can also provide these keys out of band.

Footnote: read more about [JSON Web Tokens (JWT) in RFC 7519](https://tools.ietf.org/html/rfc7519).

### About the Client

For OAuth2, a "Client" is an abstract concept.
It can be a Single Page Web App, a mobile application, a traditional MVC Web App, or even another API.
When talking about "the Client" in this post, we're talking about our Angular 6+ CLI application.
The Implicit Flow is well-suited for Single Page (JavaScript) Applications.

When a Client determines that a user should log in, it redirects the user to the Identity Server.
The user logs in at the Identity Server, and gets redirected back to the Client.
The Client at this point expects that the user "brings back" the access token (and possibly id token).
This is typically done by the Identity Server redirecting back to the URL of the client with tokens in the hash fragment of the URL.

We will build an Angular CLI application from scratch in part 2 of this series.
In it we will use one of the available libraries for handling the OAuth2 and OpenID Connect parts: [`angular-oauth2-oidc`](https://github.com/manfredsteyer/angular-oauth2-oidc).
The Angular application will require users to log in with Auth0, and send the retrieved tokens along to the dummy API.

Footnote: read more about [Clients in RFC 6749](https://tools.ietf.org/html/rfc6749#section-2).

## Putting things together

Let's put what we learned above in a picture:

![Implicit Flow diagram](implicit-flow.png)

The two lines between Client and ID Server in this (simplified!) visualization *are* "the Flow".
They determine how a Client can retrieve a token from the ID Server.

Some specific things missing in the picture:

- All log in screens happening when the user is at the ID Server. We use Auth0 in this series, so it's all taken care of for us.
- Third party logins, e.g. "Log in with Google". This would include a fourth box all the way to the left, but with Auth0 that only requires configuration, no coding on our part.
- Silent refreshes: access tokens are short lived, so you need to get a fresh one every hour or so. Turns out that's just the normal flow in a hidden iframe, how it works is shown when we work on the code.

And that's all there is to it!
In the next part we will start working on the actual code.

## Let's Code

In the previous part we discussed the OAuth2 Implicit Flow.
But code is a more efficient way of communicating, don't you think?
So let's get to it!

### Prerequisites

To follow along, you need these things:

- Node (tested with 10.8.0) and NPM (tested with 6.3.0)
- Angular CLI (tested with 6.1.5)
- An IDE (VS Code is nice for Angular coding)
- A shell (Powershell or Bash will do)

In addition you will need an [Auth0](https://auth0.com/) account.
You can create one now, or when we get to that part.

### Angular setup

Let's start with this:

```bash
ng new DemoApp --inline-style --inline-template --skip-tests --skip-git
cd DemoApp
ng serve --open
```

This should open a default, minimalistic Angular application.
It leaves the console waiting for hot-reload requests.
Next, open the `DemoApp` folder in your editor, and replace `app.component.ts` with this:

```typescript
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
```

Your app should look somewhat like this (if you steal some of [these styles](DemoApp/src/styles.css)):

![initial app](scaffolded-app.png)

### Adding angular-oauth2-oidc

TODO

### Setting up Auth0

TODO

### Connecting the dots

TODO

## Conclusions

TODO
