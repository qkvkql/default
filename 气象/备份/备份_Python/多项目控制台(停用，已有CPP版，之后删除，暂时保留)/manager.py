import tkinter as tk
from tkinter import ttk
import subprocess
import os
import signal
import sys

# ================= CONFIGURATION =================
# Add your projects here. 
# Use r"" for paths to avoid issues with backslashes.
PROJECTS = [
    {
        "name": "爬取交换站日高低温 & 冷站榜",
        "path": r"D:\文档\Python\Weather Stations Scraper",
        "command": "python app.py" # 127.0.0.1:1000
    },
    {
        "name": "单站卡片",
        "path": r"D:\文档\Python\Weather Stations Scraper",
        "command": "python -m http.server 1001" # 127.0.0.1:1001 == localhost:1001
    },
    {
        "name": "站点GHCND统计",
        "path": r"D:\文档\Python\获取GHCND站点统计",
        "command": "python app.py" # 127.0.0.1:1002
    }
    # Copy and paste the block above to add more projects...
]
# =================================================

class ProcessManager(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Project Command Center")
        self.geometry("800x400")
        
        # Dictionary to keep track of running processes
        self.running_processes = {}

        # Create the UI
        self.create_widgets()

    def create_widgets(self):
        # Header
        header = tk.Label(self, text="Project Manager", font=("Arial", 16, "bold"))
        header.pack(pady=10)

        # Scrollable Frame Container
        container = ttk.Frame(self)
        canvas = tk.Canvas(container)
        scrollbar = ttk.Scrollbar(container, orient="vertical", command=canvas.yview)
        self.scrollable_frame = ttk.Frame(canvas)

        self.scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )

        canvas.create_window((0, 0), window=self.scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)

        container.pack(fill="both", expand=True, padx=10, pady=5)
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")

        # Create rows for each project
        for i, project in enumerate(PROJECTS):
            self.create_project_row(project, i)

    def create_project_row(self, project, index):
        frame = ttk.Frame(self.scrollable_frame, relief="groove", borderwidth=1)
        frame.pack(fill="x", pady=2, padx=5)

        # Project Name Label
        lbl = tk.Label(frame, text=project["name"], font=("Arial", 11), width=40, anchor="w")
        lbl.pack(side="left", padx=10, pady=10)

        # Status Label
        status_lbl = tk.Label(frame, text="Stopped", fg="red", width=10)
        status_lbl.pack(side="left", padx=10)

        # Action Button (Start/Stop)
        btn = tk.Button(frame, text="Start", width=10, bg="#dddddd")
        # We use a closure (lambda) to pass specific project details to the function
        btn.config(command=lambda: self.toggle_process(project, btn, status_lbl))
        btn.pack(side="right", padx=10)

    def toggle_process(self, project, btn, status_lbl):
        p_name = project["name"]

        # If running, stop it
        if p_name in self.running_processes:
            self.stop_process(p_name)
            btn.config(text="Start", bg="#dddddd")
            status_lbl.config(text="Stopped", fg="red")
        
        # If stopped, start it
        else:
            success = self.start_process(project)
            if success:
                btn.config(text="Stop", bg="#ffcccc")
                status_lbl.config(text="Running", fg="green")

    def start_process(self, project):
        try:
            # CREATE_NEW_CONSOLE ensures the process opens in a new window.
            # This is safer so you can see if the server crashes or prints errors.
            # If you want it completely hidden, remove the 'creationflags' argument.
            proc = subprocess.Popen(
                project["command"], 
                cwd=project["path"],
                shell=True,
                creationflags=subprocess.CREATE_NEW_CONSOLE
            )
            self.running_processes[project["name"]] = proc
            return True
        except Exception as e:
            tk.messagebox.showerror("Error", f"Failed to start {project['name']}\n{str(e)}")
            return False

    def stop_process(self, name):
        if name in self.running_processes:
            proc = self.running_processes[name]
            
            # Kill the process
            # On Windows, terminating a shell=True process is tricky, 
            # so we use taskkill to force kill the tree.
            subprocess.call(['taskkill', '/F', '/T', '/PID', str(proc.pid)])
            
            del self.running_processes[name]

    def on_closing(self):
        # Cleanup: Stop all processes when closing the window
        for name in list(self.running_processes.keys()):
            self.stop_process(name)
        self.destroy()

if __name__ == "__main__":
    app = ProcessManager()
    app.protocol("WM_DELETE_WINDOW", app.on_closing)
    app.mainloop()