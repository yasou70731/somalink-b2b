import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { DealerProfile, DealerLevel, TradeType } from './entities/dealer-profile.entity';
import { TradeCategory } from './entities/trade-category.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(TradeCategory)
    private categoryRepository: Repository<TradeCategory>,
  ) {}

  // 1. 查 Email (登入用)
  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ 
      where: { email },
      relations: ['dealerProfile'] 
    });
  }

  // 2. 註冊新帳號
  async create(createUserDto: any) {
    const existingUser = await this.findOneByEmail(createUserDto.email);
    if (existingUser) {
      throw new BadRequestException('此 Email 已經註冊過');
    }

    const profile = new DealerProfile();
    profile.companyName = createUserDto.companyName || '未命名公司';
    profile.taxId = createUserDto.taxId || '00000000';
    profile.address = createUserDto.address || '地址待補';
    profile.contactPerson = createUserDto.contactPerson || '聯絡人';
    profile.phone = createUserDto.phone || '0900000000';
    
    const inputTradeType = createUserDto.tradeType;
    profile.tradeType = inputTradeType;

    const category = await this.categoryRepository.findOneBy({ code: inputTradeType });

    if (category) {
      profile.isUpgradeable = category.isUpgradeable;
    } else {
      const legacyUpgradeable = ['glass', 'shower_door', 'aluminum'];
      profile.isUpgradeable = legacyUpgradeable.includes(inputTradeType);
    }
    
    profile.level = createUserDto.level || DealerLevel.C; 
    profile.walletBalance = 0;

    const user = new User();
    user.email = createUserDto.email;
    user.password = createUserDto.password; 
    user.isActive = false; // 預設未啟用
    user.dealerProfile = profile;

    return this.usersRepository.save(user);
  }

  // 3. 查詢所有使用者
  findAll() {
    return this.usersRepository.find({
      relations: ['dealerProfile'],
      order: { createdAt: 'DESC' }
    });
  }

  // 4. 切換啟用狀態
  async toggleActive(userId: string, isActive: boolean) {
    await this.usersRepository.update(userId, { isActive });
    return this.usersRepository.findOne({ where: { id: userId }, relations: ['dealerProfile'] });
  }

  // 5. 修改等級
  async updateLevel(userId: string, level: DealerLevel) {
    const user = await this.usersRepository.findOne({ 
      where: { id: userId },
      relations: ['dealerProfile'] 
    });

    if (!user || !user.dealerProfile) throw new Error('找不到使用者');

    user.dealerProfile.level = level;
    return this.usersRepository.save(user);
  }

  // 6. 錢包儲值
  async deposit(userId: string, amount: number) {
    const user = await this.usersRepository.findOne({ 
      where: { id: userId },
      relations: ['dealerProfile'] 
    });

    if (!user || !user.dealerProfile) throw new Error('找無此經銷商');

    const profile = user.dealerProfile;
    const level = profile.level;

    const LIMITS = {
      'A': 200000,
      'B': 100000,
      'C': 0 
    };

    const limit = (LIMITS as any)[level] || 0;

    if (amount > limit) {
      throw new Error(`儲值失敗：${level} 級經銷商單筆上限為 $${limit.toLocaleString()}`);
    }

    const currentBalance = Number(profile.walletBalance);
    const addAmount = Number(amount);
    profile.walletBalance = currentBalance + addAmount;

    return this.usersRepository.save(user);
  }

  // 7. 刪除使用者
  async remove(id: string) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new Error('找不到使用者');
    }
    return this.usersRepository.remove(user);
  }

  // 8. 初始化分類
  async initCategories() {
    const defaults = [
      { name: '專業玻璃行', code: 'glass', isUpgradeable: true },
      { name: '淋浴拉門同行', code: 'shower_door', isUpgradeable: true },
      { name: '鋁門窗行', code: 'aluminum', isUpgradeable: true },
      { name: '工程行 / 統包', code: 'construction', isUpgradeable: false },
      { name: '室內設計 / 建築師', code: 'design', isUpgradeable: false },
    ];

    for (const cat of defaults) {
      const exists = await this.categoryRepository.findOneBy({ code: cat.code });
      if (!exists) {
        await this.categoryRepository.save(cat);
      }
    }
  }

  // 9. 升級管理員
  async makeAdmin(email: string) {
    const user = await this.findOneByEmail(email);
    if (!user) throw new Error(`找不到 Email 為 ${email} 的帳號`);
    
    user.role = UserRole.ADMIN; 
    user.isActive = true; 
    return this.usersRepository.save(user);
  }
}