import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button, Badge, Panel, toast } from '../../components/ui';
import { Settings as SettingsIcon, Monitor, MonitorPlay, Save, Key, ShieldCheck } from 'lucide-react';

interface SystemDisplay {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isPrimary: boolean;
  scaleFactor: number;
}

export function SettingsPage() {
  const [displays, setDisplays] = useState<SystemDisplay[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [selectedStageId, setSelectedStageId] = useState<string>('');
  const [autoLaunch, setAutoLaunch] = useState<boolean>(false);
  const [autoLaunchStage, setAutoLaunchStage] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);

  // License State
  const [licenseInfo, setLicenseInfo] = useState<any>(null);
  const [newLicenseKey, setNewLicenseKey] = useState('');
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    // Load available displays
    window.sanctuary?.license.getCached().then((info: any) => {
      if (info) setLicenseInfo(info);
    });
    window.sanctuary?.display.getAll().then((loadedDisplays: any) => {
      setDisplays(loadedDisplays as SystemDisplay[]);
    });

    // Load saved preferences
    window.sanctuary?.settings.get('display.programId').then((savedId: string | null) => {
      if (savedId) setSelectedProgramId(savedId);
    });
    window.sanctuary?.settings.get('display.stageId').then((savedId: string | null) => {
      if (savedId) setSelectedStageId(savedId);
    });
    window.sanctuary?.settings.get('display.autoLaunch').then((val: string | null) => {
      setAutoLaunch(val === 'true');
    });
    window.sanctuary?.settings.get('display.autoLaunchStage').then((val: string | null) => {
      setAutoLaunchStage(val === 'true');
    });
  }, []);

  const handleActivateLicense = async () => {
    if (!newLicenseKey.trim()) return;
    setIsActivating(true);
    try {
      const result = await window.sanctuary?.license.validate(newLicenseKey.trim());
      if (result && result.valid) {
        toast.success('License Activated', 'Your subscription is now active.');
        setNewLicenseKey('');
        const info = await window.sanctuary?.license.getCached();
        setLicenseInfo(info);
      } else {
        toast.error('Invalid License', result?.error || 'Could not validate the license key.');
      }
    } catch (e: any) {
      toast.error('Activation Failed', e.message || 'An error occurred during activation.');
    } finally {
      setIsActivating(false);
    }
  };

  const handleSaveDisplay = async () => {
    setIsSaving(true);
    try {
      await window.sanctuary?.settings.set('display.programId', selectedProgramId);
      await window.sanctuary?.settings.set('display.stageId', selectedStageId);
      await window.sanctuary?.settings.set('display.autoLaunch', autoLaunch ? 'true' : 'false');
      await window.sanctuary?.settings.set('display.autoLaunchStage', autoLaunchStage ? 'true' : 'false');
      toast.success('Settings Saved', 'Display preferences have been updated.');
      
      // Optionally prompt user to restart program window
      toast.info('Restart Output', 'Restart the Program Window for changes to take effect.', 5000);
    } catch (e) {
      toast.error('Save Failed', 'Could not save display settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ padding: 'var(--space-6)', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        <SettingsIcon size={28} color="var(--color-text-secondary)" />
        <h1 style={{ margin: 0, fontSize: 'var(--font-size-2xl)' }}>Settings</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '800px' }}>
        
        <Panel 
          title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldCheck size={18} /> License & Subscription</span>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            
            {/* Current Status */}
            <div style={{ 
              background: 'var(--color-bg-secondary)', 
              padding: 'var(--space-4)', 
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-surface-border)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>Current Plan</h3>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    {licenseInfo ? (
                      licenseInfo.cachedResult?.plan === 'trial' 
                        ? '14-Day Free Trial' 
                        : 'Pro Subscription'
                    ) : 'Checking...'}
                  </div>
                </div>
                {licenseInfo && (
                  <Badge variant={licenseInfo.cachedResult?.valid ? 'live' : 'error'}>
                    {licenseInfo.cachedResult?.valid ? 'ACTIVE' : 'EXPIRED'}
                  </Badge>
                )}
              </div>
              
              {licenseInfo && (
                <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-surface-border)', fontSize: '13px' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Days Left:</span>
                    <span style={{ color: (licenseInfo.cachedResult?.daysLeft || 0) < 3 ? 'var(--color-error)' : 'var(--color-text-primary)', fontWeight: 600 }}>
                      {licenseInfo.cachedResult?.daysLeft ?? 'N/A'} days
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>License Key:</span>
                    <span style={{ fontFamily: 'monospace' }}>
                      {licenseInfo.licenseKey ? '����-����-����-' + licenseInfo.licenseKey.slice(-4) : 'N/A'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Activate New Key */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                Activate a License
              </label>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <input 
                  type="text" 
                  className="input"
                  value={newLicenseKey}
                  onChange={(e) => setNewLicenseKey(e.target.value)}
                  placeholder="Enter your license key..."
                  style={{ flex: 1 }}
                />
                <Button variant="primary" icon={Key} onClick={handleActivateLicense} isLoading={isActivating} disabled={!newLicenseKey.trim()}>
                  Activate
                </Button>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Don't have a license? <a href="#" onClick={(e) => { e.preventDefault(); window.sanctuary?.shell.openExternal('https://sanctuary.ecclesiasync.com'); }} style={{ color: 'var(--color-accent)', textDecoration: 'none' }}>Get one at sanctuary.ecclesiasync.com</a>
              </div>
            </div>

          </div>
        </Panel>
        
        <Panel 
          title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Monitor size={18} /> Displays</span>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
              Sanctuary automatically detects connected monitors. Select which monitor should be used for the fullscreen Program Output.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                Program Output Display
              </label>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 'var(--space-3)' }}>
                {displays.map((display) => (
                  <div 
                    key={display.id}
                    onClick={() => setSelectedProgramId(display.id)}
                    style={{
                      border: `2px solid ${selectedProgramId === display.id ? 'var(--color-accent)' : 'var(--color-surface-border)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-4)',
                      background: selectedProgramId === display.id ? 'var(--color-bg-active)' : 'var(--color-bg-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-2)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: 'var(--font-size-md)' }}>{display.label}</strong>
                      {display.isPrimary && <Badge variant="info">Primary</Badge>}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                      {display.width}x{display.height} @ {display.scaleFactor}x
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', fontFamily: 'monospace' }}>
                      ID: {display.id}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                Stage Display Output (Confidence Monitor)
              </label>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 'var(--space-3)' }}>
                {displays.map((display) => (
                  <div 
                    key={display.id}
                    onClick={() => setSelectedStageId(display.id)}
                    style={{
                      border: `2px solid ${selectedStageId === display.id ? 'var(--color-accent)' : 'var(--color-surface-border)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-4)',
                      background: selectedStageId === display.id ? 'var(--color-bg-active)' : 'var(--color-bg-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-2)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: 'var(--font-size-md)' }}>{display.label}</strong>
                      {display.isPrimary && <Badge variant="info">Primary</Badge>}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                      {display.width}x{display.height} @ {display.scaleFactor}x
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <input 
                  type="checkbox" 
                  id="autoLaunch"
                  checked={autoLaunch}
                  onChange={(e) => setAutoLaunch(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="autoLaunch" style={{ cursor: 'pointer' }}>
                  Automatically launch Program Output on startup
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <input 
                  type="checkbox" 
                  id="autoLaunchStage"
                  checked={autoLaunchStage}
                  onChange={(e) => setAutoLaunchStage(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="autoLaunchStage" style={{ cursor: 'pointer' }}>
                  Automatically launch Stage Display on startup
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
              <Button variant="primary" icon={Save} onClick={handleSaveDisplay} isLoading={isSaving}>
                Save Display Settings
              </Button>
            </div>
          </div>
        </Panel>

        <Panel 
          title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MonitorPlay size={18} /> Output Control</span>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <strong style={{ display: 'block', marginBottom: '4px' }}>Program Output</strong>
                <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: 'var(--font-size-sm)' }}>
                  Main presentation window for the congregation.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button variant="secondary" onClick={() => window.sanctuary?.display.closeOutput()}>
                  Close
                </Button>
                <Button variant="primary" icon={MonitorPlay} onClick={() => window.sanctuary?.display.openOutput(selectedProgramId)}>
                  Launch
                </Button>
              </div>
            </div>

            <div style={{ height: '1px', background: 'var(--color-surface-border)' }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <strong style={{ display: 'block', marginBottom: '4px' }}>Stage Display</strong>
                <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: 'var(--font-size-sm)' }}>
                  Confidence monitor for speakers and musicians.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button variant="secondary" onClick={() => window.sanctuary?.display.closeStage()}>
                  Close
                </Button>
                <Button variant="primary" icon={MonitorPlay} onClick={() => window.sanctuary?.display.openStage(selectedStageId)}>
                  Launch
                </Button>
              </div>
            </div>

          </div>
        </Panel>


        <NDISettingsPanel />
        <OBSSettingsPanel />
        <VMixSettingsPanel />
        <DataManagementPanel />

        <RemoteControlPanel />

        <AIMicSettingsPanel />

        {/* AI Voice Control Settings */}
        <Panel 
          title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><SettingsIcon size={18} /> AI Voice Control</span>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
              Sanctuary uses an offline, privacy-first AI engine to listen to the sermon and automatically present Scriptures when they are referenced.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <strong style={{ display: 'block', marginBottom: '4px' }}>Speech Recognition Engine</strong>
                <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: 'var(--font-size-sm)' }}>
                  Start the local audio capture and Voice Activity Detection (VAD) pipeline.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button 
                  variant="secondary" 
                  onClick={async () => {
                    const { audioCapture } = await import('../../core/ai/AudioCaptureService');
                    await audioCapture.stop();
                    toast.success('AI Engine Stopped');
                  }}
                >
                  Stop Engine
                </Button>
                <Button 
                  variant="primary" 
                  onClick={async () => {
                    try {
                      const { audioCapture } = await import('../../core/ai/AudioCaptureService');
                      
                      // Bind IPC bridge
                      audioCapture.onData((buffer) => {
                        window.sanctuary?.ai.sendAudio(buffer);
                      });

                      // Simple UI feedback for VAD
                      audioCapture.onVAD((isSpeaking) => {
                        const event = new CustomEvent('sanctuary:vad', { detail: { isSpeaking } });
                        window.dispatchEvent(event);
                      });

                      await audioCapture.start();
                      toast.success('AI Engine Started', 'Listening for speech...');
                    } catch (e) {
                      toast.error('AI Engine Error', 'Could not access microphone.');
                    }
                  }}
                >
                  Start Engine
                </Button>
              </div>
            </div>
            
            <div style={{ height: '1px', background: 'var(--color-surface-border)', margin: 'var(--space-2) 0' }} />

            {/* Diagnostics View */}
            <div>
              <strong style={{ display: 'block', marginBottom: '8px' }}>Voice Command Diagnostics</strong>
              <div style={{ 
                background: 'var(--color-bg-secondary)', 
                padding: 'var(--space-4)', 
                borderRadius: 'var(--radius-md)',
                fontFamily: 'monospace',
                fontSize: '13px',
                color: 'var(--color-text-secondary)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <DiagnosticView />
              </div>
            </div>
          </div>
        </Panel>

      </div>
    </div>
  );
}

function DiagnosticView() {
  const [lastCmd, setLastCmd] = useState<any>(null);

  useEffect(() => {
    const unsub = window.sanctuary?.ai.onCommandExecuted((info: any) => {
      setLastCmd(info);
    });
    return () => unsub?.();
  }, []);

  if (!lastCmd) {
    return <div>No commands executed yet. Start the engine and speak a command like "Next slide".</div>;
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Intent: <strong style={{ color: 'var(--color-accent)' }}>{lastCmd.intent}</strong></span>
        <span>Confidence: {(lastCmd.confidence * 100).toFixed(0)}%</span>
      </div>
      <div>
        <span>Normalized: </span> <span style={{ color: 'var(--color-text-primary)' }}>"{lastCmd.normalized}"</span>
      </div>
      <div>
        <span>Execution: </span> <strong style={{ color: 'var(--color-success)' }}>SUCCESS</strong>
      </div>
    </>
  );
}

function NDISettingsPanel() {
  const [enabled, setEnabled] = useState(false);
  const [sourceName, setSourceName] = useState('Sanctuary Program');
  const [alpha, setAlpha] = useState('transparent');
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    // Load config
    window.sanctuary?.settings.get('ndi.enabled').then((val: any) => setEnabled(val === 'true'));
    window.sanctuary?.settings.get('ndi.sourceName').then((val: any) => { if (val) setSourceName(val); });
    window.sanctuary?.settings.get('ndi.alpha').then((val: any) => { if (val) setAlpha(val); });

    // Poll health
    const interval = setInterval(async () => {
      if (window.sanctuary) {
        const h = await window.sanctuary.ndi.getHealth();
        setHealth(h);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSave = async () => {
    if (window.sanctuary) {
      await window.sanctuary.settings.set('ndi.enabled', enabled ? 'true' : 'false');
      await window.sanctuary.settings.set('ndi.sourceName', sourceName);
      await window.sanctuary.settings.set('ndi.alpha', alpha);
      await window.sanctuary.ndi.restart();
      toast.success('NDI Output Restarted', 'Settings applied successfully.');
    }
  };

  return (
    <Panel 
      title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MonitorPlay size={18} /> NDI Broadcast Output</span>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
          Transmit the canonical Program Output over the local network using NewTek NDI®.
          Supports alpha-channel transparency for downstream broadcast overlay (OBS/vMix).
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <input 
            type="checkbox" 
            id="ndiEnabled"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <label htmlFor="ndiEnabled" style={{ cursor: 'pointer', fontWeight: 600 }}>
            Enable NDI Output
          </label>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Source Name</label>
            <input 
              type="text" 
              className="input"
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              placeholder="e.g. Sanctuary Program"
            />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Alpha Mode</label>
            <select 
              className="input"
              value={alpha}
              onChange={(e) => setAlpha(e.target.value)}
            >
              <option value="transparent">Transparent (BGRA)</option>
              <option value="opaque">Opaque (UYVY)</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
          <Button variant="primary" icon={Save} onClick={handleSave}>
            Apply & Restart NDI
          </Button>
        </div>

        {health && enabled && (
          <div style={{ 
            marginTop: 'var(--space-4)',
            background: 'var(--color-bg-secondary)', 
            padding: 'var(--space-4)', 
            borderRadius: 'var(--radius-md)',
            fontFamily: 'monospace',
            fontSize: '13px',
            color: 'var(--color-text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <strong style={{ display: 'block', color: 'var(--color-text-primary)' }}>Diagnostics</strong>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Status: <strong style={{ color: health.status === 'RUNNING' ? 'var(--color-success)' : 'var(--color-warning)' }}>{health.status}</strong></span>
              <span>FPS: {health.actualFPS}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Frames Sent: {health.framesSent}</span>
              <span>Dropped: {health.framesDropped}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Latency: {health.latencyMs.toFixed(1)} ms</span>
              <span>Errors: {health.errorCount}</span>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}

function OBSSettingsPanel() {
  const [enabled, setEnabled] = useState(false);
  const [address, setAddress] = useState('127.0.0.1:4455');
  const [password, setPassword] = useState('');
  const [health, setHealth] = useState<any>(null);
  const [scenes, setScenes] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // License State
  const [licenseInfo, setLicenseInfo] = useState<any>(null);
  const [newLicenseKey, setNewLicenseKey] = useState('');
  const [isActivating, setIsActivating] = useState(false);

      useEffect(() => {
      // Load config ONCE
      window.sanctuary?.settings.get('obs.enabled').then((val: any) => setEnabled(val === 'true'));
      window.sanctuary?.settings.get('obs.address').then((val: any) => { if (val) setAddress(val); });
      window.sanctuary?.settings.get('obs.password').then((val: any) => { if (val) setPassword(val); });
    }, []);

    useEffect(() => {
      const fetchScenes = async () => {
        if (window.sanctuary && health?.status === 'CONNECTED') {
          const s = await window.sanctuary.obs.getScenes();
          setScenes(s);
        }
      };

      // Sub to health
      const unsub = window.sanctuary?.obs.onStateChange((state: any) => {
        setHealth(state);
        if (state.status === 'CONNECTED' && scenes.length === 0) {
          fetchScenes();
        }
      });
      
      // Initial fetch
      window.sanctuary?.obs.getHealth().then(setHealth);

      return () => unsub?.();
    }, [scenes.length, health?.status]);

  const handleSave = async () => {
    setIsSaving(true);
    if (window.sanctuary) {
      await window.sanctuary.settings.set('obs.enabled', enabled ? 'true' : 'false');
      await window.sanctuary.settings.set('obs.address', address);
      await window.sanctuary.settings.set('obs.password', password);
      await window.sanctuary.obs.reconnect();
      toast.success('OBS Configuration Saved', 'Reconnecting to OBS Studio...');
    }
    setIsSaving(false);
  };

  return (
    <Panel 
      title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MonitorPlay size={18} /> OBS Studio Integration</span>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
          Connect to OBS Studio (v28+) via WebSocket v5 to control scenes, lower-thirds, and view stream status directly within Sanctuary.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <input 
            type="checkbox" 
            id="obsEnabled"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <label htmlFor="obsEnabled" style={{ cursor: 'pointer', fontWeight: 600 }}>
            Enable OBS Integration
          </label>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>WebSocket Address</label>
            <input 
              type="text" 
              className="input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 127.0.0.1:4455"
            />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Server Password</label>
            <input 
              type="password" 
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank if none"
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
          <Button variant="primary" icon={Save} onClick={handleSave} isLoading={isSaving}>
            Connect to OBS
          </Button>
        </div>

        {health && enabled && (
          <div style={{ 
            marginTop: 'var(--space-4)',
            background: 'var(--color-bg-secondary)', 
            padding: 'var(--space-4)', 
            borderRadius: 'var(--radius-md)',
            fontFamily: 'monospace',
            fontSize: '13px',
            color: 'var(--color-text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <strong style={{ display: 'block', color: 'var(--color-text-primary)' }}>Connection Status</strong>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Status: <strong style={{ color: health.status === 'CONNECTED' ? 'var(--color-success)' : (health.status === 'ERROR' ? 'var(--color-error)' : 'var(--color-warning)') }}>{health.status}</strong></span>
              {health.version && <span>v{health.version}</span>}
            </div>
            
            {health.status === 'CONNECTED' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-2)' }}>
                  <span>Current Scene: <strong style={{ color: 'var(--color-text-primary)' }}>{health.currentScene || 'Unknown'}</strong></span>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
                  <Badge variant={health.streaming ? 'live' : 'default'}>
                    {health.streaming ? 'LIVE STREAMING' : 'OFFLINE'}
                  </Badge>
                  <Badge variant={health.recording ? 'error' : 'default'}>
                    {health.recording ? 'RECORDING' : 'NOT RECORDING'}
                  </Badge>
                </div>
                
                {scenes.length > 0 && (
                  <div style={{ marginTop: 'var(--space-4)' }}>
                    <strong style={{ display: 'block', color: 'var(--color-text-primary)', marginBottom: '8px' }}>Scene Test</strong>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                      {scenes.slice(0, 5).map(scene => (
                        <Button 
                          key={scene} 
                          variant={scene === health.currentScene ? 'primary' : 'secondary'}
                          onClick={() => window.sanctuary?.obs.setScene(scene)}
                        >
                          {scene}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}

function VMixSettingsPanel() {
  const [enabled, setEnabled] = useState(false);
  const [address, setAddress] = useState('127.0.0.1:8088');
  const [health, setHealth] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // License State
  const [licenseInfo, setLicenseInfo] = useState<any>(null);
  const [newLicenseKey, setNewLicenseKey] = useState('');
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    // Load config
    window.sanctuary?.settings.get('vmix.enabled').then((val: any) => setEnabled(val === 'true'));
    window.sanctuary?.settings.get('vmix.address').then((val: any) => { if (val) setAddress(val); });

    // Sub to health
    const unsub = window.sanctuary?.vmix.onStateChange((state: any) => {
      setHealth(state);
    });
    
    // Initial fetch
    window.sanctuary?.vmix.getHealth().then(setHealth);

    return () => unsub?.();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    if (window.sanctuary) {
      await window.sanctuary.settings.set('vmix.enabled', enabled ? 'true' : 'false');
      await window.sanctuary.settings.set('vmix.address', address);
      await window.sanctuary.vmix.reconnect();
      toast.success('vMix Configuration Saved', 'Reconnecting to vMix API...');
    }
    setIsSaving(false);
  };

  return (
    <Panel 
      title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MonitorPlay size={18} /> vMix Production Integration</span>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
          Connect to vMix via HTTP API to push dynamic GTZip/XAML title updates, trigger transitions, and monitor tally status.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <input 
            type="checkbox" 
            id="vmixEnabled"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <label htmlFor="vmixEnabled" style={{ cursor: 'pointer', fontWeight: 600 }}>
            Enable vMix API Integration
          </label>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>API Address</label>
            <input 
              type="text" 
              className="input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 127.0.0.1:8088"
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
          <Button variant="primary" icon={Save} onClick={handleSave} isLoading={isSaving}>
            Connect to vMix
          </Button>
        </div>

        {health && enabled && (
          <div style={{ 
            marginTop: 'var(--space-4)',
            background: 'var(--color-bg-secondary)', 
            padding: 'var(--space-4)', 
            borderRadius: 'var(--radius-md)',
            fontFamily: 'monospace',
            fontSize: '13px',
            color: 'var(--color-text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <strong style={{ display: 'block', color: 'var(--color-text-primary)' }}>Connection Status</strong>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Status: <strong style={{ color: health.status === 'CONNECTED' ? 'var(--color-success)' : (health.status === 'ERROR' ? 'var(--color-error)' : 'var(--color-warning)') }}>{health.status}</strong></span>
              {health.version && <span>v{health.version}</span>}
            </div>
            
            {health.status === 'CONNECTED' && (
              <>
                <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
                  <Badge variant={health.streaming ? 'live' : 'default'}>
                    {health.streaming ? 'LIVE STREAMING' : 'OFFLINE'}
                  </Badge>
                  <Badge variant={health.recording ? 'error' : 'default'}>
                    {health.recording ? 'RECORDING' : 'NOT RECORDING'}
                  </Badge>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}

function DataManagementPanel() {
  const [isImporting, setIsImporting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [filePath, setFilePath] = useState('');

  const handleImportOpenLP = async () => {
    if (!filePath.trim()) return toast.error('Error', 'Please enter a path to the OpenLP .sqlite file');
    setIsImporting(true);
    try {
      if (window.sanctuary) {
        const count = await window.sanctuary.data.importOpenLP(filePath);
        toast.success('Import Complete', `Successfully imported ${count} songs from OpenLP`);
      }
    } catch (e: any) {
      toast.error('Import Failed', e.message);
    }
    setIsImporting(false);
  };

  const handleImportCCLI = async () => {
    if (!filePath.trim()) return toast.error('Error', 'Please enter a path to the CCLI .txt file');
    setIsImporting(true);
    try {
      if (window.sanctuary) {
        await window.sanctuary.data.importCCLI(filePath);
        toast.success('Import Complete', 'Successfully imported CCLI song');
      }
    } catch (e: any) {
      toast.error('Import Failed', e.message);
    }
    setIsImporting(false);
  };

  const handleImportBible = async () => {
    setIsImporting(true);
    try {
      if (window.sanctuary) {
        const res = await window.sanctuary.bible.importXml();
        if (res.success) {
          toast.success('Bible Import Complete', res.message);
          // Notify the UI that translations might have updated!
          window.dispatchEvent(new Event('bible:updated'));
        } else {
          toast.error('Import Failed', res.error);
        }
      }
    } catch (e: any) {
      toast.error('Import Failed', e.message);
    }
    setIsImporting(false);
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      if (window.sanctuary) {
        const outDir = await window.sanctuary.app.getPath('downloads');
        const file = await window.sanctuary.data.createBackup(outDir);
        toast.success('Backup Complete', `Saved to ${file}`);
      }
    } catch (e: any) {
      toast.error('Backup Failed', e.message);
    }
    setIsBackingUp(false);
  };

  const handleRestore = async () => {
    if (!filePath.trim()) return toast.error('Error', 'Please enter a path to the backup .sqlite file');
    if (!window.confirm('WARNING: This will overwrite your current database. Are you sure?')) return;
    setIsBackingUp(true);
    try {
      if (window.sanctuary) {
        await window.sanctuary.data.restoreBackup(filePath);
        toast.success('Restore Complete', 'Database restored. Restarting app...');
        setTimeout(() => window.sanctuary?.app.quit(), 2000);
      }
    } catch (e: any) {
      toast.error('Restore Failed', e.message);
    }
    setIsBackingUp(false);
  };

  return (
    <Panel 
      title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>🗄️ Data Import & Export</span>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
          Import songs from OpenLP or CCLI, import USFM Bibles, and manage database backups.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>File Path</label>
          <input 
            type="text" 
            className="input"
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            placeholder="C:\Path\To\File.sqlite or .txt"
          />
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-2)' }}>
          <Button variant="secondary" onClick={handleImportOpenLP} isLoading={isImporting}>
            Import OpenLP DB
          </Button>
          <Button variant="secondary" onClick={handleImportCCLI} isLoading={isImporting}>
            Import CCLI Text
          </Button>
          <Button variant="secondary" onClick={handleImportBible} isLoading={isImporting}>
            Import Bible XML
          </Button>
        </div>
        
        <hr style={{ borderColor: 'var(--color-surface-border)', margin: 'var(--space-2) 0' }} />

        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <Button variant="secondary" onClick={handleBackup} isLoading={isBackingUp}>
            Create Backup (Downloads)
          </Button>
          <Button variant="secondary" onClick={handleRestore} isLoading={isBackingUp}>
            Restore from Path
          </Button>
        </div>
      </div>
    </Panel>
  );
}






function AIMicSettingsPanel() {
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState<string>('');

  useEffect(() => {
    async function loadMics() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(d => d.kind === 'audioinput');
        setMicrophones(audioInputs);
        const savedMic = localStorage.getItem('ai.microphoneId') || '';
        setSelectedMicId(savedMic);
      } catch(e) {
        console.error('Failed to load microphones', e);
      }
    }
    loadMics();
  }, []);

  const handleSave = () => {
    localStorage.setItem('ai.microphoneId', selectedMicId);
    toast.success('Microphone Saved', 'AI will use the selected microphone next time you start it.');
  };

  return (
    <Panel 
      title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>??? AI Speech Microphone</span>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
          Select the microphone used by the offline AI engine to capture voice commands and detect scriptures.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <select 
            value={selectedMicId} 
            onChange={e => setSelectedMicId(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-surface-border)',
              background: 'var(--color-bg-primary)',
              color: 'var(--color-text-primary)',
              width: '100%',
              maxWidth: '400px'
            }}
          >
            <option value="">Default System Microphone</option>
            {microphones.map(mic => (
              <option key={mic.deviceId} value={mic.deviceId}>
                {mic.label || `Microphone (${mic.deviceId.slice(0, 5)}...)`}
              </option>
            ))}
          </select>
          <Button variant="primary" icon={Save} onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </Panel>
  );
}

function RemoteControlPanel() {
  const [remoteInfo, setRemoteInfo] = useState<{ip: string, port: number, url: string} | null>(null);

  useEffect(() => {
    async function loadInfo() {
      try {
        if (window.sanctuary && window.sanctuary.remote) {
          const info = await window.sanctuary.remote.getInfo();
          setRemoteInfo(info);
        }
      } catch (e) {
        console.error('Failed to get remote info', e);
      }
    }
    loadInfo();
  }, []);

  return (
    <Panel 
      title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>📱 Mobile Remote Control</span>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
          Control slides and scriptures from your smartphone or tablet. Connect both devices to the same Wi-Fi network and scan the QR code below.
        </p>

        {remoteInfo ? (
          <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'center', background: 'var(--color-bg-primary)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ background: 'white', padding: '16px', borderRadius: '8px' }}>
              <QRCodeSVG value={remoteInfo.url} size={150} level={"H"} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Remote URL</span>
              <a href={remoteInfo.url} target="_blank" rel="noreferrer" style={{ color: 'var(--color-accent)', fontSize: '18px', textDecoration: 'none', fontWeight: 500 }}>
                {remoteInfo.url}
              </a>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginTop: '8px' }}>
                Type this URL into your phone's browser, or scan the QR code to connect instantly.
              </span>
            </div>
          </div>
        ) : (
          <div>Loading remote server info...</div>
        )}
      </div>
    </Panel>
  );
}


