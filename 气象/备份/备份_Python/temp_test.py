import sys
sys.stdout.reconfigure(encoding='utf-8')
#鼠标xy offset坐标用chrome 【Mouse Coordinates】获得

import random
import time
import re
import pyperclip
from DrissionPage.common import Keys
from DrissionPage import ChromiumPage
from datetime import datetime, timedelta, timezone

mn_ws= [
    {
        'alias': 'uvs',
        'aimag': 'Увс',
        'url': 'https://uvs.weather.gov.mn/observation/weather',
        'cyms': [
            {
                'name': 'Тэс',
                'coor': [1003, 347]
            },
            {
                'name': 'Зүүнговь',
                'coor': [1011, 386]
            }
        ]
    },
    {
        'alias': 'zav',
        'aimag': 'Завхан',
        'url': 'https://zavkhan.weather.gov.mn/observation/weather',
        'cyms': []
    }
]

import random
import time
import re
from DrissionPage import ChromiumPage
from datetime import datetime, timedelta, timezone

ca = mn_ws[0]['cyms'][0]['coor']
def getMN(x, y):
    page = ChromiumPage()
    url = mn_ws[0]['url']
    page.get(url)
    page.wait(5)

    input1 = page.ele('#rc_select_0')
    input1.click()
    page.wait(0.5)

    input1.input(mn_ws[0]['cyms'][0]['name'])
    page.wait(0.5)

    input1.input(Keys.ENTER)
    page.wait(5)

    js_info_obj = f'''
let obj = {{
    'time': 'time not found',
    'aimag': 'aimag not found',
    'cym': 'cym not found'
}}
if(document.getElementsByClassName('text-base') !== null){{
    let tempArr = document.getElementsByClassName('text-base')[0].innerText.trim().split(', ');
    obj['time'] = tempArr[0].trim()
    obj['aimag'] = tempArr[1].trim()
    obj['cym'] = tempArr[2].trim()
}}
return obj;
'''
    info = page.run_js(js_info_obj)
    is_the_right_station = False
    print(info)

    if info['aimag'] == mn_ws[0]['aimag'] and info['cym'] == mn_ws[0]['cyms'][0]['name']:
        is_the_right_station = True
    print(is_the_right_station)
    page.scroll.down(300)
    


    canvas = page.ele('tag:canvas')
    rect = canvas.rect

    loc = canvas.rect.location
    size = canvas.rect.size
    left_x = loc[0]
    top_y  = loc[1]
    width  = size[0]
    height = size[1]
    right_x = left_x + width
    bottom_y = top_y + height
    data_y = top_y + (height * 0.4)
    slider_x = left_x + width * 0.595 #滑块右端的 x_offset
    slider_y = top_y + (height * 0.915) # 0.86 ~ 0.97可拖动; 0.915位于上下正中点

    page.actions.move_to((slider_x, slider_y)).hold().move_to((right_x, slider_y), duration = 3).release()
    time.sleep(5)

    start_x = left_x + 20
    end_x = right_x - 20

    def get_tooltip_text():
        try:
            # tooltip = page.ele('css:div[style*="pointer-events: none"][style*="position: absolute"]') #获取tooltip的备份代码(如果z-index会变化)
            # This xpath looks for a div with 'tooltip' in the style string
            tooltip = page.ele('css:div[style*="z-index: 9999999"]') #获取tooltip(弹出文本框)
            if tooltip:
                return tooltip.text
        except:
            return None
        return None
    
    current_x = start_x
    point_count = 0
    step_size = width/40 #10
    point_data = []
    while current_x < end_x:
        page.actions.move_to((current_x, data_y))
        time.sleep(0.5)
        
        text = get_tooltip_text()
        if text:
            text = text.split('\n')[2:-1]
            point_count += 1
            print(f"Point {point_count}:\n{text}\n") #{text.replace('\n', ' | ')}
            time.sleep(0.5)
        
        current_x += step_size

if __name__ == "__main__":
    getMN(ca[0], ca[1])