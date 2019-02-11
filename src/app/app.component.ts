import { Component, OnInit, ElementRef, ViewChild, TemplateRef } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as firebase from 'firebase/app';
import 'firebase/firestore';

import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  Object = Object;
  modalRef: BsModalRef;
  @ViewChild('template') template: ElementRef;
  result: any = {};
  fees = 0;
  users = {};
  currentUser: any;

  order = {};
  myOrder = {};
  orderCollection: firebase.firestore.CollectionReference;
  foodUsersCollection: firebase.firestore.CollectionReference;

  orderItemForm: FormGroup;

  constructor(private modalService: BsModalService, private fb: FormBuilder) { }

  ngOnInit() {
    // Initialize Firebase
    const config = environment.firebaseConfig;
    firebase.initializeApp(config);
    const db = firebase.firestore();
    db.settings({ timestampsInSnapshots: true });
    this.foodUsersCollection = db.collection('foodUsers');
    this.orderCollection = db.collection('order');

    if (JSON.parse(localStorage.getItem('foodUser')) === null) {
      this.modalRef = this.modalService.show(this.template, { keyboard: false, ignoreBackdropClick: true });
    } else {
      this.startApp();
    }
  }

  openModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(template);
  }

  startApp() {
    this.currentUser = JSON.parse(localStorage.getItem('foodUser'));

    this.orderItemForm = this.fb.group({
      item: [''],
      quantity: ['', Validators.min(1)],
      owners: [[]]
    });

    this.foodUsersCollection.onSnapshot((querySnapshot) => {
      this.users = {};
      querySnapshot.forEach((doc) => {
        this.users[doc.id] = doc.data();
      });

    });

    this.orderCollection.where('owners', 'array-contains', this.currentUser.username).onSnapshot((querySnapshot) => {
      this.myOrder = {};
      querySnapshot.forEach((doc) => {
        this.myOrder[doc.id] = doc.data();
      });

    });

    this.orderCollection.onSnapshot((querySnapshot) => {
      this.order = {};
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.quantity > 0) {
          this.order[doc.id] = data;
        } else {
          doc.ref.delete();
        }
      });

    });
  }

  signIn(username: string) {
    if (username !== '') {
      this.foodUsersCollection.add({ username })
        .then((docRef) => {
          console.log('Document written with ID: ', docRef.id);
          localStorage.setItem('foodUser', JSON.stringify({ id: docRef.id, username }));
          this.modalRef.hide();
          this.startApp();
        })
        .catch((error) => console.error('Error adding document: ', error));
    }
  }

  onSubmit() {
    const item = JSON.parse(JSON.stringify(this.orderItemForm.value));
    item.owners = Array(item.quantity).fill(this.currentUser.username);
    this.orderCollection.add(item)
      .then((docRef) => {
        console.log('Document written with ID: ', docRef.id);
      })
      .catch((error) => console.error('Error adding document: ', error));
  }

  onChange(event: any, id: string, oldValue: number) {
    const newValue = +event.target.value;
    const updates: any = { quantity: newValue };

    if (newValue > oldValue) {
      updates.owners = [...this.order[id].owners, ...Array(newValue - oldValue).fill(this.currentUser.username)];
    } else if (newValue < oldValue) {
      const limit = Math.min(this.getOwnQuantity(id), oldValue - newValue);
      for (let index = 0; index < limit; index++) {
        this.order[id].owners.splice(this.order[id].owners.indexOf(this.currentUser.username), 1);
      }
      updates.owners = this.order[id].owners;
      updates.quantity = oldValue - limit;
    }

    this.orderCollection.doc(id)
      .update(updates)
      .catch(error => console.error(error));
  }

  onPrice(event: any, id: string) {
    this.orderCollection.doc(id).update({ price: +event.target.value })
      .catch(error => console.error(error));
  }

  getOwnQuantity(id: string): number {
    if (this.myOrder[id]) {
      return this.myOrder[id].owners.filter(o => o === this.currentUser.username).length;
    }
    return 0;
  }

  getOwners(owners: string[]) {
    return owners.reduce((acum, cur) => {
      acum[cur] = (acum[cur] || 0) + 1;
      return acum;
    }, {});
  }

  deleteItem(id: string) {
    const myQuantity = +this.getOwnQuantity(id);
    if (myQuantity === 0) {
      return;
    }
    const totalQuantity = +this.order[id].quantity;

    if (totalQuantity === myQuantity) {
      this.orderCollection.doc(id).delete()
        .catch(error => console.error(error));
    } else {
      this.orderCollection.doc(id)
        .update({
          quantity: totalQuantity - myQuantity,
          owners: this.order[id].owners.filter(o => o !== this.currentUser.username)
        });
    }

  }

  doMath() {
    const res = {};
    this.orderCollection.get()
      .then(querySnapshot => {
        querySnapshot.forEach(doc => {
          const data = doc.data();
          data.owners.reduce((acum, cur) => {
            acum[cur] = (acum[cur] || 0) + data.price;
            return acum;
          }, res);
        });
        const feesShare = this.fees / (Object.keys(res).length || 1);
        for (const key in res) {
          if (res.hasOwnProperty(key)) {
            res[key] += feesShare;
          }
        }
        this.result = res;
      });
  }

  deleteOrder() {
    this.orderCollection.get().then(querySnapshot => querySnapshot.forEach(doc => doc.ref.delete()));
  }

  logout() {
    this.foodUsersCollection.doc(this.currentUser.id).delete();
    localStorage.clear();
    this.modalRef = this.modalService.show(this.template, { keyboard: false, ignoreBackdropClick: true });
    this.currentUser = undefined;
  }
}
