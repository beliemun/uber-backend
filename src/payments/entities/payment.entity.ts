import { Query } from '@nestjs/common';
import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';

@InputType('PaymentInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Payment extends CoreEntity {
  @Column()
  @Field(() => String)
  transactionId: string;

  @ManyToOne(() => User, (user) => user.payments)
  @Field(() => User)
  user: User;

  @RelationId((payment: Payment) => payment.user)
  @Column()
  @Field(() => Number)
  userId: number;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.payments)
  @Field(() => Restaurant)
  restaurant: Restaurant;

  @RelationId((payment: Payment) => payment.restaurant)
  @Column()
  @Field(() => Number)
  restaurantId: number;
}
