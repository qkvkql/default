// Global variable to store the accumulated result
let fullResultText = '';

// Wait 1 second after load to inject the panel
setTimeout(() => {
    initExtension();
}, 1000);

function initExtension() {
    const panel = document.createElement('div');
    panel.id = 'my-weather-extension-panel';
    
    const title = document.createElement('span');
    title.className = 'panel-title';
    title.innerText = 'Weather Data Tools';
    panel.appendChild(title);

    // --- TOP ROW (Existing 5 Buttons) ---
    const layoutTop = document.createElement('div');
    layoutTop.className = 'control-layout';

    const leftControls = document.createElement('div');
    leftControls.className = 'controls-left';
    const rightControls = document.createElement('div');
    rightControls.className = 'controls-right';

    createButton(leftControls, '1. Open Menu', 'btn-setup', handleOpenDropdown);
    createButton(leftControls, '2. Sel 100', 'btn-setup', handleSelect100);
    createButton(leftControls, '4. Prev Pg', 'btn-nav', handlePrevPage);
    createButton(leftControls, '3. Next Pg', 'btn-nav', handleNextPage);
    createButton(rightControls, 'RUN SCRIPT', 'btn-run', handleRunScript);

    layoutTop.appendChild(leftControls);
    layoutTop.appendChild(rightControls);
    panel.appendChild(layoutTop);

    // --- BOTTOM ROW (New 2 Buttons) ---
    const layoutBottom = document.createElement('div');
    layoutBottom.className = 'control-layout-bottom';

    createButton(layoutBottom, '6. AUTO RUN ALL', 'btn-auto', handleAutoRun);
    createButton(layoutBottom, '7. Process & Copy', 'btn-copy', handleCopyFinal);

    panel.appendChild(layoutBottom);

    // --- RESULT BOX ---
    const resultBox = document.createElement('div');
    resultBox.id = 'my-weather-result';
    resultBox.innerText = 'Ready...';
    resultBox.title = 'Click to copy raw content';
    
    // Simple click copy for the box (Requirement 2)
    resultBox.addEventListener('click', () => {
        copyToClipboard(resultBox.innerText, resultBox);
    });

    panel.appendChild(resultBox);
    document.body.appendChild(panel);
}

function createButton(parent, text, className, clickHandler) {
    const btn = document.createElement('button');
    btn.innerText = text;
    btn.className = className;
    btn.addEventListener('click', clickHandler);
    parent.appendChild(btn);
}

function updateStatus(msg) {
    const box = document.getElementById('my-weather-result');
    if (box) box.innerText = msg + '\n\n' + box.innerText;
}

// Utility: Wait function
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Utility: Copy helper
function copyToClipboard(text, elementToFlash) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
        if (elementToFlash) {
            const originalColor = elementToFlash.style.color;
            elementToFlash.style.color = 'white';
            setTimeout(() => { elementToFlash.style.color = originalColor; }, 200);
        }
        alert("Copied to clipboard!");
    });
}

// --- Button Functions ---

function handleOpenDropdown() {
    const items = document.querySelectorAll('.ant-select-selection-item');
    let found = false;
    items.forEach(item => {
        if (item.innerText.trim() === '10 / page') {
            item.click(); 
            item.closest('.ant-select-selector')?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            found = true;
        }
    });
    return found;
}

function handleSelect100() {
    const options = document.querySelectorAll('.ant-select-item-option-content');
    let found = false;
    options.forEach(opt => {
        if (opt.innerText.trim() === '100 / page') {
            opt.click();
            found = true;
        }
    });
    return found;
}

function getCurrentPageNumber() {
    const activeItem = document.querySelector('.ant-pagination-item-active');
    return activeItem ? parseInt(activeItem.title || activeItem.innerText) : 1;
}

function handleNextPage() {
    const current = getCurrentPageNumber();
    const nextItem = document.querySelector(`.ant-pagination-item-${current + 1}`);
    if (nextItem) {
        nextItem.click();
        return true;
    }
    return false;
}

function handlePrevPage() {
    const current = getCurrentPageNumber();
    if (current <= 1) return;
    const prevItem = document.querySelector(`.ant-pagination-item-${current - 1}`);
    if (prevItem) prevItem.click();
}

