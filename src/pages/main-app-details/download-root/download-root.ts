import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams,ViewController } from 'ionic-angular';

@IonicPage()
@Component({
  selector: 'page-download-root',
  templateUrl: 'download-root.html',
})
export class DownloadRootPage {
  rootPage = 'DownloadModalPage';
  rootParams;

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public viewCtrl: ViewController,
  ) {
    this.rootParams = Object.assign({}, navParams.data, {viewCtrl: viewCtrl});
  }
}
