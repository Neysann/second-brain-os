// ==============================================================================
// SYNTROPY OS — PONT NATIF WINDOWS POUR LA DYNAMIC ISLAND
// ==============================================================================
// Worker PowerShell persistant (compilation Add-Type unique) pour :
// - État média Windows SMTC (titre, artiste, pochette Base64, timeline, sessions)
// - Contrôles média (play, pause, toggle, next, previous, changement de session)
// - Détection d'application plein écran (Win32 GetForegroundWindow / GetWindowRect)

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const IDLE_KILL_MS = 45000;
const REQUEST_TIMEOUT_MS = 6000;
const BT = '`';

const WORKER_SCRIPT = [
  "$ErrorActionPreference = 'SilentlyContinue'",
  '[Console]::OutputEncoding = [System.Text.Encoding]::UTF8',
  '[Console]::InputEncoding = [System.Text.Encoding]::UTF8',
  'Add-Type -AssemblyName System.Runtime.WindowsRuntime',
  'Add-Type @"',
  'using System;',
  'using System.Text;',
  'using System.Runtime.InteropServices;',
  'public class SyntropyFS {',
  '  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }',
  '  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();',
  '  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);',
  '  [DllImport("user32.dll", CharSet = CharSet.Auto)] public static extern int GetClassName(IntPtr h, StringBuilder s, int n);',
  '  [DllImport("user32.dll")] public static extern int GetWindowThreadProcessId(IntPtr h, out int pid);',
  '}',
  '"@',
  "$asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation" + BT + "1' })[0]",
  'function Await($op, $type) { $t = $asTask.MakeGenericMethod($type).Invoke($null, @($op)); $t.Wait(4000) | Out-Null; return $t.Result }',
  '[Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media, ContentType = WindowsRuntime] | Out-Null',
  '[Windows.Storage.Streams.DataReader, Windows.Storage.Streams, ContentType = WindowsRuntime] | Out-Null',
  '$mgrType = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]',
  '$script:manager = $null',
  "$script:selApp = ''",
  "$script:lastKey = ''",
  "$script:lastThumb = ''",
  '',
  'function Get-Manager { if (-not $script:manager) { $script:manager = Await ($mgrType::RequestAsync()) $mgrType }; return $script:manager }',
  'function Get-Session {',
  '  $m = Get-Manager',
  '  if (-not $m) { return $null }',
  '  if ($script:selApp) { foreach ($s in $m.GetSessions()) { if ($s.SourceAppUserModelId -eq $script:selApp) { return $s } } }',
  '  return $m.GetCurrentSession()',
  '}',
  "function Out-Line($tag, $payload) { [Console]::Out.WriteLine($tag + ':' + $payload); [Console]::Out.Flush() }",
  '',
  'function Do-Media {',
  '  $s = Get-Session',
  "  if (-not $s) { Out-Line 'MEDIA' '{\"ok\":true,\"hasSession\":false}'; return }",
  '  $props = Await ($s.TryGetMediaPropertiesAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])',
  '  $info = $s.GetPlaybackInfo()',
  '  $tl = $s.GetTimelineProperties()',
  "  $key = '' + $props.Title + '|' + $props.Artist + '|' + $s.SourceAppUserModelId",
  '  if ($key -ne $script:lastKey) {',
  '    $script:lastKey = $key',
  "    $script:lastThumb = ''",
  '    try {',
  '      if ($props.Thumbnail) {',
  '        $stream = Await ($props.Thumbnail.OpenReadAsync()) ([Windows.Storage.Streams.IRandomAccessStreamWithContentType])',
  '        $size = [int]$stream.Size',
  '        if ($size -gt 0 -and $size -lt 3000000) {',
  '          $reader = New-Object Windows.Storage.Streams.DataReader($stream)',
  '          Await ($reader.LoadAsync([uint32]$size)) ([uint32]) | Out-Null',
  '          $bytes = New-Object byte[] $size',
  '          $reader.ReadBytes($bytes)',
  "          $ct = if ($stream.ContentType) { $stream.ContentType } else { 'image/jpeg' }",
  "          $script:lastThumb = 'data:' + $ct + ';base64,' + [Convert]::ToBase64String($bytes)",
  '        }',
  '      }',
  '    } catch {}',
  '  }',
  '  $sessList = @()',
  '  foreach ($x in (Get-Manager).GetSessions()) {',
  '    $xStat = try { $x.GetPlaybackInfo().PlaybackStatus.ToString() } catch { "Stopped" }',
  '    $sessList += [PSCustomObject]@{ id = $x.SourceAppUserModelId; status = $xStat }',
  '  }',
  '  $posMs = 0; $durMs = 0',
  '  try { $posMs = [int]$tl.Position.TotalMilliseconds; $durMs = [int]($tl.EndTime - $tl.StartTime).TotalMilliseconds } catch {}',
  '  $obj = [PSCustomObject]@{',
  '    ok = $true',
  '    hasSession = $true',
  '    title = $props.Title',
  '    artist = $props.Artist',
  '    albumTitle = $props.AlbumTitle',
  '    appId = $s.SourceAppUserModelId',
  '    rawSessions = $sessList',
  '    rawStatus = $info.PlaybackStatus.ToString()',
  '    canPlay = $info.Controls.IsPlayEnabled',
  '    canPause = $info.Controls.IsPauseEnabled',
  '    canNext = $info.Controls.IsNextEnabled',
  '    canPrevious = $info.Controls.IsPreviousEnabled',
  '    thumbnailBase64 = $script:lastThumb',
  '    positionMs = $posMs',
  '    durationMs = $durMs',
  '  }',
  "  Out-Line 'MEDIA' ($obj | ConvertTo-Json -Compress -Depth 4)",
  '}',
  '',
  'function Do-Control($action) {',
  '  $s = Get-Session',
  "  if (-not $s) { Out-Line 'CTL' 'false'; return }",
  "  $m = 'TryTogglePlayPauseAsync'",
  "  if ($action -eq 'play') { $m = 'TryPlayAsync' } elseif ($action -eq 'pause') { $m = 'TryPauseAsync' } elseif ($action -eq 'next') { $m = 'TrySkipNextAsync' } elseif ($action -eq 'previous') { $m = 'TrySkipPreviousAsync' }",
  '  $r = Await ($s.$m()) ([bool])',
  "  if ($r) { Out-Line 'CTL' 'true' } else { Out-Line 'CTL' 'false' }",
  '}',
  '',
  'function Do-FS {',
  '  $h = [SyntropyFS]::GetForegroundWindow()',
  "  if ($h -eq [IntPtr]::Zero) { Out-Line 'FS' '{\"full\":false}'; return }",
  '  $sb = New-Object System.Text.StringBuilder 256',
  '  [SyntropyFS]::GetClassName($h, $sb, 256) | Out-Null',
  '  $cls = $sb.ToString()',
  '  $r = New-Object SyntropyFS+RECT',
  '  [SyntropyFS]::GetWindowRect($h, [ref]$r) | Out-Null',
  '  $pid2 = 0; [SyntropyFS]::GetWindowThreadProcessId($h, [ref]$pid2) | Out-Null',
  "  Out-Line 'FS' ('{\"l\":' + $r.Left + ',\"t\":' + $r.Top + ',\"r\":' + $r.Right + ',\"b\":' + $r.Bottom + ',\"cls\":\"' + $cls + '\",\"pid\":' + $pid2 + '}')",
  '}',
  '',
  'while (($line = [Console]::In.ReadLine()) -ne $null) {',
  '  $line = $line.Trim()',
  "  if ($line -eq 'media') { Do-Media }",
  "  elseif ($line -eq 'fs') { Do-FS }",
  "  elseif ($line.StartsWith('ctl:')) { Do-Control $line.Substring(4) }",
  "  elseif ($line.StartsWith('sel:')) { $script:selApp = $line.Substring(4); $script:lastKey = ''; Out-Line 'SEL' 'ok' }",
  "  elseif ($line -eq 'quit') { break }",
  '}',
].join('\r\n');

