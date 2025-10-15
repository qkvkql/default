document.addEventListener('DOMContentLoaded',function(event){
    fillTable();
});

let arrOfStations = [{"Country":"蒙古","countryCode":"A","USAF":"44212","NAME":"乌布苏省 乌兰固木","urlSuffOfRp5":"Ulaangom"},{"Country":"蒙古","countryCode":"A","USAF":"44221","NAME":"扎布汗省 巴彦特斯","urlSuffOfRp5":"Gandan_Huryee"},{"Country":"蒙古","countryCode":"A","USAF":"44224","NAME":"扎布汗省 车臣乌拉","urlSuffOfRp5":"Tsetsen-Uul"},{"Country":"蒙古","countryCode":"A","USAF":"44225","NAME":"扎布汗省 陶松臣格勒","urlSuffOfRp5":"Tosontsengel"},{"Country":"蒙古","countryCode":"A","USAF":"44203","NAME":"库苏古尔省 仁钦隆勃","urlSuffOfRp5":"Rinchinlhumbe"},{"Country":"蒙古","countryCode":"A","USAF":"44292","NAME":"乌兰巴托市 乌兰巴托","urlSuffOfRp5":"Ulan_Bator"},{"Country":"蒙古","countryCode":"A","USAF":"44291","NAME":"乌兰巴托市 Буянт-Ухаа","urlSuffOfRp5":"Ulan_Bator,_Songiin_(airport)"},{"Country":"蒙古","countryCode":"A","USAF":"44275","NAME":"巴彦洪戈尔省 巴彦布拉格","urlSuffOfRp5":"Bayanbulag"},{"Country":"蒙古","countryCode":"A","USAF":"44284","NAME":"巴彦洪戈尔省 嘎鲁特","urlSuffOfRp5":"Galut"},{"Country":"蒙古","countryCode":"A","USAF":"44265","NAME":"科布多省 布尔干","urlSuffOfRp5":"Baitag"},{"Country":"蒙古","countryCode":"A","USAF":"44277","NAME":"戈壁阿尔泰省 阿尔泰","urlSuffOfRp5":"Altai,_Mongolia"},{"Country":"蒙古","countryCode":"A","USAF":"44207","NAME":"库苏古尔省 哈特嘎勒","urlSuffOfRp5":"Hatgal"},{"Country":"蒙古","countryCode":"A","USAF":"44231","NAME":"库苏古尔省 木伦","urlSuffOfRp5":"Moron"},{"Country":"蒙古","countryCode":"A","USAF":"44215","NAME":"乌布苏省 南戈壁","urlSuffOfRp5":"Umnu-Gobi"},{"Country":"蒙古","countryCode":"A","USAF":"44213","NAME":"乌布苏省 西图伦","urlSuffOfRp5":"Baruunturuun"},{"Country":"蒙古","countryCode":"A","USAF":"44263","NAME":"巴彦乌列盖省 布尔干","urlSuffOfRp5":"Jargalant"},{"Country":"蒙古","countryCode":"A","USAF":"44229","NAME":"后杭爱省 塔里亚特","urlSuffOfRp5":"Tariat"},{"Country":"俄罗斯","countryCode":"B","USAF":"31702","NAME":"犹太自治州 奥布卢奇耶","urlSuffOfRp5":"Obluchye"},{"Country":"俄罗斯","countryCode":"B","USAF":"31532","NAME":"哈巴罗夫斯克边疆区 切昆达","urlSuffOfRp5":"Cekunda"},{"Country":"俄罗斯","countryCode":"B","USAF":"31478","NAME":"哈巴罗夫斯克边疆区 索菲斯克","urlSuffOfRp5":"Sofiysk"},{"Country":"俄罗斯","countryCode":"B","USAF":"31329","NAME":"阿穆尔州 埃基姆昌","urlSuffOfRp5":"Ekimchan"},{"Country":"俄罗斯","countryCode":"B","USAF":"31348","NAME":"哈巴罗夫斯克边疆区 布鲁坎","urlSuffOfRp5":"Burukan"},{"Country":"俄罗斯","countryCode":"B","USAF":"30673","NAME":"后贝加尔边疆区 莫戈恰","urlSuffOfRp5":"Mogocha"},{"Country":"俄罗斯","countryCode":"B","USAF":"30664","NAME":"后贝加尔边疆区 通戈科琴","urlSuffOfRp5":"Tungokochen"},{"Country":"俄罗斯","countryCode":"B","USAF":"30636","NAME":"布里亚特共和国 巴尔古津","urlSuffOfRp5":"Barguzin"},{"Country":"俄罗斯","countryCode":"B","USAF":"30622","NAME":"伊尔库茨克州 卡丘格","urlSuffOfRp5":"Kachug"},{"Country":"俄罗斯","countryCode":"B","USAF":"36104","NAME":"图瓦共和国 萨雷格谢普","urlSuffOfRp5":"Saryg-Sep"},{"Country":"俄罗斯","countryCode":"B","USAF":"36096","NAME":"图瓦共和国 克孜勒","urlSuffOfRp5":"Kyzyl"},{"Country":"俄罗斯","countryCode":"B","USAF":"36307","NAME":"图瓦共和国 埃尔津","urlSuffOfRp5":"Erzin"},{"Country":"俄罗斯","countryCode":"B","USAF":"36259","NAME":"阿尔泰共和国 科什阿加奇","urlSuffOfRp5":"Kosh-Agach"},{"Country":"俄罗斯","countryCode":"B","USAF":"30781","NAME":"后贝加尔边疆区 乌留皮诺","urlSuffOfRp5":"Uryupino"},{"Country":"俄罗斯","countryCode":"B","USAF":"30565","NAME":"后贝加尔边疆区 乌斯季卡连加","urlSuffOfRp5":"Ust-Karenga"},{"Country":"哈萨克斯坦","countryCode":"C","USAF":"36535","NAME":"东哈萨克斯坦州 科克佩克特","urlSuffOfRp5":"Kokpekty"},{"Country":"哈萨克斯坦","countryCode":"C","USAF":"36566","NAME":"东哈萨克斯坦州 马尔卡湖","urlSuffOfRp5":"Markakol_Lake"},{"Country":"朝鲜","countryCode":"C","USAF":"47005","NAME":"两江道 三池渊","urlSuffOfRp5":"Samjiyon"},{"Country":"中国","countryCode":"D","USAF":"54342","NAME":"辽宁 沈阳","urlSuffOfRp5":"Shenyang"},{"Country":"中国","countryCode":"D","USAF":"54161","NAME":"吉林 长春","urlSuffOfRp5":"Changchun_(airport)"},{"Country":"中国","countryCode":"D","USAF":"54273","NAME":"吉林 桦甸","urlSuffOfRp5":"Huadian"},{"Country":"中国","countryCode":"D","USAF":"50953","NAME":"黑龙江 哈尔滨","urlSuffOfRp5":"Harbin_(airport)"},{"Country":"中国","countryCode":"D","USAF":"50353","NAME":"黑龙江 呼玛","urlSuffOfRp5":"Huma"},{"Country":"中国","countryCode":"D","USAF":"50136","NAME":"黑龙江 漠河","urlSuffOfRp5":"Xilinji"},{"Country":"中国","countryCode":"D","USAF":"50434","NAME":"内蒙古 图里河","urlSuffOfRp5":"Tulihe"},{"Country":"中国","countryCode":"D","USAF":"50527","NAME":"内蒙古 海拉尔","urlSuffOfRp5":"Zhengyang"},{"Country":"中国","countryCode":"D","USAF":"50727","NAME":"内蒙古 阿尔山","urlSuffOfRp5":"Arxan"},{"Country":"中国","countryCode":"D","USAF":"52908","NAME":"青海 五道梁","urlSuffOfRp5":"Udaolyan"},{"Country":"中国","countryCode":"D","USAF":"52323","NAME":"甘肃 马鬃山","urlSuffOfRp5":"Mazong_Shan"},{"Country":"中国","countryCode":"D","USAF":"51076","NAME":"新疆 阿勒泰","urlSuffOfRp5":"Aletai"},{"Country":"中国","countryCode":"D","USAF":"51573","NAME":"新疆 吐鲁番","urlSuffOfRp5":"Turfan"},{"Country":"中国","countryCode":"D","USAF":"51463","NAME":"新疆 乌鲁木齐","urlSuffOfRp5":"Urumqi"},{"Country":"中国","countryCode":"D","USAF":"51542","NAME":"新疆 巴音布鲁克","urlSuffOfRp5":"Baianbulak"},{"Country":"中国","countryCode":"D","USAF":"53463","NAME":"内蒙古 呼和浩特","urlSuffOfRp5":"Hohhot"},{"Country":"中国","countryCode":"D","USAF":"54511","NAME":"北京市 北京","urlSuffOfRp5":"Beijing,_Peking"},{"Country":"中国","countryCode":"D","USAF":"53614","NAME":"宁夏 银川","urlSuffOfRp5":"Yinchuan"},{"Country":"中国","countryCode":"D","USAF":"53698","NAME":"河北 石家庄","urlSuffOfRp5":"Shijiazhuang"},{"Country":"中国","countryCode":"D","USAF":"53772","NAME":"山西 太原","urlSuffOfRp5":"Taiyuan_(airport)"},{"Country":"中国","countryCode":"D","USAF":"52866","NAME":"青海 西宁","urlSuffOfRp5":"Xining"},{"Country":"中国","countryCode":"D","USAF":"54823","NAME":"山东 济南","urlSuffOfRp5":"Jinan"},{"Country":"中国","countryCode":"D","USAF":"57083","NAME":"河南 郑州","urlSuffOfRp5":"Zhengzhou"},{"Country":"中国","countryCode":"D","USAF":"57131","NAME":"陕西 西安","urlSuffOfRp5":"Xi'an"},{"Country":"中国","countryCode":"D","USAF":"57245","NAME":"陕西 安康","urlSuffOfRp5":"Ankang"},{"Country":"中国","countryCode":"D","USAF":"57687","NAME":"湖南 长沙","urlSuffOfRp5":"Xingsha"},{"Country":"中国","countryCode":"D","USAF":"58606","NAME":"江西 南昌","urlSuffOfRp5":"Liantang"},{"Country":"中国","countryCode":"D","USAF":"57494","NAME":"湖北 武汉","urlSuffOfRp5":"Wuhan_(airport)"},{"Country":"中国","countryCode":"D","USAF":"58321","NAME":"安徽 合肥","urlSuffOfRp5":"Hefei,_Liugang_(airport)"},{"Country":"中国","countryCode":"D","USAF":"58238","NAME":"江苏 南京","urlSuffOfRp5":"Nanjing_(airport)"},{"Country":"中国","countryCode":"D","USAF":"58457","NAME":"浙江 杭州","urlSuffOfRp5":"Hangzhou_(airport)"},{"Country":"中国","countryCode":"D","USAF":"58646","NAME":"浙江 丽水","urlSuffOfRp5":"Lishui"},{"Country":"中国","countryCode":"D","USAF":"58847","NAME":"福建 福州","urlSuffOfRp5":"Fuzhou"},{"Country":"中国","countryCode":"D","USAF":"59287","NAME":"广东 广州","urlSuffOfRp5":"Guangzhou_(airport)"},{"Country":"中国","countryCode":"D","USAF":"59758","NAME":"海南 海口","urlSuffOfRp5":"Haikou"},{"Country":"中国","countryCode":"D","USAF":"59948","NAME":"海南 三亚","urlSuffOfRp5":"Sanya_(weather_station)"},{"Country":"中国","countryCode":"D","USAF":"59838","NAME":"海南 东方","urlSuffOfRp5":"Dongfang"},{"Country":"中国","countryCode":"D","USAF":"59431","NAME":"广西 南宁","urlSuffOfRp5":"Nanning_(airport)"},{"Country":"中国","countryCode":"D","USAF":"56966","NAME":"云南 元江","urlSuffOfRp5":"Lijiang"},{"Country":"中国","countryCode":"D","USAF":"56778","NAME":"云南 昆明","urlSuffOfRp5":"Kunming"},{"Country":"中国","countryCode":"D","USAF":"57816","NAME":"贵州 贵阳","urlSuffOfRp5":"Guiyang"},{"Country":"中国","countryCode":"D","USAF":"57516","NAME":"重庆市 重庆","urlSuffOfRp5":"Chongqing,_Jiulongpo_(airport)"},{"Country":"中国","countryCode":"D","USAF":"56187","NAME":"四川 成都","urlSuffOfRp5":"Chengdu_(AWS)"},{"Country":"中国","countryCode":"D","USAF":"55591","NAME":"西藏 拉萨","urlSuffOfRp5":"Lhasa"},{"Country":"中国","countryCode":"D","USAF":"58437","NAME":"安徽 黄山","urlSuffOfRp5":"Kuan_Shan"},{"Country":"中国","countryCode":"D","USAF":"58968","NAME":"台湾 台北","urlSuffOfRp5":"Taipei"},{"Country":"中国","countryCode":"D","USAF":"45007","NAME":"香港","urlSuffOfRp5":"Hong_Kong_(airport)"},{"Country":"中国","countryCode":"D","USAF":"45011","NAME":"澳门","urlSuffOfRp5":"Taipa_(airport)"},{"Country":"俄罗斯","countryCode":"Z","USAF":"31137","NAME":"萨哈共和国 TOKO","urlSuffOfRp5":"Toko"},{"Country":"俄罗斯","countryCode":"Z","USAF":"24688","NAME":"萨哈共和国 奥伊米亚康","urlSuffOfRp5":"Oymyakon"},{"Country":"俄罗斯","countryCode":"Z","USAF":"24585","NAME":"萨哈共和国 乌斯季涅拉","urlSuffOfRp5":"Ust-Nera"},{"Country":"俄罗斯","countryCode":"Z","USAF":"24588","NAME":"萨哈共和国 YURTY","urlSuffOfRp5":"Yurty"},{"Country":"俄罗斯","countryCode":"Z","USAF":"24691","NAME":"萨哈共和国 DELYANKIR","urlSuffOfRp5":"Delyankir"},{"Country":"俄罗斯","countryCode":"Z","USAF":"24266","NAME":"萨哈共和国 上扬斯克","urlSuffOfRp5":"Verkhoyansk"},{"Country":"俄罗斯","countryCode":"Z","USAF":"24684","NAME":"萨哈共和国 阿加亚坎","urlSuffOfRp5":"Agayakan"},{"Country":"俄罗斯","countryCode":"Z","USAF":"24382","NAME":"萨哈共和国 乌斯季莫马(霍努)","urlSuffOfRp5":"Ust-Moma"},{"Country":"俄罗斯","countryCode":"Z","USAF":"24959","NAME":"萨哈共和国 雅库茨克","urlSuffOfRp5":"Yakutsk"},{"Country":"俄罗斯","countryCode":"Z","USAF":"24477","NAME":"萨哈共和国 IEMA","urlSuffOfRp5":"Iema"},{"Country":"俄罗斯","countryCode":"Z","USAF":"25428","NAME":"楚科奇自治区 奥莫隆","urlSuffOfRp5":"Omolon"},{"Country":"俄罗斯","countryCode":"Z","USAF":"25700","NAME":"马加丹州 Эльген","urlSuffOfRp5":"Taskan"},{"Country":"俄罗斯","countryCode":"Z","USAF":"24507","NAME":"克拉斯诺亚尔斯克边疆区 图拉","urlSuffOfRp5":"Tura"},{"Country":"塔吉克斯坦","countryCode":"Z","USAF":"38875","NAME":"山地巴达赫尚自治州 喀拉库勒","urlSuffOfRp5":"Karakul,_Tajikistan"},{"Country":"吉尔吉斯斯坦","countryCode":"Z","USAF":"38358","NAME":"楚河州 苏萨梅尔","urlSuffOfRp5":"Suusamyr"},{"Country":"加拿大","countryCode":"Z","USAF":"71917","NAME":"努纳武特地区 尤里卡","urlSuffOfRp5":"Eureka_(airport)"},{"Country":"美国","countryCode":"Z","USAF":"70194","NAME":"阿拉斯加州 育空堡","urlSuffOfRp5":"Yukon_(airport)"},{"Country":"美国","countryCode":"Z","USAF":"72613","NAME":"新罕布什尔州 华盛顿山","urlSuffOfRp5":"Mount_Washington_(AWS)"},{"Country":"美国","countryCode":"Z","USAF":"72747","NAME":"明尼苏达州 国际瀑布城","urlSuffOfRp5":"Falls_International_(airport)"},{"Country":"丹麦","countryCode":"Z","USAF":"04419","NAME":"格陵兰 顶峰营","urlSuffOfRp5":""},{"Country":"挪威","countryCode":"Z","USAF":"01065","NAME":"芬马克郡 卡拉绍克","urlSuffOfRp5":"Karasjok"},{"Country":"塔吉克斯坦","countryCode":"Z","USAF":"38878","NAME":"山地巴达赫尚自治州 穆尔加布","urlSuffOfRp5":"Murgab"},{"Country":"南极","countryCode":"Z","USAF":"89606","NAME":"东方站(Vostok)","urlSuffOfRp5":"Vostok_Station"}];

