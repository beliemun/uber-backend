import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { InternalServerErrorException } from '@nestjs/common';
import { IsBoolean, IsEmail, IsEnum, IsString } from 'class-validator';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { Order } from 'src/order/entites/order.entity';

export enum UserRole {
  Client = 'Client',
  Owner = 'Owner',
  Driver = 'Driver',
}

registerEnumType(UserRole, { name: 'UserRole' }); // graphql에 enum을 등록하는 방법

// Ralation 연결 시 외부에서 Category가 Class인지, InputType인지, OutputType인지 알 수 없으므로 이름을 따로 정해준다.
@InputType('UserInputType', { isAbstract: true }) // for Graphql
@ObjectType() // for Graphql
@Entity() // for Database
export class User extends CoreEntity {
  @Column()
  @Field(() => String)
  @IsString()
  name: string;

  @Column({ unique: true })
  @Field(() => String)
  @IsEmail()
  email: string;

  @Column({ select: false })
  @Field(() => String)
  @IsString()
  password: string;

  @Column({ type: 'enum', enum: UserRole })
  @Field(() => UserRole)
  @IsEnum(UserRole)
  role: UserRole;

  @Column({ default: false })
  @Field(() => Boolean, { defaultValue: false })
  @IsBoolean()
  verified: boolean;

  @OneToMany(() => Restaurant, (restaurant) => restaurant.owner)
  @Field(() => [Restaurant])
  restaurants: Restaurant[];

  @OneToMany(() => Order, (order) => order.customer)
  @Field(() => [Order])
  orders: Order[];

  @OneToMany(() => Order, (order) => order.driver)
  @Field(() => [Order])
  rides: Order[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      try {
        this.password = await bcrypt.hash(this.password, 10);
      } catch (e) {
        throw new InternalServerErrorException();
      }
    }
  }

  async checkPassword(givenPassword: string): Promise<boolean> {
    try {
      return bcrypt.compare(givenPassword, this.password);
    } catch (e) {
      throw new InternalServerErrorException();
    }
  }
}
