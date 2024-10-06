import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsOptional, IsString } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@InputType({ isAbstract: true })
@ObjectType()
@Entity()
export class Restaurant {
  @PrimaryGeneratedColumn()
  @Field(() => Number)
  @IsString()
  id: number;

  @Column()
  @Field(() => String)
  @IsString()
  name: string;

  @Column()
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  address?: string;
}
