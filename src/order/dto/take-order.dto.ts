import { InputType, ObjectType, PickType } from '@nestjs/graphql';
import { Order } from '../entites/order.entity';
import { CoreOutput } from 'src/common/dto/output.dto';

@InputType()
export class TakeOrderInput extends PickType(Order, ['id']) {}

@ObjectType()
export class TakeOrderOutput extends CoreOutput {}
