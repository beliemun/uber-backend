import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsString } from 'class-validator';
import { CoreOutput } from 'src/common/dto/output.dto';

@InputType()
export class RequestRefreshTokenInput {
  @Field(() => String)
  @IsString()
  refreshToken: string;
}

@ObjectType()
export class RequestRefreshTokenOutput extends CoreOutput {
  @Field(() => String, { nullable: true })
  @IsString()
  accessToken?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  refreshToken?: string;
}
