import { Component, OnInit, TemplateRef } from '@angular/core';
import { FirestoreService } from '../firestore.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Validators, FormGroup, FormBuilder } from '@angular/forms';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.scss']
})
export class OrderComponent implements OnInit {
  order: any = {};
  myOrder: any = {};
  orderId: string;
  orderItemForm: FormGroup;
  modalRef: BsModalRef;
  Object = Object;
  result: any = {};
  fees = 0;

  constructor(
    public firestoreService: FirestoreService,
    private modalService: BsModalService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit() {
    this.orderId = this.route.snapshot.params.id;
    this.firestoreService.itemsCollection
      .where('order', '==', this.orderId)
      .onSnapshot(querySnapshot => {
        this.order = {};
        this.myOrder = {};
        querySnapshot.forEach(doc => {
          const data = doc.data();
          if (data.quantity > 0) {
            this.order[doc.id] = data;
            if (data.owners.indexOf(this.firestoreService.currentUser) !== -1) {
              this.myOrder[doc.id] = data;
            }
          } else {
            doc.ref.delete();
          }
        });
      });

    this.orderItemForm = this.fb.group({
      item: [''],
      quantity: ['', Validators.min(1)],
      owners: [[]]
    });
  }

  openModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(template);
  }

  addItem() {
    const item = JSON.parse(JSON.stringify(this.orderItemForm.value));

    item.owners = Array(item.quantity).fill(this.firestoreService.currentUser);
    item.order = this.orderId;
    this.firestoreService.itemsCollection
      .add(item)
      .catch(error => console.error('Error adding document: ', error));
  }

  onChange(event: any, id: string, oldValue: number) {
    const newValue = +event.target.value;
    const updates: any = { quantity: newValue };

    if (newValue > oldValue) {
      updates.owners = [
        ...this.order[id].owners,
        ...Array(newValue - oldValue).fill(this.firestoreService.currentUser)
      ];
    } else if (newValue < oldValue) {
      const limit = Math.min(this.getOwnQuantity(id), oldValue - newValue);
      for (let index = 0; index < limit; index++) {
        this.order[id].owners.splice(
          this.order[id].owners.indexOf(this.firestoreService.currentUser),
          1
        );
      }
      updates.owners = this.order[id].owners;
      updates.quantity = oldValue - limit;
    }

    this.firestoreService.itemsCollection
      .doc(id)
      .update(updates)
      .catch(error => console.error(error));
  }

  onPrice(event: any, id: string) {
    this.firestoreService.itemsCollection
      .doc(id)
      .update({ price: +event.target.value })
      .catch(error => console.error(error));
  }

  getOwnQuantity(id: string): number {
    if (this.myOrder[id]) {
      return this.myOrder[id].owners.filter(
        o => o === this.firestoreService.currentUser
      ).length;
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
      this.firestoreService.itemsCollection
        .doc(id)
        .delete()
        .catch(error => console.error(error));
    } else {
      this.firestoreService.itemsCollection.doc(id).update({
        quantity: totalQuantity - myQuantity,
        owners: this.order[id].owners.filter(
          o => o !== this.firestoreService.currentUser
        )
      });
    }
  }

  doMath() {
    const res = {};
    this.firestoreService.itemsCollection.get().then(querySnapshot => {
      querySnapshot.forEach(doc => {
        const data = doc.data();
        data.owners.reduce((acum, cur) => {
          acum[cur] = (acum[cur] || 0) + (data.price || 0);
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
    this.firestoreService.itemsCollection
      .where('order', '==', this.orderId)
      .get()
      .then(querySnapshot => querySnapshot.forEach(doc => doc.ref.delete()));
    this.firestoreService.ordersCollection.doc(this.orderId).delete();
    this.router.navigate(['/']);
  }
}
