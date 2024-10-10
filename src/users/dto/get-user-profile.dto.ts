import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsNumber } from 'class-validator';
import { CoreOutput } from 'src/common/dto/output.dto';
import { CoreEntity } from 'src/common/entities/core.entity';
import { User } from '../entities/user.entity';

@InputType()
export class GetUserProfileInput extends CoreEntity {
  @Field(() => Number)
  @IsNumber()
  userId: number;
}

@ObjectType()
export class GetUserProfileOutput extends CoreOutput {
  @Field(() => User, { nullable: true })
  user?: User;
}
