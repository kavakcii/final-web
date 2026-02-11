'use client';

import { useState, useRef, useEffect } from 'react';
import { User, Bell, Lock, Shield, CreditCard, Monitor, Save, Eye, X, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useUser } from '@/components/providers/UserProvider';
import { supabase } from '@/lib/supabase';
import { LoadingButton } from '@/components/ui/loading-button';
import { useToast } from '@/components/providers/ToastProvider';
import { DeleteAccountSection } from '@/components/ui/delete-account-section';


// Simple Input component if not exists
const SimpleInput = ({ label, placeholder, type = 'text', value, onChange }: any) => (
    <div className="space-y-2">
        <Label htmlFor={label}>{label}</Label>
        <input
            id={label}
            type={type}
            placeholder={placeholder}
            className="flex h-10 w-full rounded-md border border-white/10 bg-black px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-white"
            value={value}
            onChange={onChange}
        />
    </div>
);

const SimpleSelect = ({ label, options, value, onChange }: any) => (
    <div className="space-y-2">
        <Label>{label}</Label>
        <div className="relative">
            <select
                className="flex h-10 w-full appearance-none rounded-md border border-white/10 bg-black px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={value}
                onChange={onChange}
            >
                {options.map((opt: any, idx: number) => (
                    <option key={idx} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 opacity-50"><path d="m6 9 6 6 6-6" /></svg>
            </div>
        </div>
    </div>
);

const Section = ({ title, description, children }: any) => (
    <div className="space-y-6">
        <div>
            <h3 className="text-lg font-medium text-white">{title}</h3>
            <p className="text-sm text-slate-400">{description}</p>
        </div>
        <div className="space-y-4">
            {children}
        </div>
        <div className="h-px bg-white/10 w-full my-6" />
    </div>
);

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('account');
    const [notifications, setNotifications] = useState({
        email: true,
        push: false,
        marketing: false,
        security: true
    });

    const { addToast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [isUpdatingSecurity, setIsUpdatingSecurity] = useState(false);

    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [previewHtml, setPreviewHtml] = useState("");

    const handlePreviewReport = async () => {
        setIsPreviewLoading(true);
        try {
            const res = await fetch('/api/cron/weekly-report', { method: 'POST' });
            const data = await res.json();
            if (data.success && data.htmlPreview) {
                setPreviewHtml(data.htmlPreview);
                setPreviewModalOpen(true);
            } else {
                addToast('Rapor oluşturulamadı.', 'error');
            }
        } catch (error) {
            console.error(error);
            addToast('Bir hata oluştu.', 'error');
        } finally {
            setIsPreviewLoading(false);
        }
    };

    // Profile Photo Logic
    // Profile Photo Logic
    const { avatarUrl, setAvatarUrl, userName, setUserName, email, userMetadata, updateProfile } = useUser();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Profile Form State
    const [profileData, setProfileData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        phone: '',
        age: '',
        location: '',
        knowledgeLevel: 'beginner'
    });

    // Security Form State
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
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
                if (userMetadata.knowledgeLevel) newData.knowledgeLevel = userMetadata.knowledgeLevel;
            } else if (userName) {
                // Fallback to userName if no metadata loaded yet
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
        // Validation could go here
        const newFullName = `${profileData.firstName} ${profileData.lastName}`.trim();

        try {
            await updateProfile({
                full_name: newFullName,
                username: profileData.username,
                phone: profileData.phone,
                age: profileData.age,
                location: profileData.location,
                knowledgeLevel: profileData.knowledgeLevel
            });

            addToast('Profil bilgileriniz başarıyla güncellendi!', 'success');
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
            // In a real app, you would upload 'file' to Supabase Storage here
        }
    };

    const handleRemovePhoto = () => {
        setAvatarUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleUpdateSecurity = async () => {
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            addToast('Lütfen tüm alanları doldurunuz.', 'error');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            addToast('Yeni şifreler eşleşmiyor!', 'error');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            addToast('Yeni şifre en az 6 karakter olmalıdır.', 'error');
            return;
        }

        setIsUpdatingSecurity(true);

        try {
            // 1. Verify Current Password
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

            // 2. Update Password
            const { error: updateError } = await supabase.auth.updateUser({
                password: passwordData.newPassword
            });

            if (updateError) throw updateError;

            addToast('Şifreniz başarıyla güncellendi!', 'success');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });

        } catch (error: any) {
            console.error('Password update error:', error);
            addToast('Şifre güncellenirken bir hata oluştu: ' + error.message, 'error');
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
        { id: 'account', label: 'Hesap', icon: User },
        { id: 'notifications', label: 'Bildirimler', icon: Bell },
        { id: 'security', label: 'Güvenlik', icon: Shield },
        { id: 'billing', label: 'Plan & Ödeme', icon: CreditCard },
    ];

    return (
        <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)] bg-black text-white">
            {/* Sidebar for Settings */}
            <aside className="w-full md:w-64 border-r border-white/10 p-6 flex-shrink-0">
                <h1 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Ayarlar</h1>
                <nav className="space-y-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 active:scale-[0.98] ${activeTab === tab.id
                                ? 'bg-blue-600/20 text-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.3)] border border-blue-500/30'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Content Area */}
            <main className="flex-1 p-6 md:p-12 overflow-y-auto w-full">
                <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {activeTab === 'account' && (
                        <div className="space-y-8">
                            <Section title="Kişisel Bilgiler" description="Bu bilgiler, size daha doğru yatırım önerileri sunmamıza yardımcı olur.">
                                <div className="flex items-center space-x-6 mb-8 bg-slate-900/50 p-6 rounded-xl border border-white/5">
                                    <div className="relative group">
                                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 p-[2px]">
                                            <div className="w-full h-full rounded-full bg-black flex items-center justify-center relative overflow-hidden">
                                                {avatarUrl ? (
                                                    <img src={avatarUrl} alt="Profil" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="text-2xl font-bold text-white">SK</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center border-4 border-black cursor-pointer hover:bg-blue-500 transition-colors shadow-lg" onClick={handleUploadClick}>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white">
                                                <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium text-white">Profil Fotoğrafı</h3>
                                        <p className="text-sm text-slate-400 mb-3">Kişisel markanızı yansıtın.</p>
                                        <div className="flex space-x-3">
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                            />
                                            <button
                                                onClick={handleUploadClick}
                                                className="text-xs font-medium text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20 hover:bg-blue-500/20 active:scale-95 transition-all"
                                            >
                                                Yükle
                                            </button>
                                            <button
                                                onClick={handleRemovePhoto}
                                                className="text-xs font-medium text-red-400 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20 hover:bg-red-500/20 active:scale-95 transition-all"
                                            >
                                                Kaldır
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <SimpleInput
                                        label="Ad"
                                        placeholder="Adınız"
                                        value={profileData.firstName}
                                        onChange={(e: any) => handleInputChange('firstName', e.target.value)}
                                    />
                                    <SimpleInput
                                        label="Soyad"
                                        placeholder="Soyadınız"
                                        value={profileData.lastName}
                                        onChange={(e: any) => handleInputChange('lastName', e.target.value)}
                                    />

                                    <div className="md:col-span-2">
                                        <SimpleInput
                                            label="Yaşadığı Yer"
                                            placeholder="İstanbul, Türkiye"
                                            value={profileData.location}
                                            onChange={(e: any) => handleInputChange('location', e.target.value)}
                                        />
                                    </div>

                                    <SimpleInput
                                        label="Yaş"
                                        placeholder="25"
                                        type="number"
                                        value={profileData.age}
                                        onChange={(e: any) => handleInputChange('age', e.target.value)}
                                    />
                                    <SimpleInput
                                        label="Telefon Numarası"
                                        placeholder="05XX XXX XX XX"
                                        type="tel"
                                        value={profileData.phone}
                                        onChange={(e: any) => handleInputChange('phone', e.target.value)}
                                    />

                                    <div className="md:col-span-2">
                                        <SimpleInput
                                            label="Kullanıcı Adı"
                                            placeholder="@kullanici"
                                            value={profileData.username}
                                            onChange={(e: any) => handleInputChange('username', e.target.value)}
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <SimpleInput
                                            label="E-posta"
                                            placeholder="ornek@email.com"
                                            type="email"
                                            value={profileData.email}
                                            onChange={(e: any) => handleInputChange('email', e.target.value)}
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <SimpleSelect
                                            label="Finansal Bilgi Seviyesi"
                                            value={profileData.knowledgeLevel}
                                            onChange={(e: any) => handleInputChange('knowledgeLevel', e.target.value)}
                                            options={[
                                                { label: 'Başlangıç (Temel kavramları öğreniyorum)', value: 'beginner' },
                                                { label: 'Orta (Piyasayı takip ediyorum)', value: 'intermediate' },
                                                { label: 'İleri (Teknik/Temel analiz yapabiliyorum)', value: 'advanced' },
                                                { label: 'Profesyonel (Sektör çalışanıyım)', value: 'professional' }
                                            ]}
                                        />
                                        <p className="text-xs text-slate-500 mt-1">Bu bilgi, yapay zeka asistanının size verdiği yanıtların karmaşıklığını ayarlar.</p>
                                    </div>
                                </div>
                            </Section>

                            <DeleteAccountSection onDelete={handleDeleteAccount} />

                            <div className="flex justify-end">
                                <LoadingButton
                                    onClick={handleSaveProfile}
                                    isLoading={isSaving}
                                    className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20"
                                >
                                    {!isSaving && <Save className="w-4 h-4 mr-2" />}
                                    <span>Değişiklikleri Kaydet</span>
                                </LoadingButton>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="space-y-8">
                            <Section title="E-posta Bildirimleri" description="Hangi durumlarda e-posta almak istediğinizi seçin.">
                                <div className="flex items-center justify-between py-2 border-b border-white/5">
                                    <div className="space-y-0.5">
                                        <Label className="text-base text-white">Haftalık Bülten</Label>
                                        <p className="text-xs text-slate-400">Yapay zeka analizli haftalık piyasa özeti.</p>
                                        <button onClick={handlePreviewReport} className="text-xs text-blue-400 hover:text-blue-300 mt-1 flex items-center gap-1">
                                            {isPreviewLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
                                            {isPreviewLoading ? 'Hazırlanıyor...' : 'Önizle'}
                                        </button>
                                    </div>
                                    <Switch checked={notifications.marketing} onCheckedChange={(c) => setNotifications({ ...notifications, marketing: c })} />
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-white/5">
                                    <div className="space-y-0.5">
                                        <Label className="text-base text-white">Güvenlik Uyarıları</Label>
                                        <p className="text-xs text-slate-400">Hesabınıza şüpheli girişlerde bildirim alın.</p>
                                    </div>
                                    <Switch checked={notifications.security} onCheckedChange={(c) => setNotifications({ ...notifications, security: c })} />
                                </div>
                            </Section>

                            <Section title="Anlık Bildirimler (Push)" description="Uygulama içi ve tarayıcı bildirimleri.">
                                <div className="flex items-center justify-between py-2 border-b border-white/5">
                                    <div className="space-y-0.5">
                                        <Label className="text-base text-white">Fiyat Alarmları</Label>
                                        <p className="text-xs text-slate-400">Takip ettiğiniz hisseler hedef fiyata ulaştığında.</p>
                                    </div>
                                    <Switch checked={true} />
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-white/5">
                                    <div className="space-y-0.5">
                                        <Label className="text-base text-white">Portföy Güncellemeleri</Label>
                                        <p className="text-xs text-slate-400">Günlük portföy performans özeti.</p>
                                    </div>
                                    <Switch checked={false} />
                                </div>
                            </Section>

                            <div className="flex justify-end">
                                <button className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20">
                                    <Save className="w-4 h-4" />
                                    <span>Tercihleri Kaydet</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="space-y-8">
                            <Section title="Şifre Değiştir" description="Hesabınızın güvenliği için güçlü bir şifre kullanın.">
                                <div className="grid gap-4">
                                    <SimpleInput
                                        label="Mevcut Şifre"
                                        type="password"
                                        placeholder="••••••••"
                                        value={passwordData.currentPassword}
                                        onChange={(e: any) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    />
                                    <SimpleInput
                                        label="Yeni Şifre"
                                        type="password"
                                        placeholder="••••••••"
                                        value={passwordData.newPassword}
                                        onChange={(e: any) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    />
                                    <SimpleInput
                                        label="Yeni Şifre (Tekrar)"
                                        type="password"
                                        placeholder="••••••••"
                                        value={passwordData.confirmPassword}
                                        onChange={(e: any) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    />
                                </div>
                            </Section>
                            {/* 2FA Section Removed */}
                            <div className="flex justify-end">
                                <LoadingButton
                                    onClick={handleUpdateSecurity}
                                    isLoading={isUpdatingSecurity}
                                    className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20"
                                >
                                    {!isUpdatingSecurity && <Save className="w-4 h-4 mr-2" />}
                                    <span>Güvenlik Ayarlarını Güncelle</span>
                                </LoadingButton>
                            </div>
                        </div>
                    )}

                    {activeTab === 'billing' && (
                        <div className="text-center py-12">
                            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-8 rounded-2xl border border-white/10 max-w-md mx-auto">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
                                    <CreditCard className="w-8 h-8 text-white" />
                                </div>
                                <h2 className="text-xl font-bold text-white mb-2">Pro Plan</h2>
                                <p className="text-slate-400 mb-6">Şu anda ücretsiz beta sürümünü kullanıyorsunuz.</p>
                                <button className="bg-white text-black px-6 py-2 rounded-full font-medium hover:bg-slate-200 transition-colors">
                                    Planları İncele
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </main>

            {/* Preview Modal */}
            {previewModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-2xl h-[80vh] rounded-xl overflow-hidden flex flex-col relative shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-4 border-b bg-white">
                            <h3 className="text-lg font-bold text-slate-800">E-posta Önizleme</h3>
                            <button onClick={() => setPreviewModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 bg-slate-100 relative">
                            <iframe 
                                srcDoc={previewHtml} 
                                className="w-full h-full border-0 absolute inset-0" 
                                title="Email Preview"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
