import { Component } from '@angular/core';
import { ViewController } from 'ionic-angular';

@Component({
  selector: 'detailed-app-popover',
  templateUrl: 'detailed-app-popover.html'
})
export class DetailedAppPopoverComponent {

  popoverList;

  constructor(
    public viewCtrl: ViewController,
  ) {
    this.popoverList = [
      {name: 'Save Draft', id: 'save'},
      {name: 'Publish App', id: 'publish'},
    ]
  }

  close(data){
    this.viewCtrl.dismiss(data.id);
  }

}
