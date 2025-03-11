import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { PoolTableService } from './pooltable.service';
import { JwtAuthGuard } from 'src/auth/passport/jwt-auth.guard';
import { RolesGuard } from 'src/auth/passport/roles.guard';
import { CreatePoolTableDto } from './dto/create-pooltable.dto';
import { Roles } from 'src/decorator/role.decorator';
import { UserRoles } from 'src/constant/users.enums';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('pooltables')
@UseGuards(RolesGuard)
@ApiBearerAuth('access-token')
export class PoolTableController {
  constructor(private readonly poolTableService: PoolTableService) {}

  
  @Post()
  @Roles(UserRoles.ADMIN, UserRoles.MANAGER)
  async create(@Body() createPoolTableDto: CreatePoolTableDto) {
    return this.poolTableService.create(createPoolTableDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  async findAll() {
    return this.poolTableService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.poolTableService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.poolTableService.delete(id);
  }

}