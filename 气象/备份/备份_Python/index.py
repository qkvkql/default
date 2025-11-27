#非常重要，放最前面，保证解码西班牙语正常
import sys
sys.stdout.reconfigure(encoding='utf-8')

import os
import pandas as pd
import math
import json
import openpyxl

path = "D:/文档/GIT SYNC/default/气象/For_Python_站点信息和记录.xlsx"

# 写文件
workbook = openpyxl.load_workbook(path)
sheet = workbook['站点信息和记录']
# L列=min M列=max N列=avg
"""
sheet['L2'] = ''
sheet['N5'] = ''
sheet.cell(row=4, column=12, value='')
workbook.save(path)
"""
# 读文件
rows = list(sheet.values)
arrOfObj = []
if rows:
    headers = rows[0]
    content_rows = rows[1:]
    arrOfObj = [dict(zip(headers, row)) for row in content_rows]
else:
    print("The sheet is empty.")

# 筛选出有气温数据的站
filteredArr = [e for e in arrOfObj if isinstance(e['id'], int) and not ( (e['min'] is None) and (e['max'] is None) )]
# 特供函数
def sort_mix_type(e, attr, asc):
    strArr = []
    for e1 in headers:
        strArr.append(e1)
    for s in strArr:
        if isinstance(e[s], int):
            e[s] = float(e[s])
        if e[s] is None:
            e[s] = float('inf') if asc else float('-inf')
    return e[attr]
# 数组排序
sortedArr = sorted(
    filteredArr,
    key = lambda x: (sort_mix_type(x, 'min', True), sort_mix_type(x, 'max', True))
)
for o in sortedArr:
    for k in o:
        if isinstance(o[k], float) and math.isinf(o[k]):
            o[k] = ''
        if k == 'prefix' and isinstance(o[k], str) and len(o[k]) > 0:
            o['cn_name'] = o['prefix'] + '_' + o['cn_name']

def arr_east_asia():
    eaArr = [e for e in sortedArr if e['east_asia'] == 'Y']
    return eaArr

# 导出为JSON
output_path = "D:/文档/Python/气温表格图片HTML/stations_data.js"
json_all_stations = json.dumps(sortedArr, indent=4)
json_ea_stations = json.dumps(arr_east_asia(), indent=4)
js_all_stations = f'export const array_of_stations_by_different_filters = {{\n"汇总": {json_all_stations}, \n"东亚": {json_ea_stations}}};'
with open(output_path, "w", encoding="utf-8") as f:
    f.write(js_all_stations)

print(f"Successfully created .js file")

#temps = str(sortedArr[0]['prefix'])
#print(sortedArr)