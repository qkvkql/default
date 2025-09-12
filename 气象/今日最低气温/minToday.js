document.addEventListener('DOMContentLoaded',function(event){
    fillTable();
});

let arrOfStations = [{"USAF":44212,"NAME":"乌兰固木","urlSuffOfRp5":"Ulaangom"},{"USAF":44221,"NAME":"巴彦特斯","urlSuffOfRp5":"Gandan_Huryee"},{"USAF":44224,"NAME":"车臣乌拉","urlSuffOfRp5":"Tsetsen-Uul"},{"USAF":44225,"NAME":"陶松臣格勒","urlSuffOfRp5":"Tosontsengel"},{"USAF":44203,"NAME":"仁钦隆勃","urlSuffOfRp5":"Rinchinlhumbe"},{"USAF":44292,"NAME":"乌兰巴托","urlSuffOfRp5":"Ulan_Bator"},{"USAF":44213,"NAME":"西图伦","urlSuffOfRp5":"Baruunturuun"},{"USAF":54511,"NAME":"北京","urlSuffOfRp5":"Beijing,_Peking"},{"USAF":57131,"NAME":"西安(泾河)","urlSuffOfRp5":"Xi'an"},{"USAF":58238,"NAME":"南京","urlSuffOfRp5":"Nanjing_(airport)"},{"USAF":59287,"NAME":"广州","urlSuffOfRp5":"Guangzhou_(airport)"},{"USAF":56187,"NAME":"成都","urlSuffOfRp5":"Chengdu_(AWS)"},{"USAF":54342,"NAME":"沈阳","urlSuffOfRp5":"Shenyang"},{"USAF":54161,"NAME":"长春","urlSuffOfRp5":"Changchun_(airport)"},{"USAF":54273,"NAME":"桦甸","urlSuffOfRp5":"Huadian"},{"USAF":50953,"NAME":"哈尔滨","urlSuffOfRp5":"Harbin_(airport)"},{"USAF":50353,"NAME":"呼玛","urlSuffOfRp5":"Huma"},{"USAF":50136,"NAME":"漠河","urlSuffOfRp5":"Xilinji"},{"USAF":50434,"NAME":"图里河","urlSuffOfRp5":"Tulihe"},{"USAF":50527,"NAME":"海拉尔","urlSuffOfRp5":"Zhengyang"},{"USAF":50727,"NAME":"阿尔山","urlSuffOfRp5":"Arxan"},{"USAF":52908,"NAME":"五道梁","urlSuffOfRp5":"Udaolyan"},{"USAF":52323,"NAME":"马鬃山","urlSuffOfRp5":"Mazong_Shan"},{"USAF":51076,"NAME":"阿勒泰","urlSuffOfRp5":"Aletai"},{"USAF":51573,"NAME":"吐鲁番","urlSuffOfRp5":"Turfan"},{"USAF":51463,"NAME":"乌鲁木齐","urlSuffOfRp5":"Urumqi"},{"USAF":51542,"NAME":"巴音布鲁克","urlSuffOfRp5":"Baianbulak"},{"USAF":53463,"NAME":"呼和浩特","urlSuffOfRp5":"Hohhot"},{"USAF":53614,"NAME":"银川","urlSuffOfRp5":"Yinchuan"},{"USAF":53698,"NAME":"石家庄","urlSuffOfRp5":"Shijiazhuang"},{"USAF":53772,"NAME":"太原","urlSuffOfRp5":"Taiyuan_(airport)"},{"USAF":52866,"NAME":"西宁","urlSuffOfRp5":"Xining"},{"USAF":54823,"NAME":"济南","urlSuffOfRp5":"Jinan"},{"USAF":57083,"NAME":"郑州","urlSuffOfRp5":"Zhengzhou"},{"USAF":57245,"NAME":"安康","urlSuffOfRp5":"Ankang"},{"USAF":57687,"NAME":"长沙","urlSuffOfRp5":"Xingsha"},{"USAF":58606,"NAME":"南昌","urlSuffOfRp5":"Liantang"},{"USAF":57494,"NAME":"武汉","urlSuffOfRp5":"Wuhan_(airport)"},{"USAF":58321,"NAME":"合肥","urlSuffOfRp5":"Hefei,_Liugang_(airport)"},{"USAF":58457,"NAME":"杭州","urlSuffOfRp5":"Hangzhou_(airport)"},{"USAF":58646,"NAME":"丽水","urlSuffOfRp5":"Lishui"},{"USAF":58847,"NAME":"福州","urlSuffOfRp5":"Fuzhou"},{"USAF":59758,"NAME":"海口","urlSuffOfRp5":"Haikou"},{"USAF":59948,"NAME":"三亚","urlSuffOfRp5":"Sanya_(weather_station)"},{"USAF":59838,"NAME":"东方","urlSuffOfRp5":"Dongfang"},{"USAF":59431,"NAME":"南宁","urlSuffOfRp5":"Nanning_(airport)"},{"USAF":56966,"NAME":"元江","urlSuffOfRp5":"Lijiang"},{"USAF":56778,"NAME":"昆明","urlSuffOfRp5":"Kunming"},{"USAF":57816,"NAME":"贵阳","urlSuffOfRp5":"Guiyang"},{"USAF":57516,"NAME":"重庆(沙坪坝)","urlSuffOfRp5":"Chongqing,_Jiulongpo_(airport)"},{"USAF":55591,"NAME":"拉萨","urlSuffOfRp5":"Lhasa"},{"USAF":31702,"NAME":"奥布卢奇耶","urlSuffOfRp5":"Obluchye"},{"USAF":31532,"NAME":"切昆达","urlSuffOfRp5":"Cekunda"},{"USAF":31478,"NAME":"索菲斯克","urlSuffOfRp5":"Sofiysk"},{"USAF":31329,"NAME":"埃基姆昌","urlSuffOfRp5":"Ekimchan"},{"USAF":31348,"NAME":"布鲁坎","urlSuffOfRp5":"Burukan"},{"USAF":30673,"NAME":"莫戈恰","urlSuffOfRp5":"Mogocha"},{"USAF":30565,"NAME":"Ust卡连加","urlSuffOfRp5":"Ust-Karenga"},{"USAF":30664,"NAME":"通戈科琴","urlSuffOfRp5":"Tungokochen"},{"USAF":30636,"NAME":"巴尔古津","urlSuffOfRp5":"Barguzin"},{"USAF":30622,"NAME":"卡丘格","urlSuffOfRp5":"Kachug"},{"USAF":36104,"NAME":"萨雷格谢普","urlSuffOfRp5":"Saryg-Sep"},{"USAF":36096,"NAME":"克孜勒","urlSuffOfRp5":"Kyzyl"},{"USAF":36307,"NAME":"埃尔津","urlSuffOfRp5":"Erzin"},{"USAF":36259,"NAME":"科什阿加奇","urlSuffOfRp5":"Kosh-Agach"},{"USAF":31137,"NAME":"TOKO","urlSuffOfRp5":"Toko"},{"USAF":24688,"NAME":"奥伊米亚康","urlSuffOfRp5":"Oymyakon"},{"USAF":24585,"NAME":"乌斯季涅拉","urlSuffOfRp5":"Ust-Nera"},{"USAF":24588,"NAME":"YURTY","urlSuffOfRp5":"Yurty"},{"USAF":24691,"NAME":"DELYANKIR","urlSuffOfRp5":"Delyankir"},{"USAF":24266,"NAME":"上扬斯克","urlSuffOfRp5":"Verkhoyansk"},{"USAF":24684,"NAME":"阿加亚坎","urlSuffOfRp5":"Agayakan"},{"USAF":24382,"NAME":"乌斯季莫马(霍努)","urlSuffOfRp5":"Ust-Moma"},{"USAF":24959,"NAME":"雅库茨克","urlSuffOfRp5":"Yakutsk"},{"USAF":24477,"NAME":"IEMA","urlSuffOfRp5":"Iema"},{"USAF":25428,"NAME":"奥莫隆","urlSuffOfRp5":"Omolon"},{"USAF":25700,"NAME":"Эльген","urlSuffOfRp5":"Taskan"},{"USAF":24507,"NAME":"图拉","urlSuffOfRp5":"Tura"},{"USAF":30781,"NAME":"乌留皮诺","urlSuffOfRp5":"Uryupino"},{"USAF":38875,"NAME":"喀拉库勒","urlSuffOfRp5":"Karakul,_Tajikistan"},{"USAF":38358,"NAME":"苏萨梅尔","urlSuffOfRp5":"Suusamyr"},{"USAF":36535,"NAME":"科克佩克特","urlSuffOfRp5":"Kokpekty"},{"USAF":47005,"NAME":"三池渊","urlSuffOfRp5":"Samjiyon"}];

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
        tr.appendChild(td0);
        td0.style.height = '60px';

        //第2列：站号
        let td1 = document.createElement('td');
        td1.innerText = arrOfStations[i].USAF.toString();
        tr.appendChild(td1);

        //第3列：站名
        let td2 = document.createElement('td');
        td2.innerText = arrOfStations[i].NAME;
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