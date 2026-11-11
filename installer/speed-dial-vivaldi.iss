; Installeur Inno Setup de speed-dial-vivaldi. Compilation : iscc installer\speed-dial-vivaldi.iss
; Le setup est cree dans installer\Output\speed-dial-vivaldi-Setup-0.1.1.exe
#define MyAppName "speed-dial-vivaldi"
#define MyAppVersion "0.1.1"
#define MyAppURL "https://github.com/Les-Doubles-A/speed-dial-vivaldi"

[Setup]
AppId={{C3FABBA9-E076-57CC-BE63-3A3BD2EB4548}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher=Les-Doubles-A
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}/releases
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
OutputDir=Output
OutputBaseFilename={#MyAppName}-Setup-{#MyAppVersion}
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
CloseApplications=yes
SetupIconFile=speed-dial-vivaldi.ico
UninstallDisplayIcon={app}\speed-dial-vivaldi.ico
InfoAfterFile=INSTALLATION.txt
Uninstallable=yes

[Languages]
Name: "french"; MessagesFile: "compiler:Languages\French.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
Source: "INSTALLATION.txt"; DestDir: "{app}"; Flags: ignoreversion
Source: "speed-dial-vivaldi.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\icons\*"; DestDir: "{app}\extension\icons"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\manifest.json"; DestDir: "{app}\extension"; Flags: ignoreversion
Source: "..\newtab.html"; DestDir: "{app}\extension"; Flags: ignoreversion
Source: "..\src\*"; DestDir: "{app}\extension\src"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\styles\*"; DestDir: "{app}\extension\styles"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autoprograms}\{#MyAppName} - dossier de l'extension"; Filename: "{app}\extension"; IconFilename: "{app}\speed-dial-vivaldi.ico"
Name: "{autoprograms}\{#MyAppName} - instructions"; Filename: "{app}\INSTALLATION.txt"

[Run]
Filename: "{app}\extension"; Description: "Ouvrir le dossier de l'extension"; Flags: postinstall shellexec skipifsilent nowait
