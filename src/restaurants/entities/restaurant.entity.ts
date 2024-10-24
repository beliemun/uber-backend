import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsOptional, IsString } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, ManyToOne, OneToMany, RelationId } from 'typeorm';
import { Category } from './category.entity';
import { User } from 'src/users/entities/user.entity';
import { Dish } from './dish.entity';
import { Order } from 'src/order/entites/order.entity';
import { Payment } from 'src/payments/entities/payment.entity';

// Ralation 연결 시 외부에서 Category가 Class인지, InputType인지, OutputType인지 알 수 없으므로 이름을 따로 정해준다.
@InputType('RestaurantInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Restaurant extends CoreEntity {
  @Column()
  @Field(() => String)
  @IsString()
  name: string;

  @Column({ nullable: true })
  @Field(() => String, { nullable: true })
  @IsString()
  coverImage?: string;

  @Column()
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  address?: string;

  @ManyToOne(() => Category, (category) => category.restaurants, {
    onDelete: 'SET NULL',
  })
  @Field(() => Category, { nullable: true })
  category?: Category;

  @ManyToOne(() => User, (owner) => owner.restaurants, { onDelete: 'CASCADE' })
  @Field(() => User)
  owner: User;

  @Column() // Column 지정을 안할 경우, select를 사용할 수 없음, 사용하지 않고 select를 하기 위해서는 createQueryBuilder를 사용해야 함.
  @RelationId((restaurant: Restaurant) => restaurant.owner)
  @Field(() => Number)
  ownerId: number;

  @OneToMany(() => Order, (order) => order.restaurant)
  @Field(() => [Order])
  orders: Order[];

  @OneToMany(() => Dish, (dish) => dish.restaurant)
  @Field(() => [Dish])
  menu: Dish[];

  // ManyToOne는 OneToMany가 없어도 생성될 수 있다.(Payment Entity에서)
  // 하지만, OneToMany는 ManyToOne 없이 생성될 수 없다.
  // 이 앱에서는 유저의 결제 내역은 중요하지만, 레스토랑의 결제 내역은 중요하게 생각하지 않는다.
  @Field(() => [Payment])
  payments: Payment[];
}
