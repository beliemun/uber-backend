import { ArgsType, Field, InputType, PickType } from '@nestjs/graphql';
import { Restaurant } from '../entities/restaurant.entity';
import { IsString, Length } from 'class-validator';

@ArgsType()
export class CreateRestaurantDto {
    @Field(() => String)
    @IsString()
    name: string;
  
    @Field(() => String, { nullable: true })
    @IsString()
    @Length(0, 10)
    address?: string;
}
