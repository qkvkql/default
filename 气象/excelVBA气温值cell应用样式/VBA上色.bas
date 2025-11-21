Option Explicit

' --- Custom Helper Function ---
' Converts a web-style Hex color code (#RRGGBB) to a VBA Long color value (&HBBGGRR).
' This is essential because VBA stores the color components in BGR order.
Private Function HexToVBALong(ByVal hexColor As String) As Long
    ' Remove the '#' prefix if present
    If Left(hexColor, 1) = "#" Then
        hexColor = Mid(hexColor, 2)
    End If

    If Len(hexColor) = 6 Then
        On Error Resume Next
        
        Dim R As String: R = Mid(hexColor, 1, 2) ' Red component
        Dim G As String: G = Mid(hexColor, 3, 2) ' Green component
        Dim B As String: B = Mid(hexColor, 5, 2) ' Blue component
        
        ' Combine them in BGR order (B * 256^2 + G * 256^1 + R * 256^0)
        ' The &H prefix forces interpretation as hexadecimal, but the final result is a Long decimal.
        HexToVBALong = CLng("&H" & B & G & R)
        
        If Err.Number <> 0 Then
            ' Handle conversion error (e.g., non-hex characters)
            Debug.Print "Error converting hex: " & hexColor & " - " & Err.Description
            ' Return a neutral color (White) on error
            HexToVBALong = &HFFFFFF 
            Err.Clear
        End If
        
        On Error GoTo 0
    Else
        ' Invalid length, return a neutral color (White)
        HexToVBALong = &HFFFFFF
    End If
End Function

