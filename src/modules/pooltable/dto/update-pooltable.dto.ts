import { PartialType } from '@nestjs/mapped-types';
import { CreatePoolTableDto } from './create-pooltable.dto';

export class UpdatePoolTableDto extends PartialType(CreatePoolTableDto) {}