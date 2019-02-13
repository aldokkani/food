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
    public firestoreService: FirestoreService
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

  async signIn(username: string) {
    if (username !== '') {
      if (await this.firestoreService.signIn(username)) {
        this.modalRef.hide();
        this.message = '';
      } else {
        this.message = 'User already exists, please choose a uniqe username';
      }
    }
  }
}
