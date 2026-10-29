import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateAdminCredentials,
  extractYouTubeId,
  validateReporterRegistration,
  canReporterPublishToMandal,
  filterNewsArticles,
  filterTargetedAds,
  incrementArticleViews,
  maskAadhaar,
  type NewsArticleItem,
  type PrivateAdItem,
} from './newsLogic.ts';

test('Admin credentials strictly match Admin and Bchakriraju1992@', () => {
  assert.equal(validateAdminCredentials('Admin', 'Bchakriraju1992@'), true);
  assert.equal(validateAdminCredentials('admin', 'Bchakriraju1992@'), false);
  assert.equal(validateAdminCredentials('Admin', 'wrongpass'), false);
});

test('extractYouTubeId extracts valid 11-character IDs from standard, short, and embed URLs and verifies official channel URL', async () => {
  const { NETI_BHARATAM_YOUTUBE_CHANNEL_URL } = await import('./newsLogic.ts');
  assert.equal(
    NETI_BHARATAM_YOUTUBE_CHANNEL_URL,
    'https://www.youtube.com/channel/UCyfLbWdu0fNqEJdH7Ldi4Fg'
  );
  assert.equal(
    extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
    'dQw4w9WgXcQ'
  );
  assert.equal(extractYouTubeId('https://youtu.be/M7lc1UVf-VE'), 'M7lc1UVf-VE');
  assert.equal(extractYouTubeId('https://www.youtube.com/embed/aqz-KE-bpKQ'), 'aqz-KE-bpKQ');
  assert.equal(extractYouTubeId(''), null);
});

test('validateReporterRegistration enforces Photo, Mandal, Mobile, Username, Password, and 12-digit Aadhaar', () => {
  const validInput = {
    name: 'Chakri Raju',
    username: 'chakri_guntur',
    password: 'SecretPassword123',
    mobile: '9876543210',
    aadhaarNumber: '2345 6789 0123',
    aadhaarDocName: 'aadhaar_card_scan.pdf',
    state: 'Andhra Pradesh',
    district: 'Guntur',
    mandal: 'Mangalagiri',
    photoDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==',
  };

  const result = validateReporterRegistration(validInput, []);
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);

  const invalidResult = validateReporterRegistration(
    {
      ...validInput,
      aadhaarNumber: '12345',
      mobile: '123',
      photoDataUrl: '',
    },
    []
  );
  assert.equal(invalidResult.valid, false);
  assert.equal(invalidResult.errors.length, 3);
});

test('canReporterPublishToMandal requires Admin approval and locks reporter to their registered Mandal', () => {
  const pendingReporter = {
    status: 'pending' as const,
    state: 'Andhra Pradesh',
    district: 'Guntur',
    mandal: 'Mangalagiri',
  };
  assert.equal(
    canReporterPublishToMandal(pendingReporter, 'Andhra Pradesh', 'Guntur', 'Mangalagiri').allowed,
    false
  );

  const approvedReporter = {
    status: 'approved' as const,
    state: 'Andhra Pradesh',
    district: 'Guntur',
    mandal: 'Mangalagiri',
  };
  assert.equal(
    canReporterPublishToMandal(approvedReporter, 'Andhra Pradesh', 'Guntur', 'Mangalagiri').allowed,
    true
  );
  assert.equal(
    canReporterPublishToMandal(approvedReporter, 'Andhra Pradesh', 'Guntur', 'Tenali').allowed,
    false
  );
});

