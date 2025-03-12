import { Controller, Get, Post, Body, Patch, Param, Delete, Put, UseGuards } from '@nestjs/common';
import { TeamService } from './team.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { RolesGuard } from 'src/auth/passport/roles.guard';
import { Roles } from 'src/decorator/role.decorator';
import { UserRoles } from 'src/constant/users.enums';

@Controller('teams')
@UseGuards(RolesGuard)
@ApiBearerAuth('access-token')
export class TeamController {
  constructor(private readonly teamService: TeamService) { }


  @Get()
  @Roles(UserRoles.ADMIN)
  async findAll() {
    return this.teamService.findAll();
  }

  @Get(':id')
  @Roles(UserRoles.ADMIN)
  async findOne(@Param('id') id: string) {
    return this.teamService.findOne(id);
  }

  @Get('/members/:id')
  @Roles(UserRoles.ADMIN, UserRoles.USER)
  async getMembers(@Param('id') id: string) {
    return this.teamService.findMembers(id);
  }

  @Post()
  @Roles(UserRoles.ADMIN, UserRoles.USER)
  async create(@Body() createTeamDto: CreateTeamDto) {
    return this.teamService.create(createTeamDto);
  }

  @Put(':id')
  @Roles(UserRoles.ADMIN, UserRoles.USER)
  async update(@Param('id') id: string, @Body() updateTeamDto: UpdateTeamDto) {
    return this.teamService.update(id, updateTeamDto);
  }


  @Delete(':id')
  @Roles(UserRoles.ADMIN)
  async remove(@Param('id') id: string) {
    return this.teamService.remove(id);
  }
}