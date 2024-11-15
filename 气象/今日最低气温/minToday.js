document.addEventListener('DOMContentLoaded',function(event){
    fillTable();
});

let stations = [
    ["漠河",50136],
    ["图里河",50434],
    ["巴音布鲁克",51542],
    ["北京",54511],
    ["科什阿加奇",36259],
    ["克孜勒",36096],
    ["埃尔津",36307],
    ["埃基姆昌",31329],
    ["莫戈恰",30673],
    ["卡丘格",30622],
    ["巴尔古津",30636],
    ["奥布卢奇耶",31702],
    ["切昆达",31532],
    ["仁钦隆勃",44203],
    ["乌兰固木",44212],
    ["陶松臣格勒",44225],
    ["乌兰巴托",44292]
];

let date = new Date().toISOString();
let dateAndTimeArr = date.split('T');
let dateArr = dateAndTimeArr[0].split('-');
let y = dateArr[0];
let m = dateArr[1];
let d = dateArr[2];
let timeArr = dateAndTimeArr[1].split(':');
let h = timeArr[0];

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
        let a1 = document.createElement('a');
        a1.setAttribute('href', getOgimetUrlD(i));
        a1.innerText = 'Ogimet逐日';
        td3.appendChild(a1);

        //第5列：Ogimet逐时(UTC时间不同，显示截止小时数也不同)
        let td4 = document.createElement('td');
        tr.appendChild(td4);
        let a2 = document.createElement('a');
        a2.setAttribute('href', getOgimetUrlH(i));
        a2.innerText = 'Ogimet逐时';
        td4.appendChild(a2);

        //第6列：Pogodailimat逐日。注意这个页面有预设时区，每日起始时间不一定是北京时间的00:00或02:00，虽然高低温逻辑是对的(相比ogimet的逐日页面)
        let td5 = document.createElement('td');
        tr.appendChild(td5);
        let a3 = document.createElement('a');
        a3.setAttribute('href', getPogodailimatUrlD(i));
        a3.innerText = 'Pogodailimat逐日';
        td5.appendChild(a3);

        //第7列：Pogodailimat逐时
        let td6 = document.createElement('td');
        tr.appendChild(td6);
        let a4 = document.createElement('a');
        a4.setAttribute('href', getPogodailimatUrlH(i));
        a4.innerText = 'Pogodailimat逐时';
        td6.appendChild(a4);

        //第8列：Pogodailimat气候
        let td7 = document.createElement('td');
        tr.appendChild(td7);
        let a5 = document.createElement('a');
        a5.setAttribute('href', getPogodailimatUrlClimate(i));
        a5.innerText = 'Pogodailimat气候';
        td7.appendChild(a5);

        //第9列：Pogodailimat月均
        let td8 = document.createElement('td');
        tr.appendChild(td8);
        let a6 = document.createElement('a');
        a6.setAttribute('href', getPogodailimatUrlMonthAvg(i));
        a6.innerText = 'Pogodailimat月均';
        td8.appendChild(a6);
    }
}

function getOgimetUrlD(c){
    let url = "https://ogimet.com/cgi-bin/gsynres?ind=" + stations[c][1].toString() + "&ord=REV&enviar=Ver&ndays=30&ano=" + y + "&mes="
+ m + "&day=" + d + "&hora=" + h;
    return url;
}
function getOgimetUrlH(c){
    let url = "https://ogimet.com/cgi-bin/gsynres?ind=" + stations[c][1].toString() + "&decoded=yes&ndays=7&ano=" + y + "&mes="
+ m + "&day=" + d + "&hora=" + h;
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