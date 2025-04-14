const fs = require('fs');
// First I want to read the file
fs.readFile('test.txt', 'utf8', function read(err, data) {
    if (err) {
        throw err;
    }
    const content = data;

    console.log(getExcelStr(content)); //行政前缀文本
    //console.log(getTerrainStr(content)); //地形文本
});

//地形文本
function getTerrainStr(str){
    let arr = str.trim().split('\n');
    let len = arr.length;
    //let newArr = [];
    let resultStr = '';
    arr.forEach((v, i) => {
        let subArr = v.trim().split('、');
        //newArr.push(subArr);
        let maxCharCount = 0;
        subArr.forEach((v1) => {
            let tempCharCount = countChineseCharacters(v1.trim());
            if(tempCharCount > maxCharCount){
                maxCharCount = tempCharCount;
            }
        });
        if(maxCharCount > 6){
            if(i < len - 1){
                resultStr += v.replace('、', ' ') + '\n';
            }else if(i === len - 1){
                resultStr += v.replace('、', ' ');
            }
        }else{
            if(subArr.length === 1){
                if(i < len - 1){
                    resultStr += v + '\n';
                }else if(i === len - 1){
                    resultStr += v;
                }
            }else if(subArr.length === 2){
                if(i < len - 1){
                    resultStr += '"' + subArr[0].trim() + '\n' + subArr[1].trim() + '"' + '\n';
                }else if(i === len - 1){
                    resultStr += '"' + subArr[0].trim() + '\n' + subArr[1].trim() + '"';
                }
            }
        }
    });
    return resultStr;
}

//行政前缀文本
function getExcelStr(str){
    let arr = str.trim().split('\n');
    let len = arr.length;
    let newArr = [];
    let resultStr = '';
    arr.forEach((v) => {
        let subArr = v.split('\t');
        newArr.push(subArr);
    });
    
    newArr.forEach((v, i) => {
        let c1 = countChineseCharacters(v[0].trim());
        let currentLineStr = '';
        if(c1 > 3){
            currentLineStr = arr[i].replace(/\t/g, ' ');
        }else{
            let lenSub = v.length;
            let c2a = countChineseCharacters(v[1].trim());
            let c2b = lenSub === 3 ? countChineseCharacters(v[2].trim()) : 0;
            let c2 = c2a + c2b;
            if(c2 <= 6){
                let tempStr = '';
                if(v[1].trim() === ''){
                    tempStr = v[2].trim();
                }else if(v[2].trim() === ''){
                    tempStr = v[1].trim();
                }else if(v[1].trim() === '' && v[2].trim() === ''){
                    tempStr = 'ERROR!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!';
                }else{
                    tempStr = v[1].trim() + ' ' + v[2].trim();
                }
                let sb = lenSub === 3 ? tempStr : v[1].trim();
                currentLineStr = '"' + v[0] + '\n' + sb + '"';
            }else{
                currentLineStr = arr[i].replace(/\t/g, ' ');
            }
        }
        if(i < len - 1){
            resultStr += currentLineStr + '\n';
        }else if(i === len - 1){
            resultStr += currentLineStr;
        }
    });

    return resultStr;
}
//console.log(countChineseCharacters('哈巴罗夫斯克边疆区'));
function countChineseCharacters(str) {
    // 定义一个正则表达式来匹配汉字
    const regex = /[\u4e00-\u9fff\u3400-\u4DBF\u20000-\u2A6DF\uF900-\uFAFF]/g;
    // 使用正则表达式的match方法找到所有匹配项
    const matches = str.match(regex);
    // 返回匹配项的数量，即汉字的个数
    return matches ? matches.length : 0;
}