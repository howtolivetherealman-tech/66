import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  UserCheck,
  UserX,
  Megaphone,
  Newspaper,
  Globe,
  MessageSquareHeart,
  Lock,
  LogOut,
  CheckCircle2,
  Eye,
  Trash2,
  KeyRound,
  FileText,
  Download,
  MapPin,
  PlusCircle,
  CreditCard,
  Pencil,
  Image as ImageIcon,
  Upload,
  RotateCcw,
} from 'lucide-react';
import {
  validateAdminCredentials,
  ADMIN_USERNAME,
  formatFullAadhaar,
  generateReporterIdCode,
  getPrivateAdImageUrl,
  DEFAULT_BANNER_LOGO_URL,
  DEFAULT_BRAND_CONFIG,
  type ApprovalStatus,
  type NewsArticleItem,
  type NewsCategory,
  type NewsLevel,
  type PrivateAdItem,
  type ReporterRecord,
  type ReporterUpdateInput,
  type UserFeedbackItem,
  type AdSenseConfig,
  type BrandConfig,
} from '../utils/newsLogic';
import {
  getStates,
  getDistrictsByState,
  getMandalsByDistrict,
  type StateEntry,
} from '../data/indiaLocations';
import {
  downloadReporterAadhaarDocument,
  downloadReporterPressIdCard,
} from '../utils/cardDownload';
import { EdiNijamLogo, NetiBharatamBannerLogo } from './EdiNijamLogo';
import { ReporterAvatar } from './EditorialIllustration';
import { AadhaarCardPreview, PressIdCardPreview } from './IdentityCards';

