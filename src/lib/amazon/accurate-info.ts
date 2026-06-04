import type { ProductCategory } from './product-type-templates';

export interface SizeInfo {
  size: string;
  dimensions: string;
  recommendedUse: string;
}

export interface MaterialInfo {
  primary: string;
  secondary?: string;
  lining?: string;
  features: string[];
  certifications?: string[];
}

export interface FeatureInfo {
  feature: string;
  description: string;
  icon?: string;
}

export interface CareInstruction {
  method: string;
  icon: string;
  warnings?: string[];
}

export interface ProductAccurateInfo {
  productName: string;
  category: ProductCategory;
  sizes: SizeInfo[];
  materials: MaterialInfo;
  features: FeatureInfo[];
  careInstructions: CareInstruction[];
  accurateDescriptions: {
    product: string;
    usage: string;
    targetAudience: string;
    occasions: string[];
  };
}

export const accurateInfoDatabase: ProductAccurateInfo[] = [
  {
    productName: '毛毯',
    category: 'home-decor',
    sizes: [
      { size: 'Small', dimensions: '30" x 40"', recommendedUse: '婴儿车、宠物、办公座椅' },
      { size: 'Medium', dimensions: '50" x 60"', recommendedUse: '沙发、办公桌、卧室' },
      { size: 'Large', dimensions: '60" x 80"', recommendedUse: '床铺、客厅地面、户外野餐' },
      { size: 'X-Large', dimensions: '90" x 90"', recommendedUse: '双人大床、沙发全覆盖' }
    ],
    materials: {
      primary: '100% 法兰绒',
      secondary: '法兰绒',
      features: ['柔软亲肤', '保暖透气', '轻盈便携', '不易掉毛', '四季可用'],
      certifications: ['OEKO-TEX Standard 100']
    },
    features: [
      { feature: '双重加厚', description: '双面绒设计，保暖性能更佳' },
      { feature: '精细包边', description: '精密缝纫工艺，经久耐用' },
      { feature: '活性印染', description: '色彩鲜艳持久，不易褪色' },
      { feature: '多色可选', description: '30+颜色可选，满足不同装修风格' }
    ],
    careInstructions: [
      { method: '机洗', icon: '🧺', warnings: ['冷水洗涤', '温和模式'] },
      { method: '低温烘干', icon: '🔥', warnings: ['低温烘干', '避免高温'] },
      { method: '不可熨烫', icon: '❌' },
      { method: '悬挂晾干', icon: '☀️', warnings: ['避免阳光直射'] }
    ],
    accurateDescriptions: {
      product: '定制法兰绒毛毯，采用优质法兰绒精密编织，双面绒感设计带来柔软舒适的触感体验',
      usage: '适用于客厅沙发、卧室床铺、办公座椅、户外野餐、婴儿护理等多种场景',
      targetAudience: '家庭用户、办公室白领、婴幼儿家长、宠物主人、旅行爱好者',
      occasions: ['日常使用', '午睡小憩', '户外活动', '礼品赠送']
    }
  },
  {
    productName: '无框帆布画',
    category: 'home-decor',
    sizes: [
      { size: '8x10 inch', dimensions: '20x25cm', recommendedUse: '小型墙面、书架展示' },
      { size: '12x16 inch', dimensions: '30x40cm', recommendedUse: '标准墙面、梳妆台' },
      { size: '16x20 inch', dimensions: '40x50cm', recommendedUse: '卧室、客厅主墙' },
      { size: '20x24 inch', dimensions: '50x60cm', recommendedUse: '大墙面、办公空间' },
      { size: '24x36 inch', dimensions: '60x90cm', recommendedUse: '客厅主墙、商业空间' }
    ],
    materials: {
      primary: '纯棉帆布',
      secondary: '360gsm重磅画布',
      features: ['博物馆级画质', '防水防潮', '抗紫外线', '无反光涂层', '环保墨水'],
      certifications: ['HP Latex Ink Eco Logo']
    },
    features: [
      { feature: '专业微喷技术', description: '12色原装墨水，色彩还原度达98%以上' },
      { feature: '纯棉画布', description: '精选400克纯棉帆布，纹理清晰自然' },
      { feature: '无框设计', description: '画面延伸至边缘，无需装裱即可悬挂' },
      { feature: '防潮防霉', description: '特殊涂层处理，适合潮湿环境' }
    ],
    careInstructions: [
      { method: '干布轻擦', icon: '🧹', warnings: ['避免使用湿布'] },
      { method: '避免阳光直射', icon: '☀️', warnings: ['延长色彩寿命'] },
      { method: '防潮存放', icon: '💧', warnings: ['高湿度环境需除湿'] }
    ],
    accurateDescriptions: {
      product: '定制纯棉帆布画，采用360gsm重磅画布和HP Latex环保墨水微喷制作，色彩鲜艳持久，细节清晰呈现',
      usage: '适用于家居装饰、办公室布置、婚纱照展示、艺术画框替代、商业空间装饰',
      targetAudience: '家居装饰爱好者、摄影爱好者、新婚夫妇、企业礼品采购',
      occasions: ['新家装修', '搬家送礼', '结婚纪念', '生日礼物', '企业定制']
    }
  },
  {
    productName: '亚克力夜灯',
    category: 'home-decor',
    sizes: [
      { size: 'Small (6 inch)', dimensions: '15cm', recommendedUse: '床头柜、书架、办公桌' },
      { size: 'Medium (8 inch)', dimensions: '20cm', recommendedUse: '卧室主灯、儿童房' },
      { size: 'Large (10 inch)', dimensions: '25cm', recommendedUse: '客厅装饰、开业礼品' }
    ],
    materials: {
      primary: '3mm高透光亚克力板',
      secondary: 'LED光源',
      features: ['柔光护眼', '低功耗LED', '长寿命(50000小时)', 'USB供电', '多档调光'],
      certifications: ['CE认证', 'RoHS合规']
    },
    features: [
      { feature: '3D激光雕刻', description: '进口亚克力板，激光精雕，边缘光滑无毛刺' },
      { feature: '柔光LED', description: '15-20流明，恰到好处的亮度，不刺眼助睡眠' },
      { feature: 'USB供电', description: '5V/1A安全电压，支持充电宝、电脑USB供电' },
      { feature: '触控调光', description: '轻触开关，三档亮度可调' }
    ],
    careInstructions: [
      { method: '干布擦拭', icon: '🧹', warnings: ['避免使用酒精'] },
      { method: '防水防潮', icon: '💧', warnings: ['室内干燥环境使用'] },
      { method: '避免跌落', icon: '⚠️', warnings: ['亚克力材质，避免撞击'] }
    ],
    accurateDescriptions: {
      product: '定制3D亚克力夜灯，采用进口高透光亚克力板配合柔光LED光源，通过激光精雕技术呈现精美图案',
      usage: '适用于卧室助眠灯、儿童房夜灯、走廊照明、办公桌氛围灯、店铺装饰灯',
      targetAudience: '新手父母、卧室装饰需求者、店铺商家、礼品采购',
      occasions: ['儿童房布置', '乔迁送礼', '生日礼物', '情侣礼品', '店铺开业']
    }
  },
  {
    productName: '陶瓷马克杯内彩',
    category: 'kitchen-dining',
    sizes: [
      { size: 'Standard', dimensions: '11oz (325ml)', recommendedUse: '日常饮用、家庭使用' },
      { size: 'Large', dimensions: '15oz (450ml)', recommendedUse: '咖啡爱好者、大杯需求' }
    ],
    materials: {
      primary: '优质陶瓷',
      secondary: '食品安全级釉面',
      features: ['内壁全彩印刷', '食品安全', '微波炉可用', '洗碗机可用', '手工品质'],
      certifications: ['FDA食品接触认证', '加州65号提案合规']
    },
    features: [
      { feature: '内彩工艺', description: '杯身内壁360°全彩印刷，图案完整呈现' },
      { feature: '食品安全', description: '采用FDA认证食品安全墨水，微波洗碗机安全' },
      { feature: '杯型设计', description: '人体工学握柄，舒适手感，12oz/15oz容量' },
      { feature: '礼盒包装', description: '每只马克杯独立礼盒包装，适合送礼' }
    ],
    careInstructions: [
      { method: '机洗', icon: '🧺', warnings: ['建议使用温和模式'] },
      { method: '微波炉', icon: '📻', warnings: ['可以微波加热'] },
      { method: '手洗', icon: '🧼', warnings: ['延长印刷寿命'] }
    ],
    accurateDescriptions: {
      product: '定制内彩陶瓷马克杯，采用食品安全级釉面工艺，内壁360°全彩印刷，图案清晰艳丽',
      usage: '适用于家庭早餐、办公室饮品、生日蛋糕配咖啡、咖啡馆定制',
      targetAudience: '咖啡爱好者、家庭主妇/夫、企业礼品、宠物爱好者、情侣',
      occasions: ['生日礼物', '母亲节/父亲节', '结婚礼物', '企业定制', '家庭聚会']
    }
  },
  {
    productName: '40oz手提保温杯',
    category: 'kitchen-dining',
    sizes: [
      { size: '40oz', dimensions: '约1.2L容量', recommendedUse: '日常饮水、运动补水、旅行' },
      { size: '30oz', dimensions: '约900ml容量', recommendedUse: '办公室、健身房' }
    ],
    materials: {
      primary: '18/8不锈钢',
      secondary: '双层真空绝热',
      features: ['24小时保冷', '12小时保温', '防漏设计', '不含BPA', '防滑底座'],
      certifications: ['FDA认证', 'BPA Free', 'FTC原产地标注合规']
    },
    features: [
      { feature: '双层真空', description: '18/8食品级不锈钢，24小时保冷、12小时保温' },
      { feature: '防漏设计', description: '硅胶密封圈，倒置不漏水，适合通勤使用' },
      { feature: '提手设计', description: '人体工学拎手，携带方便' },
      { feature: '大容量', description: '40oz约1.2L，满足全天候饮水需求' }
    ],
    careInstructions: [
      { method: '手洗', icon: '🧼', warnings: ['温水手洗', '避免使用研磨剂'] },
      { method: '不可微波', icon: '❌', warnings: ['金属材质不可微波'] },
      { method: '晾干存放', icon: '☀️', warnings: ['使用后倒置晾干'] }
    ],
    accurateDescriptions: {
      product: '定制40oz不锈钢保温杯，采用18/8食品级不锈钢双层真空工艺，24小时保冷12小时保温',
      usage: '适用于健身运动、日常通勤、旅行出游、办公室饮水、野营探险',
      targetAudience: '健身爱好者、上班族、旅行者、学生、户外运动者',
      occasions: ['生日礼物', '毕业礼物', '健身礼品', '企业定制', '旅行礼品']
    }
  },
  {
    productName: '涤纶全印棒球帽',
    category: 'apparel',
    sizes: [
      { size: 'Adjustable', dimensions: '可调节 (22-24")', recommendedUse: '成人通用' },
      { size: 'Youth', dimensions: '青少年 (20-22")', recommendedUse: '8-14岁儿童' }
    ],
    materials: {
      primary: '100%聚酯纤维',
      secondary: '网眼透气布',
      features: ['全息印花', '6孔透气网', '吸湿排汗', '可调节帽围', '速干面料'],
      certifications: ['OEKO-TEX Standard 100']
    },
    features: [
      { feature: '全息烫画工艺', description: '进口烫画纸，图案色彩鲜艳，持久不脱落' },
      { feature: '透气网眼', description: '6个透气孔设计，散热排汗，佩戴舒适' },
      { feature: '可调节', description: '魔术贴/金属扣设计，适合不同头围' },
      { feature: '速干面料', description: '聚酯纤维材质，快速干燥' }
    ],
    careInstructions: [
      { method: '机洗', icon: '🧺', warnings: ['冷水洗涤', '翻面洗'] },
      { method: '自然晾干', icon: '☀️', warnings: ['避免烘干机'] },
      { method: '低温熨烫', icon: '🔥', warnings: ['仅烫帽子背面'] }
    ],
    accurateDescriptions: {
      product: '定制全印涤纶棒球帽，采用100%聚酯纤维面料，全息烫画印花工艺，6孔透气设计',
      usage: '适用于日常休闲、运动健身、户外活动、品牌推广、企业工帽',
      targetAudience: '运动爱好者、品牌商家、企业团购、个人定制爱好者',
      occasions: ['企业工服', '团队活动', '生日礼物', '旅游纪念', '品牌营销']
    }
  },
  {
    productName: '古巴领睡衣套装',
    category: 'apparel',
    sizes: [
      { size: 'S', dimensions: '胸围96cm, 衣长68cm', recommendedUse: '体重100-120斤' },
      { size: 'M', dimensions: '胸围100cm, 衣长70cm', recommendedUse: '体重120-140斤' },
      { size: 'L', dimensions: '胸围104cm, 衣长72cm', recommendedUse: '体重140-160斤' },
      { size: 'XL', dimensions: '胸围108cm, 衣长74cm', recommendedUse: '体重160-180斤' },
      { size: '2XL', dimensions: '胸围112cm, 衣长76cm', recommendedUse: '体重180-200斤' }
    ],
    materials: {
      primary: '棉+涤纶混纺',
      secondary: '牛奶丝面料',
      features: ['透气舒适', '柔软亲肤', '不易起球', '机洗不变形', '不易褪色'],
      certifications: ['OEKO-TEX Standard 100']
    },
    features: [
      { feature: '古巴领设计', description: '经典古巴领，商务休闲两相宜' },
      { feature: '两件套套装', description: '上衣+裤子全套，配套设计' },
      { feature: '纽扣开合', description: '胸前纽扣设计，穿脱方便' },
      { feature: '多色可选', description: '20+颜色可选' }
    ],
    careInstructions: [
      { method: '机洗', icon: '🧺', warnings: ['冷水洗涤'] },
      { method: '低温烘干', icon: '🔥', warnings: ['低温烘干'] },
      { method: '低温熨烫', icon: '🔥', warnings: ['可低温熨烫'] }
    ],
    accurateDescriptions: {
      product: '定制古巴领睡衣套装，采用棉涤混纺面料，古巴领设计，配套上下装，舒适透气',
      usage: '适用于居家睡眠、晨间活动、客厅休息、夏季穿着',
      targetAudience: '注重睡眠品质的男性、家庭采购、礼品赠送',
      occasions: ['生日礼物', '父亲节礼物', '丈夫礼物', '乔迁礼品']
    }
  },
  {
    productName: '烫画帆布书包',
    category: 'bags-accessories',
    sizes: [
      { size: 'Small', dimensions: '15x12x4 inch', recommendedUse: '小学生、日常短途' },
      { size: 'Medium', dimensions: '18x14x6 inch', recommendedUse: '中学生、大学生' },
      { size: 'Large', dimensions: '20x16x8 inch', recommendedUse: '大学生、旅行' }
    ],
    materials: {
      primary: '12oz纯棉帆布',
      secondary: '工业涤纶线',
      features: ['高密度帆布', '加粗缝线', '笔记本夹层', '前置口袋', '肩带加厚'],
      certifications: ['AZO Free染料']
    },
    features: [
      { feature: '12oz重磅帆布', description: '精选纯棉帆布，厚度适中，承重力强' },
      { feature: '高清烫画', description: '进口烫画纸，图案清晰持久' },
      { feature: '多层结构', description: '主袋+前袋+侧袋，分区收纳' },
      { feature: '肩带加厚', description: '肩带加宽加厚，减轻背负压力' }
    ],
    careInstructions: [
      { method: '手洗', icon: '🧼', warnings: ['冷水手洗'] },
      { method: '阴凉晾干', icon: '☀️', warnings: ['避免暴晒'] },
      { method: '定期清洁', icon: '🧹', warnings: ['保持书包整洁'] }
    ],
    accurateDescriptions: {
      product: '定制烫画帆布书包，采用12oz纯棉帆布面料，高清烫画工艺，多层收纳设计',
      usage: '适用于学生上学、旅行出行、日常通勤、野营装备',
      targetAudience: '学生群体、旅行爱好者、户外运动者、企业定制',
      occasions: ['开学季', '毕业礼物', '旅行纪念', '企业定制', '品牌推广']
    }
  },
  {
    productName: '野营刀',
    category: 'outdoor-tools',
    sizes: [
      { size: 'Small', dimensions: '刀刃3-4 inch', recommendedUse: '日常EDC、精细切割' },
      { size: 'Medium', dimensions: '刀刃4-5 inch', recommendedUse: '露营、徒步' },
      { size: 'Large', dimensions: '刀刃5-6 inch', recommendedUse: '专业户外、救援' }
    ],
    materials: {
      primary: '高碳钢/不锈钢',
      secondary: 'G10/木头/米卡塔手柄',
      features: ['锋利耐用', '人体工学手柄', '安全锁定', '便携口袋夹', '防水防锈'],
      certifications: ['符合美国刀具法规', '符合ASTM标准']
    },
    features: [
      { feature: '优质钢材', description: '440C不锈钢或高碳钢，硬度HRC 56-59' },
      { feature: '人体工学手柄', description: 'G10/米卡塔材质，握感舒适防滑' },
      { feature: '安全锁定', description: '线锁/轴锁设计，开合顺畅安全' },
      { feature: '便携设计', description: '口袋夹设计，携带方便' }
    ],
    careInstructions: [
      { method: '定期润滑', icon: '🛢️', warnings: ['保持刀轴润滑'] },
      { method: '保持干燥', icon: '💧', warnings: ['使用后擦干', '防止生锈'] },
      { method: '安全存放', icon: '🔒', warnings: ['远离儿童'] }
    ],
    accurateDescriptions: {
      product: '定制户外野营刀，采用440C不锈钢刀刃配合G10手柄，安全锁定机制，适合户外探险和日常使用',
      usage: '适用于户外露营、徒步探险、狩猎捕鱼、日常切割',
      targetAudience: '户外爱好者、猎人、户外工作者、EDC收藏爱好者',
      occasions: ['生日礼物', '父亲节礼物', '户外活动', '狩猎季', 'EDC装备升级']
    }
  },
  {
    productName: '带袋沙滩巾',
    category: 'bags-accessories',
    sizes: [
      { size: 'Small', dimensions: '30" x 60"', recommendedUse: '儿童、轻便出行' },
      { size: 'Medium', dimensions: '40" x 70"', recommendedUse: '成人沙滩使用' },
      { size: 'Large', dimensions: '60" x 80"', recommendedUse: '双人、瑜伽垫替代' }
    ],
    materials: {
      primary: '超细纤维(90%聚酯+10%聚酰胺)',
      secondary: '沙滩巾面料',
      features: ['吸水速干', '轻量便携', '包袋一体', 'UPF50+防晒', '不易掉毛'],
      certifications: ['OEKO-TEX Standard 100']
    },
    features: [
      { feature: '一体式口袋', description: '毛巾一端连接防水口袋，可存放手机钥匙' },
      { feature: '超细纤维', description: '吸水性强，速干性能好' },
      { feature: '轻量便携', description: '折叠后小巧，可挂背包' },
      { feature: '沙滩友好', description: '防水口袋保护贵重物品' }
    ],
    careInstructions: [
      { method: '机洗', icon: '🧺', warnings: ['可机洗'] },
      { method: '晾干', icon: '☀️', warnings: ['快速晾干'] },
      { method: '低温熨烫', icon: '🔥', warnings: ['避免高温'] }
    ],
    accurateDescriptions: {
      product: '定制带袋沙滩巾，采用超细纤维面料，一体式防水口袋设计，吸水速干，轻量便携',
      usage: '适用于沙滩、海滩、游泳池、野餐、瑜伽、户外音乐节',
      targetAudience: '沙滩爱好者、游泳爱好者、音乐节参与者、户外活动爱好者',
      occasions: ['夏季礼物', '旅行装备', '音乐节装备', '沙滩度假']
    }
  }
];

