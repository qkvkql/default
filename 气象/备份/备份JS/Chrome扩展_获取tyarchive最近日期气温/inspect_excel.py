import pandas as pd

file_path = r"D:\文档\GIT SYNC\default\气象\For_Python_站点信息和记录.xlsx"
df = pd.read_excel(file_path, nrows=5)
print("Columns:")
print(df.columns.tolist())
print("\nFirst 5 rows:")
print(df.head())
