// The Air Force Library on /AFROTC: every publication the page knows about, hosted or not.
//
// `file` is a path under <Drive>:\My Drive\SupplementalCourseDocs\ (the Drive letter is resolved at run time).
// `npm run afrotc:pubs` copies each file it finds to public/afrotc/pubs/<slug>.pdf, extracts its text into
// public/afrotc/pubs/<slug>.json, and records what it hosted in pubStatus.json. A publication whose file is not
// on Drive yet still shows in the library, with its official link and the exact filename to save it as.
//
// e-Publishing (and every other .mil host) answers 403 to scripts, so the official copies have to be saved from a
// browser by hand. Do not try to get around that block.
//
// `official: false` marks material that is not an Air Force publication (another detachment's manual): it is
// useful, it is searchable, and it is labelled so it is never mistaken for the regulation.

export const PUB_FOLDER = 'AFROTC/Publications';

export const PUB_CATEGORIES = [
  { id: 'drill', title: 'Drill, ceremonies and protocol' },
  { id: 'dress', title: 'Dress and appearance' },
  { id: 'rotc', title: 'AFROTC and cadet life' },
  { id: 'standards', title: 'Standards, conduct and fitness' },
  { id: 'airman', title: 'Airman knowledge, writing and doctrine' },
  { id: 'det', title: 'Detachment documents' },
  { id: 'other', title: 'Other detachments’ manuals (not official Air Force publications)' },
  { id: 'superseded', title: 'Superseded editions (kept only until the current one is saved)' },
];

const EPUB = 'https://www.e-publishing.af.mil/';

