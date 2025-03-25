import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Query, BadRequestException, Put } from '@nestjs/common';
import { StoreService } from './store.service';
import { JwtAuthGuard } from 'src/auth/passport/jwt-auth.guard';
import { RolesGuard } from 'src/auth/passport/roles.guard';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { Roles } from 'src/decorator/role.decorator';
import { UserRoles } from 'src/constant/users.enums';
import { ApiBearerAuth, ApiParam, ApiProperty, ApiQuery } from '@nestjs/swagger';
import { ResponseMessage } from 'src/decorator/custom';
import { FindStoreDto } from './dto/store.dto';
import { PoolTableService } from '@modules/pooltable/pooltable.service';

@Controller('stores')
@UseGuards(RolesGuard)
@ApiBearerAuth('access-token')
export class StoreController {
  constructor(private readonly storeService: StoreService
    , private readonly poolTableService: PoolTableService
  ) { }

  @Get('search')
  @Roles(UserRoles.ADMIN, UserRoles.MANAGER)
  @ResponseMessage('Get stores success')
  async findStoreBySearchOrFilter(@Query() query: FindStoreDto) {
    return this.storeService.findStoreBySearchOrFilter(query);
  }

  @Roles(UserRoles.ADMIN, UserRoles.MANAGER)
  @ApiQuery({ name: 'action', required: true, type: String })
  @ApiQuery({ name: 'id', required: false, type: String })
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

  @Get(':id')
  @Roles(UserRoles.ADMIN, UserRoles.MANAGER)
  @ResponseMessage('Get stores success')
  async findById(@Param('id') id: string) {
    return this.storeService.findOne(id);
  }


  @Get('viewPooltable/:id')
  @Roles(UserRoles.ADMIN, UserRoles.MANAGER)
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    example: '67d1bfffa15917a16219d829',
    description: 'ID of the store'
  })
  async findPooltable(@Param('id') id: string) {

    return this.poolTableService.findAllPooltableByStoreID(id);
  }

  @Get('showDeleted')
  @Roles(UserRoles.ADMIN, UserRoles.MANAGER)
  @ResponseMessage('Get stores success')
  async showDeleted() {
    return this.storeService.showDeleted();
  }


  @Get('/user/withoutStore')
  @Roles(UserRoles.ADMIN, UserRoles.MANAGER)
  @ResponseMessage('Get stores success')
  async findManagersWithoutStore() {
    return this.storeService.findManagersWithoutStore();
  }


  @Post()
  @Roles(UserRoles.ADMIN)
  async create(@Body() createStoreDto: CreateStoreDto) {
    return this.storeService.create(createStoreDto);
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