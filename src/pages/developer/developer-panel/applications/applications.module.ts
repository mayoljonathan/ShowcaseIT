import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { MaterialIconsModule } from 'ionic2-material-icons';
import { ApplicationsPage } from './applications';

// import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { LongPressModule } from 'ionic-long-press';
import { PipesModule } from '../../../../shared/pipes/pipes.module';

@NgModule({
  declarations: [
    ApplicationsPage,
  ],
  imports: [
    MaterialIconsModule,
    LongPressModule,
    // NgxDatatableModule,
    PipesModule,
    IonicPageModule.forChild(ApplicationsPage),
  ],
})
export class ApplicationsPageModule {}
