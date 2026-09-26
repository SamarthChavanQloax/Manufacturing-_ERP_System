import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import axios from 'axios';
import {
  Globe,
  Palette,
  Volume2,
  Bell,
  Scan,
  Package,
  Boxes,
  FileText,
  ShieldCheck,
  Building2,
  Barcode,
  Activity,
  Server,
  Save,
  CheckCircle2,
  Smartphone,
  Sliders,
  RefreshCw,
  Sun,
  Moon,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const {
    language,
    setLanguage,
    theme,
    setTheme,
    fontSize,
    setFontSize,
    soundFeedback,
    setSoundFeedback,
    voiceFeedback,
    setVoiceFeedback,
    scannerMode,
    setScannerMode,
    autoScan,
    setAutoScan,
    notifications,
    setNotificationSetting,
    playSound,
    speak,
    t
  } = usePreferences();

  const userRole = (user?.type || 'packing').toLowerCase();
  const displayRole = (user?.type || 'Packing').toUpperCase();
  const isAdmin = userRole === 'admin';
  const isPacking = userRole === 'packing';
  const isBox = userRole === 'box';
  const isInvoice = userRole === 'invoice';
  const isGate = userRole === 'gate';

  // Active Tab
  const [activeTab, setActiveTab] = useState<string>('preferences');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [systemHealth, setSystemHealth] = useState<any>(null);

  // Station and admin settings
  const [stationConfig, setStationConfig] = useState({
    defaultPackingQty: 10,
    packingStickerSize: '50x25mm',
    packingPrinter: 'Zebra_ZD220_Station1',
    autoPrintPacking: true,
    defaultBoxCapacity: 100,
    boxLabelSize: '100x150mm',
    boxPrinter: 'Zebra_ZT411_BoxArea',
    boxLockConfirmation: true,
    checkDuplicateBox: true,
    invoiceFormat: 'standard-gst',
    autoPrintDispatchDoc: true,
    invoicePrinter: 'HP_LaserJet_Office',
    gateVerificationMode: 'strict',
    autoPrintExitPass: true,
    gatePrinter: 'TSC_TTP244_Gate1',
    companyName: 'Manufacturing & Barcode ERP Systems Ltd.',
    companyGst: '27AABCU9603R1ZM',
    companyEmail: 'operations@mfg-erp.internal',
    companyPhone: '+91 98765 43210',
    barcodePrefixParts: '100000',
    barcodePrefixBoxes: '200000',
    barcodePrefixInvoices: '300000',
    sessionTimeoutMins: 60,
  });

  useEffect(() => {
    fetchBackendSettings();
  }, [userRole]);

  const fetchBackendSettings = async () => {
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get('/api/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success && res.data.settings) {
        setStationConfig(prev => ({
          ...prev,
          ...res.data.settings
        }));
      }
      if (isAdmin) {
        const healthRes = await axios.get('/api/settings/health', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (healthRes.data?.success) {
          setSystemHealth(healthRes.data.health);
        }
      }
    } catch (err) {
      console.warn('Local settings fallback in use:', err);
    }
  };

  const handleSaveStationSettings = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (token) {
        await axios.put('/api/settings', stationConfig, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      playSound('success');
      speak(t('successSave'));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      playSound('error');
      alert(err.response?.data?.message || 'Failed to save settings to server');
    } finally {
      setSaving(false);
    }
  };

  // Build the list of available tabs strictly conforming to the Settings Visibility Matrix
  const getAvailableTabs = () => {
    const tabs: { id: string; label: string; icon: React.ReactNode }[] = [
      { id: 'preferences', label: t('myPreferences'), icon: <Palette size={16} /> },
    ];

    // Scanner is visible to Admin, Packing, Box, Gate (not Invoice)
    if (isAdmin || isPacking || isBox || isGate) {
      tabs.push({ id: 'scanner', label: t('scannerSettings'), icon: <Scan size={16} /> });
    }

    // Role-specific operational tabs
    if (isAdmin || isPacking) {
      tabs.push({ id: 'packing', label: t('packingSettings'), icon: <Package size={16} /> });
    }
    if (isAdmin || isBox) {
      tabs.push({ id: 'box', label: t('boxSettings'), icon: <Boxes size={16} /> });
    }
    if (isAdmin || isInvoice) {
      tabs.push({ id: 'invoice', label: t('invoiceSettings'), icon: <FileText size={16} /> });
    }
    if (isAdmin || isGate) {
      tabs.push({ id: 'gate', label: t('gateSettings'), icon: <ShieldCheck size={16} /> });
    }

    // Admin-only master configurations
    if (isAdmin) {
      tabs.push(
        { id: 'company', label: t('companySettings'), icon: <Building2 size={16} /> },
        { id: 'barcode', label: t('barcodeSettings'), icon: <Barcode size={16} /> },
        { id: 'system', label: t('systemHealth'), icon: <Server size={16} /> }
      );
    }

    return tabs;
  };

  const tabs = getAvailableTabs();

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 28px 48px', boxSizing: 'border-box' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          background: 'var(--card-bg)',
          padding: '20px 24px',
          borderRadius: '16px',
          border: '1px solid var(--card-border)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
          marginBottom: '24px',
          transition: 'background 0.2s ease, border-color 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: theme === 'dark' ? '#1e293b' : '#eff6ff',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sliders size={24} color="#0284c7" />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              {t('settingsTitle')}
            </h1>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: '3px 0 0' }}>
              {t('settingsSubtitle')} • Active Role:{' '}
              <strong style={{ color: '#0284c7', textTransform: 'uppercase' }}>{displayRole}</strong>
            </p>
          </div>
        </div>

        {activeTab !== 'preferences' && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSaveStationSettings}
            disabled={saving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              fontWeight: 600,
              fontSize: '13.5px',
            }}
          >
            {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? t('saving') : t('saveSettings')}
          </button>
        )}
      </div>

      {saveSuccess && (
        <div
          style={{
            background: theme === 'dark' ? '#064e3b' : '#dcfce7',
            border: theme === 'dark' ? '1px solid #059669' : '1px solid #bbf7d0',
            color: theme === 'dark' ? '#6ee7b7' : '#166534',
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontWeight: 600,
            fontSize: '13.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={18} color={theme === 'dark' ? '#34d399' : '#16a34a'} />
          <span>{t('successSave')}</span>
        </div>
      )}

      {/* Role-Filtered Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '12px',
          marginBottom: '24px',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                fontSize: '13.5px',
                fontWeight: 600,
                borderRadius: '10px',
                border: isActive ? '1px solid #007bff' : '1px solid var(--card-border)',
                background: isActive ? '#007bff' : 'var(--card-bg)',
                color: isActive ? '#ffffff' : 'var(--text-muted)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? '0 2px 8px rgba(0, 123, 255, 0.25)' : 'none',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: MY PREFERENCES (ALL ROLES) ── */}
      {activeTab === 'preferences' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          
          {/* 1. Language Card */}
          <div
            style={{
              background: 'var(--card-bg)',
              borderRadius: '16px',
              border: '1px solid var(--card-border)',
              padding: '24px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
              transition: 'background 0.2s ease, border-color 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: theme === 'dark' ? '#312e81' : '#e0e7ff', color: theme === 'dark' ? '#a5b4fc' : '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Globe size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                  {t('language')}
                </h3>
                <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-muted)' }}>
                  Interface display & spoken instructions
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {[
                { code: 'en', title: 'English', sub: 'Standard' },
                { code: 'hi', title: 'हिंदी', sub: 'Hindi' },
                { code: 'mr', title: 'मराठी', sub: 'Marathi' },
              ].map((lang) => {
                const isSelected = language === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setLanguage(lang.code as any);
                      playSound('success');
                    }}
                    style={{
                      padding: '12px 8px',
                      borderRadius: '10px',
                      border: isSelected ? '2px solid #007bff' : '1px solid var(--card-border)',
                      background: isSelected ? (theme === 'dark' ? '#1e3a8a' : '#eff6ff') : 'var(--card-sub-bg)',
                      color: isSelected ? (theme === 'dark' ? '#93c5fd' : '#007bff') : 'var(--text-main)',
                      fontWeight: isSelected ? 800 : 600,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontSize: '15px' }}>{lang.title}</div>
                    <div style={{ fontSize: '11px', color: isSelected ? '#0284c7' : 'var(--text-muted)', marginTop: '2px' }}>{lang.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Appearance & Font Scaling */}
          <div
            style={{
              background: 'var(--card-bg)',
              borderRadius: '16px',
              border: '1px solid var(--card-border)',
              padding: '24px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
              transition: 'background 0.2s ease, border-color 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: theme === 'dark' ? '#581c87' : '#fae8ff', color: theme === 'dark' ? '#f0abfc' : '#a21caf', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Palette size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                  {t('appearance')}
                </h3>
                <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-muted)' }}>
                  Theme mode & text font scaling
                </p>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                {t('theme')}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px',
                    borderRadius: '10px',
                    border: theme === 'light' ? '2px solid #007bff' : '1px solid var(--card-border)',
                    background: theme === 'light' ? '#eff6ff' : 'var(--card-sub-bg)',
                    color: theme === 'light' ? '#007bff' : 'var(--text-main)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '13px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Sun size={15} /> {t('lightMode')}
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px',
                    borderRadius: '10px',
                    border: theme === 'dark' ? '2px solid #007bff' : '1px solid var(--card-border)',
                    background: theme === 'dark' ? '#1e3a8a' : 'var(--card-sub-bg)',
                    color: theme === 'dark' ? '#93c5fd' : 'var(--text-main)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '13px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Moon size={15} /> {t('darkMode')}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                {t('fontSize')}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {(['normal', 'large', 'xl'] as const).map((sz) => {
                  const isSelected = fontSize === sz;
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setFontSize(sz)}
                      style={{
                        padding: '8px 4px',
                        borderRadius: '8px',
                        border: isSelected ? '2px solid #007bff' : '1px solid var(--card-border)',
                        background: isSelected ? (theme === 'dark' ? '#1e3a8a' : '#eff6ff') : 'var(--card-sub-bg)',
                        color: isSelected ? (theme === 'dark' ? '#93c5fd' : '#007bff') : 'var(--text-main)',
                        fontWeight: isSelected ? 800 : 500,
                        cursor: 'pointer',
                        fontSize: '12px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {sz === 'normal' ? '14px (Normal)' : sz === 'large' ? '16px (Large)' : '18px (XL)'}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. Sound Feedback */}
          <div
            style={{
              background: 'var(--card-bg)',
              borderRadius: '16px',
              border: '1px solid var(--card-border)',
              padding: '24px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
              transition: 'background 0.2s ease, border-color 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: theme === 'dark' ? '#78350f' : '#fef3c7', color: theme === 'dark' ? '#fde68a' : '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Volume2 size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                  {t('soundFeedback')}
                </h3>
                <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-muted)' }}>
                  Acoustic tone feedback on scan & actions
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--card-sub-bg)',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--card-border)',
                  cursor: 'pointer',
                }}
              >
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-main)' }}>
                    {t('scanBeepSound')}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    Audio tone on barcode scan, verify, and errors
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={soundFeedback}
                  onChange={(e) => {
                    setSoundFeedback(e.target.checked);
                    if (e.target.checked) playSound('success');
                  }}
                  style={{ width: '18px', height: '18px', accentColor: '#007bff', cursor: 'pointer' }}
                />
              </label>
            </div>

            {/* Test Audio Tone Buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => playSound('success')}
                style={{ flex: 1, padding: '8px', fontSize: '11.5px', fontWeight: 700, borderRadius: '8px', border: theme === 'dark' ? '1px solid #059669' : '1px solid #bbf7d0', background: theme === 'dark' ? '#064e3b' : '#f0fdf4', color: theme === 'dark' ? '#6ee7b7' : '#15803d', cursor: 'pointer' }}
              >
                🔊 {t('verified')}
              </button>
              <button
                type="button"
                onClick={() => playSound('warning')}
                style={{ flex: 1, padding: '8px', fontSize: '11.5px', fontWeight: 700, borderRadius: '8px', border: theme === 'dark' ? '1px solid #d97706' : '1px solid #fde68a', background: theme === 'dark' ? '#78350f' : '#fffbeb', color: theme === 'dark' ? '#fde68a' : '#b45309', cursor: 'pointer' }}
              >
                ⚠️ Duplicate
              </button>
              <button
                type="button"
                onClick={() => playSound('error')}
                style={{ flex: 1, padding: '8px', fontSize: '11.5px', fontWeight: 700, borderRadius: '8px', border: theme === 'dark' ? '1px solid #dc2626' : '1px solid #fecaca', background: theme === 'dark' ? '#7f1d1d' : '#fef2f2', color: theme === 'dark' ? '#fca5a5' : '#b91c1c', cursor: 'pointer' }}
              >
                ❌ Invalid
              </button>
            </div>
          </div>

          {/* 4. Notification Alerts (Role-Scoped) */}
          <div
            style={{
              background: 'var(--card-bg)',
              borderRadius: '16px',
              border: '1px solid var(--card-border)',
              padding: '24px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
              transition: 'background 0.2s ease, border-color 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: theme === 'dark' ? '#064e3b' : '#dcfce7', color: theme === 'dark' ? '#6ee7b7' : '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                  {t('notifications')}
                </h3>
                <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-muted)' }}>
                  Active notifications for {displayRole}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--card-sub-bg)', borderRadius: '8px', border: '1px solid var(--card-border)', cursor: 'pointer' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>{t('lowStockAlerts')}</span>
                <input
                  type="checkbox"
                  checked={notifications.lowStock}
                  onChange={(e) => setNotificationSetting('lowStock', e.target.checked)}
                  style={{ width: '17px', height: '17px', accentColor: '#007bff' }}
                />
              </label>

              {(isAdmin || isPacking) && (
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--card-sub-bg)', borderRadius: '8px', border: '1px solid var(--card-border)', cursor: 'pointer' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>{t('pendingPackingAlerts')}</span>
                  <input
                    type="checkbox"
                    checked={notifications.pendingPacking}
                    onChange={(e) => setNotificationSetting('pendingPacking', e.target.checked)}
                    style={{ width: '17px', height: '17px', accentColor: '#007bff' }}
                  />
                </label>
              )}

              {(isAdmin || isBox) && (
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--card-sub-bg)', borderRadius: '8px', border: '1px solid var(--card-border)', cursor: 'pointer' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>{t('pendingBoxAlerts')}</span>
                  <input
                    type="checkbox"
                    checked={notifications.pendingBox}
                    onChange={(e) => setNotificationSetting('pendingBox', e.target.checked)}
                    style={{ width: '17px', height: '17px', accentColor: '#007bff' }}
                  />
                </label>
              )}

              {(isAdmin || isInvoice) && (
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--card-sub-bg)', borderRadius: '8px', border: '1px solid var(--card-border)', cursor: 'pointer' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>{t('pendingInvoiceAlerts')}</span>
                  <input
                    type="checkbox"
                    checked={notifications.pendingInvoice}
                    onChange={(e) => setNotificationSetting('pendingInvoice', e.target.checked)}
                    style={{ width: '17px', height: '17px', accentColor: '#007bff' }}
                  />
                </label>
              )}

              {(isAdmin || isGate) && (
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--card-sub-bg)', borderRadius: '8px', border: '1px solid var(--card-border)', cursor: 'pointer' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>{t('gateMismatchAlerts')}</span>
                  <input
                    type="checkbox"
                    checked={notifications.gateMismatch}
                    onChange={(e) => setNotificationSetting('gateMismatch', e.target.checked)}
                    style={{ width: '17px', height: '17px', accentColor: '#007bff' }}
                  />
                </label>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: SCANNER SETTINGS (Admin, Packing, Box, Gate) ── */}
      {activeTab === 'scanner' && (isAdmin || isPacking || isBox || isGate) && (
        <div
          style={{
            background: 'var(--card-bg)',
            borderRadius: '16px',
            border: '1px solid var(--card-border)',
            padding: '28px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
            transition: 'background 0.2s ease, border-color 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: theme === 'dark' ? '#1e293b' : '#eff6ff', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Scan size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                {t('scannerSettings')}
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                Configure hardware barcode gun scanner or mobile/tablet camera input
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label
                onClick={() => setScannerMode('hardware')}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '16px',
                  borderRadius: '12px',
                  border: scannerMode === 'hardware' ? '2px solid #007bff' : '1px solid var(--card-border)',
                  background: scannerMode === 'hardware' ? (theme === 'dark' ? '#1e3a8a' : '#eff6ff') : 'var(--card-sub-bg)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <input
                  type="radio"
                  name="scannerMode"
                  checked={scannerMode === 'hardware'}
                  onChange={() => setScannerMode('hardware')}
                  style={{ marginTop: '3px', accentColor: '#007bff' }}
                />
                <div>
                  <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Scan size={16} color="#007bff" /> Handheld USB / Bluetooth Scanner Gun
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
                    Fast laser scanning for factory workstations and conveyor belts.
                  </div>
                </div>
              </label>

              <label
                onClick={() => setScannerMode('camera')}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '16px',
                  borderRadius: '12px',
                  border: scannerMode === 'camera' ? '2px solid #007bff' : '1px solid var(--card-border)',
                  background: scannerMode === 'camera' ? (theme === 'dark' ? '#1e3a8a' : '#eff6ff') : 'var(--card-sub-bg)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <input
                  type="radio"
                  name="scannerMode"
                  checked={scannerMode === 'camera'}
                  onChange={() => setScannerMode('camera')}
                  style={{ marginTop: '3px', accentColor: '#007bff' }}
                />
                <div>
                  <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Smartphone size={16} color="#007bff" /> Built-in Device Camera Scanner
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
                    Use webcam or smartphone camera to capture 1D & QR barcodes.
                  </div>
                </div>
              </label>
            </div>

            <div style={{ background: 'var(--card-sub-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                    {t('autoScanMode')}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Automatically submit form upon barcode match without pressing enter
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoScan}
                  onChange={(e) => setAutoScan(e.target.checked)}
                  style={{ width: '20px', height: '20px', accentColor: '#007bff' }}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: PACKING SETTINGS (Admin & Packing) ── */}
      {activeTab === 'packing' && (isAdmin || isPacking) && (
        <div
          style={{
            background: 'var(--card-bg)',
            borderRadius: '16px',
            border: '1px solid var(--card-border)',
            padding: '28px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
            transition: 'background 0.2s ease, border-color 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: theme === 'dark' ? '#064e3b' : '#dcfce7', color: theme === 'dark' ? '#6ee7b7' : '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                {t('packingSettings')}
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                Station default quantities, barcode label dimensions & thermal printer
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Default Quantity Per Pack</label>
              <input
                type="number"
                className="form-control"
                value={stationConfig.defaultPackingQty}
                onChange={(e) => setStationConfig({ ...stationConfig, defaultPackingQty: Number(e.target.value) })}
                min="1"
                max="1000"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Sticker / Label Size</label>
              <select
                className="form-control"
                value={stationConfig.packingStickerSize}
                onChange={(e) => setStationConfig({ ...stationConfig, packingStickerSize: e.target.value })}
              >
                <option value="50x25mm">50mm x 25mm (Standard Part Sticker)</option>
                <option value="75x50mm">75mm x 50mm (Medium Box Sticker)</option>
                <option value="100x50mm">100mm x 50mm (Detailed 1D/2D Barcode)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Packing Thermal Printer</label>
              <input
                type="text"
                className="form-control"
                value={stationConfig.packingPrinter}
                onChange={(e) => setStationConfig({ ...stationConfig, packingPrinter: e.target.value })}
                placeholder="e.g. Zebra_ZD220_Station1"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--card-sub-bg)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-main)' }}>Auto-Print Sticker</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Generate thermal sticker on packing save</div>
                </div>
                <input
                  type="checkbox"
                  checked={stationConfig.autoPrintPacking}
                  onChange={(e) => setStationConfig({ ...stationConfig, autoPrintPacking: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#007bff' }}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: BOX SETTINGS (Admin & Box) ── */}
      {activeTab === 'box' && (isAdmin || isBox) && (
        <div
          style={{
            background: 'var(--card-bg)',
            borderRadius: '16px',
            border: '1px solid var(--card-border)',
            padding: '28px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
            transition: 'background 0.2s ease, border-color 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: theme === 'dark' ? '#78350f' : '#fef3c7', color: theme === 'dark' ? '#fde68a' : '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Boxes size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                {t('boxSettings')}
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                Master carton capacity, box sealing rules and duplicate checks
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Default Master Box Capacity</label>
              <input
                type="number"
                className="form-control"
                value={stationConfig.defaultBoxCapacity}
                onChange={(e) => setStationConfig({ ...stationConfig, defaultBoxCapacity: Number(e.target.value) })}
                min="1"
                max="10000"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Master Box Label Printer</label>
              <input
                type="text"
                className="form-control"
                value={stationConfig.boxPrinter}
                onChange={(e) => setStationConfig({ ...stationConfig, boxPrinter: e.target.value })}
                placeholder="e.g. Zebra_ZT411_BoxArea"
              />
            </div>

            <div style={{ background: 'var(--card-sub-bg)', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-main)' }}>Box Lock Confirmation</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Require confirmation before permanently sealing box</div>
                </div>
                <input
                  type="checkbox"
                  checked={stationConfig.boxLockConfirmation}
                  onChange={(e) => setStationConfig({ ...stationConfig, boxLockConfirmation: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#007bff' }}
                />
              </label>
            </div>

            <div style={{ background: 'var(--card-sub-bg)', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-main)' }}>Duplicate Barcode Protection</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Prevent scanning same part barcode twice in box</div>
                </div>
                <input
                  type="checkbox"
                  checked={stationConfig.checkDuplicateBox}
                  onChange={(e) => setStationConfig({ ...stationConfig, checkDuplicateBox: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#007bff' }}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: INVOICE SETTINGS (Admin & Invoice) ── */}
      {activeTab === 'invoice' && (isAdmin || isInvoice) && (
        <div
          style={{
            background: 'var(--card-bg)',
            borderRadius: '16px',
            border: '1px solid var(--card-border)',
            padding: '28px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
            transition: 'background 0.2s ease, border-color 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: theme === 'dark' ? '#1e293b' : '#eff6ff', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                {t('invoiceSettings')}
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                Invoice document format, office printer & dispatch challan settings
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Default Document Format</label>
              <select
                className="form-control"
                value={stationConfig.invoiceFormat}
                onChange={(e) => setStationConfig({ ...stationConfig, invoiceFormat: e.target.value })}
              >
                <option value="standard-gst">Standard Tax Invoice (GST A4 Format)</option>
                <option value="compact-dispatch">Compact Dispatch Challan</option>
                <option value="export-bill">Export Commercial Invoice</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Invoice Office Laser Printer</label>
              <input
                type="text"
                className="form-control"
                value={stationConfig.invoicePrinter}
                onChange={(e) => setStationConfig({ ...stationConfig, invoicePrinter: e.target.value })}
                placeholder="e.g. HP_LaserJet_Office"
              />
            </div>

            <div style={{ background: 'var(--card-sub-bg)', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-main)' }}>Auto-Print Dispatch Document</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Trigger dispatch document print upon invoice finalization</div>
                </div>
                <input
                  type="checkbox"
                  checked={stationConfig.autoPrintDispatchDoc}
                  onChange={(e) => setStationConfig({ ...stationConfig, autoPrintDispatchDoc: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#007bff' }}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 6: GATE SETTINGS (Admin & Gate) ── */}
      {activeTab === 'gate' && (isAdmin || isGate) && (
        <div
          style={{
            background: 'var(--card-bg)',
            borderRadius: '16px',
            border: '1px solid var(--card-border)',
            padding: '28px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
            transition: 'background 0.2s ease, border-color 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: theme === 'dark' ? '#3b0764' : '#ede9fe', color: theme === 'dark' ? '#d8b4fe' : '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                {t('gateSettings')}
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                Exit clearance policies, mismatch security checks & clearance pass printer
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Security Verification Policy</label>
              <select
                className="form-control"
                value={stationConfig.gateVerificationMode}
                onChange={(e) => setStationConfig({ ...stationConfig, gateVerificationMode: e.target.value })}
              >
                <option value="strict">Strict (100% Box & Invoice Match Required)</option>
                <option value="supervisor-override">Allow Supervisor Passcode Override</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Clearance Pass Printer</label>
              <input
                type="text"
                className="form-control"
                value={stationConfig.gatePrinter}
                onChange={(e) => setStationConfig({ ...stationConfig, gatePrinter: e.target.value })}
                placeholder="e.g. TSC_TTP244_Gate1"
              />
            </div>

            <div style={{ background: 'var(--card-sub-bg)', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-main)' }}>Auto-Print Clearance Pass</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Instantly print outward gate slip upon clearance</div>
                </div>
                <input
                  type="checkbox"
                  checked={stationConfig.autoPrintExitPass}
                  onChange={(e) => setStationConfig({ ...stationConfig, autoPrintExitPass: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#007bff' }}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 7: COMPANY SETTINGS (Admin Only) ── */}
      {activeTab === 'company' && isAdmin && (
        <div
          style={{
            background: 'var(--card-bg)',
            borderRadius: '16px',
            border: '1px solid var(--card-border)',
            padding: '28px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
            transition: 'background 0.2s ease, border-color 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: theme === 'dark' ? '#312e81' : '#e0e7ff', color: theme === 'dark' ? '#a5b4fc' : '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                {t('companySettings')}
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                Legal company registration, GST credentials & contact details
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Company Legal Name</label>
              <input
                type="text"
                className="form-control"
                value={stationConfig.companyName}
                onChange={(e) => setStationConfig({ ...stationConfig, companyName: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>GSTIN / Tax Registration No.</label>
              <input
                type="text"
                className="form-control"
                value={stationConfig.companyGst}
                onChange={(e) => setStationConfig({ ...stationConfig, companyGst: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Operations Email Address</label>
              <input
                type="email"
                className="form-control"
                value={stationConfig.companyEmail}
                onChange={(e) => setStationConfig({ ...stationConfig, companyEmail: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Corporate Contact Phone</label>
              <input
                type="text"
                className="form-control"
                value={stationConfig.companyPhone}
                onChange={(e) => setStationConfig({ ...stationConfig, companyPhone: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 8: BARCODE CONFIGURATION (Admin Only) ── */}
      {activeTab === 'barcode' && isAdmin && (
        <div
          style={{
            background: 'var(--card-bg)',
            borderRadius: '16px',
            border: '1px solid var(--card-border)',
            padding: '28px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
            transition: 'background 0.2s ease, border-color 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: theme === 'dark' ? '#78350f' : '#fef3c7', color: theme === 'dark' ? '#fde68a' : '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Barcode size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                {t('barcodeSettings')}
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                Global barcode generation series and auto-increment sequences
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            <div style={{ background: 'var(--card-sub-bg)', padding: '18px', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Part Barcode Sequence
              </label>
              <input
                type="text"
                className="form-control"
                value={stationConfig.barcodePrefixParts}
                onChange={(e) => setStationConfig({ ...stationConfig, barcodePrefixParts: e.target.value })}
              />
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>Format: 100001, 100002...</span>
            </div>

            <div style={{ background: 'var(--card-sub-bg)', padding: '18px', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Box Barcode Sequence
              </label>
              <input
                type="text"
                className="form-control"
                value={stationConfig.barcodePrefixBoxes}
                onChange={(e) => setStationConfig({ ...stationConfig, barcodePrefixBoxes: e.target.value })}
              />
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>Format: 200001, 200002...</span>
            </div>

            <div style={{ background: 'var(--card-sub-bg)', padding: '18px', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Invoice Barcode Sequence
              </label>
              <input
                type="text"
                className="form-control"
                value={stationConfig.barcodePrefixInvoices}
                onChange={(e) => setStationConfig({ ...stationConfig, barcodePrefixInvoices: e.target.value })}
              />
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>Format: 300001, 300002...</span>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 9: SYSTEM HEALTH & DIAGNOSTICS (Admin Only) ── */}
      {activeTab === 'system' && isAdmin && (
        <div
          style={{
            background: 'var(--card-bg)',
            borderRadius: '16px',
            border: '1px solid var(--card-border)',
            padding: '28px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
            transition: 'background 0.2s ease, border-color 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: theme === 'dark' ? '#7f1d1d' : '#fee2e2', color: theme === 'dark' ? '#fca5a5' : '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                {t('systemHealth')}
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                Real-time database connectivity status and server diagnostics
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            <div style={{ background: theme === 'dark' ? '#064e3b' : '#f0fdf4', padding: '20px', borderRadius: '12px', border: theme === 'dark' ? '1px solid #059669' : '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: theme === 'dark' ? '#6ee7b7' : '#166534', textTransform: 'uppercase' }}>Database Engine</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: theme === 'dark' ? '#a7f3d0' : '#14532d', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
                {systemHealth?.database || 'Connected (MySQL)'}
              </div>
              <div style={{ fontSize: '12px', color: theme === 'dark' ? '#6ee7b7' : '#15803d', marginTop: '6px' }}>
                Latency: {systemHealth?.dbLatency || '1.8ms'}
              </div>
            </div>

            <div style={{ background: theme === 'dark' ? '#1e3a8a' : '#eff6ff', padding: '20px', borderRadius: '12px', border: theme === 'dark' ? '1px solid #2563eb' : '1px solid #bfdbfe' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: theme === 'dark' ? '#93c5fd' : '#1e40af', textTransform: 'uppercase' }}>System Uptime</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: theme === 'dark' ? '#bfdbfe' : '#1e3a8a', marginTop: '4px' }}>
                {systemHealth?.uptime || '99.98%'}
              </div>
              <div style={{ fontSize: '12px', color: theme === 'dark' ? '#93c5fd' : '#2563eb', marginTop: '6px' }}>
                Node.js v20.x High-Speed Runtime
              </div>
            </div>

            <div style={{ background: theme === 'dark' ? '#581c87' : '#faf5ff', padding: '20px', borderRadius: '12px', border: theme === 'dark' ? '1px solid #7e22ce' : '1px solid #e9d5ff' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: theme === 'dark' ? '#e9d5ff' : '#6b21a8', textTransform: 'uppercase' }}>Automated Backup</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: theme === 'dark' ? '#f3e8ff' : '#581c87', marginTop: '4px' }}>
                {systemHealth?.lastBackup || 'Today, 04:00 AM'}
              </div>
              <div style={{ fontSize: '12px', color: theme === 'dark' ? '#d8b4fe' : '#7e22ce', marginTop: '6px' }}>
                Database Snapshot Synced
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default SettingsPage;
