//温度单位：摄氏度
/*
let nameOfAvgShouldBe = 'Т ср';
let nameOfMinShouldBe = 'Т мин';
let nameOfMaxShouldBe = 'Т макс';
*/
//均、低、高温标题列index(不是数据列index，数据列index应该加3，因为标题前两行span了)
let indexOfColumnAvgName = 0;
let indexOfColumnAvgMinName = 1;
let indexOfColumnAvgMaxName = 2;
let indexOfColumnMinName = 3;
let indexOfColumnMinDateName = 4;
let indexOfColumnMaxName = 5;
let indexOfColumnMaxDateName = 6;
//数据列index
let indexOfWmoNo = 0;
let indexOfStationName = 1;
let indexOfDate = 2;
let indexOfColumnMin = indexOfColumnMinName + 3;
let indexOfColumnMinDate = indexOfColumnMinDateName + 3;
let indexOfColumnAvgMin = indexOfColumnAvgMinName + 3;
let indexOfColumnAvg = indexOfColumnAvgName + 3;
let indexOfColumnAvgMax = indexOfColumnAvgMaxName + 3;
let indexOfColumnMax = indexOfColumnMaxName + 3;
let indexOfColumnMaxDate = indexOfColumnMaxDateName + 3;
//自定义项名
let customedNameMin = '月最低';
let customedNameMinDate = '月最低日期';
let customedNameAvgMin = '月平均低温';
let customedNameAvg = '月平均';
let customedNameAvgMax = '月平均高温';
let customedNameMax = '月最高';
let customedNameMaxDate = '月最高日期';
//汉化
let chineseNamesObj = {
  "58015": {
     "Region":"安徽"
    ,"Station":"砀山"
    },
  "58016": {
     "Region":"安徽"
    ,"Station":"萧县"
    },
  "58102": {
     "Region":"安徽"
    ,"Station":"亳州"
    },
  "58107": {
     "Region":"安徽"
    ,"Station":"临泉"
    },
  "58108": {
     "Region":"安徽"
    ,"Station":"界首"
    },
  "58109": {
     "Region":"安徽"
    ,"Station":"太和"
    },
  "58112": {
     "Region":"安徽"
    ,"Station":"天柱山"
    },
  "58113": {
     "Region":"安徽"
    ,"Station":"濉溪"
    },
  "58114": {
     "Region":"安徽"
    ,"Station":"涡阳"
    },
  "58116": {
     "Region":"安徽"
    ,"Station":"淮北"
    },
  "58117": {
     "Region":"安徽"
    ,"Station":"利辛"
    },
  "58118": {
     "Region":"安徽"
    ,"Station":"蒙城"
    },
  "58122": {
     "Region":"安徽"
    ,"Station":"宿州"
    },
  "58125": {
     "Region":"安徽"
    ,"Station":"灵璧"
    },
  "58126": {
     "Region":"安徽"
    ,"Station":"泗县"
    },
  "58127": {
     "Region":"安徽"
    ,"Station":"怀远"
    },
  "58128": {
     "Region":"安徽"
    ,"Station":"固镇"
    },
  "58129": {
     "Region":"安徽"
    ,"Station":"五河"
    },
  "58202": {
     "Region":"安徽"
    ,"Station":"阜南"
    },
  "58203": {
     "Region":"安徽"
    ,"Station":"阜阳"
    },
  "58210": {
     "Region":"安徽"
    ,"Station":"颍上"
    },
  "58212": {
     "Region":"安徽"
    ,"Station":"凤台"
    },
  "58214": {
     "Region":"安徽"
    ,"Station":"霍邱"
    },
  "58215": {
     "Region":"安徽"
    ,"Station":"寿县"
    },
  "58220": {
     "Region":"安徽"
    ,"Station":"长丰"
    },
  "58221": {
     "Region":"安徽"
    ,"Station":"蚌埠"
    },
  "58222": {
     "Region":"安徽"
    ,"Station":"凤阳"
    },
  "58223": {
     "Region":"安徽"
    ,"Station":"明光"
    },
  "58224": {
     "Region":"安徽"
    ,"Station":"淮南"
    },
  "58225": {
     "Region":"安徽"
    ,"Station":"定远"
    },
  "58230": {
     "Region":"安徽"
    ,"Station":"全椒"
    },
  "58234": {
     "Region":"安徽"
    ,"Station":"来安"
    },
  "58236": {
     "Region":"安徽"
    ,"Station":"滁州"
    },
  "58240": {
     "Region":"安徽"
    ,"Station":"天长"
    },
  "58306": {
     "Region":"安徽"
    ,"Station":"金寨"
    },
  "58311": {
     "Region":"安徽"
    ,"Station":"六安"
    },
  "58314": {
     "Region":"安徽"
    ,"Station":"霍山"
    },
  "58316": {
     "Region":"安徽"
    ,"Station":"舒城"
    },
  "58317": {
     "Region":"安徽"
    ,"Station":"岳西"
    },
  "58319": {
     "Region":"安徽"
    ,"Station":"桐城"
    },
  "58320": {
     "Region":"安徽"
    ,"Station":"肥西"
    },
  "58321": {
     "Region":"安徽"
    ,"Station":"合肥"
    },
  "58323": {
     "Region":"安徽"
    ,"Station":"肥东"
    },
  "58326": {
     "Region":"安徽"
    ,"Station":"巢湖"
    },
  "58327": {
     "Region":"安徽"
    ,"Station":"庐江"
    },
  "58329": {
     "Region":"安徽"
    ,"Station":"无为"
    },
  "58330": {
     "Region":"安徽"
    ,"Station":"含山"
    },
  "58331": {
     "Region":"安徽"
    ,"Station":"和县"
    },
  "58334": {
     "Region":"安徽"
    ,"Station":"芜湖"
    },
  "58335": {
     "Region":"安徽"
    ,"Station":"当涂"
    },
  "58336": {
     "Region":"安徽"
    ,"Station":"马鞍山"
    },
  "58337": {
     "Region":"安徽"
    ,"Station":"繁昌"
    },
  "58338": {
     "Region":"安徽"
    ,"Station":"芜湖县"
    },
  "58414": {
     "Region":"安徽"
    ,"Station":"太湖"
    },
  "58415": {
     "Region":"安徽"
    ,"Station":"潜山"
    },
  "58416": {
     "Region":"安徽"
    ,"Station":"怀宁"
    },
  "58417": {
     "Region":"安徽"
    ,"Station":"宿松"
    },
  "58418": {
     "Region":"安徽"
    ,"Station":"望江"
    },
  "58419": {
     "Region":"安徽"
    ,"Station":"东至"
    },
  "58420": {
     "Region":"安徽"
    ,"Station":"枞阳"
    },
  "58421": {
     "Region":"安徽"
    ,"Station":"青阳"
    },
  "58423": {
     "Region":"安徽"
    ,"Station":"九华山"
    },
  "58424": {
     "Region":"安徽"
    ,"Station":"安庆"
    },
  "58426": {
     "Region":"安徽"
    ,"Station":"黄山区"
    },
  "58427": {
     "Region":"安徽"
    ,"Station":"池州"
    },
  "58428": {
     "Region":"安徽"
    ,"Station":"石台"
    },
  "58429": {
     "Region":"安徽"
    ,"Station":"铜陵"
    },
  "58431": {
     "Region":"安徽"
    ,"Station":"南陵"
    },
  "58432": {
     "Region":"安徽"
    ,"Station":"泾县"
    },
  "58433": {
     "Region":"安徽"
    ,"Station":"宣城"
    },
  "58435": {
     "Region":"安徽"
    ,"Station":"旌德"
    },
  "58436": {
     "Region":"安徽"
    ,"Station":"宁国"
    },
  "58437": {
     "Region":"安徽"
    ,"Station":"黄山"
    },
  "58438": {
     "Region":"安徽"
    ,"Station":"绩溪"
    },
  "58441": {
     "Region":"安徽"
    ,"Station":"广德"
    },
  "58442": {
     "Region":"安徽"
    ,"Station":"郎溪"
    },
  "58520": {
     "Region":"安徽"
    ,"Station":"祁门"
    },
  "58523": {
     "Region":"安徽"
    ,"Station":"黟县"
    },
  "58530": {
     "Region":"安徽"
    ,"Station":"歙县"
    },
  "58531": {
     "Region":"安徽"
    ,"Station":"屯溪"
    },
  "58534": {
     "Region":"安徽"
    ,"Station":"休宁"
    },
  "54398": {
     "Region":"北京"
    ,"Station":"顺义"
    },
  "54399": {
     "Region":"北京"
    ,"Station":"海淀"
    },
  "54406": {
     "Region":"北京"
    ,"Station":"延庆"
    },
  "54410": {
     "Region":"北京"
    ,"Station":"佛爷顶"
    },
  "54412": {
     "Region":"北京"
    ,"Station":"汤河口"
    },
  "54416": {
     "Region":"北京"
    ,"Station":"密云"
    },
  "54419": {
     "Region":"北京"
    ,"Station":"怀柔"
    },
  "54421": {
     "Region":"北京"
    ,"Station":"密云上甸子"
    },
  "54424": {
     "Region":"北京"
    ,"Station":"平谷"
    },
  "54431": {
     "Region":"北京"
    ,"Station":"通州"
    },
  "54433": {
     "Region":"北京"
    ,"Station":"朝阳"
    },
  "54499": {
     "Region":"北京"
    ,"Station":"昌平"
    },
  "54501": {
     "Region":"北京"
    ,"Station":"斋堂"
    },
  "54505": {
     "Region":"北京"
    ,"Station":"门头沟"
    },
  "54511": {
     "Region":"北京"
    ,"Station":"北京"
    },
  "54513": {
     "Region":"北京"
    ,"Station":"石景山"
    },
  "54514": {
     "Region":"北京"
    ,"Station":"丰台"
    },
  "54594": {
     "Region":"北京"
    ,"Station":"大兴"
    },
  "54596": {
     "Region":"北京"
    ,"Station":"房山"
    },
  "54597": {
     "Region":"北京"
    ,"Station":"霞云岭"
    },
  "58724": {
     "Region":"福建"
    ,"Station":"光泽"
    },
  "58725": {
     "Region":"福建"
    ,"Station":"邵武"
    },
  "58730": {
     "Region":"福建"
    ,"Station":"武夷山"
    },
  "58731": {
     "Region":"福建"
    ,"Station":"浦城"
    },
  "58734": {
     "Region":"福建"
    ,"Station":"建阳"
    },
  "58735": {
     "Region":"福建"
    ,"Station":"松溪"
    },
  "58736": {
     "Region":"福建"
    ,"Station":"政和"
    },
  "58737": {
     "Region":"福建"
    ,"Station":"建瓯"
    },
  "58744": {
     "Region":"福建"
    ,"Station":"寿宁"
    },
  "58747": {
     "Region":"福建"
    ,"Station":"周宁"
    },
  "58748": {
     "Region":"福建"
    ,"Station":"福安"
    },
  "58749": {
     "Region":"福建"
    ,"Station":"柘荣"
    },
  "58754": {
     "Region":"福建"
    ,"Station":"福鼎"
    },
  "58818": {
     "Region":"福建"
    ,"Station":"宁化"
    },
  "58819": {
     "Region":"福建"
    ,"Station":"清流"
    },
  "58820": {
     "Region":"福建"
    ,"Station":"泰宁"
    },
  "58821": {
     "Region":"福建"
    ,"Station":"将乐"
    },
  "58822": {
     "Region":"福建"
    ,"Station":"建宁"
    },
  "58823": {
     "Region":"福建"
    ,"Station":"顺昌"
    },
  "58824": {
     "Region":"福建"
    ,"Station":"明溪"
    },
  "58826": {
     "Region":"福建"
    ,"Station":"沙县"
    },
  "58828": {
     "Region":"福建"
    ,"Station":"三明"
    },
  "58834": {
     "Region":"福建"
    ,"Station":"南平"
    },
  "58836": {
     "Region":"福建"
    ,"Station":"古田"
    },
  "58837": {
     "Region":"福建"
    ,"Station":"尤溪"
    },
  "58839": {
     "Region":"福建"
    ,"Station":"闽清"
    },
  "58843": {
     "Region":"福建"
    ,"Station":"霞浦"
    },
  "58844": {
     "Region":"福建"
    ,"Station":"闽侯"
    },
  "58845": {
     "Region":"福建"
    ,"Station":"罗源"
    },
  "58846": {
     "Region":"福建"
    ,"Station":"宁德"
    },
  "58847": {
     "Region":"福建"
    ,"Station":"福州"
    },
  "58848": {
     "Region":"福建"
    ,"Station":"连江"
    },
  "58850": {
     "Region":"福建"
    ,"Station":"三沙"
    },
  "58911": {
     "Region":"福建"
    ,"Station":"长汀"
    },
  "58912": {
     "Region":"福建"
    ,"Station":"连城"
    },
  "58917": {
     "Region":"福建"
    ,"Station":"武平"
    },
  "58918": {
     "Region":"福建"
    ,"Station":"上杭"
    },
  "58921": {
     "Region":"福建"
    ,"Station":"永安"
    },
  "58923": {
     "Region":"福建"
    ,"Station":"大田"
    },
  "58926": {
     "Region":"福建"
    ,"Station":"漳平"
    },
  "58927": {
     "Region":"福建"
    ,"Station":"龙岩"
    },
  "58928": {
     "Region":"福建"
    ,"Station":"华安"
    },
  "58929": {
     "Region":"福建"
    ,"Station":"安溪"
    },
  "58931": {
     "Region":"福建"
    ,"Station":"九仙山"
    },
  "58932": {
     "Region":"福建"
    ,"Station":"永泰"
    },
  "58933": {
     "Region":"福建"
    ,"Station":"屏南"
    },
  "58934": {
     "Region":"福建"
    ,"Station":"永春"
    },
  "58935": {
     "Region":"福建"
    ,"Station":"德化"
    },
  "58936": {
     "Region":"福建"
    ,"Station":"仙游"
    },
  "58938": {
     "Region":"福建"
    ,"Station":"秀屿"
    },
  "58940": {
     "Region":"福建"
    ,"Station":"福州郊区"
    },
  "58941": {
     "Region":"福建"
    ,"Station":"长乐"
    },
  "58942": {
     "Region":"福建"
    ,"Station":"福清"
    },
  "58944": {
     "Region":"福建"
    ,"Station":"平潭"
    },
  "58946": {
     "Region":"福建"
    ,"Station":"莆田"
    },
  "59113": {
     "Region":"福建"
    ,"Station":"永定"
    },
  "59122": {
     "Region":"福建"
    ,"Station":"长泰"
    },
  "59124": {
     "Region":"福建"
    ,"Station":"南靖"
    },
  "59125": {
     "Region":"福建"
    ,"Station":"平和"
    },
  "59126": {
     "Region":"福建"
    ,"Station":"漳州"
    },
  "59127": {
     "Region":"福建"
    ,"Station":"龙海"
    },
  "59129": {
     "Region":"福建"
    ,"Station":"漳浦"
    },
  "59130": {
     "Region":"福建"
    ,"Station":"同安"
    },
  "59131": {
     "Region":"福建"
    ,"Station":"南安"
    },
  "59133": {
     "Region":"福建"
    ,"Station":"崇武"
    },
  "59134": {
     "Region":"福建"
    ,"Station":"厦门"
    },
  "59137": {
     "Region":"福建"
    ,"Station":"晋江"
    },
  "59320": {
     "Region":"福建"
    ,"Station":"诏安"
    },
  "59321": {
     "Region":"福建"
    ,"Station":"东山"
    },
  "59322": {
     "Region":"福建"
    ,"Station":"云霄"
    },
  "52323": {
     "Region":"甘肃"
    ,"Station":"马鬃山"
    },
  "52418": {
     "Region":"甘肃"
    ,"Station":"敦煌"
    },
  "52424": {
     "Region":"甘肃"
    ,"Station":"瓜州"
    },
  "52436": {
     "Region":"甘肃"
    ,"Station":"玉门镇"
    },
  "52446": {
     "Region":"甘肃"
    ,"Station":"鼎新"
    },
  "52447": {
     "Region":"甘肃"
    ,"Station":"金塔"
    },
  "52515": {
     "Region":"甘肃"
    ,"Station":"肃北"
    },
  "52533": {
     "Region":"甘肃"
    ,"Station":"酒泉"
    },
  "52546": {
     "Region":"甘肃"
    ,"Station":"高台"
    },
  "52557": {
     "Region":"甘肃"
    ,"Station":"临泽"
    },
  "52643": {
     "Region":"甘肃"
    ,"Station":"肃南"
    },
  "52652": {
     "Region":"甘肃"
    ,"Station":"张掖"
    },
  "52656": {
     "Region":"甘肃"
    ,"Station":"民乐"
    },
  "52661": {
     "Region":"甘肃"
    ,"Station":"山丹"
    },
  "52674": {
     "Region":"甘肃"
    ,"Station":"永昌"
    },
  "52679": {
     "Region":"甘肃"
    ,"Station":"武威"
    },
  "52681": {
     "Region":"甘肃"
    ,"Station":"民勤"
    },
  "52784": {
     "Region":"甘肃"
    ,"Station":"古浪"
    },
  "52787": {
     "Region":"甘肃"
    ,"Station":"乌鞘岭"
    },
  "52797": {
     "Region":"甘肃"
    ,"Station":"景泰"
    },
  "52881": {
     "Region":"甘肃"
    ,"Station":"天祝"
    },
  "52884": {
     "Region":"甘肃"
    ,"Station":"皋兰"
    },
  "52885": {
     "Region":"甘肃"
    ,"Station":"永登"
    },
  "52889": {
     "Region":"甘肃"
    ,"Station":"兰州"
    },
  "52895": {
     "Region":"甘肃"
    ,"Station":"靖远"
    },
  "52896": {
     "Region":"甘肃"
    ,"Station":"白银"
    },
  "52978": {
     "Region":"甘肃"
    ,"Station":"夏河"
    },
  "52980": {
     "Region":"甘肃"
    ,"Station":"永靖"
    },
  "52981": {
     "Region":"甘肃"
    ,"Station":"东乡"
    },
  "52982": {
     "Region":"甘肃"
    ,"Station":"广河"
    },
  "52983": {
     "Region":"甘肃"
    ,"Station":"榆中"
    },
  "52984": {
     "Region":"甘肃"
    ,"Station":"临夏"
    },
  "52985": {
     "Region":"甘肃"
    ,"Station":"和政"
    },
  "52986": {
     "Region":"甘肃"
    ,"Station":"临洮"
    },
  "52988": {
     "Region":"甘肃"
    ,"Station":"康乐"
    },
  "52993": {
     "Region":"甘肃"
    ,"Station":"会宁"
    },
  "52995": {
     "Region":"甘肃"
    ,"Station":"安定"
    },
  "52996": {
     "Region":"甘肃"
    ,"Station":"华家岭"
    },
  "52998": {
     "Region":"甘肃"
    ,"Station":"渭源"
    },
  "53821": {
     "Region":"甘肃"
    ,"Station":"环县"
    },
  "53829": {
     "Region":"甘肃"
    ,"Station":"庆城"
    },
  "53906": {
     "Region":"甘肃"
    ,"Station":"静宁"
    },
  "53908": {
     "Region":"甘肃"
    ,"Station":"通渭"
    },
  "53915": {
     "Region":"甘肃"
    ,"Station":"崆峒"
    },
  "53917": {
     "Region":"甘肃"
    ,"Station":"庄浪"
    },
  "53923": {
     "Region":"甘肃"
    ,"Station":"西峰"
    },
  "53924": {
     "Region":"甘肃"
    ,"Station":"灵台"
    },
  "53925": {
     "Region":"甘肃"
    ,"Station":"镇原"
    },
  "53926": {
     "Region":"甘肃"
    ,"Station":"泾川"
    },
  "53927": {
     "Region":"甘肃"
    ,"Station":"华亭"
    },
  "53928": {
     "Region":"甘肃"
    ,"Station":"崇信"
    },
  "53930": {
     "Region":"甘肃"
    ,"Station":"华池"
    },
  "53934": {
     "Region":"甘肃"
    ,"Station":"合水"
    },
  "53935": {
     "Region":"甘肃"
    ,"Station":"正宁"
    },
  "53937": {
     "Region":"甘肃"
    ,"Station":"宁县"
    },
  "56071": {
     "Region":"甘肃"
    ,"Station":"碌曲"
    },
  "56074": {
     "Region":"甘肃"
    ,"Station":"玛曲"
    },
  "56080": {
     "Region":"甘肃"
    ,"Station":"合作"
    },
  "56081": {
     "Region":"甘肃"
    ,"Station":"临潭"
    },
  "56082": {
     "Region":"甘肃"
    ,"Station":"卓尼"
    },
  "56084": {
     "Region":"甘肃"
    ,"Station":"迭部"
    },
  "56091": {
     "Region":"甘肃"
    ,"Station":"漳县"
    },
  "56092": {
     "Region":"甘肃"
    ,"Station":"陇西"
    },
  "56093": {
     "Region":"甘肃"
    ,"Station":"岷县"
    },
  "56094": {
     "Region":"甘肃"
    ,"Station":"舟曲"
    },
  "56095": {
     "Region":"甘肃"
    ,"Station":"宕昌"
    },
  "56096": {
     "Region":"甘肃"
    ,"Station":"武都"
    },
  "56192": {
     "Region":"甘肃"
    ,"Station":"文县"
    },
  "57001": {
     "Region":"甘肃"
    ,"Station":"甘谷"
    },
  "57002": {
     "Region":"甘肃"
    ,"Station":"秦安"
    },
  "57004": {
     "Region":"甘肃"
    ,"Station":"武山"
    },
  "57006": {
     "Region":"甘肃"
    ,"Station":"天水"
    },
  "57007": {
     "Region":"甘肃"
    ,"Station":"礼县"
    },
  "57008": {
     "Region":"甘肃"
    ,"Station":"西和"
    },
  "57011": {
     "Region":"甘肃"
    ,"Station":"清水"
    },
  "57012": {
     "Region":"甘肃"
    ,"Station":"张家川"
    },
  "57014": {
     "Region":"甘肃"
    ,"Station":"麦积"
    },
  "57102": {
     "Region":"甘肃"
    ,"Station":"成县"
    },
  "57105": {
     "Region":"甘肃"
    ,"Station":"康县"
    },
  "57110": {
     "Region":"甘肃"
    ,"Station":"徽县"
    },
  "57111": {
     "Region":"甘肃"
    ,"Station":"两当"
    },
  "57988": {
     "Region":"广东"
    ,"Station":"乐昌"
    },
  "57989": {
     "Region":"广东"
    ,"Station":"仁化"
    },
  "57996": {
     "Region":"广东"
    ,"Station":"南雄"
    },
  "59071": {
     "Region":"广东"
    ,"Station":"连南"
    },
  "59072": {
     "Region":"广东"
    ,"Station":"连州"
    },
  "59074": {
     "Region":"广东"
    ,"Station":"连山"
    },
  "59075": {
     "Region":"广东"
    ,"Station":"阳山"
    },
  "59081": {
     "Region":"广东"
    ,"Station":"乳源"
    },
  "59082": {
     "Region":"广东"
    ,"Station":"韶关"
    },
  "59087": {
     "Region":"广东"
    ,"Station":"佛冈"
    },
  "59088": {
     "Region":"广东"
    ,"Station":"英德"
    },
  "59090": {
     "Region":"广东"
    ,"Station":"始兴"
    },
  "59094": {
     "Region":"广东"
    ,"Station":"翁源"
    },
  "59096": {
     "Region":"广东"
    ,"Station":"连平"
    },
  "59097": {
     "Region":"广东"
    ,"Station":"新丰"
    },
  "59099": {
     "Region":"广东"
    ,"Station":"和平"
    },
  "59106": {
     "Region":"广东"
    ,"Station":"平远"
    },
  "59107": {
     "Region":"广东"
    ,"Station":"龙川县气象局"
    },
  "59109": {
     "Region":"广东"
    ,"Station":"兴宁"
    },
  "59114": {
     "Region":"广东"
    ,"Station":"蕉岭"
    },
  "59116": {
     "Region":"广东"
    ,"Station":"大埔"
    },
  "59117": {
     "Region":"广东"
    ,"Station":"梅县"
    },
  "59264": {
     "Region":"广东"
    ,"Station":"封开"
    },
  "59268": {
     "Region":"广东"
    ,"Station":"郁南"
    },
  "59269": {
     "Region":"广东"
    ,"Station":"德庆"
    },
  "59270": {
     "Region":"广东"
    ,"Station":"怀集"
    },
  "59271": {
     "Region":"广东"
    ,"Station":"广宁"
    },
  "59276": {
     "Region":"广东"
    ,"Station":"四会"
    },
  "59278": {
     "Region":"广东"
    ,"Station":"高要"
    },
  "59279": {
     "Region":"广东"
    ,"Station":"三水"
    },
  "59280": {
     "Region":"广东"
    ,"Station":"清远"
    },
  "59284": {
     "Region":"广东"
    ,"Station":"花都"
    },
  "59285": {
     "Region":"广东"
    ,"Station":"从化"
    },
  "59287": {
     "Region":"广东"
    ,"Station":"广州"
    },
  "59288": {
     "Region":"广东"
    ,"Station":"南海"
    },
  "59289": {
     "Region":"广东"
    ,"Station":"东莞"
    },
  "59290": {
     "Region":"广东"
    ,"Station":"龙门"
    },
  "59293": {
     "Region":"广东"
    ,"Station":"河源东源县回南天观测站"
    },
  "59294": {
     "Region":"广东"
    ,"Station":"增城"
    },
  "59297": {
     "Region":"广东"
    ,"Station":"博罗"
    },
  "59298": {
     "Region":"广东"
    ,"Station":"惠阳"
    },
  "59303": {
     "Region":"广东"
    ,"Station":"五华"
    },
  "59304": {
     "Region":"广东"
    ,"Station":"紫金"
    },
  "59306": {
     "Region":"广东"
    ,"Station":"揭西"
    },
  "59310": {
     "Region":"广东"
    ,"Station":"丰顺"
    },
  "59312": {
     "Region":"广东"
    ,"Station":"潮州"
    },
  "59313": {
     "Region":"广东"
    ,"Station":"饶平"
    },
  "59314": {
     "Region":"广东"
    ,"Station":"普宁"
    },
  "59315": {
     "Region":"广东"
    ,"Station":"揭阳"
    },
  "59316": {
     "Region":"广东"
    ,"Station":"汕头"
    },
  "59317": {
     "Region":"广东"
    ,"Station":"惠来"
    },
  "59318": {
     "Region":"广东"
    ,"Station":"潮阳"
    },
  "59319": {
     "Region":"广东"
    ,"Station":"澄海"
    },
  "59324": {
     "Region":"广东"
    ,"Station":"南澳"
    },
  "59456": {
     "Region":"广东"
    ,"Station":"信宜"
    },
  "59462": {
     "Region":"广东"
    ,"Station":"罗定"
    },
  "59469": {
     "Region":"广东"
    ,"Station":"阳春"
    },
  "59470": {
     "Region":"广东"
    ,"Station":"新兴"
    },
  "59471": {
     "Region":"广东"
    ,"Station":"云浮"
    },
  "59473": {
     "Region":"广东"
    ,"Station":"鹤山"
    },
  "59475": {
     "Region":"广东"
    ,"Station":"开平"
    },
  "59476": {
     "Region":"广东"
    ,"Station":"新会"
    },
  "59477": {
     "Region":"广东"
    ,"Station":"恩平"
    },
  "59478": {
     "Region":"广东"
    ,"Station":"台山"
    },
  "59480": {
     "Region":"广东"
    ,"Station":"顺德"
    },
  "59481": {
     "Region":"广东"
    ,"Station":"番禺"
    },
  "59485": {
     "Region":"广东"
    ,"Station":"中山"
    },
  "59487": {
     "Region":"广东"
    ,"Station":"斗门"
    },
  "59488": {
     "Region":"广东"
    ,"Station":"珠海"
    },
  "59492": {
     "Region":"广东"
    ,"Station":"惠东"
    },
  "59493": {
     "Region":"广东"
    ,"Station":"深圳"
    },
  "59500": {
     "Region":"广东"
    ,"Station":"海丰"
    },
  "59501": {
     "Region":"广东"
    ,"Station":"汕尾"
    },
  "59502": {
     "Region":"广东"
    ,"Station":"陆丰"
    },
  "59650": {
     "Region":"广东"
    ,"Station":"遂溪"
    },
  "59653": {
     "Region":"广东"
    ,"Station":"高州"
    },
  "59654": {
     "Region":"广东"
    ,"Station":"廉江"
    },
  "59655": {
     "Region":"广东"
    ,"Station":"化州"
    },
  "59656": {
     "Region":"广东"
    ,"Station":"吴川"
    },
  "59658": {
     "Region":"广东"
    ,"Station":"湛江"
    },
  "59659": {
     "Region":"广东"
    ,"Station":"茂名"
    },
  "59663": {
     "Region":"广东"
    ,"Station":"阳江"
    },
  "59664": {
     "Region":"广东"
    ,"Station":"电白"
    },
  "59673": {
     "Region":"广东"
    ,"Station":"上川岛"
    },
  "59750": {
     "Region":"广东"
    ,"Station":"雷州"
    },
  "59754": {
     "Region":"广东"
    ,"Station":"徐闻"
    },
  "57859": {
     "Region":"广西"
    ,"Station":"资源"
    },
  "57927": {
     "Region":"广西"
    ,"Station":"天峨"
    },
  "57941": {
     "Region":"广西"
    ,"Station":"三江"
    },
  "57942": {
     "Region":"广西"
    ,"Station":"龙胜"
    },
  "57947": {
     "Region":"广西"
    ,"Station":"融安"
    },
  "57948": {
     "Region":"广西"
    ,"Station":"融水"
    },
  "57949": {
     "Region":"广西"
    ,"Station":"永福"
    },
  "57954": {
     "Region":"广西"
    ,"Station":"临桂"
    },
  "57955": {
     "Region":"广西"
    ,"Station":"兴安"
    },
  "57956": {
     "Region":"广西"
    ,"Station":"灵川"
    },
  "57957": {
     "Region":"广西"
    ,"Station":"桂林"
    },
  "57958": {
     "Region":"广西"
    ,"Station":"雁山"
    },
  "57960": {
     "Region":"广西"
    ,"Station":"全州"
    },
  "57964": {
     "Region":"广西"
    ,"Station":"灌阳"
    },
  "59001": {
     "Region":"广西"
    ,"Station":"隆林"
    },
  "59004": {
     "Region":"广西"
    ,"Station":"西林"
    },
  "59012": {
     "Region":"广西"
    ,"Station":"乐业"
    },
  "59015": {
     "Region":"广西"
    ,"Station":"凌云"
    },
  "59017": {
     "Region":"广西"
    ,"Station":"田林"
    },
  "59021": {
     "Region":"广西"
    ,"Station":"凤山"
    },
  "59022": {
     "Region":"广西"
    ,"Station":"南丹"
    },
  "59023": {
     "Region":"广西"
    ,"Station":"河池"
    },
  "59025": {
     "Region":"广西"
    ,"Station":"东兰"
    },
  "59027": {
     "Region":"广西"
    ,"Station":"巴马"
    },
  "59031": {
     "Region":"广西"
    ,"Station":"环江"
    },
  "59033": {
     "Region":"广西"
    ,"Station":"罗城"
    },
  "59034": {
     "Region":"广西"
    ,"Station":"宜州"
    },
  "59037": {
     "Region":"广西"
    ,"Station":"都安"
    },
  "59038": {
     "Region":"广西"
    ,"Station":"忻城"
    },
  "59041": {
     "Region":"广西"
    ,"Station":"柳城"
    },
  "59044": {
     "Region":"广西"
    ,"Station":"沙塘"
    },
  "59045": {
     "Region":"广西"
    ,"Station":"鹿寨"
    },
  "59046": {
     "Region":"广西"
    ,"Station":"柳州"
    },
  "59047": {
     "Region":"广西"
    ,"Station":"柳江"
    },
  "59051": {
     "Region":"广西"
    ,"Station":"阳朔"
    },
  "59052": {
     "Region":"广西"
    ,"Station":"恭城"
    },
  "59053": {
     "Region":"广西"
    ,"Station":"平乐"
    },
  "59055": {
     "Region":"广西"
    ,"Station":"荔浦"
    },
  "59057": {
     "Region":"广西"
    ,"Station":"金秀"
    },
  "59058": {
     "Region":"广西"
    ,"Station":"蒙山"
    },
  "59059": {
     "Region":"广西"
    ,"Station":"昭平"
    },
  "59061": {
     "Region":"广西"
    ,"Station":"富川"
    },
  "59064": {
     "Region":"广西"
    ,"Station":"钟山"
    },
  "59065": {
     "Region":"广西"
    ,"Station":"贺州"
    },
  "59209": {
     "Region":"广西"
    ,"Station":"那坡"
    },
  "59211": {
     "Region":"广西"
    ,"Station":"百色"
    },
  "59213": {
     "Region":"广西"
    ,"Station":"田阳"
    },
  "59215": {
     "Region":"广西"
    ,"Station":"德保"
    },
  "59218": {
     "Region":"广西"
    ,"Station":"靖西"
    },
  "59224": {
     "Region":"广西"
    ,"Station":"田东"
    },
  "59227": {
     "Region":"广西"
    ,"Station":"天等"
    },
  "59228": {
     "Region":"广西"
    ,"Station":"平果"
    },
  "59229": {
     "Region":"广西"
    ,"Station":"隆安"
    },
  "59230": {
     "Region":"广西"
    ,"Station":"马山"
    },
  "59235": {
     "Region":"广西"
    ,"Station":"上林"
    },
  "59237": {
     "Region":"广西"
    ,"Station":"武鸣"
    },
  "59238": {
     "Region":"广西"
    ,"Station":"宾阳"
    },
  "59241": {
     "Region":"广西"
    ,"Station":"象州"
    },
  "59242": {
     "Region":"广西"
    ,"Station":"来宾"
    },
  "59246": {
     "Region":"广西"
    ,"Station":"武宣"
    },
  "59249": {
     "Region":"广西"
    ,"Station":"贵港"
    },
  "59254": {
     "Region":"广西"
    ,"Station":"桂平"
    },
  "59255": {
     "Region":"广西"
    ,"Station":"平南"
    },
  "59256": {
     "Region":"广西"
    ,"Station":"藤县"
    },
  "59265": {
     "Region":"广西"
    ,"Station":"梧州"
    },
  "59266": {
     "Region":"广西"
    ,"Station":"苍梧"
    },
  "59417": {
     "Region":"广西"
    ,"Station":"龙州"
    },
  "59419": {
     "Region":"广西"
    ,"Station":"凭祥"
    },
  "59421": {
     "Region":"广西"
    ,"Station":"大新"
    },
  "59425": {
     "Region":"广西"
    ,"Station":"崇左"
    },
  "59426": {
     "Region":"广西"
    ,"Station":"扶绥"
    },
  "59427": {
     "Region":"广西"
    ,"Station":"宁明"
    },
  "59429": {
     "Region":"广西"
    ,"Station":"上思"
    },
  "59431": {
     "Region":"广西"
    ,"Station":"南宁"
    },
  "59435": {
     "Region":"广西"
    ,"Station":"邕宁"
    },
  "59441": {
     "Region":"广西"
    ,"Station":"横县"
    },
  "59446": {
     "Region":"广西"
    ,"Station":"灵山"
    },
  "59448": {
     "Region":"广西"
    ,"Station":"浦北"
    },
  "59449": {
     "Region":"广西"
    ,"Station":"博白"
    },
  "59451": {
     "Region":"广西"
    ,"Station":"北流"
    },
  "59452": {
     "Region":"广西"
    ,"Station":"容县"
    },
  "59453": {
     "Region":"广西"
    ,"Station":"玉林"
    },
  "59454": {
     "Region":"广西"
    ,"Station":"岑溪"
    },
  "59457": {
     "Region":"广西"
    ,"Station":"陆川"
    },
  "59626": {
     "Region":"广西"
    ,"Station":"东兴"
    },
  "59631": {
     "Region":"广西"
    ,"Station":"防城"
    },
  "59632": {
     "Region":"广西"
    ,"Station":"钦州"
    },
  "59635": {
     "Region":"广西"
    ,"Station":"防城港"
    },
  "59640": {
     "Region":"广西"
    ,"Station":"合浦"
    },
  "59644": {
     "Region":"广西"
    ,"Station":"北海"
    },
  "59647": {
     "Region":"广西"
    ,"Station":"涠洲岛"
    },
  "56598": {
     "Region":"贵州"
    ,"Station":"赫章"
    },
  "56691": {
     "Region":"贵州"
    ,"Station":"威宁"
    },
  "56693": {
     "Region":"贵州"
    ,"Station":"水城"
    },
  "56792": {
     "Region":"贵州"
    ,"Station":"普安"
    },
  "56793": {
     "Region":"贵州"
    ,"Station":"盘县"
    },
  "57606": {
     "Region":"贵州"
    ,"Station":"桐梓"
    },
  "57609": {
     "Region":"贵州"
    ,"Station":"赤水"
    },
  "57614": {
     "Region":"贵州"
    ,"Station":"习水"
    },
  "57623": {
     "Region":"贵州"
    ,"Station":"道真"
    },
  "57625": {
     "Region":"贵州"
    ,"Station":"正安"
    },
  "57634": {
     "Region":"贵州"
    ,"Station":"务川"
    },
  "57636": {
     "Region":"贵州"
    ,"Station":"沿河"
    },
  "57637": {
     "Region":"贵州"
    ,"Station":"德江"
    },
  "57647": {
     "Region":"贵州"
    ,"Station":"松桃"
    },
  "57707": {
     "Region":"贵州"
    ,"Station":"毕节"
    },
  "57708": {
     "Region":"贵州"
    ,"Station":"大方"
    },
  "57710": {
     "Region":"贵州"
    ,"Station":"仁怀"
    },
  "57712": {
     "Region":"贵州"
    ,"Station":"汇川"
    },
  "57713": {
     "Region":"贵州"
    ,"Station":"遵义"
    },
  "57714": {
     "Region":"贵州"
    ,"Station":"金沙"
    },
  "57717": {
     "Region":"贵州"
    ,"Station":"遵义县"
    },
  "57718": {
     "Region":"贵州"
    ,"Station":"息烽"
    },
  "57719": {
     "Region":"贵州"
    ,"Station":"开阳"
    },
  "57720": {
     "Region":"贵州"
    ,"Station":"绥阳"
    },
  "57722": {
     "Region":"贵州"
    ,"Station":"湄潭"
    },
  "57723": {
     "Region":"贵州"
    ,"Station":"凤冈"
    },
  "57728": {
     "Region":"贵州"
    ,"Station":"瓮安"
    },
  "57729": {
     "Region":"贵州"
    ,"Station":"余庆"
    },
  "57731": {
     "Region":"贵州"
    ,"Station":"思南"
    },
  "57732": {
     "Region":"贵州"
    ,"Station":"印江"
    },
  "57734": {
     "Region":"贵州"
    ,"Station":"石阡"
    },
  "57735": {
     "Region":"贵州"
    ,"Station":"岑巩"
    },
  "57736": {
     "Region":"贵州"
    ,"Station":"江口"
    },
  "57737": {
     "Region":"贵州"
    ,"Station":"施秉"
    },
  "57738": {
     "Region":"贵州"
    ,"Station":"镇远"
    },
  "57739": {
     "Region":"贵州"
    ,"Station":"玉屏"
    },
  "57741": {
     "Region":"贵州"
    ,"Station":"铜仁"
    },
  "57742": {
     "Region":"贵州"
    ,"Station":"万山"
    },
  "57800": {
     "Region":"贵州"
    ,"Station":"纳雍"
    },
  "57803": {
     "Region":"贵州"
    ,"Station":"黔西"
    },
  "57805": {
     "Region":"贵州"
    ,"Station":"织金"
    },
  "57806": {
     "Region":"贵州"
    ,"Station":"安顺"
    },
  "57807": {
     "Region":"贵州"
    ,"Station":"六枝"
    },
  "57808": {
     "Region":"贵州"
    ,"Station":"普定"
    },
  "57809": {
     "Region":"贵州"
    ,"Station":"镇宁"
    },
  "57811": {
     "Region":"贵州"
    ,"Station":"修文"
    },
  "57813": {
     "Region":"贵州"
    ,"Station":"清镇"
    },
  "57814": {
     "Region":"贵州"
    ,"Station":"平坝"
    },
  "57816": {
     "Region":"贵州"
    ,"Station":"贵阳"
    },
  "57818": {
     "Region":"贵州"
    ,"Station":"长顺"
    },
  "57821": {
     "Region":"贵州"
    ,"Station":"福泉"
    },
  "57822": {
     "Region":"贵州"
    ,"Station":"黄平"
    },
  "57824": {
     "Region":"贵州"
    ,"Station":"贵定"
    },
  "57825": {
     "Region":"贵州"
    ,"Station":"凯里"
    },
  "57827": {
     "Region":"贵州"
    ,"Station":"都匀"
    },
  "57828": {
     "Region":"贵州"
    ,"Station":"麻江"
    },
  "57829": {
     "Region":"贵州"
    ,"Station":"丹寨"
    },
  "57832": {
     "Region":"贵州"
    ,"Station":"三穗"
    },
  "57834": {
     "Region":"贵州"
    ,"Station":"台江"
    },
  "57835": {
     "Region":"贵州"
    ,"Station":"剑河"
    },
  "57837": {
     "Region":"贵州"
    ,"Station":"雷山"
    },
  "57839": {
     "Region":"贵州"
    ,"Station":"黎平"
    },
  "57840": {
     "Region":"贵州"
    ,"Station":"天柱"
    },
  "57844": {
     "Region":"贵州"
    ,"Station":"锦屏"
    },
  "57900": {
     "Region":"贵州"
    ,"Station":"晴隆"
    },
  "57902": {
     "Region":"贵州"
    ,"Station":"兴仁"
    },
  "57903": {
     "Region":"贵州"
    ,"Station":"关岭"
    },
  "57905": {
     "Region":"贵州"
    ,"Station":"贞丰"
    },
  "57906": {
     "Region":"贵州"
    ,"Station":"望谟"
    },
  "57907": {
     "Region":"贵州"
    ,"Station":"兴义"
    },
  "57908": {
     "Region":"贵州"
    ,"Station":"安龙"
    },
  "57909": {
     "Region":"贵州"
    ,"Station":"册亨"
    },
  "57910": {
     "Region":"贵州"
    ,"Station":"紫云"
    },
  "57911": {
     "Region":"贵州"
    ,"Station":"白云"
    },
  "57912": {
     "Region":"贵州"
    ,"Station":"惠水"
    },
  "57913": {
     "Region":"贵州"
    ,"Station":"龙里"
    },
  "57914": {
     "Region":"贵州"
    ,"Station":"花溪"
    },
  "57915": {
     "Region":"贵州"
    ,"Station":"乌当"
    },
  "57916": {
     "Region":"贵州"
    ,"Station":"罗甸"
    },
  "57921": {
     "Region":"贵州"
    ,"Station":"平塘"
    },
  "57922": {
     "Region":"贵州"
    ,"Station":"独山"
    },
  "57923": {
     "Region":"贵州"
    ,"Station":"三都"
    },
  "57926": {
     "Region":"贵州"
    ,"Station":"荔波"
    },
  "57932": {
     "Region":"贵州"
    ,"Station":"榕江"
    },
  "57936": {
     "Region":"贵州"
    ,"Station":"从江"
    },
  "59757": {
     "Region":"海南"
    ,"Station":"琼山"
    },
  "59758": {
     "Region":"海南"
    ,"Station":"海口"
    },
  "59838": {
     "Region":"海南"
    ,"Station":"东方"
    },
  "59842": {
     "Region":"海南"
    ,"Station":"临高"
    },
  "59843": {
     "Region":"海南"
    ,"Station":"澄迈"
    },
  "59845": {
     "Region":"海南"
    ,"Station":"儋州"
    },
  "59847": {
     "Region":"海南"
    ,"Station":"昌江"
    },
  "59848": {
     "Region":"海南"
    ,"Station":"白沙"
    },
  "59849": {
     "Region":"海南"
    ,"Station":"琼中"
    },
  "59851": {
     "Region":"海南"
    ,"Station":"定安"
    },
  "59854": {
     "Region":"海南"
    ,"Station":"屯昌"
    },
  "59855": {
     "Region":"海南"
    ,"Station":"琼海"
    },
  "59856": {
     "Region":"海南"
    ,"Station":"文昌"
    },
  "59940": {
     "Region":"海南"
    ,"Station":"乐东"
    },
  "59941": {
     "Region":"海南"
    ,"Station":"五指山"
    },
  "59945": {
     "Region":"海南"
    ,"Station":"保亭"
    },
  "59948": {
     "Region":"海南"
    ,"Station":"三亚"
    },
  "59951": {
     "Region":"海南"
    ,"Station":"万宁"
    },
  "59954": {
     "Region":"海南"
    ,"Station":"陵水"
    },
  "59981": {
     "Region":"海南"
    ,"Station":"西沙"
    },
  "59985": {
     "Region":"海南"
    ,"Station":"珊瑚"
    },
  "53392": {
     "Region":"河北"
    ,"Station":"康保"
    },
  "53397": {
     "Region":"河北"
    ,"Station":"尚义"
    },
  "53399": {
     "Region":"河北"
    ,"Station":"张北"
    },
  "53491": {
     "Region":"河北"
    ,"Station":"怀安"
    },
  "53492": {
     "Region":"河北"
    ,"Station":"阳原"
    },
  "53498": {
     "Region":"河北"
    ,"Station":"宣化"
    },
  "53499": {
     "Region":"河北"
    ,"Station":"万全"
    },
  "53593": {
     "Region":"河北"
    ,"Station":"蔚县"
    },
  "53596": {
     "Region":"河北"
    ,"Station":"顺平"
    },
  "53599": {
     "Region":"河北"
    ,"Station":"涞源"
    },
  "53680": {
     "Region":"河北"
    ,"Station":"灵寿"
    },
  "53682": {
     "Region":"河北"
    ,"Station":"曲阳"
    },
  "53688": {
     "Region":"河北"
    ,"Station":"行唐"
    },
  "53689": {
     "Region":"河北"
    ,"Station":"晋州"
    },
  "53690": {
     "Region":"河北"
    ,"Station":"阜平"
    },
  "53691": {
     "Region":"河北"
    ,"Station":"正定"
    },
  "53692": {
     "Region":"河北"
    ,"Station":"唐县"
    },
  "53693": {
     "Region":"河北"
    ,"Station":"井陉"
    },
  "53694": {
     "Region":"河北"
    ,"Station":"平山"
    },
  "53695": {
     "Region":"河北"
    ,"Station":"新乐"
    },
  "53696": {
     "Region":"河北"
    ,"Station":"定州"
    },
  "53697": {
     "Region":"河北"
    ,"Station":"藁城"
    },
  "53698": {
     "Region":"河北"
    ,"Station":"石家庄"
    },
  "53699": {
     "Region":"河北"
    ,"Station":"无极"
    },
  "53773": {
     "Region":"河北"
    ,"Station":"临漳"
    },
  "53781": {
     "Region":"河北"
    ,"Station":"沙河"
    },
  "53784": {
     "Region":"河北"
    ,"Station":"赵县"
    },
  "53785": {
     "Region":"河北"
    ,"Station":"柏乡"
    },
  "53789": {
     "Region":"河北"
    ,"Station":"栾城"
    },
  "53790": {
     "Region":"河北"
    ,"Station":"高邑"
    },
  "53791": {
     "Region":"河北"
    ,"Station":"元氏"
    },
  "53792": {
     "Region":"河北"
    ,"Station":"临城"
    },
  "53794": {
     "Region":"河北"
    ,"Station":"隆尧"
    },
  "53795": {
     "Region":"河北"
    ,"Station":"赞皇"
    },
  "53796": {
     "Region":"河北"
    ,"Station":"宁晋"
    },
  "53797": {
     "Region":"河北"
    ,"Station":"内邱"
    },
  "53798": {
     "Region":"河北"
    ,"Station":"邢台"
    },
  "53799": {
     "Region":"河北"
    ,"Station":"巨鹿"
    },
  "53883": {
     "Region":"河北"
    ,"Station":"任县"
    },
  "53886": {
     "Region":"河北"
    ,"Station":"涉县"
    },
  "53890": {
     "Region":"河北"
    ,"Station":"武安"
    },
  "53891": {
     "Region":"河北"
    ,"Station":"南和"
    },
  "53892": {
     "Region":"河北"
    ,"Station":"邯郸"
    },
  "53893": {
     "Region":"河北"
    ,"Station":"曲周"
    },
  "53894": {
     "Region":"河北"
    ,"Station":"峰峰"
    },
  "53895": {
     "Region":"河北"
    ,"Station":"永年"
    },
  "53896": {
     "Region":"河北"
    ,"Station":"魏县"
    },
  "53897": {
     "Region":"河北"
    ,"Station":"磁县"
    },
  "53899": {
     "Region":"河北"
    ,"Station":"广平"
    },
  "53980": {
     "Region":"河北"
    ,"Station":"肥乡"
    },
  "53996": {
     "Region":"河北"
    ,"Station":"成安"
    },
  "54301": {
     "Region":"河北"
    ,"Station":"沽源"
    },
  "54304": {
     "Region":"河北"
    ,"Station":"崇礼"
    },
  "54308": {
     "Region":"河北"
    ,"Station":"丰宁"
    },
  "54311": {
     "Region":"河北"
    ,"Station":"围场"
    },
  "54318": {
     "Region":"河北"
    ,"Station":"隆化"
    },
  "54319": {
     "Region":"河北"
    ,"Station":"平泉"
    },
  "54401": {
     "Region":"河北"
    ,"Station":"张家口"
    },
  "54404": {
     "Region":"河北"
    ,"Station":"赤城"
    },
  "54405": {
     "Region":"河北"
    ,"Station":"怀来"
    },
  "54408": {
     "Region":"河北"
    ,"Station":"涿鹿"
    },
  "54420": {
     "Region":"河北"
    ,"Station":"滦平"
    },
  "54423": {
     "Region":"河北"
    ,"Station":"承德"
    },
  "54425": {
     "Region":"河北"
    ,"Station":"兴隆"
    },
  "54429": {
     "Region":"河北"
    ,"Station":"遵化"
    },
  "54430": {
     "Region":"河北"
    ,"Station":"承德县"
    },
  "54432": {
     "Region":"河北"
    ,"Station":"宽城"
    },
  "54434": {
     "Region":"河北"
    ,"Station":"迁西"
    },
  "54436": {
     "Region":"河北"
    ,"Station":"青龙"
    },
  "54437": {
     "Region":"河北"
    ,"Station":"滦南"
    },
  "54438": {
     "Region":"河北"
    ,"Station":"卢龙"
    },
  "54439": {
     "Region":"河北"
    ,"Station":"迁安"
    },
  "54449": {
     "Region":"河北"
    ,"Station":"秦皇岛"
    },
  "54502": {
     "Region":"河北"
    ,"Station":"涿州"
    },
  "54503": {
     "Region":"河北"
    ,"Station":"容城"
    },
  "54506": {
     "Region":"河北"
    ,"Station":"高碑店"
    },
  "54507": {
     "Region":"河北"
    ,"Station":"易县"
    },
  "54510": {
     "Region":"河北"
    ,"Station":"大厂"
    },
  "54512": {
     "Region":"河北"
    ,"Station":"固安"
    },
  "54515": {
     "Region":"河北"
    ,"Station":"廊坊"
    },
  "54518": {
     "Region":"河北"
    ,"Station":"霸州"
    },
  "54519": {
     "Region":"河北"
    ,"Station":"永清"
    },
  "54520": {
     "Region":"河北"
    ,"Station":"三河"
    },
  "54521": {
     "Region":"河北"
    ,"Station":"香河"
    },
  "54522": {
     "Region":"河北"
    ,"Station":"玉田"
    },
  "54531": {
     "Region":"河北"
    ,"Station":"滦县"
    },
  "54532": {
     "Region":"河北"
    ,"Station":"丰润"
    },
  "54533": {
     "Region":"河北"
    ,"Station":"丰南"
    },
  "54534": {
     "Region":"河北"
    ,"Station":"唐山"
    },
  "54535": {
     "Region":"河北"
    ,"Station":"唐海"
    },
  "54539": {
     "Region":"河北"
    ,"Station":"乐亭"
    },
  "54540": {
     "Region":"河北"
    ,"Station":"昌黎"
    },
  "54541": {
     "Region":"河北"
    ,"Station":"抚宁"
    },
  "54601": {
     "Region":"河北"
    ,"Station":"徐水"
    },
  "54602": {
     "Region":"河北"
    ,"Station":"保定"
    },
  "54603": {
     "Region":"河北"
    ,"Station":"高阳"
    },
  "54604": {
     "Region":"河北"
    ,"Station":"安国"
    },
  "54605": {
     "Region":"河北"
    ,"Station":"安新"
    },
  "54606": {
     "Region":"河北"
    ,"Station":"饶阳"
    },
  "54607": {
     "Region":"河北"
    ,"Station":"望都"
    },
  "54608": {
     "Region":"河北"
    ,"Station":"深州"
    },
  "54609": {
     "Region":"河北"
    ,"Station":"安平"
    },
  "54610": {
     "Region":"河北"
    ,"Station":"任丘"
    },
  "54611": {
     "Region":"河北"
    ,"Station":"满城"
    },
  "54612": {
     "Region":"河北"
    ,"Station":"文安"
    },
  "54613": {
     "Region":"河北"
    ,"Station":"大城"
    },
  "54614": {
     "Region":"河北"
    ,"Station":"河间"
    },
  "54615": {
     "Region":"河北"
    ,"Station":"青县"
    },
  "54616": {
     "Region":"河北"
    ,"Station":"沧州"
    },
  "54617": {
     "Region":"河北"
    ,"Station":"献县"
    },
  "54618": {
     "Region":"河北"
    ,"Station":"泊头"
    },
  "54620": {
     "Region":"河北"
    ,"Station":"蠡县"
    },
  "54621": {
     "Region":"河北"
    ,"Station":"深泽"
    },
  "54624": {
     "Region":"河北"
    ,"Station":"黄骅"
    },
  "54626": {
     "Region":"河北"
    ,"Station":"肃宁"
    },
  "54627": {
     "Region":"河北"
    ,"Station":"盐山"
    },
  "54628": {
     "Region":"河北"
    ,"Station":"海兴"
    },
  "54631": {
     "Region":"河北"
    ,"Station":"广宗"
    },
  "54632": {
     "Region":"河北"
    ,"Station":"平乡"
    },
  "54633": {
     "Region":"河北"
    ,"Station":"新河"
    },
  "54636": {
     "Region":"河北"
    ,"Station":"雄县"
    },
  "54640": {
     "Region":"河北"
    ,"Station":"鸡泽"
    },
  "54644": {
     "Region":"河北"
    ,"Station":"孟村"
    },
  "54700": {
     "Region":"河北"
    ,"Station":"武强"
    },
  "54701": {
     "Region":"河北"
    ,"Station":"辛集"
    },
  "54702": {
     "Region":"河北"
    ,"Station":"衡水"
    },
  "54703": {
     "Region":"河北"
    ,"Station":"武邑"
    },
  "54704": {
     "Region":"河北"
    ,"Station":"冀州"
    },
  "54705": {
     "Region":"河北"
    ,"Station":"南宫"
    },
  "54706": {
     "Region":"河北"
    ,"Station":"清河"
    },
  "54707": {
     "Region":"河北"
    ,"Station":"故城"
    },
  "54708": {
     "Region":"河北"
    ,"Station":"枣强"
    },
  "54710": {
     "Region":"河北"
    ,"Station":"阜城"
    },
  "54711": {
     "Region":"河北"
    ,"Station":"景县"
    },
  "54713": {
     "Region":"河北"
    ,"Station":"东光"
    },
  "54717": {
     "Region":"河北"
    ,"Station":"吴桥"
    },
  "54719": {
     "Region":"河北"
    ,"Station":"南皮"
    },
  "54800": {
     "Region":"河北"
    ,"Station":"威县"
    },
  "54801": {
     "Region":"河北"
    ,"Station":"临西"
    },
  "54804": {
     "Region":"河北"
    ,"Station":"大名"
    },
  "54809": {
     "Region":"河北"
    ,"Station":"馆陶"
    },
  "54820": {
     "Region":"河北"
    ,"Station":"邱县"
    },
  "53889": {
     "Region":"河南 "
    ,"Station":"林州"
    },
  "53898": {
     "Region":"河南 "
    ,"Station":"安阳"
    },
  "53972": {
     "Region":"河南 "
    ,"Station":"沁阳"
    },
  "53974": {
     "Region":"河南 "
    ,"Station":"淇县"
    },
  "53978": {
     "Region":"河南 "
    ,"Station":"济源"
    },
  "53979": {
     "Region":"河南 "
    ,"Station":"博爱"
    },
  "53982": {
     "Region":"河南 "
    ,"Station":"焦作"
    },
  "53983": {
     "Region":"河南 "
    ,"Station":"封丘"
    },
  "53984": {
     "Region":"河南 "
    ,"Station":"修武"
    },
  "53985": {
     "Region":"河南 "
    ,"Station":"辉县"
    },
  "53986": {
     "Region":"河南 "
    ,"Station":"新乡"
    },
  "53987": {
     "Region":"河南 "
    ,"Station":"武陟"
    },
  "53988": {
     "Region":"河南 "
    ,"Station":"获嘉"
    },
  "53989": {
     "Region":"河南 "
    ,"Station":"原阳"
    },
  "53990": {
     "Region":"河南 "
    ,"Station":"鹤壁"
    },
  "53991": {
     "Region":"河南 "
    ,"Station":"汤阴"
    },
  "53992": {
     "Region":"河南 "
    ,"Station":"浚县"
    },
  "53993": {
     "Region":"河南 "
    ,"Station":"内黄"
    },
  "53994": {
     "Region":"河南 "
    ,"Station":"卫辉"
    },
  "53995": {
     "Region":"河南 "
    ,"Station":"滑县"
    },
  "53997": {
     "Region":"河南 "
    ,"Station":"延津"
    },
  "53998": {
     "Region":"河南 "
    ,"Station":"长垣"
    },
  "54817": {
     "Region":"河南 "
    ,"Station":"台前"
    },
  "54900": {
     "Region":"河南 "
    ,"Station":"濮阳"
    },
  "54901": {
     "Region":"河南 "
    ,"Station":"南乐"
    },
  "54902": {
     "Region":"河南 "
    ,"Station":"清丰"
    },
  "54903": {
     "Region":"河南 "
    ,"Station":"范县"
    },
  "57051": {
     "Region":"河南 "
    ,"Station":"三门峡"
    },
  "57056": {
     "Region":"河南 "
    ,"Station":"灵宝"
    },
  "57063": {
     "Region":"河南 "
    ,"Station":"渑池"
    },
  "57065": {
     "Region":"河南 "
    ,"Station":"宜阳"
    },
  "57066": {
     "Region":"河南 "
    ,"Station":"洛宁"
    },
  "57067": {
     "Region":"河南 "
    ,"Station":"卢氏"
    },
  "57070": {
     "Region":"河南 "
    ,"Station":"新安"
    },
  "57071": {
     "Region":"河南 "
    ,"Station":"孟津"
    },
  "57072": {
     "Region":"河南 "
    ,"Station":"孟州"
    },
  "57074": {
     "Region":"河南 "
    ,"Station":"伊川"
    },
  "57075": {
     "Region":"河南 "
    ,"Station":"汝州"
    },
  "57076": {
     "Region":"河南 "
    ,"Station":"偃师"
    },
  "57077": {
     "Region":"河南 "
    ,"Station":"栾川"
    },
  "57078": {
     "Region":"河南 "
    ,"Station":"汝阳"
    },
  "57079": {
     "Region":"河南 "
    ,"Station":"温县"
    },
  "57080": {
     "Region":"河南 "
    ,"Station":"巩义"
    },
  "57081": {
     "Region":"河南 "
    ,"Station":"荥阳"
    },
  "57082": {
     "Region":"河南 "
    ,"Station":"登封"
    },
  "57083": {
     "Region":"河南 "
    ,"Station":"郑州"
    },
  "57084": {
     "Region":"河南 "
    ,"Station":"嵩山"
    },
  "57085": {
     "Region":"河南 "
    ,"Station":"新密"
    },
  "57086": {
     "Region":"河南 "
    ,"Station":"新郑"
    },
  "57087": {
     "Region":"河南 "
    ,"Station":"长葛"
    },
  "57088": {
     "Region":"河南 "
    ,"Station":"禹州"
    },
  "57089": {
     "Region":"河南 "
    ,"Station":"许昌"
    },
  "57090": {
     "Region":"河南 "
    ,"Station":"中牟"
    },
  "57091": {
     "Region":"河南 "
    ,"Station":"开封"
    },
  "57093": {
     "Region":"河南 "
    ,"Station":"兰考"
    },
  "57094": {
     "Region":"河南 "
    ,"Station":"尉氏"
    },
  "57095": {
     "Region":"河南 "
    ,"Station":"鄢陵"
    },
  "57096": {
     "Region":"河南 "
    ,"Station":"杞县"
    },
  "57098": {
     "Region":"河南 "
    ,"Station":"扶沟"
    },
  "57099": {
     "Region":"河南 "
    ,"Station":"太康"
    },
  "57156": {
     "Region":"河南 "
    ,"Station":"西峡"
    },
  "57162": {
     "Region":"河南 "
    ,"Station":"嵩县"
    },
  "57169": {
     "Region":"河南 "
    ,"Station":"内乡"
    },
  "57171": {
     "Region":"河南 "
    ,"Station":"平顶山"
    },
  "57173": {
     "Region":"河南 "
    ,"Station":"鲁山"
    },
  "57175": {
     "Region":"河南 "
    ,"Station":"镇平"
    },
  "57176": {
     "Region":"河南 "
    ,"Station":"南召"
    },
  "57177": {
     "Region":"河南 "
    ,"Station":"舞钢"
    },
  "57178": {
     "Region":"河南 "
    ,"Station":"南阳"
    },
  "57179": {
     "Region":"河南 "
    ,"Station":"方城"
    },
  "57180": {
     "Region":"河南 "
    ,"Station":"郏县"
    },
  "57181": {
     "Region":"河南 "
    ,"Station":"宝丰"
    },
  "57182": {
     "Region":"河南 "
    ,"Station":"襄城"
    },
  "57183": {
     "Region":"河南 "
    ,"Station":"临颍"
    },
  "57184": {
     "Region":"河南 "
    ,"Station":"叶县"
    },
  "57185": {
     "Region":"河南 "
    ,"Station":"舞阳"
    },
  "57186": {
     "Region":"河南 "
    ,"Station":"漯河"
    },
  "57187": {
     "Region":"河南 "
    ,"Station":"社旗"
    },
  "57188": {
     "Region":"河南 "
    ,"Station":"西平"
    },
  "57189": {
     "Region":"河南 "
    ,"Station":"遂平"
    },
  "57190": {
     "Region":"河南 "
    ,"Station":"黄泛区农试站"
    },
  "57191": {
     "Region":"河南 "
    ,"Station":"通许"
    },
  "57192": {
     "Region":"河南 "
    ,"Station":"淮阳"
    },
  "57193": {
     "Region":"河南 "
    ,"Station":"西华"
    },
  "57194": {
     "Region":"河南 "
    ,"Station":"上蔡"
    },
  "57195": {
     "Region":"河南 "
    ,"Station":"川汇区"
    },
  "57196": {
     "Region":"河南 "
    ,"Station":"项城"
    },
  "57197": {
     "Region":"河南 "
    ,"Station":"汝南"
    },
  "57198": {
     "Region":"河南 "
    ,"Station":"商水"
    },
  "57261": {
     "Region":"河南 "
    ,"Station":"淅川"
    },
  "57271": {
     "Region":"河南 "
    ,"Station":"新野"
    },
  "57273": {
     "Region":"河南 "
    ,"Station":"唐河"
    },
  "57274": {
     "Region":"河南 "
    ,"Station":"邓州"
    },
  "57281": {
     "Region":"河南 "
    ,"Station":"泌阳"
    },
  "57285": {
     "Region":"河南 "
    ,"Station":"桐柏"
    },
  "57290": {
     "Region":"河南 "
    ,"Station":"驻马店"
    },
  "57292": {
     "Region":"河南 "
    ,"Station":"平舆"
    },
  "57293": {
     "Region":"河南 "
    ,"Station":"新蔡"
    },
  "57294": {
     "Region":"河南 "
    ,"Station":"确山"
    },
  "57295": {
     "Region":"河南 "
    ,"Station":"正阳"
    },
  "57296": {
     "Region":"河南 "
    ,"Station":"息县"
    },
  "57297": {
     "Region":"河南 "
    ,"Station":"信阳"
    },
  "57298": {
     "Region":"河南 "
    ,"Station":"罗山"
    },
  "57299": {
     "Region":"河南 "
    ,"Station":"光山"
    },
  "57390": {
     "Region":"河南 "
    ,"Station":"鸡公山"
    },
  "57396": {
     "Region":"河南 "
    ,"Station":"新县"
    },
  "58001": {
     "Region":"河南 "
    ,"Station":"睢县"
    },
  "58004": {
     "Region":"河南 "
    ,"Station":"民权"
    },
  "58005": {
     "Region":"河南 "
    ,"Station":"商丘"
    },
  "58006": {
     "Region":"河南 "
    ,"Station":"虞城"
    },
  "58007": {
     "Region":"河南 "
    ,"Station":"柘城"
    },
  "58008": {
     "Region":"河南 "
    ,"Station":"宁陵"
    },
  "58017": {
     "Region":"河南 "
    ,"Station":"夏邑"
    },
  "58100": {
     "Region":"河南 "
    ,"Station":"郸城"
    },
  "58101": {
     "Region":"河南 "
    ,"Station":"鹿邑"
    },
  "58104": {
     "Region":"河南 "
    ,"Station":"沈丘"
    },
  "58111": {
     "Region":"河南 "
    ,"Station":"永城"
    },
  "58205": {
     "Region":"河南 "
    ,"Station":"淮滨"
    },
  "58207": {
     "Region":"河南 "
    ,"Station":"潢川"
    },
  "58208": {
     "Region":"河南 "
    ,"Station":"固始"
    },
  "58301": {
     "Region":"河南 "
    ,"Station":"商城"
    },
  "50136": {
     "Region":"黑龙江"
    ,"Station":"漠河"
    },
  "50137": {
     "Region":"黑龙江"
    ,"Station":"北极村"
    },
  "50246": {
     "Region":"黑龙江"
    ,"Station":"塔河"
    },
  "50247": {
     "Region":"黑龙江"
    ,"Station":"呼中"
    },
  "50349": {
     "Region":"黑龙江"
    ,"Station":"新林"
    },
  "50353": {
     "Region":"黑龙江"
    ,"Station":"呼玛"
    },
  "50442": {
     "Region":"黑龙江"
    ,"Station":"加格达奇"
    },
  "50468": {
     "Region":"黑龙江"
    ,"Station":"爱辉"
    },
  "50557": {
     "Region":"黑龙江"
    ,"Station":"嫩江"
    },
  "50564": {
     "Region":"黑龙江"
    ,"Station":"孙吴"
    },
  "50566": {
     "Region":"黑龙江"
    ,"Station":"逊克"
    },
  "50646": {
     "Region":"黑龙江"
    ,"Station":"讷河"
    },
  "50655": {
     "Region":"黑龙江"
    ,"Station":"五大连池"
    },
  "50656": {
     "Region":"黑龙江"
    ,"Station":"北安"
    },
  "50658": {
     "Region":"黑龙江"
    ,"Station":"克山"
    },
  "50659": {
     "Region":"黑龙江"
    ,"Station":"克东"
    },
  "50673": {
     "Region":"黑龙江"
    ,"Station":"嘉荫"
    },
  "50674": {
     "Region":"黑龙江"
    ,"Station":"乌伊岭"
    },
  "50739": {
     "Region":"黑龙江"
    ,"Station":"龙江"
    },
  "50741": {
     "Region":"黑龙江"
    ,"Station":"甘南"
    },
  "50742": {
     "Region":"黑龙江"
    ,"Station":"富裕"
    },
  "50745": {
     "Region":"黑龙江"
    ,"Station":"齐齐哈尔"
    },
  "50749": {
     "Region":"黑龙江"
    ,"Station":"林甸"
    },
  "50750": {
     "Region":"黑龙江"
    ,"Station":"依安"
    },
  "50755": {
     "Region":"黑龙江"
    ,"Station":"拜泉"
    },
  "50756": {
     "Region":"黑龙江"
    ,"Station":"海伦"
    },
  "50758": {
     "Region":"黑龙江"
    ,"Station":"明水"
    },
  "50767": {
     "Region":"黑龙江"
    ,"Station":"绥棱"
    },
  "50772": {
     "Region":"黑龙江"
    ,"Station":"五营"
    },
  "50774": {
     "Region":"黑龙江"
    ,"Station":"伊春"
    },
  "50775": {
     "Region":"黑龙江"
    ,"Station":"鹤岗"
    },
  "50776": {
     "Region":"黑龙江"
    ,"Station":"萝北"
    },
  "50778": {
     "Region":"黑龙江"
    ,"Station":"同江"
    },
  "50779": {
     "Region":"黑龙江"
    ,"Station":"抚远"
    },
  "50787": {
     "Region":"黑龙江"
    ,"Station":"绥滨"
    },
  "50788": {
     "Region":"黑龙江"
    ,"Station":"富锦"
    },
  "50842": {
     "Region":"黑龙江"
    ,"Station":"杜蒙"
    },
  "50844": {
     "Region":"黑龙江"
    ,"Station":"泰来"
    },
  "50850": {
     "Region":"黑龙江"
    ,"Station":"大庆"
    },
  "50851": {
     "Region":"黑龙江"
    ,"Station":"青冈"
    },
  "50852": {
     "Region":"黑龙江"
    ,"Station":"望奎"
    },
  "50853": {
     "Region":"黑龙江"
    ,"Station":"北林"
    },
  "50854": {
     "Region":"黑龙江"
    ,"Station":"安达"
    },
  "50858": {
     "Region":"黑龙江"
    ,"Station":"肇东"
    },
  "50859": {
     "Region":"黑龙江"
    ,"Station":"兰西"
    },
  "50861": {
     "Region":"黑龙江"
    ,"Station":"庆安"
    },
  "50862": {
     "Region":"黑龙江"
    ,"Station":"铁力"
    },
  "50867": {
     "Region":"黑龙江"
    ,"Station":"巴彦"
    },
  "50871": {
     "Region":"黑龙江"
    ,"Station":"汤原"
    },
  "50873": {
     "Region":"黑龙江"
    ,"Station":"佳木斯"
    },
  "50877": {
     "Region":"黑龙江"
    ,"Station":"依兰"
    },
  "50878": {
     "Region":"黑龙江"
    ,"Station":"桦川"
    },
  "50879": {
     "Region":"黑龙江"
    ,"Station":"桦南"
    },
  "50880": {
     "Region":"黑龙江"
    ,"Station":"集贤"
    },
  "50884": {
     "Region":"黑龙江"
    ,"Station":"双鸭山"
    },
  "50888": {
     "Region":"黑龙江"
    ,"Station":"宝清"
    },
  "50892": {
     "Region":"黑龙江"
    ,"Station":"饶河"
    },
  "50950": {
     "Region":"黑龙江"
    ,"Station":"肇州"
    },
  "50953": {
     "Region":"黑龙江"
    ,"Station":"哈尔滨"
    },
  "50954": {
     "Region":"黑龙江"
    ,"Station":"肇源"
    },
  "50955": {
     "Region":"黑龙江"
    ,"Station":"双城"
    },
  "50956": {
     "Region":"黑龙江"
    ,"Station":"呼兰"
    },
  "50958": {
     "Region":"黑龙江"
    ,"Station":"阿城"
    },
  "50960": {
     "Region":"黑龙江"
    ,"Station":"宾县"
    },
  "50962": {
     "Region":"黑龙江"
    ,"Station":"木兰"
    },
  "50963": {
     "Region":"黑龙江"
    ,"Station":"通河"
    },
  "50964": {
     "Region":"黑龙江"
    ,"Station":"方正"
    },
  "50965": {
     "Region":"黑龙江"
    ,"Station":"延寿"
    },
  "50968": {
     "Region":"黑龙江"
    ,"Station":"尚志"
    },
  "50971": {
     "Region":"黑龙江"
    ,"Station":"七台河"
    },
  "50973": {
     "Region":"黑龙江"
    ,"Station":"勃利"
    },
  "50978": {
     "Region":"黑龙江"
    ,"Station":"鸡西"
    },
  "50979": {
     "Region":"黑龙江"
    ,"Station":"林口"
    },
  "50983": {
     "Region":"黑龙江"
    ,"Station":"虎林"
    },
  "50985": {
     "Region":"黑龙江"
    ,"Station":"密山"
    },
  "50987": {
     "Region":"黑龙江"
    ,"Station":"鸡东"
    },
  "54080": {
     "Region":"黑龙江"
    ,"Station":"五常"
    },
  "54092": {
     "Region":"黑龙江"
    ,"Station":"海林"
    },
  "54093": {
     "Region":"黑龙江"
    ,"Station":"穆棱"
    },
  "54094": {
     "Region":"黑龙江"
    ,"Station":"牡丹江"
    },
  "54096": {
     "Region":"黑龙江"
    ,"Station":"绥芬河"
    },
  "54098": {
     "Region":"黑龙江"
    ,"Station":"宁安"
    },
  "54099": {
     "Region":"黑龙江"
    ,"Station":"东宁"
    },
  "57249": {
     "Region":"湖北"
    ,"Station":"竹溪"
    },
  "57251": {
     "Region":"湖北"
    ,"Station":"郧西"
    },
  "57253": {
     "Region":"湖北"
    ,"Station":"郧县"
    },
  "57256": {
     "Region":"湖北"
    ,"Station":"十堰"
    },
  "57257": {
     "Region":"湖北"
    ,"Station":"竹山"
    },
  "57259": {
     "Region":"湖北"
    ,"Station":"房县"
    },
  "57260": {
     "Region":"湖北"
    ,"Station":"丹江口"
    },
  "57265": {
     "Region":"湖北"
    ,"Station":"老河口"
    },
  "57268": {
     "Region":"湖北"
    ,"Station":"谷城"
    },
  "57278": {
     "Region":"湖北"
    ,"Station":"襄樊"
    },
  "57279": {
     "Region":"湖北"
    ,"Station":"枣阳"
    },
  "57351": {
     "Region":"湖北"
    ,"Station":"坛子岭"
    },
  "57352": {
     "Region":"湖北"
    ,"Station":"三斗坪"
    },
  "57353": {
     "Region":"湖北"
    ,"Station":"苏家坳"
    },
  "57355": {
     "Region":"湖北"
    ,"Station":"巴东"
    },
  "57358": {
     "Region":"湖北"
    ,"Station":"秭归"
    },
  "57359": {
     "Region":"湖北"
    ,"Station":"兴山"
    },
  "57361": {
     "Region":"湖北"
    ,"Station":"保康"
    },
  "57362": {
     "Region":"湖北"
    ,"Station":"神农架"
    },
  "57363": {
     "Region":"湖北"
    ,"Station":"南漳"
    },
  "57368": {
     "Region":"湖北"
    ,"Station":"远安"
    },
  "57370": {
     "Region":"湖北"
    ,"Station":"宜城"
    },
  "57377": {
     "Region":"湖北"
    ,"Station":"荆门"
    },
  "57378": {
     "Region":"湖北"
    ,"Station":"钟祥"
    },
  "57381": {
     "Region":"湖北"
    ,"Station":"随州"
    },
  "57385": {
     "Region":"湖北"
    ,"Station":"广水"
    },
  "57386": {
     "Region":"湖北"
    ,"Station":"孝昌"
    },
  "57387": {
     "Region":"湖北"
    ,"Station":"京山"
    },
  "57388": {
     "Region":"湖北"
    ,"Station":"安陆"
    },
  "57389": {
     "Region":"湖北"
    ,"Station":"云梦"
    },
  "57395": {
     "Region":"湖北"
    ,"Station":"大悟"
    },
  "57398": {
     "Region":"湖北"
    ,"Station":"红安"
    },
  "57399": {
     "Region":"湖北"
    ,"Station":"麻城"
    },
  "57439": {
     "Region":"湖北"
    ,"Station":"利川"
    },
  "57445": {
     "Region":"湖北"
    ,"Station":"建始"
    },
  "57447": {
     "Region":"湖北"
    ,"Station":"恩施"
    },
  "57453": {
     "Region":"湖北"
    ,"Station":"夷陵区"
    },
  "57458": {
     "Region":"湖北"
    ,"Station":"五峰"
    },
  "57460": {
     "Region":"湖北"
    ,"Station":"当阳"
    },
  "57461": {
     "Region":"湖北"
    ,"Station":"宜昌"
    },
  "57462": {
     "Region":"湖北"
    ,"Station":"三峡"
    },
  "57464": {
     "Region":"湖北"
    ,"Station":"长阳"
    },
  "57465": {
     "Region":"湖北"
    ,"Station":"宜都"
    },
  "57466": {
     "Region":"湖北"
    ,"Station":"枝江"
    },
  "57469": {
     "Region":"湖北"
    ,"Station":"松滋"
    },
  "57475": {
     "Region":"湖北"
    ,"Station":"潜江"
    },
  "57476": {
     "Region":"湖北"
    ,"Station":"荆州"
    },
  "57477": {
     "Region":"湖北"
    ,"Station":"公安"
    },
  "57481": {
     "Region":"湖北"
    ,"Station":"应城"
    },
  "57482": {
     "Region":"湖北"
    ,"Station":"孝感"
    },
  "57483": {
     "Region":"湖北"
    ,"Station":"天门"
    },
  "57485": {
     "Region":"湖北"
    ,"Station":"仙桃"
    },
  "57486": {
     "Region":"湖北"
    ,"Station":"汉川"
    },
  "57489": {
     "Region":"湖北"
    ,"Station":"蔡甸"
    },
  "57491": {
     "Region":"湖北"
    ,"Station":"黄陂"
    },
  "57492": {
     "Region":"湖北"
    ,"Station":"新洲"
    },
  "57493": {
     "Region":"湖北"
    ,"Station":"江夏"
    },
  "57494": {
     "Region":"湖北"
    ,"Station":"武汉"
    },
  "57495": {
     "Region":"湖北"
    ,"Station":"团风"
    },
  "57496": {
     "Region":"湖北"
    ,"Station":"鄂州"
    },
  "57498": {
     "Region":"湖北"
    ,"Station":"黄冈"
    },
  "57499": {
     "Region":"湖北"
    ,"Station":"大冶"
    },
  "57540": {
     "Region":"湖北"
    ,"Station":"咸丰"
    },
  "57541": {
     "Region":"湖北"
    ,"Station":"宣恩"
    },
  "57543": {
     "Region":"湖北"
    ,"Station":"鹤峰"
    },
  "57545": {
     "Region":"湖北"
    ,"Station":"来凤"
    },
  "57571": {
     "Region":"湖北"
    ,"Station":"石首"
    },
  "57573": {
     "Region":"湖北"
    ,"Station":"监利"
    },
  "57581": {
     "Region":"湖北"
    ,"Station":"洪湖"
    },
  "57582": {
     "Region":"湖北"
    ,"Station":"赤壁"
    },
  "57583": {
     "Region":"湖北"
    ,"Station":"嘉鱼"
    },
  "57586": {
     "Region":"湖北"
    ,"Station":"崇阳"
    },
  "57589": {
     "Region":"湖北"
    ,"Station":"通城"
    },
  "57590": {
     "Region":"湖北"
    ,"Station":"咸宁"
    },
  "57595": {
     "Region":"湖北"
    ,"Station":"通山"
    },
  "57596": {
     "Region":"湖北"
    ,"Station":"金沙"
    },
  "58401": {
     "Region":"湖北"
    ,"Station":"罗田"
    },
  "58402": {
     "Region":"湖北"
    ,"Station":"英山"
    },
  "58404": {
     "Region":"湖北"
    ,"Station":"浠水"
    },
  "58407": {
     "Region":"湖北"
    ,"Station":"黄石"
    },
  "58408": {
     "Region":"湖北"
    ,"Station":"蕲春"
    },
  "58409": {
     "Region":"湖北"
    ,"Station":"黄梅"
    },
  "58500": {
     "Region":"湖北"
    ,"Station":"阳新"
    },
  "58501": {
     "Region":"湖北"
    ,"Station":"武穴"
    },
  "57544": {
     "Region":"湖南"
    ,"Station":"龙山"
    },
  "57554": {
     "Region":"湖南"
    ,"Station":"桑植"
    },
  "57558": {
     "Region":"湖南"
    ,"Station":"张家界"
    },
  "57562": {
     "Region":"湖南"
    ,"Station":"石门"
    },
  "57564": {
     "Region":"湖南"
    ,"Station":"慈利"
    },
  "57565": {
     "Region":"湖南"
    ,"Station":"澧县"
    },
  "57566": {
     "Region":"湖南"
    ,"Station":"临澧"
    },
  "57574": {
     "Region":"湖南"
    ,"Station":"南县"
    },
  "57575": {
     "Region":"湖南"
    ,"Station":"华容"
    },
  "57577": {
     "Region":"湖南"
    ,"Station":"安乡"
    },
  "57584": {
     "Region":"湖南"
    ,"Station":"岳阳"
    },
  "57585": {
     "Region":"湖南"
    ,"Station":"临湘"
    },
  "57640": {
     "Region":"湖南"
    ,"Station":"花垣"
    },
  "57642": {
     "Region":"湖南"
    ,"Station":"保靖"
    },
  "57643": {
     "Region":"湖南"
    ,"Station":"永顺"
    },
  "57646": {
     "Region":"湖南"
    ,"Station":"古丈"
    },
  "57649": {
     "Region":"湖南"
    ,"Station":"吉首"
    },
  "57655": {
     "Region":"湖南"
    ,"Station":"沅陵"
    },
  "57657": {
     "Region":"湖南"
    ,"Station":"泸溪"
    },
  "57658": {
     "Region":"湖南"
    ,"Station":"辰溪"
    },
  "57661": {
     "Region":"湖南"
    ,"Station":"桃源"
    },
  "57662": {
     "Region":"湖南"
    ,"Station":"常德"
    },
  "57663": {
     "Region":"湖南"
    ,"Station":"汉寿"
    },
  "57666": {
     "Region":"湖南"
    ,"Station":"桃江"
    },
  "57669": {
     "Region":"湖南"
    ,"Station":"安化"
    },
  "57671": {
     "Region":"湖南"
    ,"Station":"沅江"
    },
  "57673": {
     "Region":"湖南"
    ,"Station":"湘阴"
    },
  "57674": {
     "Region":"湖南"
    ,"Station":"赫山"
    },
  "57678": {
     "Region":"湖南"
    ,"Station":"宁乡"
    },
  "57679": {
     "Region":"湖南"
    ,"Station":"马坡岭"
    },
  "57680": {
     "Region":"湖南"
    ,"Station":"汨罗"
    },
  "57682": {
     "Region":"湖南"
    ,"Station":"平江"
    },
  "57687": {
     "Region":"湖南"
    ,"Station":"长沙"
    },
  "57688": {
     "Region":"湖南"
    ,"Station":"浏阳"
    },
  "57740": {
     "Region":"湖南"
    ,"Station":"凤凰"
    },
  "57743": {
     "Region":"湖南"
    ,"Station":"麻阳"
    },
  "57744": {
     "Region":"湖南"
    ,"Station":"新晃"
    },
  "57745": {
     "Region":"湖南"
    ,"Station":"芷江"
    },
  "57746": {
     "Region":"湖南"
    ,"Station":"怀化县"
    },
  "57749": {
     "Region":"湖南"
    ,"Station":"怀化"
    },
  "57752": {
     "Region":"湖南"
    ,"Station":"溆浦"
    },
  "57754": {
     "Region":"湖南"
    ,"Station":"洪江"
    },
  "57758": {
     "Region":"湖南"
    ,"Station":"洞口"
    },
  "57760": {
     "Region":"湖南"
    ,"Station":"冷水江"
    },
  "57761": {
     "Region":"湖南"
    ,"Station":"新化"
    },
  "57762": {
     "Region":"湖南"
    ,"Station":"涟源"
    },
  "57763": {
     "Region":"湖南"
    ,"Station":"娄底"
    },
  "57766": {
     "Region":"湖南"
    ,"Station":"邵阳市"
    },
  "57767": {
     "Region":"湖南"
    ,"Station":"隆回"
    },
  "57768": {
     "Region":"湖南"
    ,"Station":"新邵"
    },
  "57769": {
     "Region":"湖南"
    ,"Station":"邵东"
    },
  "57771": {
     "Region":"湖南"
    ,"Station":"韶山"
    },
  "57772": {
     "Region":"湖南"
    ,"Station":"湘乡"
    },
  "57773": {
     "Region":"湖南"
    ,"Station":"湘潭"
    },
  "57774": {
     "Region":"湖南"
    ,"Station":"双峰"
    },
  "57776": {
     "Region":"湖南"
    ,"Station":"南岳"
    },
  "57777": {
     "Region":"湖南"
    ,"Station":"衡山"
    },
  "57778": {
     "Region":"湖南"
    ,"Station":"衡东"
    },
  "57779": {
     "Region":"湖南"
    ,"Station":"攸县"
    },
  "57780": {
     "Region":"湖南"
    ,"Station":"株洲"
    },
  "57781": {
     "Region":"湖南"
    ,"Station":"醴陵"
    },
  "57841": {
     "Region":"湖南"
    ,"Station":"靖州"
    },
  "57842": {
     "Region":"湖南"
    ,"Station":"会同"
    },
  "57845": {
     "Region":"湖南"
    ,"Station":"通道"
    },
  "57846": {
     "Region":"湖南"
    ,"Station":"绥宁"
    },
  "57851": {
     "Region":"湖南"
    ,"Station":"新宁"
    },
  "57853": {
     "Region":"湖南"
    ,"Station":"武冈"
    },
  "57857": {
     "Region":"湖南"
    ,"Station":"城步"
    },
  "57860": {
     "Region":"湖南"
    ,"Station":"邵阳县"
    },
  "57865": {
     "Region":"湖南"
    ,"Station":"冷水滩"
    },
  "57866": {
     "Region":"湖南"
    ,"Station":"永州"
    },
  "57867": {
     "Region":"湖南"
    ,"Station":"东安"
    },
  "57868": {
     "Region":"湖南"
    ,"Station":"祁阳"
    },
  "57870": {
     "Region":"湖南"
    ,"Station":"祁东"
    },
  "57871": {
     "Region":"湖南"
    ,"Station":"衡阳县"
    },
  "57872": {
     "Region":"湖南"
    ,"Station":"衡阳"
    },
  "57874": {
     "Region":"湖南"
    ,"Station":"常宁"
    },
  "57875": {
     "Region":"湖南"
    ,"Station":"衡南"
    },
  "57876": {
     "Region":"湖南"
    ,"Station":"耒阳"
    },
  "57881": {
     "Region":"湖南"
    ,"Station":"安仁"
    },
  "57882": {
     "Region":"湖南"
    ,"Station":"茶陵"
    },
  "57886": {
     "Region":"湖南"
    ,"Station":"炎陵"
    },
  "57887": {
     "Region":"湖南"
    ,"Station":"永兴"
    },
  "57889": {
     "Region":"湖南"
    ,"Station":"桂东"
    },
  "57962": {
     "Region":"湖南"
    ,"Station":"双牌"
    },
  "57965": {
     "Region":"湖南"
    ,"Station":"道县"
    },
  "57966": {
     "Region":"湖南"
    ,"Station":"宁远"
    },
  "57969": {
     "Region":"湖南"
    ,"Station":"江永"
    },
  "57971": {
     "Region":"湖南"
    ,"Station":"新田"
    },
  "57972": {
     "Region":"湖南"
    ,"Station":"郴州"
    },
  "57973": {
     "Region":"湖南"
    ,"Station":"桂阳"
    },
  "57974": {
     "Region":"湖南"
    ,"Station":"嘉禾"
    },
  "57975": {
     "Region":"湖南"
    ,"Station":"蓝山"
    },
  "57976": {
     "Region":"湖南"
    ,"Station":"宜章"
    },
  "57978": {
     "Region":"湖南"
    ,"Station":"临武"
    },
  "57981": {
     "Region":"湖南"
    ,"Station":"资兴"
    },
  "57985": {
     "Region":"湖南"
    ,"Station":"汝城"
    },
  "59063": {
     "Region":"湖南"
    ,"Station":"江华"
    },
  "50936": {
     "Region":"吉林"
    ,"Station":"白城"
    },
  "50939": {
     "Region":"吉林"
    ,"Station":"洮南"
    },
  "50940": {
     "Region":"吉林"
    ,"Station":"镇赉"
    },
  "50945": {
     "Region":"吉林"
    ,"Station":"大安"
    },
  "50946": {
     "Region":"吉林"
    ,"Station":"松原"
    },
  "50948": {
     "Region":"吉林"
    ,"Station":"乾安"
    },
  "50949": {
     "Region":"吉林"
    ,"Station":"前郭"
    },
  "54041": {
     "Region":"吉林"
    ,"Station":"通榆"
    },
  "54049": {
     "Region":"吉林"
    ,"Station":"长岭"
    },
  "54063": {
     "Region":"吉林"
    ,"Station":"扶余"
    },
  "54064": {
     "Region":"吉林"
    ,"Station":"农安"
    },
  "54065": {
     "Region":"吉林"
    ,"Station":"德惠"
    },
  "54069": {
     "Region":"吉林"
    ,"Station":"九台"
    },
  "54072": {
     "Region":"吉林"
    ,"Station":"榆树"
    },
  "54076": {
     "Region":"吉林"
    ,"Station":"舒兰"
    },
  "54142": {
     "Region":"吉林"
    ,"Station":"双辽"
    },
  "54154": {
     "Region":"吉林"
    ,"Station":"梨树"
    },
  "54155": {
     "Region":"吉林"
    ,"Station":"孤家子"
    },
  "54156": {
     "Region":"吉林"
    ,"Station":"公主岭"
    },
  "54157": {
     "Region":"吉林"
    ,"Station":"四平"
    },
  "54161": {
     "Region":"吉林"
    ,"Station":"长春"
    },
  "54164": {
     "Region":"吉林"
    ,"Station":"伊通"
    },
  "54165": {
     "Region":"吉林"
    ,"Station":"双阳"
    },
  "54169": {
     "Region":"吉林"
    ,"Station":"烟筒山"
    },
  "54171": {
     "Region":"吉林"
    ,"Station":"永吉"
    },
  "54172": {
     "Region":"吉林"
    ,"Station":"吉林城郊"
    },
  "54175": {
     "Region":"吉林"
    ,"Station":"北大湖"
    },
  "54181": {
     "Region":"吉林"
    ,"Station":"蛟河"
    },
  "54186": {
     "Region":"吉林"
    ,"Station":"敦化"
    },
  "54187": {
     "Region":"吉林"
    ,"Station":"安图"
    },
  "54192": {
     "Region":"吉林"
    ,"Station":"罗子沟"
    },
  "54195": {
     "Region":"吉林"
    ,"Station":"汪清"
    },
  "54260": {
     "Region":"吉林"
    ,"Station":"辽源"
    },
  "54261": {
     "Region":"吉林"
    ,"Station":"东丰"
    },
  "54263": {
     "Region":"吉林"
    ,"Station":"磐石"
    },
  "54266": {
     "Region":"吉林"
    ,"Station":"梅河口"
    },
  "54267": {
     "Region":"吉林"
    ,"Station":"柳河"
    },
  "54273": {
     "Region":"吉林"
    ,"Station":"桦甸"
    },
  "54274": {
     "Region":"吉林"
    ,"Station":"辉南"
    },
  "54276": {
     "Region":"吉林"
    ,"Station":"靖宇"
    },
  "54279": {
     "Region":"吉林"
    ,"Station":"江源"
    },
  "54284": {
     "Region":"吉林"
    ,"Station":"东岗"
    },
  "54285": {
     "Region":"吉林"
    ,"Station":"二道"
    },
  "54286": {
     "Region":"吉林"
    ,"Station":"和龙"
    },
  "54287": {
     "Region":"吉林"
    ,"Station":"天池"
    },
  "54290": {
     "Region":"吉林"
    ,"Station":"龙井"
    },
  "54291": {
     "Region":"吉林"
    ,"Station":"珲春"
    },
  "54292": {
     "Region":"吉林"
    ,"Station":"延吉"
    },
  "54293": {
     "Region":"吉林"
    ,"Station":"图们"
    },
  "54362": {
     "Region":"吉林"
    ,"Station":"通化县"
    },
  "54363": {
     "Region":"吉林"
    ,"Station":"通化"
    },
  "54371": {
     "Region":"吉林"
    ,"Station":"白山"
    },
  "54374": {
     "Region":"吉林"
    ,"Station":"临江"
    },
  "54377": {
     "Region":"吉林"
    ,"Station":"集安"
    },
  "54386": {
     "Region":"吉林"
    ,"Station":"长白"
    },
  "58012": {
     "Region":"江苏"
    ,"Station":"丰县"
    },
  "58013": {
     "Region":"江苏"
    ,"Station":"沛县"
    },
  "58026": {
     "Region":"江苏"
    ,"Station":"邳州"
    },
  "58027": {
     "Region":"江苏"
    ,"Station":"徐州"
    },
  "58035": {
     "Region":"江苏"
    ,"Station":"新沂"
    },
  "58036": {
     "Region":"江苏"
    ,"Station":"东海"
    },
  "58038": {
     "Region":"江苏"
    ,"Station":"沭阳"
    },
  "58040": {
     "Region":"江苏"
    ,"Station":"赣榆"
    },
  "58041": {
     "Region":"江苏"
    ,"Station":"西连岛"
    },
  "58044": {
     "Region":"江苏"
    ,"Station":"连云港"
    },
  "58045": {
     "Region":"江苏"
    ,"Station":"响水"
    },
  "58046": {
     "Region":"江苏"
    ,"Station":"燕尾港"
    },
  "58047": {
     "Region":"江苏"
    ,"Station":"灌云"
    },
  "58048": {
     "Region":"江苏"
    ,"Station":"灌南"
    },
  "58049": {
     "Region":"江苏"
    ,"Station":"滨海"
    },
  "58130": {
     "Region":"江苏"
    ,"Station":"睢宁"
    },
  "58131": {
     "Region":"江苏"
    ,"Station":"宿豫"
    },
  "58132": {
     "Region":"江苏"
    ,"Station":"泗阳"
    },
  "58135": {
     "Region":"江苏"
    ,"Station":"泗洪"
    },
  "58138": {
     "Region":"江苏"
    ,"Station":"盱眙"
    },
  "58139": {
     "Region":"江苏"
    ,"Station":"洪泽"
    },
  "58140": {
     "Region":"江苏"
    ,"Station":"涟水"
    },
  "58141": {
     "Region":"江苏"
    ,"Station":"淮安"
    },
  "58143": {
     "Region":"江苏"
    ,"Station":"阜宁"
    },
  "58144": {
     "Region":"江苏"
    ,"Station":"淮阴(清江)"
    },
  "58145": {
     "Region":"江苏"
    ,"Station":"楚州"
    },
  "58146": {
     "Region":"江苏"
    ,"Station":"建湖"
    },
  "58147": {
     "Region":"江苏"
    ,"Station":"金湖"
    },
  "58148": {
     "Region":"江苏"
    ,"Station":"宝应"
    },
  "58150": {
     "Region":"江苏"
    ,"Station":"射阳"
    },
  "58154": {
     "Region":"江苏"
    ,"Station":"盐城"
    },
  "58158": {
     "Region":"江苏"
    ,"Station":"大丰"
    },
  "58235": {
     "Region":"江苏"
    ,"Station":"六合"
    },
  "58237": {
     "Region":"江苏"
    ,"Station":"浦口"
    },
  "58238": {
     "Region":"江苏"
    ,"Station":"南京"
    },
  "58241": {
     "Region":"江苏"
    ,"Station":"高邮"
    },
  "58242": {
     "Region":"江苏"
    ,"Station":"仪征"
    },
  "58243": {
     "Region":"江苏"
    ,"Station":"兴化"
    },
  "58244": {
     "Region":"江苏"
    ,"Station":"江都"
    },
  "58245": {
     "Region":"江苏"
    ,"Station":"扬州"
    },
  "58246": {
     "Region":"江苏"
    ,"Station":"泰州"
    },
  "58247": {
     "Region":"江苏"
    ,"Station":"扬中"
    },
  "58249": {
     "Region":"江苏"
    ,"Station":"泰兴"
    },
  "58250": {
     "Region":"江苏"
    ,"Station":"姜堰"
    },
  "58251": {
     "Region":"江苏"
    ,"Station":"东台"
    },
  "58252": {
     "Region":"江苏"
    ,"Station":"丹徒"
    },
  "58254": {
     "Region":"江苏"
    ,"Station":"海安"
    },
  "58255": {
     "Region":"江苏"
    ,"Station":"如皋"
    },
  "58257": {
     "Region":"江苏"
    ,"Station":"靖江"
    },
  "58259": {
     "Region":"江苏"
    ,"Station":"南通"
    },
  "58264": {
     "Region":"江苏"
    ,"Station":"如东"
    },
  "58265": {
     "Region":"江苏"
    ,"Station":"吕泗"
    },
  "58268": {
     "Region":"江苏"
    ,"Station":"通州"
    },
  "58269": {
     "Region":"江苏"
    ,"Station":"启东"
    },
  "58333": {
     "Region":"江苏"
    ,"Station":"江宁"
    },
  "58339": {
     "Region":"江苏"
    ,"Station":"高淳"
    },
  "58340": {
     "Region":"江苏"
    ,"Station":"溧水"
    },
  "58341": {
     "Region":"江苏"
    ,"Station":"丹阳"
    },
  "58342": {
     "Region":"江苏"
    ,"Station":"金坛"
    },
  "58343": {
     "Region":"江苏"
    ,"Station":"常州"
    },
  "58344": {
     "Region":"江苏"
    ,"Station":"句容"
    },
  "58345": {
     "Region":"江苏"
    ,"Station":"溧阳"
    },
  "58346": {
     "Region":"江苏"
    ,"Station":"宜兴"
    },
  "58349": {
     "Region":"江苏"
    ,"Station":"吴中"
    },
  "58351": {
     "Region":"江苏"
    ,"Station":"江阴"
    },
  "58352": {
     "Region":"江苏"
    ,"Station":"常熟"
    },
  "58353": {
     "Region":"江苏"
    ,"Station":"张家港"
    },
  "58354": {
     "Region":"江苏"
    ,"Station":"无锡"
    },
  "58356": {
     "Region":"江苏"
    ,"Station":"昆山"
    },
  "58358": {
     "Region":"江苏"
    ,"Station":"东山"
    },
  "58359": {
     "Region":"江苏"
    ,"Station":"吴江"
    },
  "58360": {
     "Region":"江苏"
    ,"Station":"海门"
    },
  "58377": {
     "Region":"江苏"
    ,"Station":"太仓"
    },
  "57598": {
     "Region":"江西"
    ,"Station":"修水"
    },
  "57694": {
     "Region":"江西"
    ,"Station":"铜鼓"
    },
  "57696": {
     "Region":"江西"
    ,"Station":"宜丰"
    },
  "57698": {
     "Region":"江西"
    ,"Station":"万载"
    },
  "57699": {
     "Region":"江西"
    ,"Station":"上高"
    },
  "57783": {
     "Region":"江西"
    ,"Station":"上栗"
    },
  "57786": {
     "Region":"江西"
    ,"Station":"萍乡"
    },
  "57789": {
     "Region":"江西"
    ,"Station":"莲花"
    },
  "57792": {
     "Region":"江西"
    ,"Station":"分宜"
    },
  "57793": {
     "Region":"江西"
    ,"Station":"宜春"
    },
  "57794": {
     "Region":"江西"
    ,"Station":"芦溪"
    },
  "57796": {
     "Region":"江西"
    ,"Station":"新余"
    },
  "57798": {
     "Region":"江西"
    ,"Station":"安福"
    },
  "57799": {
     "Region":"江西"
    ,"Station":"吉安县"
    },
  "57883": {
     "Region":"江西"
    ,"Station":"夏坪"
    },
  "57891": {
     "Region":"江西"
    ,"Station":"永新"
    },
  "57894": {
     "Region":"江西"
    ,"Station":"井冈山"
    },
  "57895": {
     "Region":"江西"
    ,"Station":"万安"
    },
  "57896": {
     "Region":"江西"
    ,"Station":"遂川"
    },
  "57899": {
     "Region":"江西"
    ,"Station":"泰和"
    },
  "57990": {
     "Region":"江西"
    ,"Station":"崇义"
    },
  "57991": {
     "Region":"江西"
    ,"Station":"上犹"
    },
  "57992": {
     "Region":"江西"
    ,"Station":"南康"
    },
  "57993": {
     "Region":"江西"
    ,"Station":"赣县"
    },
  "57994": {
     "Region":"江西"
    ,"Station":"大余"
    },
  "57995": {
     "Region":"江西"
    ,"Station":"信丰"
    },
  "58502": {
     "Region":"江西"
    ,"Station":"九江"
    },
  "58503": {
     "Region":"江西"
    ,"Station":"瑞昌"
    },
  "58505": {
     "Region":"江西"
    ,"Station":"九江县"
    },
  "58506": {
     "Region":"江西"
    ,"Station":"庐山"
    },
  "58507": {
     "Region":"江西"
    ,"Station":"武宁"
    },
  "58508": {
     "Region":"江西"
    ,"Station":"德安"
    },
  "58509": {
     "Region":"江西"
    ,"Station":"永修"
    },
  "58510": {
     "Region":"江西"
    ,"Station":"湖口"
    },
  "58512": {
     "Region":"江西"
    ,"Station":"彭泽"
    },
  "58514": {
     "Region":"江西"
    ,"Station":"星子"
    },
  "58517": {
     "Region":"江西"
    ,"Station":"都昌"
    },
  "58519": {
     "Region":"江西"
    ,"Station":"波阳"
    },
  "58527": {
     "Region":"江西"
    ,"Station":"景德镇"
    },
  "58529": {
     "Region":"江西"
    ,"Station":"婺源"
    },
  "58600": {
     "Region":"江西"
    ,"Station":"靖安"
    },
  "58601": {
     "Region":"江西"
    ,"Station":"奉新"
    },
  "58602": {
     "Region":"江西"
    ,"Station":"安义"
    },
  "58605": {
     "Region":"江西"
    ,"Station":"高安"
    },
  "58606": {
     "Region":"江西"
    ,"Station":"南昌"
    },
  "58607": {
     "Region":"江西"
    ,"Station":"南昌县"
    },
  "58608": {
     "Region":"江西"
    ,"Station":"樟树"
    },
  "58609": {
     "Region":"江西"
    ,"Station":"丰城"
    },
  "58612": {
     "Region":"江西"
    ,"Station":"余干"
    },
  "58614": {
     "Region":"江西"
    ,"Station":"进贤"
    },
  "58615": {
     "Region":"江西"
    ,"Station":"万年"
    },
  "58616": {
     "Region":"江西"
    ,"Station":"余江"
    },
  "58617": {
     "Region":"江西"
    ,"Station":"抚州"
    },
  "58618": {
     "Region":"江西"
    ,"Station":"东乡"
    },
  "58619": {
     "Region":"江西"
    ,"Station":"临川"
    },
  "58620": {
     "Region":"江西"
    ,"Station":"乐平"
    },
  "58622": {
     "Region":"江西"
    ,"Station":"德兴"
    },
  "58623": {
     "Region":"江西"
    ,"Station":"上饶县"
    },
  "58624": {
     "Region":"江西"
    ,"Station":"弋阳"
    },
  "58625": {
     "Region":"江西"
    ,"Station":"横峰"
    },
  "58626": {
     "Region":"江西"
    ,"Station":"贵溪"
    },
  "58627": {
     "Region":"江西"
    ,"Station":"鹰潭"
    },
  "58629": {
     "Region":"江西"
    ,"Station":"铅山"
    },
  "58634": {
     "Region":"江西"
    ,"Station":"玉山"
    },
  "58635": {
     "Region":"江西"
    ,"Station":"广丰"
    },
  "58637": {
     "Region":"江西"
    ,"Station":"上饶"
    },
  "58693": {
     "Region":"江西"
    ,"Station":"新建"
    },
  "58701": {
     "Region":"江西"
    ,"Station":"新干"
    },
  "58704": {
     "Region":"江西"
    ,"Station":"峡江"
    },
  "58705": {
     "Region":"江西"
    ,"Station":"永丰"
    },
  "58706": {
     "Region":"江西"
    ,"Station":"乐安"
    },
  "58707": {
     "Region":"江西"
    ,"Station":"吉水"
    },
  "58710": {
     "Region":"江西"
    ,"Station":"崇仁"
    },
  "58712": {
     "Region":"江西"
    ,"Station":"金溪"
    },
  "58713": {
     "Region":"江西"
    ,"Station":"资溪"
    },
  "58714": {
     "Region":"江西"
    ,"Station":"宜黄"
    },
  "58715": {
     "Region":"江西"
    ,"Station":"南城"
    },
  "58718": {
     "Region":"江西"
    ,"Station":"南丰"
    },
  "58719": {
     "Region":"江西"
    ,"Station":"黎川"
    },
  "58804": {
     "Region":"江西"
    ,"Station":"兴国"
    },
  "58806": {
     "Region":"江西"
    ,"Station":"宁都"
    },
  "58813": {
     "Region":"江西"
    ,"Station":"广昌"
    },
  "58814": {
     "Region":"江西"
    ,"Station":"石城"
    },
  "58903": {
     "Region":"江西"
    ,"Station":"瑞金"
    },
  "58905": {
     "Region":"江西"
    ,"Station":"于都"
    },
  "58906": {
     "Region":"江西"
    ,"Station":"会昌"
    },
  "58907": {
     "Region":"江西"
    ,"Station":"安远"
    },
  "59091": {
     "Region":"江西"
    ,"Station":"全南"
    },
  "59092": {
     "Region":"江西"
    ,"Station":"龙南"
    },
  "59093": {
     "Region":"江西"
    ,"Station":"定南"
    },
  "59102": {
     "Region":"江西"
    ,"Station":"寻乌"
    },
  "54236": {
     "Region":"辽宁"
    ,"Station":"彰武"
    },
  "54237": {
     "Region":"辽宁"
    ,"Station":"阜新"
    },
  "54243": {
     "Region":"辽宁"
    ,"Station":"昌图"
    },
  "54244": {
     "Region":"辽宁"
    ,"Station":"康平"
    },
  "54245": {
     "Region":"辽宁"
    ,"Station":"法库"
    },
  "54248": {
     "Region":"辽宁"
    ,"Station":"新城子"
    },
  "54249": {
     "Region":"辽宁"
    ,"Station":"铁岭"
    },
  "54252": {
     "Region":"辽宁"
    ,"Station":"西丰"
    },
  "54254": {
     "Region":"辽宁"
    ,"Station":"开原"
    },
  "54259": {
     "Region":"辽宁"
    ,"Station":"清原"
    },
  "54321": {
     "Region":"辽宁"
    ,"Station":"建平镇"
    },
  "54323": {
     "Region":"辽宁"
    ,"Station":"北票"
    },
  "54324": {
     "Region":"辽宁"
    ,"Station":"朝阳"
    },
  "54325": {
     "Region":"辽宁"
    ,"Station":"羊山"
    },
  "54326": {
     "Region":"辽宁"
    ,"Station":"建平县"
    },
  "54327": {
     "Region":"辽宁"
    ,"Station":"凌源"
    },
  "54328": {
     "Region":"辽宁"
    ,"Station":"喀左"
    },
  "54330": {
     "Region":"辽宁"
    ,"Station":"凌海"
    },
  "54331": {
     "Region":"辽宁"
    ,"Station":"北镇"
    },
  "54332": {
     "Region":"辽宁"
    ,"Station":"辽中"
    },
  "54333": {
     "Region":"辽宁"
    ,"Station":"新民"
    },
  "54334": {
     "Region":"辽宁"
    ,"Station":"义县"
    },
  "54335": {
     "Region":"辽宁"
    ,"Station":"黑山"
    },
  "54336": {
     "Region":"辽宁"
    ,"Station":"台安"
    },
  "54337": {
     "Region":"辽宁"
    ,"Station":"锦州"
    },
  "54338": {
     "Region":"辽宁"
    ,"Station":"盘山"
    },
  "54339": {
     "Region":"辽宁"
    ,"Station":"鞍山"
    },
  "54340": {
     "Region":"辽宁"
    ,"Station":"苏家屯"
    },
  "54342": {
     "Region":"辽宁"
    ,"Station":"沈阳"
    },
  "54345": {
     "Region":"辽宁"
    ,"Station":"辽阳县"
    },
  "54346": {
     "Region":"辽宁"
    ,"Station":"本溪"
    },
  "54347": {
     "Region":"辽宁"
    ,"Station":"辽阳"
    },
  "54348": {
     "Region":"辽宁"
    ,"Station":"灯塔"
    },
  "54349": {
     "Region":"辽宁"
    ,"Station":"本溪县"
    },
  "54351": {
     "Region":"辽宁"
    ,"Station":"抚顺"
    },
  "54353": {
     "Region":"辽宁"
    ,"Station":"新宾"
    },
  "54365": {
     "Region":"辽宁"
    ,"Station":"桓仁"
    },
  "54452": {
     "Region":"辽宁"
    ,"Station":"建昌"
    },
  "54453": {
     "Region":"辽宁"
    ,"Station":"连山区"
    },
  "54454": {
     "Region":"辽宁"
    ,"Station":"绥中"
    },
  "54455": {
     "Region":"辽宁"
    ,"Station":"兴城"
    },
  "54470": {
     "Region":"辽宁"
    ,"Station":"大洼"
    },
  "54471": {
     "Region":"辽宁"
    ,"Station":"营口"
    },
  "54472": {
     "Region":"辽宁"
    ,"Station":"海城"
    },
  "54474": {
     "Region":"辽宁"
    ,"Station":"盖州"
    },
  "54475": {
     "Region":"辽宁"
    ,"Station":"大石桥"
    },
  "54476": {
     "Region":"辽宁"
    ,"Station":"熊岳"
    },
  "54483": {
     "Region":"辽宁"
    ,"Station":"草河口"
    },
  "54486": {
     "Region":"辽宁"
    ,"Station":"岫岩"
    },
  "54493": {
     "Region":"辽宁"
    ,"Station":"宽甸"
    },
  "54494": {
     "Region":"辽宁"
    ,"Station":"凤城"
    },
  "54497": {
     "Region":"辽宁"
    ,"Station":"丹东"
    },
  "54563": {
     "Region":"辽宁"
    ,"Station":"瓦房店"
    },
  "54568": {
     "Region":"辽宁"
    ,"Station":"金州"
    },
  "54569": {
     "Region":"辽宁"
    ,"Station":"普兰店"
    },
  "54575": {
     "Region":"辽宁"
    ,"Station":"皮口"
    },
  "54579": {
     "Region":"辽宁"
    ,"Station":"长海"
    },
  "54584": {
     "Region":"辽宁"
    ,"Station":"庄河"
    },
  "54590": {
     "Region":"辽宁"
    ,"Station":"东港"
    },
  "54660": {
     "Region":"辽宁"
    ,"Station":"旅顺"
    },
  "54662": {
     "Region":"辽宁"
    ,"Station":"大连"
    },
  "50425": {
     "Region":"内蒙古"
    ,"Station":"额尔古纳市"
    },
  "50431": {
     "Region":"内蒙古"
    ,"Station":"根河市"
    },
  "50434": {
     "Region":"内蒙古"
    ,"Station":"图里河"
    },
  "50445": {
     "Region":"内蒙古"
    ,"Station":"鄂伦春自治旗"
    },
  "50514": {
     "Region":"内蒙古"
    ,"Station":"满洲里"
    },
  "50524": {
     "Region":"内蒙古"
    ,"Station":"陈巴尔虎旗"
    },
  "50525": {
     "Region":"内蒙古"
    ,"Station":"鄂温克族自治旗"
    },
  "50526": {
     "Region":"内蒙古"
    ,"Station":"牙克石市"
    },
  "50527": {
     "Region":"内蒙古"
    ,"Station":"海拉尔"
    },
  "50548": {
     "Region":"内蒙古"
    ,"Station":"小二沟"
    },
  "50603": {
     "Region":"内蒙古"
    ,"Station":"新巴尔虎右旗"
    },
  "50618": {
     "Region":"内蒙古"
    ,"Station":"新巴尔虎左旗"
    },
  "50632": {
     "Region":"内蒙古"
    ,"Station":"博克图"
    },
  "50639": {
     "Region":"内蒙古"
    ,"Station":"扎兰屯"
    },
  "50645": {
     "Region":"内蒙古"
    ,"Station":"莫力达瓦达斡尔族自治旗"
    },
  "50647": {
     "Region":"内蒙古"
    ,"Station":"阿荣旗"
    },
  "50727": {
     "Region":"内蒙古"
    ,"Station":"阿尔山"
    },
  "50832": {
     "Region":"内蒙古"
    ,"Station":"胡尔勒"
    },
  "50833": {
     "Region":"内蒙古"
    ,"Station":"扎赉特旗"
    },
  "50834": {
     "Region":"内蒙古"
    ,"Station":"索伦"
    },
  "50838": {
     "Region":"内蒙古"
    ,"Station":"乌兰浩特"
    },
  "50913": {
     "Region":"内蒙古"
    ,"Station":"乌拉盖"
    },
  "50915": {
     "Region":"内蒙古"
    ,"Station":"东乌珠穆沁"
    },
  "50924": {
     "Region":"内蒙古"
    ,"Station":"霍林郭勒"
    },
  "50928": {
     "Region":"内蒙古"
    ,"Station":"巴雅尔吐胡硕"
    },
  "50934": {
     "Region":"内蒙古"
    ,"Station":"突泉"
    },
  "50937": {
     "Region":"内蒙古"
    ,"Station":"科尔沁右翼中旗"
    },
  "52267": {
     "Region":"内蒙古"
    ,"Station":"额济纳旗"
    },
  "52378": {
     "Region":"内蒙古"
    ,"Station":"拐子湖"
    },
  "52495": {
     "Region":"内蒙古"
    ,"Station":"巴彦诺尔公"
    },
  "52575": {
     "Region":"内蒙古"
    ,"Station":"雅布赖"
    },
  "52576": {
     "Region":"内蒙古"
    ,"Station":"阿右旗"
    },
  "52607": {
     "Region":"内蒙古"
    ,"Station":"乌斯太"
    },
  "53068": {
     "Region":"内蒙古"
    ,"Station":"二连浩特"
    },
  "53083": {
     "Region":"内蒙古"
    ,"Station":"那仁宝力格"
    },
  "53149": {
     "Region":"内蒙古"
    ,"Station":"满都拉气象站"
    },
  "53192": {
     "Region":"内蒙古"
    ,"Station":"阿巴嘎旗"
    },
  "53195": {
     "Region":"内蒙古"
    ,"Station":"苏尼特左旗"
    },
  "53231": {
     "Region":"内蒙古"
    ,"Station":"海力素"
    },
  "53272": {
     "Region":"内蒙古"
    ,"Station":"苏尼特右旗"
    },
  "53276": {
     "Region":"内蒙古"
    ,"Station":"朱日和"
    },
  "53289": {
     "Region":"内蒙古"
    ,"Station":"镶黄旗"
    },
  "53324": {
     "Region":"内蒙古"
    ,"Station":"乌拉特后旗"
    },
  "53336": {
     "Region":"内蒙古"
    ,"Station":"乌拉特中旗"
    },
  "53337": {
     "Region":"内蒙古"
    ,"Station":"五原"
    },
  "53343": {
     "Region":"内蒙古"
    ,"Station":"白云鄂博气象局"
    },
  "53348": {
     "Region":"内蒙古"
    ,"Station":"大佘太"
    },
  "53352": {
     "Region":"内蒙古"
    ,"Station":"达茂旗气象局"
    },
  "53357": {
     "Region":"内蒙古"
    ,"Station":"固阳县气象局"
    },
  "53362": {
     "Region":"内蒙古"
    ,"Station":"四子王"
    },
  "53367": {
     "Region":"内蒙古"
    ,"Station":"希拉穆仁气侯站"
    },
  "53368": {
     "Region":"内蒙古"
    ,"Station":"武川县"
    },
  "53378": {
     "Region":"内蒙古"
    ,"Station":"察右中旗"
    },
  "53384": {
     "Region":"内蒙古"
    ,"Station":"察右后旗"
    },
  "53385": {
     "Region":"内蒙古"
    ,"Station":"商都"
    },
  "53391": {
     "Region":"内蒙古"
    ,"Station":"化德"
    },
  "53419": {
     "Region":"内蒙古"
    ,"Station":"磴口"
    },
  "53420": {
     "Region":"内蒙古"
    ,"Station":"杭锦后旗"
    },
  "53433": {
     "Region":"内蒙古"
    ,"Station":"乌拉特前旗"
    },
  "53446": {
     "Region":"内蒙古"
    ,"Station":"包头市"
    },
  "53455": {
     "Region":"内蒙古"
    ,"Station":"土右旗气象局"
    },
  "53457": {
     "Region":"内蒙古"
    ,"Station":"达拉特旗"
    },
  "53463": {
     "Region":"内蒙古"
    ,"Station":"呼和浩特"
    },
  "53464": {
     "Region":"内蒙古"
    ,"Station":"土默特左旗"
    },
  "53466": {
     "Region":"内蒙古"
    ,"Station":"呼和浩特郊区站"
    },
  "53467": {
     "Region":"内蒙古"
    ,"Station":"托克托县"
    },
  "53469": {
     "Region":"内蒙古"
    ,"Station":"和林格尔县"
    },
  "53472": {
     "Region":"内蒙古"
    ,"Station":"卓资"
    },
  "53475": {
     "Region":"内蒙古"
    ,"Station":"凉城"
    },
  "53480": {
     "Region":"内蒙古"
    ,"Station":"集宁"
    },
  "53481": {
     "Region":"内蒙古"
    ,"Station":"察右前旗"
    },
  "53483": {
     "Region":"内蒙古"
    ,"Station":"兴和"
    },
  "53484": {
     "Region":"内蒙古"
    ,"Station":"丰镇"
    },
  "53502": {
     "Region":"内蒙古"
    ,"Station":"吉兰太"
    },
  "53505": {
     "Region":"内蒙古"
    ,"Station":"孪井滩"
    },
  "53512": {
     "Region":"内蒙古"
    ,"Station":"乌海"
    },
  "53513": {
     "Region":"内蒙古"
    ,"Station":"临河"
    },
  "53522": {
     "Region":"内蒙古"
    ,"Station":"伊克乌素"
    },
  "53529": {
     "Region":"内蒙古"
    ,"Station":"鄂托克旗"
    },
  "53533": {
     "Region":"内蒙古"
    ,"Station":"杭锦旗"
    },
  "53543": {
     "Region":"内蒙古"
    ,"Station":"东胜"
    },
  "53545": {
     "Region":"内蒙古"
    ,"Station":"伊金霍洛旗"
    },
  "53547": {
     "Region":"内蒙古"
    ,"Station":"乌审召"
    },
  "53553": {
     "Region":"内蒙古"
    ,"Station":"准格尔旗"
    },
  "53562": {
     "Region":"内蒙古"
    ,"Station":"清水河县"
    },
  "53602": {
     "Region":"内蒙古"
    ,"Station":"阿拉善左旗"
    },
  "53644": {
     "Region":"内蒙古"
    ,"Station":"乌审旗"
    },
  "53730": {
     "Region":"内蒙古"
    ,"Station":"鄂托克前旗"
    },
  "53732": {
     "Region":"内蒙古"
    ,"Station":"河南"
    },
  "54012": {
     "Region":"内蒙古"
    ,"Station":"西乌珠穆沁"
    },
  "54024": {
     "Region":"内蒙古"
    ,"Station":"富河"
    },
  "54026": {
     "Region":"内蒙古"
    ,"Station":"扎鲁特"
    },
  "54027": {
     "Region":"内蒙古"
    ,"Station":"巴林左旗"
    },
  "54031": {
     "Region":"内蒙古"
    ,"Station":"高力板"
    },
  "54039": {
     "Region":"内蒙古"
    ,"Station":"舍伯吐"
    },
  "54047": {
     "Region":"内蒙古"
    ,"Station":"科左中旗"
    },
  "54102": {
     "Region":"内蒙古"
    ,"Station":"锡林浩特"
    },
  "54113": {
     "Region":"内蒙古"
    ,"Station":"巴林右旗"
    },
  "54115": {
     "Region":"内蒙古"
    ,"Station":"林西县"
    },
  "54117": {
     "Region":"内蒙古"
    ,"Station":"克什克腾旗"
    },
  "54122": {
     "Region":"内蒙古"
    ,"Station":"阿鲁科尔沁旗"
    },
  "54132": {
     "Region":"内蒙古"
    ,"Station":"青龙山"
    },
  "54134": {
     "Region":"内蒙古"
    ,"Station":"开鲁"
    },
  "54135": {
     "Region":"内蒙古"
    ,"Station":"通辽"
    },
  "54204": {
     "Region":"内蒙古"
    ,"Station":"正镶白旗"
    },
  "54205": {
     "Region":"内蒙古"
    ,"Station":"正蓝旗"
    },
  "54208": {
     "Region":"内蒙古"
    ,"Station":"多伦县"
    },
  "54213": {
     "Region":"内蒙古"
    ,"Station":"翁牛特旗"
    },
  "54214": {
     "Region":"内蒙古"
    ,"Station":"岗子"
    },
  "54218": {
     "Region":"内蒙古"
    ,"Station":"赤峰"
    },
  "54223": {
     "Region":"内蒙古"
    ,"Station":"奈曼"
    },
  "54225": {
     "Region":"内蒙古"
    ,"Station":"敖汉旗"
    },
  "54226": {
     "Region":"内蒙古"
    ,"Station":"宝国吐"
    },
  "54231": {
     "Region":"内蒙古"
    ,"Station":"科左后旗"
    },
  "54234": {
     "Region":"内蒙古"
    ,"Station":"库伦"
    },
  "54305": {
     "Region":"内蒙古"
    ,"Station":"太仆寺旗"
    },
  "54313": {
     "Region":"内蒙古"
    ,"Station":"喀喇沁旗"
    },
  "54316": {
     "Region":"内蒙古"
    ,"Station":"八里罕"
    },
  "54320": {
     "Region":"内蒙古"
    ,"Station":"宁城县"
    },
  "53517": {
     "Region":"宁夏"
    ,"Station":"石炭井"
    },
  "53518": {
     "Region":"宁夏"
    ,"Station":"石嘴山"
    },
  "53519": {
     "Region":"宁夏"
    ,"Station":"惠农"
    },
  "53603": {
     "Region":"宁夏"
    ,"Station":"沙湖"
    },
  "53610": {
     "Region":"宁夏"
    ,"Station":"贺兰"
    },
  "53611": {
     "Region":"宁夏"
    ,"Station":"平罗"
    },
  "53612": {
     "Region":"宁夏"
    ,"Station":"吴忠"
    },
  "53614": {
     "Region":"宁夏"
    ,"Station":"银川"
    },
  "53615": {
     "Region":"宁夏"
    ,"Station":"陶乐"
    },
  "53617": {
     "Region":"宁夏"
    ,"Station":"青铜峡"
    },
  "53618": {
     "Region":"宁夏"
    ,"Station":"永宁"
    },
  "53619": {
     "Region":"宁夏"
    ,"Station":"灵武"
    },
  "53704": {
     "Region":"宁夏"
    ,"Station":"中卫"
    },
  "53705": {
     "Region":"宁夏"
    ,"Station":"中宁"
    },
  "53707": {
     "Region":"宁夏"
    ,"Station":"兴仁"
    },
  "53723": {
     "Region":"宁夏"
    ,"Station":"盐池"
    },
  "53727": {
     "Region":"宁夏"
    ,"Station":"麻黄山"
    },
  "53806": {
     "Region":"宁夏"
    ,"Station":"海原"
    },
  "53810": {
     "Region":"宁夏"
    ,"Station":"同心"
    },
  "53817": {
     "Region":"宁夏"
    ,"Station":"固原"
    },
  "53881": {
     "Region":"宁夏"
    ,"Station":"韦州"
    },
  "53903": {
     "Region":"宁夏"
    ,"Station":"西吉"
    },
  "53910": {
     "Region":"宁夏"
    ,"Station":"六盘山"
    },
  "53913": {
     "Region":"宁夏"
    ,"Station":"彭阳"
    },
  "53914": {
     "Region":"宁夏"
    ,"Station":"隆德"
    },
  "53916": {
     "Region":"宁夏"
    ,"Station":"泾源"
    },
  "51886": {
     "Region":"青海"
    ,"Station":"茫崖"
    },
  "52602": {
     "Region":"青海"
    ,"Station":"冷湖"
    },
  "52633": {
     "Region":"青海"
    ,"Station":"托勒"
    },
  "52645": {
     "Region":"青海"
    ,"Station":"野牛沟"
    },
  "52657": {
     "Region":"青海"
    ,"Station":"祁连"
    },
  "52707": {
     "Region":"青海"
    ,"Station":"小灶火"
    },
  "52713": {
     "Region":"青海"
    ,"Station":"大柴旦"
    },
  "52737": {
     "Region":"青海"
    ,"Station":"德令哈"
    },
  "52745": {
     "Region":"青海"
    ,"Station":"天峻"
    },
  "52754": {
     "Region":"青海"
    ,"Station":"刚察"
    },
  "52765": {
     "Region":"青海"
    ,"Station":"门源"
    },
  "52818": {
     "Region":"青海"
    ,"Station":"格尔木"
    },
  "52825": {
     "Region":"青海"
    ,"Station":"诺木洪"
    },
  "52833": {
     "Region":"青海"
    ,"Station":"乌兰"
    },
  "52836": {
     "Region":"青海"
    ,"Station":"都兰"
    },
  "52842": {
     "Region":"青海"
    ,"Station":"茶卡"
    },
  "52853": {
     "Region":"青海"
    ,"Station":"海晏"
    },
  "52855": {
     "Region":"青海"
    ,"Station":"湟源"
    },
  "52856": {
     "Region":"青海"
    ,"Station":"共和"
    },
  "52862": {
     "Region":"青海"
    ,"Station":"大通"
    },
  "52863": {
     "Region":"青海"
    ,"Station":"互助"
    },
  "52866": {
     "Region":"青海"
    ,"Station":"西宁"
    },
  "52868": {
     "Region":"青海"
    ,"Station":"贵德"
    },
  "52869": {
     "Region":"青海"
    ,"Station":"湟中"
    },
  "52874": {
     "Region":"青海"
    ,"Station":"乐都"
    },
  "52875": {
     "Region":"青海"
    ,"Station":"平安"
    },
  "52876": {
     "Region":"青海"
    ,"Station":"民和"
    },
  "52877": {
     "Region":"青海"
    ,"Station":"化隆"
    },
  "52908": {
     "Region":"青海"
    ,"Station":"五道梁"
    },
  "52943": {
     "Region":"青海"
    ,"Station":"兴海"
    },
  "52955": {
     "Region":"青海"
    ,"Station":"贵南"
    },
  "52957": {
     "Region":"青海"
    ,"Station":"同德"
    },
  "52963": {
     "Region":"青海"
    ,"Station":"尖扎"
    },
  "52968": {
     "Region":"青海"
    ,"Station":"泽库"
    },
  "52972": {
     "Region":"青海"
    ,"Station":"循化"
    },
  "52974": {
     "Region":"青海"
    ,"Station":"同仁"
    },
  "56004": {
     "Region":"青海"
    ,"Station":"沱沱河"
    },
  "56016": {
     "Region":"青海"
    ,"Station":"治多"
    },
  "56018": {
     "Region":"青海"
    ,"Station":"杂多"
    },
  "56021": {
     "Region":"青海"
    ,"Station":"曲麻莱"
    },
  "56029": {
     "Region":"青海"
    ,"Station":"玉树"
    },
  "56033": {
     "Region":"青海"
    ,"Station":"玛多"
    },
  "56034": {
     "Region":"青海"
    ,"Station":"清水河"
    },
  "56043": {
     "Region":"青海"
    ,"Station":"玛沁"
    },
  "56045": {
     "Region":"青海"
    ,"Station":"甘德"
    },
  "56046": {
     "Region":"青海"
    ,"Station":"达日"
    },
  "56065": {
     "Region":"青海"
    ,"Station":"河南"
    },
  "56067": {
     "Region":"青海"
    ,"Station":"久治"
    },
  "56125": {
     "Region":"青海"
    ,"Station":"囊谦"
    },
  "56151": {
     "Region":"青海"
    ,"Station":"班玛"
    },
  "54709": {
     "Region":"山东"
    ,"Station":"武城"
    },
  "54712": {
     "Region":"山东"
    ,"Station":"临邑"
    },
  "54714": {
     "Region":"山东"
    ,"Station":"德州"
    },
  "54715": {
     "Region":"山东"
    ,"Station":"陵县"
    },
  "54716": {
     "Region":"山东"
    ,"Station":"宁津"
    },
  "54718": {
     "Region":"山东"
    ,"Station":"平原"
    },
  "54722": {
     "Region":"山东"
    ,"Station":"无棣"
    },
  "54723": {
     "Region":"山东"
    ,"Station":"阳信"
    },
  "54724": {
     "Region":"山东"
    ,"Station":"商河"
    },
  "54725": {
     "Region":"山东"
    ,"Station":"惠民"
    },
  "54726": {
     "Region":"山东"
    ,"Station":"乐陵"
    },
  "54727": {
     "Region":"山东"
    ,"Station":"章丘"
    },
  "54728": {
     "Region":"山东"
    ,"Station":"庆云"
    },
  "54729": {
     "Region":"山东"
    ,"Station":"高青"
    },
  "54730": {
     "Region":"山东"
    ,"Station":"沾化"
    },
  "54731": {
     "Region":"山东"
    ,"Station":"利津"
    },
  "54732": {
     "Region":"山东"
    ,"Station":"河口"
    },
  "54734": {
     "Region":"山东"
    ,"Station":"滨州"
    },
  "54736": {
     "Region":"山东"
    ,"Station":"东营"
    },
  "54737": {
     "Region":"山东"
    ,"Station":"博兴"
    },
  "54738": {
     "Region":"山东"
    ,"Station":"广饶"
    },
  "54744": {
     "Region":"山东"
    ,"Station":"垦利"
    },
  "54749": {
     "Region":"山东"
    ,"Station":"莱州"
    },
  "54751": {
     "Region":"山东"
    ,"Station":"长岛"
    },
  "54752": {
     "Region":"山东"
    ,"Station":"蓬莱"
    },
  "54753": {
     "Region":"山东"
    ,"Station":"龙口"
    },
  "54755": {
     "Region":"山东"
    ,"Station":"招远"
    },
  "54759": {
     "Region":"山东"
    ,"Station":"栖霞"
    },
  "54764": {
     "Region":"山东"
    ,"Station":"福山"
    },
  "54765": {
     "Region":"山东"
    ,"Station":"烟台"
    },
  "54766": {
     "Region":"山东"
    ,"Station":"牟平"
    },
  "54774": {
     "Region":"山东"
    ,"Station":"威海"
    },
  "54776": {
     "Region":"山东"
    ,"Station":"成山头"
    },
  "54777": {
     "Region":"山东"
    ,"Station":"文登"
    },
  "54778": {
     "Region":"山东"
    ,"Station":"荣成"
    },
  "54802": {
     "Region":"山东"
    ,"Station":"临清"
    },
  "54803": {
     "Region":"山东"
    ,"Station":"夏津"
    },
  "54805": {
     "Region":"山东"
    ,"Station":"冠县"
    },
  "54806": {
     "Region":"山东"
    ,"Station":"聊城"
    },
  "54807": {
     "Region":"山东"
    ,"Station":"阳谷"
    },
  "54808": {
     "Region":"山东"
    ,"Station":"莘县"
    },
  "54810": {
     "Region":"山东"
    ,"Station":"高唐"
    },
  "54811": {
     "Region":"山东"
    ,"Station":"禹城"
    },
  "54812": {
     "Region":"山东"
    ,"Station":"齐河"
    },
  "54814": {
     "Region":"山东"
    ,"Station":"茌平"
    },
  "54815": {
     "Region":"山东"
    ,"Station":"东阿"
    },
  "54816": {
     "Region":"山东"
    ,"Station":"长清"
    },
  "54818": {
     "Region":"山东"
    ,"Station":"平阴"
    },
  "54819": {
     "Region":"山东"
    ,"Station":"肥城"
    },
  "54821": {
     "Region":"山东"
    ,"Station":"济阳"
    },
  "54822": {
     "Region":"山东"
    ,"Station":"邹平"
    },
  "54823": {
     "Region":"山东"
    ,"Station":"济南"
    },
  "54824": {
     "Region":"山东"
    ,"Station":"淄川"
    },
  "54825": {
     "Region":"山东"
    ,"Station":"博山"
    },
  "54826": {
     "Region":"山东"
    ,"Station":"泰山"
    },
  "54827": {
     "Region":"山东"
    ,"Station":"泰安"
    },
  "54828": {
     "Region":"山东"
    ,"Station":"莱芜"
    },
  "54829": {
     "Region":"山东"
    ,"Station":"周村"
    },
  "54830": {
     "Region":"山东"
    ,"Station":"淄博"
    },
  "54831": {
     "Region":"山东"
    ,"Station":"青州"
    },
  "54832": {
     "Region":"山东"
    ,"Station":"寿光"
    },
  "54833": {
     "Region":"山东"
    ,"Station":"桓台"
    },
  "54834": {
     "Region":"山东"
    ,"Station":"临淄"
    },
  "54835": {
     "Region":"山东"
    ,"Station":"临朐"
    },
  "54836": {
     "Region":"山东"
    ,"Station":"沂源"
    },
  "54837": {
     "Region":"山东"
    ,"Station":"昌乐"
    },
  "54841": {
     "Region":"山东"
    ,"Station":"昌邑"
    },
  "54842": {
     "Region":"山东"
    ,"Station":"平度"
    },
  "54843": {
     "Region":"山东"
    ,"Station":"潍坊"
    },
  "54844": {
     "Region":"山东"
    ,"Station":"安丘"
    },
  "54846": {
     "Region":"山东"
    ,"Station":"高密"
    },
  "54848": {
     "Region":"山东"
    ,"Station":"诸城"
    },
  "54849": {
     "Region":"山东"
    ,"Station":"胶州"
    },
  "54851": {
     "Region":"山东"
    ,"Station":"莱西"
    },
  "54852": {
     "Region":"山东"
    ,"Station":"莱阳"
    },
  "54853": {
     "Region":"山东"
    ,"Station":"崂山"
    },
  "54855": {
     "Region":"山东"
    ,"Station":"即墨"
    },
  "54857": {
     "Region":"山东"
    ,"Station":"青岛"
    },
  "54861": {
     "Region":"山东"
    ,"Station":"乳山"
    },
  "54863": {
     "Region":"山东"
    ,"Station":"海阳"
    },
  "54871": {
     "Region":"山东"
    ,"Station":"石岛"
    },
  "54904": {
     "Region":"山东"
    ,"Station":"鄄城"
    },
  "54905": {
     "Region":"山东"
    ,"Station":"郓城"
    },
  "54906": {
     "Region":"山东"
    ,"Station":"菏泽"
    },
  "54907": {
     "Region":"山东"
    ,"Station":"鱼台"
    },
  "54908": {
     "Region":"山东"
    ,"Station":"东明"
    },
  "54909": {
     "Region":"山东"
    ,"Station":"定陶"
    },
  "54910": {
     "Region":"山东"
    ,"Station":"梁山"
    },
  "54911": {
     "Region":"山东"
    ,"Station":"东平"
    },
  "54912": {
     "Region":"山东"
    ,"Station":"汶上"
    },
  "54913": {
     "Region":"山东"
    ,"Station":"宁阳"
    },
  "54914": {
     "Region":"山东"
    ,"Station":"巨野"
    },
  "54915": {
     "Region":"山东"
    ,"Station":"济宁"
    },
  "54916": {
     "Region":"山东"
    ,"Station":"兖州"
    },
  "54917": {
     "Region":"山东"
    ,"Station":"金乡"
    },
  "54918": {
     "Region":"山东"
    ,"Station":"曲阜"
    },
  "54919": {
     "Region":"山东"
    ,"Station":"邹城"
    },
  "54920": {
     "Region":"山东"
    ,"Station":"泗水"
    },
  "54921": {
     "Region":"山东"
    ,"Station":"嘉祥"
    },
  "54922": {
     "Region":"山东"
    ,"Station":"新泰"
    },
  "54923": {
     "Region":"山东"
    ,"Station":"蒙阴"
    },
  "54925": {
     "Region":"山东"
    ,"Station":"平邑"
    },
  "54927": {
     "Region":"山东"
    ,"Station":"滕州"
    },
  "54929": {
     "Region":"山东"
    ,"Station":"费县"
    },
  "54932": {
     "Region":"山东"
    ,"Station":"沂水"
    },
  "54935": {
     "Region":"山东"
    ,"Station":"沂南"
    },
  "54936": {
     "Region":"山东"
    ,"Station":"莒县"
    },
  "54938": {
     "Region":"山东"
    ,"Station":"临沂"
    },
  "54939": {
     "Region":"山东"
    ,"Station":"莒南"
    },
  "54940": {
     "Region":"山东"
    ,"Station":"五莲"
    },
  "54943": {
     "Region":"山东"
    ,"Station":"胶南"
    },
  "54945": {
     "Region":"山东"
    ,"Station":"日照"
    },
  "58002": {
     "Region":"山东"
    ,"Station":"曹县"
    },
  "58003": {
     "Region":"山东"
    ,"Station":"成武"
    },
  "58011": {
     "Region":"山东"
    ,"Station":"单县"
    },
  "58020": {
     "Region":"山东"
    ,"Station":"微山"
    },
  "58021": {
     "Region":"山东"
    ,"Station":"薛城"
    },
  "58022": {
     "Region":"山东"
    ,"Station":"峄城"
    },
  "58024": {
     "Region":"山东"
    ,"Station":"枣庄"
    },
  "58025": {
     "Region":"山东"
    ,"Station":"台儿庄"
    },
  "58030": {
     "Region":"山东"
    ,"Station":"苍山"
    },
  "58032": {
     "Region":"山东"
    ,"Station":"临沭"
    },
  "58034": {
     "Region":"山东"
    ,"Station":"郯城"
    },
  "53478": {
     "Region":"山西"
    ,"Station":"右玉"
    },
  "53486": {
     "Region":"山西"
    ,"Station":"阳高"
    },
  "53487": {
     "Region":"山西"
    ,"Station":"大同"
    },
  "53488": {
     "Region":"山西"
    ,"Station":"大同县"
    },
  "53490": {
     "Region":"山西"
    ,"Station":"天镇"
    },
  "53564": {
     "Region":"山西"
    ,"Station":"河曲"
    },
  "53565": {
     "Region":"山西"
    ,"Station":"偏关"
    },
  "53573": {
     "Region":"山西"
    ,"Station":"左云"
    },
  "53574": {
     "Region":"山西"
    ,"Station":"平鲁"
    },
  "53575": {
     "Region":"山西"
    ,"Station":"神池"
    },
  "53576": {
     "Region":"山西"
    ,"Station":"山阴"
    },
  "53577": {
     "Region":"山西"
    ,"Station":"宁武"
    },
  "53578": {
     "Region":"山西"
    ,"Station":"朔州"
    },
  "53579": {
     "Region":"山西"
    ,"Station":"代县"
    },
  "53580": {
     "Region":"山西"
    ,"Station":"怀仁"
    },
  "53582": {
     "Region":"山西"
    ,"Station":"浑源"
    },
  "53584": {
     "Region":"山西"
    ,"Station":"应县"
    },
  "53585": {
     "Region":"山西"
    ,"Station":"繁峙"
    },
  "53588": {
     "Region":"山西"
    ,"Station":"五台山"
    },
  "53590": {
     "Region":"山西"
    ,"Station":"广灵"
    },
  "53594": {
     "Region":"山西"
    ,"Station":"灵丘"
    },
  "53659": {
     "Region":"山西"
    ,"Station":"临县"
    },
  "53660": {
     "Region":"山西"
    ,"Station":"保德"
    },
  "53662": {
     "Region":"山西"
    ,"Station":"岢岚"
    },
  "53663": {
     "Region":"山西"
    ,"Station":"五寨"
    },
  "53664": {
     "Region":"山西"
    ,"Station":"兴县"
    },
  "53665": {
     "Region":"山西"
    ,"Station":"岚县"
    },
  "53666": {
     "Region":"山西"
    ,"Station":"静乐"
    },
  "53669": {
     "Region":"山西"
    ,"Station":"娄烦"
    },
  "53673": {
     "Region":"山西"
    ,"Station":"原平"
    },
  "53674": {
     "Region":"山西"
    ,"Station":"忻州"
    },
  "53676": {
     "Region":"山西"
    ,"Station":"定襄"
    },
  "53677": {
     "Region":"山西"
    ,"Station":"太原北郊"
    },
  "53678": {
     "Region":"山西"
    ,"Station":"阳曲"
    },
  "53679": {
     "Region":"山西"
    ,"Station":"太原南郊"
    },
  "53681": {
     "Region":"山西"
    ,"Station":"五台县豆村"
    },
  "53685": {
     "Region":"山西"
    ,"Station":"盂县"
    },
  "53687": {
     "Region":"山西"
    ,"Station":"平定"
    },
  "53753": {
     "Region":"山西"
    ,"Station":"柳林"
    },
  "53759": {
     "Region":"山西"
    ,"Station":"石楼"
    },
  "53760": {
     "Region":"山西"
    ,"Station":"方山"
    },
  "53763": {
     "Region":"山西"
    ,"Station":"太原古交区"
    },
  "53764": {
     "Region":"山西"
    ,"Station":"离石"
    },
  "53767": {
     "Region":"山西"
    ,"Station":"中阳"
    },
  "53768": {
     "Region":"山西"
    ,"Station":"孝义"
    },
  "53769": {
     "Region":"山西"
    ,"Station":"汾阳"
    },
  "53770": {
     "Region":"山西"
    ,"Station":"祁县"
    },
  "53771": {
     "Region":"山西"
    ,"Station":"文水"
    },
  "53772": {
     "Region":"山西"
    ,"Station":"太原"
    },
  "53774": {
     "Region":"山西"
    ,"Station":"清徐"
    },
  "53775": {
     "Region":"山西"
    ,"Station":"太谷"
    },
  "53776": {
     "Region":"山西"
    ,"Station":"榆次"
    },
  "53777": {
     "Region":"山西"
    ,"Station":"交城"
    },
  "53778": {
     "Region":"山西"
    ,"Station":"平遥"
    },
  "53780": {
     "Region":"山西"
    ,"Station":"寿阳"
    },
  "53782": {
     "Region":"山西"
    ,"Station":"阳泉"
    },
  "53783": {
     "Region":"山西"
    ,"Station":"昔阳"
    },
  "53786": {
     "Region":"山西"
    ,"Station":"左权"
    },
  "53787": {
     "Region":"山西"
    ,"Station":"榆社"
    },
  "53788": {
     "Region":"山西"
    ,"Station":"和顺"
    },
  "53852": {
     "Region":"山西"
    ,"Station":"永和"
    },
  "53853": {
     "Region":"山西"
    ,"Station":"隰县"
    },
  "53856": {
     "Region":"山西"
    ,"Station":"大宁"
    },
  "53859": {
     "Region":"山西"
    ,"Station":"吉县"
    },
  "53860": {
     "Region":"山西"
    ,"Station":"交口"
    },
  "53861": {
     "Region":"山西"
    ,"Station":"襄汾"
    },
  "53862": {
     "Region":"山西"
    ,"Station":"灵石"
    },
  "53863": {
     "Region":"山西"
    ,"Station":"介休"
    },
  "53864": {
     "Region":"山西"
    ,"Station":"蒲县"
    },
  "53865": {
     "Region":"山西"
    ,"Station":"汾西"
    },
  "53866": {
     "Region":"山西"
    ,"Station":"洪洞"
    },
  "53868": {
     "Region":"山西"
    ,"Station":"临汾"
    },
  "53869": {
     "Region":"山西"
    ,"Station":"霍州"
    },
  "53871": {
     "Region":"山西"
    ,"Station":"武乡"
    },
  "53872": {
     "Region":"山西"
    ,"Station":"沁县"
    },
  "53873": {
     "Region":"山西"
    ,"Station":"长子"
    },
  "53874": {
     "Region":"山西"
    ,"Station":"古县"
    },
  "53875": {
     "Region":"山西"
    ,"Station":"沁源"
    },
  "53877": {
     "Region":"山西"
    ,"Station":"安泽"
    },
  "53878": {
     "Region":"山西"
    ,"Station":"黎城"
    },
  "53879": {
     "Region":"山西"
    ,"Station":"屯留"
    },
  "53880": {
     "Region":"山西"
    ,"Station":"潞城"
    },
  "53882": {
     "Region":"山西"
    ,"Station":"长治"
    },
  "53884": {
     "Region":"山西"
    ,"Station":"襄垣"
    },
  "53885": {
     "Region":"山西"
    ,"Station":"壶关"
    },
  "53888": {
     "Region":"山西"
    ,"Station":"平顺"
    },
  "53953": {
     "Region":"山西"
    ,"Station":"乡宁"
    },
  "53954": {
     "Region":"山西"
    ,"Station":"稷山"
    },
  "53956": {
     "Region":"山西"
    ,"Station":"万荣"
    },
  "53957": {
     "Region":"山西"
    ,"Station":"河津"
    },
  "53958": {
     "Region":"山西"
    ,"Station":"临猗"
    },
  "53959": {
     "Region":"山西"
    ,"Station":"运城"
    },
  "53961": {
     "Region":"山西"
    ,"Station":"曲沃"
    },
  "53962": {
     "Region":"山西"
    ,"Station":"翼城"
    },
  "53963": {
     "Region":"山西"
    ,"Station":"侯马"
    },
  "53964": {
     "Region":"山西"
    ,"Station":"新绛"
    },
  "53965": {
     "Region":"山西"
    ,"Station":"绛县"
    },
  "53966": {
     "Region":"山西"
    ,"Station":"浮山"
    },
  "53967": {
     "Region":"山西"
    ,"Station":"闻喜"
    },
  "53968": {
     "Region":"山西"
    ,"Station":"垣曲"
    },
  "53970": {
     "Region":"山西"
    ,"Station":"沁水"
    },
  "53973": {
     "Region":"山西"
    ,"Station":"高平"
    },
  "53975": {
     "Region":"山西"
    ,"Station":"阳城"
    },
  "53976": {
     "Region":"山西"
    ,"Station":"晋城"
    },
  "53981": {
     "Region":"山西"
    ,"Station":"陵川"
    },
  "57052": {
     "Region":"山西"
    ,"Station":"永济"
    },
  "57053": {
     "Region":"山西"
    ,"Station":"芮城"
    },
  "57060": {
     "Region":"山西"
    ,"Station":"夏县"
    },
  "57061": {
     "Region":"山西"
    ,"Station":"平陆"
    },
  "53567": {
     "Region":"陕西"
    ,"Station":"府谷"
    },
  "53646": {
     "Region":"陕西"
    ,"Station":"榆林"
    },
  "53651": {
     "Region":"陕西"
    ,"Station":"神木"
    },
  "53658": {
     "Region":"陕西"
    ,"Station":"佳县"
    },
  "53725": {
     "Region":"陕西"
    ,"Station":"定边"
    },
  "53735": {
     "Region":"陕西"
    ,"Station":"靖边"
    },
  "53738": {
     "Region":"陕西"
    ,"Station":"吴旗"
    },
  "53740": {
     "Region":"陕西"
    ,"Station":"横山"
    },
  "53748": {
     "Region":"陕西"
    ,"Station":"子长"
    },
  "53750": {
     "Region":"陕西"
    ,"Station":"米脂"
    },
  "53751": {
     "Region":"陕西"
    ,"Station":"子洲"
    },
  "53754": {
     "Region":"陕西"
    ,"Station":"绥德"
    },
  "53756": {
     "Region":"陕西"
    ,"Station":"吴堡"
    },
  "53757": {
     "Region":"陕西"
    ,"Station":"清涧"
    },
  "53832": {
     "Region":"陕西"
    ,"Station":"志丹"
    },
  "53841": {
     "Region":"陕西"
    ,"Station":"安塞"
    },
  "53845": {
     "Region":"陕西"
    ,"Station":"延安"
    },
  "53848": {
     "Region":"陕西"
    ,"Station":"甘泉"
    },
  "53850": {
     "Region":"陕西"
    ,"Station":"延川"
    },
  "53854": {
     "Region":"陕西"
    ,"Station":"延长"
    },
  "53857": {
     "Region":"陕西"
    ,"Station":"宜川"
    },
  "53929": {
     "Region":"陕西"
    ,"Station":"长武"
    },
  "53931": {
     "Region":"陕西"
    ,"Station":"富县"
    },
  "53938": {
     "Region":"陕西"
    ,"Station":"旬邑"
    },
  "53941": {
     "Region":"陕西"
    ,"Station":"白水"
    },
  "53942": {
     "Region":"陕西"
    ,"Station":"洛川"
    },
  "53944": {
     "Region":"陕西"
    ,"Station":"黄陵"
    },
  "53945": {
     "Region":"陕西"
    ,"Station":"宜君"
    },
  "53946": {
     "Region":"陕西"
    ,"Station":"黄龙"
    },
  "53947": {
     "Region":"陕西"
    ,"Station":"铜川"
    },
  "53948": {
     "Region":"陕西"
    ,"Station":"蒲城"
    },
  "53949": {
     "Region":"陕西"
    ,"Station":"澄城"
    },
  "53950": {
     "Region":"陕西"
    ,"Station":"合阳"
    },
  "53955": {
     "Region":"陕西"
    ,"Station":"韩城"
    },
  "57003": {
     "Region":"陕西"
    ,"Station":"陇县"
    },
  "57016": {
     "Region":"陕西"
    ,"Station":"宝鸡"
    },
  "57020": {
     "Region":"陕西"
    ,"Station":"宝鸡县"
    },
  "57021": {
     "Region":"陕西"
    ,"Station":"千阳"
    },
  "57022": {
     "Region":"陕西"
    ,"Station":"麟游"
    },
  "57023": {
     "Region":"陕西"
    ,"Station":"彬县"
    },
  "57024": {
     "Region":"陕西"
    ,"Station":"岐山"
    },
  "57025": {
     "Region":"陕西"
    ,"Station":"凤翔"
    },
  "57026": {
     "Region":"陕西"
    ,"Station":"扶风"
    },
  "57027": {
     "Region":"陕西"
    ,"Station":"眉县"
    },
  "57028": {
     "Region":"陕西"
    ,"Station":"太白"
    },
  "57029": {
     "Region":"陕西"
    ,"Station":"礼泉"
    },
  "57030": {
     "Region":"陕西"
    ,"Station":"永寿"
    },
  "57031": {
     "Region":"陕西"
    ,"Station":"淳化"
    },
  "57032": {
     "Region":"陕西"
    ,"Station":"周至"
    },
  "57033": {
     "Region":"陕西"
    ,"Station":"泾阳"
    },
  "57034": {
     "Region":"陕西"
    ,"Station":"武功"
    },
  "57035": {
     "Region":"陕西"
    ,"Station":"乾县"
    },
  "57036": {
     "Region":"陕西"
    ,"Station":"西安"
    },
  "57037": {
     "Region":"陕西"
    ,"Station":"耀县"
    },
  "57038": {
     "Region":"陕西"
    ,"Station":"兴平"
    },
  "57039": {
     "Region":"陕西"
    ,"Station":"长安"
    },
  "57040": {
     "Region":"陕西"
    ,"Station":"高陵"
    },
  "57041": {
     "Region":"陕西"
    ,"Station":"三原"
    },
  "57042": {
     "Region":"陕西"
    ,"Station":"富平"
    },
  "57043": {
     "Region":"陕西"
    ,"Station":"大荔"
    },
  "57044": {
     "Region":"陕西"
    ,"Station":"临潼"
    },
  "57045": {
     "Region":"陕西"
    ,"Station":"渭南"
    },
  "57046": {
     "Region":"陕西"
    ,"Station":"华山"
    },
  "57047": {
     "Region":"陕西"
    ,"Station":"蓝田"
    },
  "57048": {
     "Region":"陕西"
    ,"Station":"秦都"
    },
  "57049": {
     "Region":"陕西"
    ,"Station":"华县"
    },
  "57054": {
     "Region":"陕西"
    ,"Station":"潼关"
    },
  "57055": {
     "Region":"陕西"
    ,"Station":"华阴"
    },
  "57057": {
     "Region":"陕西"
    ,"Station":"洛南"
    },
  "57106": {
     "Region":"陕西"
    ,"Station":"略阳"
    },
  "57113": {
     "Region":"陕西"
    ,"Station":"凤县"
    },
  "57119": {
     "Region":"陕西"
    ,"Station":"勉县"
    },
  "57123": {
     "Region":"陕西"
    ,"Station":"杨凌"
    },
  "57124": {
     "Region":"陕西"
    ,"Station":"留坝"
    },
  "57126": {
     "Region":"陕西"
    ,"Station":"洋县"
    },
  "57127": {
     "Region":"陕西"
    ,"Station":"汉中"
    },
  "57128": {
     "Region":"陕西"
    ,"Station":"城固"
    },
  "57129": {
     "Region":"陕西"
    ,"Station":"西乡"
    },
  "57131": {
     "Region":"陕西"
    ,"Station":"泾河"
    },
  "57132": {
     "Region":"陕西"
    ,"Station":"户县"
    },
  "57134": {
     "Region":"陕西"
    ,"Station":"佛坪"
    },
  "57137": {
     "Region":"陕西"
    ,"Station":"宁陕"
    },
  "57140": {
     "Region":"陕西"
    ,"Station":"柞水"
    },
  "57143": {
     "Region":"陕西"
    ,"Station":"商县"
    },
  "57144": {
     "Region":"陕西"
    ,"Station":"镇安"
    },
  "57153": {
     "Region":"陕西"
    ,"Station":"丹凤"
    },
  "57154": {
     "Region":"陕西"
    ,"Station":"商南"
    },
  "57155": {
     "Region":"陕西"
    ,"Station":"山阳"
    },
  "57211": {
     "Region":"陕西"
    ,"Station":"宁强"
    },
  "57213": {
     "Region":"陕西"
    ,"Station":"南郑"
    },
  "57231": {
     "Region":"陕西"
    ,"Station":"紫阳"
    },
  "57232": {
     "Region":"陕西"
    ,"Station":"石泉"
    },
  "57233": {
     "Region":"陕西"
    ,"Station":"汉阴"
    },
  "57238": {
     "Region":"陕西"
    ,"Station":"镇巴"
    },
  "57242": {
     "Region":"陕西"
    ,"Station":"旬阳"
    },
  "57245": {
     "Region":"陕西"
    ,"Station":"安康"
    },
  "57247": {
     "Region":"陕西"
    ,"Station":"岚皋"
    },
  "57248": {
     "Region":"陕西"
    ,"Station":"平利"
    },
  "57254": {
     "Region":"陕西"
    ,"Station":"白河"
    },
  "57343": {
     "Region":"陕西"
    ,"Station":"镇坪"
    },
  "58361": {
     "Region":"上海"
    ,"Station":"闵行"
    },
  "58362": {
     "Region":"上海"
    ,"Station":"宝山"
    },
  "58365": {
     "Region":"上海"
    ,"Station":"嘉定"
    },
  "58366": {
     "Region":"上海"
    ,"Station":"崇明"
    },
  "58367": {
     "Region":"上海"
    ,"Station":"徐家汇"
    },
  "58369": {
     "Region":"上海"
    ,"Station":"南汇"
    },
  "58370": {
     "Region":"上海"
    ,"Station":"浦东"
    },
  "58460": {
     "Region":"上海"
    ,"Station":"金山"
    },
  "58461": {
     "Region":"上海"
    ,"Station":"青浦"
    },
  "58462": {
     "Region":"上海"
    ,"Station":"松江"
    },
  "58463": {
     "Region":"上海"
    ,"Station":"奉贤"
    },
  "58474": {
     "Region":"上海"
    ,"Station":"小洋山"
    },
  "56038": {
     "Region":"四川"
    ,"Station":"石渠"
    },
  "56079": {
     "Region":"四川"
    ,"Station":"若尔盖"
    },
  "56097": {
     "Region":"四川"
    ,"Station":"九寨沟"
    },
  "56144": {
     "Region":"四川"
    ,"Station":"德格"
    },
  "56146": {
     "Region":"四川"
    ,"Station":"甘孜"
    },
  "56147": {
     "Region":"四川"
    ,"Station":"白玉"
    },
  "56152": {
     "Region":"四川"
    ,"Station":"色达"
    },
  "56158": {
     "Region":"四川"
    ,"Station":"炉霍"
    },
  "56164": {
     "Region":"四川"
    ,"Station":"壤塘"
    },
  "56167": {
     "Region":"四川"
    ,"Station":"道孚"
    },
  "56168": {
     "Region":"四川"
    ,"Station":"金川"
    },
  "56171": {
     "Region":"四川"
    ,"Station":"阿坝"
    },
  "56172": {
     "Region":"四川"
    ,"Station":"马尔康"
    },
  "56173": {
     "Region":"四川"
    ,"Station":"红原"
    },
  "56178": {
     "Region":"四川"
    ,"Station":"小金"
    },
  "56180": {
     "Region":"四川"
    ,"Station":"茂县"
    },
  "56181": {
     "Region":"四川"
    ,"Station":"崇州"
    },
  "56182": {
     "Region":"四川"
    ,"Station":"松潘"
    },
  "56183": {
     "Region":"四川"
    ,"Station":"汶川"
    },
  "56184": {
     "Region":"四川"
    ,"Station":"理县"
    },
  "56185": {
     "Region":"四川"
    ,"Station":"黑水"
    },
  "56186": {
     "Region":"四川"
    ,"Station":"绵竹"
    },
  "56187": {
     "Region":"四川"
    ,"Station":"温江"
    },
  "56188": {
     "Region":"四川"
    ,"Station":"都江堰"
    },
  "56189": {
     "Region":"四川"
    ,"Station":"彭州"
    },
  "56190": {
     "Region":"四川"
    ,"Station":"安县"
    },
  "56193": {
     "Region":"四川"
    ,"Station":"平武"
    },
  "56194": {
     "Region":"四川"
    ,"Station":"北川"
    },
  "56195": {
     "Region":"四川"
    ,"Station":"江油"
    },
  "56196": {
     "Region":"四川"
    ,"Station":"绵阳"
    },
  "56197": {
     "Region":"四川"
    ,"Station":"什邡"
    },
  "56198": {
     "Region":"四川"
    ,"Station":"德阳"
    },
  "56199": {
     "Region":"四川"
    ,"Station":"中江"
    },
  "56247": {
     "Region":"四川"
    ,"Station":"巴塘"
    },
  "56251": {
     "Region":"四川"
    ,"Station":"新龙"
    },
  "56257": {
     "Region":"四川"
    ,"Station":"理塘"
    },
  "56263": {
     "Region":"四川"
    ,"Station":"丹巴"
    },
  "56267": {
     "Region":"四川"
    ,"Station":"雅江"
    },
  "56272": {
     "Region":"四川"
    ,"Station":"郫县"
    },
  "56273": {
     "Region":"四川"
    ,"Station":"宝兴"
    },
  "56276": {
     "Region":"四川"
    ,"Station":"新津"
    },
  "56278": {
     "Region":"四川"
    ,"Station":"天全"
    },
  "56279": {
     "Region":"四川"
    ,"Station":"芦山"
    },
  "56280": {
     "Region":"四川"
    ,"Station":"名山"
    },
  "56281": {
     "Region":"四川"
    ,"Station":"蒲江"
    },
  "56284": {
     "Region":"四川"
    ,"Station":"邛崃"
    },
  "56285": {
     "Region":"四川"
    ,"Station":"大邑"
    },
  "56286": {
     "Region":"四川"
    ,"Station":"龙泉驿"
    },
  "56287": {
     "Region":"四川"
    ,"Station":"雅安"
    },
  "56288": {
     "Region":"四川"
    ,"Station":"双流"
    },
  "56289": {
     "Region":"四川"
    ,"Station":"彭山"
    },
  "56290": {
     "Region":"四川"
    ,"Station":"新都"
    },
  "56291": {
     "Region":"四川"
    ,"Station":"广汉"
    },
  "56294": {
     "Region":"四川"
    ,"Station":"成都"
    },
  "56295": {
     "Region":"四川"
    ,"Station":"简阳"
    },
  "56296": {
     "Region":"四川"
    ,"Station":"金堂"
    },
  "56297": {
     "Region":"四川"
    ,"Station":"仁寿"
    },
  "56298": {
     "Region":"四川"
    ,"Station":"资阳"
    },
  "56357": {
     "Region":"四川"
    ,"Station":"稻城"
    },
  "56371": {
     "Region":"四川"
    ,"Station":"泸定"
    },
  "56373": {
     "Region":"四川"
    ,"Station":"荥经"
    },
  "56374": {
     "Region":"四川"
    ,"Station":"康定"
    },
  "56376": {
     "Region":"四川"
    ,"Station":"汉源"
    },
  "56378": {
     "Region":"四川"
    ,"Station":"石棉"
    },
  "56380": {
     "Region":"四川"
    ,"Station":"洪雅"
    },
  "56381": {
     "Region":"四川"
    ,"Station":"丹棱"
    },
  "56382": {
     "Region":"四川"
    ,"Station":"夹江"
    },
  "56383": {
     "Region":"四川"
    ,"Station":"青神"
    },
  "56384": {
     "Region":"四川"
    ,"Station":"峨眉"
    },
  "56385": {
     "Region":"四川"
    ,"Station":"峨眉山"
    },
  "56386": {
     "Region":"四川"
    ,"Station":"乐山"
    },
  "56387": {
     "Region":"四川"
    ,"Station":"峨边"
    },
  "56389": {
     "Region":"四川"
    ,"Station":"犍为"
    },
  "56390": {
     "Region":"四川"
    ,"Station":"井研"
    },
  "56391": {
     "Region":"四川"
    ,"Station":"眉山"
    },
  "56393": {
     "Region":"四川"
    ,"Station":"资中"
    },
  "56394": {
     "Region":"四川"
    ,"Station":"荣县"
    },
  "56395": {
     "Region":"四川"
    ,"Station":"威远"
    },
  "56396": {
     "Region":"四川"
    ,"Station":"自贡"
    },
  "56399": {
     "Region":"四川"
    ,"Station":"富顺"
    },
  "56441": {
     "Region":"四川"
    ,"Station":"得荣"
    },
  "56443": {
     "Region":"四川"
    ,"Station":"乡城"
    },
  "56459": {
     "Region":"四川"
    ,"Station":"木里"
    },
  "56462": {
     "Region":"四川"
    ,"Station":"九龙"
    },
  "56473": {
     "Region":"四川"
    ,"Station":"甘洛"
    },
  "56474": {
     "Region":"四川"
    ,"Station":"冕宁"
    },
  "56475": {
     "Region":"四川"
    ,"Station":"越西"
    },
  "56478": {
     "Region":"四川"
    ,"Station":"喜德"
    },
  "56479": {
     "Region":"四川"
    ,"Station":"昭觉"
    },
  "56480": {
     "Region":"四川"
    ,"Station":"马边"
    },
  "56485": {
     "Region":"四川"
    ,"Station":"雷波"
    },
  "56487": {
     "Region":"四川"
    ,"Station":"美姑"
    },
  "56490": {
     "Region":"四川"
    ,"Station":"沐川"
    },
  "56491": {
     "Region":"四川"
    ,"Station":"宜宾县"
    },
  "56492": {
     "Region":"四川"
    ,"Station":"宜宾"
    },
  "56493": {
     "Region":"四川"
    ,"Station":"南溪"
    },
  "56494": {
     "Region":"四川"
    ,"Station":"屏山"
    },
  "56496": {
     "Region":"四川"
    ,"Station":"兴文"
    },
  "56498": {
     "Region":"四川"
    ,"Station":"筠连"
    },
  "56499": {
     "Region":"四川"
    ,"Station":"珙县"
    },
  "56565": {
     "Region":"四川"
    ,"Station":"盐源"
    },
  "56569": {
     "Region":"四川"
    ,"Station":"德昌"
    },
  "56571": {
     "Region":"四川"
    ,"Station":"西昌"
    },
  "56575": {
     "Region":"四川"
    ,"Station":"普格"
    },
  "56578": {
     "Region":"四川"
    ,"Station":"宁南"
    },
  "56580": {
     "Region":"四川"
    ,"Station":"布拖"
    },
  "56584": {
     "Region":"四川"
    ,"Station":"金阳"
    },
  "56592": {
     "Region":"四川"
    ,"Station":"高县"
    },
  "56593": {
     "Region":"四川"
    ,"Station":"长宁"
    },
  "56665": {
     "Region":"四川"
    ,"Station":"盐边"
    },
  "56666": {
     "Region":"四川"
    ,"Station":"攀枝花"
    },
  "56670": {
     "Region":"四川"
    ,"Station":"米易"
    },
  "56671": {
     "Region":"四川"
    ,"Station":"会理"
    },
  "56674": {
     "Region":"四川"
    ,"Station":"仁和"
    },
  "56675": {
     "Region":"四川"
    ,"Station":"会东"
    },
  "57204": {
     "Region":"四川"
    ,"Station":"青川"
    },
  "57206": {
     "Region":"四川"
    ,"Station":"广元"
    },
  "57208": {
     "Region":"四川"
    ,"Station":"剑阁"
    },
  "57216": {
     "Region":"四川"
    ,"Station":"南江"
    },
  "57217": {
     "Region":"四川"
    ,"Station":"旺苍"
    },
  "57237": {
     "Region":"四川"
    ,"Station":"万源"
    },
  "57303": {
     "Region":"四川"
    ,"Station":"苍溪"
    },
  "57304": {
     "Region":"四川"
    ,"Station":"梓潼"
    },
  "57306": {
     "Region":"四川"
    ,"Station":"阆中"
    },
  "57307": {
     "Region":"四川"
    ,"Station":"三台"
    },
  "57308": {
     "Region":"四川"
    ,"Station":"盐亭"
    },
  "57309": {
     "Region":"四川"
    ,"Station":"西充"
    },
  "57313": {
     "Region":"四川"
    ,"Station":"巴中"
    },
  "57314": {
     "Region":"四川"
    ,"Station":"南部"
    },
  "57315": {
     "Region":"四川"
    ,"Station":"仪陇"
    },
  "57317": {
     "Region":"四川"
    ,"Station":"蓬安"
    },
  "57318": {
     "Region":"四川"
    ,"Station":"营山"
    },
  "57320": {
     "Region":"四川"
    ,"Station":"通江"
    },
  "57324": {
     "Region":"四川"
    ,"Station":"平昌"
    },
  "57326": {
     "Region":"四川"
    ,"Station":"宣汉"
    },
  "57328": {
     "Region":"四川"
    ,"Station":"达县"
    },
  "57329": {
     "Region":"四川"
    ,"Station":"开江"
    },
  "57401": {
     "Region":"四川"
    ,"Station":"射洪"
    },
  "57402": {
     "Region":"四川"
    ,"Station":"蓬溪"
    },
  "57405": {
     "Region":"四川"
    ,"Station":"遂宁"
    },
  "57407": {
     "Region":"四川"
    ,"Station":"乐至"
    },
  "57408": {
     "Region":"四川"
    ,"Station":"安岳"
    },
  "57411": {
     "Region":"四川"
    ,"Station":"高坪"
    },
  "57413": {
     "Region":"四川"
    ,"Station":"渠县"
    },
  "57414": {
     "Region":"四川"
    ,"Station":"岳池"
    },
  "57415": {
     "Region":"四川"
    ,"Station":"广安"
    },
  "57416": {
     "Region":"四川"
    ,"Station":"邻水"
    },
  "57417": {
     "Region":"四川"
    ,"Station":"武胜"
    },
  "57420": {
     "Region":"四川"
    ,"Station":"大竹"
    },
  "57503": {
     "Region":"四川"
    ,"Station":"东兴区"
    },
  "57504": {
     "Region":"四川"
    ,"Station":"内江"
    },
  "57507": {
     "Region":"四川"
    ,"Station":"隆昌"
    },
  "57508": {
     "Region":"四川"
    ,"Station":"泸县"
    },
  "57600": {
     "Region":"四川"
    ,"Station":"江安"
    },
  "57602": {
     "Region":"四川"
    ,"Station":"泸州"
    },
  "57603": {
     "Region":"四川"
    ,"Station":"合江"
    },
  "57604": {
     "Region":"四川"
    ,"Station":"纳溪"
    },
  "57605": {
     "Region":"四川"
    ,"Station":"古蔺"
    },
  "57608": {
     "Region":"四川"
    ,"Station":"叙永"
    },
  "58968": {
     "Region":"台湾"
    ,"Station":""
    },
  "58974": {
     "Region":"台湾"
    ,"Station":""
    },
  "59158": {
     "Region":"台湾"
    ,"Station":""
    },
  "59358": {
     "Region":"台湾"
    ,"Station":""
    },
  "59559": {
     "Region":"台湾"
    ,"Station":""
    },
  "59562": {
     "Region":"台湾"
    ,"Station":""
    },
  "59567": {
     "Region":"台湾"
    ,"Station":""
    },
  "54428": {
     "Region":"天津"
    ,"Station":"蓟县"
    },
  "54517": {
     "Region":"天津"
    ,"Station":"天津市城市气候监测站"
    },
  "54523": {
     "Region":"天津"
    ,"Station":"武清"
    },
  "54525": {
     "Region":"天津"
    ,"Station":"宝坻"
    },
  "54526": {
     "Region":"天津"
    ,"Station":"东丽区"
    },
  "54527": {
     "Region":"天津"
    ,"Station":"天津"
    },
  "54528": {
     "Region":"天津"
    ,"Station":"北辰区"
    },
  "54529": {
     "Region":"天津"
    ,"Station":"宁河"
    },
  "54530": {
     "Region":"天津"
    ,"Station":"汉沽区"
    },
  "54619": {
     "Region":"天津"
    ,"Station":"静海"
    },
  "54622": {
     "Region":"天津"
    ,"Station":"津南区"
    },
  "54623": {
     "Region":"天津"
    ,"Station":"塘沽"
    },
  "54645": {
     "Region":"天津"
    ,"Station":"大港"
    },
  "54646": {
     "Region":"天津"
    ,"Station":"渤海A平台"
    },
  "55228": {
     "Region":"西藏"
    ,"Station":"狮泉河"
    },
  "55248": {
     "Region":"西藏"
    ,"Station":"改则"
    },
  "55279": {
     "Region":"西藏"
    ,"Station":"班戈"
    },
  "55294": {
     "Region":"西藏"
    ,"Station":"安多"
    },
  "55299": {
     "Region":"西藏"
    ,"Station":"那曲"
    },
  "55437": {
     "Region":"西藏"
    ,"Station":"普兰"
    },
  "55472": {
     "Region":"西藏"
    ,"Station":"申扎"
    },
  "55493": {
     "Region":"西藏"
    ,"Station":"当雄"
    },
  "55569": {
     "Region":"西藏"
    ,"Station":"拉孜"
    },
  "55572": {
     "Region":"西藏"
    ,"Station":"南木林"
    },
  "55578": {
     "Region":"西藏"
    ,"Station":"日喀则"
    },
  "55585": {
     "Region":"西藏"
    ,"Station":"尼木"
    },
  "55589": {
     "Region":"西藏"
    ,"Station":"贡嘎"
    },
  "55591": {
     "Region":"西藏"
    ,"Station":"拉萨"
    },
  "55593": {
     "Region":"西藏"
    ,"Station":"墨竹工卡"
    },
  "55597": {
     "Region":"西藏"
    ,"Station":"琼结"
    },
  "55598": {
     "Region":"西藏"
    ,"Station":"泽当"
    },
  "55655": {
     "Region":"西藏"
    ,"Station":"聂拉木"
    },
  "55664": {
     "Region":"西藏"
    ,"Station":"定日"
    },
  "55680": {
     "Region":"西藏"
    ,"Station":"江孜"
    },
  "55681": {
     "Region":"西藏"
    ,"Station":"浪卡子"
    },
  "55690": {
     "Region":"西藏"
    ,"Station":"错那"
    },
  "55696": {
     "Region":"西藏"
    ,"Station":"隆子"
    },
  "55773": {
     "Region":"西藏"
    ,"Station":"帕里"
    },
  "56106": {
     "Region":"西藏"
    ,"Station":"索县"
    },
  "56109": {
     "Region":"西藏"
    ,"Station":"比如"
    },
  "56116": {
     "Region":"西藏"
    ,"Station":"丁青"
    },
  "56128": {
     "Region":"西藏"
    ,"Station":"类乌齐"
    },
  "56137": {
     "Region":"西藏"
    ,"Station":"昌都"
    },
  "56202": {
     "Region":"西藏"
    ,"Station":"嘉黎"
    },
  "56223": {
     "Region":"西藏"
    ,"Station":"洛隆"
    },
  "56227": {
     "Region":"西藏"
    ,"Station":"波密"
    },
  "56228": {
     "Region":"西藏"
    ,"Station":"八宿"
    },
  "56307": {
     "Region":"西藏"
    ,"Station":"加查"
    },
  "56312": {
     "Region":"西藏"
    ,"Station":"林芝"
    },
  "56317": {
     "Region":"西藏"
    ,"Station":"米林"
    },
  "56331": {
     "Region":"西藏"
    ,"Station":"左贡"
    },
  "56342": {
     "Region":"西藏"
    ,"Station":"芒康"
    },
  "56434": {
     "Region":"西藏"
    ,"Station":"察隅"
    },
  "51053": {
     "Region":"新疆"
    ,"Station":"哈巴河"
    },
  "51058": {
     "Region":"新疆"
    ,"Station":"阿克达拉"
    },
  "51059": {
     "Region":"新疆"
    ,"Station":"吉木乃"
    },
  "51060": {
     "Region":"新疆"
    ,"Station":"布尔津"
    },
  "51068": {
     "Region":"新疆"
    ,"Station":"福海"
    },
  "51076": {
     "Region":"新疆"
    ,"Station":"阿勒泰"
    },
  "51087": {
     "Region":"新疆"
    ,"Station":"富蕴"
    },
  "51133": {
     "Region":"新疆"
    ,"Station":"塔城"
    },
  "51137": {
     "Region":"新疆"
    ,"Station":"裕民"
    },
  "51145": {
     "Region":"新疆"
    ,"Station":"额敏"
    },
  "51156": {
     "Region":"新疆"
    ,"Station":"和布克赛尔"
    },
  "51186": {
     "Region":"新疆"
    ,"Station":"青河"
    },
  "51232": {
     "Region":"新疆"
    ,"Station":"阿拉山口"
    },
  "51238": {
     "Region":"新疆"
    ,"Station":"博乐"
    },
  "51241": {
     "Region":"新疆"
    ,"Station":"托里"
    },
  "51243": {
     "Region":"新疆"
    ,"Station":"克拉玛依"
    },
  "51288": {
     "Region":"新疆"
    ,"Station":"北塔山"
    },
  "51328": {
     "Region":"新疆"
    ,"Station":"霍尔果斯"
    },
  "51329": {
     "Region":"新疆"
    ,"Station":"霍城"
    },
  "51330": {
     "Region":"新疆"
    ,"Station":"温泉"
    },
  "51334": {
     "Region":"新疆"
    ,"Station":"精河"
    },
  "51346": {
     "Region":"新疆"
    ,"Station":"乌苏"
    },
  "51352": {
     "Region":"新疆"
    ,"Station":"炮台"
    },
  "51353": {
     "Region":"新疆"
    ,"Station":"莫索湾"
    },
  "51356": {
     "Region":"新疆"
    ,"Station":"石河子"
    },
  "51357": {
     "Region":"新疆"
    ,"Station":"沙湾"
    },
  "51358": {
     "Region":"新疆"
    ,"Station":"乌兰乌苏"
    },
  "51359": {
     "Region":"新疆"
    ,"Station":"玛纳斯"
    },
  "51365": {
     "Region":"新疆"
    ,"Station":"蔡家湖"
    },
  "51367": {
     "Region":"新疆"
    ,"Station":"呼图壁"
    },
  "51368": {
     "Region":"新疆"
    ,"Station":"昌吉"
    },
  "51369": {
     "Region":"新疆"
    ,"Station":"米泉"
    },
  "51377": {
     "Region":"新疆"
    ,"Station":"阜康"
    },
  "51378": {
     "Region":"新疆"
    ,"Station":"吉木萨尔"
    },
  "51379": {
     "Region":"新疆"
    ,"Station":"奇台"
    },
  "51430": {
     "Region":"新疆"
    ,"Station":"察布查尔"
    },
  "51431": {
     "Region":"新疆"
    ,"Station":"伊宁"
    },
  "51433": {
     "Region":"新疆"
    ,"Station":"尼勒克"
    },
  "51434": {
     "Region":"新疆"
    ,"Station":"伊宁县"
    },
  "51435": {
     "Region":"新疆"
    ,"Station":"巩留"
    },
  "51436": {
     "Region":"新疆"
    ,"Station":"新源"
    },
  "51437": {
     "Region":"新疆"
    ,"Station":"昭苏"
    },
  "51438": {
     "Region":"新疆"
    ,"Station":"特克斯"
    },
  "51463": {
     "Region":"新疆"
    ,"Station":"乌鲁木齐"
    },
  "51465": {
     "Region":"新疆"
    ,"Station":"小渠子"
    },
  "51467": {
     "Region":"新疆"
    ,"Station":"巴仑台"
    },
  "51468": {
     "Region":"新疆"
    ,"Station":"天山大西沟"
    },
  "51469": {
     "Region":"新疆"
    ,"Station":"乌鲁木齐牧试站"
    },
  "51470": {
     "Region":"新疆"
    ,"Station":"天池"
    },
  "51477": {
     "Region":"新疆"
    ,"Station":"达坂城"
    },
  "51482": {
     "Region":"新疆"
    ,"Station":"木垒"
    },
  "51495": {
     "Region":"新疆"
    ,"Station":"十三间房"
    },
  "51526": {
     "Region":"新疆"
    ,"Station":"库米什"
    },
  "51542": {
     "Region":"新疆"
    ,"Station":"巴音布鲁克"
    },
  "51559": {
     "Region":"新疆"
    ,"Station":"和静"
    },
  "51567": {
     "Region":"新疆"
    ,"Station":"焉耆"
    },
  "51568": {
     "Region":"新疆"
    ,"Station":"和硕"
    },
  "51571": {
     "Region":"新疆"
    ,"Station":"托克逊"
    },
  "51572": {
     "Region":"新疆"
    ,"Station":"吐鲁番东坎"
    },
  "51573": {
     "Region":"新疆"
    ,"Station":"吐鲁番"
    },
  "51581": {
     "Region":"新疆"
    ,"Station":"鄯善"
    },
  "51627": {
     "Region":"新疆"
    ,"Station":"乌什"
    },
  "51628": {
     "Region":"新疆"
    ,"Station":"阿克苏"
    },
  "51629": {
     "Region":"新疆"
    ,"Station":"温宿"
    },
  "51633": {
     "Region":"新疆"
    ,"Station":"拜城"
    },
  "51636": {
     "Region":"新疆"
    ,"Station":"新和"
    },
  "51639": {
     "Region":"新疆"
    ,"Station":"沙雅"
    },
  "51642": {
     "Region":"新疆"
    ,"Station":"轮台"
    },
  "51644": {
     "Region":"新疆"
    ,"Station":"库车"
    },
  "51655": {
     "Region":"新疆"
    ,"Station":"尉犁"
    },
  "51656": {
     "Region":"新疆"
    ,"Station":"库尔勒"
    },
  "51701": {
     "Region":"新疆"
    ,"Station":"吐尔尕特"
    },
  "51704": {
     "Region":"新疆"
    ,"Station":"阿图什"
    },
  "51705": {
     "Region":"新疆"
    ,"Station":"乌恰"
    },
  "51707": {
     "Region":"新疆"
    ,"Station":"伽师"
    },
  "51708": {
     "Region":"新疆"
    ,"Station":"阿克陶"
    },
  "51709": {
     "Region":"新疆"
    ,"Station":"喀什"
    },
  "51711": {
     "Region":"新疆"
    ,"Station":"阿合奇"
    },
  "51716": {
     "Region":"新疆"
    ,"Station":"巴楚"
    },
  "51717": {
     "Region":"新疆"
    ,"Station":"岳普湖"
    },
  "51720": {
     "Region":"新疆"
    ,"Station":"柯坪"
    },
  "51722": {
     "Region":"新疆"
    ,"Station":"阿瓦提"
    },
  "51730": {
     "Region":"新疆"
    ,"Station":"阿拉尔"
    },
  "51747": {
     "Region":"新疆"
    ,"Station":"塔中"
    },
  "51765": {
     "Region":"新疆"
    ,"Station":"铁干里克"
    },
  "51777": {
     "Region":"新疆"
    ,"Station":"若羌"
    },
  "51802": {
     "Region":"新疆"
    ,"Station":"英吉沙"
    },
  "51804": {
     "Region":"新疆"
    ,"Station":"塔什库尔干"
    },
  "51810": {
     "Region":"新疆"
    ,"Station":"麦盖提"
    },
  "51811": {
     "Region":"新疆"
    ,"Station":"莎车"
    },
  "51814": {
     "Region":"新疆"
    ,"Station":"叶城"
    },
  "51815": {
     "Region":"新疆"
    ,"Station":"泽普"
    },
  "51818": {
     "Region":"新疆"
    ,"Station":"皮山"
    },
  "51826": {
     "Region":"新疆"
    ,"Station":"策勒"
    },
  "51827": {
     "Region":"新疆"
    ,"Station":"墨玉"
    },
  "51828": {
     "Region":"新疆"
    ,"Station":"和田"
    },
  "51829": {
     "Region":"新疆"
    ,"Station":"洛浦"
    },
  "51839": {
     "Region":"新疆"
    ,"Station":"民丰"
    },
  "51855": {
     "Region":"新疆"
    ,"Station":"且末"
    },
  "51931": {
     "Region":"新疆"
    ,"Station":"于田"
    },
  "52101": {
     "Region":"新疆"
    ,"Station":"巴里坤"
    },
  "52112": {
     "Region":"新疆"
    ,"Station":"淖毛湖"
    },
  "52118": {
     "Region":"新疆"
    ,"Station":"伊吾"
    },
  "52203": {
     "Region":"新疆"
    ,"Station":"哈密"
    },
  "52313": {
     "Region":"新疆"
    ,"Station":"红柳河"
    },
  "56444": {
     "Region":"云南"
    ,"Station":"德钦"
    },
  "56449": {
     "Region":"云南"
    ,"Station":"中甸"
    },
  "56483": {
     "Region":"云南"
    ,"Station":"绥江"
    },
  "56489": {
     "Region":"云南"
    ,"Station":"永善"
    },
  "56497": {
     "Region":"云南"
    ,"Station":"盐津"
    },
  "56533": {
     "Region":"云南"
    ,"Station":"贡山"
    },
  "56543": {
     "Region":"云南"
    ,"Station":"香格里拉"
    },
  "56548": {
     "Region":"云南"
    ,"Station":"维西"
    },
  "56567": {
     "Region":"云南"
    ,"Station":"宁蒗"
    },
  "56582": {
     "Region":"云南"
    ,"Station":"大关"
    },
  "56585": {
     "Region":"云南"
    ,"Station":"鲁甸"
    },
  "56586": {
     "Region":"云南"
    ,"Station":"昭通"
    },
  "56594": {
     "Region":"云南"
    ,"Station":"彝良"
    },
  "56595": {
     "Region":"云南"
    ,"Station":"镇雄"
    },
  "56596": {
     "Region":"云南"
    ,"Station":"威信"
    },
  "56641": {
     "Region":"云南"
    ,"Station":"福贡"
    },
  "56643": {
     "Region":"云南"
    ,"Station":"六库"
    },
  "56645": {
     "Region":"云南"
    ,"Station":"兰坪"
    },
  "56646": {
     "Region":"云南"
    ,"Station":"剑川"
    },
  "56649": {
     "Region":"云南"
    ,"Station":"洱源"
    },
  "56651": {
     "Region":"云南"
    ,"Station":"丽江"
    },
  "56652": {
     "Region":"云南"
    ,"Station":"永胜"
    },
  "56654": {
     "Region":"云南"
    ,"Station":"鹤庆"
    },
  "56664": {
     "Region":"云南"
    ,"Station":"华坪"
    },
  "56669": {
     "Region":"云南"
    ,"Station":"永仁"
    },
  "56673": {
     "Region":"云南"
    ,"Station":"巧家"
    },
  "56684": {
     "Region":"云南"
    ,"Station":"会泽"
    },
  "56688": {
     "Region":"云南"
    ,"Station":"东川"
    },
  "56697": {
     "Region":"云南"
    ,"Station":"宣威"
    },
  "56739": {
     "Region":"云南"
    ,"Station":"腾冲"
    },
  "56741": {
     "Region":"云南"
    ,"Station":"泸水"
    },
  "56742": {
     "Region":"云南"
    ,"Station":"云龙"
    },
  "56745": {
     "Region":"云南"
    ,"Station":"漾濞"
    },
  "56746": {
     "Region":"云南"
    ,"Station":"永平"
    },
  "56748": {
     "Region":"云南"
    ,"Station":"保山"
    },
  "56751": {
     "Region":"云南"
    ,"Station":"大理"
    },
  "56752": {
     "Region":"云南"
    ,"Station":"宾川"
    },
  "56755": {
     "Region":"云南"
    ,"Station":"弥渡"
    },
  "56756": {
     "Region":"云南"
    ,"Station":"祥云"
    },
  "56757": {
     "Region":"云南"
    ,"Station":"巍山"
    },
  "56761": {
     "Region":"云南"
    ,"Station":"大姚"
    },
  "56763": {
     "Region":"云南"
    ,"Station":"元谋"
    },
  "56764": {
     "Region":"云南"
    ,"Station":"姚安"
    },
  "56766": {
     "Region":"云南"
    ,"Station":"牟定"
    },
  "56767": {
     "Region":"云南"
    ,"Station":"南华"
    },
  "56768": {
     "Region":"云南"
    ,"Station":"楚雄"
    },
  "56772": {
     "Region":"云南"
    ,"Station":"富民"
    },
  "56774": {
     "Region":"云南"
    ,"Station":"武定"
    },
  "56775": {
     "Region":"云南"
    ,"Station":"禄劝"
    },
  "56777": {
     "Region":"云南"
    ,"Station":"禄丰"
    },
  "56778": {
     "Region":"云南"
    ,"Station":"昆明"
    },
  "56781": {
     "Region":"云南"
    ,"Station":"寻甸"
    },
  "56782": {
     "Region":"云南"
    ,"Station":"马龙"
    },
  "56783": {
     "Region":"云南"
    ,"Station":"曲靖"
    },
  "56785": {
     "Region":"云南"
    ,"Station":"嵩明"
    },
  "56786": {
     "Region":"云南"
    ,"Station":"沾益"
    },
  "56788": {
     "Region":"云南"
    ,"Station":"陆良"
    },
  "56790": {
     "Region":"云南"
    ,"Station":"富源"
    },
  "56835": {
     "Region":"云南"
    ,"Station":"陇川"
    },
  "56836": {
     "Region":"云南"
    ,"Station":"盈江"
    },
  "56838": {
     "Region":"云南"
    ,"Station":"瑞丽"
    },
  "56839": {
     "Region":"云南"
    ,"Station":"镇康"
    },
  "56840": {
     "Region":"云南"
    ,"Station":"粱河"
    },
  "56841": {
     "Region":"云南"
    ,"Station":"龙陵"
    },
  "56842": {
     "Region":"云南"
    ,"Station":"施甸"
    },
  "56843": {
     "Region":"云南"
    ,"Station":"昌宁"
    },
  "56844": {
     "Region":"云南"
    ,"Station":"芒市"
    },
  "56846": {
     "Region":"云南"
    ,"Station":"凤庆"
    },
  "56849": {
     "Region":"云南"
    ,"Station":"永德"
    },
  "56851": {
     "Region":"云南"
    ,"Station":"南涧"
    },
  "56854": {
     "Region":"云南"
    ,"Station":"云县"
    },
  "56856": {
     "Region":"云南"
    ,"Station":"景东"
    },
  "56862": {
     "Region":"云南"
    ,"Station":"双柏"
    },
  "56863": {
     "Region":"云南"
    ,"Station":"安宁"
    },
  "56867": {
     "Region":"云南"
    ,"Station":"镇沅"
    },
  "56869": {
     "Region":"云南"
    ,"Station":"新平"
    },
  "56870": {
     "Region":"云南"
    ,"Station":"易门"
    },
  "56871": {
     "Region":"云南"
    ,"Station":"晋宁"
    },
  "56872": {
     "Region":"云南"
    ,"Station":"太华山"
    },
  "56873": {
     "Region":"云南"
    ,"Station":"澄江"
    },
  "56875": {
     "Region":"云南"
    ,"Station":"玉溪"
    },
  "56876": {
     "Region":"云南"
    ,"Station":"江川"
    },
  "56878": {
     "Region":"云南"
    ,"Station":"通海"
    },
  "56879": {
     "Region":"云南"
    ,"Station":"华宁"
    },
  "56880": {
     "Region":"云南"
    ,"Station":"宜良"
    },
  "56881": {
     "Region":"云南"
    ,"Station":"石林"
    },
  "56882": {
     "Region":"云南"
    ,"Station":"呈贡"
    },
  "56883": {
     "Region":"云南"
    ,"Station":"师宗"
    },
  "56885": {
     "Region":"云南"
    ,"Station":"弥勒"
    },
  "56886": {
     "Region":"云南"
    ,"Station":"泸西"
    },
  "56889": {
     "Region":"云南"
    ,"Station":"丘北"
    },
  "56891": {
     "Region":"云南"
    ,"Station":"罗平"
    },
  "56898": {
     "Region":"云南"
    ,"Station":"峨山"
    },
  "56944": {
     "Region":"云南"
    ,"Station":"沧源"
    },
  "56946": {
     "Region":"云南"
    ,"Station":"耿马"
    },
  "56948": {
     "Region":"云南"
    ,"Station":"西盟"
    },
  "56949": {
     "Region":"云南"
    ,"Station":"孟连"
    },
  "56950": {
     "Region":"云南"
    ,"Station":"双江"
    },
  "56951": {
     "Region":"云南"
    ,"Station":"临沧"
    },
  "56952": {
     "Region":"云南"
    ,"Station":"景谷"
    },
  "56954": {
     "Region":"云南"
    ,"Station":"澜沧"
    },
  "56958": {
     "Region":"云南"
    ,"Station":"勐海"
    },
  "56959": {
     "Region":"云南"
    ,"Station":"景洪"
    },
  "56961": {
     "Region":"云南"
    ,"Station":"宁洱"
    },
  "56962": {
     "Region":"云南"
    ,"Station":"墨江"
    },
  "56964": {
     "Region":"云南"
    ,"Station":"思茅"
    },
  "56966": {
     "Region":"云南"
    ,"Station":"元江"
    },
  "56969": {
     "Region":"云南"
    ,"Station":"勐腊"
    },
  "56970": {
     "Region":"云南"
    ,"Station":"石屏"
    },
  "56973": {
     "Region":"云南"
    ,"Station":"建水"
    },
  "56975": {
     "Region":"云南"
    ,"Station":"红河"
    },
  "56976": {
     "Region":"云南"
    ,"Station":"元阳"
    },
  "56977": {
     "Region":"云南"
    ,"Station":"江城"
    },
  "56978": {
     "Region":"云南"
    ,"Station":"绿春"
    },
  "56982": {
     "Region":"云南"
    ,"Station":"开远"
    },
  "56984": {
     "Region":"云南"
    ,"Station":"个旧"
    },
  "56985": {
     "Region":"云南"
    ,"Station":"蒙自"
    },
  "56986": {
     "Region":"云南"
    ,"Station":"屏边"
    },
  "56987": {
     "Region":"云南"
    ,"Station":"金平"
    },
  "56989": {
     "Region":"云南"
    ,"Station":"河口"
    },
  "56991": {
     "Region":"云南"
    ,"Station":"砚山"
    },
  "56992": {
     "Region":"云南"
    ,"Station":"西畴"
    },
  "56994": {
     "Region":"云南"
    ,"Station":"文山"
    },
  "56995": {
     "Region":"云南"
    ,"Station":"马关"
    },
  "56996": {
     "Region":"云南"
    ,"Station":"麻栗坡"
    },
  "59007": {
     "Region":"云南"
    ,"Station":"广南"
    },
  "59205": {
     "Region":"云南"
    ,"Station":"富宁"
    },
  "58443": {
     "Region":"浙江"
    ,"Station":"长兴"
    },
  "58446": {
     "Region":"浙江"
    ,"Station":"安吉"
    },
  "58448": {
     "Region":"浙江"
    ,"Station":"临安"
    },
  "58449": {
     "Region":"浙江"
    ,"Station":"富阳"
    },
  "58450": {
     "Region":"浙江"
    ,"Station":"湖州"
    },
  "58451": {
     "Region":"浙江"
    ,"Station":"嘉善"
    },
  "58452": {
     "Region":"浙江"
    ,"Station":"嘉兴"
    },
  "58453": {
     "Region":"浙江"
    ,"Station":"绍兴"
    },
  "58454": {
     "Region":"浙江"
    ,"Station":"德清"
    },
  "58455": {
     "Region":"浙江"
    ,"Station":"海宁"
    },
  "58456": {
     "Region":"浙江"
    ,"Station":"桐乡"
    },
  "58457": {
     "Region":"浙江"
    ,"Station":"杭州"
    },
  "58458": {
     "Region":"浙江"
    ,"Station":"海盐"
    },
  "58459": {
     "Region":"浙江"
    ,"Station":"萧山"
    },
  "58464": {
     "Region":"浙江"
    ,"Station":"平湖"
    },
  "58467": {
     "Region":"浙江"
    ,"Station":"慈溪"
    },
  "58468": {
     "Region":"浙江"
    ,"Station":"余姚"
    },
  "58472": {
     "Region":"浙江"
    ,"Station":"嵊泗"
    },
  "58477": {
     "Region":"浙江"
    ,"Station":"定海"
    },
  "58484": {
     "Region":"浙江"
    ,"Station":"岱山"
    },
  "58537": {
     "Region":"浙江"
    ,"Station":"开化"
    },
  "58542": {
     "Region":"浙江"
    ,"Station":"桐庐"
    },
  "58543": {
     "Region":"浙江"
    ,"Station":"淳安"
    },
  "58544": {
     "Region":"浙江"
    ,"Station":"建德"
    },
  "58546": {
     "Region":"浙江"
    ,"Station":"浦江"
    },
  "58547": {
     "Region":"浙江"
    ,"Station":"龙游"
    },
  "58548": {
     "Region":"浙江"
    ,"Station":"兰溪"
    },
  "58549": {
     "Region":"浙江"
    ,"Station":"金华"
    },
  "58550": {
     "Region":"浙江"
    ,"Station":"诸暨"
    },
  "58553": {
     "Region":"浙江"
    ,"Station":"上虞"
    },
  "58555": {
     "Region":"浙江"
    ,"Station":"新昌"
    },
  "58556": {
     "Region":"浙江"
    ,"Station":"嵊州"
    },
  "58557": {
     "Region":"浙江"
    ,"Station":"义乌"
    },
  "58558": {
     "Region":"浙江"
    ,"Station":"东阳"
    },
  "58559": {
     "Region":"浙江"
    ,"Station":"天台"
    },
  "58561": {
     "Region":"浙江"
    ,"Station":"镇海"
    },
  "58562": {
     "Region":"浙江"
    ,"Station":"鄞州"
    },
  "58563": {
     "Region":"浙江"
    ,"Station":"北仑"
    },
  "58565": {
     "Region":"浙江"
    ,"Station":"奉化"
    },
  "58566": {
     "Region":"浙江"
    ,"Station":"象山"
    },
  "58567": {
     "Region":"浙江"
    ,"Station":"宁海"
    },
  "58568": {
     "Region":"浙江"
    ,"Station":"三门"
    },
  "58569": {
     "Region":"浙江"
    ,"Station":"石浦"
    },
  "58570": {
     "Region":"浙江"
    ,"Station":"普陀"
    },
  "58631": {
     "Region":"浙江"
    ,"Station":"常山"
    },
  "58632": {
     "Region":"浙江"
    ,"Station":"江山"
    },
  "58633": {
     "Region":"浙江"
    ,"Station":"衢州"
    },
  "58642": {
     "Region":"浙江"
    ,"Station":"武义"
    },
  "58643": {
     "Region":"浙江"
    ,"Station":"永康"
    },
  "58644": {
     "Region":"浙江"
    ,"Station":"遂昌"
    },
  "58646": {
     "Region":"浙江"
    ,"Station":"丽水"
    },
  "58647": {
     "Region":"浙江"
    ,"Station":"龙泉"
    },
  "58652": {
     "Region":"浙江"
    ,"Station":"仙居"
    },
  "58654": {
     "Region":"浙江"
    ,"Station":"缙云"
    },
  "58656": {
     "Region":"浙江"
    ,"Station":"乐清"
    },
  "58657": {
     "Region":"浙江"
    ,"Station":"青田"
    },
  "58658": {
     "Region":"浙江"
    ,"Station":"永嘉"
    },
  "58659": {
     "Region":"浙江"
    ,"Station":"温州"
    },
  "58660": {
     "Region":"浙江"
    ,"Station":"临海"
    },
  "58664": {
     "Region":"浙江"
    ,"Station":"温岭"
    },
  "58665": {
     "Region":"浙江"
    ,"Station":"洪家"
    },
  "58666": {
     "Region":"浙江"
    ,"Station":"大陈"
    },
  "58667": {
     "Region":"浙江"
    ,"Station":"玉环"
    },
  "58742": {
     "Region":"浙江"
    ,"Station":"云和"
    },
  "58745": {
     "Region":"浙江"
    ,"Station":"庆元"
    },
  "58746": {
     "Region":"浙江"
    ,"Station":"泰顺"
    },
  "58750": {
     "Region":"浙江"
    ,"Station":"文成"
    },
  "58751": {
     "Region":"浙江"
    ,"Station":"平阳"
    },
  "58752": {
     "Region":"浙江"
    ,"Station":"瑞安"
    },
  "58760": {
     "Region":"浙江"
    ,"Station":"洞头"
    },
  "57333": {
     "Region":"重庆"
    ,"Station":"城口"
    },
  "57338": {
     "Region":"重庆"
    ,"Station":"开县"
    },
  "57339": {
     "Region":"重庆"
    ,"Station":"云阳"
    },
  "57345": {
     "Region":"重庆"
    ,"Station":"巫溪"
    },
  "57348": {
     "Region":"重庆"
    ,"Station":"奉节"
    },
  "57349": {
     "Region":"重庆"
    ,"Station":"巫山"
    },
  "57409": {
     "Region":"重庆"
    ,"Station":"潼南"
    },
  "57425": {
     "Region":"重庆"
    ,"Station":"垫江"
    },
  "57426": {
     "Region":"重庆"
    ,"Station":"梁平"
    },
  "57431": {
     "Region":"重庆"
    ,"Station":"天城"
    },
  "57432": {
     "Region":"重庆"
    ,"Station":"万州"
    },
  "57437": {
     "Region":"重庆"
    ,"Station":"忠县"
    },
  "57438": {
     "Region":"重庆"
    ,"Station":"石柱"
    },
  "57502": {
     "Region":"重庆"
    ,"Station":"大足"
    },
  "57505": {
     "Region":"重庆"
    ,"Station":"荣昌"
    },
  "57506": {
     "Region":"重庆"
    ,"Station":"永川"
    },
  "57509": {
     "Region":"重庆"
    ,"Station":"万盛"
    },
  "57510": {
     "Region":"重庆"
    ,"Station":"铜梁"
    },
  "57511": {
     "Region":"重庆"
    ,"Station":"北碚"
    },
  "57512": {
     "Region":"重庆"
    ,"Station":"合川"
    },
  "57513": {
     "Region":"重庆"
    ,"Station":"渝北"
    },
  "57514": {
     "Region":"重庆"
    ,"Station":"璧山"
    },
  "57516": {
     "Region":"重庆"
    ,"Station":"沙坪坝"
    },
  "57517": {
     "Region":"重庆"
    ,"Station":"江津"
    },
  "57518": {
     "Region":"重庆"
    ,"Station":"巴南"
    },
  "57519": {
     "Region":"重庆"
    ,"Station":"南川"
    },
  "57520": {
     "Region":"重庆"
    ,"Station":"长寿"
    },
  "57522": {
     "Region":"重庆"
    ,"Station":"涪陵"
    },
  "57523": {
     "Region":"重庆"
    ,"Station":"丰都"
    },
  "57525": {
     "Region":"重庆"
    ,"Station":"武隆"
    },
  "57536": {
     "Region":"重庆"
    ,"Station":"黔江"
    },
  "57537": {
     "Region":"重庆"
    ,"Station":"彭水"
    },
  "57612": {
     "Region":"重庆"
    ,"Station":"綦江"
    },
  "57633": {
     "Region":"重庆"
    ,"Station":"酉阳"
    },
  "57635": {
     "Region":"重庆"
    ,"Station":"秀山"
    },
  "59997": {
     "Region":"海南"
    ,"Station":"南沙"
    },
  "58968": {
     "Region":"台湾"
    ,"Station":"台北"
    },
  "45007": {
     "Region":"香港"
    ,"Station":"香港"
    },
  "45011": {
     "Region":"澳门"
    ,"Station":"澳门"
    },
  "44243": {
     "Region":"蒙古色楞格省"
    ,"Station":"尧勒"
    },
  "44212": {
     "Region":"蒙古乌布苏省"
    ,"Station":"乌兰固木"
    },
  "44221": {
     "Region":"蒙古扎布汗省"
    ,"Station":"巴彦特斯"
    },
  "44224": {
     "Region":"蒙古扎布汗省"
    ,"Station":"车臣乌拉"
    },
  "44225": {
     "Region":"蒙古扎布汗省"
    ,"Station":"陶松臣格勒"
    },
  "44203": {
     "Region":"蒙古库苏古尔省"
    ,"Station":"仁钦隆勃"
    },
  "44292": {
     "Region":"蒙古乌兰巴托市"
    ,"Station":"乌兰巴托"
    },
  "44291": {
     "Region":"蒙古乌兰巴托市"
    ,"Station":"БуянтУхаа"
    },
  "44275": {
     "Region":"蒙古巴彦洪戈尔省"
    ,"Station":"巴彦布拉格"
    },
  "44284": {
     "Region":"蒙古巴彦洪戈尔省"
    ,"Station":"嘎鲁特"
    },
  "44265": {
     "Region":"蒙古科布多省"
    ,"Station":"布尔干"
    },
  "44277": {
     "Region":"蒙古戈壁阿尔泰省"
    ,"Station":"阿尔泰"
    },
  "44207": {
     "Region":"蒙古库苏古尔省"
    ,"Station":"哈特嘎勒"
    },
  "44231": {
     "Region":"蒙古库苏古尔省"
    ,"Station":"木伦"
    },
  "44215": {
     "Region":"蒙古乌布苏省"
    ,"Station":"南戈壁"
    },
  "44213": {
     "Region":"蒙古乌布苏省"
    ,"Station":"西图伦"
    },
  "44263": {
     "Region":"蒙古巴彦乌列盖省"
    ,"Station":"布尔干"
    },
  "44229": {
     "Region":"蒙古后杭爱省"
    ,"Station":"塔里亚特"
    },
  "31702": {
     "Region":"俄罗斯犹太自治州"
    ,"Station":"奥布卢奇耶"
    },
  "31532": {
     "Region":"俄罗斯哈巴罗夫斯克边疆区"
    ,"Station":"切昆达"
    },
  "31478": {
     "Region":"俄罗斯哈巴罗夫斯克边疆区"
    ,"Station":"索菲斯克"
    },
  "31329": {
     "Region":"俄罗斯阿穆尔州"
    ,"Station":"埃基姆昌"
    },
  "31348": {
     "Region":"俄罗斯哈巴罗夫斯克边疆区"
    ,"Station":"布鲁坎"
    },
  "30673": {
     "Region":"俄罗斯后贝加尔边疆区"
    ,"Station":"莫戈恰"
    },
  "30664": {
     "Region":"俄罗斯后贝加尔边疆区"
    ,"Station":"通戈科琴"
    },
  "30636": {
     "Region":"俄罗斯布里亚特共和国"
    ,"Station":"巴尔古津"
    },
  "30622": {
     "Region":"俄罗斯伊尔库茨克州"
    ,"Station":"卡丘格"
    },
  "36104": {
     "Region":"俄罗斯图瓦共和国"
    ,"Station":"萨雷格谢普"
    },
  "36096": {
     "Region":"俄罗斯图瓦共和国"
    ,"Station":"克孜勒"
    },
  "36307": {
     "Region":"俄罗斯图瓦共和国"
    ,"Station":"埃尔津"
    },
  "36259": {
     "Region":"俄罗斯阿尔泰共和国"
    ,"Station":"科什阿加奇"
    },
  "30781": {
     "Region":"俄罗斯后贝加尔边疆区"
    ,"Station":"乌留皮诺"
    },
  "30565": {
     "Region":"俄罗斯后贝加尔边疆区"
    ,"Station":"乌斯季卡连加"
    },
  "36535": {
     "Region":"哈萨克斯坦东哈萨克斯坦州"
    ,"Station":"科克佩克特"
    },
  "36566": {
     "Region":"哈萨克斯坦东哈萨克斯坦州"
    ,"Station":"马尔卡湖"
    },
  "47005": {
     "Region":"朝鲜两江道"
    ,"Station":"三池渊"
    },
  "31137": {
     "Region":"俄罗斯萨哈共和国"
    ,"Station":"TOKO"
    },
  "24688": {
     "Region":"俄罗斯萨哈共和国"
    ,"Station":"奥伊米亚康"
    },
  "24585": {
     "Region":"俄罗斯萨哈共和国"
    ,"Station":"乌斯季涅拉"
    },
  "24588": {
     "Region":"俄罗斯萨哈共和国"
    ,"Station":"YURTY"
    },
  "24691": {
     "Region":"俄罗斯萨哈共和国"
    ,"Station":"DELYANKIR"
    },
  "24266": {
     "Region":"俄罗斯萨哈共和国"
    ,"Station":"上扬斯克"
    },
  "24684": {
     "Region":"俄罗斯萨哈共和国"
    ,"Station":"阿加亚坎"
    },
  "24382": {
     "Region":"俄罗斯萨哈共和国"
    ,"Station":"乌斯季莫马(霍努)"
    },
  "24959": {
     "Region":"俄罗斯萨哈共和国"
    ,"Station":"雅库茨克"
    },
  "24477": {
     "Region":"俄罗斯萨哈共和国"
    ,"Station":"IEMA"
    },
  "25428": {
     "Region":"俄罗斯楚科奇自治区"
    ,"Station":"奥莫隆"
    },
  "25700": {
     "Region":"俄罗斯马加丹州"
    ,"Station":"Эльген"
    },
  "24507": {
     "Region":"俄罗斯克拉斯诺亚尔斯克边疆区"
    ,"Station":"图拉"
    },
  "38875": {
     "Region":"塔吉克斯坦山地巴达赫尚自治州"
    ,"Station":"喀拉库勒"
    },
  "38358": {
     "Region":"吉尔吉斯斯坦楚河州"
    ,"Station":"苏萨梅尔"
    },
  "71917": {
     "Region":"加拿大努纳武特地区"
    ,"Station":"尤里卡"
    },
  "70194": {
     "Region":"美国阿拉斯加州"
    ,"Station":"育空堡"
    },
  "72613": {
     "Region":"美国新罕布什尔州"
    ,"Station":"华盛顿山"
    },
  "72747": {
     "Region":"美国明尼苏达州"
    ,"Station":"国际瀑布城"
    },
  "04419": {
     "Region":"丹麦格陵兰"
    ,"Station":"顶峰营"
    },
  "01065": {
     "Region":"挪威芬马克郡"
    ,"Station":"卡拉绍克"
    },
  "38878": {
     "Region":"塔吉克斯坦山地巴达赫尚自治州"
    ,"Station":"穆尔加布"
    },
  "89606": {
     "Region":"南极"
    ,"Station":"东方站(Vostok)"
    }
};
//获取行
let trs = document.getElementById('summary_table').getElementsByTagName('tbody')[0].getElementsByTagName('tr');
//获取均、低、高温标题名称
/*
let nameOfAvg = trs[1].getElementsByTagName('td')[indexOfColumnAvgName].innerText.trim().split('\n')[0].trim();
let nameOfMin = trs[1].getElementsByTagName('td')[indexOfColumnMinName].innerText.trim().split('\n')[0].trim();
let nameOfMax = trs[1].getElementsByTagName('td')[indexOfColumnMaxName].innerText.trim().split('\n')[0].trim();
*/
//数据数组
let dataArr = [];
//填数组
for(let i=2; i<trs.length; i++){
    let tempObj = {};
    let tempWmo = trs[i].getElementsByTagName('td')[indexOfWmoNo].innerText.trim();
    tempObj['WMO站号'] = tempWmo;
    tempObj['站名'] = chineseNamesObj[tempWmo] === undefined ?
        trs[i].getElementsByTagName('td')[indexOfStationName].innerText.trim() :
        chineseNamesObj[tempWmo]['Region'] + '-' + chineseNamesObj[tempWmo]['Station'];
    tempObj['年月'] = convertMonth(trs[i].getElementsByTagName('td')[indexOfDate].innerText.trim());
    tempObj[customedNameMin] = Number(trs[i].getElementsByTagName('td')[indexOfColumnMin].innerText.trim());
    tempObj[customedNameMinDate] = convertMD(trs[i].getElementsByTagName('td')[indexOfColumnMinDate].innerText.trim());
    tempObj[customedNameAvgMin] = Number(trs[i].getElementsByTagName('td')[indexOfColumnAvgMin].innerText.trim());
    tempObj[customedNameAvg] = Number(trs[i].getElementsByTagName('td')[indexOfColumnAvg].innerText.trim());
    tempObj[customedNameAvgMax] = Number(trs[i].getElementsByTagName('td')[indexOfColumnAvgMax].innerText.trim());
    tempObj[customedNameMax] = Number(trs[i].getElementsByTagName('td')[indexOfColumnMax].innerText.trim());
    tempObj[customedNameMaxDate] = convertMD(trs[i].getElementsByTagName('td')[indexOfColumnMaxDate].innerText.trim());
    dataArr.push(tempObj);
}
//字符串结果(表格形式)
let resultStr = '';
let tempK = Object.keys(dataArr[0]);
let kLen = tempK.length;
for(let i=0; i<dataArr.length; i++){
    for(j=0; j<kLen; j++){
        resultStr += dataArr[i][tempK[j]] + '\t';
    }
    resultStr += '\n';
}
//寒冷站数统计
let objOfColdStations = getStatistics(dataArr);
//统计函数
function getStatistics(arr){
    let coldDaysStatistics = {};
    //均温
    let countA50 = 0;
    let countA45 = 0;
    let countA40 = 0;
    let countA35 = 0;
    let countA30 = 0;
    //低温
    let countN55 = 0;
    let countN50 = 0;
    let countN45 = 0;
    let countN40 = 0;
    let countN35 = 0;
    //高温
    let countX45 = 0;
    let countX40 = 0;
    let countX35 = 0;
    let countX30 = 0;
    let countX25 = 0;
    //遍历统计
    for(let i=0; i<arr.length; i++){
        //均温站数
        if(Number(arr[i][customedNameAvg]) <= -50){ countA50 += 1; }
        if(Number(arr[i][customedNameAvg]) <= -45){ countA45 += 1; }
        if(Number(arr[i][customedNameAvg]) <= -40){ countA40 += 1; }
        if(Number(arr[i][customedNameAvg]) <= -35){ countA35 += 1; }
        if(Number(arr[i][customedNameAvg]) <= -30){ countA30 += 1; }
        //低温站数
        if(Number(arr[i][customedNameMin]) <= -55){ countN55 += 1; }
        if(Number(arr[i][customedNameMin]) <= -50){ countN50 += 1; }
        if(Number(arr[i][customedNameMin]) <= -45){ countN45 += 1; }
        if(Number(arr[i][customedNameMin]) <= -40){ countN40 += 1; }
        if(Number(arr[i][customedNameMin]) <= -35){ countN35 += 1; }
        //高温站数
        if(Number(arr[i][customedNameMax]) <= -45){ countX45 += 1; }
        if(Number(arr[i][customedNameMax]) <= -40){ countX40 += 1; }
        if(Number(arr[i][customedNameMax]) <= -35){ countX35 += 1; }
        if(Number(arr[i][customedNameMax]) <= -30){ countX30 += 1; }
        if(Number(arr[i][customedNameMax]) <= -25){ countX25 += 1; }
    }
    //均温站数
    coldDaysStatistics['A50'] = countA50;
    coldDaysStatistics['A45'] = countA45;
    coldDaysStatistics['A40'] = countA40;
    coldDaysStatistics['A35'] = countA35;
    coldDaysStatistics['A30'] = countA30;
    //低温站数
    coldDaysStatistics['N55'] = countN55;
    coldDaysStatistics['N50'] = countN50;
    coldDaysStatistics['N45'] = countN45;
    coldDaysStatistics['N40'] = countN40;
    coldDaysStatistics['N35'] = countN35;
    //高温站数
    coldDaysStatistics['X45'] = countX45;
    coldDaysStatistics['X40'] = countX40;
    coldDaysStatistics['X35'] = countX35;
    coldDaysStatistics['X30'] = countX30;
    coldDaysStatistics['X25'] = countX25;
    //返回值
    return coldDaysStatistics;
}
//日期格式转换
function convertMonth(str){
    let arr = str.split('.');
    let y = arr[1].trim();
    let m = arr[0].trim();
    return y + '年' + m + '月';
}
function convertMD(str){
    let arr = str.split('.');
    let m = arr[1].trim();
    let d = arr[0].trim();
    return m + '月' + d + '日';
}
//打印
//阈值
console.log('记录站数：' + dataArr.length
 + '\n\n低温站数：\n低温<=-55℃站数: ' + objOfColdStations['N55']
 + '\n低温<=-50℃站数: ' + objOfColdStations['N50']
 + '\n低温<=-45℃站数: ' + objOfColdStations['N45']
 + '\n低温<=-40℃站数: ' + objOfColdStations['N40']
 + '\n低温<=-35℃站数: ' + objOfColdStations['N35']
 + '\n\n均温站数：\n均温<=-50℃站数: ' + objOfColdStations['A50']
 + '\n均温<=-45℃站数: ' + objOfColdStations['A45']
 + '\n均温<=-40℃站数: ' + objOfColdStations['A40']
 + '\n均温<=-35℃站数: ' + objOfColdStations['A35']
 + '\n均温<=-30℃站数: ' + objOfColdStations['A30']);
//console表格形式
//console.table(dataArr);
//字符串(tab制表符)
console.log(resultStr);