test('filterNewsArticles filters by Mandal, State, Level, and increments views accurately', () => {
  const sampleArticles: NewsArticleItem[] = [
    {
      id: 'n1',
      titleTe: 'మంగళగిరి మండల వార్త',
      titleHi: 'मंगलगिरि मंडल समाचार',
      titleEn: 'Mangalagiri Mandal Update',
      summaryTe: 'సారాంశం 1',
      summaryHi: 'सारांश 1',
      summaryEn: 'Summary 1',
      contentTe: 'పూర్తి వివరాలు ఇక్కడ ఉన్నాయి.',
      contentHi: 'पूरा विवरण यहाँ है।',
      contentEn: 'Full details are here.',
      level: 'mandal',
      state: 'Andhra Pradesh',
      district: 'Guntur',
      mandal: 'Mangalagiri',
      category: 'local',
      youtubeUrl: 'https://youtu.be/M7lc1UVf-VE',
      imageType: 'mandal',
      reporterId: 'r1',
      reporterName: 'Ramesh',
      views: 150,
      status: 'approved',
      authorUid: 'u1',
      createdAt: '2026-10-19T01:00:00.000Z',
      updatedAt: '2026-10-19T01:00:00.000Z',
    },
    {
      id: 'n2',
      titleTe: 'జాతీయ చట్టం అప్‌డేట్',
      titleHi: 'राष्ट्रीय कानून अपडेट',
      titleEn: 'National Law Update',
      summaryTe: 'సారాంశం 2',
      summaryHi: 'सारांश 2',
      summaryEn: 'Summary 2',
      contentTe: 'జాతీయ వార్త వివరాలు.',
      contentHi: 'राष्ट्रीय समाचार विवरण।',
      contentEn: 'National news details.',
      level: 'national',
      state: 'Delhi (NCT)',
      district: 'New Delhi',
      mandal: 'Chanakyapuri',
      category: 'justice',
      youtubeUrl: '',
      imageType: 'national',
      reporterId: 'admin',
      reporterName: 'Chief Desk',
      views: 920,
      status: 'approved',
      authorUid: 'admin',
      createdAt: '2026-10-19T02:00:00.000Z',
      updatedAt: '2026-10-19T02:00:00.000Z',
    },
  ];

  const mangalagiriNews = filterNewsArticles(sampleArticles, {
    state: 'Andhra Pradesh',
    district: 'Guntur',
    mandal: 'Mangalagiri',
  });
  assert.equal(mangalagiriNews.length, 1);
  assert.equal(mangalagiriNews[0].id, 'n1');

  const updated = incrementArticleViews(sampleArticles, 'n1');
  assert.equal(updated.find((a) => a.id === 'n1')?.views, 151);
});

test('filterTargetedAds returns only Admin-approved ads matching Mandal, District, State, and Category', () => {
  const ads: PrivateAdItem[] = [
    {
      id: 'ad1',
      title: 'Mangalagiri Handloom Expo',
      sponsorName: 'AP Weavers Co-op',
      targetLevel: 'mandal',
      state: 'Andhra Pradesh',
      district: 'Guntur',
      mandal: 'Mangalagiri',
      category: 'business',
      ctaUrl: 'https://example.com',
      bannerText: 'Special 30% discount on Mangalagiri cotton sarees',
      status: 'approved',
      ownerUid: 'u1',
      createdAt: '2026-10-19T01:00:00.000Z',
      updatedAt: '2026-10-19T01:00:00.000Z',
    },
    {
      id: 'ad2',
      title: 'Pending Unapproved Ad',
      sponsorName: 'Local Shop',
      targetLevel: 'mandal',
      state: 'Andhra Pradesh',
      district: 'Guntur',
      mandal: 'Mangalagiri',
      category: 'all',
      ctaUrl: 'https://example.com',
      bannerText: 'Unapproved ad should not show',
      status: 'pending',
      ownerUid: 'u2',
      createdAt: '2026-10-19T01:00:00.000Z',
      updatedAt: '2026-10-19T01:00:00.000Z',
    },
  ];

  const matched = filterTargetedAds(ads, {
    state: 'Andhra Pradesh',
    district: 'Guntur',
    mandal: 'Mangalagiri',
    category: 'business',
  });
  assert.equal(matched.length, 1);
  assert.equal(matched[0].id, 'ad1');
  assert.equal(maskAadhaar('2345 6789 0123'), 'XXXX-XXXX-0123');
});

