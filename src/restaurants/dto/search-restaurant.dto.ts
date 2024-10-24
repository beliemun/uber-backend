import { Field, InputType, ObjectType } from '@nestjs/graphql';
import {
  PaginationInput,
  PaginationOutput,
} from 'src/common/dto/pagination.dto';
import { Restaurant } from '../entities/restaurant.entity';

@InputType()
export class SearchRestaurantsInput extends PaginationInput {
  @Field(() => String)
  query: string;
}

@ObjectType()
export class SearchRestaurantsOutput extends PaginationOutput {
  @Field(() => [Restaurant], { nullable: true })
  restaurants?: Restaurant[];
}
