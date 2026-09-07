// ==========================================
// 1. YOUR LOGIC FUNCTION
// ==========================================
function getTargetStationsAvg() {
    let arrOfStations = [{"站点":"乌布苏省 特斯","aimag":"Увс","cym":"Тэс"},{"站点":"乌布苏省 东戈壁","aimag":"Увс","cym":"Зүүнговь"},{"站点":"扎布汗省 特斯","aimag":"Завхан","cym":"Тэс"},{"站点":"扎布汗省 台勒门","aimag":"Завхан","cym":"Тэлмэн"},{"站点":"扎布汗省 鄂特冈","aimag":"Завхан","cym":"Отгон"},{"站点":"库苏古尔省 查干诺尔","aimag":"Хөвсгөл","cym":"Цагааннуур"},{"站点":"色楞格省 尧勒","aimag":"Сэлэнгэ","cym":"Ерөө"},{"站点":"乌布苏省 乌兰固木","aimag":"Увс","cym":"Улаангом"},{"站点":"扎布汗省 巴彦特斯","aimag":"Завхан","cym":"Баянтэс"},{"站点":"扎布汗省 车臣乌拉","aimag":"Завхан","cym":"Цэцэн-Уул"},{"站点":"扎布汗省 陶松臣格勒","aimag":"Завхан","cym":"Тосонцэнгэл"},{"站点":"库苏古尔省 仁钦隆勃","aimag":"Хөвсгөл","cym":"Ренчинлхүмбэ"},{"站点":"乌兰巴托市 乌兰巴托","aimag":"Нийслэл","cym":"Улаанбаатар"},{"站点":"乌兰巴托市 Налайх","aimag":"Нийслэл","cym":"Налайх"},{"站点":"乌兰巴托市 Буянт-Ухаа","aimag":"Нийслэл","cym":"Хан-Уул (Буянт-Ухаа)"},{"站点":"巴彦洪戈尔省 古尔班布拉格","aimag":"Баянхонгор","cym":"Гурванбулаг"},{"站点":"巴彦洪戈尔省 扎尔嘎朗特","aimag":"Баянхонгор","cym":"Жаргалант"},{"站点":"巴彦洪戈尔省 巴彦布拉格","aimag":"Баянхонгор","cym":"Баянбулаг"},{"站点":"巴彦洪戈尔省 嘎鲁特","aimag":"Баянхонгор","cym":"Галуут"},{"站点":"科布多省 德尔根","aimag":"Ховд","cym":"Дөргөн"},{"站点":"科布多省 额尔德尼布伦","aimag":"Ховд","cym":"Эрдэнэбүрэн"},{"站点":"科布多省 其其格","aimag":"Ховд","cym":"Цэцэг"},{"站点":"科布多省 布尔干","aimag":"Ховд","cym":"Булган"},{"站点":"科布多省 Мөст","aimag":"Ховд","cym":"Мөст"},{"站点":"戈壁阿尔泰省 额尔德尼","aimag":"Говь-Алтай","cym":"Эрдэнэ"},{"站点":"戈壁阿尔泰省 阿尔泰","aimag":"Говь-Алтай","cym":"Есөн булаг"},{"站点":"库苏古尔省 查干乌拉","aimag":"Хөвсгөл","cym":"Цагаан-Уул"},{"站点":"库苏古尔省 乌兰乌拉","aimag":"Хөвсгөл","cym":"Улаан-Уул"},{"站点":"库苏古尔省 查干乌尔","aimag":"Хөвсгөл","cym":"Цагаан-Үүр"},{"站点":"库苏古尔省 阿拉格额尔德尼","aimag":"Хөвсгөл","cym":"Алаг-Эрдэнэ"},{"站点":"库苏古尔省 哈特嘎勒","aimag":"Хөвсгөл","cym":"Хатгал тосгон"},{"站点":"库苏古尔省 木伦","aimag":"Хөвсгөл","cym":"Мөрөн"},{"站点":"库苏古尔省 阿尔布拉格","aimag":"Хөвсгөл","cym":"Арбулаг"},{"站点":"库苏古尔省 车车尔勒格","aimag":"Хөвсгөл","cym":"Цэцэрлэг"},{"站点":"库苏古尔省 巴彦珠尔赫","aimag":"Хөвсгөл","cym":"Баянзүрх"},{"站点":"库苏古尔省 汗赫","aimag":"Хөвсгөл","cym":"Ханх"},{"站点":"库苏古尔省 额尔德尼布尔干","aimag":"Хөвсгөл","cym":"Эрдэнэбулган"},{"站点":"库苏古尔省 拉善特","aimag":"Хөвсгөл","cym":"Рашаант"},{"站点":"色楞格省 宗布伦","aimag":"Сэлэнгэ","cym":"Зүүнбүрэн"},{"站点":"色楞格省 Зэлтэр","aimag":"Сэлэнгэ","cym":"Зэлтэр"},{"站点":"色楞格省 鄂尔浑图勒","aimag":"Сэлэнгэ","cym":"Орхонтуул"},{"站点":"乌布苏省 达布斯特","aimag":"Увс","cym":"Давст"},{"站点":"乌布苏省 马勒钦","aimag":"Увс","cym":"Малчин"},{"站点":"乌布苏省 南戈壁","aimag":"Увс","cym":"Өмнөговь"},{"站点":"乌布苏省 萨吉勒","aimag":"Увс","cym":"Сагил"},{"站点":"乌布苏省 图尔根","aimag":"Увс","cym":"Түргэн"},{"站点":"乌布苏省 西图伦","aimag":"Увс","cym":"Баруунтуруун"},{"站点":"乌布苏省 扎布汗","aimag":"Увс","cym":"Завхан"},{"站点":"乌布苏省 东杭爱","aimag":"Увс","cym":"Зүүнхангай"},{"站点":"乌布苏省 温都尔杭爱","aimag":"Увс","cym":"Өндөрхангай"},{"站点":"扎布汗省 巴彦海尔汗","aimag":"Завхан","cym":"Баянхайрхан"},{"站点":"扎布汗省 大乌拉","aimag":"Завхан","cym":"Их-Уул"},{"站点":"扎布汗省 讷木勒格","aimag":"Завхан","cym":"Нөмрөг"},{"站点":"扎布汗省 桑特马尔噶茨","aimag":"Завхан","cym":"Сантмаргац"},{"站点":"扎布汗省 图德夫泰","aimag":"Завхан","cym":"Түдэвтэй"},{"站点":"扎布汗省 乌尔嘎马勒","aimag":"Завхан","cym":"Ургамал"},{"站点":"扎布汗省 亚鲁","aimag":"Завхан","cym":"Яруу"},{"站点":"扎布汗省 伊德尔","aimag":"Завхан","cym":"Идэр"},{"站点":"扎布汗省 扎布汗曼达勒","aimag":"Завхан","cym":"Завханмандал"},{"站点":"巴彦乌列盖省 Сагсай","aimag":"Баян-Өлгий","cym":"Сагсай"},{"站点":"巴彦乌列盖省 阿尔泰","aimag":"Баян-Өлгий","cym":"Алтай"},{"站点":"巴彦乌列盖省 布尔干","aimag":"Баян-Өлгий","cym":"Булган"},{"站点":"后杭爱省 温都尔乌兰","aimag":"Архангай","cym":"Өндөр-Улаан"},{"站点":"后杭爱省 杭爱","aimag":"Архангай","cym":"Хангай"},{"站点":"后杭爱省 额勒济特","aimag":"Архангай","cym":"Өлзийт"},{"站点":"后杭爱省 楚鲁特","aimag":"Архангай","cym":"Чулуут"},{"站点":"后杭爱省 塔里亚特","aimag":"Архангай","cym":"Тариат"},{"站点":"后杭爱省 Цахир","aimag":"Архангай","cym":"Цахир"},{"站点":"前杭爱省 巴彦温都尔","aimag":"Өвөрхангай","cym":"Баян-Өндөр"},{"站点":"前杭爱省 Уянга","aimag":"Өвөрхангай","cym":"Уянга"},{"站点":"中央省 蒙根莫里特","aimag":"Төв","cym":"Мөнгөнморьт"},{"站点":"肯特省 巴特希雷特","aimag":"Хэнтий","cym":"Батширээт"},{"站点":"肯特省 臣赫尔曼达勒","aimag":"Хэнтий","cym":"Цэнхэрмандал"}];

    let tbodys = document.getElementById('customers').getElementsByTagName('tbody');
    //获取标题
    let arrOfThStrs = [];
    let ths = tbodys[0].getElementsByTagName('tr')[0].getElementsByTagName('th');
    for(let i=0; i<ths.length; i++){
        arrOfThStrs.push(ths[i].innerText.toString().trim());
    }
    //填装数组
    let arrOfObj = [];
    for(let i=1; i<tbodys.length; i++){
        let tempObj = {};
        let tempTds = tbodys[i].getElementsByTagName('tr')[0].getElementsByTagName('td');
        let tempValues = []
        for(let j=0; j<ths.length; j++){
            tempObj[arrOfThStrs[j]] = tempTds[j].innerText.toString().trim();
            if(j > 3){
                tempValues.push(Number(tempTds[j].innerText.toString().trim()))
            }
        }

        let tempSum = 0;
        let total = tempValues.length; //数据个数
        for(let j=0; j<total; j++){
            tempSum += tempValues[j];
        }
        let avg = (tempSum/total).toFixed(2).toString();
        tempObj['avg_of8'] = avg;
        tempObj['total'] = total;
        arrOfObj.push(tempObj);
    }

    let targetStationsResult = '';
    for(let i = 0; i < arrOfStations.length; i++){
        let tempStr = '';
        let temp_aimag = arrOfStations[i]['aimag'];
        let temp_cym = arrOfStations[i]['cym'];
        for(let j = 0; j < arrOfObj.length; j++){
            let data_aimag = arrOfObj[j]['Аймаг↓'].trim();
            let data_cym = arrOfObj[j]['Сум↓'].trim();
            if(temp_aimag === data_aimag && temp_cym === data_cym){
                tempStr = arrOfObj[j]['avg_of8'].toString().trim();
                break;
            }
        }
        if(i < arrOfStations.length - 1){
            targetStationsResult += tempStr + '\n';
        }else{
            targetStationsResult += tempStr;
        }
    }
    
    console.log("Calculation complete.");
    return targetStationsResult;
}

