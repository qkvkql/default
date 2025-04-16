Sub 收集汇总表配色()

Dim startRow As Integer
Dim endRow As Integer
Dim startColumns As Variant
Dim ws As Worksheet

'自定义部分！！！可能需要随时修改
Set ws = ThisWorkbook.Sheets("收集汇总表") ' 自定义部分，工作表名称
startColumns = Array("H", "I") '自定义部分，确定哪两列是数值
startRow = 4 '自定义部分，数值起始行号
endRow = 200 '自定义部分，数值始终不会超过的行号

Dim columnLength As Integer
columnLength = UBound(startColumns) - LBound(startColumns) + 1

Dim maxCL As Double, minCL As Double, maxCR As Double, minCR As Double
Dim rngL As Range, rngR As Range
Set rngL = ws.Range(startColumns(0) & startRow & ":" & startColumns(0) & endRow) ' 左列数值目标Cell范围
Set rngR = ws.Range(startColumns(1) & startRow & ":" & startColumns(1) & endRow) ' 右列数值目标Cell范围

maxCL = Application.WorksheetFunction.Max(rngL)
minCL = Application.WorksheetFunction.Min(rngL)
maxCR = Application.WorksheetFunction.Max(rngR)
minCR = Application.WorksheetFunction.Min(rngR)


'设置单元格背景色
Dim I As Integer
Dim J As Integer
Dim K As Integer

Dim jsonText As String
Dim jsonObj As Object

jsonText = "{""0"":""76,201,240"",""1"":""109,207,234"",""2"":""143,214,228"",""3"":""176,220,221"",""4"":""210,227,215"",""5"":""243,233,209"",""6"":""240,229,200"",""7"":""238,224,191"",""8"":""235,220,181"",""9"":""233,215,172"",""10"":""230,211,163"",""11"":""227,211,154"",""12"":""224,210,144"",""13"":""222,210,135"",""14"":""219,209,125"",""15"":""216,209,116"",""16"":""209,206,110"",""17"":""202,204,103"",""18"":""196,201,97"",""19"":""189,199,90"",""20"":""182,196,84"",""21"":""174,190,68"",""22"":""166,184,52"",""23"":""158,178,36"",""24"":""150,172,20"",""25"":""142,166,4"",""26"":""163,170,3""" & _
",""27"":""183,174,2"",""28"":""204,179,2"",""29"":""224,183,1"",""30"":""245,187,0"",""31"":""239,171,1"",""32"":""233,155,1"",""33"":""227,138,2"",""34"":""221,122,2"",""35"":""215,106,3"",""36"":""210,95,2"",""37"":""205,83,2"",""38"":""201,72,1"",""39"":""196,60,1"",""40"":""191,49,0"",""41"":""174,43,3"",""42"":""157,37,6"",""43"":""139,32,8"",""44"":""122,26,11"",""45"":""105,20,14"",""46"":""96,20,16"",""47"":""87,20,18"",""48"":""78,21,20"",""49"":""69,21,22"",""50"":""60,21,24"",""51"":""48,17,19"",""52"":""36,13,14"",""53"":""24,8,10"",""54"":""12,4,5"",""55"":""0,0,0"",""-75"":""255" & _
",255,255"",""-74"":""255,244,249"",""-73"":""254,233,243"",""-72"":""254,223,237"",""-71"":""253,212,231"",""-70"":""253,201,225"",""-69"":""253,190,219"",""-68"":""252,179,213"",""-67"":""252,168,206"",""-66"":""251,157,200"",""-65"":""251,146,194"",""-64"":""251,135,188"",""-63"":""250,124,182"",""-62"":""250,114,176"",""-61"":""249,103,170"",""-60"":""249,92,164"",""-59"":""249,81,158"",""-58"":""248,70,152"",""-57"":""248,59,145"",""-56"":""247,48,139"",""-55"":""247,37,133"",""-54"":""240,36,136"",""-53"":""234,34,138"",""-52"":""227,33,141"",""-51"":""221,31,143"",""-50"":""214,30,146""" & _
",""-49"":""207,29,148"",""-48"":""201,27,151"",""-47"":""194,26,153"",""-46"":""188,24,156"",""-45"":""181,23,158"",""-44"":""174,22,161"",""-43"":""168,20,163"",""-42"":""161,19,166"",""-41"":""155,17,168"",""-40"":""148,16,171"",""-39"":""141,15,173"",""-38"":""134,13,176"",""-37"":""128,12,178"",""-36"":""121,10,181"",""-35"":""114,9,183"",""-34"":""108,9,181"",""-33"":""103,10,179"",""-32"":""97,10,177"",""-31"":""92,11,175"",""-30"":""86,11,173"",""-29"":""83,11,172"",""-28"":""80,11,171"",""-27"":""78,12,170"",""-26"":""75,12,169"",""-25"":""72,12,168"",""-24"":""69,12,167"",""-23"":""" & _
"66,12,166"",""-22"":""64,12,165"",""-21"":""61,12,164"",""-20"":""58,12,163"",""-19"":""59,21,171"",""-18"":""60,29,178"",""-17"":""61,38,186"",""-16"":""62,46,193"",""-15"":""63,55,201"",""-14"":""64,63,208"",""-13"":""65,72,216"",""-12"":""65,80,223"",""-11"":""66,89,231"",""-10"":""67,97,238"",""-9"":""68,107,238"",""-8"":""69,118,238"",""-7"":""70,128,239"",""-6"":""71,139,239"",""-5"":""72,149,239"",""-4"":""73,159,239"",""-3"":""74,170,239"",""-2"":""74,180,240"",""-1"":""75,191,240""}"
Set jsonObj = JsonConverter.ParseJson(jsonText)

