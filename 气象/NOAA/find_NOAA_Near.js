const reader = require('xlsx');
let xlsxFilePath = 'D:/文档/世界所有国家站站号.xlsx';

//Read xlsx file to array, must in front of other lines
const file = reader.readFile(xlsxFilePath);
let data = [];
const sheets = file.SheetNames
for(let i = 0; i < sheets.length; i++)
{
    const temp = reader.utils.sheet_to_json(
    file.Sheets[file.SheetNames[i]])
    temp.forEach((res) => {
        data.push(res)
    })
}

let config = {
    USAF: '24688',
    //筛选排序
    sort: {
        item: 'd', //针对哪个项排序, d = distance 或 e = elevation
        order: 'asc' //排序方式
    },
    filters: {
        maxDistance: 8000, //方圆多少km
        
        countryCode: 'rs', //留空则不筛选国家

        byElev: 0, //是否筛选海拔
        elev1: -500, //海拔低值
        elev2: 500, //海拔高值
        
        byCoordsRange: 1, ////是否筛选经纬度
        lat1: 60, //纬度范围：起始纬度
        lat2: 90, //纬度范围：终止纬度
        lon1: 80, //经度范围：起始经度
        lon2: 180 //经度范围：终止经度
    },

    searchType: 0, //按什么搜索，0代表按站号搜索
    coorArr: [22, 78], //如果是按坐标搜索(searchType = 1), 需要在这给出坐标

    usafNoEnd0: 0, //是否忽略USAF结尾是0的记录，1是 0否
    limited: '' //是否限定到只考察 xxxxx0-99999 站点，一般不要做限制, 如果非要限制，值为 'limited'
}
//在这里修改参数
//5个参数：搜索类型(0=站号, 1=坐标) | 站号 | 坐标数组(纬度, 经度) | 最大坐标距离(只显示坐标距离小于此数的附近站点) | 严格模式
let result = getNearbyStations(config.searchType, config.USAF, config.coorArr, config.filters.maxDistance, config.limited);
//打印结果
consoleResult();
function consoleResult(){
    let placeStr;
    let countryText = ' in ' + config.filters.countryCode.trim().toUpperCase();
    let itemDistanceStr = 'Distance';
    let itemElevationStr = 'Elevation';
    let itemStr = config.sort.item.toUpperCase() === 'd'.toUpperCase() ? itemDistanceStr : itemElevationStr;
    if(config.searchType === 0){
        placeStr = config.USAF;
    }else if(config.searchType === 1){
        placeStr = '( ' + config.coorArr[0].toString() + ', ' + config.coorArr[1].toString() + ' )';
    }
    if(config.filters.countryCode.trim() !== ''){
        placeStr += countryText;
    }
    if(config.usafNoEnd0 === 1){
        placeStr += '\nLast Digit of USAF ≠ 0';
    }
    console.log('\nAll Stations Nearby ' + placeStr);
    console.log('DISTANCE <= ' + config.filters.maxDistance.toString() + 'km');
    console.log('SORTED BY ' + itemStr + ' ' + config.sort.order.toUpperCase());
    console.log('TOTAL: ' + result.total + '\n')
    console.table(result.resultArr);

    //这个数组在noaa.js文件中会用到
    let arrOfStationNumber = [];
    result.resultArr.forEach((v) => {
        let tempObj = {
            USAF: '',
            WBAN: '',
            DISTANCE: ''
        };
        tempObj.USAF = v.USAF;
        tempObj.WBAN = v.WBAN;
        tempObj.DISTANCE = v['DISTANCE(km)'];
        arrOfStationNumber.push(tempObj);
    });
    console.log(JSON.stringify(arrOfStationNumber));
}

/************* 笔记 *************/
//函数定义的 位置 或 顺序 也有有影响!!! 如果在下面定义，可能会报错 is not defined!
/************* 笔记 *************/

