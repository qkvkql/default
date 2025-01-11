document.addEventListener('DOMContentLoaded',function(event){
    fillTable();
});

let stations = [
    ["卡丘格",30622],
	["巴尔古津",30636],
	["莫戈恰",30673],
	["乌留皮诺",30781],
	["埃基姆昌",31329],
	["布鲁坎",31348],
	["索菲斯克",31478],
	["切昆达",31532],
	["奥布卢奇耶",31702],
	["克孜勒",36096],
	["科什阿加奇",36259],
	["埃尔津",36307],
	["仁钦隆勃",44203],
	["乌兰固木",44212],
    ["巴彦特斯",44221],
    ["车臣乌拉",44224],
	["陶松臣格勒",44225],
	["乌兰巴托",44292],
	["漠河",50136],
	["图里河",50434],
	["海拉尔",50527],
	["阿勒泰",51076],
	["乌鲁木齐",51463],
	["巴音布鲁克",51542],
	["呼和浩特",53463],
    ["武汉",57494]
];

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
    let count = stations.length;

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
        td1.innerText = stations[i][1].toString();
        tr.appendChild(td1);

        //第3列：站名
        let td2 = document.createElement('td');
        td2.innerText = stations[i][0];
        tr.appendChild(td2);

        //第4列：Ogimet逐日(UTC时间不同，结果也不同)
        let td3 = document.createElement('td');
        tr.appendChild(td3);
        let btn1 = document.createElement('button');
        //a1.setAttribute('href', getOgimetUrlD(i));
        btn1.innerText = 'Ogimet逐日';
        td3.appendChild(btn1);
        td3.onclick = () => {window.open(getOgimetUrlD(i), '_blank')};

        //第5列：Ogimet逐时(UTC时间不同，显示截止小时数也不同)
        let td4 = document.createElement('td');
        tr.appendChild(td4);
        let btn2 = document.createElement('button');
        //a2.setAttribute('href', getOgimetUrlH(i));
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

        //第6列：Pogodailimat逐日。注意这个页面有预设时区，每日起始时间不一定是北京时间的00:00或02:00，虽然高低温逻辑是对的(相比ogimet的逐日页面)
        let td5 = document.createElement('td');
        tr.appendChild(td5);
        let btn3 = document.createElement('button');
        //a3.setAttribute('href', getPogodailimatUrlD(i));
        btn3.innerText = 'Pogodailimat逐日';
        td5.appendChild(btn3);
        td5.onclick = () => {window.open(getPogodailimatUrlD(i), '_blank')};

        //第7列：Pogodailimat逐时
        let td6 = document.createElement('td');
        tr.appendChild(td6);
        let btn4 = document.createElement('button');
        //a4.setAttribute('href', getPogodailimatUrlH(i));
        btn4.innerText = 'Pogodailimat逐时';
        td6.appendChild(btn4);
        td6.onclick = () => {window.open(getPogodailimatUrlH(i), '_blank')};

        //第8列：Pogodailimat气候
        let td7 = document.createElement('td');
        tr.appendChild(td7);
        let btn5 = document.createElement('button');
        //a5.setAttribute('href', getPogodailimatUrlClimate(i));
        btn5.innerText = 'Pogodailimat气候';
        td7.appendChild(btn5);
        td7.onclick = () => {window.open(getPogodailimatUrlClimate(i), '_blank')};

        //第9列：Pogodailimat月均
        let td8 = document.createElement('td');
        tr.appendChild(td8);
        let btn6 = document.createElement('button');
        //a6.setAttribute('href', getPogodailimatUrlMonthAvg(i));
        btn6.innerText = 'Pogodailimat月均';
        td8.appendChild(btn6);
        td8.onclick = () => {window.open(getPogodailimatUrlMonthAvg(i), '_blank')};

        setBtnStyle([btn1, btn2, btn3, btn4, btn5, btn6]);
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
    let url = "https://ogimet.com/cgi-bin/gsynres?ind=" + stations[c][1].toString() + "&ord=REV&enviar=Ver&ndays=30&ano=" + y + "&mes="
+ m + "&day=" + d + "&hora=" + getHour();
    return url;
}
function getOgimetUrlH(c){
    let url = "https://ogimet.com/cgi-bin/gsynres?ind=" + stations[c][1].toString() + "&decoded=yes&ndays=7&ano=" + y + "&mes="
+ m + "&day=" + d + "&hora=" + getHour();
    return url;
}

function getPogodailimatUrlD(c){
    let url = "http://www.pogodaiklimat.ru/monitor.php?id=" + stations[c][1].toString();
    return url;
}
function getPogodailimatUrlH(c){
    let url = "http://www.pogodaiklimat.ru/weather.php?id=" + stations[c][1].toString();
    return url;
}
function getPogodailimatUrlClimate(c){
    let url = "http://www.pogodaiklimat.ru/climate.php?id=" + stations[c][1].toString();
    return url;
}
function getPogodailimatUrlMonthAvg(c){
    let url = "http://www.pogodaiklimat.ru/history/" + stations[c][1].toString() + ".htm";
    return url;
}