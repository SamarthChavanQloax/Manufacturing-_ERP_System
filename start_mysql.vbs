Set objShell = CreateObject("Shell.Application")
objShell.ShellExecute "cmd.exe", "/c net start MySQL80", "", "runas", 1