let date = new Date().toISOString();
let dateAndTimeArr = date.split('T');
let dateArr = dateAndTimeArr[0].split('-');
let y = dateArr[0];
let m = dateArr[1];
let d = dateArr[2];
//获取实时伦敦时间小时数
let timeArr = dateAndTimeArr[1].split(':');
let hRealtime = timeArr[0];

function getHour(){
    let forceHour = document.getElementById('force20');
    let h = (forceHour.checked) ? 12 : hRealtime;
    return h;
}


function fillTable(){
    let tb = document.getElementById('tb');
    let count = arrOfStations.length;

    for(let i=0; i<count; i++){
        let tr = document.createElement('tr');
        tb.appendChild(tr);

        //第1列：序号
        let td0 = document.createElement('td');
        td0.innerText = (i+1).toString();
        td0.style.height = '60px';
        td0.style.backgroundColor = '#000000';
        td0.style.color = '#ffffff'; //默认白色字体
        td0.style.border = '1px solid #ffffff';
        tr.appendChild(td0);

        //第2列：站号
        let td1 = document.createElement('td');
        td1.innerText = arrOfStations[i].USAF.toString();
        td1.style.backgroundColor = '#000000';
        td1.style.color = '#ffff00'; //默认白色字体
        td1.style.border = '1px solid #ffffff';
        tr.appendChild(td1);

        //第3列：站名
        let td2 = document.createElement('td');
        td2.innerText = arrOfStations[i].NAME;
        //设置td样式
        td2.style.textAlign = 'right';
        td2.style.backgroundColor = '#000000';
        td2.style.color = '#ffffff'; //默认白色字体
        td2.style.border = '1px solid #ffffff';
        let countryCode = arrOfStations[i].countryCode;
        if(countryCode === 'A'){
            td2.style.color = '#00B0F0';
        }else if(countryCode === 'B'){
            td2.style.color = '#92D050';
        }else if(countryCode === 'C'){
            td2.style.color = '#8EA9DB';
        }else if(countryCode === 'D'){
            td2.style.color = '#FFFFFF';
        }else if(countryCode === 'Z'){
            td2.style.color = '#FF0000';
        }
        tr.appendChild(td2);

        //Ogimet逐时(UTC时间不同，显示截止小时数也不同)
        let td4 = document.createElement('td');
        tr.appendChild(td4);
        let btn2 = document.createElement('button');
        btn2.innerText = 'Ogimet逐时';
        btn2.setAttribute('tabindex', i + 1);
        btn2.onfocus = () => {
            btn2.style.color = '#ffffff';
            btn2.style.backgroundColor = '#3a0ca3';
        }
        btn2.onclick = () => {
            btn2.style.backgroundColor = '#f72585';
        }
        btn2.onblur = () => {
            btn2.style.color = '#000000';
            btn2.style.backgroundColor = '#4cc9f0';
        }
        td4.appendChild(btn2);
        td4.onclick = () => {window.open(getOgimetUrlH(i), '_blank')};

        //rp5逐时
        let td9 = document.createElement('td');
        tr.appendChild(td9);
        let btn7 = document.createElement('button');
        btn7.innerText = 'rp5逐时';
        td9.appendChild(btn7);
        td9.onclick = () => {window.open(getRp5UrlH(i), '_blank')};

        //Pogodaiklimat月均
        let td8 = document.createElement('td');
        tr.appendChild(td8);
        let btn6 = document.createElement('button');
        btn6.innerText = 'Pogodaiklimat月均';
        td8.appendChild(btn6);
        td8.onclick = () => {window.open(getPogodaiklimatUrlMonthAvg(i), '_blank')};

        //Pogodaiklimat气候
        let td7 = document.createElement('td');
        tr.appendChild(td7);
        let btn5 = document.createElement('button');
        btn5.innerText = 'Pogodaiklimat气候';
        td7.appendChild(btn5);
        td7.onclick = () => {window.open(getPogodaiklimatUrlClimate(i), '_blank')};

        //Ogimet逐日(UTC时间不同，结果也不同)
        let td3 = document.createElement('td');
        tr.appendChild(td3);
        let btn1 = document.createElement('button');
        btn1.innerText = 'Ogimet逐日';
        td3.appendChild(btn1);
        td3.onclick = () => {window.open(getOgimetUrlD(i), '_blank')};

        //Pogodaiklimat逐日。注意这个页面有预设时区，每日起始时间不一定是北京时间的00:00或02:00，虽然高低温逻辑是对的(相比ogimet的逐日页面)
        let td5 = document.createElement('td');
        tr.appendChild(td5);
        let btn3 = document.createElement('button');
        btn3.innerText = 'Pogodaiklimat逐日';
        td5.appendChild(btn3);
        td5.onclick = () => {window.open(getPogodaiklimatUrlD(i), '_blank')};

        //Pogodaiklimat逐时
        let td6 = document.createElement('td');
        tr.appendChild(td6);
        let btn4 = document.createElement('button');
        btn4.innerText = 'Pogodaiklimat逐时';
        td6.appendChild(btn4);
        td6.onclick = () => {window.open(getPogodaiklimatUrlH(i), '_blank')};

        setBtnStyle([btn1, btn2, btn3, btn4, btn5, btn6, btn7]);
    }
}

