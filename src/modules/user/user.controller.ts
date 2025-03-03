import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query, NotFoundException, BadRequestException, Put } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateAuthDto } from '../../auth/dto/create-auth.dto';
import { updateUsersDto } from './dto/update-user.dto';
import { request } from 'https';


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

  @Put()
  async update(@Param('id') id: string, @Body() updateUsersDto: updateUsersDto) {
    return await this.userService.updateUser(id, updateUsersDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.userService.delete(id);
  }

}