test('addDistrictAndMandalsToLocations allows Admin to add new Districts and Mandals to any State', async () => {
  const {
    addDistrictAndMandalsToLocations,
    canReporterDownloadIdCard,
    generateReporterIdCode,
    generatePressIdCardSvgDataUrl,
    formatFullAadhaar,
  } = await import('./newsLogic.ts');

  const initialLocations = [
    {
      state: 'Andhra Pradesh',
      labelTe: 'ఆంధ్రప్రదేశ్',
      labelHi: 'आंध्र प्रदेश',
      districts: [
        {
          district: 'Guntur',
          labelTe: 'గుంటూరు',
          mandals: ['Mangalagiri', 'Tenali'],
        },
      ],
    },
  ];

  // 1. Add new mandals to existing district
  const res1 = addDistrictAndMandalsToLocations(initialLocations, {
    state: 'Andhra Pradesh',
    district: 'Guntur',
    mandalsInput: 'Tadikonda, Prathipadu',
  });
  assert.equal(res1.error, undefined);
  assert.equal(res1.addedDistrict, false);
  assert.deepEqual(res1.addedMandals, ['Tadikonda', 'Prathipadu']);
  assert.equal(res1.updatedLocations[0].districts[0].mandals.includes('Tadikonda'), true);

  // 2. Add brand new district with mandals to state
  const res2 = addDistrictAndMandalsToLocations(res1.updatedLocations, {
    state: 'Andhra Pradesh',
    district: 'Palnadu',
    districtLabelTe: 'పల్నాడు',
    mandalsInput: 'Narasaraopet, Sattenapalli',
  });
  assert.equal(res2.error, undefined);
  assert.equal(res2.addedDistrict, true);
  assert.equal(res2.updatedLocations[0].districts.length, 2);
  assert.equal(res2.updatedLocations[0].districts[1].district, 'Palnadu');
  assert.deepEqual(res2.updatedLocations[0].districts[1].mandals, [
    'Narasaraopet',
    'Sattenapalli',
  ]);

  // 3. Auto ID creation upon photo vs download only after Admin approval
  const noPhotoCheck = canReporterDownloadIdCard({
    status: 'pending',
    photoDataUrl: '',
  });
  assert.equal(noPhotoCheck.canCreatePreview, false);
  assert.equal(noPhotoCheck.canDownload, false);

  const pendingWithPhoto = canReporterDownloadIdCard({
    status: 'pending',
    photoDataUrl: 'data:image/png;base64,abc',
  });
  assert.equal(pendingWithPhoto.canCreatePreview, true);
  assert.equal(pendingWithPhoto.canDownload, false);

  const approvedWithPhoto = canReporterDownloadIdCard({
    status: 'approved',
    photoDataUrl: 'data:image/png;base64,abc',
  });
  assert.equal(approvedWithPhoto.canCreatePreview, true);
  assert.equal(approvedWithPhoto.canDownload, true);

  assert.equal(formatFullAadhaar('458923419982'), '4589 2341 9982');
  const code = generateReporterIdCode({
    id: 'rep-ap-101',
    state: 'Andhra Pradesh',
    district: 'Guntur',
    mandal: 'Mangalagiri',
  });
  assert.equal(code, 'NB-AN-GUN-MAN-101');

  const cardSvg = generatePressIdCardSvgDataUrl({
    id: 'rep-ap-101',
    name: 'వెంకట రావు',
    username: 'venkat_mangalagiri',
    mobile: '9848022338',
    state: 'Andhra Pradesh',
    district: 'Guntur',
    mandal: 'Mangalagiri',
    photoDataUrl: 'data:image/png;base64,abc',
    status: 'approved',
  });
  assert.equal(cardSvg.startsWith('data:image/svg+xml;utf8,'), true);
});

test('Private Ads provide both matter and visual banner image via getPrivateAdImageUrl and generatePrivateAdBannerSvgDataUrl', async () => {
  const { generatePrivateAdBannerSvgDataUrl, getPrivateAdImageUrl } = await import('./newsLogic.ts');
  const { INITIAL_PRIVATE_ADS } = await import('../data/seedData.ts');

  for (const ad of INITIAL_PRIVATE_ADS) {
    assert.ok(ad.bannerText.length > 5, 'Every private ad must have matter/bannerText');
    const resolvedImg = getPrivateAdImageUrl(ad);
    assert.ok(
      resolvedImg.startsWith('data:image/'),
      `Private ad ${ad.id} must have a valid visual image data URL`
    );
  }

  const customImgAd: PrivateAdItem = {
    ...INITIAL_PRIVATE_ADS[0],
    imageDataUrl: 'data:image/png;base64,customAdBanner123',
  };
  assert.equal(getPrivateAdImageUrl(customImgAd), 'data:image/png;base64,customAdBanner123');

  const fallbackImg = generatePrivateAdBannerSvgDataUrl({
    title: 'గుంటూరు షపింగ్ మాల్ ఆఫర్',
    sponsorName: 'శ్రీనివాస సిల్క్స్',
    bannerText: '50% ప్రత్యేక పండుగ తగ్గింపు',
    mandal: 'Mangalagiri',
    district: 'Guntur',
  });
  assert.equal(fallbackImg.startsWith('data:image/svg+xml;utf8,'), true);
});

