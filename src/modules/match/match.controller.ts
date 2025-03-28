import { Controller, Get, Post, Body, Param, Patch, Delete, Put, Query, UseGuards } from '@nestjs/common';
import { MatchService } from './match.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { FindMatchDto } from './dto/find-match.dto';
import { ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { RolesGuard } from 'src/auth/passport/roles.guard';
import { Roles } from 'src/decorator/role.decorator';
import { UserRoles } from 'src/constant/users.enums';
import { Public } from 'src/decorator/custom';

@Controller('matches')
@UseGuards(RolesGuard)
@ApiBearerAuth('access-token')
export class MatchController {
  constructor(private readonly matchService: MatchService) { }


  @Get('search')
  @Roles(UserRoles.ADMIN, UserRoles.MANAGER)
  async searchMatch(@Query() query: FindMatchDto) {
    return this.matchService.findMatchBySearchOrFilter(query);
  }

  @Get()
  @Roles(UserRoles.ADMIN, UserRoles.MANAGER)
  async findAll() {
    return this.matchService.findAll();
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string) {
    return this.matchService.findOne(id);
  }

  @Post()
  @Roles(UserRoles.ADMIN, UserRoles.USER)
  async create(@Body() createMatchDto: CreateMatchDto) {
    return this.matchService.create(createMatchDto);
  }

  @Put(':id')
  @Public()
  async update(@Param('id') id: string, @Body() updateMatchDto: UpdateMatchDto) {
    return this.matchService.update(id, updateMatchDto);
  }

  @Delete(':id')
  @Roles(UserRoles.ADMIN)
  async delete(@Param('id') id: string) {
    return this.matchService.delete(id);
  }


}