function setBtnStyle(btnArr){
    btnArr.forEach((e) => {
        e.style.color = '#000000';
        e.style.backgroundColor = '#4cc9f0';
        e.addEventListener('mouseover', () => {
            e.style.color = '#ffffff';
            e.style.backgroundColor = '#3a0ca3';
            e.style.cursor = 'pointer';
        });
        e.addEventListener('mousedown', () => {
            e.style.backgroundColor = '#f72585';
        });
        e.addEventListener('mouseleave', () => {
            e.style.color = '#000000';
            e.style.backgroundColor = '#4cc9f0';
        });
    });
}

function getOgimetUrlD(c){
    let url = "https://ogimet.com/cgi-bin/gsynres?ind=" + arrOfStations[c].USAF.toString() + "&ord=REV&enviar=Ver&ndays=30&ano=" + y + "&mes="
+ m + "&day=" + d + "&hora=" + getHour();
    return url;
}
function getOgimetUrlH(c){
    let url = "https://ogimet.com/cgi-bin/gsynres?ind=" + arrOfStations[c].USAF.toString() + "&decoded=yes&ndays=7&ano=" + y + "&mes="
+ m + "&day=" + d + "&hora=" + getHour();
    return url;
}

function getPogodaiklimatUrlD(c){
    let url = "http://www.pogodaiklimat.ru/monitor.php?id=" + arrOfStations[c].USAF.toString();
    return url;
}
function getPogodaiklimatUrlH(c){
    let url = "http://www.pogodaiklimat.ru/weather.php?id=" + arrOfStations[c].USAF.toString();
    return url;
}
function getPogodaiklimatUrlClimate(c){
    let url = "http://www.pogodaiklimat.ru/climate.php?id=" + arrOfStations[c].USAF.toString();
    return url;
}
function getPogodaiklimatUrlMonthAvg(c){
    let url = "http://www.pogodaiklimat.ru/history/" + arrOfStations[c].USAF.toString() + ".htm";
    return url;
}
function getRp5UrlH(c){
    let url = "https://rp5.ru/Weather_archive_in_" + arrOfStations[c].urlSuffOfRp5;
    return url;
}