import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query, NotFoundException, BadRequestException } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateAuthDto } from '../../auth/dto/create-auth.dto';
import { JwtAuthGuard } from 'src/auth/passport/jwt-auth.guard';
import { find } from 'rxjs';
import { Public } from 'src/decorator/custom';


@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get('find')
  async find(@Query() query: any) {
    return await this.userService.find(query);
  }

  @Post()
  async create(@Body() createUserDto: CreateAuthDto) {
    return await this.userService.createUser(createUserDto);
  }

  

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.userService.delete(id);
  }


}