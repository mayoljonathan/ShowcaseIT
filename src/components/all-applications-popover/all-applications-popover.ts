import { Component } from '@angular/core';
import { ViewController } from 'ionic-angular';


@Component({
  selector: 'all-applications-popover',
  templateUrl: 'all-applications-popover.html'
})
export class AllApplicationsPopoverComponent {

  popoverList;

  constructor(
    public viewCtrl: ViewController,
  ) {
    this.popoverList = [
      // {name: 'Filter', id: 'filter'},
      // {name: 'Clear Filter', id: 'clear_filter'},
      // {name: 'Sort by', id: 'sort_by'},
      {name: 'Pending Deletion', id: 'pending_deletion'},
    ]
  }

  close(data){
    this.viewCtrl.dismiss(data.id);
  }

}