export const PUBS = [
  {
    slug: 'dafpam34-1203', id: 'DAFPAM 34-1203', title: 'Drill and Ceremonies', dated: '13 Sep 2022', category: 'drill',
    use: 'Every drill command and movement, flight and squadron drill, reveille, retreat, flag details, reviews and parades. Supersedes AFMAN 36-2203.',
    file: `${PUB_FOLDER}/DAFPAM34-1203_Drill_and_Ceremonies.pdf`,
    href: 'https://static.e-publishing.af.mil/production/1/af_a1/publication/dafpam34-1203/dafpam34-1203.pdf',
  },
  {
    slug: 'dafi90-1201', id: 'DAFI 90-1201', title: 'Protocol', dated: '8 Oct 2024', category: 'drill',
    use: 'Protocol and customs for the Air Force and Space Force, flag rules (including the POW/MIA flag), precedence and event protocol. Replaced AFI 34-1201.',
    file: `${PUB_FOLDER}/DAFI90-1201_Protocol.pdf`,
    href: 'https://static.e-publishing.af.mil/production/1/saf_ds/publication/dafi90-1201/dafi90-1201.pdf',
  },
  {
    slug: 'afpam34-1202', id: 'AFPAM 34-1202', title: 'Guide to Protocol', dated: '8 May 2019 (may have been replaced: check e-Publishing)', category: 'drill',
    use: 'Customs and courtesies, the order of precedence, flag etiquette, ceremonies, seating and invitations.',
    file: `${PUB_FOLDER}/AFPAM34-1202_Guide_to_Protocol.pdf`,
    href: EPUB,
  },
  {
    slug: 'dafi36-2903', id: 'DAFI 36-2903', title: 'Dress and Personal Appearance of Department of the Air Force Personnel', dated: '29 Feb 2024, with DAFGM 2025-02 (11 Jul 2025)', category: 'dress',
    use: 'Uniform wear, grooming, insignia placement, name tapes, badges and ribbons. This copy includes the 2025 guidance memorandum.',
    file: 'AFROTC/DAFI36-2903_Dress_and_Appearance_with_DAFGM2025-02_11Jul2025.pdf',
    href: 'https://static.e-publishing.af.mil/production/1/af_a1/publication/dafi36-2903/dafi36-2903.pdf',
  },
  {
    slug: 'dafi36-2903-afrotcsup', id: 'DAFI 36-2903 AFROTC Supplement', title: 'Dress and Personal Appearance: Air Force ROTC Supplement', dated: '18 Nov 2021', category: 'dress',
    use: 'The AFROTC rules layered on DAFI 36-2903: which uniform items cadets wear, cadet insignia and badges, and cadet appearance standards. Read it together with DAFI 36-2903.',
    file: `${PUB_FOLDER}/DAFI36-2903_AFROTCSup.pdf`,
    href: 'https://afrotc.d.umn.edu/sites/afrotc.d.umn.edu/files/2023-03/DAFI%2036-2903_AFROTCSup.pdf',
    copy: 'University of Minnesota Duluth copy, the link posted in the Det 855 Teams on 13 Oct',
  },
  {
    slug: 'afrotci36-2011v3', id: 'AFROTCI 36-2011 Vol 3', title: 'Cadet Operations', dated: '13 Jan 2025', category: 'rotc',
    use: 'Cadet grades and positions, conduct and discipline, the Cadet Wing, and the rules cadets are held to.',
    file: `${PUB_FOLDER}/AFROTCI36-2011V3_Cadet_Operations_13Jan2025.pdf`,
    href: 'https://manhattan.edu/admissions/rotc-dept/AFROTCI-36-2011-Vol-3---Cadet-Operations---21%20June%202023.pdf',
    copy: 'Manhattan University copy (the file is the 13 Jan 2025 edition despite its address)',
    newer: 'The Det 855 handbook (page 41) lists a 24 Jun 2026 edition. This 13 Jan 2025 copy is the newest one found online; ask cadre for the current file.',
  },
  {
    slug: 'afrotci36-2011v1', id: 'AFROTCI 36-2011 Vol 1', title: 'Leadership Laboratory Curriculum', dated: '3 Sep 2024', category: 'rotc',
    use: 'What each Leadership Laboratory teaches: every training objective and the sample of behavior a cadet must show.',
    file: `${PUB_FOLDER}/AFROTCI36-2011V1_LLAB_Curriculum_03Sep2024.pdf`,
    href: 'https://usm.edu/aerospace-studies/afrotci36-2011_vol1_llab_curriculum_2024_09_03.pdf',
    copy: 'University of Southern Mississippi copy',
    newer: 'The Det 855 handbook (page 41) lists an 18 Aug 2026 edition. This 3 Sep 2024 copy is the newest one found online; ask cadre for the current file.',
  },
  {
    slug: 'afi1-1', id: 'AFI 1-1', title: 'Air Force Culture, Air Force Standards', dated: '18 Aug 2023', category: 'standards',
    use: 'The standards of conduct, performance and discipline expected of every Airman. Check e-Publishing for a newer edition.',
    file: `${PUB_FOLDER}/AFI1-1_Air_Force_Standards.pdf`,
    href: 'https://afrotc.utah.edu/_resources/documents/afi1-1.pdf',
    copy: 'University of Utah AFROTC copy',
  },
  {
    slug: 'dafi36-2909', id: 'DAFI 36-2909', title: 'Department of the Air Force Professional and Unprofessional Relationships', category: 'standards',
    use: 'Professional and unprofessional relationships and fraternization.',
    file: `${PUB_FOLDER}/DAFI36-2909_Professional_Relationships.pdf`,
    href: 'https://static.e-publishing.af.mil/production/1/af_ja/publication/afi36-2909/afi36-2909.pdf',
  },
  {
    slug: 'dafman36-2905', id: 'DAFMAN 36-2905', title: 'Department of the Air Force Physical Fitness Program', category: 'standards',
    use: 'The fitness assessment, its components, scoring and standards.',
    file: `${PUB_FOLDER}/DAFMAN36-2905_Physical_Fitness_Program.pdf`,
    href: 'https://www.afpc.af.mil/Portals/70/documents/FITNESS/dafman36-2905.pdf',
  },
  {
    slug: 'afh1', id: 'AFH 1', title: 'Airman', category: 'airman',
    use: 'The Airman handbook: heritage, organization, customs and courtesies, ceremonies, leadership and professional development.',
    file: `${PUB_FOLDER}/AFH1_Airman.pdf`,
    href: EPUB,
  },
  {
    slug: 'afh33-337', id: 'AFH 33-337', title: 'The Tongue and Quill', category: 'airman',
    use: 'Air Force writing and speaking: memorandums, bullet statements, briefings and the official formats.',
    file: 'AEROS 110 (BYU Learning Suite)/_source/files/Tongue & Quill.pdf',
    href: EPUB,
  },
  {
    slug: 'afttp3-4', id: 'AFTTP 3-4 QRC', title: 'Airman’s Manual: Quick Reference Cards', dated: '11 Jan 2019, Interim Change 1 of 14 May 2019', category: 'airman',
    use: 'The quick reference cards of the Airman’s Manual: self-aid and buddy care (TCCC), MEDEVAC 9-line, weapon safety, unexploded ordnance and improvised explosive devices, chemical defense. The QRC Study Packet tab holds the pages you are tested on.',
    file: 'airmansmanual.pdf',
    href: 'https://www.doctrine.af.mil/Tactical-Level-Doctrine',
  },
  {
    slug: 'afh36-2647', id: 'AFH 36-2647', title: 'Institutional Competency Development and Management', category: 'airman',
    use: 'The Airman leadership qualities and institutional competencies Airmen are developed and rated on.',
    file: `${PUB_FOLDER}/AFH36-2647_Institutional_Competencies.pdf`,
    href: EPUB,
  },
  {
    slug: 'afdp1', id: 'AFDP 1', title: 'The Air Force (capstone doctrine)', category: 'airman',
    use: 'Why the Air Force fights, who it is, what it does and how. Read this before quoting core functions.',
    file: `${PUB_FOLDER}/AFDP1_The_Air_Force.pdf`,
    href: 'https://www.doctrine.af.mil/Portals/61/documents/SmartBook/AFDoctrineSmartBook.pdf',
  },
  {
    slug: 'det855-ori', id: 'Det 855 ORI', title: 'Open Ranks Inspection Procedures', dated: '10 Jul 2025', category: 'det', official: false,
    use: 'The detachment’s own open ranks inspection procedure for the flight commander, citing DAFPAM 34-1203.',
    file: null, local: '/afrotc/ORI_Procedures.pdf', doc: 'ori',
  },
  {
    slug: 'afman36-2203-2013', id: 'AFMAN 36-2203 (2013)', title: 'Drill and Ceremonies, the 20 November 2013 edition', dated: '20 Nov 2013 (superseded twice)', category: 'superseded', superseded: true,
    use: 'The predecessor of DAFPAM 34-1203. Superseded by AFMAN 36-2203 (2018) and then by DAFPAM 34-1203 (2022), which changed references and added the Space Force but did not rewrite the movements. Hosted only so the drill procedures are searchable until DAFPAM 34-1203 is saved here; check anything you rely on against the current pamphlet.',
    file: `${PUB_FOLDER}/AFMAN36-2203_Drill_and_Ceremonies_20Nov2013_SUPERSEDED.pdf`,
    href: 'https://www.gocivilairpatrol.com/media/cms/afman3622031_7A853B1DF6091.pdf',
    copy: 'Civil Air Patrol copy',
  },
  {
    slug: 'det025-manual', id: 'Det 025 Training Manual', title: 'Arizona State University AFROTC Det 025 Training Manual, version 1.2', category: 'other', official: false,
    use: 'Another detachment’s cadet manual: reveille and retreat by position, open ranks inspection, flight commander duties, drill evaluation. Useful for detail; Det 855 may do things differently.',
    file: `${PUB_FOLDER}/Det025_ASU_Training_Manual_v1.2.pdf`,
    href: 'https://afrotc.asu.edu/sites/default/files/det_025_training_manual_1.2.pdf',
    copy: 'Arizona State University AFROTC',
  },
];

export const pubBySlug = (slug) => PUBS.find((p) => p.slug === slug);

/** The file name the library tells Trey to save a missing publication as (the last part of `file`). */
export const saveAsName = (pub) => (pub.file ? pub.file.split('/').pop() : null);
