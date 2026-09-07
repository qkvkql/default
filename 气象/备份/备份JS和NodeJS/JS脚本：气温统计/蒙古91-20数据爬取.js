let overallTable = document.getElementsByTagName('table')[0];
let trArr = overallTable.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
let aimagNames = [];
let resultText = '';
for(let i = 0; i < trArr.length; i++){
    let tdArr = trArr[i].getElementsByTagName('td');

    if(tdArr.length === 1){
        let aimagText = tdArr[0].innerText.trim();
        aimagNames.push(aimagText);
        //resultText += aimagText + '\n';
    }else if(tdArr.length === 14){
        let currentAimagText = getCurrentAimagText(aimagNames);

        if(i === 0){ continue; }
        for(let j = 0; j <= tdArr.length; j++){
            if(j === 0){
                resultText += currentAimagText + '\t' + tdArr[j].innerText.trim() + '\t';
            }else if(j < tdArr.length - 1){
                resultText += tdArr[j].innerText.trim() + '\t';
            }else if(j === tdArr.length - 1){
                if(i < trArr.length - 1){
                    resultText += tdArr[j].innerText.trim() + '\n';
                }else{
                    resultText += tdArr[j].innerText.trim();
                }
            }
        }
    }
}

function getCurrentAimagText(arr){
    return arr[arr.length - 1];
}

console.log(resultText);