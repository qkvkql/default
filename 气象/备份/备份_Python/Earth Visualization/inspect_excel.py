import pandas as pd
try:
    df = pd.read_excel('stations.xlsx')
    with open('cols.txt', 'w', encoding='utf-8') as f:
        for col in df.columns:
            f.write(f"{col}\n")
    print("Columns written to cols.txt")
except Exception as e:
    print(e)
