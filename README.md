# Food

## This is a simple real-time food ordering application.
This app helps your colleagues make their order, and most importantly it also displays everyone's money share.

###### This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 7.3.0.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

You will aslo need to create `src/environments/environment.ts` with the following variable (Replace the empty strings your own [Firebase's Cloud Firestore](https://firebase.google.com/docs/firestore/quickstart) configs):
```js
export const environment = {
  production: false,
  firebaseConfig: {
    apiKey: '',
    authDomain: '',
    databaseURL: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: ''
  }
};
```