' --- New Function to Centralize Color Logic ---
' Determines the correct VBA color code (Long) based on the temperature value.
Private Function GetColorCode(ByVal TempValue As Double) As Long
    
    Dim ColorCode As Long
    
    ' Select Case is the most efficient way to check continuous, numerical ranges in VBA.
    Select Case TempValue
        Case Is <= -75: ColorCode = HexToVBALong("#ffffff")
        ' --- Cold/Pink/Purple Range (from -74 to -55) ---
        Case Is <= -74: ColorCode = HexToVBALong("#fff4f9")
        Case Is <= -73: ColorCode = HexToVBALong("#fee9f3")
        Case Is <= -72: ColorCode = HexToVBALong("#fedfed")
        Case Is <= -71: ColorCode = HexToVBALong("#fdd4e7")
        Case Is <= -70: ColorCode = HexToVBALong("#fdc9e1")
        Case Is <= -69: ColorCode = HexToVBALong("#fdbedb")
        Case Is <= -68: ColorCode = HexToVBALong("#fcb3d5")
        Case Is <= -67: ColorCode = HexToVBALong("#fca8ce")
        Case Is <= -66: ColorCode = HexToVBALong("#fb9dc8")
        Case Is <= -65: ColorCode = HexToVBALong("#fb92c2")
        Case Is <= -64: ColorCode = HexToVBALong("#fb87bc")
        Case Is <= -63: ColorCode = HexToVBALong("#fa7cb6")
        Case Is <= -62: ColorCode = HexToVBALong("#fa72b0")
        Case Is <= -61: ColorCode = HexToVBALong("#f967aa")
        Case Is <= -60: ColorCode = HexToVBALong("#f95ca4")
        Case Is <= -59: ColorCode = HexToVBALong("#f9519e")
        Case Is <= -58: ColorCode = HexToVBALong("#f84698")
        Case Is <= -57: ColorCode = HexToVBALong("#f83b91")
        Case Is <= -56: ColorCode = HexToVBALong("#f7308b")
        Case Is <= -55: ColorCode = HexToVBALong("#f72585")
        ' --- Violet/Dark Blue Range (from -54 to -40) ---
        Case Is <= -54: ColorCode = HexToVBALong("#f02488")
        Case Is <= -53: ColorCode = HexToVBALong("#ea228a")
        Case Is <= -52: ColorCode = HexToVBALong("#e3218d")
        Case Is <= -51: ColorCode = HexToVBALong("#dd1f8f")
        Case Is <= -50: ColorCode = HexToVBALong("#d61e92")
        Case Is <= -49: ColorCode = HexToVBALong("#cf1d94")
        Case Is <= -48: ColorCode = HexToVBALong("#c91b97")
        Case Is <= -47: ColorCode = HexToVBALong("#c21a99")
        Case Is <= -46: ColorCode = HexToVBALong("#bc189c")
        Case Is <= -45: ColorCode = HexToVBALong("#b5179e")
        Case Is <= -44: ColorCode = HexToVBALong("#ae16a1")
        Case Is <= -43: ColorCode = HexToVBALong("#a814a3")
        Case Is <= -42: ColorCode = HexToVBALong("#a113a6")
        Case Is <= -41: ColorCode = HexToVBALong("#9b11a8")
        Case Is <= -40: ColorCode = HexToVBALong("#9410ab")
        ' --- Deep Blue Range (from -39 to -36) ---
        Case Is <= -39: ColorCode = HexToVBALong("#8d0fad")
        Case Is <= -38: ColorCode = HexToVBALong("#860db0")
        Case Is <= -37: ColorCode = HexToVBALong("#800cb2")
        Case Is <= -36: ColorCode = HexToVBALong("#790ab5")
        ' --- Mid Blue Range (from -35 to -20) ---
        Case Is <= -35: ColorCode = HexToVBALong("#7209b7")
        Case Is <= -34: ColorCode = HexToVBALong("#6c09b5")
        Case Is <= -33: ColorCode = HexToVBALong("#610ab1")
        Case Is <= -32: ColorCode = HexToVBALong("#5c0baf")
        Case Is <= -31: ColorCode = HexToVBALong("#560bad")
        Case Is <= -30: ColorCode = HexToVBALong("#530bac")
        Case Is <= -29: ColorCode = HexToVBALong("#500bab")
        Case Is <= -28: ColorCode = HexToVBALong("#4e0caa")
        Case Is <= -27: ColorCode = HexToVBALong("#4b0ca9")
        Case Is <= -26: ColorCode = HexToVBALong("#480ca8")
        Case Is <= -25: ColorCode = HexToVBALong("#450ca7")
        Case Is <= -24: ColorCode = HexToVBALong("#420ca6")
        Case Is <= -23: ColorCode = HexToVBALong("#400ca5")
        Case Is <= -22: ColorCode = HexToVBALong("#3d0ca4")
        Case Is <= -21: ColorCode = HexToVBALong("#3a0ca3")
        ' --- Cyan/Bright Blue Range (from -20 to 0) ---
        Case Is <= -20: ColorCode = HexToVBALong("#3b15ab")
        Case Is <= -19: ColorCode = HexToVBALong("#3c1db2")
        Case Is <= -18: ColorCode = HexToVBALong("#3d26ba")
        Case Is <= -17: ColorCode = HexToVBALong("#3e2ec1")
        Case Is <= -16: ColorCode = HexToVBALong("#3f37c9")
        Case Is <= -15: ColorCode = HexToVBALong("#403fd0")
        Case Is <= -14: ColorCode = HexToVBALong("#4148d8")
        Case Is <= -13: ColorCode = HexToVBALong("#4150df")
        Case Is <= -12: ColorCode = HexToVBALong("#4259e7")
        Case Is <= -11: ColorCode = HexToVBALong("#4361ee")
        Case Is <= -10: ColorCode = HexToVBALong("#446bee")
        Case Is <= -9: ColorCode = HexToVBALong("#4576ee")
        Case Is <= -8: ColorCode = HexToVBALong("#4680ef")
        Case Is <= -7: ColorCode = HexToVBALong("#478bef")
        Case Is <= -6: ColorCode = HexToVBALong("#4895ef")
        Case Is <= -5: ColorCode = HexToVBALong("#499fef")
        Case Is <= -4: ColorCode = HexToVBALong("#4aaaef")
        Case Is <= -3: ColorCode = HexToVBALong("#4ab4f0")
        Case Is <= -2: ColorCode = HexToVBALong("#4bbff0")
        Case Is <= -1: ColorCode = HexToVBALong("#4cc9f0")
        Case Is <= 0: ColorCode = HexToVBALong("#6dcfea") ' Handles 0 < Value < 1 as well
        ' --- Transition/Neutral Range (from 1 to 19) ---
        Case Is < 1: ColorCode = HexToVBALong("#6dcfea") ' If 0 < Value < 1
        Case Is < 2: ColorCode = HexToVBALong("#8fd6e4")
        Case Is < 3: ColorCode = HexToVBALong("#b0dcdd")
        Case Is < 4: ColorCode = HexToVBALong("#d2e3d7")
        Case Is < 5: ColorCode = HexToVBALong("#f3e9d1")
        Case Is < 6: ColorCode = HexToVBALong("#f0e5c8")
        Case Is < 7: ColorCode = HexToVBALong("#eee0bf")
        Case Is < 8: ColorCode = HexToVBALong("#ebdcb5")
        Case Is < 9: ColorCode = HexToVBALong("#e9d7ac")
        Case Is < 10: ColorCode = HexToVBALong("#e6d3a3")
        Case Is < 11: ColorCode = HexToVBALong("#e3d39a")
        Case Is < 12: ColorCode = HexToVBALong("#e0d290")
        Case Is < 13: ColorCode = HexToVBALong("#ded287")
        Case Is < 14: ColorCode = HexToVBALong("#dbd17d")
        Case Is < 15: ColorCode = HexToVBALong("#d8d174")
        Case Is < 16: ColorCode = HexToVBALong("#d1ce6e")
        Case Is < 17: ColorCode = HexToVBALong("#cacc67")
        Case Is < 18: ColorCode = HexToVBALong("#c4c961")
        Case Is < 19: ColorCode = HexToVBALong("#bdc75a")
        ' --- Green/Yellow Range (from 20 to 29) ---
        Case Is < 20: ColorCode = HexToVBALong("#b6c454")
        Case Is < 21: ColorCode = HexToVBALong("#aebe44")
        Case Is < 22: ColorCode = HexToVBALong("#a6b834")
        Case Is < 23: ColorCode = HexToVBALong("#9eb224")
        Case Is < 24: ColorCode = HexToVBALong("#96ac14")
        Case Is < 25: ColorCode = HexToVBALong("#8ea604")
        Case Is < 26: ColorCode = HexToVBALong("#a3aa03")
        Case Is < 27: ColorCode = HexToVBALong("#b7ae02")
        Case Is < 28: ColorCode = HexToVBALong("#ccb302")
        Case Is < 29: ColorCode = HexToVBALong("#e0b701")
        ' --- Orange/Yellow Range (from 30 to 40) ---
        Case Is < 30: ColorCode = HexToVBALong("#f5bb00")
        Case Is < 31: ColorCode = HexToVBALong("#efab01")
        Case Is < 32: ColorCode = HexToVBALong("#e99b01")
        Case Is < 33: ColorCode = HexToVBALong("#e38a02")
        Case Is < 34: ColorCode = HexToVBALong("#dd7a02")
        Case Is < 35: ColorCode = HexToVBALong("#d76a03")
        Case Is < 36: ColorCode = HexToVBALong("#d25f02")
        Case Is < 37: ColorCode = HexToVBALong("#cd5302")
        Case Is < 38: ColorCode = HexToVBALong("#c94801")
        Case Is < 39: ColorCode = HexToVBALong("#c43c01")
        Case Is < 40: ColorCode = HexToVBALong("#bf3100")
        ' --- Red/Dark Orange Range (from 41 to 53) ---
        Case Is < 41: ColorCode = HexToVBALong("#ae2b03")
        Case Is < 42: ColorCode = HexToVBALong("#9d2506")
        Case Is < 43: ColorCode = HexToVBALong("#8b2008")
        Case Is < 44: ColorCode = HexToVBALong("#7a1a0b")
        Case Is < 45: ColorCode = HexToVBALong("#69140e")
        Case Is < 46: ColorCode = HexToVBALong("#601410")
        Case Is < 47: ColorCode = HexToVBALong("#571412")
        Case Is < 48: ColorCode = HexToVBALong("#4e1514")
        Case Is < 49: ColorCode = HexToVBALong("#451516")
        Case Is < 50: ColorCode = HexToVBALong("#3c1518")
        Case Is < 51: ColorCode = HexToVBALong("#301113")
        Case Is < 52: ColorCode = HexToVBALong("#240d0e")
        Case Is < 53: ColorCode = HexToVBALong("#18080a")
        Case Is < 54: ColorCode = HexToVBALong("#0c0405")
        
        ' --- Extreme High Range ---
        Case Is >= 54: ColorCode = HexToVBALong("#000000") ' Black

        ' Default case (should not be hit if ranges are continuous)
        Case Else
            ColorCode = HexToVBALong("#ffffff") ' White
    End Select
    
    GetColorCode = ColorCode
