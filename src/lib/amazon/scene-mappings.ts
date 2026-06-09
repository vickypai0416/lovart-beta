import type { ProductCategory } from './product-type-templates';

export interface SceneConfig {
  scene: string;
  description: string;
  targetAudience: string;
  emotionalHook: string;
  visualElements: string[];
}

export interface ProductSceneMapping {
  productName: string;
  category: ProductCategory;
  primaryScenes: SceneConfig[];
  secondaryScenes: SceneConfig[];
  seasonalScenes: Record<string, SceneConfig[]>;
}

export const sceneConfigs: Record<string, SceneConfig> = {
  'living-room': {
    scene: 'Living Room',
    description: '家庭客厅，展示温馨氛围',
    targetAudience: '家庭用户、房主',
    emotionalHook: '家的归属感、舒适生活',
    visualElements: ['沙发', '茶几', '地毯', '台灯', '家庭照片墙']
  },
  'bedroom': {
    scene: 'Bedroom',
    description: '卧室空间，展示私密温馨',
    targetAudience: '夫妻、情侣、个人用户',
    emotionalHook: '私密温馨、个性表达',
    visualElements: ['床铺', '床头柜', '台灯', '窗帘', '个人物品']
  },
  'home-office': {
    scene: 'Home Office',
    description: '家庭办公空间，展示实用价值',
    targetAudience: '远程工作者、学生',
    emotionalHook: '效率提升、专业感',
    visualElements: ['书桌', '办公椅', '电脑', '书架', '办公用品']
  },
  'kitchen': {
    scene: 'Kitchen',
    description: '厨房空间，展示日常使用',
    targetAudience: '家庭主妇/夫、烹饪爱好者',
    emotionalHook: '生活品质、烹饪乐趣',
    visualElements: ['料理台', '橱柜', '厨房电器', '餐具', '食材']
  },
  'dining-area': {
    scene: 'Dining Area',
    description: '餐厅空间，展示用餐氛围',
    targetAudience: '家庭、社交聚会',
    emotionalHook: '家庭聚餐、社交乐趣',
    visualElements: ['餐桌', '餐椅', '餐具', '烛台', '装饰品']
  },
  'outdoor-patio': {
    scene: 'Outdoor Patio',
    description: '户外露台，展示休闲时光',
    targetAudience: '户外爱好者、休闲生活',
    emotionalHook: '放松惬意、自然亲近',
    visualElements: ['户外家具', '绿植', '阳光', '咖啡/饮品']
  },
  'travel': {
    scene: 'Travel',
    description: '旅行场景，展示便携实用',
    targetAudience: '旅行爱好者、出差人士',
    emotionalHook: '探索自由、便捷出行',
    visualElements: ['行李箱', '背包', '地图', '风景', '交通工具']
  },
  'gym': {
    scene: 'Gym/Fitness',
    description: '健身房/运动场景',
    targetAudience: '健身爱好者、运动人士',
    emotionalHook: '健康活力、运动精神',
    visualElements: ['健身器材', '运动装备', '毛巾', '水瓶']
  },
  'beach': {
    scene: 'Beach',
    description: '海滩度假场景',
    targetAudience: '度假爱好者、海滩活动',
    emotionalHook: '度假轻松、阳光沙滩',
    visualElements: ['沙滩', '大海', '太阳伞', '躺椅', '比基尼/泳装']
  },
  'camping': {
    scene: 'Camping',
    description: '露营户外场景',
    targetAudience: '露营爱好者、户外探险',
    emotionalHook: '探险精神、自然体验',
    visualElements: ['帐篷', '篝火', '星空', '背包', '自然风景']
  },
  'workshop': {
    scene: 'Workshop',
    description: '手工制作/工作坊场景',
    targetAudience: 'DIY爱好者、手工匠人',
    emotionalHook: '创作乐趣、专业工具',
    visualElements: ['工作台', '工具', '材料', '手工制品']
  },
  'gifting': {
    scene: 'Gift Giving',
    description: '送礼场景，强调礼品属性',
    targetAudience: '送礼者',
    emotionalHook: '用心准备、惊喜感动',
    visualElements: ['礼品包装', '丝带', '贺卡', '接收礼物的人']
  },
  'pet-area': {
    scene: 'Pet Area',
    description: '宠物相关场景',
    targetAudience: '宠物主人、宠物爱好者',
    emotionalHook: '宠物情感、陪伴温暖',
    visualElements: ['宠物', '宠物床', '宠物玩具', '宠物用品']
  },
  'nursery': {
    scene: 'Nursery/Children Room',
    description: '儿童房/婴儿房场景',
    targetAudience: '新手父母、有小孩家庭',
    emotionalHook: '童趣温馨、成长记忆',
    visualElements: ['儿童床', '玩具', '墙面装饰', '儿童家具']
  },
  'entryway': {
    scene: 'Entryway',
    description: '玄关/入口处场景',
    targetAudience: '注重家居细节的用户',
    emotionalHook: '第一印象、个人品味',
    visualElements: ['玄关柜', '钥匙盘', '鞋架', '装饰画', '镜子']
  },
  'bathroom': {
    scene: 'Bathroom',
    description: '浴室/卫生间场景',
    targetAudience: '注重生活品质的用户',
    emotionalHook: '个人护理、放松时刻',
    visualElements: ['洗手台', '镜子', '毛巾', '浴室配件']
  },
  'garage': {
    scene: 'Garage/Workshop',
    description: '车库/工具房场景',
    targetAudience: 'DIY爱好者、工具使用者',
    emotionalHook: '动手能力、实用主义',
    visualElements: ['工具墙', '工作台', '储物柜', '各类工具']
  },
  'holiday-christmas': {
    scene: 'Christmas Holiday',
    description: '圣诞节主题场景',
    targetAudience: '节日送礼者',
    emotionalHook: '节日欢乐、圣诞氛围',
    visualElements: ['圣诞树', '圣诞灯', '雪花', '礼物', '圣诞袜']
  },
  'holiday-valentine': {
    scene: 'Valentine\'s Day',
    description: '情人节主题场景',
    targetAudience: '情侣、配偶',
    emotionalHook: '浪漫爱情、甜蜜情感',
    visualElements: ['爱心', '玫瑰', '烛光', '浪漫装饰']
  },
  'holiday-mother': {
    scene: 'Mother\'s Day',
    description: '母亲节主题场景',
    targetAudience: '子女、孝顺礼物',
    emotionalHook: '感恩母爱、温馨回报',
    visualElements: ['康乃馨', '温馨家庭', '母子/母女', '早餐场景']
  },
  'holiday-father': {
    scene: 'Father\'s Day',
    description: '父亲节主题场景',
    targetAudience: '子女、孝顺礼物',
    emotionalHook: '感恩父爱、品质生活',
    visualElements: ['领带', '工具', '父子/父女', '户外活动']
  },
  'holiday-thanksgiving': {
    scene: 'Thanksgiving',
    description: '感恩节主题场景',
    targetAudience: '家庭团聚',
    emotionalHook: '家庭团聚、感恩之情',
    visualElements: ['南瓜', '枫叶', '火鸡', '家庭聚餐', '秋季装饰']
  },
  'holiday-birthday': {
    scene: 'Birthday Celebration',
    description: '生日主题场景',
    targetAudience: '生日送礼',
    emotionalHook: '祝福庆生、特殊时刻',
    visualElements: ['气球', '蛋糕', '生日帽', '礼物', '彩带']
  },
  'anniversary': {
    scene: 'Anniversary',
    description: '结婚/恋爱纪念日场景',
    targetAudience: '夫妻、情侣',
    emotionalHook: '爱情保鲜、珍贵回忆',
    visualElements: ['烛光晚餐', '香槟', '玫瑰', '情侣照片', '纪念物品']
  },
  'graduation': {
    scene: 'Graduation',
    description: '毕业季主题场景',
    targetAudience: '毕业生、家长',
    emotionalHook: '成就时刻、未来希望',
    visualElements: ['毕业帽', '毕业证书', '学士服', '庆祝装饰']
  },
  'new-home': {
    scene: 'New Home/Housewarming',
    description: '搬新家/暖房场景',
    targetAudience: '新房主、搬家庆祝',
    emotionalHook: '新生活憧憬、美好开始',
    visualElements: ['新房', '搬家箱子', '开门仪式', '装饰品']
  },
  'pet-birthday': {
    scene: 'Pet Birthday',
    description: '宠物生日场景',
    targetAudience: '宠物主人',
    emotionalHook: '宠物也是家人、陪伴情感',
    visualElements: ['宠物蛋糕', '宠物玩具', '装饰品', '宠物照片']
  },
  'morning-routine': {
    scene: 'Morning Routine',
    description: '早晨日常场景',
    targetAudience: '注重生活节奏的用户',
    emotionalHook: '美好一天开始、仪式感',
    visualElements: ['咖啡', '阳光', '早餐', '晨间活动']
  },
  'evening-relax': {
    scene: 'Evening Relaxation',
    description: '夜晚放松场景',
    targetAudience: '追求生活品质的用户',
    emotionalHook: '放松身心、结束一天',
    visualElements: ['台灯', '书籍', '热饮', '舒适座椅', '窗户夜景']
  }
};