function formatAppLabel(appId) {
  if (!appId) return 'Média';
  const lower = String(appId).toLowerCase();
  if (lower.includes('spotify')) return 'Spotify';
  if (lower.includes('applemusic') || lower.includes('itunes')) return 'Apple Music';
  if (lower.includes('deezer')) return 'Deezer';
  if (lower.includes('tidal')) return 'Tidal';
  if (lower.includes('vlc')) return 'VLC';
  if (lower.includes('chrome')) return 'Chrome';
  if (lower.includes('msedge') || lower.includes('edge')) return 'Edge';
  if (lower.includes('firefox') || lower.includes('mozilla')) return 'Firefox';
  if (lower.includes('brave')) return 'Brave';
  if (lower.includes('opera')) return 'Opera';
  if (lower.includes('zen')) return 'Zen';
  if (lower.includes('arc')) return 'Arc';
  return String(appId).replace(/\.exe$/i, '').split(/[.\\!]/).pop() || 'Média';
}

function normalizeStatus(raw) {
  const s = String(raw || '').toLowerCase();
  if (s === 'playing') return 'playing';
  if (s === 'paused') return 'paused';
  return 'stopped';
}

function normalizeMediaPayload(rawObj) {
  if (!rawObj || !rawObj.hasSession || !rawObj.title) {
    return { ok: true, hasSession: false };
  }
  const rawSessions = Array.isArray(rawObj.rawSessions)
    ? rawObj.rawSessions
    : rawObj.rawSessions
    ? [rawObj.rawSessions]
    : [];

  const sessions = rawSessions.map((s) => ({
    id: s.id,
    label: formatAppLabel(s.id),
    status: normalizeStatus(s.status),
    isCurrent: s.id === rawObj.appId,
  }));

  return {
    ok: true,
    hasSession: true,
    title: rawObj.title || '',
    artist: rawObj.artist || '',
    albumTitle: rawObj.albumTitle || '',
    appId: rawObj.appId || '',
    sessions,
    status: normalizeStatus(rawObj.rawStatus),
    canPlay: Boolean(rawObj.canPlay),
    canPause: Boolean(rawObj.canPause),
    canNext: Boolean(rawObj.canNext),
    canPrevious: Boolean(rawObj.canPrevious),
    positionMs: Number(rawObj.positionMs) || 0,
    durationMs: Number(rawObj.durationMs) || 0,
    thumbnailBase64: rawObj.thumbnailBase64 || undefined,
  };
}

