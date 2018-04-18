import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

import { DialogUtil,HelperUtil } from '../../shared/utils';
import { ReportService } from '../../shared/services';

@IonicPage({segment: 'report-problem'})
@Component({
  selector: 'page-report-problem',
  templateUrl: 'report-problem.html',
})
export class ReportProblemPage {

  email: string = ''; 
  problem: string = '';

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public helperUtil: HelperUtil,
    public dialogUtil: DialogUtil,
    public reportService: ReportService
  ) {
  }

  submitProblem(){
    this.email = this.email.trim();
    this.problem = this.problem.trim();
    if(!this.helperUtil.isValidEmail(this.email)){
      this.dialogUtil.showToast('Please enter a valid email address.', 3000, 'bottom');
    }else if(this.problem.length == 0){
      this.dialogUtil.showToast('Please state your problem.', 3000, 'bottom');
    }else if(this.problem.length > 3000){
      this.dialogUtil.showToast('Your problem exceeds the maximum length of 3000 characters.', 3000, 'bottom');
    }else{
      this.dialogUtil.showLoader('Sending report.');
      this.reportService.sendReport(this.email,this.problem).then(()=>{
        this.dialogUtil.hideLoader();
        this.dialogUtil.showToast('Report successfully sent.', 4000, 'bottom');
        this.email = '';
        this.problem = '';
      },(e:any)=>{
        this.dialogUtil.hideLoader();
        this.dialogUtil.handleErrors(e);
      });
    }
  }

}
