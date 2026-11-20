$ab = 'C:\Users\Admin\.cursor\projects\d-Clodis-Kitchen\agent-transcripts\ab616ca3-6bca-4a01-9cce-aa34b0fafe71\ab616ca3-6bca-4a01-9cce-aa34b0fafe71.jsonl'
$patterns = @(
  'column1',
  'разъезжа',
  'просед',
  'антресол',
  'wallv',
  '1.74',
  'тест-прогон',
  'Плательщик колонки',
  'наследник',
  'не раздувает'
)
foreach ($p in $patterns) {
  $hits = @(Select-String -LiteralPath $ab -Pattern $p -SimpleMatch -ErrorAction SilentlyContinue)
  Write-Host ('[{0}] hits={1}' -f $p, $hits.Count)
}

Write-Host '--- lines with column1 ---'
$hits = Select-String -LiteralPath $ab -Pattern 'column1' -SimpleMatch
foreach ($h in $hits) {
  $line = $h.Line
  $ts = ''
  if ($line -match 'timestamp>([^<]+)<') { $ts = $Matches[1] }
  elseif ($line -match '(Monday|Sunday), Nov [^<]+UTC\+3') { $ts = $Matches[0] }
  $snip = ''
  if ($line -match 'user_query>\s*([^<]{0,180})') { $snip = $Matches[1] -replace '\s+',' ' }
  elseif ($line -match 'build 20261101-column1') { $snip = 'assistant mentions column1 build' }
  Write-Host ('L{0} {1} | {2}' -f $h.LineNumber, $ts, $snip)
}

Write-Host '--- user msgs with разъезж ---'
$hits2 = Select-String -LiteralPath $ab -Pattern 'разъезж' -SimpleMatch
foreach ($h in ($hits2 | Select-Object -First 25)) {
  $line = $h.Line
  $ts = if ($line -match '<timestamp>([^<]+)</timestamp>') { $Matches[1] } else { '' }
  $idx = $line.IndexOf('разъезж')
  $start = [Math]::Max(0, $idx - 60)
  $len = [Math]::Min(220, $line.Length - $start)
  Write-Host ('L{0} [{1}] {2}' -f $h.LineNumber, $ts, ($line.Substring($start, $len) -replace '\s+',' '))
}