export function getProductAccurateInfo(productName: string): ProductAccurateInfo | null {
  return accurateInfoDatabase.find(info => 
    productName.includes(info.productName) || info.productName.includes(productName)
  ) || null;
}

export function generateAccuratePrompt(info: ProductAccurateInfo, type: 'size' | 'material' | 'feature' | 'care'): string {
  switch (type) {
    case 'size':
      return `Size options: ${info.sizes.map(s => `${s.size} (${s.dimensions})`).join(', ')}. ${info.sizes[0].recommendedUse}`;
    case 'material':
      return `${info.materials.primary}${info.materials.secondary ? ` + ${info.materials.secondary}` : ''}. Features: ${info.materials.features.join(', ')}`;
    case 'feature':
      return info.features.map(f => `${f.feature}: ${f.description}`).join('. ');
    case 'care':
      return info.careInstructions.map(c => `${c.icon} ${c.method}${c.warnings ? ` (${c.warnings.join(', ')})` : ''}`).join('. ');
  }
}

export function getAllAccurateProducts(): string[] {
  return accurateInfoDatabase.map(info => info.productName);
}

export function searchProducts(query: string): ProductAccurateInfo[] {
  const lowerQuery = query.toLowerCase();
  return accurateInfoDatabase.filter(info => 
    info.productName.includes(query) || 
    info.accurateDescriptions.product.toLowerCase().includes(lowerQuery)
  );
}
