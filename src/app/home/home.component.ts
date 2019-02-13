import { Component, OnInit, TemplateRef } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { FirestoreService } from '../firestore.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  modalRef: BsModalRef;
  message = '';
  orders: any[] = [];

  constructor(
    private modalService: BsModalService,
    public firestoreService: FirestoreService,
  ) {}

  ngOnInit() {
    this.firestoreService.ordersCollection.onSnapshot(querySnapshot => {
      querySnapshot.docChanges().forEach(docChange => {
        this.orders.push({
          id: docChange.doc.id,
          name: docChange.doc.data().name
        });
      });
    });
  }

  createOrder(name: string) {
    this.firestoreService.ordersCollection
      .add({ name })
      .then(() => this.modalRef.hide());
  }

  openModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(template);
  }

  signIn(username: string) {
    if (username !== '') {
      this.firestoreService.usersCollection
        .doc(username)
        .get()
        .then(docSnapshot => {
          if (docSnapshot.exists) {
            this.message =
              'User already exists, please choose a uniqe username';
          } else {
            docSnapshot.ref.set({});
            this.modalRef.hide();
            this.message = '';
            localStorage.setItem('foodUser', username);
            this.firestoreService.currentUser = username;
          }
        })
        .catch(error => console.error('Error adding document: ', error));
    }
  }
}