// Helper to capture console.log output from your custom script without printing to UI immediately
function captureScriptOutput() {
    let logs = [];
    const originalLog = console.log;
    console.log = function(...args) {
        logs.push(args.join('\t')); // Use Tab to ensure TSV compatibility if user sends multiple args
    };

    try {
        yourCustomExtractionLogic();
    } catch (e) {
        logs.push("Error: " + e.message);
    } finally {
        console.log = originalLog;
    }
    return logs.join('\n');
}

// Button 5: Manual Run
function handleRunScript() {
    const output = captureScriptOutput();
    const box = document.getElementById('my-weather-result');
    box.innerText = output;
}

// --- STEP 2: AUTO BUTTON LOGIC ---
async function handleAutoRun() {
    const box = document.getElementById('my-weather-result');
    box.innerText = "Starting Automation...";
    
    // Step 2-a: Wait 1s, Define empty string
    await wait(1000);
    fullResultText = '';
    console.log("Auto: Started");

    // Step 2-b: Click Menu, wait 1s
    handleOpenDropdown();
    await wait(1000);

    // Step 2-c: Click 100, wait 1s
    handleSelect100();
    await wait(1000);

    // Step 2-d: First Page processing
    // Ensure we are on page 1 (technically should be, but good to check)
    // Run script
    let firstPageResult = captureScriptOutput();
    fullResultText = firstPageResult; // Assign complete result including headers
    box.innerText = `Page 1 Captured. Lines: ${firstPageResult.split('\n').length}`;
    await wait(1000);

    // Step 2-e: Loop until last page
    let keepGoing = true;
    let pageCount = 1;

    while (keepGoing) {
        let currentPage = getCurrentPageNumber();
        
        // Try clicking next
        let clickedNext = handleNextPage();
        
        // Wait 1s
        await wait(1000);
        
        let newPage = getCurrentPageNumber();

        // If page didn't change, we are at the end
        if (!clickedNext || newPage === currentPage) {
            keepGoing = false;
            box.innerText += `\nReached End at Page ${pageCount}.`;
        } else {
            pageCount++;
            // Run script for new page
            let pageResult = captureScriptOutput();
            
            // Add new line
            fullResultText += '\n';
            
            // Add content excluding headers (Row 1)
            let lines = pageResult.split('\n');
            if (lines.length > 1) {
                // Remove first element (Title)
                lines.shift();
                fullResultText += lines.join('\n');
            }
            
            box.innerText = `Processing Page ${pageCount}...\nTotal Text Length: ${fullResultText.length}`;
        }
    }
    
    box.innerText = "Automation Finished!\nClick 'Process & Copy' to get final result.";
    console.log("Auto: Finished");
}

// --- STEP 3: COPY RESULT BUTTON LOGIC ---
function handleCopyFinal() {
    if (!fullResultText) {
        alert("No data collected yet. Please run 'AUTO RUN ALL' first.");
        return;
    }

    try {
        // Step 3-a: Convert fullResultText (TSV) to Array of Objects
        const rows = fullResultText.trim().split('\n');
        
        if (rows.length < 2) {
            alert("Not enough data to process.");
            return;
        }

        // Assume first row is headers, separated by Tab (\t)
        // Note: Your script must output Tabs for this to work flawlessly. 
        // If your script outputs spaces, this split might fail. 
        // Based on "TSV format" requirement, we split by \t.
        const headers = rows[0].split('\t').map(h => h.trim());
        
        const arrOfObj = [];

        for (let i = 1; i < rows.length; i++) {
            const currentLine = rows[i].split('\t');
            let obj = {};
            
            // Map values to headers
            headers.forEach((header, index) => {
                obj[header] = (currentLine[index] || '').trim();
            });
            
            arrOfObj.push(obj);
        }

        console.log(`Parsed ${arrOfObj.length} rows of data.`);

        // Step 3-b: Call your provided function
        const finalString = getFinalResult(arrOfObj);

        // Copy to clipboard
        copyToClipboard(finalString, document.getElementById('my-weather-result'));

    } catch (e) {
        console.error(e);
        alert("Error processing data: " + e.message);
    }
}

