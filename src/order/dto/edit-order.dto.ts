import { InputType, ObjectType, PickType } from '@nestjs/graphql';
import { Order } from '../entites/order.entity';
import { CoreOutput } from 'src/common/dto/output.dto';

@InputType()
export class EditOrderInput extends PickType(Order, ['id', 'status']) {}

@ObjectType()
export class EditOrderOutput extends CoreOutput {}