test('ALL_INDIA_LOCATIONS contains all 26 Andhra Pradesh districts and all 33 Telangana districts with full Mandal directories', async () => {
  const { ALL_INDIA_LOCATIONS, getDistrictsByState, getMandalsByDistrict } = await import(
    '../data/indiaLocations.ts'
  );

  const apDistricts = getDistrictsByState('Andhra Pradesh', ALL_INDIA_LOCATIONS);
  const tgDistricts = getDistrictsByState('Telangana', ALL_INDIA_LOCATIONS);

  assert.equal(apDistricts.length, 26, 'Andhra Pradesh must have all 26 districts');
  assert.equal(tgDistricts.length, 33, 'Telangana must have all 33 districts');

  const totalApMandals = apDistricts.reduce((sum, d) => sum + d.mandals.length, 0);
  const totalTgMandals = tgDistricts.reduce((sum, d) => sum + d.mandals.length, 0);

  assert.ok(totalApMandals >= 670, `Expected >= 670 AP mandals, got ${totalApMandals}`);
  assert.ok(totalTgMandals >= 610, `Expected >= 610 TG mandals, got ${totalTgMandals}`);

  // Verify specific districts & mandals from the PDF directories
  const srikakulamMandals = getMandalsByDistrict('Andhra Pradesh', 'Srikakulam', ALL_INDIA_LOCATIONS);
  assert.ok(srikakulamMandals.includes('Ichchapuram'));
  assert.ok(srikakulamMandals.includes('Tekkali'));

  const siddipetMandals = getMandalsByDistrict('Telangana', 'Siddipet', ALL_INDIA_LOCATIONS);
  assert.ok(siddipetMandals.includes('Gajwel'));
  assert.ok(siddipetMandals.includes('Husnabad'));
});

test('updateReporterRecord allows Admin to edit reporter Username, Password, Mobile, Aadhaar, and Mandal and prevents duplicate usernames', async () => {
  const { updateReporterRecord, DEFAULT_BRAND_CONFIG, DEFAULT_BANNER_LOGO_URL } = await import(
    './newsLogic.ts'
  );
  const { INITIAL_REPORTERS } = await import('../data/seedData.ts');

  assert.equal(DEFAULT_BANNER_LOGO_URL, '/assets/aistudio/neti_bharatham.png_49db37a4.jpg');
  assert.equal(DEFAULT_BRAND_CONFIG.bannerLogoUrl, '/assets/aistudio/neti_bharatham.png_49db37a4.jpg');

  const repId = INITIAL_REPORTERS[0].id;
  const res = updateReporterRecord(INITIAL_REPORTERS, repId, {
    username: 'venkat_updated_id',
    passwordHash: 'NewPass2026@',
    mobile: '9988776655',
  });

  assert.equal(res.error, undefined);
  assert.equal(res.updatedReporter?.username, 'venkat_updated_id');
  assert.equal(res.updatedReporter?.passwordHash, 'NewPass2026@');
  assert.equal(res.updatedReporter?.mobile, '9988776655');

  // Reject collision with another reporter's username
  const duplicateRes = updateReporterRecord(res.updatedReporters, repId, {
    username: INITIAL_REPORTERS[1].username,
  });
  assert.ok(duplicateRes.error);
});

test('buildArticleWindowUrl, buildSocialShareLinks, and getUnifiedMandalBundle generate valid new-window URLs, WhatsApp/Facebook/Instagram share links, and single-page Mandal news + private ads bundle', async () => {
  const {
    buildArticleWindowUrl,
    buildSocialShareLinks,
    getUnifiedMandalBundle,
  } = await import('./newsLogic.ts');
  const { INITIAL_NEWS_ARTICLES, INITIAL_PRIVATE_ADS } = await import('../data/seedData.ts');

  const winUrl = buildArticleWindowUrl('art-mangalagiri-1', 'https://example.com/');
  assert.equal(winUrl, 'https://example.com/?article=art-mangalagiri-1');

  const relativeUrl = buildArticleWindowUrl('art-mangalagiri-1');
  assert.equal(relativeUrl, '?article=art-mangalagiri-1');

  const links = buildSocialShareLinks({
    id: 'art-mangalagiri-1',
    title: 'మంగళగిరి చేనేత పార్కు విస్తరణ',
    summary: 'చేనేత కార్మికులకు సబ్సిడీ రుణాలు',
    mandal: 'Mangalagiri',
    district: 'Guntur',
    state: 'Andhra Pradesh',
    baseUrl: 'https://example.com/',
  });

  assert.ok(links.whatsappUrl.startsWith('https://wa.me/?text='));
  assert.ok(links.facebookUrl.startsWith('https://www.facebook.com/sharer/sharer.php?u='));
  assert.equal(links.instagramUrl, 'https://www.instagram.com/');
  assert.ok(links.instagramShareCaption.includes('https://example.com/?article=art-mangalagiri-1'));

  const bundle = getUnifiedMandalBundle(INITIAL_NEWS_ARTICLES, INITIAL_PRIVATE_ADS, {
    state: 'Andhra Pradesh',
    district: 'Guntur',
    mandal: 'Mangalagiri',
  });
  assert.ok(bundle.mandalArticles.length >= 1, 'Expected Mangalagiri news articles in unified bundle');
  assert.ok(bundle.mandalAds.length >= 1, 'Expected Mangalagiri private ads in unified bundle');
});




