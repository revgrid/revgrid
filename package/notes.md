## Get all tsconfig files under src folder using Powershell
`get-childitem -path src *.json -Recurse | where {!$_.PSIsContainer} | select-object FullName | export-csv -notypeinformation -path tsconfig-files.csv`
