import { InputType, ObjectType, OmitType } from '@nestjs/graphql';
import { Restaurant } from '../entities/restaurant.entity';
import { CoreOutput } from 'src/common/dto/output.dto';

@InputType()
export class CreateRestaurantInput extends OmitType(Restaurant, [
  'id',
  'createdAt',
  'updatedAt',
]) {}

@ObjectType()
export class CreateRestaurantOutput extends CoreOutput {}
