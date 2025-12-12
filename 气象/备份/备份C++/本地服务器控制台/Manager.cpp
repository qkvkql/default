// 1. Force Unicode
#ifndef UNICODE
#define UNICODE
#endif
#ifndef _UNICODE
#define _UNICODE
#endif

#include <windows.h>
#include <vector>
#include <string>
#include <tchar.h>

// Enable Visual Styles
#pragma comment(linker,"\"/manifestdependency:type='win32' \
name='Microsoft.Windows.Common-Controls' version='6.0.0.0' \
processorArchitecture='*' publicKeyToken='6595b64144ccf1df' language='*'\"")

using namespace std;

// ================= COLORS & STYLING =================
// VS Code Style Dark Theme
#define COL_BG      RGB(30, 30, 30)      // Dark Grey Background
#define COL_TEXT    RGB(220, 220, 220)   // Off-White Text
#define COL_GREEN   RGB(50, 205, 50)     // Neon Green for "Running"
#define COL_RED     RGB(255, 80, 80)     // Soft Red for "Stopped"

HBRUSH hBrushBg; // Brush for background painting

// ================= CONFIGURATION =================
struct Project {
    wstring name;
    wstring path;
    wstring command;
    int port;
    HANDLE hJob;
    HANDLE hProcess;
    HWND hStatusLabel;
    HWND hBtnStart;
    HWND hBtnStop;
};

vector<Project> projects;

void LoadProjects() {
    // === YOUR PROJECTS ===
    projects.push_back({ 
        L"爬取交换站 & 展示冷站榜", 
        L"D:\\文档\\Python\\Weather Stations Scraper", 
        L"python app.py", 
        1000
    });

    projects.push_back({ 
        L"单站卡片 (HTTP Server)", 
        L"D:\\文档\\Python\\Weather Stations Scraper", 
        L"python -m http.server 1001", 
        1001
    });

    projects.push_back({ 
        L"站点GHCND统计", 
        L"D:\\文档\\Python\\获取GHCND站点统计", 
        L"python app.py", 
        1002
    });
}

// ================= LOGIC (Job Objects) =================
bool StartProject(int index) {
    HANDLE hJob = CreateJobObject(NULL, NULL);
    if (hJob == NULL) return false;

    JOBOBJECT_EXTENDED_LIMIT_INFORMATION jeli = { 0 };
    jeli.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;
    SetInformationJobObject(hJob, JobObjectExtendedLimitInformation, &jeli, sizeof(jeli));

    STARTUPINFO si; PROCESS_INFORMATION pi;
    ZeroMemory(&si, sizeof(si)); si.cb = sizeof(si);
    ZeroMemory(&pi, sizeof(pi));

    wstring cmdMutable = projects[index].command;
    
    if (CreateProcess(NULL, &cmdMutable[0], NULL, NULL, FALSE, 
        CREATE_NO_WINDOW | CREATE_SUSPENDED, NULL, 
        projects[index].path.c_str(), &si, &pi)) 
    {
        AssignProcessToJobObject(hJob, pi.hProcess);
        ResumeThread(pi.hThread);
        projects[index].hJob = hJob;
        projects[index].hProcess = pi.hProcess;
        CloseHandle(pi.hThread);
        return true;
    }
    CloseHandle(hJob);
    return false;
}

void StopProject(int index) {
    if (projects[index].hJob != NULL) {
        TerminateJobObject(projects[index].hJob, 0);
        CloseHandle(projects[index].hJob);
        projects[index].hJob = NULL;
    }
    if (projects[index].hProcess != NULL) {
        CloseHandle(projects[index].hProcess);
        projects[index].hProcess = NULL;
    }
}

// ================= UI DRAWING =================
HFONT hFontTitle, hFontStatus, hFontButton;

