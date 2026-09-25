import sys
content = open('src/renderer/App.tsx', 'r', encoding='utf8').read()
search = \"\"\"  return (
    <div className=\"app-layout\">
      {licenseResult.plan === 'trial' && <TrialBanner daysLeft={licenseResult.daysLeft ?? 0} plan={licenseResult.plan ?? ''} />}\"\"\"

replace = \"\"\"  // Show license gate if not yet validated
  if (!licenseResult) {
    if (!licenseChecked) {
      return <div style={{ background: '#0A0E1A', height: '100vh' }} />;
    }
    return <LicenseGate onActivated={(r) => setLicenseResult(r)} />;
  }

  return (
    <div className=\"app-layout\">
      {licenseResult?.plan === 'trial' && <TrialBanner daysLeft={licenseResult.daysLeft ?? 0} plan={licenseResult.plan ?? ''} />}\"\"\"

if search in content:
    open('src/renderer/App.tsx', 'w', encoding='utf8').write(content.replace(search, replace))
    print('Replaced LF match!')
elif search.replace('\n', '\r\n') in content:
    open('src/renderer/App.tsx', 'w', encoding='utf8').write(content.replace(search.replace('\n', '\r\n'), replace))
    print('Replaced CRLF match!')
else:
    print('Not found')
