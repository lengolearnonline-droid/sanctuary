import React, { useEffect, useState, useRef } from 'react';
import { useServiceStore, usePresentationStore } from '../../stores';
import { Service, ServiceItem } from '../../../shared/types';
import { Reorder } from 'framer-motion';
import { GripVertical, Clock, Save, Play, Square, Pause, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui';

export function ServicePage() {
  const { activeService, setActiveService, recentServices, setRecentServices } = useServiceStore();
  const [newServiceName, setNewServiceName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Timer State
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Load recent services
    const loadServices = async () => {
      try {
        if (window.sanctuary) {
          const services = await window.sanctuary.service.list();
          setRecentServices(services);
        }
      } catch (err) {
        console.error('Failed to load services:', err);
      }
    };
    loadServices();
  }, [setRecentServices]);

  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive]);

  const handleCreate = async () => {
    if (!newServiceName.trim()) return;
    try {
      if (window.sanctuary) {
        const service = await window.sanctuary.service.create(newServiceName);
        setActiveService(service as unknown as Service);
        setNewServiceName('');
        const services = await window.sanctuary.service.list();
        setRecentServices(services);
      }
    } catch (err) {
      console.error('Failed to create service:', err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this service?')) {
      try {
        await window.sanctuary.service.delete(id);
        const services = await window.sanctuary.service.list();
        useServiceStore.getState().setRecentServices(services);
      } catch (err) {
        console.error('Failed to delete service:', err);
      }
    }
  };

  const handleLoad = async (id: string) => {
    try {
      if (window.sanctuary) {
        const service = await window.sanctuary.service.load(id);
        if (service) {
          // Sort items by order before setting
          service.items.sort((a: any, b: any) => a.order - b.order);
          setActiveService(service as unknown as Service);
          setTimerSeconds(0);
          setTimerActive(false);
        }
      }
    } catch (err) {
      console.error('Failed to load service:', err);
    }
  };

  const handleSave = async () => {
    if (!activeService) return;
    setIsSaving(true);
    try {
      if (window.sanctuary) {
        // Ensure order is correct
        const toSave = { ...activeService };
        toSave.items = toSave.items.map((it, idx) => ({ ...it, order: idx }));
        
        await window.sanctuary.service.save(JSON.stringify(toSave));
        setActiveService(toSave);
      }
    } catch (err) {
      console.error('Failed to save service:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const updateItem = (id: string, updates: Partial<ServiceItem>) => {
    if (!activeService) return;
    setActiveService({
      ...activeService,
      items: activeService.items.map(it => it.id === id ? { ...it, ...updates } : it)
    });
  };

  const removeItem = (id: string) => {
    if (!activeService) return;
    setActiveService({
      ...activeService,
      items: activeService.items.filter(it => it.id !== id)
    });
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalDurationPlanned = activeService?.items.reduce((acc, curr) => acc + (curr.duration || 0), 0) || 0;

  return (
    <div className="service-page p-4 h-full flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2>Service Planner</h2>
      </div>
      
      {activeService ? (
        <div className="flex flex-1 gap-4 min-h-0">
          
          {/* LEFT: Timeline Planner */}
          <div className="panel flex-2 flex flex-col min-h-0" style={{ flex: 1, minWidth: '350px' }}>
            <div className="flex justify-between items-center p-4 border-b border-surface-border bg-surface-base">
              <div>
                <input 
                  type="text" 
                  value={activeService.name}
                  onChange={(e) => setActiveService({ ...activeService, name: e.target.value })}
                  className="input font-bold text-lg"
                  style={{ background: 'transparent', border: 'none', padding: 0, height: 'auto', width: '100%' }}
                />
                <p className="text-secondary text-sm mt-1">{activeService.date}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setActiveService(null)}>Close</Button>
                <Button variant="primary" icon={Save} isLoading={isSaving} onClick={handleSave}>Save</Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-4 bg-bg-base">
              {activeService.items && activeService.items.length > 0 ? (
                <Reorder.Group 
                  axis="y" 
                  values={activeService.items} 
                  onReorder={(newOrder) => {
                    const toSave = { ...activeService, items: newOrder };
                    setActiveService(toSave);
                  }}
                  className="flex flex-col gap-3"
                >
                  {activeService.items.map((item, idx) => {
                    const isActive = useServiceStore.getState().activeItemIndex === idx;
                    return (
                    <Reorder.Item 
                      key={item.id} 
                      value={item}
                      className={`border rounded-lg shadow-sm flex flex-col overflow-hidden transition-colors ${isActive ? 'border-primary bg-surface-highlight' : 'bg-surface-base border-surface-border'}`}
                    >
                      <div 
                        className="flex items-center p-2 cursor-pointer"
                        onClick={() => useServiceStore.getState().setActiveItemIndex(idx)}
                      >
                        <div className="cursor-grab p-1 text-tertiary hover:text-primary"><GripVertical size={16} /></div>
                        <div className="flex-1 font-semibold ml-2 text-sm">{item.title}</div>
                        <div className={`badge ml-2 text-xs ${isActive ? 'bg-primary text-white' : ''}`}>{item.type.toUpperCase()}</div>
                        <button className="text-tertiary hover:text-error ml-4 p-1" onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                      {isActive && (
                        <div className="p-3 flex gap-4 bg-surface-base border-t border-surface-border" onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-col gap-1 w-24">
                            <label className="text-xs text-secondary font-semibold uppercase flex items-center gap-1"><Clock size={12}/> Duration (m)</label>
                            <input 
                              type="number" 
                              className="input text-sm bg-bg-base" 
                              min="0"
                              value={item.duration || 0}
                              onChange={(e) => updateItem(item.id, { duration: parseInt(e.target.value) || 0 })}
                            />
                          </div>
                          <div className="flex flex-col gap-1 flex-1">
                            <label className="text-xs text-secondary font-semibold uppercase">Cue Notes</label>
                            <input 
                              type="text" 
                              className="input text-sm bg-bg-base" 
                              placeholder="e.g. Dim house lights, un-mute pastor..."
                              value={item.notes || ''}
                              onChange={(e) => updateItem(item.id, { notes: e.target.value })}
                            />
                          </div>
                        </div>
                      )}
                    </Reorder.Item>
                  )})}
                </Reorder.Group>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-secondary">
                  <div className="text-4xl mb-4">📋</div>
                  <p>No items in this service yet.</p>
                  <p className="text-sm">Add items by selecting them in the Bible, Songs, or Media tabs.</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Slide Grid & Stats */}
          <div className="flex-2 flex flex-col gap-4 min-h-0" style={{ flex: 1.5 }}>
            
            {useServiceStore.getState().activeItemIndex >= 0 && activeService.items[useServiceStore.getState().activeItemIndex] ? (() => {
              const itemIndex = useServiceStore.getState().activeItemIndex;
              const item = activeService.items[itemIndex];
              const slides = useServiceStore.getState().flatSlides.map((s, globalIndex) => ({ ...s, globalIndex })).filter(s => s.itemIndex === itemIndex);

              return (
                <div className="panel flex-1 flex flex-col bg-surface-base overflow-hidden">
                  <div className="panel-header border-b border-surface-border">
                    <div>
                      <h3 className="text-lg font-bold">{item.title}</h3>
                      <p className="text-sm text-secondary">{slides.length} slides</p>
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto p-4">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                      {slides.map((slide) => {
                        const isLive = useServiceStore.getState().currentLinearIndex === slide.globalIndex;
                        return (
                        <div 
                          key={slide.id}
                          className={`bg-bg-base border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors flex flex-col ${isLive ? 'border-primary shadow-sm' : 'border-surface-border'}`}
                          style={{ minHeight: '120px' }}
                          onClick={() => {
                            useServiceStore.getState().setCurrentLinearIndex(slide.globalIndex);
                            usePresentationStore.getState().sendToProgram({
                              type: slide.type,
                              content: slide.content
                            });
                          }}
                        >
                          <div className={`text-xs font-bold mb-2 ${isLive ? 'text-primary' : 'text-accent'}`}>{slide.id.split('_').pop() === '0' ? 'Start' : 'Slide ' + (parseInt(slide.id.split('_').pop() || '0') + 1)}</div>
                          <div className="text-sm flex-1 whitespace-pre-wrap">{slide.content.body}</div>
                        </div>
                      )})}
                    </div>
                  </div>
                </div>
              );
            })() : (
              // Timer & Stats when no item selected
              <div className="flex flex-col gap-4 h-full">
                <div className="panel p-4 flex flex-col items-center justify-center bg-surface-base" style={{ flex: 1 }}>
                  <h3 className="text-secondary text-sm font-semibold uppercase mb-4 tracking-wider">Rehearsal Timer</h3>
                  <div className="text-5xl font-mono font-bold text-primary mb-6" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {formatTime(timerSeconds)}
                  </div>
                  <div className="flex gap-2 w-full justify-center">
                    {!timerActive ? (
                      <Button variant="primary" icon={Play} onClick={() => setTimerActive(true)}>Start</Button>
                    ) : (
                      <Button variant="secondary" icon={Pause} onClick={() => setTimerActive(false)}>Pause</Button>
                    )}
                    <Button variant="secondary" icon={Square} onClick={() => { setTimerActive(false); setTimerSeconds(0); }}>Reset</Button>
                  </div>
                </div>

                <div className="panel p-4 flex flex-col bg-surface-base">
                  <h3 className="text-secondary text-sm font-semibold uppercase mb-4 tracking-wider">Service Overview</h3>
                  <div className="flex justify-between py-2 border-b border-surface-border">
                    <span className="text-secondary">Total Items</span>
                    <span className="font-bold">{activeService.items.length}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-surface-border">
                    <span className="text-secondary">Planned Duration</span>
                    <span className="font-bold">{totalDurationPlanned} mins</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-secondary">Est. End Time</span>
                    <span className="font-bold text-primary">
                      {new Date(Date.now() + totalDurationPlanned * 60000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="panel flex-1 p-6 flex flex-col items-center justify-center">
          <div className="max-w-md w-full">
            <h3 className="mb-4 text-xl">Create a New Service</h3>
            <div className="flex gap-2 mb-8">
              <input 
                type="text" 
                className="input flex-1" 
                placeholder="e.g. Sunday Morning Worship" 
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              <Button variant="primary" onClick={handleCreate}>Create</Button>
            </div>
            
            <h3 className="mb-4 text-lg text-secondary border-b border-surface-border pb-2">Recent Services</h3>
            <div className="flex flex-col gap-2 max-h-[300px] overflow-auto pr-2">
              {recentServices.length > 0 ? recentServices.map(s => (
                <div key={s.id} className="p-3 bg-surface-highlight border border-surface-border rounded flex justify-between items-center hover:border-primary transition-colors cursor-pointer" onClick={() => handleLoad(s.id)}>
                  <div>
                    <div className="font-semibold text-primary">{s.name}</div>
                    <div className="text-xs text-secondary">{s.date} • {s.itemCount} items</div>
                  </div>
                  <div className="flex gap-2">
                      <Button variant="secondary" size="sm">Open</Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        icon={Trash2} 
                        className="text-red-500 hover:bg-red-500/10 hover:text-red-400"
                        onClick={(e) => handleDelete(e, s.id)}
                      />
                    </div>
                </div>
              )) : (
                <p className="text-tertiary text-center py-4">No recent services found.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