// ---------------------------------------------------------
// YOUR PROVIDED PROCESSING FUNCTION (Step 3-c)
// ---------------------------------------------------------
function getFinalResult(arrOfObj){
    let arrOfStations = [{"站点":"乌布苏省 特斯","aimag":"Увс","cym":"Тэс"},{"站点":"乌布苏省 东戈壁","aimag":"Увс","cym":"Зүүнговь"},{"站点":"扎布汗省 特斯","aimag":"Завхан","cym":"Тэс"},{"站点":"扎布汗省 台勒门","aimag":"Завхан","cym":"Тэлмэн"},{"站点":"扎布汗省 鄂特冈","aimag":"Завхан","cym":"Отгон"},{"站点":"库苏古尔省 查干诺尔","aimag":"Хөвсгөл","cym":"Цагааннуур"},{"站点":"色楞格省 尧勒","aimag":"Сэлэнгэ","cym":"Ерөө"},{"站点":"乌布苏省 乌兰固木","aimag":"Увс","cym":"Улаангом"},{"站点":"扎布汗省 巴彦特斯","aimag":"Завхан","cym":"Баянтэс"},{"站点":"扎布汗省 车臣乌拉","aimag":"Завхан","cym":"Цэцэн-Уул"},{"站点":"扎布汗省 陶松臣格勒","aimag":"Завхан","cym":"Тосонцэнгэл"},{"站点":"库苏古尔省 仁钦隆勃","aimag":"Хөвсгөл","cym":"Ренчинлхүмбэ"},{"站点":"乌兰巴托市 乌兰巴托","aimag":"Нийслэл","cym":"Улаанбаатар"},{"站点":"乌兰巴托市 Налайх","aimag":"Нийслэл","cym":"Налайх"},{"站点":"乌兰巴托市 Буянт-Ухаа","aimag":"Нийслэл","cym":"Хан-Уул (Буянт-Ухаа)"},{"站点":"巴彦洪戈尔省 古尔班布拉格","aimag":"Баянхонгор","cym":"Гурванбулаг"},{"站点":"巴彦洪戈尔省 扎尔嘎朗特","aimag":"Баянхонгор","cym":"Жаргалант"},{"站点":"巴彦洪戈尔省 巴彦布拉格","aimag":"Баянхонгор","cym":"Баянбулаг"},{"站点":"巴彦洪戈尔省 嘎鲁特","aimag":"Баянхонгор","cym":"Галуут"},{"站点":"科布多省 德尔根","aimag":"Ховд","cym":"Дөргөн"},{"站点":"科布多省 额尔德尼布伦","aimag":"Ховд","cym":"Эрдэнэбүрэн"},{"站点":"科布多省 其其格","aimag":"Ховд","cym":"Цэцэг"},{"站点":"科布多省 布尔干","aimag":"Ховд","cym":"Булган"},{"站点":"科布多省 Мөст","aimag":"Ховд","cym":"Мөст"},{"站点":"戈壁阿尔泰省 额尔德尼","aimag":"Говь-Алтай","cym":"Эрдэнэ"},{"站点":"戈壁阿尔泰省 阿尔泰","aimag":"Говь-Алтай","cym":"Есөн булаг"},{"站点":"库苏古尔省 查干乌拉","aimag":"Хөвсгөл","cym":"Цагаан-Уул"},{"站点":"库苏古尔省 乌兰乌拉","aimag":"Хөвсгөл","cym":"Улаан-Уул"},{"站点":"库苏古尔省 查干乌尔","aimag":"Хөвсгөл","cym":"Цагаан-Үүр"},{"站点":"库苏古尔省 阿拉格额尔德尼","aimag":"Хөвсгөл","cym":"Алаг-Эрдэнэ"},{"站点":"库苏古尔省 哈特嘎勒","aimag":"Хөвсгөл","cym":"Хатгал тосгон"},{"站点":"库苏古尔省 木伦","aimag":"Хөвсгөл","cym":"Мөрөн"},{"站点":"库苏古尔省 阿尔布拉格","aimag":"Хөвсгөл","cym":"Арбулаг"},{"站点":"库苏古尔省 车车尔勒格","aimag":"Хөвсгөл","cym":"Цэцэрлэг"},{"站点":"库苏古尔省 巴彦珠尔赫","aimag":"Хөвсгөл","cym":"Баянзүрх"},{"站点":"库苏古尔省 汗赫","aimag":"Хөвсгөл","cym":"Ханх"},{"站点":"库苏古尔省 额尔德尼布尔干","aimag":"Хөвсгөл","cym":"Эрдэнэбулган"},{"站点":"库苏古尔省 拉善特","aimag":"Хөвсгөл","cym":"Рашаант"},{"站点":"色楞格省 宗布伦","aimag":"Сэлэнгэ","cym":"Зүүнбүрэн"},{"站点":"色楞格省 Зэлтэр","aimag":"Сэлэнгэ","cym":"Зэлтэр"},{"站点":"色楞格省 鄂尔浑图勒","aimag":"Сэлэнгэ","cym":"Орхонтуул"},{"站点":"乌布苏省 达布斯特","aimag":"Увс","cym":"Давст"},{"站点":"乌布苏省 马勒钦","aimag":"Увс","cym":"Малчин"},{"站点":"乌布苏省 南戈壁","aimag":"Увс","cym":"Өмнөговь"},{"站点":"乌布苏省 萨吉勒","aimag":"Увс","cym":"Сагил"},{"站点":"乌布苏省 图尔根","aimag":"Увс","cym":"Түргэн"},{"站点":"乌布苏省 西图伦","aimag":"Увс","cym":"Баруунтуруун"},{"站点":"乌布苏省 扎布汗","aimag":"Увс","cym":"Завхан"},{"站点":"乌布苏省 东杭爱","aimag":"Увс","cym":"Зүүнхангай"},{"站点":"乌布苏省 温都尔杭爱","aimag":"Увс","cym":"Өндөрхангай"},{"站点":"扎布汗省 巴彦海尔汗","aimag":"Завхан","cym":"Баянхайрхан"},{"站点":"扎布汗省 大乌拉","aimag":"Завхан","cym":"Их-Уул"},{"站点":"扎布汗省 讷木勒格","aimag":"Завхан","cym":"Нөмрөг"},{"站点":"扎布汗省 桑特马尔噶茨","aimag":"Завхан","cym":"Сантмаргац"},{"站点":"扎布汗省 图德夫泰","aimag":"Завхан","cym":"Түдэвтэй"},{"站点":"扎布汗省 乌尔嘎马勒","aimag":"Завхан","cym":"Ургамал"},{"站点":"扎布汗省 亚鲁","aimag":"Завхан","cym":"Яруу"},{"站点":"扎布汗省 伊德尔","aimag":"Завхан","cym":"Идэр"},{"站点":"扎布汗省 扎布汗曼达勒","aimag":"Завхан","cym":"Завханмандал"},{"站点":"巴彦乌列盖省 Сагсай","aimag":"Баян-Өлгий","cym":"Сагсай"},{"站点":"巴彦乌列盖省 阿尔泰","aimag":"Баян-Өлгий","cym":"Алтай"},{"站点":"巴彦乌列盖省 布尔干","aimag":"Баян-Өлгий","cym":"Булган"},{"站点":"后杭爱省 温都尔乌兰","aimag":"Архангай","cym":"Өндөр-Улаан"},{"站点":"后杭爱省 杭爱","aimag":"Архангай","cym":"Хангай"},{"站点":"后杭爱省 额勒济特","aimag":"Архангай","cym":"Өлзийт"},{"站点":"后杭爱省 楚鲁特","aimag":"Архангай","cym":"Чулуут"},{"站点":"后杭爱省 塔里亚特","aimag":"Архангай","cym":"Тариат"},{"站点":"后杭爱省 Цахир","aimag":"Архангай","cym":"Цахир"},{"站点":"前杭爱省 巴彦温都尔","aimag":"Өвөрхангай","cym":"Баян-Өндөр"},{"站点":"前杭爱省 Уянга","aimag":"Өвөрхангай","cym":"Уянга"},{"站点":"中央省 蒙根莫里特","aimag":"Төв","cym":"Мөнгөнморьт"},{"站点":"肯特省 巴特希雷特","aimag":"Хэнтий","cym":"Батширээт"},{"站点":"肯特省 臣赫尔曼达勒","aimag":"Хэнтий","cym":"Цэнхэрмандал"}];

    let resultArr=[];
    for(let i=0;i<arrOfStations.length;i++){
        let tempStationData={'index':i,'ifRecorded':false,'dataObj':{}};
        resultArr.push(tempStationData);
        for(let j=0;j<arrOfObj.length;j++){
            // Trim and Compare
            if(arrOfObj[j]['Аймаг нэр'] && arrOfObj[j]['Сумын нэр'] &&
               arrOfObj[j]['Аймаг нэр'].trim()===arrOfStations[i]['aimag'].trim() && 
               arrOfObj[j]['Сумын нэр'].trim()===arrOfStations[i]['cym'].trim()){
                
                resultArr[i]['dataObj']['min']=arrOfObj[j]['Хамгийн бага температур'];
                resultArr[i]['dataObj']['max']=arrOfObj[j]['Хамгийн их температур'];
                resultArr[i]['ifRecorded']=true
            }
        }
    }
    
    let resultStr='';
    for(let i=0;i<resultArr.length;i++){
        if(i<resultArr.length-1){
            if(resultArr[i]['ifRecorded']){
                resultStr+=resultArr[i]['dataObj']['min']+'\t'+resultArr[i]['dataObj']['max']+'\n'
            }else{
                resultStr+='无\t无\n'
            }
        }else{
            if(resultArr[i]['ifRecorded']){
                resultStr+=resultArr[i]['dataObj']['min']+'\t'+resultArr[i]['dataObj']['max']
            }else{
                resultStr+='无\t无'
            }
        }
    }
    // console.log(resultStr);
    return resultStr;
}