For I = 0 To columnLength - 1
    For J = startRow To endRow
        If Cells(J, startColumns(I)).Value = "" Then
            Exit For
        End If
        For K = -75 To 55 Step 1
            Dim MyArray() As String, MyString As String
            MyString = jsonObj(Trim(str(K))) '这个str函数非负数前面有一个空格，必须用Trim去掉
            MyArray = Split(MyString, ",")
            
            If Cells(J, startColumns(I)).Value < K And Cells(J, startColumns(I)).Value >= K - 1 Then
                Cells(J, startColumns(I)).Interior.Color = rgb(MyArray(0), MyArray(1), MyArray(2))
            End If
        Next K
        
        '极端值
        If Cells(J, startColumns(I)).Value < -76 Then
            Cells(J, startColumns(I)).Interior.Color = rgb(255, 255, 255)
        End If
        
        If Cells(J, startColumns(I)).Value >= 55 Then
            Cells(J, startColumns(I)).Interior.Color = rgb(0, 0, 0)
        End If
        
        
        '设置字体颜色
        If Cells(J, startColumns(I)).Value <= -50 Or (Cells(J, startColumns(I)).Value > 0 And Cells(J, startColumns(I)).Value < 35) Then
            Cells(J, startColumns(I)).Font.Color = rgb(0, 0, 0)
        Else
            Cells(J, startColumns(I)).Font.Color = rgb(255, 255, 255)
        End If

        '高亮列内最大最小值
        '左列
        If I = 0 Then
            If Cells(J, startColumns(I)).Value = maxCL Or Cells(J, startColumns(I)).Value = minCL Then
                If (Cells(J, startColumns(I)).Value <= 0 And Cells(J, startColumns(I)).Value >= -55) Or Cells(J, startColumns(I)).Value >= 35 Then
                    Cells(J, startColumns(I)).Font.Color = rgb(255,255,63)
                Else
                    Cells(J, startColumns(I)).Font.Color = rgb(0,0,255)
                End If
            End If
        End If
        '右列
        If I = 1 Then
            If Cells(J, startColumns(I)).Value = maxCR Or Cells(J, startColumns(I)).Value = minCR Then
                If (Cells(J, startColumns(I)).Value <= 0 And Cells(J, startColumns(I)).Value >= -55) Or Cells(J, startColumns(I)).Value >= 35 Then
                    Cells(J, startColumns(I)).Font.Color = rgb(255,255,63)
                Else
                    Cells(J, startColumns(I)).Font.Color = rgb(0,0,255)
                End If
            End If
        End If
    Next J
Next I

End Sub



Sub 分区展示表配色()

Dim startRow As Integer
Dim endRow As Integer
Dim startColumns As Variant
Dim ws As Worksheet

'自定义部分！！！可能需要随时修改
Set ws = ThisWorkbook.Sheets("分区展示表") ' 自定义部分，工作表名称
startColumns = Array("G", "H") '自定义部分，确定哪两列是数值
startRow = 4 '自定义部分，数值起始行号
endRow = 200 '自定义部分，数值始终不会超过的行号

