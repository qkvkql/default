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

//在这里修改参数
findNearbyStations(0, '01047', [54.9386, 121.9177], 200); //4个参数：搜索类型(0=站号, 1=坐标) | 站号 | 坐标数组(纬度, 经度) | 最大坐标距离(只显示坐标距离小于此数的附近站点)

/************* 笔记 *************/
//函数定义的 位置 或 顺序 也有有影响!!! 如果在下面定义，可能会报错 is not defined!
/************* 笔记 *************/

/********** 1. 根据 站号 或 坐标 找相邻站 **********/
function findNearbyStations(searchType, stationNumber, coorArr, maxDistance){
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
        let tempNoStr = '';
        let cellNoStr = v['USAF'].toString();
        let cellWban = v['WBAN'].toString();
        let len = cellNoStr.length;

        if(cellNoStr.length < 5 || cellNoStr.substring(len-1, len) !== '0' || cellWban !== '99999'){return;} //jump out loop of this time
        if(len === 5){
            tempNoStr = '0' + cellNoStr.substring(0, 4);
        }else if(len === 6){
            tempNoStr = cellNoStr.substring(0, 5);
        }
        
        //push current obj to newData if the obj contain LAT property
        if(v.hasOwnProperty('LAT')){
            newData.push(v);

            if(searchType === 0){
                //If station number match
                if(stationNumber.toString() === tempNoStr){
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
            'NO.': getSimplifiedUSAF(v['USAF']), //v['USAF']
            'COORDINATES': v['LAT'] + ', ' + v['LON'],
            //'LAT': v['LAT'],
            //'LON': v['LON'],
            'ELEV(m)': v['ELEV(M)'],
            'BEGIN': v['BEGIN'],
            'END': v['END'],
            'DISTANCE(km)': haversineGreatCircleDistance(v['LAT'], v['LON'], currentLat, currentLon)
        });
    });

    function getSimplifiedUSAF(n){
        let tempStr = '';
        let str1 = n.toString();
        let len1 = str1.length;
        if(len1 === 5){
            tempStr = '0' + str1.substring(0, 4);
        }else if(len1 === 6){
            tempStr = str1.substring(0, 5);
        }
        return tempStr;
    }

    let finalArr = newArr.filter((e) => e['DISTANCE(km)'] <= maxDistance);
    finalArr.sort((a, b) => {return a['DISTANCE(km)'] - b['DISTANCE(km)'];});

    console.log('如果没结果或结果错误，大概是函数参数 顺序错误、类型错误 或 拼写错误');
    console.table(finalArr);
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