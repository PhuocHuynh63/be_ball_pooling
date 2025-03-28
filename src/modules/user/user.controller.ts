import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query, NotFoundException, BadRequestException, Put, UseInterceptors, UploadedFile } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateAuthDto } from '../../auth/dto/create-auth.dto';
import { request } from 'https';
import { UploadService } from 'src/upload/upload.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from 'src/decorator/role.decorator';
import { UserRoles } from 'src/constant/users.enums';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RolesGuard } from 'src/auth/passport/roles.guard';
import { Public, ResponseMessage } from 'src/decorator/custom';
import { FindUserDto } from './dto/user.dto';
import { updateUsersAdminDto } from './dto/update-userAdmin.dto';
import { updateUsersDto } from './dto/update-user.dto ';


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
  @Public()
  async findId(@Param('id') id: string) {
    return await this.userService.findOne(id);
  }

  @Roles(UserRoles.ADMIN)
  @Put('/admin/:id')
  @UseInterceptors(FileInterceptor('file'))
  async updateAdmin(@Param('id') id: string, @Body() updateUsersDto: updateUsersAdminDto) {
    return await this.userService.updateUserAdmin(id, updateUsersDto);
  }

  //============
  @Roles(UserRoles.USER)
  @Put(':id')
  @UseInterceptors(FileInterceptor('file'))
  async update(@Param('id') id: string, @Body() updateUsersDto: updateUsersDto) {
    return await this.userService.updateUser(id, updateUsersDto);
  }
  //==========


  @Roles(UserRoles.ADMIN, UserRoles.USER)
  @Put('avatar/:id')
  @UseInterceptors(FileInterceptor('file'))
  async updateAvatar(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return await this.userService.updateUserAvatar(id, file);
  }



  @Delete(':id')
  @Roles(UserRoles.ADMIN)
  async delete(@Param('id') id: string) {
    return await this.userService.delete(id);
  }

}