using System;
using System.Collections.ObjectModel;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Media;

namespace PythonManager
{
    // ================= CONFIGURATION =================
    public class ProjectModel : System.ComponentModel.INotifyPropertyChanged
    {
        public string Name { get; set; }
        public string FolderPath { get; set; }
        public string Command { get; set; }
        public int Port { get; set; }

        // UI State
        private string _status = "Stopped";
        private Brush _statusColor = Brushes.Crimson;
        private bool _isRunning = false;

        public string Status 
        { 
            get => _status; 
            set { _status = value; OnPropertyChanged("Status"); } 
        }
        public Brush StatusColor 
        { 
            get => _statusColor; 
            set { _statusColor = value; OnPropertyChanged("StatusColor"); } 
        }
        public bool IsRunning 
        { 
            get => _isRunning; 
            set { _isRunning = value; OnPropertyChanged("IsRunning"); OnPropertyChanged("CanStart"); } 
        }
        public bool CanStart => !IsRunning;

        // Backend Handles
        public IntPtr JobHandle { get; set; } = IntPtr.Zero;
        public Process Process { get; set; }

        public event System.ComponentModel.PropertyChangedEventHandler PropertyChanged;
        protected void OnPropertyChanged(string name) => 
            PropertyChanged?.Invoke(this, new System.ComponentModel.PropertyChangedEventArgs(name));
    }

    public partial class MainWindow : Window
    {
        public ObservableCollection<ProjectModel> Projects { get; set; }

        public MainWindow()
        {
            InitializeComponent();
            Projects = new ObservableCollection<ProjectModel>();

            // === ADD YOUR PROJECTS HERE ===
            Projects.Add(new ProjectModel { 
                Name = "Scraping WMO & Show Table",
                FolderPath = @"D:\文档\Python\Weather Stations Scraper", 
                Command = "python app.py", 
                Port = 1000 
            });

            Projects.Add(new ProjectModel { 
                Name = "One Station Card", 
                FolderPath = @"D:\文档\Python\Weather Stations Scraper", 
                Command = "python -m http.server 1001", 
                Port = 1001 
            });

            Projects.Add(new ProjectModel { 
                Name = "GHCND Statistics", 
                FolderPath = @"D:\文档\Python\获取GHCND站点统计", 
                Command = "python app.py", 
                Port = 1002 
            });

            Projects.Add(new ProjectModel { 
                Name = "View Table in Browser", 
                FolderPath = @"D:\文档\Python\浏览器看表", 
                Command = "python app.py", 
                Port = 1003 
            });
            // ==============================

            ProjectList.ItemsSource = Projects;
        }

        private void BtnStart_Click(object sender, RoutedEventArgs e)
        {
            var btn = sender as System.Windows.Controls.Button;
            var project = btn.DataContext as ProjectModel;
            StartProject(project);
        }

        private void BtnStop_Click(object sender, RoutedEventArgs e)
        {
            var btn = sender as System.Windows.Controls.Button;
            var project = btn.DataContext as ProjectModel;
            StopProject(project);
        }

        // === LOGIC: Start with Job Object ===
        private void StartProject(ProjectModel p)
        {
            try
            {
                // 1. Create Job Object
                IntPtr hJob = CreateJobObject(IntPtr.Zero, null);
                var info = new JOBOBJECT_BASIC_LIMIT_INFORMATION { LimitFlags = 0x2000 }; // KILL_ON_JOB_CLOSE
                var extendedInfo = new JOBOBJECT_EXTENDED_LIMIT_INFORMATION { BasicLimitInformation = info };
                
                int length = Marshal.SizeOf(typeof(JOBOBJECT_EXTENDED_LIMIT_INFORMATION));
                IntPtr pInfo = Marshal.AllocHGlobal(length);
                Marshal.StructureToPtr(extendedInfo, pInfo, false);
                SetInformationJobObject(hJob, JobObjectInfoType.ExtendedLimitInformation, pInfo, (uint)length);
                Marshal.FreeHGlobal(pInfo);

                // 2. Prepare Process
                Process proc = new Process();
                proc.StartInfo.FileName = "cmd.exe";
                // We use cmd /c to handle environment variables and paths correctly
                proc.StartInfo.Arguments = $"/c {p.Command}"; 
                proc.StartInfo.WorkingDirectory = p.FolderPath;
                proc.StartInfo.UseShellExecute = false;
                proc.StartInfo.CreateNoWindow = true; // No Black Window
                
                // 3. Start Process (Suspended trick is hard in C#, so we allow start then assign)
                // Note: In C#, AssignProcessToJobObject works even if running, provided we do it fast.
                proc.Start();
                
                // 4. Assign to Job
                AssignProcessToJobObject(hJob, proc.Handle);

                p.JobHandle = hJob;
                p.Process = proc;
                p.Status = "Running";
                p.StatusColor = Brushes.LimeGreen;
                p.IsRunning = true;
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Failed to start: {ex.Message}");
            }
        }