// ==========================================
// 2. EXTENSION UI & LOGIC
// ==========================================

function initExtension() {
    console.log("Weather Extension starting...");

    // 1. Run the calculation
    let resultText = "";
    try {
        resultText = getTargetStationsAvg();
    } catch (e) {
        resultText = "Error calculating data: " + e.message;
        console.error(e);
    }

    // 2. Create the UI Container
    const container = document.createElement('div');
    container.id = "weather-ext-container";
    container.style.position = "fixed";
    container.style.top = "20px";
    container.style.right = "20px";
    container.style.width = "300px";
    container.style.backgroundColor = "#222"; // Dark Background
    container.style.color = "#00FF00";        // Bright Green Font
    container.style.padding = "15px";
    container.style.borderRadius = "8px";
    container.style.zIndex = "99999";
    container.style.boxShadow = "0 4px 15px rgba(0,0,0,0.5)";
    container.style.fontFamily = "monospace";
    container.style.border = "1px solid #444";

    // 3. Create Title
    const title = document.createElement('div');
    title.innerText = "Station Averages";
    title.style.marginBottom = "10px";
    title.style.fontWeight = "bold";
    title.style.color = "#fff";
    container.appendChild(title);

    // 4. Create Text Area (to show result)
    const textarea = document.createElement('textarea');
    textarea.value = resultText;
    textarea.style.width = "100%";
    textarea.style.height = "200px";
    textarea.style.backgroundColor = "#111";
    textarea.style.color = "#00FF00";
    textarea.style.border = "1px solid #555";
    textarea.style.marginBottom = "10px";
    textarea.style.resize = "vertical";
    container.appendChild(textarea);

    // 5. Create Copy Button
    const btn = document.createElement('button');
    btn.innerText = "Copy to Clipboard";
    btn.style.width = "100%";
    btn.style.padding = "8px";
    btn.style.backgroundColor = "#007acc";
    btn.style.color = "white";
    btn.style.border = "none";
    btn.style.cursor = "pointer";
    btn.style.fontWeight = "bold";
    btn.style.borderRadius = "4px";

    // Button Hover effect
    btn.onmouseover = () => btn.style.backgroundColor = "#005f9e";
    btn.onmouseout = () => btn.style.backgroundColor = "#007acc";

    // 6. Copy Functionality (HTTP Safe Method)
    btn.onclick = function() {
        textarea.select();
        textarea.setSelectionRange(0, 99999); // For mobile devices

        try {
            // This is the older method, but it works on HTTP sites
            // unlike navigator.clipboard which requires HTTPS
            document.execCommand('copy'); 
            
            // Visual feedback
            let originalText = btn.innerText;
            btn.innerText = "Copied!";
            btn.style.backgroundColor = "#28a745";
            setTimeout(() => {
                btn.innerText = originalText;
                btn.style.backgroundColor = "#007acc";
            }, 1500);
        } catch (err) {
            alert('Failed to copy. Please manually copy the text area.');
        }
    };

    container.appendChild(btn);
    document.body.appendChild(container);
}

// ==========================================
// 3. TRIGGER LOAD (1 Second Delay)
// ==========================================

window.addEventListener('load', function() {
    setTimeout(initExtension, 1000);
});