import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { StoreService } from './store.service';
import { JwtAuthGuard } from 'src/auth/passport/jwt-auth.guard';
import { RolesGuard } from 'src/auth/passport/roles.guard';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Controller('stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  async create(@Body() createStoreDto: CreateStoreDto) {
    return this.storeService.create(createStoreDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  async findAll() {
    return this.storeService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.storeService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateStoreDto: UpdateStoreDto) {
    return this.storeService.update(id, updateStoreDto);
  }

  // Add more endpoints as needed
}