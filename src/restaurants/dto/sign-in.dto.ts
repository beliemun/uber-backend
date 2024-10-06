import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { IsString } from 'class-validator';
import { CoreOutput } from 'src/common/dto/output.dto';
import { User } from 'src/users/entities/user.entity';

@InputType()
export class SignInInputType extends PickType(User, ['email', 'password']) {}

@ObjectType()
export class SignInOutputType extends CoreOutput {
  @Field(() => String, { nullable: true })
  @IsString()
  token?: string;
}