        private void StopProject(ProjectModel p)
        {
            // The Nuclear Option: Kill the Job Object
            if (p.JobHandle != IntPtr.Zero)
            {
                TerminateJobObject(p.JobHandle, 0);
                CloseHandle(p.JobHandle);
                p.JobHandle = IntPtr.Zero;
            }

            p.Process = null;
            p.Status = "Stopped";
            p.StatusColor = Brushes.Crimson;
            p.IsRunning = false;
        }

        protected override void OnClosed(EventArgs e)
        {
            // Cleanup everything on close
            foreach(var p in Projects) StopProject(p);
            base.OnClosed(e);
        }

        // === NATIVE WINDOWS API IMPORTS ===
        [DllImport("kernel32.dll", CharSet = CharSet.Unicode)]
        static extern IntPtr CreateJobObject(IntPtr lpJobAttributes, string lpName);

        [DllImport("kernel32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        static extern bool SetInformationJobObject(IntPtr hJob, JobObjectInfoType JobObjectInfoClass, IntPtr lpJobObjectInfo, uint cbJobObjectInfoLength);

        [DllImport("kernel32.dll", SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        static extern bool AssignProcessToJobObject(IntPtr hJob, IntPtr hProcess);

        [DllImport("kernel32.dll", SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        static extern bool TerminateJobObject(IntPtr hJob, uint uExitCode);

        [DllImport("kernel32.dll", SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        static extern bool CloseHandle(IntPtr hObject);

        public enum JobObjectInfoType { ExtendedLimitInformation = 9 }

        [StructLayout(LayoutKind.Sequential)]
        public struct JOBOBJECT_BASIC_LIMIT_INFORMATION
        {
            public long PerProcessUserTimeLimit;
            public long PerJobUserTimeLimit;
            public uint LimitFlags;
            public UIntPtr MinimumWorkingSetSize;
            public UIntPtr MaximumWorkingSetSize;
            public uint ActiveProcessLimit;
            public long Affinity;
            public uint PriorityClass;
            public uint SchedulingClass;
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct JOBOBJECT_EXTENDED_LIMIT_INFORMATION
        {
            public JOBOBJECT_BASIC_LIMIT_INFORMATION BasicLimitInformation;
            public IO_COUNTERS IoInfo;
            public UIntPtr ProcessMemoryLimit;
            public UIntPtr JobMemoryLimit;
            public UIntPtr PeakProcessMemoryUsed;
            public UIntPtr PeakJobMemoryUsed;
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct IO_COUNTERS
        {
            public ulong ReadOperationCount;
            public ulong WriteOperationCount;
            public ulong OtherOperationCount;
            public ulong ReadTransferCount;
            public ulong WriteTransferCount;
            public ulong OtherTransferCount;
        }
    }
}

// In order to make .exe file, run this command in command prompt(Powershell):
// dotnet publish -c Release -r win-x64 --self-contained -p:PublishSingleFile=true

//Go to 项目path\bin\Release\netX.X\win-x64\publish\.
//You will find .exe. That is your final, beautiful, modern software.