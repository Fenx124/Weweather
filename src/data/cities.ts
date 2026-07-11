export interface CityInfo {
  name: string
  nameEn: string
}

export const CITIES: CityInfo[] = [
  // 中国主要城市
  { name: '北京', nameEn: 'Beijing' },
  { name: '上海', nameEn: 'Shanghai' },
  { name: '重庆', nameEn: 'Chongqing' },
  { name: '天津', nameEn: 'Tianjin' },
  { name: '广州', nameEn: 'Guangzhou' },
  { name: '深圳', nameEn: 'Shenzhen' },
  { name: '成都', nameEn: 'Chengdu' },
  { name: '杭州', nameEn: 'Hangzhou' },
  { name: '武汉', nameEn: 'Wuhan' },
  { name: '西安', nameEn: 'Xi\'an' },
  { name: '南京', nameEn: 'Nanjing' },
  { name: '长沙', nameEn: 'Changsha' },
  { name: '郑州', nameEn: 'Zhengzhou' },
  { name: '苏州', nameEn: 'Suzhou' },
  { name: '青岛', nameEn: 'Qingdao' },
  { name: '大连', nameEn: 'Dalian' },
  { name: '厦门', nameEn: 'Xiamen' },
  { name: '昆明', nameEn: 'Kunming' },
  { name: '哈尔滨', nameEn: 'Harbin' },
  { name: '沈阳', nameEn: 'Shenyang' },
  { name: '福州', nameEn: 'Fuzhou' },
  { name: '合肥', nameEn: 'Hefei' },
  { name: '济南', nameEn: 'Jinan' },
  { name: '贵阳', nameEn: 'Guiyang' },
  { name: '南宁', nameEn: 'Nanning' },
  { name: '兰州', nameEn: 'Lanzhou' },
  { name: '海口', nameEn: 'Haikou' },
  { name: '三亚', nameEn: 'Sanya' },
  { name: '拉萨', nameEn: 'Lhasa' },
  { name: '乌鲁木齐', nameEn: 'Urumqi' },
  { name: '珠海', nameEn: 'Zhuhai' },
  { name: '宁波', nameEn: 'Ningbo' },
  { name: '无锡', nameEn: 'Wuxi' },
  { name: '桂林', nameEn: 'Guilin' },
  { name: '大理', nameEn: 'Dali' },
  { name: '丽江', nameEn: 'Lijiang' },
  // 国际主要城市
  { name: '东京', nameEn: 'Tokyo' },
  { name: '首尔', nameEn: 'Seoul' },
  { name: '曼谷', nameEn: 'Bangkok' },
  { name: '新加坡', nameEn: 'Singapore' },
  { name: '纽约', nameEn: 'New York' },
  { name: '伦敦', nameEn: 'London' },
  { name: '巴黎', nameEn: 'Paris' },
  { name: '悉尼', nameEn: 'Sydney' },
  { name: '莫斯科', nameEn: 'Moscow' },
  { name: '迪拜', nameEn: 'Dubai' },
]

/** 根据输入过滤城市（匹配中文名或英文名） */
export function searchCities(query: string): CityInfo[] {
  if (!query.trim()) return []
  const q = query.trim().toLowerCase()
  return CITIES.filter(
    (c) => c.name.includes(q) || c.nameEn.toLowerCase().includes(q),
  ).slice(0, 8)
}