LRESULT CALLBACK WindowProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam) {
    switch (uMsg) {
    case WM_CREATE:
    {
        // Dark Background Brush
        hBrushBg = CreateSolidBrush(COL_BG);

        // Fonts
        hFontTitle = CreateFont(24, 0, 0, 0, FW_SEMIBOLD, FALSE, FALSE, FALSE, DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, CLEARTYPE_QUALITY, DEFAULT_PITCH, L"Segoe UI");
        hFontStatus = CreateFont(20, 0, 0, 0, FW_BOLD, FALSE, FALSE, FALSE, DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, CLEARTYPE_QUALITY, DEFAULT_PITCH, L"Segoe UI");
        hFontButton = CreateFont(18, 0, 0, 0, FW_NORMAL, FALSE, FALSE, FALSE, DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, CLEARTYPE_QUALITY, DEFAULT_PITCH, L"Segoe UI");

        int y = 25;
        for (size_t i = 0; i < projects.size(); i++) {
            // Project Name
            HWND hName = CreateWindow(L"STATIC", projects[i].name.c_str(), WS_VISIBLE | WS_CHILD, 30, y, 280, 30, hwnd, NULL, NULL, NULL);
            SendMessage(hName, WM_SETFONT, (WPARAM)hFontTitle, TRUE);

            // Status Label
            projects[i].hStatusLabel = CreateWindow(L"STATIC", L"Stopped", WS_VISIBLE | WS_CHILD, 330, y+2, 100, 30, hwnd, NULL, NULL, NULL);
            SendMessage(projects[i].hStatusLabel, WM_SETFONT, (WPARAM)hFontStatus, TRUE);

            // Start Button
            projects[i].hBtnStart = CreateWindow(L"BUTTON", L"Start", WS_VISIBLE | WS_CHILD | BS_PUSHBUTTON | BS_FLAT, 450, y, 80, 30, hwnd, (HMENU)(1000 + i), NULL, NULL);
            SendMessage(projects[i].hBtnStart, WM_SETFONT, (WPARAM)hFontButton, TRUE);

            // Stop Button
            projects[i].hBtnStop = CreateWindow(L"BUTTON", L"Stop", WS_VISIBLE | WS_CHILD | BS_PUSHBUTTON | BS_FLAT, 540, y, 80, 30, hwnd, (HMENU)(2000 + i), NULL, NULL);
            SendMessage(projects[i].hBtnStop, WM_SETFONT, (WPARAM)hFontButton, TRUE);
            EnableWindow(projects[i].hBtnStop, FALSE);

            // Separator Line (Simulated with a static control)
            HWND hLine = CreateWindow(L"STATIC", L"", WS_VISIBLE | WS_CHILD | SS_ETCHEDHORZ, 20, y + 50, 620, 2, hwnd, NULL, NULL, NULL);
            
            y += 70; // Spacing
        }
    }
    break;

    case WM_COMMAND:
    {
        int id = LOWORD(wParam);
        if (id >= 1000 && id < 1000 + projects.size()) {
            int idx = id - 1000;
            if (StartProject(idx)) {
                SetWindowText(projects[idx].hStatusLabel, L"Running");
                EnableWindow(projects[idx].hBtnStart, FALSE);
                EnableWindow(projects[idx].hBtnStop, TRUE);
                InvalidateRect(projects[idx].hStatusLabel, NULL, TRUE);
            }
        }
        if (id >= 2000 && id < 2000 + projects.size()) {
            int idx = id - 2000;
            StopProject(idx);
            SetWindowText(projects[idx].hStatusLabel, L"Stopped");
            EnableWindow(projects[idx].hBtnStart, TRUE);
            EnableWindow(projects[idx].hBtnStop, FALSE);
            InvalidateRect(projects[idx].hStatusLabel, NULL, TRUE);
        }
    }
    break;

    // === DARK THEME PAINTING ===
    case WM_CTLCOLORSTATIC: 
    {
        HDC hdcStatic = (HDC)wParam;
        HWND hwndStatic = (HWND)lParam;
        
        // Background color for text areas
        SetBkColor(hdcStatic, COL_BG); 
        SetBkMode(hdcStatic, OPAQUE); // Opaque to cover window background

        // Check if it is a Status Label
        for (const auto& p : projects) {
            if (p.hStatusLabel == hwndStatic) {
                wchar_t buf[20];
                GetWindowText(hwndStatic, buf, 20);
                if (wcscmp(buf, L"Running") == 0) SetTextColor(hdcStatic, COL_GREEN);
                else SetTextColor(hdcStatic, COL_RED);
                return (INT_PTR)hBrushBg;
            }
        }
        // Default text color
        SetTextColor(hdcStatic, COL_TEXT);
        return (INT_PTR)hBrushBg;
    }
    break;

    // Paint the window background Dark
    case WM_ERASEBKGND:
    {
        HDC hdc = (HDC)wParam;
        RECT rc;
        GetClientRect(hwnd, &rc);
        FillRect(hdc, &rc, hBrushBg);
        return 1;
    }

    case WM_DESTROY:
        for (size_t i = 0; i < projects.size(); i++) StopProject(i);
        DeleteObject(hBrushBg);
        DeleteObject(hFontTitle);
        DeleteObject(hFontStatus);
        DeleteObject(hFontButton);
        PostQuitMessage(0);
        return 0;
    }
    return DefWindowProc(hwnd, uMsg, wParam, lParam);
}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    LoadProjects();
    const wchar_t CLASS_NAME[] = L"DarkProjectManager";
    WNDCLASS wc = { };
    wc.lpfnWndProc = WindowProc;
    wc.hInstance = hInstance;
    wc.lpszClassName = CLASS_NAME;
    wc.hbrBackground = CreateSolidBrush(COL_BG); // Dark Background
    wc.hCursor = LoadCursor(NULL, IDC_ARROW);
    RegisterClass(&wc);

    int height = (projects.size() * 70) + 60;
    if (height > 800) height = 800;

    // Center on Screen Logic
    int screenW = GetSystemMetrics(SM_CXSCREEN);
    int screenH = GetSystemMetrics(SM_CYSCREEN);
    int winW = 680;
    int xPos = (screenW - winW) / 2;
    int yPos = (screenH - height) / 2;

    HWND hwnd = CreateWindowEx(0, CLASS_NAME, L"Command Center (Dark)", 
        WS_OVERLAPPEDWINDOW & ~WS_MAXIMIZEBOX & ~WS_THICKFRAME, 
        xPos, yPos, winW, height, 
        NULL, NULL, hInstance, NULL);

    if (hwnd == NULL) return 0;
    ShowWindow(hwnd, nCmdShow);
    MSG msg = { };
    while (GetMessage(&msg, NULL, 0, 0) > 0) { TranslateMessage(&msg); DispatchMessage(&msg); }
    return 0;
}


//command line to create .exe file:
//g++ Manager.cpp -o Manager.exe -mwindows -static -finput-charset=UTF-8 -fexec-charset=gbk -DUNICODE -D_UNICODE