interface AdminDashboardProps {
  isAdminAuthenticated: boolean;
  onAdminLoginSuccess: () => void;
  onAdminLogout: () => void;
  onGoogleAdminSignIn?: () => Promise<void>;
  firebaseUserEmail?: string | null;
  reporters: ReporterRecord[];
  onUpdateReporterStatus: (reporterId: string, status: ApprovalStatus) => Promise<void> | void;
  onEditReporter?: (
    reporterId: string,
    updates: ReporterUpdateInput
  ) => Promise<{ error?: string }> | { error?: string };
  locations?: StateEntry[];
  onAddDistrictAndMandals?: (params: {
    state: string;
    district: string;
    districtLabelTe?: string;
    mandalsInput: string;
  }) => Promise<{ error?: string; addedDistrict: boolean; addedMandals: string[] }> | {
    error?: string;
    addedDistrict: boolean;
    addedMandals: string[];
  };
  ads: PrivateAdItem[];
  onUpdateAdStatus: (adId: string, status: ApprovalStatus) => Promise<void> | void;
  articles: NewsArticleItem[];
  onPublishNews: (article: NewsArticleItem) => Promise<void> | void;
  onDeleteNews: (articleId: string) => Promise<void> | void;
  adsenseConfig: AdSenseConfig;
  onSaveAdsenseConfig: (config: AdSenseConfig) => Promise<void> | void;
  brandConfig?: BrandConfig;
  onSaveBrandConfig?: (config: BrandConfig) => Promise<void> | void;
  feedbackList: UserFeedbackItem[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isAdminAuthenticated,
  onAdminLoginSuccess,
  onAdminLogout,
  onGoogleAdminSignIn,
  firebaseUserEmail,
  reporters,
  onUpdateReporterStatus,
  onEditReporter,
  locations,
  onAddDistrictAndMandals,
  ads,
  onUpdateAdStatus,
  articles,
  onPublishNews,
  onDeleteNews,
  adsenseConfig,
  onSaveAdsenseConfig,
  brandConfig = DEFAULT_BRAND_CONFIG,
  onSaveBrandConfig,
  feedbackList,
}) => {
  const stateLocations = useMemo(() => locations || getStates(), [locations]);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState<
    'reporters' | 'locations' | 'brand' | 'ads' | 'adsense' | 'news' | 'security'
  >('reporters');

  // Expanded reporter ID for Aadhaar & Press ID inspection
  const [expandedReporterId, setExpandedReporterId] = useState<string | null>(
    reporters[0]?.id || null
  );

  // Reporter Edit State in Admin
  const [editingReporterId, setEditingReporterId] = useState<string | null>(null);
  const [editRepName, setEditRepName] = useState('');
  const [editRepUsername, setEditRepUsername] = useState('');
  const [editRepPassword, setEditRepPassword] = useState('');
  const [editRepMobile, setEditRepMobile] = useState('');
  const [editRepAadhaar, setEditRepAadhaar] = useState('');
  const [editRepState, setEditRepState] = useState('Andhra Pradesh');
  const [editRepDistrict, setEditRepDistrict] = useState('Guntur');
  const [editRepMandal, setEditRepMandal] = useState('Mangalagiri');
  const [editRepStatus, setEditRepStatus] = useState<ApprovalStatus>('approved');
  const [editRepFeedback, setEditRepFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const editRepDistricts = useMemo(
    () => getDistrictsByState(editRepState, stateLocations),
    [editRepState, stateLocations]
  );
  const editRepMandals = useMemo(
    () => getMandalsByDistrict(editRepState, editRepDistrict, stateLocations),
    [editRepState, editRepDistrict, stateLocations]
  );

  const startEditingReporter = (rep: ReporterRecord) => {
    setEditingReporterId(rep.id);
    setEditRepName(rep.name);
    setEditRepUsername(rep.username);
    setEditRepPassword(rep.passwordHash);
    setEditRepMobile(rep.mobile);
    setEditRepAadhaar(rep.aadhaarNumber);
    setEditRepState(rep.state);
    setEditRepDistrict(rep.district);
    setEditRepMandal(rep.mandal);
    setEditRepStatus(rep.status);
    setEditRepFeedback(null);
  };

  const handleSaveReporterEdit = async (e: React.FormEvent, reporterId: string) => {
    e.preventDefault();
    setEditRepFeedback(null);
    if (!onEditReporter) return;
    const res = await onEditReporter(reporterId, {
      name: editRepName,
      username: editRepUsername,
      password: editRepPassword,
      mobile: editRepMobile,
      aadhaarNumber: editRepAadhaar,
      state: editRepState,
      district: editRepDistrict,
      mandal: editRepMandal,
      status: editRepStatus,
    });
    if (res?.error) {
      setEditRepFeedback({ type: 'error', text: res.error });
      return;
    }
    setEditRepFeedback({
      type: 'success',
      text: 'రిపోర్టర్ యూజర్ నేమ్, పాస్‌వర్డ్ మరియు వివరాలు విజయవంతంగా అప్‌డేట్ చేయబడ్డాయి!',
    });
    setEditingReporterId(null);
  };

  // Logo & Banner Change State in Admin
  const [logoUrlInput, setLogoUrlInput] = useState(brandConfig.logoUrl);
  const [bannerLogoUrlInput, setBannerLogoUrlInput] = useState(brandConfig.bannerLogoUrl);
  const [useCustomLogoInput, setUseCustomLogoInput] = useState(brandConfig.useCustomLogo);
  const [logoSavedMsg, setLogoSavedMsg] = useState('');

  const handleLogoFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'logo' | 'banner' | 'both'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        if (target === 'logo' || target === 'both') {
          setLogoUrlInput(reader.result);
          setUseCustomLogoInput(true);
        }
        if (target === 'banner' || target === 'both') {
          setBannerLogoUrlInput(reader.result);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBrandLogo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogoSavedMsg('');
    if (!onSaveBrandConfig) return;
    const nextConfig: BrandConfig = {
      logoUrl: logoUrlInput.trim() || DEFAULT_BANNER_LOGO_URL,
      bannerLogoUrl: bannerLogoUrlInput.trim() || DEFAULT_BANNER_LOGO_URL,
      useCustomLogo: useCustomLogoInput,
      updatedAt: new Date().toISOString(),
    };
    await onSaveBrandConfig(nextConfig);
    setLogoSavedMsg('వెబ్‌సైట్ లోగో మరియు బ్యానర్ లోగో విజయవంతంగా మార్చబడ్డాయి!');
  };

  // State / District / Mandal Addition State
  const [locState, setLocState] = useState('Andhra Pradesh');
  const [locDistrictMode, setLocDistrictMode] = useState<'existing' | 'new'>('existing');
  const [locExistingDistrict, setLocExistingDistrict] = useState('Guntur');
  const [locNewDistrictName, setLocNewDistrictName] = useState('');
  const [locNewDistrictLabelTe, setLocNewDistrictLabelTe] = useState('');
  const [locMandalsInput, setLocMandalsInput] = useState('');
  const [locFeedbackMsg, setLocFeedbackMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const selectedStateDistricts = useMemo(
    () => getDistrictsByState(locState, stateLocations),
    [locState, stateLocations]
  );

  // AdSense Form State
  const [adsenseUrl, setAdsenseUrl] = useState(adsenseConfig.adsenseScriptUrl);
  const [adsenseClient, setAdsenseClient] = useState(adsenseConfig.adsenseClientId);
  const [adsenseSlot, setAdsenseSlot] = useState(adsenseConfig.adsenseSlotId);
  const [adsenseActive, setAdsenseActive] = useState(adsenseConfig.adsenseEnabled);
  const [adsenseSavedMsg, setAdsenseSavedMsg] = useState('');

  // Admin Direct News Upload State
  const [adminNewsTitleTe, setAdminNewsTitleTe] = useState('');
  const [adminNewsSummaryTe, setAdminNewsSummaryTe] = useState('');
  const [adminNewsContentTe, setAdminNewsContentTe] = useState('');
  const [adminNewsLevel, setAdminNewsLevel] = useState<NewsLevel>('national');
  const [adminNewsState, setAdminNewsState] = useState('Andhra Pradesh');
  const [adminNewsDistrict, setAdminNewsDistrict] = useState('Guntur');
  const [adminNewsMandal, setAdminNewsMandal] = useState('Mangalagiri');
  const [adminNewsCategory, setAdminNewsCategory] = useState<NewsCategory>('justice');
  const [adminNewsYoutube, setAdminNewsYoutube] = useState('');
  const [adminNewsSuccess, setAdminNewsSuccess] = useState('');

  const districts = useMemo(
    () => getDistrictsByState(adminNewsState, stateLocations),
    [adminNewsState, stateLocations]
  );
  const mandals = useMemo(
    () => getMandalsByDistrict(adminNewsState, adminNewsDistrict, stateLocations),
    [adminNewsState, adminNewsDistrict, stateLocations]
  );

  const pendingReportersCount = useMemo(
    () => reporters.filter((r) => r.status === 'pending').length,
    [reporters]
  );
  const pendingAdsCount = useMemo(
    () => ads.filter((a) => a.status === 'pending').length,
    [ads]
  );

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (validateAdminCredentials(usernameInput, passwordInput)) {
      onAdminLoginSuccess();
    } else {
      setLoginError(
        'అడ్మిన్ యూజర్‌నేమ్ లేదా పాస్‌వర్డ్ తప్పుగా ఉంది. (Use Admin / Bchakriraju1992@)'
      );
    }
  };

  const handleSaveAdsense = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdsenseSavedMsg('');
    const updated: AdSenseConfig = {
      adsenseScriptUrl: adsenseUrl.trim(),
      adsenseClientId: adsenseClient.trim(),
      adsenseSlotId: adsenseSlot.trim(),
      adsenseEnabled: adsenseActive,
      updatedByUid: ADMIN_USERNAME,
      updatedAt: new Date().toISOString(),
    };
    await onSaveAdsenseConfig(updated);
    setAdsenseSavedMsg(
      'Google AdSense లింక్ మరియు పబ్లిషర్ సెట్టింగ్స్ విజయవంతంగా సేవ్ చేయబడ్డాయి!'
    );
  };

  const handleAdminPublishNews = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminNewsSuccess('');
    if (adminNewsTitleTe.trim().length < 4 || adminNewsContentTe.trim().length < 10) return;

    const now = new Date().toISOString();
    const summary =
      adminNewsSummaryTe.trim() || adminNewsContentTe.trim().slice(0, 180) + '...';
    const newItem: NewsArticleItem = {
      id: `news-admin-${Date.now()}`,
      titleTe: adminNewsTitleTe.trim(),
      titleHi: adminNewsTitleTe.trim(),
      titleEn: adminNewsTitleTe.trim(),
      summaryTe: summary,
      summaryHi: summary,
      summaryEn: summary,
      contentTe: adminNewsContentTe.trim(),
      contentHi: adminNewsContentTe.trim(),
      contentEn: adminNewsContentTe.trim(),
      level: adminNewsLevel,
      state: adminNewsState,
      district: adminNewsDistrict,
      mandal: adminNewsMandal,
      category: adminNewsCategory,
      youtubeUrl: adminNewsYoutube.trim(),
      imageType: adminNewsLevel === 'national' ? 'national_justice' : 'mandal_sabha',
      reporterId: 'admin',
      reporterName: 'నేటిభారతం చీఫ్ ఎడిటర్ డెస్క్ (Admin)',
      views: 1,
      status: 'approved',
      authorUid: 'admin',
      createdAt: now,
      updatedAt: now,
      isBreaking: true,
    };

    await onPublishNews(newItem);
    setAdminNewsTitleTe('');
    setAdminNewsSummaryTe('');
    setAdminNewsContentTe('');
    setAdminNewsYoutube('');
    setAdminNewsSuccess('కొత్త వార్త విజయవంతంగా పబ్లిష్ చేయబడింది!');
  };

  const handleAddLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocFeedbackMsg(null);
    if (!onAddDistrictAndMandals) return;

    const targetDistrict =
      locDistrictMode === 'new' ? locNewDistrictName.trim() : locExistingDistrict.trim();

    const result = await onAddDistrictAndMandals({
      state: locState,
      district: targetDistrict,
      districtLabelTe: locDistrictMode === 'new' ? locNewDistrictLabelTe.trim() : undefined,
      mandalsInput: locMandalsInput,
    });

    if (result.error) {
      setLocFeedbackMsg({ type: 'error', text: result.error });
      return;
    }

    setLocFeedbackMsg({
      type: 'success',
      text: `${locState} రాష్ట్రంలోని "${targetDistrict}" జిల్లాలో ${
        result.addedDistrict ? 'కొత్త జిల్లా మరియు ' : ''
      }మండలాలు (${result.addedMandals.join(', ')}) విజయవంతంగా జతచేయబడ్డాయి! ఇవి ఇప్పుడు రిపోర్టర్ రిజిస్ట్రేషన్ మరియు న్యూస్ సెర్చింగ్‌లో వెంటనే కనిపిస్తాయి.`,
    });
    setLocMandalsInput('');
    if (locDistrictMode === 'new') {
      setLocExistingDistrict(targetDistrict);
      setLocNewDistrictName('');
      setLocNewDistrictLabelTe('');
      setLocDistrictMode('existing');
    }
  };

  if (!isAdminAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-8 rounded-2xl bg-white border border-stone-200 shadow-lg overflow-hidden">
        <div className="bg-[#0B1D3A] text-white p-6 space-y-1 border-b border-amber-500/30">
          <div className="text-xs uppercase tracking-widest text-amber-300 font-bold flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>CHIEF EDITOR &amp; SECURITY CONSOLE</span>
          </div>
          <h1 className="text-xl font-bold">నేటిభారతం — అడ్మిన్ లాగిన్ (Admin Login)</h1>
          <p className="text-xs text-stone-300">
            రిపోర్టర్ల ఆమోదం, యూజర్‌నేమ్/పాస్‌వర్డ్ ఎడిట్, లోగో మార్పు &amp; ప్రైవేట్ యాడ్స్ కంట్రోల్
          </p>
        </div>

        <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
          {loginError && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs font-semibold"
            >
              {loginError}
            </div>
          )}

          <div>
            <label htmlFor="admin-user-input" className="block text-xs font-bold text-stone-800 mb-1">
              అడ్మిన్ యూజర్ నేమ్ (Admin Username)
            </label>
            <input
              id="admin-user-input"
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="Admin"
              className="w-full rounded-lg border border-stone-300 bg-[#FBF9F5] px-3.5 py-2.5 text-sm font-mono text-stone-900"
            />
          </div>

          <div>
            <label htmlFor="admin-pass-input" className="block text-xs font-bold text-stone-800 mb-1">
              అడ్మిన్ పాస్‌వర్డ్ (Admin Password)
            </label>
            <input
              id="admin-pass-input"
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="••••••••••••••"
              className="w-full rounded-lg border border-stone-300 bg-[#FBF9F5] px-3.5 py-2.5 text-sm font-mono text-stone-900"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-[#0B1D3A] text-amber-300 text-sm font-bold hover:bg-[#142F5A] transition-colors cursor-pointer"
          >
            అడ్మిన్ డ్యాష్‌బోర్డ్‌లోకి లాగిన్ అవ్వండి
          </button>

          <div className="pt-3 border-t border-stone-200 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setUsernameInput('Admin');
                setPasswordInput('Bchakriraju1992@');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9A3412] hover:underline cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>ఆటో-ఫిల్ అడ్మిన్ క్రెడెన్షియల్స్ (Admin)</span>
            </button>

            {onGoogleAdminSignIn && (
              <button
                type="button"
                onClick={onGoogleAdminSignIn}
                className="text-xs font-semibold text-stone-700 hover:text-stone-900 underline cursor-pointer"
              >
                Google Cloud Sync
              </button>
            )}
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Admin Header Banner */}
      <div className="rounded-2xl bg-[#0B1D3A] text-white p-6 md:p-8 border border-amber-500/30 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-widest text-amber-300 font-bold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            <span>నేటిభారతం · MASTER ADMIN CONTROL DASHBOARD (USER: Admin)</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">
            అడ్మిన్ కంట్రోల్ సెంటర్ — రిపోర్టర్లు, లోగో మార్పు, ప్రైవేట్ యాడ్స్ &amp; జిల్లాల జాబితా
          </h1>
          <p className="text-xs text-stone-300">
            Zero-Trust Firestore Security Rules Active · PII Aadhaar Isolation Enabled
            {firebaseUserEmail ? ` · Cloud Auth: ${firebaseUserEmail}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setActiveTab('brand')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 text-[#0B1D3A] text-xs font-bold hover:bg-amber-300 cursor-pointer"
          >
            <ImageIcon className="w-4 h-4" />
            <span>లోగో &amp; బ్యానర్ మార్చండి (Change Logo)</span>
          </button>
          <button
            type="button"
            onClick={onAdminLogout}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/20 border border-white/15 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>అడ్మిన్ లాగ్ అవుట్ (Logout)</span>
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-300 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('reporters')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'reporters'
              ? 'bg-[#0B1D3A] text-amber-300'
              : 'bg-white border border-stone-300 text-stone-800 hover:bg-stone-100'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>1. రిపోర్టర్ల యూజర్‌నేమ్, పాస్‌వర్డ్ ఎడిట్ &amp; ID ఆమోదం ({pendingReportersCount} Pending)</span>
        </button>

        <button
          type="button"
          data-testid="admin-tab-locations"
          onClick={() => setActiveTab('locations')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'locations'
              ? 'bg-[#0B1D3A] text-amber-300'
              : 'bg-white border border-stone-300 text-stone-800 hover:bg-stone-100'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>2. AP (26) &amp; TG (33) జిల్లాలు, మండలాలు ఆడ్ చేయండి</span>
        </button>

        <button
          type="button"
          data-testid="admin-tab-brand"
          onClick={() => setActiveTab('brand')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'brand'
              ? 'bg-[#0B1D3A] text-amber-300'
              : 'bg-white border border-stone-300 text-stone-800 hover:bg-stone-100'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>3. లోగో &amp; బ్యానర్ మార్పు (Logo Change)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ads')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'ads'
              ? 'bg-[#0B1D3A] text-amber-300'
              : 'bg-white border border-stone-300 text-stone-800 hover:bg-stone-100'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>4. ప్రైవేట్ యాడ్స్ ఆమోదం ({pendingAdsCount} Pending)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('adsense')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'adsense'
              ? 'bg-[#0B1D3A] text-amber-300'
              : 'bg-white border border-stone-300 text-stone-800 hover:bg-stone-100'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>5. Google AdSense లింక్</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('news')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'news'
              ? 'bg-[#0B1D3A] text-amber-300'
              : 'bg-white border border-stone-300 text-stone-800 hover:bg-stone-100'
          }`}
        >
          <Newspaper className="w-4 h-4" />
          <span>6. న్యూస్ అప్‌లోడ్ ({articles.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'security'
              ? 'bg-[#0B1D3A] text-amber-300'
              : 'bg-white border border-stone-300 text-stone-800 hover:bg-stone-100'
          }`}
        >
          <MessageSquareHeart className="w-4 h-4" />
          <span>7. యూజర్ ఫీడ్‌బ్యాక్ ({feedbackList.length})</span>
        </button>
      </div>

      {/* ADMIN-ONLY GOOGLE ADSENSE SPONSORED UNIT PREVIEW */}
      {adsenseConfig.adsenseEnabled && (
        <div
          data-testid="admin-only-adsense-unit"
          className="rounded-2xl bg-white border border-stone-200 p-4 md:p-5 space-y-2 shadow-xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500">
            <span className="font-mono uppercase font-bold text-[#9A3412]">
              Google AdSense Sponsored Unit (Admin Only — Hidden on Public Home Page)
            </span>
            <span className="font-mono font-semibold text-stone-700">
              {adsenseConfig.adsenseClientId}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#FBF9F5] border border-dashed border-stone-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-xs font-bold text-stone-800">
                నేటిభారతం — Google AdSense Active Slot #{adsenseConfig.adsenseSlotId}
              </div>
              <p className="text-[11px] text-stone-500 break-all font-mono mt-0.5">
                {adsenseConfig.adsenseScriptUrl}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('adsense')}
              className="px-3 py-1.5 rounded-lg bg-[#0B1D3A] text-amber-300 text-xs font-bold hover:bg-[#142F5A] shrink-0 cursor-pointer"
            >
              AdSense సెట్టింగ్స్ మార్చండి
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: REPORTER FULL DETAILS, USERNAME/PASSWORD EDIT, AADHAAR CARD & PRESS ID CARD APPROVALS */}
      {activeTab === 'reporters' && (
        <div className="rounded-2xl bg-white border border-stone-200 p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-4">
            <div>
              <h2 className="text-lg font-bold text-stone-900">
                మండల రిపోర్టర్ల పూర్తి వివరాలు, యూజర్‌నేమ్ &amp; పాస్‌వర్డ్ ఎడిట్, ఆధార్ డౌన్‌లోడ్ &amp; ID ఆమోదం
              </h2>
              <p className="text-xs text-stone-600">
                రిపోర్టర్ యూజర్‌నేమ్, పాస్‌వర్డ్, మొబైల్ నెంబర్, మండలం వివరాలను ఇక్కడ చూడవచ్చు మరియు ఎడిట్ (Edit) చేయవచ్చు.
              </p>
            </div>
          </div>

          {editRepFeedback && (
            <div
              role="status"
              className={`p-3.5 rounded-xl border text-xs font-semibold ${
                editRepFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              {editRepFeedback.text}
            </div>
          )}

          <div className="space-y-5">
            {reporters.map((rep) => {
              const isExpanded = expandedReporterId === rep.id;
              const isEditing = editingReporterId === rep.id;

              return (
                <div
                  key={rep.id}
                  data-testid={`admin-reporter-card-${rep.id}`}
                  className="rounded-2xl bg-[#FBF9F5] border border-stone-300 overflow-hidden shadow-xs"
                >
                  <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <ReporterAvatar photoDataUrl={rep.photoDataUrl} name={rep.name} size="lg" />
                      <div className="space-y-2 text-xs flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-base font-bold text-stone-900">{rep.name}</span>
                          <span className="font-mono font-bold text-[#0B1D3A] bg-amber-100 px-2 py-0.5 rounded">
                            ID: {generateReporterIdCode(rep)}
                          </span>
                          <span
                            className={`font-bold uppercase px-2.5 py-0.5 rounded ${
                              rep.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-900'
                                : rep.status === 'pending'
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-red-100 text-red-900'
                            }`}
                          >
                            {rep.status === 'approved'
                              ? 'APPROVED (పర్మిషన్ ఇవ్వబడింది)'
                              : rep.status === 'pending'
                                ? 'PENDING (అడ్మిన్ పర్మిషన్ పెండింగ్)'
                                : 'REJECTED'}
                          </span>
                        </div>

                        {/* Full Reporter Details Grid including Username & Password */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 pt-1 text-stone-700">
                          <div className="p-2 rounded-lg bg-white border border-stone-200">
                            <span className="text-[11px] text-stone-500 block">
                              మండలం &amp; జిల్లా (Assigned Mandal):
                            </span>
                            <strong className="text-[#9A3412]">
                              {rep.mandal} మండలం ({rep.district}, {rep.state})
                            </strong>
                          </div>
                          <div
                            data-testid={`admin-reporter-credentials-${rep.id}`}
                            className="p-2 rounded-lg bg-amber-50/80 border border-amber-300"
                          >
                            <span className="text-[11px] text-stone-600 font-bold block">
                              యూజర్ నేమ్ (Username):
                            </span>
                            <strong className="font-mono text-[#0B1D3A] text-sm">
                              {rep.username}
                            </strong>
                          </div>
                          <div
                            data-testid={`admin-reporter-password-${rep.id}`}
                            className="p-2 rounded-lg bg-amber-50/80 border border-amber-300"
                          >
                            <span className="text-[11px] text-stone-600 font-bold block">
                              పాస్‌వర్డ్ (Password):
                            </span>
                            <strong className="font-mono text-[#9A3412] text-sm">
                              {rep.passwordHash}
                            </strong>
                          </div>
                          <div className="p-2 rounded-lg bg-white border border-stone-200">
                            <span className="text-[11px] text-stone-500 block">
                              మొబైల్ నెంబర్ (Mobile Number):
                            </span>
                            <strong className="font-mono text-stone-900">+91 {rep.mobile}</strong>
                          </div>
                          <div className="p-2 rounded-lg bg-white border border-stone-200">
                            <span className="text-[11px] text-stone-500 block">
                              పూర్తి ఆధార్ నంబర్ (Full Aadhaar):
                            </span>
                            <strong className="font-mono text-emerald-900">
                              {formatFullAadhaar(rep.aadhaarNumber)}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action, Edit & Download Buttons for Admin */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        data-testid={`admin-edit-reporter-${rep.id}`}
                        onClick={() => {
                          if (isEditing) {
                            setEditingReporterId(null);
                          } else {
                            startEditingReporter(rep);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#9A3412] text-white text-xs font-bold hover:bg-[#7C2D12] cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>
                          {isEditing
                            ? 'ఎడిట్ మూసివేయి (Cancel Edit)'
                            : 'యూజర్‌నేమ్ / పాస్‌వర్డ్ ఎడిట్ (Edit)'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedReporterId(isExpanded ? null : rep.id)
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-300 bg-white text-stone-800 text-xs font-bold hover:bg-stone-100 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#0B1D3A]" />
                        <span>
                          {isExpanded ? 'కార్డులు మూసివేయి' : 'ఆధార్ & ID కార్డు చూడండి'}
                        </span>
                      </button>

                      <button
                        type="button"
                        data-testid={`admin-download-aadhaar-${rep.id}`}
                        onClick={() => downloadReporterAadhaarDocument(rep)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0B1D3A] text-amber-300 text-xs font-bold hover:bg-[#142F5A] cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>ఆధార్ డౌన్‌లోడ్</span>
                      </button>

                      <button
                        type="button"
                        data-testid={`admin-download-id-${rep.id}`}
                        onClick={() => downloadReporterPressIdCard(rep)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-500 bg-amber-50 text-amber-950 text-xs font-bold hover:bg-amber-100 cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>ID కార్డు డౌన్‌లోడ్</span>
                      </button>

                      {rep.status !== 'approved' && (
                        <button
                          type="button"
                          data-testid={`admin-approve-reporter-${rep.id}`}
                          onClick={() => onUpdateReporterStatus(rep.id, 'approved')}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 cursor-pointer"
                        >
                          <UserCheck className="w-4 h-4" />
                          <span>ఆమోదించు (Approve)</span>
                        </button>
                      )}
                      {rep.status !== 'rejected' && (
                        <button
                          type="button"
                          onClick={() => onUpdateReporterStatus(rep.id, 'rejected')}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-300 bg-white text-red-700 text-xs font-bold hover:bg-red-50 cursor-pointer"
                        >
                          <UserX className="w-4 h-4" />
                          <span>తిరస్కరించు</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline Edit Form for Reporter Username, Password & Details */}
                  {isEditing && (
                    <form
                      onSubmit={(e) => handleSaveReporterEdit(e, rep.id)}
                      data-testid={`admin-edit-reporter-form-${rep.id}`}
                      className="p-5 bg-amber-50/60 border-t border-amber-300 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-[#0B1D3A] flex items-center gap-2">
                          <Pencil className="w-4 h-4 text-[#9A3412]" />
                          <span>
                            రిపోర్టర్ వివరాలు, యూజర్ నేమ్ &amp; పాస్‌వర్డ్ మార్చండి (Edit Reporter Details &amp; Credentials)
                          </span>
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-stone-800 mb-1">
                            పూర్తి పేరు (Reporter Name) *
                          </label>
                          <input
                            type="text"
                            value={editRepName}
                            onChange={(e) => setEditRepName(e.target.value)}
                            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-900"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#0B1D3A] mb-1">
                            యూజర్ నేమ్ (Username) *
                          </label>
                          <input
                            type="text"
                            data-testid={`admin-edit-username-input-${rep.id}`}
                            value={editRepUsername}
                            onChange={(e) => setEditRepUsername(e.target.value)}
                            className="w-full rounded-lg border border-amber-400 bg-white px-3 py-2 text-xs font-mono font-bold text-[#0B1D3A]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#9A3412] mb-1">
                            పాస్‌వర్డ్ (Password) *
                          </label>
                          <input
                            type="text"
                            data-testid={`admin-edit-password-input-${rep.id}`}
                            value={editRepPassword}
                            onChange={(e) => setEditRepPassword(e.target.value)}
                            className="w-full rounded-lg border border-amber-400 bg-white px-3 py-2 text-xs font-mono font-bold text-[#9A3412]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-stone-800 mb-1">
                            మొబైల్ నెంబర్ (Mobile) *
                          </label>
                          <input
                            type="text"
                            value={editRepMobile}
                            onChange={(e) => setEditRepMobile(e.target.value)}
                            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-mono text-stone-900"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-stone-800 mb-1">
                            12-అంకెల ఆధార్ (Aadhaar) *
                          </label>
                          <input
                            type="text"
                            value={editRepAadhaar}
                            onChange={(e) => setEditRepAadhaar(e.target.value)}
                            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-mono text-stone-900"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-stone-800 mb-1">
                            రాష్ట్రం (State)
                          </label>
                          <select
                            value={editRepState}
                            onChange={(e) => {
                              const nextSt = e.target.value;
                              setEditRepState(nextSt);
                              const dists = getDistrictsByState(nextSt, stateLocations);
                              const firstD = dists[0]?.district || '';
                              setEditRepDistrict(firstD);
                              setEditRepMandal(dists[0]?.mandals[0] || '');
                            }}
                            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-900"
                          >
                            {stateLocations.map((s) => (
                              <option key={s.state} value={s.state}>
                                {s.labelTe} ({s.state})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-stone-800 mb-1">
                            జిల్లా (District)
                          </label>
                          <select
                            value={editRepDistrict}
                            onChange={(e) => {
                              const nextDist = e.target.value;
                              setEditRepDistrict(nextDist);
                              const mands = getMandalsByDistrict(editRepState, nextDist, stateLocations);
                              setEditRepMandal(mands[0] || '');
                            }}
                            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-900"
                          >
                            {editRepDistricts.map((d) => (
                              <option key={d.district} value={d.district}>
                                {d.labelTe ? `${d.labelTe} (${d.district})` : d.district}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-stone-800 mb-1">
                            మండలం (Mandal)
                          </label>
                          <select
                            value={editRepMandal}
                            onChange={(e) => setEditRepMandal(e.target.value)}
                            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-bold text-[#9A3412]"
                          >
                            {editRepMandals.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingReporterId(null)}
                          className="px-4 py-2 rounded-lg border border-stone-300 bg-white text-stone-700 text-xs font-bold hover:bg-stone-100 cursor-pointer"
                        >
                          రద్దు చేయండి (Cancel)
                        </button>
                        <button
                          type="submit"
                          data-testid={`admin-save-reporter-${rep.id}`}
                          className="px-5 py-2 rounded-lg bg-[#0B1D3A] text-amber-300 text-xs font-bold hover:bg-[#142F5A] cursor-pointer"
                        >
                          మార్పులు సేవ్ చేయండి (Save Username, Password &amp; Details)
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Expanded Aadhaar Card & Auto-Created Press ID Card Inspection View */}
                  {isExpanded && (
                    <div className="p-5 bg-white border-t border-stone-200 grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left: Reporter Aadhaar Card Document */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-emerald-700" />
                            <span>
                              రిపోర్టర్ ఆధార్ కార్డు (Aadhaar Card — {formatFullAadhaar(rep.aadhaarNumber)})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => downloadReporterAadhaarDocument(rep)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#9A3412] hover:underline cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>ఆధార్ కార్డు డౌన్‌లోడ్ చేయండి</span>
                          </button>
                        </div>
                        <AadhaarCardPreview reporter={rep} />
                      </div>

                      {/* Right: Auto-Created Press ID Card */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                            <CreditCard className="w-4 h-4 text-[#0B1D3A]" />
                            <span>
                              ఆటోమేటిక్‌గా క్రియేట్ అయిన ప్రెస్ ఐడి కార్డు ({generateReporterIdCode(rep)})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => downloadReporterPressIdCard(rep)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:underline cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>ప్రెస్ ఐడి కార్డు డౌన్‌లోడ్ చేయండి</span>
                          </button>
                        </div>
                        <PressIdCardPreview reporter={rep} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: LOGO & BANNER CHANGE OPTION IN ADMIN */}
      {activeTab === 'brand' && (
        <form
          onSubmit={handleSaveBrandLogo}
          data-testid="admin-brand-logo-form"
          className="rounded-2xl bg-white border border-stone-200 p-6 md:p-8 space-y-6"
        >
          <div className="border-b border-stone-200 pb-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-[#9A3412] font-bold flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4" />
                <span>BRAND LOGO &amp; BANNER LOGO CUSTOMIZATION</span>
              </div>
              <h2 className="text-lg font-bold text-stone-900 mt-1">
                వెబ్‌సైట్ లోగో &amp; బ్యానర్ లోగో మార్పు (Logo &amp; Banner Change Option)
              </h2>
              <p className="text-xs text-stone-600 mt-1">
                ఇక్కడ మీరు నేటిభారతం ప్రధాన బ్యానర్ లోగోను మరియు హెడర్ లోగోను కొత్త ఇమేజ్ అప్‌లోడ్ చేయడం ద్వారా లేదా URL ద్వారా ఎప్పుడైనా మార్చుకోవచ్చు.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setLogoUrlInput(DEFAULT_BANNER_LOGO_URL);
                setBannerLogoUrlInput(DEFAULT_BANNER_LOGO_URL);
                setUseCustomLogoInput(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 bg-[#FBF9F5] text-xs font-bold text-stone-800 hover:bg-stone-100 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>డిఫాల్ట్ నేటిభారతం బ్యానర్ లోగో రీసెట్ (Reset Default)</span>
            </button>
          </div>

          {logoSavedMsg && (
            <div
              role="status"
              className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs font-semibold flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{logoSavedMsg}</span>
            </div>
          )}

          {/* Live Banner Logo & Emblem Preview */}
          <div className="p-5 rounded-2xl bg-[#FBF9F5] border border-stone-200 space-y-4">
            <div className="text-xs font-bold text-stone-800">
              ప్రస్తుత బ్యానర్ లోగో ప్రివ్యూ (Current Active Banner Logo Preview):
            </div>
            <NetiBharatamBannerLogo bannerUrl={bannerLogoUrlInput} />
            <div className="flex items-center gap-4 pt-2">
              <span className="text-xs font-bold text-stone-700">హెడర్ లోగో ప్రివ్యూ:</span>
              <EdiNijamLogo
                size={48}
                logoUrl={useCustomLogoInput ? logoUrlInput : ''}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Banner Logo Upload / URL */}
            <div className="p-4 rounded-xl bg-[#FBF9F5] border border-stone-200 space-y-3">
              <label
                htmlFor="admin-banner-logo-url"
                className="block text-xs font-bold text-stone-900"
              >
                1. ప్రధాన బ్యానర్ లోగో (Main Banner Logo URL / Upload)
              </label>
              <input
                id="admin-banner-logo-url"
                type="text"
                value={bannerLogoUrlInput}
                onChange={(e) => setBannerLogoUrlInput(e.target.value)}
                placeholder="/assets/aistudio/neti_bharatham.png_49db37a4.jpg"
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-mono text-stone-900"
              />
              <div className="flex flex-wrap items-center gap-2">
                <label
                  htmlFor="admin-banner-file-upload"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0B1D3A] text-amber-300 text-xs font-bold hover:bg-[#142F5A] cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>కొత్త బ్యానర్ లోగో ఇమేజ్ అప్‌లోడ్ చేయండి</span>
                  <input
                    id="admin-banner-file-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleLogoFileUpload(e, 'both')}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>

            {/* Header Logo Upload / URL */}
            <div className="p-4 rounded-xl bg-[#FBF9F5] border border-stone-200 space-y-3">
              <label
                htmlFor="admin-header-logo-url"
                className="block text-xs font-bold text-stone-900"
              >
                2. హెడర్ &amp; ఐడి కార్డు లోగో (Header Emblem Logo URL / Upload)
              </label>
              <input
                id="admin-header-logo-url"
                type="text"
                value={logoUrlInput}
                onChange={(e) => setLogoUrlInput(e.target.value)}
                placeholder="/assets/aistudio/neti_bharatham.png_49db37a4.jpg"
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-mono text-stone-900"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="admin-logo-file-upload"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-stone-300 bg-white text-stone-800 text-xs font-bold hover:bg-stone-100 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>హెడర్ లోగో అప్‌లోడ్</span>
                  <input
                    id="admin-logo-file-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleLogoFileUpload(e, 'logo')}
                    className="sr-only"
                  />
                </label>

                <label className="inline-flex items-center gap-2 text-xs font-semibold text-stone-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useCustomLogoInput}
                    onChange={(e) => setUseCustomLogoInput(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span>కస్టమ్ ఇమేజ్ లోగో వాడండి</span>
                </label>
              </div>
            </div>
          </div>

          <button
            type="submit"
            data-testid="admin-save-logo-btn"
            className="px-6 py-3 rounded-xl bg-[#9A3412] text-white text-xs font-bold hover:bg-[#7C2D12] cursor-pointer"
          >
            లోగో &amp; బ్యానర్ మార్పులు సేవ్ చేయండి (Save Logo &amp; Banner)
          </button>
        </form>
      )}


      {/* TAB 2: ADD DISTRICTS & MANDALS IN ANY STATE */}
      {activeTab === 'locations' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <form
            onSubmit={handleAddLocationSubmit}
            className="lg:col-span-5 rounded-2xl bg-white border border-stone-200 p-6 space-y-5 shadow-xs"
          >
            <div className="border-b border-stone-200 pb-4">
              <div className="text-xs uppercase tracking-widest text-[#9A3412] font-bold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>ALL-INDIA STATE · DISTRICT · MANDAL MANAGER</span>
              </div>
              <h2 className="text-lg font-bold text-stone-900 mt-1">
                ప్రతి రాష్ట్రంలో జిల్లాలు &amp; మండలాల పేర్లు ఆడ్ చేయండి
              </h2>
              <p className="text-xs text-stone-600 mt-1">
                ఇక్కడ మీరు ఏ రాష్ట్రంలోనైనా కొత్త జిల్లాను లేదా కొత్త మండలాల పేర్లను జతచేయవచ్చు. జతచేసిన వెంటనే అవి రిపోర్టర్ రిజిస్ట్రేషన్ మరియు న్యూస్ సెర్చింగ్‌లో కనిపిస్తాయి.
              </p>
            </div>

            {locFeedbackMsg && (
              <div
                role="status"
                className={`p-3.5 rounded-xl border text-xs font-semibold ${
                  locFeedbackMsg.type === 'success'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}
              >
                {locFeedbackMsg.text}
              </div>
            )}

            {/* 1. Select State */}
            <div>
              <label htmlFor="admin-loc-state" className="block text-xs font-bold text-stone-800 mb-1.5">
                1. రాష్ట్రం ఎంచుకోండి (Select State) *
              </label>
              <select
                id="admin-loc-state"
                value={locState}
                onChange={(e) => {
                  const nextState = e.target.value;
                  setLocState(nextState);
                  const dists = getDistrictsByState(nextState, stateLocations);
                  setLocExistingDistrict(dists[0]?.district || '');
                }}
                className="w-full rounded-lg border border-stone-300 bg-[#FBF9F5] px-3.5 py-2.5 text-sm font-semibold text-stone-900"
              >
                {stateLocations.map((s) => (
                  <option key={s.state} value={s.state}>
                    {s.labelTe} ({s.state})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Choose Existing District or Add New District */}
            <div className="space-y-3 p-4 rounded-xl bg-[#FBF9F5] border border-stone-200">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-stone-800">
                  2. జిల్లా ఎంపిక (Select Existing or Add New District) *
                </span>
                <div className="inline-flex rounded-lg border border-stone-300 bg-white p-0.5 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setLocDistrictMode('existing')}
                    className={`px-2.5 py-1 rounded-md cursor-pointer ${
                      locDistrictMode === 'existing'
                        ? 'bg-[#0B1D3A] text-amber-300'
                        : 'text-stone-700'
                    }`}
                  >
                    ఉన్న జిల్లాలో మండలం
                  </button>
                  <button
                    type="button"
                    data-testid="admin-new-district-mode-btn"
                    onClick={() => setLocDistrictMode('new')}
                    className={`px-2.5 py-1 rounded-md cursor-pointer ${
                      locDistrictMode === 'new'
                        ? 'bg-[#9A3412] text-white'
                        : 'text-stone-700'
                    }`}
                  >
                    + కొత్త జిల్లా ఆడ్ చేయండి
                  </button>
                </div>
              </div>

              {locDistrictMode === 'existing' ? (
                <div>
                  <label htmlFor="admin-loc-existing-dist" className="block text-xs font-semibold text-stone-700 mb-1">
                    జిల్లా ఎంచుకోండి (District in {locState})
                  </label>
                  <select
                    id="admin-loc-existing-dist"
                    value={locExistingDistrict}
                    onChange={(e) => setLocExistingDistrict(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
                  >
                    {selectedStateDistricts.map((d) => (
                      <option key={d.district} value={d.district}>
                        {d.labelTe ? `${d.labelTe} (${d.district})` : d.district}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="admin-loc-new-dist" className="block text-xs font-semibold text-stone-700 mb-1">
                      కొత్త జిల్లా పేరు (New District Name) *
                    </label>
                    <input
                      id="admin-loc-new-dist"
                      type="text"
                      value={locNewDistrictName}
                      onChange={(e) => setLocNewDistrictName(e.target.value)}
                      placeholder="ఉదా: Palnadu / Bapatla"
                      className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
                    />
                  </div>
                  <div>
                    <label htmlFor="admin-loc-new-dist-te" className="block text-xs font-semibold text-stone-700 mb-1">
                      జిల్లా తెలుగు పేరు (Optional)
                    </label>
                    <input
                      id="admin-loc-new-dist-te"
                      type="text"
                      value={locNewDistrictLabelTe}
                      onChange={(e) => setLocNewDistrictLabelTe(e.target.value)}
                      placeholder="ఉదా: పల్నాడు"
                      className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 3. Enter Mandal Names */}
            <div>
              <label htmlFor="admin-loc-mandals" className="block text-xs font-bold text-stone-800 mb-1.5">
                3. కొత్త మండలాల పేర్లు (Mandal Names — కామాతో వేరు చేసి ఎన్ని మండలాలైనా ఆడ్ చేయవచ్చు) *
              </label>
              <input
                id="admin-loc-mandals"
                type="text"
                value={locMandalsInput}
                onChange={(e) => setLocMandalsInput(e.target.value)}
                placeholder="ఉదా: Tadikonda, Pedakurapadu, Amaravati"
                className="w-full rounded-lg border border-stone-300 bg-[#FBF9F5] px-3.5 py-2.5 text-sm text-stone-900"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                ఒకటి కంటే ఎక్కువ మండలాలను ఒకేసారి చేర్చడానికి కామా (,) ఉపయోగించండి.
              </p>
            </div>

            <button
              type="submit"
              data-testid="admin-add-location-submit"
              className="w-full py-3.5 rounded-xl bg-[#9A3412] text-white text-xs font-bold hover:bg-[#7C2D12] inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>జిల్లా &amp; మండలాల పేర్లు ఆడ్ చేయండి (Save to State Directory)</span>
            </button>
          </form>

          {/* Right 7 Columns: Live Districts & Mandals Directory for Selected State */}
          <div className="lg:col-span-7 rounded-2xl bg-white border border-stone-200 p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  {locState} — జిల్లాలు &amp; మండలాల జాబితా ({selectedStateDistricts.length} Districts)
                </h3>
                <p className="text-xs text-stone-500">
                  ఈ క్రింది జిల్లాలు మరియు మండలాలు రిపోర్టర్ రిజిస్ట్రేషన్ మరియు న్యూస్ సెర్చింగ్‌లో అందుబాటులో ఉన్నాయి.
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {selectedStateDistricts.map((dist) => (
                <div
                  key={dist.district}
                  className="p-4 rounded-xl bg-[#FBF9F5] border border-stone-200 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-[#0B1D3A]">
                      {dist.labelTe ? `${dist.labelTe} (${dist.district})` : dist.district} జిల్లా
                    </div>
                    <span className="text-xs font-mono font-bold text-[#9A3412]">
                      {dist.mandals.length} మండలాలు
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {dist.mandals.map((m) => (
                      <span
                        key={m}
                        className="px-2.5 py-1 rounded-lg bg-white border border-stone-300 text-xs font-semibold text-stone-800"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRIVATE ADS APPROVALS */}
      {activeTab === 'ads' && (
        <div className="rounded-2xl bg-white border border-stone-200 p-6 space-y-5">
          <div className="border-b border-stone-200 pb-4">
            <h2 className="text-lg font-bold text-stone-900">
              ప్రైవేట్ యాడ్స్ ఆమోదం (Mandal / District / State / Category Private Ads)
            </h2>
            <p className="text-xs text-stone-600">
              అడ్మిన్ ఆమోదించిన ప్రైవేట్ ప్రకటనలు మాత్రమే సంబంధిత మండల, జిల్లా మరియు రాష్ట్ర పేజీల్లో కనిపిస్తాయి.
            </p>
          </div>

          <div className="space-y-4">
            {ads.map((ad) => (
              <div
                key={ad.id}
                data-testid={`admin-private-ad-card-${ad.id}`}
                className="p-4 rounded-xl bg-[#FBF9F5] border border-stone-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0 flex-1">
                  <div className="w-full sm:w-56 h-32 rounded-xl overflow-hidden bg-stone-900 border border-stone-300 shrink-0">
                    <img
                      src={getPrivateAdImageUrl(ad)}
                      alt={ad.title}
                      data-testid={`admin-private-ad-img-${ad.id}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1.5 text-xs min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold uppercase text-[#9A3412]">
                        [{ad.targetLevel.toUpperCase()} AD] · {ad.mandal} ({ad.district}, {ad.state})
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>Category: {ad.category}</span>
                      <span aria-hidden="true">·</span>
                      <strong
                        className={
                          ad.status === 'approved'
                            ? 'text-emerald-800'
                            : ad.status === 'pending'
                              ? 'text-amber-700'
                              : 'text-red-700'
                        }
                      >
                        {ad.status.toUpperCase()}
                      </strong>
                    </div>
                    <div className="text-base font-bold text-stone-900">{ad.title}</div>
                    <p className="text-stone-600 leading-relaxed">{ad.bannerText}</p>
                    <div className="text-stone-500">
                      ప్రకటనకర్త: <strong>{ad.sponsorName}</strong> · URL: {ad.ctaUrl}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {ad.status !== 'approved' && (
                    <button
                      type="button"
                      onClick={() => onUpdateAdStatus(ad.id, 'approved')}
                      className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 cursor-pointer"
                    >
                      యాడ్ ఆమోదించు (Approve Ad)
                    </button>
                  )}
                  {ad.status !== 'rejected' && (
                    <button
                      type="button"
                      onClick={() => onUpdateAdStatus(ad.id, 'rejected')}
                      className="px-3.5 py-2 rounded-lg border border-red-300 bg-white text-red-700 text-xs font-bold hover:bg-red-50 cursor-pointer"
                    >
                      తిరస్కరించు (Reject)
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: GOOGLE ADSENSE CONFIGURATION */}
      {activeTab === 'adsense' && (
        <form
          onSubmit={handleSaveAdsense}
          className="rounded-2xl bg-white border border-stone-200 p-6 md:p-8 space-y-5 max-w-3xl"
        >
          <div className="border-b border-stone-200 pb-4">
            <h2 className="text-lg font-bold text-stone-900">
              Google AdSense లింక్ &amp; యాడ్ స్లాట్ కాన్ఫిగరేషన్ (Admin Only)
            </h2>
            <p className="text-xs text-stone-600 mt-1">
              ఈ Google AdSense Sponsored Unit హోమ్ పేజీలో పబ్లిక్‌కు కనిపించదు — కేవలం అడ్మిన్ డ్యాష్‌బోర్డ్‌లో మాత్రమే కనిపిస్తుంది మరియు నిర్వహించబడుతుంది.
            </p>
          </div>

          {adsenseSavedMsg && (
            <div
              role="status"
              className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs font-semibold flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{adsenseSavedMsg}</span>
            </div>
          )}

          <div>
            <label htmlFor="adsense-script-url" className="block text-xs font-bold text-stone-800 mb-1">
              Google AdSense లింక్ (AdSense Script / Publisher Link) *
            </label>
            <input
              id="adsense-script-url"
              type="url"
              value={adsenseUrl}
              onChange={(e) => setAdsenseUrl(e.target.value)}
              placeholder="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-..."
              className="w-full rounded-lg border border-stone-300 bg-[#FBF9F5] px-3.5 py-2.5 text-sm font-mono text-stone-900"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="adsense-client-id" className="block text-xs font-bold text-stone-800 mb-1">
                AdSense Publisher Client ID (ca-pub-XXXX)
              </label>
              <input
                id="adsense-client-id"
                type="text"
                value={adsenseClient}
                onChange={(e) => setAdsenseClient(e.target.value)}
                placeholder="ca-pub-9823419201823491"
                className="w-full rounded-lg border border-stone-300 bg-[#FBF9F5] px-3.5 py-2.5 text-sm font-mono text-stone-900"
              />
            </div>

            <div>
              <label htmlFor="adsense-slot-id" className="block text-xs font-bold text-stone-800 mb-1">
                AdSense Ad Unit Slot ID
              </label>
              <input
                id="adsense-slot-id"
                type="text"
                value={adsenseSlot}
                onChange={(e) => setAdsenseSlot(e.target.value)}
                placeholder="4910293841"
                className="w-full rounded-lg border border-stone-300 bg-[#FBF9F5] px-3.5 py-2.5 text-sm font-mono text-stone-900"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#FBF9F5] border border-stone-200">
            <input
              id="adsense-enabled-toggle"
              type="checkbox"
              checked={adsenseActive}
              onChange={(e) => setAdsenseActive(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="adsense-enabled-toggle" className="text-xs font-bold text-stone-900">
              వెబ్‌సైట్‌లో Google AdSense బ్యానర్ స్లాట్‌ను యాక్టివేట్ చేయండి (Enable Google AdSense Display)
            </label>
          </div>

          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-[#0B1D3A] text-amber-300 text-xs font-bold hover:bg-[#142F5A] cursor-pointer"
          >
            Google AdSense సెట్టింగ్స్ సేవ్ చేయండి (Save AdSense Link)
          </button>
        </form>
      )}

      {/* TAB 4: CHIEF EDITOR NEWS UPLOAD & MANAGEMENT */}
      {activeTab === 'news' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <form
            onSubmit={handleAdminPublishNews}
            className="lg:col-span-6 rounded-2xl bg-white border border-stone-200 p-6 space-y-4"
          >
            <h2 className="text-base font-bold text-stone-900 border-b border-stone-200 pb-3">
              చీఫ్ ఎడిటర్ డైరెక్ట్ న్యూస్ అప్‌లోడ్ (National / State / District / Mandal)
            </h2>

            {adminNewsSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold">
                {adminNewsSuccess}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="adm-news-level" className="block text-xs font-bold text-stone-800 mb-1">
                  న్యూస్ స్థాయి (Level)
                </label>
                <select
                  id="adm-news-level"
                  value={adminNewsLevel}
                  onChange={(e) => setAdminNewsLevel(e.target.value as NewsLevel)}
                  className="w-full rounded-lg border border-stone-300 bg-[#FBF9F5] px-3 py-2 text-sm text-stone-900"
                >
                  <option value="national">National News</option>
                  <option value="state">State News</option>
                  <option value="district">District News</option>
                  <option value="mandal">Mandal News</option>
                </select>
              </div>
              <div>
                <label htmlFor="adm-news-cat" className="block text-xs font-bold text-stone-800 mb-1">
                  విభాగం (Category)
                </label>
                <select
                  id="adm-news-cat"
                  value={adminNewsCategory}
                  onChange={(e) => setAdminNewsCategory(e.target.value as NewsCategory)}
                  className="w-full rounded-lg border border-stone-300 bg-[#FBF9F5] px-3 py-2 text-sm text-stone-900"
                >
                  <option value="justice">ఒక దేశం ఒకే చట్టం (Justice)</option>
                  <option value="politics">రాజకీయం (Politics)</option>
                  <option value="agriculture">వ్యవసాయం (Agriculture)</option>
                  <option value="local">మండల అభివృద్ధి (Mandal Civic)</option>
                  <option value="education">విద్య &amp; ఉపాధి (Education)</option>
                  <option value="business">వాణిజ్యం (Business)</option>
                  <option value="crime">క్రైమ్ &amp; నిఘా (Vigilance)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label htmlFor="adm-state" className="block text-[11px] font-semibold text-stone-700 mb-1">
                  State
                </label>
                <select
                  id="adm-state"
                  value={adminNewsState}
                  onChange={(e) => {
                    const s = e.target.value;
                    setAdminNewsState(s);
                    const d = getDistrictsByState(s, stateLocations)[0];
                    setAdminNewsDistrict(d?.district || '');
                    setAdminNewsMandal(d?.mandals[0] || '');
                  }}
                  className="w-full rounded-lg border border-stone-300 bg-[#FBF9F5] px-2 py-1.5 text-xs"
                >
                  {stateLocations.map((s) => (
                    <option key={s.state} value={s.state}>
                      {s.state}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="adm-dist" className="block text-[11px] font-semibold text-stone-700 mb-1">
                  District
                </label>
                <select
                  id="adm-dist"
                  value={adminNewsDistrict}
                  onChange={(e) => {
                    const d = e.target.value;
                    setAdminNewsDistrict(d);
                    setAdminNewsMandal(
                      getMandalsByDistrict(adminNewsState, d, stateLocations)[0] || ''
                    );
                  }}
                  className="w-full rounded-lg border border-stone-300 bg-[#FBF9F5] px-2 py-1.5 text-xs"
                >
                  {districts.map((d) => (
                    <option key={d.district} value={d.district}>
                      {d.district}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="adm-mandal" className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Mandal
                </label>
                <select
                  id="adm-mandal"
                  value={adminNewsMandal}
                  onChange={(e) => setAdminNewsMandal(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-[#FBF9F5] px-2 py-1.5 text-xs font-bold"
                >
                  {mandals.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="adm-title" className="block text-xs font-bold text-stone-800 mb-1">
                వార్త శీర్షిక (Headline) *
              </label>
              <input
                id="adm-title"
                type="text"
                value={adminNewsTitleTe}
                onChange={(e) => setAdminNewsTitleTe(e.target.value)}
                placeholder="వార్త శీర్షిక..."
                className="w-full rounded-lg border border-stone-300 bg-[#FBF9F5] px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label htmlFor="adm-yt" className="block text-xs font-bold text-stone-800 mb-1">
                యూట్యూబ్ వీడియో లింక్ (YouTube Link)
              </label>
              <input
                id="adm-yt"
                type="url"
                value={adminNewsYoutube}
                onChange={(e) => setAdminNewsYoutube(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full rounded-lg border border-stone-300 bg-[#FBF9F5] px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label htmlFor="adm-content" className="block text-xs font-bold text-stone-800 mb-1">
                పూర్తి వార్త వివరాలు (Full Content) *
              </label>
              <textarea
                id="adm-content"
                rows={4}
                value={adminNewsContentTe}
                onChange={(e) => setAdminNewsContentTe(e.target.value)}
                className="w-full rounded-lg border border-stone-300 bg-[#FBF9F5] p-3 text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#9A3412] text-white text-xs font-bold hover:bg-[#7C2D12] cursor-pointer"
            >
              వార్తను పబ్లిష్ చేయండి (Publish Official News)
            </button>
          </form>

          <div className="lg:col-span-6 rounded-2xl bg-white border border-stone-200 p-6 space-y-4">
            <h2 className="text-base font-bold text-stone-900 border-b border-stone-200 pb-3">
              అన్ని వార్తలు &amp; Views గణాంకాలు ({articles.length})
            </h2>
            <div className="space-y-3 max-h-[520px] overflow-y-auto">
              {articles.map((art) => (
                <div
                  key={art.id}
                  className="p-3.5 rounded-xl bg-[#FBF9F5] border border-stone-200 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#9A3412]">
                      {art.level.toUpperCase()} · {art.mandal} ({art.district})
                    </div>
                    <div className="text-sm font-bold text-stone-900 truncate">{art.titleTe}</div>
                    <div className="text-xs text-stone-500 flex items-center gap-3 mt-0.5 font-mono tabular-nums">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {art.views.toLocaleString('en-IN')} views
                      </span>
                      <span>by {art.reporterName}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteNews(art.id)}
                    aria-label={`Delete ${art.titleTe}`}
                    className="p-2 rounded-lg text-stone-500 hover:text-red-700 hover:bg-red-50 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: USER FEEDBACK & ZERO-TRUST DATABASE SECURITY */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6 rounded-2xl bg-white border border-stone-200 p-6 space-y-4">
            <h2 className="text-base font-bold text-stone-900 border-b border-stone-200 pb-3">
              యూజర్ ఫీడ్‌బ్యాక్ నివేదికలు ({feedbackList.length})
            </h2>
            <div className="space-y-3">
              {feedbackList.map((fb) => (
                <div
                  key={fb.id}
                  className="p-4 rounded-xl bg-[#FBF9F5] border border-stone-200 space-y-1"
                >
                  <div className="flex items-center justify-between text-xs">
                    <strong className="text-stone-900">{fb.readerName}</strong>
                    <span className="font-mono font-bold text-amber-700">
                      Rating: {fb.rating}/5
                    </span>
                  </div>
                  <p className="text-xs text-stone-700 leading-relaxed">{fb.message}</p>
                  <div className="text-[11px] text-stone-500">
                    Mandal: {fb.mandal} · {new Date(fb.createdAt).toLocaleDateString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 rounded-2xl bg-white border border-stone-200 p-6 space-y-4">
            <h2 className="text-base font-bold text-stone-900 border-b border-stone-200 pb-3">
              డేటాబేస్ భద్రతా కవచం (Zero-Trust Firestore Security Audit)
            </h2>
            <ul className="space-y-3 text-xs text-stone-700 leading-relaxed">
              <li className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <strong>1. PII Aadhaar &amp; Mobile Isolation:</strong> రిపోర్టర్ల ఆధార్ మరియు మొబైల్ నంబర్లు పబ్లిక్ డైరెక్టరీ నుండి వేరు చేయబడి <code>/reporterApplications</code> కలెక్షన్‌లో కేవలం అడ్మిన్ మాత్రమే చదవగలిగేలా రక్షించబడ్డాయి.
              </li>
              <li className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <strong>2. Mandal Lock Relational Gate:</strong> ఏ రిపోర్టర్ అయినా తమకు కేటాయించిన మండలం కాకుండా వేరే మండలంలో న్యూస్ అప్‌లోడ్ చేయడానికి ప్రయత్నిస్తే డేటాబేస్ రూల్స్ తిరస్కరిస్తాయి.
              </li>
              <li className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <strong>3. Atomic View Counter Protection:</strong> వార్తల వ్యూస్ (Views) ఒకేసారి +1 మాత్రమే పెరిగేలా <code>affectedKeys().hasOnly([&apos;views&apos;, &apos;updatedAt&apos;])</code> రూల్ అమలులో ఉంది.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