export const productSceneMappings: ProductSceneMapping[] = [
  {
    productName: '毛毯',
    category: 'home-decor',
    primaryScenes: [
      sceneConfigs['living-room'],
      sceneConfigs['bedroom'],
      sceneConfigs['evening-relax']
    ],
    secondaryScenes: [
      sceneConfigs['nursery'],
      sceneConfigs['pet-area'],
      sceneConfigs['outdoor-patio']
    ],
    seasonalScenes: {
      'winter': [sceneConfigs['living-room'], sceneConfigs['bedroom']],
      'spring': [sceneConfigs['outdoor-patio']],
      'holiday': [sceneConfigs['holiday-christmas'], sceneConfigs['holiday-thanksgiving']]
    }
  },
  {
    productName: '无框帆布画',
    category: 'home-decor',
    primaryScenes: [
      sceneConfigs['living-room'],
      sceneConfigs['home-office'],
      sceneConfigs['bedroom']
    ],
    secondaryScenes: [
      sceneConfigs['entryway'],
      sceneConfigs['dining-area'],
      sceneConfigs['nursery']
    ],
    seasonalScenes: {
      'minimalist': [sceneConfigs['home-office']],
      'family': [sceneConfigs['living-room']],
      'artistic': [sceneConfigs['bedroom']]
    }
  },
  {
    productName: '亚克力夜灯',
    category: 'home-decor',
    primaryScenes: [
      sceneConfigs['bedroom'],
      sceneConfigs['nursery'],
      sceneConfigs['evening-relax']
    ],
    secondaryScenes: [
      sceneConfigs['pet-area'],
      sceneConfigs['home-office'],
      sceneConfigs['entryway']
    ],
    seasonalScenes: {
      'night': [sceneConfigs['bedroom'], sceneConfigs['evening-relax']],
      'baby': [sceneConfigs['nursery']],
      'pet': [sceneConfigs['pet-area']]
    }
  },
  {
    productName: '有框帆布画',
    category: 'home-decor',
    primaryScenes: [
      sceneConfigs['living-room'],
      sceneConfigs['dining-area'],
      sceneConfigs['entryway']
    ],
    secondaryScenes: [
      sceneConfigs['bedroom'],
      sceneConfigs['home-office'],
      sceneConfigs['nursery']
    ],
    seasonalScenes: {
      'classic': [sceneConfigs['living-room']],
      'modern': [sceneConfigs['home-office']],
      'family': [sceneConfigs['dining-area']]
    }
  },
  {
    productName: '铁艺',
    category: 'home-decor',
    primaryScenes: [
      sceneConfigs['outdoor-patio'],
      sceneConfigs['garden'],
      sceneConfigs['living-room']
    ],
    secondaryScenes: [
      sceneConfigs['entryway'],
      sceneConfigs['balcony']
    ],
    seasonalScenes: {
      'spring': [sceneConfigs['garden'], sceneConfigs['outdoor-patio']],
      'summer': [sceneConfigs['outdoor-patio']],
      'autumn': [sceneConfigs['garden']]
    }
  },
  {
    productName: '毛绒方形抱枕套含芯',
    category: 'home-decor',
    primaryScenes: [
      sceneConfigs['living-room'],
      sceneConfigs['bedroom'],
      sceneConfigs['outdoor-patio']
    ],
    secondaryScenes: [
      sceneConfigs['nursery'],
      sceneConfigs['evening-relax'],
      sceneConfigs['pet-area']
    ],
    seasonalScenes: {
      'cozy': [sceneConfigs['living-room'], sceneConfigs['bedroom']],
      'outdoor': [sceneConfigs['outdoor-patio']],
      'holiday': [sceneConfigs['living-room']]
    }
  },
  {
    productName: '圆形水晶挂饰',
    category: 'home-decor',
    primaryScenes: [
      sceneConfigs['entryway'],
      sceneConfigs['living-room'],
      sceneConfigs['bedroom']
    ],
    secondaryScenes: [
      sceneConfigs['nursery'],
      sceneConfigs['window'],
      sceneConfigs['garden']
    ],
    seasonalScenes: {
      'light': [sceneConfigs['window']],
      'decoration': [sceneConfigs['entryway'], sceneConfigs['living-room']],
      'garden': [sceneConfigs['garden']]
    }
  },
  {
    productName: '花影盒',
    category: 'home-decor',
    primaryScenes: [
      sceneConfigs['living-room'],
      sceneConfigs['bedroom'],
      sceneConfigs['entryway']
    ],
    secondaryScenes: [
      sceneConfigs['nursery'],
      sceneConfigs['balcony'],
      sceneConfigs['garden']
    ],
    seasonalScenes: {
      'spring': [sceneConfigs['garden'], sceneConfigs['balcony']],
      'indoor': [sceneConfigs['living-room'], sceneConfigs['bedroom']],
      'gift': [sceneConfigs['gifting']]
    }
  },
  {
    productName: '木质画',
    category: 'home-decor',
    primaryScenes: [
      sceneConfigs['living-room'],
      sceneConfigs['home-office'],
      sceneConfigs['dining-area']
    ],
    secondaryScenes: [
      sceneConfigs['bedroom'],
      sceneConfigs['entryway'],
      sceneConfigs['nursery']
    ],
    seasonalScenes: {
      'rustic': [sceneConfigs['living-room']],
      'modern': [sceneConfigs['home-office']],
      'family': [sceneConfigs['dining-area']]
    }
  },
  {
    productName: '刺绣服装',
    category: 'apparel',
    primaryScenes: [
      sceneConfigs['dressing'],
      sceneConfigs['casual-outfit'],
      sceneConfigs['gifting']
    ],
    secondaryScenes: [
      sceneConfigs['family-gathering'],
      sceneConfigs['outdoor'],
      sceneConfigs['holiday-celebration']
    ],
    seasonalScenes: {
      'casual': [sceneConfigs['casual-outfit']],
      'formal': [sceneConfigs['dressing']],
      'holiday': [sceneConfigs['gifting'], sceneConfigs['holiday-celebration']]
    }
  },
  {
    productName: '古巴领睡衣套装长款',
    category: 'apparel',
    primaryScenes: [
      sceneConfigs['bedroom'],
      sceneConfigs['morning-routine'],
      sceneConfigs['evening-relax']
    ],
    secondaryScenes: [
      sceneConfigs['home-lounge'],
      sceneConfigs['pet-area']
    ],
    seasonalScenes: {
      'sleep': [sceneConfigs['bedroom'], sceneConfigs['evening-relax']],
      'morning': [sceneConfigs['morning-routine']],
      'lounge': [sceneConfigs['home-lounge']]
    }
  },
  {
    productName: '印花服装',
    category: 'apparel',
    primaryScenes: [
      sceneConfigs['casual-outfit'],
      sceneConfigs['outdoor'],
      sceneConfigs['gifting']
    ],
    secondaryScenes: [
      sceneConfigs['beach'],
      sceneConfigs['travel'],
      sceneConfigs['family-gathering']
    ],
    seasonalScenes: {
      'summer': [sceneConfigs['beach'], sceneConfigs['outdoor']],
      'casual': [sceneConfigs['casual-outfit']],
      'gift': [sceneConfigs['gifting']]
    }
  },
  {
    productName: '牛奶丝宽松睡裤',
    category: 'apparel',
    primaryScenes: [
      sceneConfigs['bedroom'],
      sceneConfigs['home-lounge'],
      sceneConfigs['evening-relax']
    ],
    secondaryScenes: [
      sceneConfigs['morning-routine'],
      sceneConfigs['pet-area']
    ],
    seasonalScenes: {
      'sleepwear': [sceneConfigs['bedroom'], sceneConfigs['evening-relax']],
      'loungewear': [sceneConfigs['home-lounge']],
      'cozy': [sceneConfigs['evening-relax']]
    }
  },
  {
    productName: '古巴领衬衫',
    category: 'apparel',
    primaryScenes: [
      sceneConfigs['dressing'],
      sceneConfigs['work-outfit'],
      sceneConfigs['casual-outfit']
    ],
    secondaryScenes: [
      sceneConfigs['family-gathering'],
      sceneConfigs['date-night'],
      sceneConfigs['outdoor']
    ],
    seasonalScenes: {
      'work': [sceneConfigs['work-outfit']],
      'casual': [sceneConfigs['casual-outfit']],
      'formal': [sceneConfigs['dressing'], sceneConfigs['date-night']]
    }
  },
  {
    productName: '古巴领睡衣套装短款',
    category: 'apparel',
    primaryScenes: [
      sceneConfigs['bedroom'],
      sceneConfigs['summer-sleep'],
      sceneConfigs['home-lounge']
    ],
    secondaryScenes: [
      sceneConfigs['morning-routine'],
      sceneConfigs['beach']
    ],
    seasonalScenes: {
      'summer': [sceneConfigs['summer-sleep'], sceneConfigs['beach']],
      'sleep': [sceneConfigs['bedroom']],
      'lounge': [sceneConfigs['home-lounge']]
    }
  },
  {
    productName: '涤纶全印棒球帽',
    category: 'apparel',
    primaryScenes: [
      sceneConfigs['outdoor'],
      sceneConfigs['sports'],
      sceneConfigs['casual-outfit']
    ],
    secondaryScenes: [
      sceneConfigs['beach'],
      sceneConfigs['travel'],
      sceneConfigs['fishing']
    ],
    seasonalScenes: {
      'sports': [sceneConfigs['sports'], sceneConfigs['outdoor']],
      'summer': [sceneConfigs['beach'], sceneConfigs['outdoor']],
      'casual': [sceneConfigs['casual-outfit']]
    }
  },
  {
    productName: '带袋沙滩巾',
    category: 'bags-accessories',
    primaryScenes: [
      sceneConfigs['beach'],
      sceneConfigs['pool'],
      sceneConfigs['outdoor-patio']
    ],
    secondaryScenes: [
      sceneConfigs['travel'],
      sceneConfigs['camping'],
      sceneConfigs['picnic']
    ],
    seasonalScenes: {
      'summer': [sceneConfigs['beach'], sceneConfigs['pool']],
      'outdoor': [sceneConfigs['outdoor-patio'], sceneConfigs['picnic']],
      'travel': [sceneConfigs['travel']]
    }
  },
  {
    productName: '烫画帆布书包',
    category: 'bags-accessories',
    primaryScenes: [
      sceneConfigs['school'],
      sceneConfigs['travel'],
      sceneConfigs['daily-commute']
    ],
    secondaryScenes: [
      sceneConfigs['outdoor'],
      sceneConfigs['work'],
      sceneConfigs['travel-adventure']
    ],
    seasonalScenes: {
      'school': [sceneConfigs['school']],
      'travel': [sceneConfigs['travel'], sceneConfigs['travel-adventure']],
      'daily': [sceneConfigs['daily-commute'], sceneConfigs['work']]
    }
  },
  {
    productName: '透明书包',
    category: 'bags-accessories',
    primaryScenes: [
      sceneConfigs['school'],
      sceneConfigs['daily-commute'],
      sceneConfigs['travel']
    ],
    secondaryScenes: [
      sceneConfigs['outdoor'],
      sceneConfigs['work']
    ],
    seasonalScenes: {
      'school': [sceneConfigs['school']],
      'travel': [sceneConfigs['travel']],
      'daily': [sceneConfigs['daily-commute']]
    }
  },
  {
    productName: '男士皮革手拿洗漱包',
    category: 'bags-accessories',
    primaryScenes: [
      sceneConfigs['travel'],
      sceneConfigs['gym'],
      sceneConfigs['business-trip']
    ],
    secondaryScenes: [
      sceneConfigs['bathroom'],
      sceneConfigs['outdoor'],
      sceneConfigs['daily-routine']
    ],
    seasonalScenes: {
      'travel': [sceneConfigs['travel'], sceneConfigs['business-trip']],
      'gym': [sceneConfigs['gym']],
      'daily': [sceneConfigs['daily-routine'], sceneConfigs['bathroom']]
    }
  },
  {
    productName: '亚克力夜灯桌牌',
    category: 'bags-accessories',
    primaryScenes: [
      sceneConfigs['desk'],
      sceneConfigs['bedroom'],
      sceneConfigs['restaurant']
    ],
    secondaryScenes: [
      sceneConfigs['hotel'],
      sceneConfigs['event'],
      sceneConfigs['office']
    ],
    seasonalScenes: {
      'desk': [sceneConfigs['desk'], sceneConfigs['bedroom']],
      'business': [sceneConfigs['restaurant'], sceneConfigs['office']],
      'event': [sceneConfigs['event'], sceneConfigs['hotel']]
    }
  },
  {
    productName: '陶瓷马克杯内彩',
    category: 'kitchen-dining',
    primaryScenes: [
      sceneConfigs['morning-routine'],
      sceneConfigs['kitchen'],
      sceneConfigs['office']
    ],
    secondaryScenes: [
      sceneConfigs['dining-area'],
      sceneConfigs['bedroom'],
      sceneConfigs['workshop']
    ],
    seasonalScenes: {
      'morning': [sceneConfigs['morning-routine']],
      'work': [sceneConfigs['office'], sceneConfigs['workshop']],
      'cozy': [sceneConfigs['dining-area'], sceneConfigs['bedroom']]
    }
  },
  {
    productName: '40oz手提保温杯',
    category: 'kitchen-dining',
    primaryScenes: [
      sceneConfigs['daily-commute'],
      sceneConfigs['gym'],
      sceneConfigs['outdoor']
    ],
    secondaryScenes: [
      sceneConfigs['office'],
      sceneConfigs['travel'],
      sceneConfigs['camping']
    ],
    seasonalScenes: {
      'daily': [sceneConfigs['daily-commute']],
      'fitness': [sceneConfigs['gym']],
      'outdoor': [sceneConfigs['outdoor'], sceneConfigs['camping']]
    }
  },
  {
    productName: '菜板',
    category: 'kitchen-dining',
    primaryScenes: [
      sceneConfigs['kitchen'],
      sceneConfigs['cooking'],
      sceneConfigs['dining-area']
    ],
    secondaryScenes: [
      sceneConfigs['bbq'],
      sceneConfigs['food-prep'],
      sceneConfigs['restaurant']
    ],
    seasonalScenes: {
      'daily': [sceneConfigs['kitchen'], sceneConfigs['cooking']],
      'bbq': [sceneConfigs['bbq']],
      'gourmet': [sceneConfigs['food-prep']]
    }
  },
  {
    productName: '野营刀',
    category: 'outdoor-tools',
    primaryScenes: [
      sceneConfigs['camping'],
      sceneConfigs['outdoor'],
      sceneConfigs['survival']
    ],
    secondaryScenes: [
      sceneConfigs['fishing'],
      sceneConfigs['hunting'],
      sceneConfigs['workshop']
    ],
    seasonalScenes: {
      'camping': [sceneConfigs['camping'], sceneConfigs['outdoor']],
      'survival': [sceneConfigs['survival']],
      'daily': [sceneConfigs['workshop']]
    }
  }
];

export function getProductScenes(productName: string): ProductSceneMapping | null {
  return productSceneMappings.find(m => 
    m.productName === productName || productName.includes(m.productName)
  ) || null;
}

export function getScenePrompt(scene: SceneConfig, productName: string): string {
  return `${productName} in ${scene.scene.toLowerCase()} setting, ${scene.description.toLowerCase()}, ${scene.visualElements.slice(0, 3).join(', ')} in background, warm natural lighting, realistic lifestyle scene, product as focal point`;
}

export function getAllSceneNames(): string[] {
  return Object.keys(sceneConfigs);
}

export function getSceneByName(sceneName: string): SceneConfig | null {
  const normalizedName = sceneName.toLowerCase().replace(/[^a-z]/g, '-');
  return sceneConfigs[normalizedName] || null;
}