Dim columnLength As Integer
columnLength = UBound(startColumns) - LBound(startColumns) + 1

Dim maxCL As Double, minCL As Double, maxCR As Double, minCR As Double
Dim rngL As Range, rngR As Range
Set rngL = ws.Range(startColumns(0) & startRow & ":" & startColumns(0) & endRow) ' 左列数值目标Cell范围
Set rngR = ws.Range(startColumns(1) & startRow & ":" & startColumns(1) & endRow) ' 右列数值目标Cell范围

maxCL = Application.WorksheetFunction.Max(rngL)
minCL = Application.WorksheetFunction.Min(rngL)
maxCR = Application.WorksheetFunction.Max(rngR)
minCR = Application.WorksheetFunction.Min(rngR)


'设置单元格背景色
Dim I As Integer
Dim J As Integer
Dim K As Integer

Dim jsonText As String
Dim jsonObj As Object

jsonText = "{""0"":""76,201,240"",""1"":""109,207,234"",""2"":""143,214,228"",""3"":""176,220,221"",""4"":""210,227,215"",""5"":""243,233,209"",""6"":""240,229,200"",""7"":""238,224,191"",""8"":""235,220,181"",""9"":""233,215,172"",""10"":""230,211,163"",""11"":""227,211,154"",""12"":""224,210,144"",""13"":""222,210,135"",""14"":""219,209,125"",""15"":""216,209,116"",""16"":""209,206,110"",""17"":""202,204,103"",""18"":""196,201,97"",""19"":""189,199,90"",""20"":""182,196,84"",""21"":""174,190,68"",""22"":""166,184,52"",""23"":""158,178,36"",""24"":""150,172,20"",""25"":""142,166,4"",""26"":""163,170,3""" & _
",""27"":""183,174,2"",""28"":""204,179,2"",""29"":""224,183,1"",""30"":""245,187,0"",""31"":""239,171,1"",""32"":""233,155,1"",""33"":""227,138,2"",""34"":""221,122,2"",""35"":""215,106,3"",""36"":""210,95,2"",""37"":""205,83,2"",""38"":""201,72,1"",""39"":""196,60,1"",""40"":""191,49,0"",""41"":""174,43,3"",""42"":""157,37,6"",""43"":""139,32,8"",""44"":""122,26,11"",""45"":""105,20,14"",""46"":""96,20,16"",""47"":""87,20,18"",""48"":""78,21,20"",""49"":""69,21,22"",""50"":""60,21,24"",""51"":""48,17,19"",""52"":""36,13,14"",""53"":""24,8,10"",""54"":""12,4,5"",""55"":""0,0,0"",""-75"":""255" & _
",255,255"",""-74"":""255,244,249"",""-73"":""254,233,243"",""-72"":""254,223,237"",""-71"":""253,212,231"",""-70"":""253,201,225"",""-69"":""253,190,219"",""-68"":""252,179,213"",""-67"":""252,168,206"",""-66"":""251,157,200"",""-65"":""251,146,194"",""-64"":""251,135,188"",""-63"":""250,124,182"",""-62"":""250,114,176"",""-61"":""249,103,170"",""-60"":""249,92,164"",""-59"":""249,81,158"",""-58"":""248,70,152"",""-57"":""248,59,145"",""-56"":""247,48,139"",""-55"":""247,37,133"",""-54"":""240,36,136"",""-53"":""234,34,138"",""-52"":""227,33,141"",""-51"":""221,31,143"",""-50"":""214,30,146""" & _
",""-49"":""207,29,148"",""-48"":""201,27,151"",""-47"":""194,26,153"",""-46"":""188,24,156"",""-45"":""181,23,158"",""-44"":""174,22,161"",""-43"":""168,20,163"",""-42"":""161,19,166"",""-41"":""155,17,168"",""-40"":""148,16,171"",""-39"":""141,15,173"",""-38"":""134,13,176"",""-37"":""128,12,178"",""-36"":""121,10,181"",""-35"":""114,9,183"",""-34"":""108,9,181"",""-33"":""103,10,179"",""-32"":""97,10,177"",""-31"":""92,11,175"",""-30"":""86,11,173"",""-29"":""83,11,172"",""-28"":""80,11,171"",""-27"":""78,12,170"",""-26"":""75,12,169"",""-25"":""72,12,168"",""-24"":""69,12,167"",""-23"":""" & _
"66,12,166"",""-22"":""64,12,165"",""-21"":""61,12,164"",""-20"":""58,12,163"",""-19"":""59,21,171"",""-18"":""60,29,178"",""-17"":""61,38,186"",""-16"":""62,46,193"",""-15"":""63,55,201"",""-14"":""64,63,208"",""-13"":""65,72,216"",""-12"":""65,80,223"",""-11"":""66,89,231"",""-10"":""67,97,238"",""-9"":""68,107,238"",""-8"":""69,118,238"",""-7"":""70,128,239"",""-6"":""71,139,239"",""-5"":""72,149,239"",""-4"":""73,159,239"",""-3"":""74,170,239"",""-2"":""74,180,240"",""-1"":""75,191,240""}"
Set jsonObj = JsonConverter.ParseJson(jsonText)

