import { InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dto/output.dto';
import { Payment } from 'src/payments/entities/payment.entity';

@InputType()
export class CreatePaymentInput extends PickType(Payment, [
  'restaurantId',
  'transactionId',
]) {}

@ObjectType()
export class CreatePaymentOutput extends CoreOutput {}
