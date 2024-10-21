import { Field, Float, InputType, ObjectType, registerEnumType } from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, JoinTable, ManyToMany, ManyToOne } from 'typeorm';

export enum OrderStatus {
  Pending = 'Pending',
  Cooking = 'Cooking',
  PickedUp = 'PickedUp',
  Delivered = 'Delivered',
}

registerEnumType(OrderStatus, { name: 'OrderStatus' });

@InputType('OrderInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Order extends CoreEntity {
  @ManyToOne(() => User, (user) => user.orders, { onDelete: 'SET NULL' })
  @Field(() => User, { nullable: true })
  customer?: User;

  @ManyToOne(() => User, (user) => user.orders, { onDelete: 'SET NULL' })
  @Field(() => User, { nullable: true })
  driver?: User;

  @Field(() => Restaurant)
  restaurant: Restaurant;

  @ManyToMany(()=>Dish)
  @Field(() => [Dish])
  dishes: Dish[];

  @Column()
  @Field(() => Float)
  @JoinTable()
  totalPrice: number;

  @Column({ type: 'enum', enum: OrderStatus })
  @Field(() => OrderStatus)
  status: OrderStatus;
}
