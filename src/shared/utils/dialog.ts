import { Injectable } from '@angular/core';
import { LoadingController,AlertController,ToastController,ActionSheetController } from 'ionic-angular';

@Injectable()
export class DialogUtil {
    
    loader:any;

    isLoaderDialogShown: any;

    constructor(
        public alertCtrl: AlertController,
        public toastCtrl: ToastController,
        public actionSheetCtrl: ActionSheetController,
        public loadingCtrl: LoadingController,
    ){
    }

    showLoader(content = 'Loading', insistData = false){
        let timeoutMs = 30000;
        let timeoutListener;
        
        this.loader = this.loadingCtrl.create({
            content: content,
            enableBackdropDismiss: false,
            // dismissOnPageChange: true,
        });
        this.loader.onDidDismiss(() => {
            clearInterval(timeoutListener);
        });

        this.loader.present().then(()=>{
            if(insistData){
                timeoutListener = setInterval(()=>{
                    console.log("TIMEOUT in Loader");
                    // console.log(this.loader);
                    this.loader.data.content = 'Looks like you have slow connection. Click outside to hide.';
                    this.loader.data.enableBackdropDismiss = true;
                    clearInterval(timeoutListener);
                },timeoutMs);
            }
        });
        

    }

    hideLoader(){
        if(this.loader){
            this.loader.dismiss();
        }
    }
    
    showAlert(content,button,title?){
        console.log(content);
        this.alertCtrl.create({
            title: title,
            // subTitle: content,
            message: content,
            buttons: [button]
        }).present();
    }

    showConfirm(content,buttons,title){
        this.alertCtrl.create({
            title: title,
            subTitle: content,
            enableBackdropDismiss: false,
            buttons: [
                {
                    text: buttons[0].text,
                    role: 'cancel',
                    handler: () => {
                        console.log('Cancel clicked');
                        buttons[0].handler();
                    }
                },
                {
                    text: buttons[1].text,
                    handler: () => {
                        console.log('Ok clicked');
                        buttons[1].handler();
                    }
                }
            ]
        }).present();
    }

    showActionSheet(content,buttons,title){
        this.actionSheetCtrl.create({
            title: title,
            subTitle: content,
            buttons: buttons
        }).present();
    }

    showPrompt(title,message,inputs,buttons){
        this.alertCtrl.create({
            title: title,
            message: message,
            inputs: [
                {
                    name: inputs.name,
                    placeholder: inputs.placeholder,
                    value: inputs.value
                },
            ],
            buttons: [
                {
                    text: buttons[0].text,
                    role: 'cancel',
                    handler: data => {
                        buttons[0].handler();
                    }
                },
                {
                    text: buttons[1].text,
                    handler: data => {
                        buttons[1].handler(data);
                    }
                }
            ]
        }).present();
    }

    showCheckbox(choices,buttons,title){
        return new Promise(resolve=>{
            let alert = this.alertCtrl.create();
            alert.setTitle(title);

            choices.forEach(choice=>{
                alert.addInput({
                    type: 'checkbox',
                    label: choice.name,
                    value: choice.name,
                    checked: choice.checked
                });
            });

            alert.addButton(buttons[0]);
            alert.addButton({
                text: buttons[1],
                handler: data => {
                    console.log('This is what i chose(TRUE): '+data);
                    resolve(data);
                }
            });
            alert.present();
        })
    }

    showToast(message,duration,position,showCloseButton?,closeButtonText?){
        this.toastCtrl.create({
            message: message,
            duration: duration,
            position: position,
            showCloseButton: showCloseButton,
            closeButtonText: closeButtonText,
        }).present();
    }

    handleErrors(reason = 'An error has occured. Please try again.'){
        this.alertCtrl.create({
            title: 'Error occured',
            subTitle: reason,
            buttons: ['Ok']
        }).present();
    }

}