let worker = null;
let buffer = '';
let queue = [];
let current = null;
let idleTimer = null;
let scriptPath = null;
let userDataDirRef = null;
let mediaCache = { at: 0, value: { ok: true, hasSession: false } };

function ensureScript() {
  if (!userDataDirRef) return false;
  scriptPath = path.join(userDataDirRef, 'syntropy-island-worker.ps1');
  try {
    fs.writeFileSync(scriptPath, '\uFEFF' + WORKER_SCRIPT, 'utf8');
    return true;
  } catch (e) {
    console.error("[Island] Impossible d'écrire le worker PowerShell:", e);
    scriptPath = null;
    return false;
  }
}

function resetIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(stopWorker, IDLE_KILL_MS);
}

function flushPending() {
  if (current) {
    clearTimeout(current.timer);
    current.resolve(null);
    current = null;
  }
  const pending = queue;
  queue = [];
  pending.forEach((p) => p.resolve(null));
}

function stopWorker() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = null;
  const w = worker;
  worker = null;
  buffer = '';
  if (w) {
    try { w.stdin.write('quit\n'); } catch (_) {}
    try { w.kill(); } catch (_) {}
  }
  flushPending();
}

function startWorker() {
  if (worker) return true;
  if (process.platform !== 'win32') return false;
  if (!ensureScript()) return false;
  try {
    worker = spawn(
      'powershell.exe',
      ['-NoProfile', '-NoLogo', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', scriptPath],
      { windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'] }
    );
  } catch (_) {
    worker = null;
    return false;
  }
  const mine = worker;
  mine.stdout.setEncoding('utf8');
  mine.stdout.on('data', (chunk) => {
    buffer += chunk;
    let idx;
    while ((idx = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, idx).replace(/\r$/, '');
      buffer = buffer.slice(idx + 1);
      handleLine(line);
    }
  });
  mine.on('exit', () => {
    if (worker === mine) {
      worker = null;
      flushPending();
    }
  });
  mine.on('error', () => {
    if (worker === mine) worker = null;
  });
  return true;
}

function handleLine(line) {
  const sep = line.indexOf(':');
  if (sep < 0 || !current) return;
  if (line.slice(0, sep) !== current.tag) return;
  clearTimeout(current.timer);
  const done = current;
  current = null;
  done.resolve(line.slice(sep + 1));
  pump();
}

function pump() {
  if (current || queue.length === 0) return;
  if (!startWorker()) {
    flushPending();
    return;
  }
  current = queue.shift();
  current.timer = setTimeout(() => {
    stopWorker();
  }, REQUEST_TIMEOUT_MS);
  try {
    worker.stdin.write(current.command + '\n');
  } catch (_) {
    stopWorker();
    return;
  }
  resetIdleTimer();
}

function request(command, tag) {
  if (process.platform !== 'win32') return Promise.resolve(null);
  return new Promise((resolve) => {
    queue.push({ command, tag, resolve });
    pump();
  });
}

module.exports = {
  init(userDataDir) {
    userDataDirRef = userDataDir;
  },
  stop: stopWorker,
  async getNowPlaying() {
    const now = Date.now();
    if (now - mediaCache.at < 600) return mediaCache.value;
    const raw = await request('media', 'MEDIA');
    let parsed = null;
    if (raw) {
      try { parsed = JSON.parse(raw); } catch (_) {}
    }
    const value = normalizeMediaPayload(parsed);
    mediaCache = { at: Date.now(), value };
    return value;
  },
  async controlMedia(action) {
    const safe = ['play', 'pause', 'toggle', 'next', 'previous'].includes(action) ? action : 'toggle';
    const raw = await request('ctl:' + safe, 'CTL');
    mediaCache.at = 0;
    return { success: raw === 'true' };
  },
  async selectMediaSession(appId) {
    const clean = String(appId || '').replace(/[\r\n]/g, '');
    await request('sel:' + clean, 'SEL');
    mediaCache.at = 0;
    return { success: true };
  },
  async getForegroundRect() {
    const raw = await request('fs', 'FS');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (_) { return null; }
  },
};
