import { InputType, PickType } from '@nestjs/graphql';
import { Order } from '../entites/order.entity';

@InputType()
export class UpdateOrderInput extends PickType(Order, ['id']) {}
