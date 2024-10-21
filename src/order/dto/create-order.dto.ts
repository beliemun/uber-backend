import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dto/output.dto';
import { OrderItemOption } from '../entites/order-item.dto';

@InputType()
class CreateOrderItemInput {
  @Field(() => Number)
  dishId: number;

  @Field(() => [OrderItemOption], { nullable: true })
  options?: OrderItemOption[];
}

@InputType()
export class CreateOrderInput {
  @Field(() => Number)
  restaurantId: number;

  @Field(() => [CreateOrderItemInput])
  items: CreateOrderItemInput[];
}

@ObjectType()
export class CreateOrderOutput extends CoreOutput {}