For I = 0 To columnLength - 1
    For J = startRow To endRow
        If Cells(J, startColumns(I)).Value = "" Then
            Exit For
        End If
        For K = -75 To 55 Step 1
            Dim MyArray() As String, MyString As String
            MyString = jsonObj(Trim(str(K))) '这个str函数非负数前面有一个空格，必须用Trim去掉
            MyArray = Split(MyString, ",")
            
            If Cells(J, startColumns(I)).Value < K And Cells(J, startColumns(I)).Value >= K - 1 Then
                Cells(J, startColumns(I)).Interior.Color = rgb(MyArray(0), MyArray(1), MyArray(2))
            End If
        Next K
        
        '极端值
        If Cells(J, startColumns(I)).Value < -76 Then
            Cells(J, startColumns(I)).Interior.Color = rgb(255, 255, 255)
        End If
        
        If Cells(J, startColumns(I)).Value >= 55 Then
            Cells(J, startColumns(I)).Interior.Color = rgb(0, 0, 0)
        End If
        
        
        '设置字体颜色
        If Cells(J, startColumns(I)).Value <= -50 Or (Cells(J, startColumns(I)).Value > 0 And Cells(J, startColumns(I)).Value < 35) Then
            Cells(J, startColumns(I)).Font.Color = rgb(0, 0, 0)
        Else
            Cells(J, startColumns(I)).Font.Color = rgb(255, 255, 255)
        End If

        '高亮列内最大最小值
        '左列
        If I = 0 Then
            If Cells(J, startColumns(I)).Value = maxCL Or Cells(J, startColumns(I)).Value = minCL Then
                If (Cells(J, startColumns(I)).Value <= 0 And Cells(J, startColumns(I)).Value >= -55) Or Cells(J, startColumns(I)).Value >= 35 Then
                    Cells(J, startColumns(I)).Font.Color = rgb(255,255,63)
                Else
                    Cells(J, startColumns(I)).Font.Color = rgb(0,0,255)
                End If
            End If
        End If
        '右列
        If I = 1 Then
            If Cells(J, startColumns(I)).Value = maxCR Or Cells(J, startColumns(I)).Value = minCR Then
                If (Cells(J, startColumns(I)).Value <= 0 And Cells(J, startColumns(I)).Value >= -55) Or Cells(J, startColumns(I)).Value >= 35 Then
                    Cells(J, startColumns(I)).Font.Color = rgb(255,255,63)
                Else
                    Cells(J, startColumns(I)).Font.Color = rgb(0,0,255)
                End If
            End If
        End If
    Next J
Next I

End Sub



'检查ID列顺序
Sub 检查ID列顺序是否是默认顺序()

Dim I As Integer
Dim rightOrder As Boolean
rightOrder = True

For I = 4 To 200
    If Cells(I, 1).Value = "" Then
        Exit For
    End If
    If Cells(I, 1).Value <> I - 3 Then
        rightOrder = False
        Exit For
    End If
Next I

If rightOrder = False Then
    Range("A1").Interior.Color = rgb(255,0,0)
    Range("A1").Font.Color = rgb(255, 255, 255)
    Range("A1").Value = "不是初始顺序!"
Else
    Range("A1").Interior.Color = rgb(0, 114, 0)
    Range("A1").Font.Color = rgb(0, 0, 0)
    Range("A1").Value = "顺序已就绪"
End If

End Sub