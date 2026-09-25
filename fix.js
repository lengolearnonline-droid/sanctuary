const fs = require('fs');
let txt = fs.readFileSync('src/renderer/App.tsx', 'utf8');
const search = "  return (\r\n    <div className=\"app-layout\">\r\n      {licenseResult.plan === 'trial' && <TrialBanner daysLeft={licenseResult.daysLeft ?? 0} plan={licenseResult.plan ?? ''} />}";
const search2 = "  return (\n    <div className=\"app-layout\">\n      {licenseResult.plan === 'trial' && <TrialBanner daysLeft={licenseResult.daysLeft ?? 0} plan={licenseResult.plan ?? ''} />}";

const repl =   // Show license gate if not yet validated
  if (!licenseResult) {
    if (!licenseChecked) {
      return <div style={{ background: '#0A0E1A', height: '100vh' }} />;
    }
    return <LicenseGate onActivated={(r) => setLicenseResult(r)} />;
  }

  return (
    <div className="app-layout">
      {licenseResult?.plan === 'trial' && <TrialBanner daysLeft={licenseResult.daysLeft ?? 0} plan={licenseResult.plan ?? ''} />};

if (txt.includes(search)) {
    fs.writeFileSync('src/renderer/App.tsx', txt.replace(search, repl));
    console.log('Fixed with CRLF');
} else if (txt.includes(search2)) {
    fs.writeFileSync('src/renderer/App.tsx', txt.replace(search2, repl));
    console.log('Fixed with LF');
} else {
    console.log('Could not find text!');
}
