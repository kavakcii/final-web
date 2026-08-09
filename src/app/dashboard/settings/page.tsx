'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { 
    User, 
    Bell, 
    Shield, 
    Save, 
    Eye, 
    X, 
    Loader2, 
    Sparkles, 
    CheckCircle2, 
    Lock, 
    KeyRound, 
    Mail, 
    Smartphone, 
    MapPin, 
    Briefcase, 
    Compass, 
    TrendingUp, 
    Coins, 
    Calendar, 
    DollarSign, 
    Sliders,
    RefreshCw
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useUser } from '@/components/providers/UserProvider';
import { supabase } from '@/lib/supabase';
import { LoadingButton } from '@/components/ui/loading-button';
import { useToast } from '@/components/providers/ToastProvider';
import { DeleteAccountSection } from '@/components/ui/delete-account-section';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Modern Light Input Component with Navy Focus
const FormInput = ({ 
    label, 
    placeholder, 
    type = 'text', 
    value, 
    onChange, 
    icon: Icon,
    disabled = false,
    helperText
}: { 
    label: string; 
    placeholder?: string; 
    type?: string; 
    value: string | number; 
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
    icon?: any;
    disabled?: boolean;
    helperText?: string;
}) => (
    <div className="space-y-1.5">
        <label className="block text-xs font-bold text-[#00008B] uppercase tracking-wider">
            {label}
        </label>
        <div className="relative flex items-center">
            {Icon && (
                <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <Icon className="w-4 h-4" />
                </div>
            )}
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                disabled={disabled}
                className={cn(
                    "w-full h-11 rounded-2xl bg-white border border-slate-200 text-sm font-semibold text-slate-800 placeholder:text-slate-400 transition-all shadow-sm",
                    "focus:outline-none focus:border-[#00008B] focus:ring-4 focus:ring-[#00008B]/10",
                    "disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed",
                    Icon ? "pl-10 pr-4" : "px-4"
                )}
            />
        </div>
        {helperText && (
            <p className="text-[11px] text-slate-400 font-medium">{helperText}</p>
        )}
    </div>
);