End Function

' --- New Function to Determine Default Font Color (Step 1) ---
Private Function GetDefaultFontColor(ByVal TempValue As Double) As Long
    
    Dim FontColorCode As Long
    
    ' Rule 1: Use Black text (#000000) for light/mid backgrounds
    If TempValue <= -55 Or (TempValue > -5 And TempValue < 35) Then
        FontColorCode = HexToVBALong("#000000")
    
    ' Rule 2: Use White text (#ffffff) for dark backgrounds
    ElseIf (TempValue > -55 And TempValue <= -5) Or TempValue >= 35 Then
        FontColorCode = HexToVBALong("#ffffff")
        
    Else
        ' Fallback, use black
        FontColorCode = HexToVBALong("#000000")
    End If
    
    GetDefaultFontColor = FontColorCode
End Function


' --- Main Subroutine ---
' Applies background color and conditional font color to selected cells.
Public Sub ApplyTemperatureColoring()
    ' Check if a range is actually selected
    If Selection Is Nothing Then
        MsgBox "Please select the range of cells you wish to color first.", vbExclamation
        Exit Sub
    End If

    Dim Cell As Range
    Dim TempValue As Double ' Use Double for precise temperature values
    Dim MinVal As Double
    Dim MaxVal As Double
    Dim FirstNumeric As Boolean: FirstNumeric = False
    
    ' Disable screen updating and events for speed
    Application.ScreenUpdating = False
    Application.EnableEvents = False
    
    On Error GoTo ErrorHandler ' Set up error handling

    ' --- 1. PRE-SCAN: Find Min/Max of Numeric Values in Selection (Needed for Step 2) ---
    For Each Cell In Selection
        If IsNumeric(Cell.Value) And Not IsEmpty(Cell.Value) Then
            TempValue = CDbl(Cell.Value)
            If Not FirstNumeric Then
                MinVal = TempValue
                MaxVal = TempValue
                FirstNumeric = True
            Else
                If TempValue < MinVal Then MinVal = TempValue
                If TempValue > MaxVal Then MaxVal = TempValue
            End If
        End If
    Next Cell
    
    If Not FirstNumeric Then ' If no numeric data found
        MsgBox "No numeric temperature data found in the selected range.", vbInformation
        GoTo CleanExit
    End If
    
    ' --- 2. MAIN LOOP: Apply Background and Font Coloring ---
    For Each Cell In Selection
        
        ' --- Handle Non-Value Cells ---
        If Not IsNumeric(Cell.Value) Or IsEmpty(Cell.Value) Then
            GoTo NextCell ' Skip non-numeric/empty cells
        End If
        
        ' Read the temperature value
        TempValue = CDbl(Cell.Value)
        
        ' A. Apply Background Color
        Cell.Interior.Color = GetColorCode(TempValue)

        ' B. Apply Default Font Color (Step 1)
        Cell.Font.Color = GetDefaultFontColor(TempValue)
        
        ' C. Highlight Extreme Values (Step 2 Override)
        If TempValue = MinVal Or TempValue = MaxVal Then
            
            ' Check the highlight criteria for Extreme Values (CWEV)
            If TempValue <= -55 Or (TempValue > 0 And TempValue < 35) Then
                ' Set to Blue (#00b0f0)
                Cell.Font.Color = HexToVBALong("#00b0f0") 
            ElseIf (TempValue > -55 And TempValue <= 0) Or TempValue >= 35 Then
                ' Set to Yellow (#ffff00)
                Cell.Font.Color = HexToVBALong("#ffff00")
            End If
        End If

NextCell:
    Next Cell
    
CleanExit:
    ' Re-enable screen updating and events
    Application.ScreenUpdating = True
    Application.EnableEvents = True
    Exit Sub

ErrorHandler:
    MsgBox "An error occurred: " & Err.Description & " in cell " & Cell.Address, vbCritical
    Resume CleanExit
End Sub