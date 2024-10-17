import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsOptional, IsString } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { Restaurant } from './restaurant.entity';

// Ralation 연결 시 외부에서 Category가 Class인지, InputType인지, OutputType인지 알 수 없으므로 이름을 따로 정해준다.
@InputType('CetegoryInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Category extends CoreEntity {
  @Column()
  @Field(() => String)
  @IsString()
  name: string;

  @Column()
  @Field(() => String)
  @IsString()
  slug: string;

  @Column({ nullable: true })
  @Field(() => String, { nullable: true })
  @IsString()
  coverImage?: string;

  @OneToMany(() => Restaurant, (rastaurant) => rastaurant.category)
  @Field(() => [Restaurant])
  restaurants: Restaurant[];
}
