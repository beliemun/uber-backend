import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsOptional, IsString } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { Category } from './category.entity';
import { User } from 'src/users/entities/user.entity';

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

  @RelationId((restaurant: Restaurant) => restaurant.owner)
  @Field(() => Number)
  ownerId: number;
}
