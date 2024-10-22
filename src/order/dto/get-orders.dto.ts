import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Order, OrderStatus } from '../entites/order.entity';
import { CoreOutput } from 'src/common/dto/output.dto';

@InputType()
export class GetOrdersInput {
  @Field(() => OrderStatus)
  orderState: OrderStatus;
}

@ObjectType()
export class GetOrdersOutput extends CoreOutput {
  @Field(() => [Order], { nullable: true })
  orders?: Order[];
}
