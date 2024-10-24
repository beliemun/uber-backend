import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dto/output.dto';
import { Restaurant } from '../entities/restaurant.entity';

@InputType()
export class GetRestaurantInput {
  @Field(() => Number)
  restaurantId: number;
}

@ObjectType()
export class GetRestaurantOutput extends CoreOutput {
  @Field(() => Restaurant, { nullable: true })
  restaurant?: Restaurant;
}
