import { Injectable, ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { TradeCategory } from './entities/trade-category.entity';
import { DealerProfile, DealerLevel } from './entities/dealer-profile.entity'; // Import DealerLevel enum

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(TradeCategory)
    private tradeCategoriesRepository: Repository<TradeCategory>,
    @InjectRepository(DealerProfile)
    private dealerProfileRepository: Repository<DealerProfile>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    // 1. Check if Email exists
    const existingUser = await this.usersRepository.findOne({ 
      where: { email: createUserDto.email } 
    });
    
    if (existingUser) {
      throw new ConflictException('此 Email 已經被註冊');
    }

    // 2. Create User Entity
    const user = new User();
    user.email = createUserDto.email;
    user.name = createUserDto.name;
    
    // Encrypt password
    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(createUserDto.password, salt);

    // 3. Handle Trade Category
    if (createUserDto.tradeCategoryId && createUserDto.tradeCategoryId.trim() !== '') {
      const tradeCategory = await this.tradeCategoriesRepository.findOneBy({ 
        id: createUserDto.tradeCategoryId 
      });
      
      if (!tradeCategory) {
        throw new NotFoundException('選擇的營業類別無效');
      }
      user.tradeCategory = tradeCategory;
    } else {
      user.tradeCategory = null;
    }

    // 4. Handle Dealer Profile
    if (createUserDto.dealerProfile) {
      const profile = new DealerProfile();
      Object.assign(profile, createUserDto.dealerProfile);
      
      // ✨ Fix: Use the enum member instead of string literal
      profile.level = DealerLevel.C; 
      
      profile.isVerified = false;
      user.dealerProfile = profile;
    }

    // 5. Save to DB
    try {
      user.isActive = false;
      return await this.usersRepository.save(user);
    } catch (error: any) {
      console.error('Registration Error:', error);
      if (error.code === '23505') { 
        throw new ConflictException('資料重複 (Email 或統編已存在)');
      }
      throw new InternalServerErrorException('註冊失敗，請稍後再試');
    }
  }

  async findAll() {
    return this.usersRepository.find({
      relations: ['tradeCategory', 'dealerProfile'],
    });
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['tradeCategory', 'dealerProfile'],
    });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  async findByEmail(email: string) {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['tradeCategory', 'dealerProfile'],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.usersRepository.update(id, {
      isActive: updateUserDto.isActive,
      role: updateUserDto.role,
    });
    return this.findOne(id);
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    return this.usersRepository.remove(user);
  }
}