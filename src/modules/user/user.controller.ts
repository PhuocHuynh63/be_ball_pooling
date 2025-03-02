import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query, NotFoundException, BadRequestException } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateAuthDto } from '../../auth/dto/create-auth.dto';
import { JwtAuthGuard } from 'src/auth/passport/jwt-auth.guard';


@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post()
  async create(@Body() createUserDto: CreateAuthDto) {
    return await this.userService.createUser(createUserDto);
  }

  @Get()
  async findAll() {
    return await this.userService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.userService.findOne(id);
  }


  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.userService.delete(id);
  }
}