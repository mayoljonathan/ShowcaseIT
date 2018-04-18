import { Component, Input, Output, EventEmitter} from '@angular/core';

import { FileService } from '../../shared/services';
import { DialogUtil } from '../../shared/utils';

@Component({
  selector: 'file-dropbox',
  templateUrl: 'file-dropbox.html'
})
export class FileDropboxComponent {

  @Output() public dragFileAccepted: EventEmitter<Object> = new EventEmitter();
  @Input('fileSizeLimit') fileSizeLimit : number;
  @Input('fileDropType') fileDropType : string;
  @Input('dontAcceptHover') dontAcceptHover: Array<any>;

  public isHovering: boolean = false;

  constructor(
    public fileService: FileService,
    public dialogUtil: DialogUtil,
  ) {}

  private onDragFileOverStart(event) {
    if (!this.isHovering) {
      this.isHovering = true;
    }
    this.preventDefaultAndStopPropagation(event);
    return false;
  };

  private onDragFileOverEnd(event): any {
    this.isHovering = false;
    this.preventDefaultAndStopPropagation(event);
    return false;
  }

  private onDragFileAccepted(acceptedFile: File): any {
    if (this.dragFileAccepted) {
      this.dragFileAccepted.emit({ file: acceptedFile });
    }
  }

  private onDragFileDrop(event: any): any {
    this.preventDefaultAndStopPropagation(event);
    if(this.dontAcceptHover){
      let counter = 0;
      this.dontAcceptHover.forEach(val=>{
        console.log(val);
        if(val){
          counter++;
          return;
        }
      });
      if(counter == 0){
        this.FileSelectHandler(event);
      }
    }else{
      this.FileSelectHandler(event);
    }

  }

  private preventDefaultAndStopPropagation(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  // file selection handler (can be called from drag, or from a file-requestor select box)
  public FileSelectHandler(e) {
    console.log('THIS');

    this.isHovering = false;      // cancel the hover
    var files = e.target.files || e.dataTransfer.files;     // fetch FileList object

    let fileExtension = this.fileService.getExtension(files[0].name);
    if(this.fileDropType === 'apk' && fileExtension !== this.fileDropType){
      return this.dialogUtil.showToast('Please select an apk file.',3000,'bottom');
    }else if (this.fileDropType === 'archive_desktop' || this.fileDropType === 'archive_source'){
      if(fileExtension !== 'rar' && fileExtension !== 'zip'){
        return this.dialogUtil.showToast('Please select a zip or rar file.',3000,'bottom');
      }
    }

    if(this.fileService.sizeLimitExceeded(e.dataTransfer.files[0].size,this.fileSizeLimit)){
      return this.dialogUtil.showToast('Your selected file exceeds to the required size limit.',4000,'bottom');
    }
    
    this.dialogUtil.showLoader('Processing file...');
    
    var reader = new FileReader();
      reader.onload = (event:any) => {
        let filepath = event.target.result;
        // process all File objects
        for (var i = 0, f; f = files[i]; i++) {
          f['path'] = filepath;
          this.onDragFileAccepted(f);
        } 
      }
    reader.readAsDataURL(e.dataTransfer.files[0]);

    // this.isHovering = false;      // cancel the hover
    // var files = e.target.files || e.dataTransfer.files;     // fetch FileList object
    // // process all File objects
    // for (var i = 0, f; f = files[i]; i++) {
    //   this.onDragFileAccepted(f);
    // }
  }

}
