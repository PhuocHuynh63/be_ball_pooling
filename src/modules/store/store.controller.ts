import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Query, BadRequestException, Put } from '@nestjs/common';
import { StoreService } from './store.service';
import { JwtAuthGuard } from 'src/auth/passport/jwt-auth.guard';
import { RolesGuard } from 'src/auth/passport/roles.guard';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { Roles } from 'src/decorator/role.decorator';
import { UserRoles } from 'src/constant/users.enums';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ResponseMessage } from 'src/decorator/custom';
import { FindStoreDto } from './dto/store.dto';

@Controller('stores')
@UseGuards(RolesGuard)
@ApiBearerAuth('access-token')
export class StoreController {
  constructor(private readonly storeService: StoreService) { }

  @Get('search')
  @Roles(UserRoles.ADMIN)
  @ResponseMessage('Get stores success')
  async findStoreBySearchOrFilter(@Query() query: FindStoreDto) {
    return this.storeService.findStoreBySearchOrFilter(query);
  }

  @Post()
  @Roles(UserRoles.ADMIN)
  async create(@Body() createStoreDto: CreateStoreDto) {
    return this.storeService.create(createStoreDto);
  }

  @Roles(UserRoles.ADMIN)
  @Get()
  async handleGetRequests(@Query('action') action: string, @Query('id') id?: string) {
    switch (action) {
      case 'findAll':
        return this.storeService.findAll();
      case 'findOne':
        if (!id) {
          throw new BadRequestException('Missing id parameter');
        }
        return this.storeService.findOne(id);
      case 'findManagersWithoutStore':
        return this.storeService.findManagersWithoutStore();
      default:
        throw new BadRequestException('Invalid action');
    }
  }

  @Roles(UserRoles.ADMIN)
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateStoreDto: UpdateStoreDto) {
    return this.storeService.update(id, updateStoreDto);
  }

  @Roles(UserRoles.ADMIN)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.storeService.delete(id);
  }

}