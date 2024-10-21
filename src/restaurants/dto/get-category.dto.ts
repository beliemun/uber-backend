import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Category } from '../entities/category.entity';
import {
  PaginationInput,
  PaginationOutput,
} from 'src/common/dto/pagination.dto';
import { Restaurant } from '../entities/restaurant.entity';

@InputType()
export class GetCategoryInput extends PaginationInput {
  @Field(() => String)
  slug: string;
}

@ObjectType()
export class GetCategoryOutput extends PaginationOutput {
  @Field(() => Category, { nullable: true })
  category?: Category;

  @Field(() => [Restaurant], { nullable: true })
  restaurants?: Restaurant[];
}
