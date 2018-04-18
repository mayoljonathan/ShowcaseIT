import { Component,Input,Output,EventEmitter } from '@angular/core';
import { OnRatingChangeEven } from "angular-star-rating/star-rating-struct";

@Component({
  selector: 'star',
  templateUrl: 'star.html'
})
export class StarComponent {

  @Input('readOnly') readOnly;
  @Input('hoverEnabled') hoverEnabled;
  @Input('rating') rating;
  @Input('size') size;
  @Input('labelText') labelText;

  @Output() ratingStars: EventEmitter<number> = new EventEmitter();

  constructor() {}

  onRatingChange = ($event:OnRatingChangeEven) => {
      this.ratingStars.emit($event.rating);
  };

}