/********** 1. 根据 站号 或 坐标 找相邻站 **********/
function getNearbyStations(searchType, stationNumber, coorArr, maxDistance, limited){
    //Get info of the specific station
    let newData = [];
    let newArr = [];
    let currentLat = 180;
    let currentLon = 180;

    if(searchType === 1){
        currentLat = coorArr[0];
        currentLon = coorArr[1];
    }

    data.forEach((v) => {
        //get station number of current cell
        let cellUSAF = '';
        let originalCellUSAF = v['USAF'].toString();
        let originalCellWBAN = v['WBAN'].toString();
        let len = originalCellUSAF.length;

        if(limited === 'limited'){ //使用严格模式，站号必须满足xxxxx-0-99999形式，只搜索符合这个格式的站点，结果会少很多，尤其对于北美地区
            if(len < 5 || originalCellUSAF.substring(len-1, len) !== '0' || originalCellWBAN !== '99999'){return;} //jump out loop for this time
        }
        if(len < 6){
            cellUSAF = repeatedNumberStr(0, 6 - len) + originalCellUSAF;
        }else if(len === 6){
            cellUSAF = originalCellUSAF;
        }
        
        //push current obj to newData if the obj contain LAT property
        if(v.hasOwnProperty('LAT')){
            newData.push(v);

            if(searchType === 0){
                let len = stationNumber.toString().length;
                let inputedUSAF = '';
                //If station number match
                if(len === 5){
                    inputedUSAF = stationNumber.toString() + '0';
                }else if(len === 6){
                    inputedUSAF = stationNumber.toString();
                }
                if(inputedUSAF === cellUSAF){
                    currentLat = v['LAT'];
                    currentLon = v['LON'];
                }
            }
        }
    });
    
    //没搞懂这里为什么必须用新数组，问题先留着。。。
    newData.forEach((v) => {
        newArr.push({
            'COUNTRY': v['CTRY'],
            'NAME': v['STATION NAME'],
            'USAF': getSixDigitsUSAF(v['USAF']), //v['USAF']
            'WBAN': getFiveDigitsWBAN(v['WBAN']),
            'COORDINATES': v['LAT'] + ', ' + v['LON'],
            'ELEV(m)': v['ELEV(M)'],
            'BEGIN': v['BEGIN'],
            'END': v['END'],
            'DISTANCE(km)': haversineGreatCircleDistance(v['LAT'], v['LON'], currentLat, currentLon),
            'LAT': v['LAT'],
            'LON': v['LON']
        });
    });

    function getSixDigitsUSAF(n){
        let str1 = n.toString();
        let len1 = str1.length;
        return len1 < 6 ? repeatedNumberStr(0, 6 - len1) + str1 : str1;
    }
    function getFiveDigitsWBAN(n){
        let str1 = n.toString();
        let len1 = str1.length;
        return len1 < 5 ? repeatedNumberStr(0, 5 - len1) + str1 : str1;
    }

    //筛选距离，这个是必须的
    let resultArr = newArr.filter((e) => e['DISTANCE(km)'] <= maxDistance);
    //筛选国家, 留空则不筛选
    let countryCode = config.filters.countryCode.trim().toUpperCase();
    if(countryCode !== ''){ resultArr = resultArr.filter((e) => e['COUNTRY'] === countryCode.trim()); }

    //筛选海拔
    if(config.filters.byElev > 0){
        resultArr = resultArr.filter( (e) => Number(e['ELEV(m)']) >= config.filters.elev1 && Number(e['ELEV(m)']) <= config.filters.elev2 );
    }

    //筛选经纬度
    if(config.filters.byCoordsRange > 0){
        resultArr = resultArr.filter((e) => coordsMatched( e['LAT'], e['LON'], config.filters.lat1, config.filters.lat2, config.filters.lon1, config.filters.lon2 ));
    }
    //筛选USAF, 一般不筛选
    if(config.usafNoEnd0 > 0){ resultArr = resultArr.filter((e) => e['USAF'].substring(5, 6) !== '0'); }

    //注意多种排序的先后顺序
    if(config.sort.item.toUpperCase() === 'd'.toUpperCase()){ //按距离排序
        resultArr.sort((a, b) => {
            if(config.sort.order === 'asc'){
                return a['DISTANCE(km)'] - b['DISTANCE(km)'];
            }else{
                return b['DISTANCE(km)'] - a['DISTANCE(km)'];
            }
        });
    }else if(config.sort.item.toUpperCase() === 'e'.toUpperCase()){ //按海拔排序
        resultArr.sort((a, b) => {
            if(a['ELEV(m)'] === undefined && b['ELEV(m)'] === undefined){
                return 0;
            }else if(b['ELEV(m)'] === undefined){
                return -1;
            }else if(a['ELEV(m)'] === undefined){
                return 1;
            }else{
                if(config.sort.order === 'asc'){
                    return a['ELEV(m)'] - b['ELEV(m)'];
                }else{
                    return b['ELEV(m)'] - a['ELEV(m)'];
                }
            }
        });
    }
    return {
        'resultArr': resultArr,
        'total': resultArr.length
    }
}

//首字母大写
function upperStr0(str){
    let tempStr = str.toLowerCase();
    return tempStr.charAt(0).toUpperCase() + tempStr.slice(1);
}
//判断经纬度坐标是否符合限制或筛选条件
function coordsMatched(sourceLat, sourceLon, lat1, lat2, lon1, lon2){
    return ( Number(sourceLat) >= lat1 && Number(sourceLat) <= lat2 && Number(sourceLon) >= lon1 && Number(sourceLon) <= lon2 );
}
//生成特定长度的重复同一数字的字符串，比如生成长度为3的重复0的字符串 '000'
function repeatedNumberStr(n, nStrLen){
    let tempStr = n.toString();
    let resultStr = '';
    for(let i = 0; i < nStrLen; i++){
        resultStr += tempStr;
    }
    return resultStr;
}

//来自网络
//根据经纬度计算两坐标距离，把地球近似认为是圆球体
//https://blog.csdn.net/hinfa/article/details/140696527
function toRadians(angle) {
    return angle * (Math.PI / 180);
}

function haversineGreatCircleDistance(latitudeFrom, longitudeFrom, latitudeTo, longitudeTo, earthRadius = 6371) {
    // 将十进制度数转化为弧度
    const latFrom = toRadians(latitudeFrom);
    const lonFrom = toRadians(longitudeFrom);
    const latTo = toRadians(latitudeTo);
    const lonTo = toRadians(longitudeTo);

    // 应用haversine公式
    const deltaLat = latTo - latFrom;
    const deltaLon = lonTo - lonFrom;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(latFrom) * Math.cos(latTo) *
    Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return (earthRadius * c).toFixed(1); // 返回距离，单位千米
}

// 使用示例
//const distance = haversineGreatCircleDistance(34.0522, -118.2437, 36.1699, -115.1398);
//console.log(distance); // 输出两点间距离，单位公里