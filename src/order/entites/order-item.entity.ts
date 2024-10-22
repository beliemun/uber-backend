import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@InputType('OrderItemOptionInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class OrderItemOption {
  @Field(() => String)
  name: string;
  @Field(() => String, { nullable: true })
  choice: string;
  @Field(() => Number, { nullable: true })
  extra?: number;
}

@InputType('OrderItemInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class OrderItem extends CoreEntity {
  @ManyToOne(() => Dish, { nullable: true, onDelete: 'CASCADE' })
  @Field(() => Dish)
  dish: Dish;

  @Column({ type: 'json', nullable: true })
  @Field(() => [OrderItemOption], { nullable: true })
  options?: OrderItemOption[];
}