// Modern Light Select Component
const FormSelect = ({ 
    label, 
    options, 
    value, 
    onChange, 
    icon: Icon,
    helperText
}: { 
    label: string; 
    options: { label: string; value: string }[]; 
    value: string; 
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; 
    icon?: any;
    helperText?: string;
}) => (
    <div className="space-y-1.5">
        <label className="block text-xs font-bold text-[#00008B] uppercase tracking-wider">
            {label}
        </label>
        <div className="relative flex items-center">
            {Icon && (
                <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <Icon className="w-4 h-4" />
                </div>
            )}
            <select
                value={value}
                onChange={onChange}
                className={cn(
                    "w-full h-11 appearance-none rounded-2xl bg-white border border-slate-200 text-sm font-semibold text-slate-800 transition-all shadow-sm cursor-pointer",
                    "focus:outline-none focus:border-[#00008B] focus:ring-4 focus:ring-[#00008B]/10",
                    Icon ? "pl-10 pr-10" : "px-4 pr-10"
                )}
            >
                {options.map((opt, idx) => (
                    <option key={idx} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            <div className="pointer-events-none absolute right-3.5 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
        </div>
        {helperText && (
            <p className="text-[11px] text-slate-400 font-medium">{helperText}</p>
        )}
    </div>
);

// Card Section Wrapper
const SettingsCard = ({ 
    title, 
    description, 
    icon: Icon,
    children 
}: { 
    title: string; 
    description?: string; 
    icon?: any;
    children: React.ReactNode;
}) => (
    <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-xl shadow-[#00008B]/5 transition-all">
        <div className="flex items-center gap-3 pb-5 mb-6 border-b border-slate-100">
            {Icon && (
                <div className="w-10 h-10 rounded-2xl bg-[#00008B]/5 border border-[#00008B]/10 flex items-center justify-center text-[#00008B] shrink-0 shadow-sm">
                    <Icon className="w-5 h-5" />
                </div>
            )}
            <div>
                <h3 className="text-lg font-black text-[#00008B] tracking-tight">{title}</h3>
                {description && <p className="text-xs text-slate-500 font-medium mt-0.5">{description}</p>}
            </div>
        </div>
        <div className="space-y-6">
            {children}
        </div>
    </div>
);

function SettingsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialTab = searchParams ? (searchParams.get('tab') || 'account') : 'account';
    const [activeTab, setActiveTab] = useState(initialTab);

    // Sync tab with URL
    useEffect(() => {
        const tab = searchParams?.get('tab');
        if (tab && ['account', 'notifications', 'security'].includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId);
        router.push(`/dashboard/settings?tab=${tabId}`, { scroll: false });
    };

    const { addToast } = useToast();
    const { avatarUrl, setAvatarUrl, userName, setUserName, email, userMetadata, updateProfile } = useUser();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isSaving, setIsSaving] = useState(false);
    const [isUpdatingSecurity, setIsUpdatingSecurity] = useState(false);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [previewHtml, setPreviewHtml] = useState("");

    // Extended Profile & Investor Preferences State
    const [profileData, setProfileData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        phone: '',
        age: '',
        location: '',
        occupation: '',
        knowledgeLevel: 'intermediate',
        riskProfile: 'medium',
        investmentHorizon: 'medium',
        investmentGoal: 'balanced',
        islamicFinance: 'all',
        preferredCurrency: 'TRY'
    });

    // Security Form State
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Notification Preferences State
    const [notifications, setNotifications] = useState({
        weeklyNewsletter: true,
        securityAlerts: true,
        priceAlerts: true,
        dividendAlerts: true,
        earningsAlerts: true,
        dailyClosingSummary: false
    });

    useEffect(() => {
        setProfileData(prev => {
            const newData = { ...prev };

            if (userMetadata) {
                if (userMetadata.full_name) {
                    const parts = userMetadata.full_name.split(' ');
                    if (parts.length > 1) {
                        newData.firstName = parts[0];
                        newData.lastName = parts.slice(1).join(' ');
                    } else {
                        newData.firstName = userMetadata.full_name;
                    }
                }
                if (userMetadata.username) newData.username = userMetadata.username;
                if (userMetadata.phone) newData.phone = userMetadata.phone;
                if (userMetadata.age) newData.age = userMetadata.age;
                if (userMetadata.location) newData.location = userMetadata.location;
                if (userMetadata.occupation) newData.occupation = userMetadata.occupation;
                if (userMetadata.knowledgeLevel) newData.knowledgeLevel = userMetadata.knowledgeLevel;
                if (userMetadata.riskProfile) newData.riskProfile = userMetadata.riskProfile;
                if (userMetadata.investmentHorizon) newData.investmentHorizon = userMetadata.investmentHorizon;
                if (userMetadata.investmentGoal) newData.investmentGoal = userMetadata.investmentGoal;
                if (userMetadata.islamicFinance) newData.islamicFinance = userMetadata.islamicFinance;
                if (userMetadata.preferredCurrency) newData.preferredCurrency = userMetadata.preferredCurrency;
            } else if (userName) {
                const parts = userName.split(' ');
                if (parts.length > 1) {
                    newData.firstName = parts[0];
                    newData.lastName = parts.slice(1).join(' ');
                } else {
                    newData.firstName = userName;
                }
            }

            if (email) {
                newData.email = email;
            }

            return newData;
        });
    }, [userName, email, userMetadata]);

    const handleInputChange = (field: string, value: string) => {
        setProfileData(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        const newFullName = `${profileData.firstName} ${profileData.lastName}`.trim();

        try {
            await updateProfile({
                full_name: newFullName,
                username: profileData.username,
                phone: profileData.phone,
                age: profileData.age,
                location: profileData.location,
                occupation: profileData.occupation,
                knowledgeLevel: profileData.knowledgeLevel,
                riskProfile: profileData.riskProfile,
                investmentHorizon: profileData.investmentHorizon,
                investmentGoal: profileData.investmentGoal,
                islamicFinance: profileData.islamicFinance,
                preferredCurrency: profileData.preferredCurrency
            });

            addToast('Profil ve yatırım tercihleriniz başarıyla güncellendi!', 'success');
        } catch (error) {
            console.error(error);
            addToast('Profil güncellenirken bir hata oluştu.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const tempUrl = URL.createObjectURL(file);
            setAvatarUrl(tempUrl);
            addToast('Profil fotoğrafı güncellendi.', 'success');
        }
    };

    const handleRemovePhoto = () => {
        setAvatarUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        addToast('Profil fotoğrafı kaldırıldı.', 'success');
    };

    const handlePreviewReport = async () => {
        setIsPreviewLoading(true);
        try {
            const res = await fetch('/api/cron/weekly-report', { method: 'POST' });
            const data = await res.json();
            if (data.success && data.htmlPreview) {
                setPreviewHtml(data.htmlPreview);
                setPreviewModalOpen(true);
            } else {
                addToast('Rapor önizlemesi oluşturulamadı.', 'error');
            }
        } catch (error) {
            console.error(error);
            addToast('Bir hata oluştu.', 'error');
        } finally {
            setIsPreviewLoading(false);
        }
    };

    const handleSaveNotifications = () => {
        addToast('Bildirim tercihleriniz kaydedildi!', 'success');
    };

    const handleUpdateSecurity = async () => {
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            addToast('Lütfen tüm şifre alanlarını doldurunuz.', 'error');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            addToast('Yeni şifreler birbiriyle eşleşmiyor!', 'error');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            addToast('Yeni şifre en az 6 karakter olmalıdır.', 'error');
            return;
        }

        setIsUpdatingSecurity(true);

        try {
            if (!email) {
                addToast('Kullanıcı e-postası bulunamadı.', 'error');
                setIsUpdatingSecurity(false);
                return;
            }

            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: email,
                password: passwordData.currentPassword
            });

            if (signInError) {
                addToast('Mevcut şifreniz hatalı! Lütfen tekrar deneyiniz.', 'error');
                setIsUpdatingSecurity(false);
                return;
            }

            const { error: updateError } = await supabase.auth.updateUser({
                password: passwordData.newPassword
            });

            if (updateError) throw updateError;

            addToast('Şifreniz başarıyla güncellendi!', 'success');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });

        } catch (error: any) {
            console.error('Password update error:', error);
            addToast('Şifre güncellenirken hata oluştu: ' + error.message, 'error');
        } finally {
            setIsUpdatingSecurity(false);
        }
    };

    const handleDeleteAccount = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            addToast('Hesabınız başarıyla silindi.', 'success');
            window.location.href = '/';
        } catch (error: any) {
            addToast('Hata: ' + error.message, 'error');
        }
    };

    const tabs = [
        { id: 'account', label: 'Profil & Yatırımcı Kimliği', icon: User, desc: 'Kişisel ve stratejik AI profili' },
        { id: 'notifications', label: 'Bildirim & Piyasa Alarmları', icon: Bell, desc: 'Bülten ve fiyat alarmları' },
        { id: 'security', label: 'Güvenlik & Hesap', icon: Shield, desc: 'Şifre ve oturum yönetimi' },
    ];

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-16">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-[#00008B] text-xs font-bold mb-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00008B]"></span>
                        </span>
                        Akıllı Profil & Tercihler
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-[#00008B] tracking-tight">
                        Ayarlar
                    </h1>
                    <p className="text-sm font-medium text-[#00008B]/60 mt-1">
                        Kişisel bilgilerinizi, yatırım stratejinizi, yapay zeka tercihlerinizi ve güvenlik ayarlarınızı yönetin.
                    </p>
                </div>
            </div>

            {/* Navigation Tabs (Crystal Glass Pill Style) */}
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 p-2 rounded-3xl shadow-xl shadow-[#00008B]/5 flex flex-col sm:flex-row gap-2">
                {tabs.map((tab) => {
                    const TabIcon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={cn(
                                "flex-1 flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all text-left",
                                isActive
                                    ? "bg-[#00008B] text-white shadow-lg shadow-[#00008B]/20 scale-[1.01]"
                                    : "text-[#00008B]/70 hover:text-[#00008B] hover:bg-blue-50/70"
                            )}
                        >
                            <div className={cn(
                                "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                                isActive ? "bg-white/20 text-white" : "bg-[#00008B]/10 text-[#00008B]"
                            )}>
                                <TabIcon className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-black tracking-tight truncate">{tab.label}</span>
                                <span className={cn(
                                    "text-[10px] font-semibold truncate",
                                    isActive ? "text-white/70" : "text-slate-400"
                                )}>
                                    {tab.desc}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Tab Contents */}
            <AnimatePresence mode="wait">
                {activeTab === 'account' && (
                    <motion.div
                        key="account"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-8"
                    >
                        {/* Profil Fotoğrafı */}
                        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-xl shadow-[#00008B]/5">
                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                <div className="relative group shrink-0">
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#00008B] to-blue-600 p-1 shadow-xl shadow-[#00008B]/20">
                                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-white">
                                            {avatarUrl ? (
                                                <img src={avatarUrl} alt="Profil" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-2xl font-black text-[#00008B]">
                                                    {profileData.firstName ? profileData.firstName.slice(0, 1).toUpperCase() : 'F'}
                                                    {profileData.lastName ? profileData.lastName.slice(0, 1).toUpperCase() : 'A'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleUploadClick}
                                        className="absolute bottom-0 right-0 w-8 h-8 bg-[#00008B] text-white rounded-full flex items-center justify-center border-2 border-white shadow-md hover:bg-blue-700 transition-colors"
                                        title="Fotoğraf Yükle"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                            <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="text-center sm:text-left space-y-2">
                                    <h4 className="text-base font-black text-[#00008B]">Profil Fotoğrafı</h4>
                                    <p className="text-xs text-slate-500 font-medium">Kişisel markanızı ve panel kimliğinizi yansıtın.</p>
                                    <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                        />
                                        <button
                                            onClick={handleUploadClick}
                                            className="px-4 py-2 rounded-xl bg-[#00008B] hover:bg-[#0b2d82] text-white text-xs font-bold transition-all shadow-sm shadow-[#00008B]/20 active:scale-95"
                                        >
                                            Yeni Yükle
                                        </button>
                                        {avatarUrl && (
                                            <button
                                                onClick={handleRemovePhoto}
                                                className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-all active:scale-95"
                                            >
                                                Kaldır
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Kişisel & İletişim Bilgileri */}
                        <SettingsCard
                            title="Kişisel & İletişim Bilgileri"
                            description="Hesap ve iletişim detaylarınızı güncel tutun."
                            icon={User}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <FormInput
                                    label="Ad"
                                    placeholder="Adınız"
                                    value={profileData.firstName}
                                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                                />
                                <FormInput
                                    label="Soyad"
                                    placeholder="Soyadınız"
                                    value={profileData.lastName}
                                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                                />
                                <FormInput
                                    label="Yaşadığı Yer (Şehir / Ülke)"
                                    placeholder="İstanbul, Türkiye"
                                    icon={MapPin}
                                    value={profileData.location}
                                    onChange={(e) => handleInputChange('location', e.target.value)}
                                />
                                <FormInput
                                    label="Meslek / Sektör"
                                    placeholder="Yazılım Mühendisi, Finans Uzmanı vb."
                                    icon={Briefcase}
                                    value={profileData.occupation}
                                    onChange={(e) => handleInputChange('occupation', e.target.value)}
                                    helperText="Yapay zeka asistanı analizlerini sektörünüze göre özelleştirir."
                                />
                                <FormInput
                                    label="Yaş"
                                    placeholder="25"
                                    type="number"
                                    value={profileData.age}
                                    onChange={(e) => handleInputChange('age', e.target.value)}
                                />
                                <FormInput
                                    label="Telefon Numarası"
                                    placeholder="05XX XXX XX XX"
                                    type="tel"
                                    icon={Smartphone}
                                    value={profileData.phone}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                />
                                <FormInput
                                    label="Kullanıcı Adı"
                                    placeholder="@kullanici"
                                    value={profileData.username}
                                    onChange={(e) => handleInputChange('username', e.target.value)}
                                />
                                <FormInput
                                    label="E-posta Adresi"
                                    placeholder="ornek@email.com"
                                    type="email"
                                    icon={Mail}
                                    value={profileData.email}
                                    disabled
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    helperText="E-posta adresinizi değiştirmek için destek ekibiyle iletişime geçiniz."
                                />
                            </div>
                        </SettingsCard>

                        {/* Yatırımcı & Yapay Zeka Strateji Profili (YENİ VE KAPSAMLI ALANLAR) */}
                        <SettingsCard
                            title="Yatırımcı & Yapay Zeka Strateji Profili"
                            description="FinAi yapay zeka asistanının size özel analiz ve portföy tavsiyeleri üretebilmesi için strateji parametreleriniz."
                            icon={Sparkles}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <FormSelect
                                    label="Finansal Bilgi Seviyesi"
                                    icon={Compass}
                                    value={profileData.knowledgeLevel}
                                    onChange={(e) => handleInputChange('knowledgeLevel', e.target.value)}
                                    options={[
                                        { label: 'Başlangıç (Temel kavramları öğreniyorum)', value: 'beginner' },
                                        { label: 'Orta (Piyasayı ve haberleri düzenli takip ediyorum)', value: 'intermediate' },
                                        { label: 'İleri (Teknik & Temel analiz yapabiliyorum)', value: 'advanced' },
                                        { label: 'Profesyonel (Sektör veya Fon Yöneticisi)', value: 'professional' }
                                    ]}
                                    helperText="Yapay zekanın yanıt dilinin karmaşıklık düzeyini ayarlar."
                                />

                                <FormSelect
                                    label="Risk Toleransı"
                                    icon={TrendingUp}
                                    value={profileData.riskProfile}
                                    onChange={(e) => handleInputChange('riskProfile', e.target.value)}
                                    options={[
                                        { label: '🛡️ Düşük (Korumacı - Ana parayı koruma öncelikli)', value: 'low' },
                                        { label: '⚖️ Orta (Dengeli - Enflasyon üstü dengeli getiri)', value: 'medium' },
                                        { label: '🚀 Yüksek (Agresif - Yüksek getiri için volatiliteye açık)', value: 'high' }
                                    ]}
                                    helperText="Portföy risk simülasyonları ve alarm seviyelerini belirler."
                                />

                                <FormSelect
                                    label="Yatırım Vadesi (Zaman Ufku)"
                                    icon={Calendar}
                                    value={profileData.investmentHorizon}
                                    onChange={(e) => handleInputChange('investmentHorizon', e.target.value)}
                                    options={[
                                        { label: '⏱️ Kısa Vade (0 - 6 Ay)', value: 'short' },
                                        { label: '📈 Orta Vade (6 Ay - 2 Yıl)', value: 'medium' },
                                        { label: '🏛️ Uzun Vade (2+ Yıl / Emeklilik / Temettü)', value: 'long' }
                                    ]}
                                    helperText="Analizlerde önerilen vade beklentisini şekillendirir."
                                />

                                <FormSelect
                                    label="Ana Yatırım Stratejisi & Hedefi"
                                    icon={Coins}
                                    value={profileData.investmentGoal}
                                    onChange={(e) => handleInputChange('investmentGoal', e.target.value)}
                                    options={[
                                        { label: '💰 Temettü & Pasif Nakit Akışı', value: 'dividend' },
                                        { label: '🌱 Büyüme & Sermaye Kazancı (Growth)', value: 'growth' },
                                        { label: '🪙 Enflasyondan Korunma (Altın / Emtia)', value: 'hedge' },
                                        { label: '💎 Değer Yatırımı (Value Investing)', value: 'value' },
                                        { label: '🎯 Dengeli Karma Strateji', value: 'balanced' }
                                    ]}
                                    helperText="Yapay zekanın hisse ve fon tarama filtrelerini önceliklendirir."
                                />

                                <FormSelect
                                    label="Katılım / Helal Finans Filtresi"
                                    icon={Sliders}
                                    value={profileData.islamicFinance}
                                    onChange={(e) => handleInputChange('islamicFinance', e.target.value)}
                                    options={[
                                        { label: '🌟 Evet (Yalnızca Katılım Endeksine Uygun Varlıklar)', value: 'strict' },
                                        { label: '🌐 Fark Etmez (Tüm BIST & Fon Evreni)', value: 'all' }
                                    ]}
                                    helperText="BIST Katılım Endekslerine uygun hisse filtrelemesi sağlar."
                                />

                                <FormSelect
                                    label="Varsayılan Para Birimi"
                                    icon={DollarSign}
                                    value={profileData.preferredCurrency}
                                    onChange={(e) => handleInputChange('preferredCurrency', e.target.value)}
                                    options={[
                                        { label: '₺ Türk Lirası (TRY)', value: 'TRY' },
                                        { label: '$ Amerikan Doları (USD)', value: 'USD' },
                                        { label: '€ Euro (EUR)', value: 'EUR' }
                                    ]}
                                    helperText="Paneldeki varsayılan varlık hesaplama birimi."
                                />
                            </div>
                        </SettingsCard>

                        {/* Save Action Bar */}
                        <div className="flex justify-end pt-2">
                            <LoadingButton
                                onClick={handleSaveProfile}
                                isLoading={isSaving}
                                className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#00008B] hover:bg-[#0b2d82] text-white font-bold rounded-2xl text-sm shadow-lg shadow-[#00008B]/25 transition-all active:scale-95"
                            >
                                {!isSaving && <Save className="w-4 h-4" />}
                                <span>Değişiklikleri Kaydet</span>
                            </LoadingButton>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'notifications' && (
                    <motion.div
                        key="notifications"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-8"
                    >
                        {/* E-posta Bildirimleri */}
                        <SettingsCard
                            title="E-posta & Bülten Bildirimleri"
                            description="Gelen kutunuza ulaştırılacak yapay zeka analizleri ve güvenlik raporları."
                            icon={Mail}
                        >
                            <div className="space-y-4 divide-y divide-slate-100">
                                <div className="flex items-center justify-between pt-2">
                                    <div className="space-y-1 pr-4">
                                        <div className="text-sm font-bold text-[#00008B]">Haftalık Yapay Zeka Bülteni</div>
                                        <p className="text-xs text-slate-500 font-medium">
                                            Portföyünüze ve BIST trendlerine özel hazırlanan haftalık piyasa değerlendirme raporu.
                                        </p>
                                        <button 
                                            onClick={handlePreviewReport} 
                                            className="text-xs text-blue-600 hover:text-blue-700 font-bold mt-1 inline-flex items-center gap-1.5 hover:underline"
                                        >
                                            {isPreviewLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                                            {isPreviewLoading ? 'Bülten Hazırlanıyor...' : 'Bülten Formatını Önizle'}
                                        </button>
                                    </div>
                                    <Switch 
                                        checked={notifications.weeklyNewsletter} 
                                        onCheckedChange={(c) => setNotifications(prev => ({ ...prev, weeklyNewsletter: c }))} 
                                    />
                                </div>

                                <div className="flex items-center justify-between pt-4">
                                    <div className="space-y-1 pr-4">
                                        <div className="text-sm font-bold text-[#00008B]">Güvenlik & Giriş Uyarıları</div>
                                        <p className="text-xs text-slate-500 font-medium">
                                            Hesabınıza farklı bir cihaz veya konumdan giriş yapıldığında güvenlik e-postası alın.
                                        </p>
                                    </div>
                                    <Switch 
                                        checked={notifications.securityAlerts} 
                                        onCheckedChange={(c) => setNotifications(prev => ({ ...prev, securityAlerts: c }))} 
                                    />
                                </div>
                            </div>
                        </SettingsCard>

                        {/* Portföy & Piyasa Anlık Alarmları */}
                        <SettingsCard
                            title="Piyasa & Portföy Alarmları"
                            description="Varlıklarınızın fiyat hareketleri ve kurumsal takvim gelişmeleri."
                            icon={Bell}
                        >
                            <div className="space-y-4 divide-y divide-slate-100">
                                <div className="flex items-center justify-between pt-2">
                                    <div className="space-y-1 pr-4">
                                        <div className="text-sm font-bold text-[#00008B]">Temettü Ödeme Hatırlatıcıları</div>
                                        <p className="text-xs text-slate-500 font-medium">
                                            Portföyünüzdeki şirketlerin temettü hak kullanım gününden 1 gün önce bilgilendirme.
                                        </p>
                                    </div>
                                    <Switch 
                                        checked={notifications.dividendAlerts} 
                                        onCheckedChange={(c) => setNotifications(prev => ({ ...prev, dividendAlerts: c }))} 
                                    />
                                </div>

                                <div className="flex items-center justify-between pt-4">
                                    <div className="space-y-1 pr-4">
                                        <div className="text-sm font-bold text-[#00008B]">Bilanço & Finansal Sonuç Alarmları</div>
                                        <p className="text-xs text-slate-500 font-medium">
                                            Takip listenizdeki hisselerin çeyreklik bilanço açıklanma tarihleri açıklandığında bildirim.
                                        </p>
                                    </div>
                                    <Switch 
                                        checked={notifications.earningsAlerts} 
                                        onCheckedChange={(c) => setNotifications(prev => ({ ...prev, earningsAlerts: c }))} 
                                    />
                                </div>

                                <div className="flex items-center justify-between pt-4">
                                    <div className="space-y-1 pr-4">
                                        <div className="text-sm font-bold text-[#00008B]">Fiyat & Eşik Alarmları</div>
                                        <p className="text-xs text-slate-500 font-medium">
                                            Takip ettiğiniz hisseler belirlediğiniz hedef fiyata ulaştığında anlık alarm.
                                        </p>
                                    </div>
                                    <Switch 
                                        checked={notifications.priceAlerts} 
                                        onCheckedChange={(c) => setNotifications(prev => ({ ...prev, priceAlerts: c }))} 
                                    />
                                </div>

                                <div className="flex items-center justify-between pt-4">
                                    <div className="space-y-1 pr-4">
                                        <div className="text-sm font-bold text-[#00008B]">Günlük Portföy Kapanış Özeti</div>
                                        <p className="text-xs text-slate-500 font-medium">
                                            BIST seans kapanışında (18:15) günlük kâr/zarar performans bildirimi.
                                        </p>
                                    </div>
                                    <Switch 
                                        checked={notifications.dailyClosingSummary} 
                                        onCheckedChange={(c) => setNotifications(prev => ({ ...prev, dailyClosingSummary: c }))} 
                                    />
                                </div>
                            </div>
                        </SettingsCard>

                        {/* Save Action Bar */}
                        <div className="flex justify-end pt-2">
                            <button
                                onClick={handleSaveNotifications}
                                className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#00008B] hover:bg-[#0b2d82] text-white font-bold rounded-2xl text-sm shadow-lg shadow-[#00008B]/25 transition-all active:scale-95"
                            >
                                <Save className="w-4 h-4" />
                                <span>Tercihleri Kaydet</span>
                            </button>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'security' && (
                    <motion.div
                        key="security"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-8"
                    >
                        {/* Şifre Değiştir */}
                        <SettingsCard
                            title="Şifre Güncelleme"
                            description="Hesabınızın güvenliğini artırmak için düzenli olarak güçlü bir şifre belirleyin."
                            icon={Lock}
                        >
                            <div className="space-y-4 max-w-xl">
                                <FormInput
                                    label="Mevcut Şifre"
                                    type="password"
                                    placeholder="••••••••"
                                    icon={KeyRound}
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                />
                                <FormInput
                                    label="Yeni Şifre"
                                    type="password"
                                    placeholder="••••••••"
                                    icon={Lock}
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    helperText="En az 6 karakter, harf ve rakam kombinasyonu önerilir."
                                />
                                <FormInput
                                    label="Yeni Şifre (Tekrar)"
                                    type="password"
                                    placeholder="••••••••"
                                    icon={Lock}
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                />

                                <div className="pt-2">
                                    <LoadingButton
                                        onClick={handleUpdateSecurity}
                                        isLoading={isUpdatingSecurity}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#00008B] hover:bg-[#0b2d82] text-white font-bold rounded-2xl text-xs shadow-md shadow-[#00008B]/20 transition-all active:scale-95"
                                    >
                                        {!isUpdatingSecurity && <Save className="w-4 h-4" />}
                                        <span>Şifreyi Güncelle</span>
                                    </LoadingButton>
                                </div>
                            </div>
                        </SettingsCard>

                        {/* Oturum & Cihaz Bilgisi */}
                        <SettingsCard
                            title="Aktif Oturum Bilgisi"
                            description="Şu an bu cihaz üzerinden güvenli SSL bağlantısıyla işlem yapıyorsunuz."
                            icon={Shield}
                        >
                            <div className="flex items-center justify-between p-4 bg-blue-50/50 border border-blue-200/60 rounded-2xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                                    <div>
                                        <div className="text-xs font-bold text-[#00008B]">Bu Tarayıcı (Aktif Oturum)</div>
                                        <div className="text-[11px] text-slate-400 font-medium">Son etkinlik: Az önce • Supabase Auth v2</div>
                                    </div>
                                </div>
                                <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                                    Güvenli
                                </span>
                            </div>
                        </SettingsCard>

                        {/* Hesap Silme Bölümü */}
                        <DeleteAccountSection onDelete={handleDeleteAccount} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Email Report Preview Modal */}
            <AnimatePresence>
                {previewModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div 
                            onClick={() => setPreviewModalOpen(false)} 
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
                        />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.95, opacity: 0 }} 
                            className="bg-white w-full max-w-2xl h-[80vh] rounded-3xl overflow-hidden flex flex-col relative shadow-2xl z-10 border border-slate-200"
                        >
                            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#00008B] flex items-center justify-center font-bold">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-base font-black text-[#00008B]">E-posta Bülteni Önizlemesi</h3>
                                </div>
                                <button 
                                    onClick={() => setPreviewModalOpen(false)} 
                                    className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex-1 bg-slate-50 relative">
                                <iframe 
                                    srcDoc={previewHtml} 
                                    className="w-full h-full border-0 absolute inset-0" 
                                    title="Email Preview"
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center p-12 text-[#00008B] font-bold text-sm">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#00008B] mr-3"></div>
                Ayarlar yükleniyor...
            </div>
        }>
            <SettingsContent />
        </Suspense>
    );
}
