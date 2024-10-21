import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@InputType('DishChoiceInputType', { isAbstract: true })
@ObjectType()
export class DishChoice {
  @Field(() => String)
  name: string;
  @Field(() => Number, { nullable: true })
  extra?: number;
}

@InputType('OrderItemOptionInputType', { isAbstract: true })
@ObjectType()
export class OrderItemOption {
  @Field(() => String)
  name: string;
  @Field(() => DishChoice, { nullable: true })
  choice: DishChoice;
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
