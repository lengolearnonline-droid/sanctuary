import React from 'react';
import { Mail, MessageCircle, Book, ExternalLink, Keyboard, HelpCircle } from 'lucide-react';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';

export function HelpPage() {
  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      
      <div>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', margin: '0 0 var(--space-2) 0', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <HelpCircle size={28} color="var(--color-accent)" />
          Help & Support
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: 'var(--font-size-md)' }}>
          Need assistance? We're here to help you make the most out of Sanctuary.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
        
        {/* Contact Support */}
        <Panel title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MessageCircle size={18} /> Contact Support</span>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
              Our support team is available to assist you with any technical issues or questions you might have.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              
              {/* Email Support */}
              <div style={{ 
                background: 'var(--color-bg-secondary)', 
                padding: 'var(--space-4)', 
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Mail size={20} color="#3B82F6" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>Email Support</div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Support@ecclesiasync.com</div>
                  </div>
                </div>
                <a 
                  href="mailto:Support@ecclesiasync.com" 
                  style={{ textDecoration: 'none' }}
                >
                  <Button variant="secondary" icon={ExternalLink}>Email Us</Button>
                </a>
              </div>

              {/* WhatsApp Support */}
              <div style={{ 
                background: 'var(--color-bg-secondary)', 
                padding: 'var(--space-4)', 
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(37, 211, 102, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MessageCircle size={20} color="#25D366" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>WhatsApp Support</div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>+233 537 859 991</div>
                  </div>
                </div>
                <a 
                  href="https://wa.me/233537859991" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <Button style={{ background: '#25D366', color: 'white', border: 'none' }} icon={ExternalLink}>Chat Now</Button>
                </a>
              </div>

            </div>
          </div>
        </Panel>

        {/* Quick Reference */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          
          <Panel title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Keyboard size={18} /> Keyboard Shortcuts</span>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <ShortcutRow action="Next Slide" shortcut="Right Arrow / Space" />
              <ShortcutRow action="Previous Slide" shortcut="Left Arrow" />
              <ShortcutRow action="Clear Screen (Blackout)" shortcut="B" />
              <ShortcutRow action="Quick Save" shortcut="Ctrl + S" />
              <ShortcutRow action="Search Bible" shortcut="Ctrl + F" />
            </div>
          </Panel>

          <Panel title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Book size={18} /> Video Tutorials</span>}>
            <p style={{ color: 'var(--color-text-secondary)', margin: '0 0 var(--space-4) 0' }}>
              Check out our video tutorials on YouTube to learn how to master Sanctuary.
            </p>
            <a 
              href="https://www.youtube.com/playlist?list=PLSgLEEBlnsJM" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <Button variant="secondary" icon={ExternalLink}>Watch YouTube Playlist</Button>
            </a>
          </Panel>
          
        </div>

      </div>
    </div>
  );
}

function ShortcutRow({ action, shortcut }: { action: string, shortcut: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--color-surface-border)' }}>
      <span style={{ color: 'var(--color-text-secondary)' }}>{action}</span>
      <span style={{ 
        background: 'var(--color-bg-tertiary)', 
        padding: '4px 8px', 
        borderRadius: '4px', 
        fontSize: '12px', 
        fontFamily: 'monospace',
        color: 'var(--color-text-primary)'
      }}>
        {shortcut}
      </span>
    </div>
  );
}
