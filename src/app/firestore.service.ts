import { Injectable } from '@angular/core';
import * as firebase from 'firebase/app';
import 'firebase/firestore';

import { environment } from '../environments/environment';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  usersCollection: firebase.firestore.CollectionReference;
  ordersCollection: firebase.firestore.CollectionReference;
  itemsCollection: firebase.firestore.CollectionReference;
  currentUser: string;

  constructor(private router: Router) {
    const config = environment.firebaseConfig;
    firebase.initializeApp(config);
    const db = firebase.firestore();
    db.settings({ timestampsInSnapshots: true });
    this.usersCollection = db.collection('users');
    this.ordersCollection = db.collection('orders');
    this.itemsCollection = db.collection('items');

    this.currentUser = localStorage.getItem('currentUser');
  }

  logout() {
    this.usersCollection.doc(this.currentUser).delete();
    localStorage.clear();
    this.currentUser = undefined;
    this.router.navigate(['/']);
  }

  async signIn(username: string): Promise<boolean> {
    return this.usersCollection
      .doc(username)
      .get()
      .then(docSnapshot => {
        console.log(docSnapshot);
        if (docSnapshot.exists) {
          return false;
        } else {
          docSnapshot.ref.set({}).then(d => console.log(d));
          localStorage.setItem('currentUser', username);
          this.currentUser = username;
          return true;
        }
      })
      .catch(() => false);
  }
}
