import { Controller, Get, Post, Body, Param, Delete, UseGuards, Put } from '@nestjs/common';
import { PoolTableService } from './pooltable.service';
import { JwtAuthGuard } from 'src/auth/passport/jwt-auth.guard';
import { RolesGuard } from 'src/auth/passport/roles.guard';
import { CreatePoolTableDto } from './dto/create-pooltable.dto';
import { Roles } from 'src/decorator/role.decorator';
import { UserRoles } from 'src/constant/users.enums';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UpdatePoolTableDto } from './dto/update-pooltable.dto';
import { Public } from 'src/decorator/custom';

@Controller('pooltables')
@UseGuards(RolesGuard)
@ApiBearerAuth('access-token')
export class PoolTableController {
  constructor(private readonly poolTableService: PoolTableService) { }

  @Get()
  @Roles(UserRoles.ADMIN, UserRoles.MANAGER)
  async findAll() {
    return this.poolTableService.findAll();
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.poolTableService.findOne(id);
  }

  @Post()
  @Roles(UserRoles.ADMIN, UserRoles.MANAGER)
  async create(@Body() createPoolTableDto: CreatePoolTableDto) {
    return this.poolTableService.create(createPoolTableDto);
  }

  @Put(':id')
  @Roles(UserRoles.ADMIN, UserRoles.MANAGER)
  async update(id: string, @Body() updatePoolTableDto: UpdatePoolTableDto) {
    return this.poolTableService.update(id, updatePoolTableDto);
  }


  @Roles(UserRoles.ADMIN, UserRoles.MANAGER)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.poolTableService.delete(id);
  }

}