// ---------------------------------------------------------
// PASTE YOUR EXTRACTING JAVASCRIPT FUNCTION HERE
// ---------------------------------------------------------
function yourCustomExtractionLogic() {
    // IMPORTANT: 
    // Your code must output headers like: "Аймаг нэр \t Сумын нэр \t Хамгийн бага температур \t Хамгийн их температур"
    // And data rows separated by tabs (\t) for the parser to work correctly.
    
    // --- PASTE YOUR CODE BELOW THIS LINE ---
    //标题
    let thsOfTitle = document.getElementsByClassName('ant-table-thead')[0].getElementsByTagName('th');
    let arrOfTitles = []; //标题数组
    for(let i=0; i<thsOfTitle.length; i++){
        let tempH;
        if(i>0 && thsOfTitle[i-1].innerText.trim() === thsOfTitle[i].innerText.trim()){ //系统实况日高低温标题有重名，迫不得已加这个判断
            tempH = thsOfTitle[i-1].innerText.trim() + '_重名标题';
        }else{
            tempH = thsOfTitle[i].innerText.trim();
        }
        arrOfTitles.push(tempH);
    }
    //数据
    let trsOfDataRow = document.getElementsByClassName('ant-table-tbody')[0].getElementsByTagName('tr');
    let arrOfDataRows = []; //结果数组
    for(let i=0; i<trsOfDataRow.length; i++){
        let tdsOfCurrentTr = trsOfDataRow[i].getElementsByTagName('td');
        let tempObj = {};
        for(let j=0; j<tdsOfCurrentTr.length; j++){
            let tempContent = tdsOfCurrentTr[j].innerText.trim();
            if(tempContent.toString().length > 0){
                tempObj[arrOfTitles[j]] = tempContent;
            }else{
                tempObj[arrOfTitles[j]] = '列<' + (j+1).toString() + '>';
            }
        }
        arrOfDataRows.push(tempObj);
    }
    //打印结果(\t间隔)
    //console.table(arrOfDataRows);
    let resultStr = '';
    //填入标题行
    for(let i=0; i<arrOfTitles.length; i++){
        if(i < arrOfTitles.length - 1){
            resultStr += arrOfTitles[i] + '\t';
        }else{
            resultStr += arrOfTitles[i] + '\n';
        }
    }
    //填入数据
    for(let i=0; i<arrOfDataRows.length; i++){
        let keys = Object.keys(arrOfDataRows[i]);
        let values = Object.values(arrOfDataRows[i]);
        for(let j=0; j<keys.length; j++){
            if(j < keys.length - 1){
                resultStr += values[j] + '\t';
            }else{
                resultStr += values[j];
            }
        }
        if(i < arrOfDataRows.length - 1){
            resultStr += '\n';
        }
    }
    //console.log(arrOfDataRows);
    console.log(resultStr);

    // Example Test Code (Remove when you paste real code):
    // console.log("Аймаг нэр\tСумын нэр\tХамгийн бага температур\tХамгийн их температур");
    // console.log("Увс\tТэс\t-20\t-10");
    // console.log("Завхан\tТэс\t-25\t-15");

    // --- PASTE YOUR CODE ABOVE THIS LINE ---
}