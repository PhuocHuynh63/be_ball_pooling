import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query, NotFoundException, BadRequestException, Put, UseInterceptors, UploadedFile } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateAuthDto } from '../../auth/dto/create-auth.dto';
import { updateUsersDto } from './dto/update-user.dto';
import { request } from 'https';
import { UploadService } from 'src/upload/upload.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from 'src/decorator/role.decorator';
import { UserRoles } from 'src/constant/users.enums';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RolesGuard } from 'src/auth/passport/roles.guard';
import { ResponseMessage } from 'src/decorator/custom';
import { FindUserDto } from './dto/user.dto';


@Controller('users')
@UseGuards(RolesGuard)
@ApiBearerAuth('access-token')
export class UserController {
  constructor(private readonly userService: UserService,
    private readonly uploadService: UploadService
  ) { }

  @Get('find')
  @Roles(UserRoles.ADMIN)
  @ApiQuery({ name: 'id', required: false, type: String })
  @ApiQuery({ name: 'role', required: false, type: String })  // cho swagger
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiQuery({ name: 'email', required: false, type: String })
  async find(@Query() query: any) {
    return await this.userService.find(query);
  }

  @Get('search')
  @Roles(UserRoles.ADMIN)
  @ResponseMessage('Get user success')
  async findUserBySearchOrFilter(
    @Query() query: FindUserDto,
  ) {
    return await this.userService.findUserBySearchOrFilter(query);
  }

  @Get(':id')
  @Roles(UserRoles.ADMIN, UserRoles.USER)
  async findId(@Param('id') id: string) {
    return await this.userService.findOne(id);
  }

  @Roles(UserRoles.ADMIN, UserRoles.USER)
  @Put(':id')
  @UseInterceptors(FileInterceptor('file'))
  async update(@Param('id') id: string, @Body() updateUsersDto: updateUsersDto, @UploadedFile() file: Express.Multer.File) {
    if (file) {
      console.log('id:', id);
      const user = await this.userService.findOne(id);
      const folder = 'avatar';
      const urlAvatar = await this.uploadService.uploadImage(file, folder, user.avatar);
      updateUsersDto.avatar = urlAvatar; // Set lại URL vào thuộc tính avatar
    }

    return await this.userService.updateUser(id, updateUsersDto);
  }


  @Delete(':id')
  @Roles(UserRoles.ADMIN)
  async delete(@Param('id') id: string) {
    return await this.userService.delete(id);
  }

}