// ==UserScript==
// @name         Chronic Disease Assistant
// @namespace    https://github.com/vBryx/chronic-disease-assistant
// @version      0.2.1
// @description  Chronic disease screening, follow-up, care gaps, results and calculators for Raqeem
// @homepageURL  https://github.com/vBryx/chronic-disease-assistant
// @supportURL   https://github.com/vBryx/chronic-disease-assistant/issues
// @updateURL    https://raw.githubusercontent.com/vBryx/chronic-disease-assistant/main/chronic-disease-assistant.user.js
// @downloadURL  https://raw.githubusercontent.com/vBryx/chronic-disease-assistant/main/chronic-disease-assistant.user.js
// @match        https://raqeem.anat.sa/*
// @match        https://moh.raqeem.sa/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const DAY = 86400000;

  const CFG = {
    display: ['dm', 'dlp', 'crc', 'ckd'],

    renalFollowupAnyAge: true,

    dmLipidFollowupAnyAge: true,
    kidneyFollowupAllDiabetes: true,
    ckdScreenHeartDisease: true,
    ckdEstablishedOnly: true,
    dmConfirmTwoStep: true,
    pregnancyEpisodes: true,
    fitValueRead: true,
    detailsTabs: true,

    age: {
      dm: 35,
      dlpM: 35,
      dlpF: 45,

      crcMin: 45,
      crcMax: 75,

      renal: 18,
    },

    days: {
      dmLab: 365,
      lipid: 365,
      fit: 365,

      ckd: 365,

      visits: 532,
      visitOrders: 365,
      pregnancyLink: 294,
      pregnancyAnchored: 294,
      pregnancyUnanchored: 238,

      currentMedicine: 180,

      a1cAtGoal: 182,
      a1cAboveGoal: 91,
    },

    a1cGoal: 7,

    gap: {
      lookback: 730,
      chronicity: 90,
      statinGuard: 28,
      a1cRecent: 182,
      a1cOlderAge: 65,
      bpRecent: 365,
      bpLatest: 180,
      bpSevereDays: 30,
      nsaidDays: 90,
      fitPositive: 365,
      ldlHigh: 1095,
      statinCheckFrom: 28,
      statinCheckBy: 84,
      historyReads: 8,
    },

    dueSoonDays: 30,

    pendingGraceDays: 30,

    icdAdd: {
      dm: 'Z13.1',
      dlp: 'Z13.6',
      crc: 'Z12.1',
    },

    codingschemeuid: '56ded114859934d87173c235',

    icd: {
      dm: /^E1[0-4](?:\.|$)/i,

      renalDM: /^E1[0-4](?:\.|$)/i,

      heart: /^(?:I2[0-5]|I50|I6\d|G45|I7[0-3])(?:\.|$)/i,

      htn: /^I1[0-5](?:\.|$)/i,

      dlp: /^E78(?:\.|$)/i,

      pregnancy: /^(?:O0[019]|O[1-5]\d|O9[3-9]|Z3[3-6])(?:\.|$)|^Z32\.1/i,
      pregnancyEnd: /^(?:O0[2-8]|O[6-8]\d|O9[0-2]|Z3[79])(?:\.|$)/i,
      pregnancyBand: /^O09\.([0-5])/i,
      gdm: /^O24(?:\.|$)/i,

      esrd: /^N18\.?6(?:\D|$)/i,

      dialysisZ992: /^Z99\.?2(?:\D|$)/i,

      dialysisZ49: /^Z49(?:\.|$)/i,

      ckd: /^N18(?:\.|$)/i,

      crc: /^(?:C1[89]|C20)(?:\.|$)|^Z85\.0[34]/i,

      ascvd: /^(?:I2[0-5]|I63|I64|G45|I69\.[34]|I70\.2|I73\.9|Z95\.[15])/i,
      hf: /^(?:I50|I11\.0|I13\.[02])/i,
      ckdStage: /^N18\.[1-5]/i,
      ckdStage1to4: /^N18\.[1-4]/i,
      hypertensiveCkd: /^I1[23](?:\.|$)/i,
      t1d: /^E10(?:\.|$)/i,
      obesity: /^E66(?:\.|$)/i,
      hbVariant: /^D5[6-8](?:\.|$)/i,
    },

    labs: {
      a1c: {
        label: 'HbA1c',
        codes: ['4548-4'],
        name: /hba1c|a1c\b|glycated|glycosylated/i,
        line: /^\s*(h(a)?emoglobin\s*a1c|hb\s*a1c|a1c|glyc(at|osyl)ated)/i,
      },

      dm: {
        codes: ['4548-4', '14771-0'],
        name: /hba1c|a1c\b|glycated|glycosylated|fasting.{0,12}glucose|glucose.{0,12}fasting/i,
        line: /^\s*(h(a)?emoglobin\s*a1c|hb\s*a1c|a1c|glyc(at|osyl)ated|glucose|fasting)/i,
      },

      fpg: {
        label: 'Fasting glucose',
        codes: ['14771-0', '1558-6'],
        name: /fasting.{0,12}glucose|glucose.{0,12}fasting/i,
        line: /glucose|fasting/i,
      },

      tc: {
        label: 'Total Cholesterol',
        codes: ['2093-3'],
        name: /^(?!.*(?:\b(?:v?ldl|hdl|ratio|non)\b|density))(?:.*\bcholesterol\b|\s*t\.?\s*chol\b)|lipid.{0,10}(panel|profile)/i,
        line: /^(?!.*(?:\b(?:v?ldl|hdl|ratio|non)\b|density))(?:.*\bcholesterol\b|\s*t\.?\s*chol\b|\s*tc\b)/i,
      },

      ldl: {
        label: 'LDL',
        codes: ['18262-6', '13457-7', '2089-1', '39469-2'],
        name: /^(?!.*(?:ratio|very\s*low|\bvldl\b|\bnon\b))(?:.*\bldl\b|.*low\s*density\s*lipoprotein)|lipid.{0,10}(panel|profile)/i,
        line: /^(?!.*(?:ratio|very\s*low|\bvldl\b|\bnon\b))(?:.*\bldl\b|.*low\s*density\s*lipoprotein)/i,
      },

      hdl: {
        label: 'HDL',
        codes: ['2085-9'],
        name: /^(?!.*(?:ratio|\bnon\b))(?:.*\bhdl\b|.*high\s*density\s*lipoprotein)|lipid.{0,10}(panel|profile)/i,
        line: /^(?!.*(?:ratio|\bnon\b))(?:.*\bhdl\b|.*high\s*density\s*lipoprotein)/i,
      },

      tg: {
        label: 'Triglycerides',
        codes: ['2571-8'],
        name: /triglycer|lipid.{0,10}(panel|profile)/i,
        line: /triglycer/i,
      },

      fit: {
        label: 'FIT',
        codes: [],
        name: /occult|immunochemical|\bfit\b|stool.{0,10}blood/i,
        line: /occult|immunochemical|\bfit\b|stool/i,
      },
      hcg: {
        label: 'hCG',
        codes: ['2106-3', '2118-8', '80384-1', '83086-9', '45194-8'],
        name: /(?:\bhcg\b|human\s+chorionic\s+gonadotropin|chorionic\s+gonadotrophin)/i,
        line: /(?:\bhcg\b|human\s+chorionic\s+gonadotropin|chorionic\s+gonadotrophin|pregnancy)/i,
      },

      acr: {
        label: 'ACR',
        codes: ['32294-1'],
        name: /\bu?acr\b|albumin\s*\/?\s*creatinine.{0,25}(ratio|\[ratio\])|albumin.{0,30}creatinine.{0,30}urine/i,
        line: /albumin\s*\/\s*creatinine.{0,40}ratio|\bu?acr\b/i,
        strictLine: true,
      },

      creatinine: {
        label: 'Serum Creatinine',
        codes: ['2160-0', '38483-4'],
        name: /^(?!.*(glomerular|egfr|gfr\b|urine|ratio|clearance)).*(creatinine.{0,30}(serum|plasma|blood)|(serum|plasma|blood).{0,30}creatinine|^\s*s\.\s*creatinine\b)/i,
        line: /^\s*(?:s\.\s*)?creatinine\b(?!.*(urine|ratio|clearance))/i,
        strictLine: true,
      },
    },

    maxResultReads: 6,

    maxVisitOrderQueries: 8,

    maxMedicinePages: 10,

    maxVisitPages: 10,

    trendDays: 3 * 365,

    trendPoints: 4,

    trendMinSpanDays: 180,

    apiTimeoutMs: 8000,

    cacheTtlMs: 10 * 60 * 1000,
  };

  const STATUS = {
    labResulted: ['579b0cb3f3fd3fa90b83e339', '5d1c30ebcd65741feb09d709'],

    cancelled: '579b0bcbf3fd3fa90b83e32f',

    rejected: ['611cdc3ceab0e53328ec49fc', '579b0c5af3fd3fa90b83e334'],
  };

  const CHIPS = {
    dm: 'DM screening',
    dlp: 'Dyslipidemia screening',
    crc: 'Colon cancer screening',
    ckd: 'CKD screening',
  };

  const STATE = {
    eligible: { bg: '#fdeeec', fg: '#a3261d', accent: '#c0392b', icon: '!', label: 'DUE NOW' },
    pending: {
      bg: '#ecf5fc',
      fg: '#1f5d8c',
      accent: '#2f6fa3',
      icon: '…',
      label: 'ORDERED – RESULT PENDING',
    },
    screened: { bg: '#edf8f1', fg: '#23663f', accent: '#2e7d4f', icon: '✓', label: 'SCREENED' },
    dueSoon: { bg: '#fff5e3', fg: '#8a5300', accent: '#c77800', icon: '◷', label: 'DUE SOON' },
    excluded: { bg: '#f3f5f6', fg: '#5b646c', accent: '#7b858d', icon: '–', label: 'NOT ELIGIBLE' },
    invalid: {
      bg: '#fdeeec',
      fg: '#a3261d',
      accent: '#c0392b',
      icon: '↺',
      label: 'RESULT NOT VALID – REPEAT',
    },
    loading: { bg: '#f1f3f5', fg: '#5f6973', accent: '#a3abb2', icon: '·', label: 'LOADING…' },
    unreadable: {
      bg: '#eef1f3',
      fg: '#3f4f5a',
      accent: '#4f5f6a',
      icon: '?',
      label: 'COULD NOT READ RESULT',
    },
  };

  const CTX_URLS =
    /\/emr\/(diagnosis|cchpi|examination|observation|medicalhistory|clinicalnote|doctornote|patientconsult)\//;

  const HEX24 = /^[0-9a-f]{24}$/i;

  const MEDCLASS = {
    statin: {
      label: 'statin',
      re: /(?:atorva|atrova|rosuva|simva|prava|fluva|lova|pitava)st|\b(?:rosuvas|atorva)\b|rosuvastain|lipitor|crestor|zocor|atozet|caduet|vytorin|inegy|livalo|pravachol|lescol|فاستاتين/i,
    },
    acei: {
      label: 'ACE inhibitor',
      re: /(?:perindo|enala|capto|lisino|rami|fosino|quina|trando|zofeno|imida|cila|benaze|moexi)pril|coversyl|tritace|zestril|renitec|capoten|prinivil|vasotec|accupril|بريل/i,
    },
    arb: {
      label: 'ARB',
      re: /sartan|cozaar|hyzaar|diovan|micardis|atacand|aprovel|benicar|olmetec|exforge|twynsta|blopress|entresto|سارتان/i,
    },
    arni: { label: 'ARNI', re: /sacubitril|entresto/i },
    ccb: {
      label: 'calcium-channel blocker',
      re: /dipin|diltiazem|verapamil|norvasc|adalat|plendil|exforge|caduet|twynsta/i,
    },
    thiazide: {
      label: 'thiazide diuretic',
      re: /thiazid|chlorthalidon|chlortalidon|indapamid|metolazon|hctz|natrilix|hygroton/i,
    },
    betaBlocker: {
      label: 'beta-blocker',
      re: /(?:bisopro|ateno|metopro|carvedi|nebivo|proprano|labeta|sota|nado|pindo|acebuto|betaxo|esmo|celipro)l|concor|tenormin|lopressor|betaloc|dilatrend|nebilet|inderal/i,
      not: /eye|ophth|drop/i,
    },
    mra: { label: 'MRA', re: /spironolact|eplerenon|finerenon|aldactone|inspra|kerendia/i },
    sglt2i: {
      label: 'SGLT2 inhibitor',
      re: /gliflozin|jardiance|forxiga|synjardy|xigduo|glyxambi|invokana|steglatro|qtern|فلوزين/i,
    },
    glp1ra: {
      label: 'GLP-1 receptor agonist',
      re: /(?:sema|lira|dula|exena|lixisena|albi)glut|tirzepat|ozempic|rybelsus|wegovy|victoza|saxenda|trulicity|byetta|bydureon|mounjaro|xultophy|soliqua/i,
    },
    metformin: {
      label: 'metformin',
      re: /metformin|glucophage|janumet|jentadueto|eucreas|galvus\s*met|synjardy|xigduo|kombiglyze|ميتفورمين/i,
    },
    sulfonylurea: {
      label: 'sulfonylurea',
      re: /gliclazid|glimepirid|glibenclamid|glyburid|glipizid|gliquidon|diamicron|amaryl|daonil/i,
    },
    insulin: {
      label: 'insulin',
      re: /insulin|glargin|degludec|detemir|lispro|glulisin|isophane|lantus|toujeo|tresiba|levemir|novorapid|humalog|apidra|novomix|humulin|mixtard|actrapid|insulatard|ryzodeg|xultophy|soliqua|[اإ]نسولين/i,
    },
    nsaid: {
      label: 'NSAID',
      re: /ibuprofen|diclofenac|naproxen|meloxicam|celecoxib|etoricoxib|indometacin|indomethacin|ketoprofen|piroxicam|mefenamic|lornoxicam|aceclofenac|etodolac|ketorolac|nabumeton|tenoxicam|flurbiprofen|brufen|voltaren|cataflam|arcoxia|celebrex|mobic|naprosyn|ponstan|feldene/i,
      not: /gel|cream|topical|spray|patch|eye|ophth|drop|ointment|lotion|mouth|lozenge|plaster|foam/i,
    },
  };

  const medText = (m) => `${(m && m.name) || ''} | ${(m && m.text) || ''} | ${(m && m.route) || ''}`;

  function medClass(m, cls) {
    const c = MEDCLASS[cls];
    const text = medText(m);

    return !!c && c.re.test(text) && !(c.not && c.not.test(text));
  }

  const medStopped = (m) => !m || m.active === false || /cancel|discontinu|reject/i.test(m.status || '');

  function currentMedicine(m) {
    if (medStopped(m)) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = parseDate(m.end);
    if (end && end >= today.getTime()) return true;
    const order = parseDate(m.date);
    const start = parseDate(m.start);
    return (
      (!order && !start) || [order, start].some((t) => t && Date.now() - t <= CFG.days.currentMedicine * DAY)
    );
  }

  const currentMeds = (medicines, cls) =>
    ((medicines && medicines.items) || []).filter((m) => currentMedicine(m) && medClass(m, cls));

  const FOLLOW_TEST = { dm: 'HbA1c', dlp: 'lipid profile', ckd: 'ACR and creatinine' };

  const itemName = (key, res) => (res && res.title) || CHIPS[key];

  const stateLabel = (res) =>
    res.mode === 'followup' && res.state === 'screened'
      ? 'UP TO DATE'
      : (STATE[res.state] || STATE.excluded).label;

  const S = {
    ctx: {},
    headers: {},
    data: {},
    verdicts: null,
    careGaps: [],
    careGapsComplete: false,
    knownConditions: [],
    medicines: [],
    medicineNote: '',
    careGapsUnread: [],
    readAt: null,
    careprovider: null,
    log: [],
    cda: '0.2.1',
  };

  const OLD_SCRIPT_NOTE = 'Remove the old Raqeem Screening Assistant in Tampermonkey, then reload Raqeem.';

  if (!window.RQM || window.RQM.cda) {
    window.RQM = S;
  }

  function oldScriptRunning() {
    if (window.RQM === S) {
      return false;
    }

    if (!document.getElementById('cda-old-script') && document.body) {
      const note = document.createElement('div');
      note.id = 'cda-old-script';
      note.setAttribute('role', 'alert');
      note.textContent = OLD_SCRIPT_NOTE;
      note.style.cssText =
        'position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:2147483647;' +
        'max-width:min(560px,calc(100vw - 24px));padding:9px 13px;background:#fff;color:#8f1d1d;' +
        'border:1px solid #c94c4c;border-left:5px solid #b42318;font:600 14px/1.35 Arial,sans-serif;' +
        'box-shadow:0 3px 12px rgba(0,0,0,.18)';
      document.body.appendChild(note);
    }

    return true;
  }

  let writing = false;

  let inflight = null;

  let inflightKey = '';

  let bannerTimer = null;

  let bannerTries = 0;

  let runGen = 0;

  function log(...args) {
    S.log.push(args.join(' '));

    if (S.log.length > 200) {
      S.log.shift();
    }

    console.log('[RQM]', ...args);
  }

  const origOpen = XMLHttpRequest.prototype.open;

  const origSend = XMLHttpRequest.prototype.send;

  const origSetHeader = XMLHttpRequest.prototype.setRequestHeader;

  XMLHttpRequest.prototype.open = function (_method, url) {
    this.__rqmUrl = String(url);

    const m = !this.__rqmMine && this.__rqmUrl.match(/favouriteorder\/getordersetting\/([0-9a-f]{24})/);

    if (m) {
      S.careprovider = m[1];
    }

    return origOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.setRequestHeader = function (k, v) {
    if (!this.__rqmMine && !/^(accept|content-type|cache-control|pragma|x-requested-with)$/i.test(k)) {
      S.headers[k] = v;
    }

    return origSetHeader.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function (body) {
    if (!this.__rqmMine && typeof body === 'string' && body.length < 4096 && body[0] === '{') {
      const cp = body.indexOf('"careprovideruid"') !== -1 && body.match(/"careprovideruid":"([0-9a-f]{24})"/);

      if (cp) {
        S.careprovider = cp[1];
      }

      if (body.indexOf('"patientuid"') !== -1 && CTX_URLS.test(this.__rqmUrl || '')) {
        try {
          const b = JSON.parse(body);

          const pid = typeof b.patientuid === 'string' && HEX24.test(b.patientuid) ? b.patientuid : null;

          if (pid) {
            const vid =
              typeof b.patientvisituid === 'string' && HEX24.test(b.patientvisituid)
                ? b.patientvisituid
                : pid === S.ctx.patientuid
                  ? S.ctx.patientvisituid
                  : null;

            const dep =
              typeof b.departmentuid === 'string' && HEX24.test(b.departmentuid)
                ? b.departmentuid
                : pid === S.ctx.patientuid
                  ? S.ctx.departmentuid
                  : null;

            if (pid !== S.ctx.patientuid) {
              const modal = document.getElementById('rqm-modal-backdrop');
              if (modal) modal.remove();
              S.verdicts = null;
              S.careGaps = [];
              S.careGapsComplete = false;
              S.knownConditions = [];
              S.medicines = [];
              S.medicineNote = '';

              inflightKey = '';

              bannerTries = 0;

              log('patient context', pid);
            }

            S.ctx = {
              patientuid: pid,
              patientvisituid: vid,
              departmentuid: dep,
            };

            kick();
          }
        } catch (e) {}
      }
    }

    return origSend.apply(this, arguments);
  };

  function api(path, payload) {
    return new Promise((resolve) => {
      const x = new XMLHttpRequest();

      x.__rqmMine = true;

      x.open('POST', location.origin + path);

      x.timeout = CFG.apiTimeoutMs;

      x.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');

      for (const [k, v] of Object.entries(S.headers)) {
        try {
          x.setRequestHeader(k, v);
        } catch (e) {}
      }

      const fail = (reason) => {
        log('api', reason, path, x.status || '');

        resolve(null);
      };

      x.onload = () => {
        if (x.status >= 200 && x.status < 300) {
          try {
            resolve(JSON.parse(x.responseText));

            return;
          } catch (e) {}
        }

        fail('fail');
      };

      x.onerror = () => fail('error');

      x.ontimeout = () => fail('timeout');

      x.send(JSON.stringify(payload));
    });
  }

  function readBanner() {
    const banner = document.getElementById('patientbanner');

    if (!banner) {
      return null;
    }

    const txts = Array.from(banner.querySelectorAll('span'), (s) => (s.textContent || '').trim());

    let gender = null;
    let age = null;

    for (const t of txts) {
      if (/^(Male|ذكر)$/i.test(t)) {
        gender = 'M';
      } else if (/^(Female|أنثى)$/i.test(t)) {
        gender = 'F';
      }

      const m = t.match(/^(\d{1,3})\s*Y\b/i);

      if (m) {
        age = parseInt(m[1], 10);
      }
    }

    if (age === null) {
      for (const t of txts) {
        const m = t.match(/^(\d{2})-(\d{2})-(\d{4})\s*$/);

        if (m) {
          age = Math.floor((Date.now() - new Date(+m[3], +m[2] - 1, +m[1])) / 31557600000);

          break;
        }
      }
    }

    if (gender && age !== null) {
      return {
        gender,
        age,
      };
    }

    return null;
  }

  const daysAgo = (n) => new Date(Date.now() - n * DAY);

  async function fetchDiagnoses(ctx) {
    const r = await api('/emr/diagnosis/getdetails', {
      patientuid: ctx.patientuid,

      onlyselecteddiag: true,

      getcodeddata: true,
    });

    if (!r || !Array.isArray(r.diagnosis)) {
      return null;
    }

    if (
      r.diagnosis.some((rec) => {
        const uid = rec && rec.patientuid && (rec.patientuid._id || rec.patientuid);
        return uid && uid !== ctx.patientuid;
      })
    ) {
      return null;
    }

    const out = [];

    for (const rec of r.diagnosis) {
      for (const d of rec.diagnosis || []) {
        const code = d.problemuid && d.problemuid.code;

        if (code) {
          out.push({
            code: String(code).trim(),

            onset: d.onsetdate || rec.createdat,

            codedAt: d.createdat || rec.createdat,

            active: d.isactive !== false,

            visituid: rec.patientvisituid && (rec.patientvisituid._id || rec.patientvisituid),

            chronic: d.ischronicdiagnosis === true || rec.ischronicdiagnosis === true,
          });
        }
      }
    }

    return out;
  }

  async function fetchVisits(ctx) {
    const out = [];
    const seen = new Set();
    let complete = false;

    for (let page = 1; page <= CFG.maxVisitPages; page++) {
      const r = await api('/mpi/patientvisit/search/', {
        patientuid: ctx.patientuid,
        fromdate: daysAgo(CFG.days.visits).toISOString(),
        todate: new Date().toISOString(),
        page,
        limit: 50,
        includenulls: true,
      });

      if (!r || !Array.isArray(r.patientvisits)) {
        return null;
      }

      if (!r.patientvisits.length) {
        complete = true;
        break;
      }

      if (
        r.patientvisits.some((v) => {
          const uid = v && v.patientuid && (v.patientuid._id || v.patientuid);
          return uid && uid !== ctx.patientuid;
        })
      ) {
        return null;
      }

      const fresh = r.patientvisits.filter((v) => !v._id || !seen.has(v._id));

      if (!fresh.length) {
        break;
      }

      for (const v of fresh) {
        if (v._id) seen.add(v._id);
        out.push(v);
      }
    }

    out.complete = complete;

    return out;
  }

  function extractLabCode(item) {
    const candidates = [
      item.code,

      item.orderitemcode,

      item.orderitemuid && item.orderitemuid.code,

      item.orderitemuid && item.orderitemuid.loinccode,

      item.loinccode,

      item.loinc,
    ];

    for (const value of candidates) {
      if (value) {
        return String(value).trim();
      }
    }

    return '';
  }

  async function fetchMedicines(ctx) {
    const out = [];
    let complete = false;

    for (let page = 1; page <= CFG.maxMedicinePages; page++) {
      const r = await api('/ordermanagement/patientorder/search', {
        patientuid: ctx.patientuid,
        ordercattype: ['MEDICINE'],
        pagenumber: page,
        ispopulateorderalerts: true,
        isfromipdemrmedication: true,
      });

      if (!r || !Array.isArray(r.patientorders)) {
        return null;
      }

      if (!r.patientorders.length) {
        complete = true;
        break;
      }
      if (
        r.patientorders.some((po) => {
          const pu = po.patientuid && (po.patientuid._id || po.patientuid);
          return pu && pu !== ctx.patientuid;
        })
      ) {
        return { items: [], complete: false };
      }

      for (const po of r.patientorders) {
        for (const item of po.patientorderitems || []) {
          const status = item.statusuid || {};
          const generic = item.genericdruguid || {};
          const doseUnit = item.dosageUOM || {};
          const frequency = item.frequencyuid || {};
          const route = item.routeuid || {};
          out.push({
            name: String(generic.name || item.orderitemname || (item.orderitemuid || {}).name || '').trim(),
            text: [generic.name, item.orderitemname, (item.orderitemuid || {}).name]
              .filter(Boolean)
              .join(' | '),
            route: String(route.name || route.valuedescription || ''),
            end: item.enddate || null,
            start: item.startdate || null,
            dose: [item.dosage, doseUnit.valuedescription || doseUnit.locallanguagedesc, frequency.name]
              .filter((x) => x !== null && x !== undefined && x !== '')
              .join(' '),
            date: po.orderdate || item.orderdate || item.createdat,
            active: item.isactive !== false,
            status: String(status.valuedescription || status.valuecode || ''),
          });
        }
      }
    }

    return { items: out.sort((a, b) => (parseDate(b.date) || 0) - (parseDate(a.date) || 0)), complete };
  }

  async function fetchVitals(ctx) {
    const r = await api('/emr/observation/getobservationslist', {
      patientuid: ctx.patientuid,
      fromdate: daysAgo(CFG.trendDays).toISOString(),
      todate: new Date().toISOString(),
      isobservationpanel: true,
      sort: { observationdate: -1 },
      charttype: 'charting',
    });

    if (!r || !Array.isArray(r.observations)) return null;

    const observations = r.observations.flat().filter(Boolean);
    if (
      observations.some((o) => {
        const uid = o.patientuid && (o.patientuid._id || o.patientuid);
        return uid && uid !== ctx.patientuid;
      })
    ) {
      return null;
    }

    const rows = [];
    for (const o of observations) {
      const val = (re, allowedUnits) => {
        const v = (o.observationvalues || []).find((x) => x && re.test(x.name || ''));
        const match = v && normText(v.resultvalue).match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
        if (!match) return null;
        const unit = match[2].toLowerCase().replace(/²/g, '2').replace(/\s+/g, '');
        return !unit || allowedUnits.includes(unit) ? parseFloat(match[1]) : null;
      };
      rows.push({
        t: parseDate(o.observationdate),
        sys: val(/systolic/i, ['mmhg']),
        dia: val(/diastolic/i, ['mmhg']),
        bmi: val(/^bmi$|body mass index/i, ['kg/m2']),
        weight: val(/^weight$|body weight/i, ['kg']),
        height: val(/^height$|body height/i, ['cm']),
      });
    }

    return rows.filter((r) => r.t).sort((a, b) => b.t - a.t);
  }

  async function fetchLabHistory(ctx) {
    const alive = () => !S.ctx || !S.ctx.patientuid || S.ctx.patientuid === ctx.patientuid;
    const list = await arListLabOrders(ctx.patientuid, api, alive, Date.now());
    if (!list || !alive()) return null;

    return {
      items: list.items
        .filter((item) => item.status !== 'dropped')
        .map((item) => ({
          name: item.name,
          code: item.code,
          date: item.t === null ? null : new Date(item.t).toISOString(),
          status: item.status,
          orderuid: item.orderuid,
          visituid: item.visituid,
          itemuid: item.uid,
          resultAt: item.t === null ? null : new Date(item.t).toISOString(),
        })),
      complete: list.listComplete,
    };
  }

  async function fetchFitResults(ctx) {
    const r = await api('/ordermanagement/patientorder/getfittestorderresults', {
      laborderresultdonestsuids: STATUS.labResulted,

      orderedcancelledstatusuid: STATUS.cancelled,

      patientuid: ctx.patientuid,
    });

    if (!r || !Array.isArray(r.patientorderitems)) {
      return null;
    }

    if (
      r.patientorderitems.some((item) => {
        const uid = item.patientuid && (item.patientuid._id || item.patientuid);
        return uid && uid !== ctx.patientuid;
      })
    ) {
      return null;
    }

    return r.patientorderitems.map((item) => ({
      name: 'FIT',

      code: extractLabCode(item),

      orderuid: item.patientorderuid && (item.patientorderuid._id || item.patientorderuid),

      itemuid: item._id,

      visituid: item.patientvisituid && (item.patientvisituid._id || item.patientvisituid),

      resultAt: item.resultauthorizedat,

      date:
        item.resultauthorizedat ||
        item.resulteddate ||
        item.resultdate ||
        item.orderdate ||
        item.startdate ||
        item.modifiedat ||
        item.createdat,

      status: 'resulted',
    }));
  }

  const NUMERIC =
    /^[<>]?=?\s*(?:\d+(?:\.\d+)?|\.\d+)\s*(?:mg\/dl|mg\/l|mmol\/l|[u\u00b5]mol\/l|mg\/mmol|mg\/g|%)?\s*$/i;

  const normText = (s) =>
    String(s == null ? '' : s)
      .replace(/\s+/g, ' ')
      .trim();

  async function readResult(ctx, item) {
    if (!item.orderuid || !item.itemuid) {
      return null;
    }

    const body = {
      patientuid: ctx.patientuid,

      patientvisituid: item.visituid,

      patientorderuid: item.orderuid,

      patientorderitemuid: item.itemuid,
    };

    let r = await api('/lab/labresult/getdetail', body);

    if (!r) {
      r = await api('/lab/labresult/getdetail', body);
    }

    return (r && r.labresult) || null;
  }

  function mainLine(labresult, rule) {
    const lines = (labresult && labresult.resultvalues) || [];

    const main = lines.find((l) => rule.line.test(normText(l.name)));

    if (!main && !rule.strictLine && lines.length === 1) {
      return lines[0];
    }

    return main || null;
  }

  function checkLine(labresult, rule) {
    const main = mainLine(labresult, rule);

    return !!main && NUMERIC.test(normText(main.resultvalue));
  }

  const numValue = (v) => parseFloat(normText(v).replace(/^[<>]?=?\s*/, ''));

  const UNIT_TAIL = /\s*(?:mg\/dl|mg\/l|mmol\/l|[u\u00b5]mol\/l|mg\/mmol|mg\/g|%)\s*$/i;

  const shownValue = (v) => normText(v).replace(UNIT_TAIL, '');

  const dmName = (lineName) => (/a1c|glyc/i.test(lineName || '') ? 'HbA1c' : 'FBG');

  const resultUnit = (line) => {
    if (!line) return '';
    const uom = line.uomuid || {};
    const field =
      line.uomdescription ||
      (typeof uom === 'object' && (uom.valuedescription || uom.description || uom.name));
    if (field) return normText(field);
    const match = normText(line.resultvalue).match(UNIT_TAIL);
    return match ? match[0].trim() : '';
  };

  function fitResult(text) {
    const t = normText(text).toLowerCase().replace(/\s+/g, '');

    if (/^(?:neg|notdetected|nonreactive|-ve)/.test(t)) return 'negative';
    if (/^(?:pos|poitive|weakpo(?:s)?itive|\+|detected|reactive)/.test(t)) return 'positive';

    return null;
  }

  function hcgResult(line) {
    if (!line) return null;
    const shown = normText(line.resultvalue);
    const text = shown.toLowerCase();
    if (/\b(?:negative|not\s*detected|non[- ]?reactive|equivocal|indeterminate)\b/.test(text)) return false;
    if (/\b(?:positive|detected|reactive)\b/.test(text)) return true;
    if (!NUMERIC.test(shown)) return null;
    const value = numValue(shown);
    const unit = resultUnit(line).toLowerCase();
    if (unit && !/(?:miu|iu)\/m?l/.test(unit)) return null;
    const match = shown.match(/^(<=|>=|<|>)/);
    const bound = match ? match[1] : '';
    if (!bound) return value >= 25;
    if (bound === '<') return value <= 25 ? false : null;
    if (bound === '<=') return value < 25 ? false : null;
    if (bound === '>=') return value >= 25 ? true : null;
    if (bound === '>') return value >= 25 ? true : null;
    return null;
  }

  function valueOf(labresult, rule, key) {
    const line = mainLine(labresult, rule);

    if (key === 'hcg') {
      const positive = hcgResult(line);
      return {
        check: !labresult ? 'unreadable' : positive === null ? 'invalid' : 'valid',
        value: line && NUMERIC.test(normText(line.resultvalue)) ? numValue(line.resultvalue) : null,
        shown: line ? normText(line.resultvalue) : null,
        positive: positive === true,
        bound: false,
        boundSymbol: '',
        unit: resultUnit(line),
        short: 'hCG',
        rangeText: line ? line.normalrange : null,
      };
    }

    if (key === 'fit') {
      const fitLines = (labresult && labresult.resultvalues) || [];
      const hit =
        fitLines.find((l) => fitResult(l.resultvalue) === 'positive') ||
        fitLines.find((l) => fitResult(l.resultvalue) === 'negative');
      const fit = hit ? fitResult(hit.resultvalue) : null;

      return {
        check: !labresult ? 'unreadable' : fit ? 'valid' : 'invalid',
        value: null,
        shown: fit ? normText(hit.resultvalue) : null,
        positive: fit === 'positive',
        bound: false,
        boundSymbol: '',
        unit: '',
        short: 'FIT',
        rangeText: null,
      };
    }

    const short = key === 'dm' ? (line ? dmName(normText(line.name)) : null) : rule.label || null;
    const unit = resultUnit(line);
    const numeric = !!line && NUMERIC.test(normText(line.resultvalue));
    const compatible = !(short === 'HbA1c' && unit && !/%|mmol\/mol/i.test(unit));
    const ok = numeric && compatible;
    const shown = ok ? shownValue(line.resultvalue) : null;
    const boundMatch = shown && shown.match(/^(<=|>=|<|>)/);
    const boundSymbol = boundMatch ? boundMatch[1] : '';

    return {
      check: !labresult ? 'unreadable' : ok ? 'valid' : 'invalid',
      value: ok ? numValue(line.resultvalue) : null,
      shown,
      bound: !!boundSymbol,
      boundSymbol,
      unit,
      short,
      rangeText: line ? line.normalrange : null,
    };
  }

  const VALUE_KEYS = ['dm', 'a1c', 'tc', 'ldl', 'hdl', 'tg', 'acr', 'creatinine', 'fit', 'hcg'];

  const LIPID_KEYS = ['tc', 'ldl', 'hdl', 'tg'];

  const hasLine = (labresult, rule) =>
    ((labresult && labresult.resultvalues) || []).some((l) => rule.line.test(normText(l.name)));

  function candidatesFor(labs, key) {
    const rule = CFG.labs[key];
    const at = (item) => parseDate(item.resultAt) || parseDate(item.date);
    const own = (labs.items || []).filter((item) => item.status === 'resulted' && labMatches(item, rule));
    let list = own.map((item) => ({ item, t: at(item), own: true }));

    if (LIPID_KEYS.includes(key) && key !== 'tc') {
      for (const item of labs.items || []) {
        if (
          item.status === 'resulted' &&
          item.itemuid &&
          !own.includes(item) &&
          labMatches(item, CFG.labs.tc)
        ) {
          list.push({ item, t: at(item), own: false });
        }
      }
    }

    if (key === 'fit') {
      const readable = list.filter((c) => c.item.orderuid && c.item.itemuid);
      const ids = new Set();

      list = list.filter((c) => {
        if (c.item.orderuid && c.item.itemuid) {
          if (ids.has(c.item.itemuid)) return false;
          ids.add(c.item.itemuid);
          return true;
        }

        return !readable.some((x) => x.t && c.t && Math.abs(x.t - c.t) <= 7 * DAY);
      });
    }

    return list.filter((c) => c.t).sort((a, b) => b.t - a.t);
  }

  function validityFor(key) {
    if (key === 'dm' || key === 'a1c') {
      return CFG.days.dmLab;
    }

    if (key === 'acr' || key === 'creatinine') {
      return CFG.days.ckd;
    }

    if (key === 'fit') {
      return CFG.days.fit;
    }

    if (key === 'hcg') {
      return CFG.days.pregnancyLink;
    }

    return CFG.days.lipid;
  }

  async function resolveLabValues(ctx, labs) {
    const reads = (labs.reads = labs.reads || new Map());

    const read = (item) => {
      if (!reads.has(item.itemuid)) {
        reads.set(item.itemuid, readResult(ctx, item));
      }

      return reads.get(item.itemuid);
    };

    labs.checks = {};

    await Promise.all(
      VALUE_KEYS.map(async (key) => {
        const rule = CFG.labs[key];

        const windowMs = validityFor(key) * DAY;

        const candidates = candidatesFor(labs, key);

        const out = [];

        for (const c of candidates) {
          const capped = out.length >= CFG.maxResultReads;

          if (capped && Date.now() - c.t > windowMs) {
            break;
          }

          if (!c.own && (capped || Date.now() - c.t > windowMs)) {
            continue;
          }

          const lr = capped ? null : await read(c.item);

          if (!c.own && lr && !hasLine(lr, rule)) {
            continue;
          }

          const t = (lr && (parseDate(lr.resultdate) || parseDate(lr.approvaldate))) || c.t;

          const rec = valueOf(lr, rule, key);

          const check = rec.check;

          out.push({
            t,
            check,
            value: rec.value,
            shown: rec.shown,
            short: rec.short,
            bound: rec.bound,
            boundSymbol: rec.boundSymbol,
            unit: rec.unit,
            positive: rec.positive,
          });

          if (key === 'hcg' || check === 'valid' || Date.now() - t > windowMs) {
            break;
          }
        }

        labs.checks[key] = out.sort((a, b) => b.t - a.t);
      }),
    );

    return labs;
  }

  const HISTORY_DAYS = () => ({
    a1c: CFG.gap.lookback,
    fpg: CFG.gap.lookback,
    acr: CFG.gap.lookback,
    creatinine: CFG.gap.lookback,
    fit: CFG.gap.fitPositive,
    ldl: CFG.gap.ldlHigh,
  });

  async function resolveHistory(ctx, labs, keys) {
    const reads = (labs.reads = labs.reads || new Map());

    const read = (item) => {
      if (!reads.has(item.itemuid)) {
        reads.set(item.itemuid, readResult(ctx, item));
      }

      return reads.get(item.itemuid);
    };

    labs.history = labs.history || {};

    await Promise.all(
      keys.map(async (key) => {
        const rule = CFG.labs[key];
        const days = HISTORY_DAYS()[key];
        const out = [];

        for (const c of candidatesFor(labs, key)) {
          if (Date.now() - c.t > days * DAY) break;

          const capped = out.length >= CFG.gap.historyReads;

          if (capped && !c.own) continue;

          const lr = capped ? null : await read(c.item);

          if (!capped && !c.own && lr && !hasLine(lr, rule)) continue;

          const rec = valueOf(lr, rule, key);

          out.push({
            t: (lr && (parseDate(lr.resultdate) || parseDate(lr.approvaldate))) || c.t,
            check: rec.check,
            capped,
            value: rec.value,
            shown: rec.shown,
            short: rec.short,
            bound: rec.bound,
            boundSymbol: rec.boundSymbol,
            unit: rec.unit,
            positive: rec.positive,
          });
        }

        labs.history[key] = out.sort((a, b) => b.t - a.t);
      }),
    );

    return labs;
  }

  const historyKeys = (diagnoses) => [
    'fit',
    'acr',
    'creatinine',
    'ldl',
    ...(Array.isArray(diagnoses) && !diagnoses.some((d) => d.active && CFG.icd.dm.test(d.code))
      ? ['a1c', 'fpg']
      : []),
  ];

  const atLeast = (rec, thr) =>
    !!rec &&
    thr !== null &&
    Number.isFinite(rec.value) &&
    rec.boundSymbol !== '<' &&
    rec.boundSymbol !== '<=' &&
    rec.value >= thr;

  const isBelow = (rec, thr) =>
    !!rec &&
    thr !== null &&
    Number.isFinite(rec.value) &&
    rec.boundSymbol !== '>' &&
    rec.boundSymbol !== '>=' &&
    (rec.boundSymbol === '<' ? rec.value <= thr : rec.value < thr);

  const tri = (rec, thr) => (atLeast(rec, thr) ? true : isBelow(rec, thr) ? false : null);

  const unitOf = (rec) =>
    String((rec && rec.unit) || '')
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/\u00b5/g, 'u');

  const A1C_IFCC = { 6.5: 48, 7: 53, 7.5: 58, 10: 86 };
  const a1cThreshold = (rec, pct) => (/mmol\/mol/.test(unitOf(rec)) ? A1C_IFCC[pct] : pct);
  const a1cAtLeast = (rec, pct) => atLeast(rec, a1cThreshold(rec, pct));
  const a1cBelow = (rec, pct) => isBelow(rec, a1cThreshold(rec, pct));

  const byUnit = (rec, mmol, mgdl) => {
    const u = unitOf(rec);

    return /mmol\/l/.test(u) ? mmol : /mg\/dl/.test(u) ? mgdl : null;
  };

  const ACR_THR = { 'mg/mmol': { A2: 3, A3: 30, KD: 20 }, 'mg/g': { A2: 30, A3: 300, KD: 200 } };

  function acrAtLeast(rec, cat) {
    const u = unitOf(rec);
    const set = /mg\/mmol/.test(u) ? ACR_THR['mg/mmol'] : /mg\/g/.test(u) ? ACR_THR['mg/g'] : null;

    return set ? tri(rec, set[cat]) : null;
  }

  function egfrFrom(rec, demo) {
    if (
      !rec ||
      rec.check !== 'valid' ||
      rec.bound ||
      !Number.isFinite(rec.value) ||
      rec.value <= 0 ||
      !demo
    ) {
      return null;
    }

    const u = unitOf(rec);
    const mg = /umol/.test(u) || rec.value > 20 ? rec.value / 88.42 : /mg\/dl/.test(u) ? rec.value : null;
    const age = demo.age - (Date.now() - rec.t) / (365.25 * DAY);

    if (mg === null || age < 18 || !['F', 'M'].includes(demo.gender)) {
      return null;
    }

    const f = demo.gender === 'F';
    const r = mg / (f ? 0.7 : 0.9);

    return (
      142 * Math.min(r, 1) ** (f ? -0.241 : -0.302) * Math.max(r, 1) ** -1.2 * 0.9938 ** age * (f ? 1.012 : 1)
    );
  }

  function leadingRun(recs, qualifies) {
    const run = [];

    for (const r of recs || []) {
      if (r.check === 'invalid') continue;

      const q = r.check === 'valid' ? qualifies(r) : null;

      if (q === null) return { run, decided: false };
      if (!q) return { run, decided: true };

      run.push(r);
    }

    return { run, decided: true };
  }

  function runState(res) {
    const span = res.run.length ? res.run[0].t - res.run[res.run.length - 1].t : 0;

    if (res.run.length && span >= CFG.gap.chronicity * DAY) return 'confirmed';
    if (!res.decided) return 'unknown';

    return res.run.length ? 'single' : 'none';
  }

  function labMatches(item, rule) {
    if (!item || !rule) {
      return false;
    }

    if (item.code && Array.isArray(rule.codes) && rule.codes.includes(item.code)) {
      return true;
    }

    if (item.name && rule.name) {
      return rule.name.test(item.name);
    }

    return false;
  }

  function parseDate(value) {
    const t = Date.parse(value || '');

    return Number.isNaN(t) ? null : t;
  }

  function fmtDate(t) {
    if (!t) {
      return 'Not found';
    }

    return new Date(t).toLocaleDateString('en-GB');
  }

  function latestResult(labs, rule) {
    return (
      (labs.items || [])

        .filter((item) => item.status === 'resulted' && labMatches(item, rule))

        .map((item) => ({
          ...item,
          t: parseDate(item.date),
        }))

        .filter((item) => item.t)

        .sort((a, b) => b.t - a.t)[0] || null
    );
  }

  function latestPending(labs, rule) {
    return (
      (labs.items || [])

        .filter((item) => item.status === 'pending' && labMatches(item, rule))

        .map((item) => ({
          ...item,
          t: parseDate(item.date),
        }))

        .filter((item) => item.t && Date.now() - item.t <= CFG.pendingGraceDays * DAY)

        .sort((a, b) => b.t - a.t)[0] || null
    );
  }

  function resultWindowStatus(labs, rule, validityDays, key) {
    const checks = key ? (labs.checks || {})[key] || [] : null;

    const last = checks ? checks.find((c) => c.check === 'valid') || null : latestResult(labs, rule);

    const bad = checks
      ? checks.find(
          (c) => c.check !== 'valid' && Date.now() - c.t <= validityDays * DAY && (!last || c.t > last.t),
        ) || null
      : null;

    if (!last) {
      return {
        status: 'missing',
        last: null,
        lastDate: null,
        remainingDays: null,
        bad,
      };
    }

    const ageDays = Math.floor((Date.now() - last.t) / DAY);

    const remainingDays = validityDays - ageDays;

    if (remainingDays < 0) {
      return {
        status: 'expired',
        last,
        lastDate: last.t,
        remainingDays,
        bad,
      };
    }

    if (remainingDays <= CFG.dueSoonDays) {
      return {
        status: 'dueSoon',
        last,
        lastDate: last.t,
        remainingDays,
        bad,
      };
    }

    return {
      status: 'current',
      last,
      lastDate: last.t,
      remainingDays,
      bad,
    };
  }

  const BAND_WEEKS = [2.5, 9, 16.5, 22.5, 29.5, 35.5];

  function pregnancyStatus(demo, diagnoses, visits, labs) {
    if (!demo || demo.gender !== 'F' || demo.age < 12 || demo.age > 55) return false;
    if (!Array.isArray(diagnoses) || !Array.isArray(visits) || visits.complete === false) return null;

    const items = [];
    const ends = [];
    const hcg = labs && labs.checks && Array.isArray(labs.checks.hcg) ? labs.checks.hcg[0] : null;
    const hcgUnread = !!hcg && hcg.check === 'unreadable';

    for (const visit of visits) {
      const t =
        visit.ispatientpregnant === true && parseDate(visit.startdate || visit.visitdate || visit.createdat);
      if (t) items.push({ t, anchor: null });
    }

    for (const d of diagnoses) {
      const t = parseDate(d.codedAt || d.onset);
      if (!t) continue;
      if (CFG.icd.pregnancyEnd.test(d.code)) {
        ends.push(t);
      } else if (CFG.icd.pregnancy.test(d.code)) {
        const band = d.code.match(CFG.icd.pregnancyBand);
        items.push({ t, anchor: band ? t - BAND_WEEKS[+band[1]] * 7 * DAY : null });
      }
    }

    if (hcg && hcg.check === 'valid' && hcg.positive && Number.isFinite(hcg.t)) {
      items.push({ t: hcg.t, anchor: null });
    }

    if (!items.length) return hcgUnread ? null : false;

    items.sort((a, b) => a.t - b.t);

    let first = items.length - 1;
    while (first > 0 && items[first].t - items[first - 1].t <= CFG.days.pregnancyLink * DAY) first--;

    const episode = items.slice(first);
    const anchors = episode.filter((x) => x.anchor !== null);
    const start = anchors.length ? anchors[anchors.length - 1].anchor : episode[0].t;
    const limit = anchors.length ? CFG.days.pregnancyAnchored : CFG.days.pregnancyUnanchored;

    if (Date.now() - start > limit * DAY) return false;

    return !ends.some((t) => t >= start);
  }

  function evaluate(demo, diagnoses, visits, labs, medicines) {
    const firstDx = (regex) => (diagnoses || []).find((d) => d.active && regex.test(d.code)) || null;

    const hasDx = (regex) => !!firstDx(regex);

    const pregnancy = pregnancyStatus(demo, diagnoses, visits, labs);

    const pregnant = pregnancy === true;

    const v = {};

    function partStatus(part, validityDays) {
      const w = resultWindowStatus(labs, part.rule, validityDays, part.key);

      const base = {
        label: part.label,
        window: w,
      };

      if (w.status === 'current') {
        return { ...base, state: 'screened' };
      }

      const unread = ((labs.checks || {})[part.key] || []).find(
        (c) =>
          c.check === 'unreadable' && Date.now() - c.t <= validityDays * DAY && (!w.last || c.t > w.last.t),
      );

      if (unread) {
        return { ...base, window: { ...w, bad: unread }, state: 'unreadable' };
      }

      if (w.status === 'dueSoon') {
        return { ...base, state: 'dueSoon' };
      }

      const pending = latestPending(labs, part.rule);

      if (pending) {
        return { ...base, state: 'pending', pending };
      }

      if (w.bad) {
        return { ...base, state: w.bad.check };
      }

      return { ...base, state: 'eligible' };
    }

    const RANK = ['invalid', 'eligible', 'unreadable', 'pending', 'dueSoon', 'screened'];

    function standardScreening({ eligible, notEligibleReason, parts, validityDays }) {
      const ps = parts.map((p) => partStatus(p, validityDays));

      if (!eligible) {
        return {
          state: 'excluded',
          why: notEligibleReason,
          details: {
            parts: ps,
          },
        };
      }

      const top = ps
        .slice()
        .sort(
          (a, b) =>
            RANK.indexOf(a.state) - RANK.indexOf(b.state) ||
            (a.window.remainingDays || 0) - (b.window.remainingDays || 0),
        )[0];

      return {
        state: top.state,
        note: chipNote(top),
        why: ps.map((p) => partText(p)).join(' | '),
        details: {
          parts: ps,
        },
      };
    }

    function followUp(title, reason, parts, validityDays) {
      const res = standardScreening({ eligible: true, parts, validityDays });

      res.mode = 'followup';
      res.title = title;
      res.why = res.details.parts.map((p) => partText(p, true)).join(' | ');
      res.details.reason = reason;

      return res;
    }

    const dmDx = firstDx(CFG.icd.dm);

    const dmEligible = demo.age >= CFG.age.dm && !dmDx && !pregnant;

    let dmReason = 'Not eligible';

    if (demo.age < CFG.age.dm) {
      dmReason = `Age ${demo.age} < ${CFG.age.dm}`;
    } else if (hasDx(CFG.icd.dm)) {
      dmReason = 'Already diagnosed with diabetes';
    } else if (pregnant) {
      dmReason = 'Pregnancy';
    }

    if (dmDx) {
      const a1c = ((labs.checks || {}).a1c || []).find((c) => c.check === 'valid');

      const aboveGoal = a1cAtLeast(a1c, CFG.a1cGoal);

      const goalKnown = !a1c || a1cAtLeast(a1c, CFG.a1cGoal) || a1cBelow(a1c, CFG.a1cGoal);

      const a1cParts = [{ key: 'a1c', rule: CFG.labs.a1c, label: 'HbA1c' }];

      v.dm = followUp(
        'Diabetes follow-up',
        `Known diabetes ${dmDx.code} · HbA1c every ${
          aboveGoal
            ? `3 months (last HbA1c ≥${a1cThreshold(a1c, CFG.a1cGoal)} ${/mmol\/mol/.test(unitOf(a1c)) ? 'mmol/mol' : '%'})`
            : '6 months'
        } (ADA 2026, 6.2)`,
        a1cParts,
        aboveGoal ? CFG.days.a1cAboveGoal : CFG.days.a1cAtGoal,
      );

      if (!goalKnown && followUp('', '', a1cParts, CFG.days.a1cAboveGoal).state !== v.dm.state) {
        v.dm = {
          state: 'unreadable',
          mode: 'followup',
          title: v.dm.title,
          note: `HbA1c ${a1c.shown} · ${fmtDate(a1c.t)}`,
          why: `HbA1c ${a1c.shown} (${fmtDate(a1c.t)}) does not show whether it is below the ${CFG.a1cGoal} % goal, so the follow-up interval (3 or 6 months) is not known`,
          details: { reason: v.dm.details.reason },
        };
      }

      const unreadA1c = ((labs.checks || {}).a1c || []).find(
        (c) =>
          c.check === 'unreadable' && (!a1c || c.t > a1c.t) && Date.now() - c.t <= CFG.days.a1cAtGoal * DAY,
      );

      if (unreadA1c && ['screened', 'dueSoon', 'eligible'].includes(v.dm.state)) {
        v.dm = {
          state: 'unreadable',
          mode: 'followup',
          title: v.dm.title,
          note: `HbA1c ${fmtDate(unreadA1c.t)}`,
          why: `Could not read the newest HbA1c (${fmtDate(unreadA1c.t)}) - press ↻ to try again`,
          details: { reason: v.dm.details.reason },
        };
      }
    } else if (pregnancy === null && dmEligible) {
      v.dm = {
        state: 'unreadable',
        why: 'Could not read the complete visit history (pregnancy check) - press ↻ to try again',
      };
    } else {
      v.dm = standardScreening({
        eligible: dmEligible,

        notEligibleReason: dmReason,

        parts: [{ key: 'dm', rule: CFG.labs.dm, label: 'HbA1c / FBG' }],

        validityDays: CFG.days.dmLab,
      });
    }

    const dlpAge = demo.gender === 'F' ? CFG.age.dlpF : CFG.age.dlpM;

    const dlpEligible = demo.age >= dlpAge && !hasDx(CFG.icd.dlp);

    let dlpReason = 'Not eligible';

    if (demo.age < dlpAge) {
      dlpReason = `Age ${demo.age} < ${dlpAge}`;
    } else if (hasDx(CFG.icd.dlp)) {
      dlpReason = 'Already diagnosed with dyslipidemia';
    }

    const lipidParts = ['tc', 'ldl', 'hdl', 'tg'].map((key) => ({
      key,
      rule: CFG.labs[key],
      label: CFG.labs[key].label,
    }));

    const dlpDx = firstDx(CFG.icd.dlp);

    const onStatin = currentMeds(medicines, 'statin').length > 0;

    const dmLipid = !!dmDx && CFG.dmLipidFollowupAnyAge;

    if (dlpDx || onStatin || dmLipid) {
      const medsKnown = !!(medicines && medicines.complete);
      const why = dlpDx
        ? `Known dyslipidemia ${dlpDx.code}`
        : onStatin
          ? 'On a statin'
          : medsKnown
            ? `Known diabetes ${dmDx.code}, no statin`
            : `Known diabetes ${dmDx.code}`;
      const cite = dlpDx || onStatin ? '10.17' : medsKnown ? '10.16' : '10.16 / 10.17';

      v.dlp = followUp(
        'Lipid follow-up',
        `${why} · lipid profile yearly (ADA 2026, ${cite})`,
        lipidParts,
        CFG.days.lipid,
      );
    } else {
      v.dlp = standardScreening({
        eligible: dlpEligible,

        notEligibleReason: dlpReason,

        parts: lipidParts,

        validityDays: CFG.days.lipid,
      });

      if (!(medicines && medicines.complete)) {
        v.dlp = {
          state: 'unreadable',
          why: 'Could not read the complete medicine list (statin check) - press ↻ to try again',
        };
      }
    }

    const crcEligible = demo.age >= CFG.age.crcMin && demo.age <= CFG.age.crcMax;

    const crcDx = (diagnoses || []).find((d) => CFG.icd.crc.test(d.code));

    v.crc = crcDx
      ? {
          state: 'excluded',
          why: `Colon cancer diagnosed (${crcDx.code}) - specialist follow-up, not FIT screening`,
        }
      : standardScreening({
          eligible: crcEligible,

          notEligibleReason: `Age ${demo.age} outside ${CFG.age.crcMin}-${CFG.age.crcMax}`,

          parts: [{ key: 'fit', rule: CFG.labs.fit, label: 'FIT' }],

          validityDays: CFG.days.fit,
        });

    if (v.crc.state !== 'excluded' && v.crc.details) {
      v.crc.details.reason = 'FIT yearly, age 45-75 · colonoscopy is not visible in Raqeem (FIT only)';
    }

    const renalDx = firstDx(CFG.icd.renalDM);

    const hasDM = !!renalDx;

    const establishedDx = (regex) => {
      const rows = (diagnoses || []).filter((d) => d.active && regex.test(d.code));
      const occasions = new Set(rows.map((d) => d.visituid || `day ${fmtDate(parseDate(d.codedAt))}`));
      return rows.some((d) => d.chronic) || occasions.size >= 2;
    };

    const ckdGroupDx = CFG.ckdEstablishedOnly ? establishedDx : hasDx;

    const hasHTN = ckdGroupDx(CFG.icd.htn);

    const hasHeart = CFG.ckdScreenHeartDisease && ckdGroupDx(CFG.icd.heart);

    const hasDMorHTN = hasDM || hasHTN || hasHeart;

    const sourceDx = [];

    if (hasDM) {
      sourceDx.push('DM');
    }

    if (hasHTN) {
      sourceDx.push('HTN');
    }

    if (hasHeart) {
      sourceDx.push('Heart disease / stroke');
    }

    const renalExcluded = hasDx(CFG.icd.esrd) || hasDx(CFG.icd.dialysisZ992) || hasDx(CFG.icd.dialysisZ49);

    if (renalExcluded) {
      v.ckd = {
        state: 'excluded',
        why: 'ESRD / dialysis exclusion',
      };
    } else if (hasDx(CFG.icd.ckd) || hasDM) {
      const ckdDx = firstDx(CFG.icd.ckd);

      v.ckd = followUp(
        ckdDx ? 'CKD follow-up' : 'Kidney follow-up',
        ckdDx
          ? `Known CKD ${ckdDx.code} · ACR + creatinine at least yearly; more often by stage (ADA 2026, 11.1b)`
          : `Known diabetes ${renalDx.code} · ACR + creatinine at least yearly (ADA 2026, 11.1a)`,
        [
          { key: 'acr', rule: CFG.labs.acr, label: 'ACR' },
          { key: 'creatinine', rule: CFG.labs.creatinine, label: 'Serum Creatinine' },
        ],
        CFG.days.ckd,
      );
    } else if (demo.age < CFG.age.renal) {
      v.ckd = {
        state: 'excluded',
        why: `Age ${demo.age} < ${CFG.age.renal}`,
      };
    } else if (!hasDMorHTN) {
      v.ckd = {
        state: 'excluded',
        why: CFG.ckdEstablishedOnly
          ? 'No diabetes, and no hypertension or heart disease coded at 2 visits or marked chronic'
          : 'No diabetes, hypertension or heart disease',
      };
    } else {
      v.ckd = standardScreening({
        eligible: true,

        parts: [
          { key: 'acr', rule: CFG.labs.acr, label: 'ACR' },
          { key: 'creatinine', rule: CFG.labs.creatinine, label: 'Serum Creatinine' },
        ],

        validityDays: CFG.days.ckd,
      });

      v.ckd.details.sourceDx = sourceDx;
    }

    if (!diagnoses) {
      const ageOut = {
        dm: false,
        dlp: false,
        crc: !crcEligible,
        ckd: false,
      };

      for (const key of ['dm', 'dlp', 'crc', 'ckd']) {
        if (!ageOut[key]) {
          v[key] = { state: 'unreadable', why: 'Could not read the diagnosis list - press ↻ to try again' };
        }
      }
    }

    if (!labs.complete) {
      for (const key of ['dm', 'dlp', 'crc', 'ckd']) {
        if (v[key] && v[key].state !== 'excluded') {
          v[key] = {
            state: 'unreadable',
            mode: v[key].mode,
            title: v[key].title,
            why: 'Could not read the complete result history - press ↻ to try again',
          };
        }
      }
    }
    if (labs.fitFailed && v.crc && v.crc.state !== 'excluded') {
      v.crc = { state: 'unreadable', why: 'Could not read FIT results - press ↻ to try again' };
    }

    return v;
  }

  const fmtNum = (v) => (Math.abs(v) >= 100 ? String(Math.round(v)) : String(+v.toFixed(2)));

  function chipNote(p) {
    const w = p.window || {};

    const last = w.last;

    const name = (last && last.short) || p.label;

    if (p.state === 'screened' || p.state === 'dueSoon') {
      const shown = last && (last.shown || (Number.isFinite(last.value) ? String(last.value) : null));

      return shown ? `${name} ${shown} · ${fmtDate(w.lastDate)}` : `${name} · ${fmtDate(w.lastDate)}`;
    }

    if (p.state === 'invalid' || p.state === 'unreadable') {
      return w.bad ? `${p.label} ${fmtDate(w.bad.t)}` : '';
    }

    if (p.state === 'pending') {
      return p.pending ? `ordered ${fmtDate(p.pending.t)}` : '';
    }

    if (p.state === 'eligible' && w.lastDate) {
      return `last ${name} ${fmtDate(w.lastDate)}`;
    }

    return '';
  }

  const loadingVerdicts = () =>
    Object.fromEntries(CFG.display.map((key) => [key, { state: 'loading', why: 'Reading Raqeem…' }]));

  async function lookupProblem(code) {
    try {
      const cached = sessionStorage.getItem('rqmicd:' + code);

      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {}

    const r = await api('/clinicaldatamaster/problem/widgetsearch', {
      searchOption: 'BETWEEN',

      codingschemeuid: CFG.codingschemeuid,

      searchFieldVale: code,

      page: 1,

      isConfidentialReadPermission: true,
    });

    const problem = ((r && r.diagnosis) || []).find((item) => item.code === code) || null;

    if (problem) {
      const simple = {
        _id: problem._id,

        code: problem.code,

        name: problem.name,
      };

      try {
        sessionStorage.setItem('rqmicd:' + code, JSON.stringify(simple));
      } catch (e) {}

      return simple;
    }

    return null;
  }

  function buildDxPayload(ctx, careprovider, problem) {
    return {
      patientvisituid: ctx.patientvisituid,

      patientuid: ctx.patientuid,

      departmentuid: ctx.departmentuid,

      careprovideruid: careprovider,

      CPbasedsearch: true,

      diagnosis: {
        isprimary: false,

        onsetdate: new Date().toISOString(),

        closuredate: null,

        severityuid: null,

        comorbidityuid: null,

        encounterstageuid: null,

        confirmationuid: null,

        cancerstaging: null,

        externalcause: false,

        causeofdeath: false,

        infectiousdisease: false,

        isnotifiable: false,

        isunderlyingdiagnosis: false,

        ischronicdiagnosis: false,

        isactive: false,

        comments: '',

        bodysites: [],

        problemuid: problem._id,

        isproblemlist: true,

        externaldiagnosis: [],

        allowtosave: true,

        diagnosismedispanalerts: '',

        careprovideruid: careprovider,
      },

      isConfidentialReadPermission: true,
    };
  }

  async function savedOnVisit(ctx, codes) {
    const dx = await fetchDiagnoses(ctx);

    if (!dx) {
      return null;
    }

    return codes.filter((code) => dx.some((d) => d.code === code && d.visituid === ctx.patientvisituid));
  }

  function refreshNow(pid) {
    if (pid) {
      cacheClear(pid);
    }

    S.verdicts = null;
    S.careGaps = [];
    S.careGapsComplete = false;
    S.knownConditions = [];
    S.medicines = [];
    S.medicineNote = '';

    inflightKey = '';

    kick();
  }

  function samePatientContext(ctx) {
    return ['patientuid', 'patientvisituid', 'departmentuid'].every(
      (key) => (S.ctx && S.ctx[key]) === ctx[key],
    );
  }

  async function addAllEligible(keys) {
    if (writing) {
      alert('Still saving the previous diagnosis. Please wait a moment.');

      return;
    }

    const writable = keys.filter((key) => CFG.icdAdd[key]);

    if (!writable.length) {
      alert('Nothing to add for this patient.');

      return;
    }

    const ctx = {
      ...S.ctx,
    };

    if (!ctx.patientuid || !ctx.patientvisituid || !ctx.departmentuid) {
      alert(
        'Visit context not detected.\n' +
          'Open the patient visit (Diagnosis or Clinical Note) and try again.',
      );

      return;
    }

    if (!S.careprovider) {
      alert('Doctor identity not detected.\n' + 'Open the Orders screen once, then try again.');

      return;
    }

    writing = true;

    let wrote = false;

    try {
      const dxNow = await fetchDiagnoses(ctx);

      if (!samePatientContext(ctx)) {
        alert('The patient changed. No further screening codes were added.');
        return;
      }
      if (!dxNow) {
        alert('Could not read the current diagnoses from Raqeem.\n' + 'Nothing was added. Please try again.');

        return;
      }

      const already = [];
      const notFound = [];
      const toAdd = [];

      const DIAGNOSED = { dm: CFG.icd.dm, dlp: CFG.icd.dlp, crc: CFG.icd.crc };
      const diagnosed = writable.filter(
        (key) =>
          (DIAGNOSED[key] && dxNow.some((d) => (d.active || key === 'crc') && DIAGNOSED[key].test(d.code))) ||
          (key === 'dlp' &&
            CFG.dmLipidFollowupAnyAge &&
            dxNow.some((d) => d.active && CFG.icd.dm.test(d.code))),
      );

      let statinSkip = '';

      if (writable.includes('dlp') && !diagnosed.includes('dlp')) {
        const medsNow = await fetchMedicines(ctx);

        if (!samePatientContext(ctx)) {
          alert('The patient changed. No further screening codes were added.');
          return;
        }

        if (!medsNow || !medsNow.complete) {
          statinSkip = `\n\nNot added - could not read the complete medicine list (statin check): ${CFG.icdAdd.dlp}`;
        } else if (currentMeds(medsNow, 'statin').length) {
          statinSkip = `\n\nNot added - the patient is on a statin (lipid follow-up, not screening): ${CFG.icdAdd.dlp}`;
        }
      }

      for (const key of writable) {
        const code = CFG.icdAdd[key];

        if (diagnosed.includes(key) || (key === 'dlp' && statinSkip)) {
          continue;
        }

        if (dxNow.some((d) => d.code === code && d.visituid === ctx.patientvisituid)) {
          already.push(code);

          continue;
        }

        const problem = await lookupProblem(code);

        if (!samePatientContext(ctx)) {
          alert('The patient changed. No further screening codes were added.');
          return;
        }
        if (problem) {
          toAdd.push(problem);
        } else {
          notFound.push(code);
        }
      }

      const skipped =
        (diagnosed.length
          ? `\n\nNot added - the condition is already diagnosed: ${diagnosed.map((k) => CFG.icdAdd[k]).join(', ')}`
          : '') + statinSkip;

      if (!toAdd.length) {
        alert(
          'Nothing was added.' +
            (already.length ? `\n\nAlready on this visit: ${already.join(', ')}` : '') +
            skipped +
            (notFound.length ? `\n\nNot found in the Raqeem diagnosis list: ${notFound.join(', ')}` : ''),
        );

        if (already.length || diagnosed.length || statinSkip) {
          wrote = true;
        }

        return;
      }

      if (!samePatientContext(ctx)) {
        alert('The patient changed. No further screening codes were added.');
        return;
      }
      const ok = confirm(
        'Add screening diagnosis?\n\n' + toAdd.map((p) => `${p.code}  ${p.name}`).join('\n') + skipped,
      );

      if (!ok) {
        return;
      }

      const rejected = [];

      for (const problem of toAdd) {
        if (!samePatientContext(ctx)) {
          alert('The patient changed. No further screening codes were added.');
          return;
        }
        const r = await api('/emr/diagnosis/create', buildDxPayload(ctx, S.careprovider, problem));

        if (!samePatientContext(ctx)) {
          alert('The patient changed. No further screening codes were added.');
          return;
        }
        if (!r) {
          rejected.push(problem.code);
        }
      }

      wrote = true;

      const codes = toAdd.map((p) => p.code);

      const saved = await savedOnVisit(ctx, codes);

      if (!samePatientContext(ctx)) {
        alert('The patient changed. The completed additions remain on the confirmed patient.');
        return;
      }
      const failed = [];
      const unconfirmed = [];

      for (const code of codes) {
        if (saved && saved.includes(code)) {
          continue;
        }

        if (rejected.includes(code)) {
          failed.push(code);
        } else {
          unconfirmed.push(code);
        }
      }

      if (failed.length || unconfirmed.length || notFound.length) {
        const done = codes.filter((c) => !failed.includes(c) && !unconfirmed.includes(c));

        alert(
          'Screening diagnosis - not everything was added.' +
            (done.length ? `\n\nAdded: ${done.join(', ')}` : '') +
            (failed.length
              ? `\n\nNOT added (Raqeem did not accept it): ${failed.join(', ')}\nPlease add it manually or try again.`
              : '') +
            (unconfirmed.length
              ? `\n\nSent but not confirmed: ${unconfirmed.join(', ')}\nCheck the Diagnosis list before trying again.`
              : '') +
            (notFound.length ? `\n\nNot found in the Raqeem diagnosis list: ${notFound.join(', ')}` : ''),
        );
      }
    } catch (e) {
      alert('Add failed: ' + ((e && e.message) || e) + '\nCheck the Diagnosis list before trying again.');
    } finally {
      writing = false;

      if (wrote) {
        refreshNow(ctx.patientuid);
      }
    }
  }

  const DX_NAMES = [
    [CFG.icd.dm, 'Diabetes'],
    [CFG.icd.htn, 'Hypertension'],
    [CFG.icd.dlp, 'Dyslipidemia'],
    [/^E66(?:\.|$)/i, 'Obesity'],
    [CFG.icd.ckd, 'Chronic kidney disease'],
  ];

  function knownConditions(diagnoses) {
    const out = [];
    for (const [re, name] of DX_NAMES) {
      const dx = (diagnoses || [])
        .filter((d) => d.active && re.test(d.code))
        .sort((a, b) => (parseDate(a.codedAt) || 0) - (parseDate(b.codedAt) || 0))[0];
      if (dx) out.push({ name, code: dx.code, firstCoded: dx.codedAt });
    }
    return out;
  }

  function medicineSummary(medicines) {
    const seen = new Map();
    const rows = [];

    for (const m of (medicines && medicines.items) || []) {
      const name = String(m.name || '').toLowerCase();
      if (!name || medStopped(m)) continue;
      const dose = normText(m.dose).toLowerCase();
      const doses = seen.get(name) || new Set();
      if (doses.has(dose) || (!dose && doses.size)) continue;
      doses.add(dose);
      seen.set(name, doses);
      rows.push({ ...m, current: currentMedicine(m) });
    }

    return rows;
  }

  const medicineReadNote = (medicines) =>
    medicines && medicines.complete
      ? ''
      : medicines && medicines.items && medicines.items.length
        ? 'Could not read the complete medicine list — press ↻'
        : 'Could not read medicines — press ↻';

  const mgOf = (m) => {
    const hit = `${medText(m)} ${(m && m.dose) || ''}`.match(/(\d+(?:\.\d+)?)\s*mg(?![a-z])/i);
    return hit ? parseFloat(hit[1]) : null;
  };

  const STATIN_MOLECULE =
    /atorva|atrova|lipitor|caduet|atozet|rosuva|crestor|simva|zocor|vytorin|inegy|prava|fluva|lescol|lova|pitava|livalo/i;

  const statinMolecule = (m) => {
    const hit = medText(m).match(STATIN_MOLECULE);
    const name = hit ? hit[0].toLowerCase() : '';
    return /atorva|atrova|lipitor|caduet|atozet/.test(name)
      ? 'atorvastatin'
      : /rosuva|crestor/.test(name)
        ? 'rosuvastatin'
        : /simva|zocor|vytorin|inegy/.test(name)
          ? 'simvastatin'
          : name;
  };

  function statinEvent(medicines) {
    const dated = ((medicines && medicines.items) || []).filter((m) => parseDate(m.date));
    const oldest = Math.min(...dated.map((m) => parseDate(m.date)));
    const statins = dated
      .filter((m) => !medStopped(m) && medClass(m, 'statin'))
      .map((m) => ({ t: parseDate(m.date), mol: statinMolecule(m), mg: mgOf(m), m }))
      .sort((a, b) => a.t - b.t);
    let event = null;
    let prev = null;

    for (const st of statins) {
      if (!prev || st.t - prev.t > 365 * DAY) {
        if (oldest <= st.t - 365 * DAY) event = { t: st.t, kind: 'start', med: st.m };
      } else if (st.mol !== prev.mol || (st.mg !== null && prev.mg !== null && st.mg !== prev.mg)) {
        event = { t: st.t, kind: 'change', med: st.m };
      }
      prev = st;
    }

    return event;
  }

  function statinIntensity(m) {
    const mg = mgOf(m);
    const mol = statinMolecule(m);

    if (mg === null) return '';
    if (mol === 'atorvastatin') return mg >= 40 ? 'high' : 'moderate';
    if (mol === 'rosuvastatin') return mg >= 20 ? 'high' : 'moderate';

    return 'moderate';
  }

  const GAP_VERBS = ['Safety check', 'Treat', 'Order', 'Refer', 'Confirm diagnosis'];

  const FOLLOW_SRC = (reason) => ((reason || '').match(/\(([^()]*\d[^()]*)\)\s*$/) || [])[1] || '';

  const SCREEN_RULE = {
    dm: [
      'HbA1c or fasting glucose from age 35; yearly is a programme choice',
      'ADA 2026 2.12b; programme rule',
    ],
    dlp: [
      'Lipid profile yearly from age 35 (men) / 45 (women)',
      'Programme rule (local choice, not guideline text)',
    ],
    crc: ['FIT yearly at age 45-75; colonoscopy is not visible in Raqeem (FIT only)', 'USPSTF 2021'],
    ckd: [
      'ACR and creatinine yearly with hypertension or heart disease coded at 2 visits or marked chronic',
      'KDIGO 2024 PP 1.1.1.1',
    ],
  };

  function buildCareGaps(demo, diagnoses, verdicts, medicines, vitals, labs, visits) {
    const gaps = [];
    const add = (gap) => gaps.push({ due: '', date: null, more: '', ...gap });
    const now = Date.now();
    const age = demo.age;
    const screenAction = {
      dm: 'Order HbA1c or fasting glucose',
      dlp: 'Order lipid profile',
      crc: 'Order or arrange FIT',
      ckd: 'Order or arrange ACR and creatinine',
    };

    for (const key of CFG.display) {
      const res = verdicts && verdicts[key];
      if (!res) continue;
      const due = ['eligible', 'invalid'].includes(res.state);
      const parts = (res.details && res.details.parts) || [];
      const last = Math.max(
        0,
        ...parts.map((p) => (p.window && (p.window.lastDate || (p.window.bad && p.window.bad.t))) || 0),
      );
      if (res.mode === 'followup') {
        if (!due && res.state !== 'dueSoon') continue;
        const reason = (res.details && res.details.reason) || '';
        const left = Math.min(...parts.map((p) => (p.window && p.window.remainingDays) || 0));
        add({
          id: 'CG-01',
          kind: 'Follow-up',
          verb: 'Order',
          tone: due ? 'red' : 'amber',
          title: res.title,
          fact: res.why || stateLabel(res),
          action: due
            ? `${res.state === 'invalid' ? 'Repeat' : 'Order'} ${FOLLOW_TEST[key]}`
            : `Order ${FOLLOW_TEST[key]} at next visit`,
          due: due ? 'now' : Number.isFinite(left) ? `in ${Math.max(0, left)} days` : 'soon',
          date: last || null,
          rule: reason.replace(/\s*\([^()]*\)\s*$/, '') || res.title,
          src: FOLLOW_SRC(reason),
        });
        continue;
      }
      if (!due) continue;
      add({
        id: 'CG-01',
        kind: 'Screen',
        verb: 'Order',
        tone: 'red',
        title: CHIPS[key],
        fact: res.why || STATE[res.state].label,
        action:
          res.state === 'invalid'
            ? `Repeat ${key === 'dlp' ? 'lipid profile' : key === 'crc' ? 'FIT' : key === 'ckd' ? 'invalid test' : 'test'}`
            : screenAction[key],
        due: 'now',
        date: last || null,
        rule:
          key === 'ckd' && !CFG.ckdEstablishedOnly
            ? 'ACR and creatinine yearly with hypertension or heart disease'
            : SCREEN_RULE[key][0],
        src: SCREEN_RULE[key][1],
      });
    }

    const diagnosesKnown = Array.isArray(diagnoses);
    const firstDx = (re) => (diagnosesKnown && diagnoses.find((d) => d.active && re.test(d.code))) || null;
    const hasDx = (re) => !!firstDx(re);
    const dm = hasDx(CFG.icd.dm);
    const htn = hasDx(CFG.icd.htn);
    const ascvd = firstDx(CFG.icd.ascvd);
    const hf = firstDx(CFG.icd.hf);
    const dialysis = hasDx(CFG.icd.esrd) || hasDx(CFG.icd.dialysisZ992) || hasDx(CFG.icd.dialysisZ49);
    const adult = age >= 18;
    const notPregnant = pregnancyStatus(demo, diagnoses, visits === undefined ? [] : visits, labs) === false;
    const medsComplete = !!(medicines && medicines.complete);
    const labsComplete = !!labs && labs.complete !== false;
    const checks = (labs && labs.checks) || {};
    const history = (labs && labs.history) || {};

    const latest = (key) => {
      for (const c of checks[key] || []) {
        if (c.check === 'valid') return c;
        if (c.check === 'unreadable') return null;
      }
      return null;
    };
    const recsFor = (key) =>
      history[key] || (checks[key] ? [...checks[key], { check: 'unreadable', t: 0 }] : []);
    const inWindow = (recs, days) => recs.filter((r) => !r.t || now - r.t <= days * DAY);

    const dmPart =
      verdicts &&
      verdicts.dm &&
      verdicts.dm.details &&
      verdicts.dm.details.parts &&
      verdicts.dm.details.parts[0];
    const partA1c =
      dmPart && dmPart.window && dmPart.window.last && dmPart.window.last.short === 'HbA1c'
        ? dmPart.window.last
        : null;
    const hb = labs ? latest('a1c') : partA1c;

    const egfrOk = adult && notPregnant && !dialysis;
    const cr = latest('creatinine');
    const egfrNow = egfrOk && cr && now - cr.t <= 365 * DAY ? egfrFrom(cr, demo) : null;
    const egfrRunRes = egfrOk
      ? leadingRun(inWindow(recsFor('creatinine'), CFG.gap.lookback), (r) => {
          const e = egfrFrom(r, demo);
          return e === null ? null : e < 60;
        })
      : { run: [], decided: false };
    const egfrRun = runState(egfrRunRes);
    const acrRunRes = leadingRun(inWindow(recsFor('acr'), CFG.gap.lookback), (r) => acrAtLeast(r, 'A2'));
    const acrRun = runState(acrRunRes);
    const acrKdRun = runState(
      leadingRun(inWindow(recsFor('acr'), CFG.gap.lookback), (r) => acrAtLeast(r, 'KD')),
    );
    const codedCkd = hasDx(CFG.icd.ckdStage);
    const ckdKnown = codedCkd || egfrRun === 'confirmed' || acrRun === 'confirmed';
    const egfrText = (rec) =>
      `eGFR ${Math.round(egfrFrom(rec, demo))} (from creatinine ${rec.shown}, ${fmtDate(rec.t)})`;

    const crcCoded = diagnosesKnown && diagnoses.some((d) => CFG.icd.crc.test(d.code));
    const fitPos = (history.fit || checks.fit || []).find(
      (r) => r.check === 'valid' && r.positive && now - r.t <= CFG.gap.fitPositive * DAY,
    );
    if (diagnosesKnown && !crcCoded && fitPos) {
      add({
        id: 'CG-02',
        kind: 'Follow-up',
        verb: 'Refer',
        tone: 'red',
        title: 'Positive FIT — colonoscopy needed',
        fact: `FIT ${fitPos.shown} on ${fmtDate(fitPos.t)}. No colonoscopy result is visible in Raqeem.`,
        action: 'Refer for colonoscopy (target within 6 months); do not repeat FIT',
        due: 'within 6 months of the result',
        date: fitPos.t,
        more: now - fitPos.t > 182 * DAY ? 'More than 6 months since the positive FIT' : '',
        rule: 'Positive FIT needs colonoscopy, not a repeat FIT; colonoscopy is not visible in Raqeem (FIT only)',
        src: 'ACS 2026; USMSTF 2017 rec 2',
      });
    }

    const statinsNow = currentMeds(medicines, 'statin');
    if (diagnosesKnown && medsComplete && !statinsNow.length && notPregnant && adult) {
      const reasons = [];
      const srcs = [];
      let high = false;
      if (dm && age >= 40 && age <= 75) {
        reasons.push('Diabetes age 40–75');
        srcs.push('ADA 2026 10.18');
      }
      if (ascvd) {
        reasons.push(`ASCVD ${ascvd.code}`);
        srcs.push('ADA 2026 10.26');
        high = true;
      }
      if (age >= 50 && !dialysis && ckdKnown) {
        reasons.push('CKD, age 50 or over');
        srcs.push('KDIGO 2024 3.15.1.1-3.15.1.2');
      }
      const ldlHigh =
        age >= 20 &&
        age <= 75 &&
        inWindow(recsFor('ldl'), CFG.gap.ldlHigh).find(
          (r) => r.check === 'valid' && atLeast(r, byUnit(r, 4.9, 190)),
        );
      if (ldlHigh) {
        reasons.push(`LDL ${ldlHigh.shown} on ${fmtDate(ldlHigh.t)}`);
        srcs.push('2026 ACC/AHA; Saudi 2022');
        high = true;
      }
      if (reasons.length) {
        const lastStatin = ((medicines && medicines.items) || []).find(
          (m) => !medStopped(m) && medClass(m, 'statin'),
        );
        add({
          id: 'CG-03',
          kind: 'Treat',
          verb: 'Treat',
          tone: 'red',
          title: 'Statin review',
          fact: `${reasons.join('; ')}; no statin ordered in Raqeem in the last 6 months${
            lastStatin ? ` (last statin order ${fmtDate(parseDate(lastStatin.date))})` : ''
          }.`,
          action: high ? 'Start high-intensity statin unless contraindicated' : 'Review statin therapy',
          date: ldlHigh ? ldlHigh.t : null,
          rule: 'Statin indicated: diabetes 40–75, ASCVD, CKD at 50 or over, or LDL ≥4.9 mmol/L (190 mg/dL)',
          src: srcs.join('; '),
        });
      }
    }

    const statinEv = medsComplete ? statinEvent(medicines) : null;
    const ldl = latest('ldl');
    if (diagnosesKnown && medsComplete && statinsNow.length && ldl && now - ldl.t <= 365 * DAY) {
      const guardOk = !statinEv || ldl.t >= statinEv.t + CFG.gap.statinGuard * DAY;
      const risk =
        htn ||
        ckdKnown ||
        hasDx(CFG.icd.obesity) ||
        (vitals || []).some((r) => r.bmi !== null && r.bmi >= 30 && now - r.t <= 365 * DAY);
      const goal = ascvd
        ? { mmol: 1.4, mg: 55, why: `ASCVD ${ascvd.code}`, src: 'ADA 2026 10.27' }
        : dm && age >= 40 && age <= 75 && risk
          ? { mmol: 1.8, mg: 70, why: 'diabetes with another risk factor', src: 'ADA 2026 10.21' }
          : null;
      const thr = goal && byUnit(ldl, goal.mmol, goal.mg);
      if (goal && guardOk && thr !== null && atLeast(ldl, thr)) {
        const statin = statinsNow[0];
        const intensity = statinIntensity(statin);
        add({
          id: 'CG-04',
          kind: 'Treat',
          verb: 'Treat',
          tone: 'red',
          title: 'LDL above goal on statin',
          fact: `LDL ${ldl.shown}${ldl.unit ? ` ${ldl.unit}` : ''} on ${fmtDate(ldl.t)}; goal <${thr} (${goal.why}). Statin: ${statin.name}${
            statin.dose ? ` ${statin.dose}` : ''
          }${intensity ? ` (${intensity} intensity)` : ''}.`,
          action:
            intensity === 'high'
              ? 'Consider adding ezetimibe or refer; LDL above goal'
              : intensity === 'moderate'
                ? 'Intensify to high-intensity statin to reach LDL goal'
                : 'Intensify lipid-lowering therapy to reach LDL goal',
          date: ldl.t,
          rule: `LDL goal <${goal.mmol} mmol/L (${goal.mg} mg/dL), measured ≥4 weeks after the last statin change`,
          src: goal.src,
        });
      }
    }

    if (dm && notPregnant && hb && now - hb.t <= CFG.gap.a1cRecent * DAY) {
      const older = age >= CFG.gap.a1cOlderAge;
      const goal = older ? 7.5 : 7;
      if (a1cAtLeast(hb, goal)) {
        const ifcc = /mmol\/mol/.test(unitOf(hb));
        const tier2 = Number.isFinite(hb.value) && hb.boundSymbol !== '<' && hb.value > a1cThreshold(hb, 10);
        add({
          id: 'CG-05',
          kind: 'Treat',
          verb: 'Treat',
          tone: 'red',
          title: 'HbA1c above usual goal',
          fact: `HbA1c ${hb.shown}${ifcc ? ' mmol/mol' : ''} on ${fmtDate(hb.t)}; usual goal <${a1cThreshold(hb, goal)}${
            ifcc ? ' mmol/mol' : '%'
          } (individualized${older ? '; older adults 7.0–8.0%' : ''}).`,
          action: tier2
            ? 'Intensify treatment now; consider insulin (HbA1c above 10%)'
            : 'Review treatment; intensify without delay',
          date: hb.t,
          more: hasDx(CFG.icd.hbVariant)
            ? 'HbA1c may be unreliable with a haemoglobin variant (ADA 2026 2.4)'
            : '',
          rule: `HbA1c goal <7% (<7.5% from age ${CFG.gap.a1cOlderAge}); do not delay treatment changes`,
          src: `ADA 2026 6.3a, 9.15${older ? ', 13.7a' : ''}${tier2 ? ', 9.20' : ''}`,
        });
      }
    }

    const distinctDays = (rows) => {
      const seen = new Set();
      return rows.filter((r) => {
        const day = new Date(r.t).toDateString();
        if (seen.has(day)) return false;
        seen.add(day);
        return true;
      });
    };
    const bp = distinctDays(
      (vitals || [])
        .filter(
          (r) =>
            r.sys !== null &&
            r.dia !== null &&
            r.sys >= 50 &&
            r.sys <= 300 &&
            r.dia >= 20 &&
            r.dia <= 200 &&
            r.sys > r.dia,
        )
        .sort((a, b) => b.t - a.t),
    );
    const bpYear = bp.filter((r) => now - r.t <= CFG.gap.bpRecent * DAY).slice(0, 4);
    const mean = (k) => bpYear.reduce((a, r) => a + r[k], 0) / (bpYear.length || 1);
    const meanHigh = bpYear.length && (mean('sys') >= 130 || mean('dia') >= 80);
    const bpLatestRecent = bpYear.length && now - bpYear[0].t <= CFG.gap.bpLatest * DAY;
    const bpSpan = bpYear.length
      ? `mean ${Math.round(mean('sys'))}/${Math.round(mean('dia'))} mmHg over ${bpYear.length} days (${fmtDate(
          bpYear[bpYear.length - 1].t,
        )}–${fmtDate(bpYear[0].t)}); latest ${bpYear[0].sys}/${bpYear[0].dia}`
      : '';

    if (
      htn &&
      notPregnant &&
      bpYear.length >= 2 &&
      bpLatestRecent &&
      meanHigh &&
      (bpYear[0].sys >= 130 || bpYear[0].dia >= 80)
    ) {
      add({
        id: 'CG-06',
        kind: 'Treat',
        verb: 'Treat',
        tone: 'red',
        title: 'Blood pressure above usual goal',
        fact: `${bpSpan[0].toUpperCase()}${bpSpan.slice(1)}; individualize.`,
        action: 'Review BP treatment; confirm with home readings',
        date: bpYear[0].t,
        rule: 'Blood pressure goal <130/80 mmHg when it can be safely reached',
        src: 'ADA 2026 10.4, 10.6; AHA/ACC 2025',
      });
    }

    const gdmRecent =
      diagnosesKnown &&
      diagnoses.some((d) => CFG.icd.gdm.test(d.code) && now - (parseDate(d.codedAt) || 0) <= 365 * DAY);
    if (diagnosesKnown && !dm && adult && notPregnant && !gdmRecent) {
      const hbOk = !hasDx(CFG.icd.hbVariant);
      const fpgAbn = (r) => tri(r, byUnit(r, 7.0, 126));
      const a1cAbn = (r) => (a1cAtLeast(r, 6.5) ? true : a1cBelow(r, 6.5) ? false : null);
      const a1cRun = !hbOk
        ? { run: [], decided: true }
        : labs
          ? leadingRun(inWindow(recsFor('a1c'), CFG.gap.lookback), a1cAbn)
          : leadingRun(
              partA1c && now - partA1c.t <= CFG.gap.lookback * DAY ? [{ ...partA1c, check: 'valid' }] : [],
              a1cAbn,
            );
      const fpgRun = labs
        ? leadingRun(inWindow(recsFor('fpg'), CFG.gap.lookback), fpgAbn)
        : { run: [], decided: true };
      const abn = [
        ...a1cRun.run.map((r) => ({ ...r, test: 'HbA1c' })),
        ...fpgRun.run.map((r) => ({ ...r, test: 'Fasting glucose' })),
      ].sort((a, b) => b.t - a.t);
      const day = (t) => new Date(t).toDateString();
      const pair =
        abn.find((a) => abn.some((b) => b !== a && day(a.t) === day(b.t) && a.test !== b.test)) ||
        abn.find((a) => abn.some((b) => day(a.t) !== day(b.t) && Math.abs(a.t - b.t) <= 365 * DAY));
      const meets = !!pair;
      if (abn.length && (meets || (a1cRun.decided && fpgRun.decided))) {
        const shown = abn
          .slice(0, 3)
          .map(
            (r) =>
              `${r.test} ${r.shown}${r.unit && r.test !== 'HbA1c' ? ` ${r.unit}` : ''} on ${fmtDate(r.t)}`,
          )
          .join('; ');
        add({
          id: 'CG-07',
          kind: 'Diagnose',
          verb: 'Confirm diagnosis',
          tone: 'amber',
          title: meets ? 'Possible diabetes — meets ADA criteria' : 'Possible diabetes — repeat to confirm',
          fact: `${shown}; no diabetes code.`,
          action: meets
            ? 'Meets ADA criteria — confirm before coding'
            : 'Repeat HbA1c or fasting glucose to confirm',
          date: abn[0].t,
          rule: 'Diabetes needs two abnormal results (HbA1c ≥6.5% or fasting glucose ≥7.0 mmol/L) unless hyperglycaemia is unequivocal; never coded by the script',
          src: 'ADA 2026 2.1b',
        });
      }
    }

    const ckdCodedAny = hasDx(CFG.icd.ckd) || hasDx(CFG.icd.hypertensiveCkd) || dialysis;
    if (
      labs &&
      diagnosesKnown &&
      !ckdCodedAny &&
      adult &&
      notPregnant &&
      (egfrRun !== 'none' || acrRun !== 'none')
    ) {
      const confirmed = egfrRun === 'confirmed' || acrRun === 'confirmed';
      const single = egfrRun === 'single' || acrRun === 'single';
      if (confirmed || single) {
        const facts = [];
        if (egfrRun === 'confirmed' || egfrRun === 'single') facts.push(egfrText(egfrRunRes.run[0]));
        if (acrRun === 'confirmed' || acrRun === 'single') {
          const a = acrRunRes.run[0];
          facts.push(`ACR ${a.shown} ${a.unit} on ${fmtDate(a.t)}`);
        }
        add({
          id: 'CG-08',
          kind: 'Diagnose',
          verb: 'Confirm diagnosis',
          tone: 'amber',
          title: confirmed ? 'Possible CKD — confirm' : 'Possible CKD — repeat to confirm',
          fact: `${facts.join('; ')}${confirmed ? ' (abnormal for 3 months or more)' : ''}; no CKD code.`,
          action: confirmed ? 'Confirm CKD and stage before coding' : 'Repeat creatinine and ACR in 3 months',
          date:
            Math.max(
              egfrRunRes.run.length ? egfrRunRes.run[0].t : 0,
              acrRunRes.run.length ? acrRunRes.run[0].t : 0,
            ) || null,
          rule: 'CKD = eGFR <60 or albuminuria for 3 months or more; repeat an incidental abnormal result',
          src: 'KDIGO 2024 PP 1.1.3.1, PP 1.1.1.2',
        });
      }
    }

    if (
      diagnosesKnown &&
      medsComplete &&
      !currentMeds(medicines, 'sglt2i').length &&
      egfrOk &&
      !hasDx(CFG.icd.t1d) &&
      egfrNow !== null &&
      egfrNow >= 20
    ) {
      const t2d = hasDx(/^E1[134](?:\.|$)/i);
      const ckdSglt = egfrRun === 'confirmed' || acrRun === 'confirmed' || hasDx(CFG.icd.ckdStage1to4);
      const why = t2d
        ? ckdSglt
          ? 'Type 2 diabetes with CKD'
          : hf
            ? `Type 2 diabetes with heart failure ${hf.code}`
            : ascvd
              ? `Type 2 diabetes with ASCVD ${ascvd.code}`
              : ''
        : !dm && (acrKdRun === 'confirmed' || hf)
          ? hf
            ? `Heart failure ${hf.code}`
            : 'CKD with ACR ≥20 mg/mmol (200 mg/g)'
          : '';
      if (why) {
        add({
          id: 'CG-09',
          kind: 'Treat',
          verb: 'Treat',
          tone: 'red',
          title: 'SGLT2 inhibitor indicated',
          fact: `${why}; ${egfrText(cr)}; no SGLT2 inhibitor ordered in Raqeem in the last 6 months.`,
          action: 'Consider SGLT2 inhibitor for kidney and heart protection',
          date: cr.t,
          rule: 'SGLT2 inhibitor for type 2 diabetes with CKD, heart failure or ASCVD, or CKD with albuminuria, eGFR ≥20',
          src: t2d ? 'ADA 2026 11.7a, 9.8, 10.40b; KDIGO 2024 3.7.1' : 'KDIGO 2024 3.7.2',
        });
      }
    }

    const onRasi = ['acei', 'arb', 'arni'].some((c) => currentMeds(medicines, c).length);
    if (diagnosesKnown && medsComplete && !onRasi && notPregnant && acrRun === 'confirmed') {
      const a = acrRunRes.run[0];
      const a3 = acrAtLeast(a, 'A3') === true;
      if (dm || a3 || acrAtLeast(a, 'A2')) {
        add({
          id: 'CG-10',
          kind: 'Treat',
          verb: 'Treat',
          tone: dm || a3 ? 'red' : 'amber',
          title: 'ACE inhibitor or ARB for albuminuria',
          fact: `ACR ${a.shown} ${a.unit} on ${fmtDate(a.t)} (raised for 3 months or more); no ACE inhibitor or ARB ordered in Raqeem in the last 6 months.`,
          action: `${dm || a3 ? 'Consider' : 'May consider'} ACE inhibitor or ARB; check creatinine and potassium in 2–4 weeks`,
          date: a.t,
          more: demo.gender === 'F' && age <= 50 ? 'Check contraception and pregnancy plans' : '',
          rule: 'ACE inhibitor or ARB for albuminuria with diabetes (A2-A3) or severe albuminuria (A3)',
          src: dm ? 'ADA 2026 11.6a; KDIGO 2024 3.6.3' : a3 ? 'KDIGO 2024 3.6.1' : 'KDIGO 2024 3.6.2',
        });
      }
    }

    const severe = bp.find((r) => now - r.t <= CFG.gap.bpSevereDays * DAY && (r.sys >= 180 || r.dia >= 110));
    if (adult && severe) {
      add({
        id: 'CG-11',
        kind: 'Safety',
        verb: 'Safety check',
        tone: 'red',
        title: 'Severe blood pressure reading',
        fact: `BP ${severe.sys}/${severe.dia} mmHg on ${fmtDate(severe.t)}.`,
        action: 'Repeat BP now; assess symptoms and intensify treatment',
        date: severe.t,
        rule: 'Blood pressure ≥180/110 mmHg needs prompt assessment and treatment',
        src: 'ADA 2026 10.1; AHA/ACC 2025',
      });
    }

    const aceiNow = currentMeds(medicines, 'acei');
    const arbNow = [...currentMeds(medicines, 'arb'), ...currentMeds(medicines, 'arni')];
    if (aceiNow.length && arbNow.length) {
      const items = (medicines && medicines.items) || [];
      const dates = (pred) =>
        items
          .filter((m) => !medStopped(m) && pred(m))
          .map((m) => parseDate(m.date))
          .filter(Boolean);
      const A = dates((m) => medClass(m, 'acei'));
      const B = dates((m) => medClass(m, 'arb') || medClass(m, 'arni'));
      const sameDay = A.some((a) => B.some((b) => new Date(a).toDateString() === new Date(b).toDateString()));
      const overlap = Math.max(...A) > Math.min(...B) && Math.max(...B) > Math.min(...A);
      if (sameDay || overlap) {
        add({
          id: 'CG-12',
          kind: 'Safety',
          verb: 'Safety check',
          tone: 'red',
          title: 'ACE inhibitor and ARB together',
          fact: `${aceiNow[0].name} (${fmtDate(parseDate(aceiNow[0].date))}) and ${arbNow[0].name} (${fmtDate(
            parseDate(arbNow[0].date),
          )}) are both current.`,
          action: 'Avoid ACE inhibitor plus ARB; stop one',
          date: Math.max(...A, ...B),
          rule: 'Avoid any combination of ACE inhibitor, ARB and direct renin inhibitor',
          src: 'KDIGO 2024 Rec 3.6.4',
        });
      }
    }

    const metformin = currentMeds(medicines, 'metformin')[0];
    if (metformin && egfrNow !== null) {
      const stale = now - cr.t > CFG.gap.a1cRecent * DAY;
      const branch =
        egfrNow < 30
          ? ['red', 'Stop metformin (eGFR below 30)']
          : egfrNow < 45
            ? ['amber', 'Review metformin dose (eGFR 30–44: half maximum dose)']
            : egfrNow < 60 && stale && labsComplete
              ? ['amber', 'Check creatinine (metformin with eGFR below 60)']
              : null;
      if (branch) {
        add({
          id: 'CG-13',
          kind: 'Safety',
          verb: 'Safety check',
          tone: branch[0],
          title: 'Metformin and kidney function',
          fact: `${metformin.name}${metformin.dose ? ` ${metformin.dose}` : ''}; ${egfrText(cr)}.`,
          action: branch[1],
          date: cr.t,
          more: 'Repeat creatinine if the result was during an acute illness',
          rule: 'Metformin: stop below eGFR 30, halve the dose at 30–44, check kidney function every 3–6 months below 60',
          src: 'KDIGO 2022 Rec 4.1.1, PP 4.1.2-4.1.3',
        });
      }
    }

    const nsaid = ((medicines && medicines.items) || []).find(
      (m) =>
        !medStopped(m) &&
        medClass(m, 'nsaid') &&
        parseDate(m.date) &&
        now - parseDate(m.date) <= CFG.gap.nsaidDays * DAY,
    );
    const ckdForNsaid = codedCkd || egfrRun === 'confirmed' || (egfrNow !== null && egfrNow < 45);
    if (adult && nsaid && ckdForNsaid) {
      add({
        id: 'CG-14',
        kind: 'Safety',
        verb: 'Safety check',
        tone: 'amber',
        title: 'NSAID with CKD',
        fact: `${nsaid.name} ordered ${fmtDate(parseDate(nsaid.date))}; ${codedCkd ? `CKD ${firstDx(CFG.icd.ckdStage).code}` : egfrText(cr)}.`,
        action: 'Review NSAID; prefer non-NSAID analgesia in CKD',
        date: parseDate(nsaid.date),
        rule: 'Limit nephrotoxic medicines such as NSAIDs in CKD',
        src: 'KDIGO 2024 PP 4.1.1, PP 4.1.3',
      });
    }

    const hypoMed = [...currentMeds(medicines, 'sulfonylurea'), ...currentMeds(medicines, 'insulin')][0];
    if (hypoMed) {
      const lowA1c = age >= 65 && hb && now - hb.t <= CFG.gap.a1cRecent * DAY && a1cBelow(hb, 6.5);
      const lowEgfr = egfrNow !== null && egfrNow < 30;
      if (lowA1c || lowEgfr) {
        add({
          id: 'CG-15',
          kind: 'Safety',
          verb: 'Safety check',
          tone: 'amber',
          title: 'Hypoglycaemia risk',
          fact: `${hypoMed.name}; ${lowA1c ? `age ${age}, HbA1c ${hb.shown} on ${fmtDate(hb.t)}` : egfrText(cr)}.`,
          action: 'Review hypoglycaemia; consider deintensifying sulfonylurea or insulin',
          date: lowA1c ? hb.t : cr.t,
          rule: 'Deintensify hypoglycaemia-causing medicines when the risk of hypoglycaemia is high',
          src: 'ADA 2026 13.14a, 6.4',
        });
      }
    }

    const highBp = bpYear.filter((r) => r.sys >= 130 || r.dia >= 80);
    if (
      diagnosesKnown &&
      !htn &&
      adult &&
      notPregnant &&
      bpYear.length >= 3 &&
      highBp.length >= 3 &&
      meanHigh &&
      bpLatestRecent
    ) {
      const anti = ['acei', 'arb', 'ccb', 'thiazide', 'betaBlocker', 'mra']
        .map((c) => currentMeds(medicines, c)[0])
        .find(Boolean);
      add({
        id: 'CG-16',
        kind: 'Diagnose',
        verb: 'Confirm diagnosis',
        tone: 'amber',
        title: 'Possible hypertension — confirm',
        fact: `${highBp.length} of the last ${bpYear.length} readings were ≥130 systolic or ≥80 diastolic (${bpSpan})${
          anti ? `; on ${anti.name}, no hypertension code` : '; no hypertension code found'
        }.`,
        action: 'Confirm with home or ambulatory BP before coding',
        date: bpYear[0].t,
        rule: 'Hypertension = average ≥130/80 mmHg on two or more occasions; confirm out of the clinic',
        src: 'ADA 2026 10.1; AHA/ACC 2025',
      });
    }

    if (medsComplete && labsComplete && statinsNow.length && statinEv && now - statinEv.t <= 365 * DAY) {
      const from = statinEv.t + CFG.gap.statinCheckFrom * DAY;
      const after = (key) => (checks[key] || []).filter((c) => c.t >= from);
      const done =
        after('ldl').some((c) => c.check === 'valid') ||
        ['tc', 'hdl', 'tg'].every((k) => after(k).some((c) => c.check === 'valid'));
      const unknown = LIPID_KEYS.some((k) => after(k).some((c) => c.check === 'unreadable'));
      if (now >= from && !done && !unknown) {
        const overdue = now > statinEv.t + CFG.gap.statinCheckBy * DAY;
        add({
          id: 'CG-17',
          kind: 'Follow-up',
          verb: 'Order',
          tone: overdue ? 'red' : 'amber',
          title: 'Lipid check after statin change',
          fact: `${statinEv.med.name} ${statinEv.kind === 'start' ? 'started' : 'dose changed'} ${fmtDate(statinEv.t)}${
            statinEv.kind === 'start' ? ' (first statin order in Raqeem in a year)' : ''
          }; no lipid profile since.`,
          action: 'Order lipid profile (4–12 weeks after statin change)',
          due: overdue ? 'overdue' : `by ${fmtDate(statinEv.t + CFG.gap.statinCheckBy * DAY)}`,
          date: statinEv.t,
          rule: 'Lipid profile 4–12 weeks after a statin start or dose change, then yearly',
          src: 'ADA 2026 10.17',
        });
      }
    }

    const bmi = distinctDays(
      (vitals || []).filter((r) => r.bmi !== null && r.bmi >= 10 && r.bmi <= 100).sort((a, b) => b.t - a.t),
    )
      .filter((r) => now - r.t <= CFG.gap.lookback * DAY)
      .slice(0, 3);
    const obese = bmi.filter((r) => r.bmi >= 30);
    if (diagnosesKnown && !hasDx(CFG.icd.obesity) && adult && notPregnant && obese.length >= 2) {
      add({
        id: 'CG-18',
        kind: 'Diagnose',
        verb: 'Confirm diagnosis',
        tone: 'amber',
        title: 'Possible obesity — confirm',
        fact: `BMI ≥30 kg/m² on ${obese.length} of the last ${bmi.length} readings (latest ${bmi[0].bmi} on ${fmtDate(
          bmi[0].t,
        )}); no obesity code found.`,
        action: 'Confirm before coding',
        date: bmi[0].t,
        rule: 'Screen BMI yearly; BMI ≥30 kg/m² is obesity',
        src: 'ADA 2026 8.2a',
      });
    }

    return gaps.sort(
      (a, b) =>
        (a.tone === 'amber') - (b.tone === 'amber') || GAP_VERBS.indexOf(a.verb) - GAP_VERBS.indexOf(b.verb),
    );
  }

  const cacheKey = (pid) => 'rqm-screen-v021:' + pid;

  function cacheGet(pid, key) {
    try {
      const raw = sessionStorage.getItem(cacheKey(pid));

      if (!raw) {
        return null;
      }

      const cached = JSON.parse(raw);

      if (cached.key === key && Date.now() - cached.t < CFG.cacheTtlMs) {
        return cached.display;
      }
    } catch (e) {}

    return null;
  }

  function cachePut(pid, key, display) {
    try {
      sessionStorage.setItem(
        cacheKey(pid),

        JSON.stringify({
          t: Date.now(),
          key,
          display,
        }),
      );
    } catch (e) {}
  }

  function cacheClear(pid) {
    try {
      sessionStorage.removeItem(cacheKey(pid));
    } catch (e) {}
  }

  function injectCss() {
    if (document.getElementById('rqm-css')) {
      return;
    }

    const style = document.createElement('style');

    style.id = 'rqm-css';

    style.textContent = `
      #rqm-chips {
        width:100%;
        display:grid;
        grid-template-columns:auto repeat(4,minmax(138px,1fr)) auto;
        align-items:stretch;
        background:#fff;
        border-top:3px solid #16466f;
        border-bottom:1px solid #b9c4cd;
        box-shadow:0 2px 6px rgba(22,70,111,.14);
        font-family:Roboto,Arial,sans-serif;
      }
      .rqm-screening-lead {
        min-width:126px;
        padding:7px 12px;
        background:#eef3f8;
        border-right:1px solid #d3dce4;
        display:flex;
        flex-direction:column;
        justify-content:center;
        gap:3px;
      }
      .rqm-screening-lead b { color:#16466f; font-size:12px; line-height:1.2; text-transform:uppercase; letter-spacing:.4px; max-width:112px; }
      .rqm-screening-badge { align-self:flex-start; border-radius:10px; padding:2px 9px; font-size:12px; font-weight:700; white-space:nowrap; }
      .rqm-screening-cell {
        position:relative;
        min-width:0;
        padding:7px 10px;
        border:0;
        border-left:4px solid var(--rqm-accent);
        border-right:1px solid #fff;
        background:var(--rqm-bg);
        font:inherit;
        text-align:left;
        display:grid;
        grid-template-columns:auto minmax(0,1fr);
        grid-template-areas:"icon mode" "icon copy";
        align-items:center;
        column-gap:8px;
        row-gap:2px;
        color:#1f2933;
        cursor:help;
      }
      .rqm-screening-cell:hover,.rqm-screening-cell:focus { box-shadow:inset 0 0 0 2px var(--rqm-accent); outline:0; }
      .rqm-screening-icon { grid-area:icon; flex:none; width:18px; height:18px; border-radius:50%; background:var(--rqm-accent); color:#fff; display:flex; align-items:center; justify-content:center; font-style:normal; font-weight:800; font-size:11px; line-height:1; }
      .rqm-mode { grid-area:mode; justify-self:start; border-radius:3px; padding:0 5px; font-size:9.5px; font-weight:800; letter-spacing:.5px; line-height:15px; }
      .rqm-mode-screening { color:#164f7a; background:#fff; border:1px solid #b7cde0; }
      .rqm-mode-followup { color:#fff; background:#5a3d8a; border:1px solid #5a3d8a; }
      .rqm-screening-copy { grid-area:copy; min-width:0; display:flex; flex-direction:column; }
      .rqm-screening-copy b { font-size:13px; line-height:1.25; color:#14202b; }
      .rqm-screening-state { color:var(--rqm-fg); font-size:12px; font-weight:800; }
      .rqm-screening-note { color:#3b4752; font-size:11px; line-height:1.3; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
      .rqm-screening-pop {
        position:absolute;
        top:calc(100% + 7px);
        left:7px;
        z-index:1000000;
        width:320px;
        padding:9px 11px;
        background:#fff;
        border:1px solid #cfd7dd;
        border-top:3px solid var(--rqm-accent);
        border-radius:7px;
        box-shadow:0 10px 28px rgba(31,55,72,.22);
        color:#293640;
        font-size:12px;
        line-height:1.45;
        white-space:normal;
      }
      .rqm-screening-pop[hidden] { display:none; }
      .rqm-pop-right { left:auto; right:7px; }
      .rqm-screening-pop b { display:block; margin-bottom:4px; color:var(--rqm-fg); }
      .rqm-screening-pop span { display:block; margin-top:3px; }
      .rqm-screening-actions { display:flex; align-items:center; gap:6px; padding:0 10px; white-space:nowrap; }
      .rqm-btn { height:33px; padding:0 12px; border-radius:6px; border:1px solid #c9d2d9; background:#fff; color:#2c3a46; font:600 12px/1 Roboto,Arial,sans-serif; cursor:pointer; }
      .rqm-btn:disabled { opacity:.55; cursor:wait; }
      .rqm-btn-primary { border-color:#16466f; background:#16466f; color:#fff; }
      .rqm-btn-add { border:1.5px solid #c0392b; color:#a3261d; }
      @media(max-width:900px) {
        #rqm-chips { display:flex; overflow-x:auto; }
        .rqm-screening-lead { flex:0 0 126px; }
        .rqm-screening-cell { flex:1 0 172px; }
        .rqm-screening-actions { flex:0 0 auto; }
      }
      #rqm-modal-backdrop {
        position:fixed;
        inset:0;
        background:rgba(0,0,0,.35);
        z-index:999998;
        display:flex;
        align-items:center;
        justify-content:center;
      }
      #rqm-modal {
        width:min(1120px,calc(100vw - 32px));
        height:min(900px,calc(100vh - 40px));
        display:flex;
        flex-direction:column;
        overflow:hidden;
        background:#fff;
        border-radius:10px;
        box-shadow:0 14px 40px rgba(0,0,0,.3);
        z-index:999999;
        font:13px/1.4 "Segoe UI",Roboto,Arial,sans-serif;
        color:#1f2933;
        text-align:left;
      }
      #rqm-modal [hidden] { display:none !important; }
      #rqm-modal b { font-weight:600; }
      #rqm-modal button { font-family:inherit; cursor:pointer; }
      .rqm-sr { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; }
      .rqm-dt-head { display:flex; align-items:center; gap:16px; padding:6px 6px 6px 18px; border-bottom:1px solid #e1e6ea; flex:none; }
      .rqm-dt-head h2 { margin:0; font-size:17px; font-weight:700; color:#14202b; }
      .rqm-dt-head h2 span { font-weight:400; color:#3b4752; margin-left:8px; font-size:15px; }
      .rqm-asof { margin-left:auto; color:#5f6b76; font-size:12.5px; }
      .rqm-dt-x { width:44px; height:44px; border:0; background:none; font-size:24px; line-height:1; color:#3b4752; border-radius:6px; flex:none; }
      .rqm-dt-x.rqm-dt-rf { font-size:19px; }
      .rqm-dt-x:hover { background:#eef1f3; }
      .rqm-dt-known { display:flex; flex-wrap:wrap; gap:2px 20px; padding:7px 18px; background:#f7f9fa; border-bottom:1px solid #e9edf0; font-size:12.5px; color:#3b4752; flex:none; overflow-wrap:anywhere; }
      .rqm-dt-known b { color:#1f2933; }
      .rqm-dt-tabs { display:flex; gap:2px; padding:0 10px; border-bottom:1px solid #d6dce1; overflow-x:auto; flex:none; }
      .rqm-dt-tab { min-height:44px; padding:0 18px; border:0; border-bottom:3px solid transparent; background:none; font:600 14px "Segoe UI",Roboto,Arial,sans-serif; color:#4f5b66; white-space:nowrap; }
      .rqm-dt-tab[aria-selected=true] { color:#16466f; border-bottom-color:#16466f; }
      .rqm-dt-tab:hover { color:#16466f; background:#f2f6f9; }
      .rqm-dt-tab:focus-visible,.rqm-dt-panel:focus-visible,.rqm-dt-x:focus-visible,.rqm-dt-btn:focus-visible,.rqm-smk label:focus-within,.rqm-pick-btn:focus-visible { outline:2px solid #2f6fa3; outline-offset:-2px; }
      .rqm-dt-body { flex:1; min-height:0; overflow:auto; padding:10px 18px 16px; }
      .rqm-dt-note,.rqm-care-head,.rqm-dt-progress { margin:0 0 10px; padding:6px 10px; border-left:3px solid #4f5f6a; color:#33434e; font-size:12.8px; background:#f3f5f7; }
      .rqm-cg,.rqm-rl,.rqm-dt-t,.rqm-every { width:100%; border-collapse:collapse; border-spacing:0; font-size:13px; }
      .rqm-cg thead th,.rqm-rl thead th,.rqm-dt-t thead th { text-align:left; font-weight:600; color:#4f5b66; font-size:12px; padding:7px 10px; border-bottom:1px solid #cfd7dd; background:#f4f6f8; }
      .rqm-cg td,.rqm-rl td,.rqm-dt-t td { padding:8px 10px; border-bottom:1px solid #e9edf0; vertical-align:top; text-align:left; }
      .rqm-cg td:first-child { padding-left:14px; }
      .rqm-cg tr.red>td:first-child { box-shadow:inset 4px 0 #c0392b; }
      .rqm-cg tr.amber>td:first-child { box-shadow:inset 4px 0 #c77800; }
      .rqm-cg .rqm-ac { width:250px; }
      .rqm-cg .rqm-ru { width:270px; color:#4f5b66; font-size:12.5px; }
      .rqm-cg .rqm-src { width:150px; color:#5f6b76; font-size:12px; overflow-wrap:anywhere; }
      .rqm-grp th { text-align:left; padding:14px 10px 4px; font-size:12.5px; font-weight:600; color:#16466f; text-transform:uppercase; letter-spacing:.04em; border-bottom:1px solid #cfd7dd; background:#fff; }
      .rqm-cg tbody:first-of-type .rqm-grp th { padding-top:8px; }
      .rqm-due { display:block; font-size:12.5px; font-weight:600; margin-top:1px; }
      .rqm-care-row.red .rqm-due { color:#9b1c13; }
      .rqm-care-row.amber .rqm-due { color:#7a4700; }
      .rqm-ex { display:block; color:#4f5b66; font-size:12.5px; margin-top:1px; }
      .rqm-ab { color:#b3261e; }
      .rqm-unread { color:#5f6973; font-weight:600; }
      .rqm-u { color:#5f6b76; font-weight:400; font-size:12px; }
      .rqm-dd { display:block; color:#5f6b76; font-size:12px; margin-top:1px; }
      .rqm-split { display:grid; grid-template-columns:minmax(0,1.15fr) minmax(0,1fr); gap:16px; align-items:start; }
      .rqm-rl .rqm-grp th { padding:12px 10px 4px; }
      .rqm-rl .rqm-tn { font-weight:600; }
      .rqm-rl .rqm-rg { color:#4f5b66; overflow-wrap:anywhere; }
      .rqm-pick { cursor:pointer; }
      .rqm-pick:hover td { background:#f2f6f9; }
      .rqm-pick.selected td { background:#e8f0f7; }
      .rqm-pick.selected td:first-child { box-shadow:inset 4px 0 #16466f; }
      .rqm-pick-btn { display:block; width:100%; min-height:32px; padding:0; border:0; background:transparent; color:inherit; font:inherit; font-weight:600; text-align:left; }
      .rqm-rpane { position:sticky; top:0; border:1px solid #d6dce1; border-radius:6px; padding:4px 12px 10px; }
      .rqm-gh { margin:6px 0 2px; font-size:13px; color:#33434e; }
      .rqm-every { margin-top:6px; }
      .rqm-every td,.rqm-every th { padding:5px 8px; border-bottom:1px solid #e9edf0; text-align:left; }
      .rqm-every thead th { font-size:12px; color:#4f5b66; background:#f4f6f8; font-weight:600; }
      .rqm-erow { display:none; }
      .rqm-vcard { border:1px solid #e3e7ea; border-radius:6px; padding:10px 12px 4px; margin:0 0 12px; }
      .rqm-vh { display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; }
      .rqm-vh b { font-size:14px; }
      .rqm-vh span { font-weight:600; font-variant-numeric:tabular-nums; }
      .rqm-vs { margin:2px 0 4px; color:#5f6b76; font-size:12.5px; }
      .rqm-vs span { margin-right:18px; }
      .rqm-lg { display:inline-block; width:16px; height:3px; vertical-align:middle; margin:0 5px 0 0; }
      .rqm-vgrid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
      .rqm-medt .rqm-mn { width:30%; font-weight:600; }
      .rqm-st-active { color:#1d5c37; font-weight:600; }
      .rqm-st-other { color:#5f6973; }
      .rqm-calc .rqm-cn1 { width:14%; }
      .rqm-calc .rqm-res { width:16%; }
      .rqm-calc .rqm-bd { width:18%; }
      .rqm-calc .rqm-src { width:13%; font-size:12.5px; }
      .rqm-big { font-size:20px; font-weight:600; font-variant-numeric:tabular-nums; color:#14202b; }
      .rqm-band { display:block; font-weight:600; padding-left:8px; border-left:4px solid; }
      .rqm-band.green { color:#1d5c37; border-color:#2e7d4f; }
      .rqm-band.amber { color:#7a4700; border-color:#c77800; }
      .rqm-band.red { color:#9b1c13; border-color:#c0392b; }
      .rqm-band.grey { color:#4f5961; border-color:#7b858d; }
      .rqm-band2 { display:block; padding-left:12px; color:#4f5b66; font-size:12.5px; margin-top:2px; }
      .rqm-sub2 { display:block; color:#4f5b66; font-size:12.5px; margin-top:2px; }
      .rqm-inp { margin:0; padding:0; list-style:none; color:#3b4752; font-size:12.5px; }
      .rqm-inp li { margin:0 0 2px; }
      .rqm-miss { display:block; color:#33434e; font-size:12.5px; }
      .rqm-src a,.rqm-calc a { color:#1d5b8f; }
      #rqm-modal a.rqm-dt-btn { display:inline-flex; align-items:center; min-height:44px; padding:0 16px; border-radius:6px; background:#16466f; color:#fff; text-decoration:none; font-weight:600; }
      .rqm-smk { border:0; padding:0; margin:6px 0 0; display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
      .rqm-smk legend { font-size:12.5px; font-weight:600; color:#33434e; padding:0; margin-bottom:4px; float:left; width:100%; }
      .rqm-smk legend span { font-weight:400; color:#5f6b76; }
      .rqm-smk label { box-sizing:border-box; display:inline-flex; align-items:center; gap:6px; min-height:44px; min-width:72px; padding:0 10px; border:1px solid #c9d2d9; border-radius:6px; cursor:pointer; font-size:13px; }
      .rqm-smk input { width:18px; height:18px; margin:0; }
      .rqm-smk label:has(input:checked) { border-color:#16466f; background:#eef3f8; }
      @media(max-width:700px) {
        .rqm-rpane { display:none; }
        .rqm-split { grid-template-columns:1fr; }
        .rqm-erow:not([hidden]) { display:table-row; }
        .rqm-erow td { padding:4px 0 10px; }
        .rqm-rl .rqm-rg { display:none; }
        .rqm-rl th,.rqm-rl td { padding:7px 6px; }
        #rqm-modal { width:calc(100vw - 8px); height:calc(100vh - 12px); border-radius:8px; }
        .rqm-dt-head { padding-left:12px; gap:8px; }
        .rqm-dt-head h2 { font-size:16px; }
        .rqm-dt-head h2 span { font-size:14px; margin-left:4px; }
        .rqm-asof { display:none; }
        .rqm-dt-head h2 { white-space:nowrap; }
        .rqm-dt-head .rqm-dt-x { margin-left:auto; }
        .rqm-dt-known { padding:6px 12px; font-size:12px; gap:0 12px; }
        .rqm-dt-tabs { padding:0 2px; gap:0; }
        .rqm-dt-tab { flex:1 0 auto; padding:0 7px; font-size:13px; }
        .rqm-dt-body { padding:8px 10px 12px; }
        .rqm-cg>thead { display:none; }
        .rqm-cg,.rqm-cg>tbody,.rqm-cg>tbody>tr,.rqm-cg>tbody>tr>td,.rqm-cg>tbody>tr>th { display:block; width:auto !important; }
        .rqm-cg>tbody>tr { padding:8px 4px 8px 12px; border-bottom:1px solid #e9edf0; }
        .rqm-cg>tbody>tr>td,.rqm-cg>tbody>tr>th { border:0 !important; padding:1px 0 !important; box-shadow:none !important; }
        .rqm-cg>tbody>tr.red { box-shadow:inset 4px 0 #c0392b; }
        .rqm-cg>tbody>tr.amber { box-shadow:inset 4px 0 #c77800; }
        .rqm-cg .rqm-ac b { font-size:14px; }
        .rqm-cg .rqm-ru { padding-top:3px !important; }
        .rqm-cg .rqm-grp { padding:0 !important; border:0 !important; }
        .rqm-cg .rqm-grp th { padding:14px 0 4px !important; border-bottom:1px solid #cfd7dd !important; }
        .rqm-dt-t,.rqm-dt-t tbody,.rqm-dt-t tr,.rqm-dt-t td { display:block; width:auto !important; }
        .rqm-dt-t thead { display:none; }
        .rqm-dt-t tr { border-bottom:1px solid #e3e7ea; padding:8px 2px; }
        .rqm-dt-t td { border:0; padding:2px 0; }
        .rqm-dt-t td[data-l] { display:grid; grid-template-columns:76px minmax(0,1fr); gap:8px; }
        .rqm-dt-t td>div { min-width:0; }
        .rqm-dt-t td[data-l]::before { content:attr(data-l); color:#6b7680; font-size:12px; }
        .rqm-dt-t .rqm-mn,.rqm-calc .rqm-cn1 b { font-size:14.5px; }
        .rqm-vgrid { grid-template-columns:1fr; }
        .rqm-vcard svg { display:block; height:auto; }
        .rqm-screening-pop { position:fixed; top:92px; left:12px !important; right:12px !important; width:auto; }
      }
    `;

    document.head.appendChild(style);
  }

  function parseRange(text, gender) {
    let s = String(text || '')
      .replace(/<[a-z/][^>]*>/gi, ' ')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&nbsp;|&amp;/gi, ' ')
      .replace(/(\d),(\d{3})(?!\d)/g, '$1$2')
      .replace(/\d+(?:\.\d+)?\s*[-–]\s*\d+(?:\.\d+)?\s*(?:y|yrs?|years?|سنة)(?![a-z])/gi, ' ');

    const SEX = /(female|male|أنثى|انثى|ذكر)/i;

    if (SEX.test(s)) {
      if (gender !== 'M' && gender !== 'F') {
        return null;
      }

      const parts = s.split(SEX);

      let pick = null;

      for (let i = 1; i < parts.length; i += 2) {
        const female = /^(female|أنثى|انثى)$/i.test(parts[i]);

        if ((gender === 'F') === female) {
          pick = parts[i + 1];

          break;
        }
      }

      if (pick === null) {
        return null;
      }

      s = pick;
    }

    const N = '(-?\\d+(?:\\.\\d+)?|-?\\.\\d+)';

    const found = [];

    const band = s.match(new RegExp(N + '\\s*[-–]\\s*' + N));

    if (band && +band[1] < +band[2]) {
      found.push({ i: band.index, lo: +band[1], hi: +band[2] });
    }

    const below = s.match(new RegExp('<\\s*=?\\s*' + N));

    if (below) {
      found.push({ i: below.index, lo: null, hi: +below[1] });
    }

    const above = s.match(new RegExp('>\\s*=?\\s*' + N));

    if (above) {
      found.push({ i: above.index, lo: +above[1], hi: null });
    }

    found.sort((a, b) => a.i - b.i);

    return found.length ? { lo: found[0].lo, hi: found[0].hi } : null;
  }

  function fitLine(points) {
    const p = points.filter((x) => typeof x.value === 'number' && !x.bound);

    const units = new Set(
      p
        .map((x) =>
          String(x.unit || '')
            .toLowerCase()
            .replace(/\s+/g, ''),
        )
        .filter(Boolean),
    );

    if (units.size > 1) {
      return null;
    }

    if (p.length < 3) {
      return null;
    }

    if (Math.max(...p.map((x) => x.t)) - Math.min(...p.map((x) => x.t)) < CFG.trendMinSpanDays * DAY) {
      return null;
    }

    const YEAR = 365.25 * DAY;

    const mx = p.reduce((a, x) => a + x.t, 0) / p.length;

    const my = p.reduce((a, x) => a + x.value, 0) / p.length;

    let sxx = 0;
    let sxy = 0;

    for (const x of p) {
      sxx += (x.t - mx) ** 2;
      sxy += (x.t - mx) * (x.value - my);
    }

    if (!sxx) {
      return null;
    }

    const perMs = sxy / sxx;

    return { perYear: perMs * YEAR, at: (t) => my + perMs * (t - mx) };
  }

  async function trendSeries(ctx, labs, key, gender) {
    const rule = CFG.labs[key];

    const reads = (labs.reads = labs.reads || new Map());

    const since = Date.now() - CFG.trendDays * DAY;

    const sorted = (labs.items || [])
      .filter((it) => it.status === 'resulted' && labMatches(it, rule))
      .map((it) => ({ it, t: parseDate(it.resultAt) || parseDate(it.date) }))
      .filter((c) => c.t && c.t >= since)
      .sort((a, b) => b.t - a.t);

    const perName = new Map();

    const picked =
      key === 'dm'
        ? sorted.filter((c) => {
            const g = dmName(c.it.name);

            perName.set(g, (perName.get(g) || 0) + 1);

            return perName.get(g) <= CFG.trendPoints;
          })
        : sorted.slice(0, CFG.trendPoints);

    const rows = await Promise.all(
      picked.map(async (c) => {
        if (!reads.has(c.it.itemuid)) {
          reads.set(c.it.itemuid, readResult(ctx, c.it));
        }

        const lr = await reads.get(c.it.itemuid);

        const rec = valueOf(lr, rule, key);

        return {
          t: (lr && (parseDate(lr.resultdate) || parseDate(lr.approvaldate))) || c.t,
          value: rec.value,
          shown: rec.shown,
          bound: rec.bound,
          bad: rec.check === 'valid' ? null : rec.check === 'invalid' ? 'NA' : 'Not read',
          unit: rec.unit,
          name: rec.short || dmName(c.it.name),
          range: parseRange(rec.rangeText, gender),
        };
      }),
    );

    const groups = new Map();

    for (const r of rows.filter((x) => x.t >= since).sort((a, b) => b.t - a.t)) {
      const g = groups.get(r.name) || [];

      if (g.length < CFG.trendPoints) {
        g.push(r);
      }

      groups.set(r.name, g);
    }

    return [...groups.entries()].map(([name, pts]) => ({
      name,
      points: pts.slice().reverse(),
      range: (pts.find((p) => p.range) || {}).range || null,
    }));
  }

  async function fetchBpSeries(ctx) {
    const cached = S.vitalsFor && S.vitalsFor.pid === ctx.patientuid ? S.vitalsFor.rows : null;
    const rows = Array.isArray(cached) ? cached : await fetchVitals(ctx);
    if (!rows) return null;

    const valid = rows.filter(
      (r) =>
        r.sys !== null &&
        r.dia !== null &&
        r.sys >= 50 &&
        r.sys <= 300 &&
        r.dia >= 20 &&
        r.dia <= 200 &&
        r.sys > r.dia,
    );

    const days = new Set();

    return valid
      .sort((a, b) => b.t - a.t)
      .filter((row) => {
        const d = new Date(row.t).toDateString();

        return days.has(d) ? false : days.add(d);
      })
      .slice(0, CFG.trendPoints)
      .reverse();
  }

  const SVGNS = 'http://www.w3.org/2000/svg';

  function svgEl(tag, attrs, text) {
    const n = document.createElementNS(SVGNS, tag);

    for (const [k, v] of Object.entries(attrs || {})) {
      n.setAttribute(k, String(v));
    }

    if (text !== undefined) {
      n.textContent = String(text);
    }

    return n;
  }

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const shortDate = (t) => {
    const d = new Date(t);

    return `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
  };

  function drawChart(series, range, W = 440) {
    const H = 165;
    const L = 40;
    const R = 14;
    const T = 18;
    const B = 24;

    const pts = series.flatMap((s) => s.points);

    const vals = pts.filter((p) => typeof p.value === 'number').map((p) => p.value);

    if (range && range.lo !== null) {
      vals.push(range.lo);
    }

    if (range && range.hi !== null) {
      vals.push(range.hi);
    }

    let lo = vals.length ? Math.min(...vals) : 0;
    let hi = vals.length ? Math.max(...vals) : 1;

    const nonNegative = lo >= 0;

    const pad = (hi - lo || Math.abs(hi) || 1) * 0.15;

    const raw = (hi - lo + 2 * pad) / 3;

    const mag = 10 ** Math.floor(Math.log10(raw));

    const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((x) => x >= raw);

    lo = Math.floor((lo - pad) / step) * step;
    hi = Math.ceil((hi + pad) / step) * step;

    if (nonNegative) {
      lo = Math.max(0, lo);
    }

    const dec = (String(+step.toPrecision(3)).split('.')[1] || '').length;

    const t0 = Math.min(...pts.map((p) => p.t));
    const t1 = Math.max(...pts.map((p) => p.t));

    const IN = 22;

    const X = (t) => (t1 === t0 ? (L + W - R) / 2 : L + IN + ((t - t0) / (t1 - t0)) * (W - L - R - 2 * IN));
    const Y = (v) => T + ((hi - v) / (hi - lo)) * (H - T - B);

    const svg = svgEl('svg', {
      viewBox: `0 0 ${W} ${H}`,
      width: '100%',
      'font-family': 'Roboto,Arial,sans-serif',
      'font-size': 10,
    });

    if (range && (range.lo !== null || range.hi !== null)) {
      const top = Y(range.hi !== null ? Math.min(range.hi, hi) : hi);
      const bottom = Y(range.lo !== null ? Math.max(range.lo, lo) : lo);

      svg.appendChild(
        svgEl('rect', {
          x: L,
          y: top,
          width: W - L - R,
          height: Math.max(bottom - top, 1),
          fill: '#2e7d32',
          opacity: 0.09,
        }),
      );
    }

    for (let v = lo; v <= hi + step / 2; v += step) {
      svg.appendChild(svgEl('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v), stroke: '#e6e9ed' }));
      svg.appendChild(
        svgEl('text', { x: L - 6, y: Y(v) + 3, 'text-anchor': 'end', fill: '#6b7785' }, v.toFixed(dec)),
      );
    }

    let lastX = -1e9;

    for (const p of series[0].points) {
      if (X(p.t) - lastX < 42) {
        continue;
      }

      lastX = X(p.t);

      svg.appendChild(
        svgEl('text', { x: X(p.t), y: H - 6, 'text-anchor': 'middle', fill: '#6b7785' }, shortDate(p.t)),
      );
    }

    for (const s of series) {
      const good = s.points.filter((p) => typeof p.value === 'number' && !p.bound);

      const fit = fitLine(good);

      if (fit) {
        svg.appendChild(
          svgEl('line', {
            x1: X(good[0].t),
            y1: Y(fit.at(good[0].t)),
            x2: X(good[good.length - 1].t),
            y2: Y(fit.at(good[good.length - 1].t)),
            stroke: s.color,
            'stroke-width': 1.3,
            'stroke-dasharray': '5 4',
            opacity: 0.6,
          }),
        );
      }

      if (good.length > 1) {
        svg.appendChild(
          svgEl('polyline', {
            fill: 'none',
            stroke: s.color,
            'stroke-width': 2,
            points: good.map((p) => `${X(p.t).toFixed(1)},${Y(p.value).toFixed(1)}`).join(' '),
          }),
        );
      }

      let prevX = -1e9;

      let below = false;

      for (const p of s.points) {
        if (typeof p.value === 'number') {
          below = X(p.t) - prevX < 30 ? !below : false;

          prevX = X(p.t);

          svg.appendChild(
            svgEl(
              'circle',
              p.bound
                ? { cx: X(p.t), cy: Y(p.value), r: 3.6, fill: '#fff', stroke: s.color, 'stroke-width': 1.6 }
                : { cx: X(p.t), cy: Y(p.value), r: 3.6, fill: s.color, stroke: '#fff' },
            ),
          );
          svg.appendChild(
            svgEl(
              'text',
              {
                x: X(p.t),
                y: below ? Y(p.value) + 15 : Y(p.value) - 8,
                'text-anchor': 'middle',
                fill: '#1f2933',
                'font-weight': 600,
              },
              p.shown || String(p.value),
            ),
          );
        } else {
          const y = H - B - 6;

          svg.appendChild(
            svgEl('circle', {
              cx: X(p.t),
              cy: y,
              r: 4,
              fill: '#fff',
              stroke: '#c62828',
              'stroke-width': 1.6,
            }),
          );
          svg.appendChild(
            svgEl(
              'text',
              { x: X(p.t), y: y - 8, 'text-anchor': 'middle', fill: '#c62828', 'font-weight': 600 },
              p.bad || 'NA',
            ),
          );
        }
      }
    }

    return svg;
  }

  function trendNote(points, range) {
    const good = points.filter((p) => typeof p.value === 'number');

    const parts = [];

    if (good.length) {
      const last = good[good.length - 1];

      parts.push(`Latest ${last.shown || last.value} · ${fmtDate(last.t)}`);
    }

    const fit = fitLine(good);

    if (fit) {
      const arrow = fit.perYear > 0 ? '↑' : fit.perYear < 0 ? '↓' : '→';

      parts.push(`${arrow} ${fit.perYear > 0 ? '+' : ''}${fmtNum(fit.perYear)}/yr`);
    }

    if (range && (range.lo !== null || range.hi !== null)) {
      parts.push(
        'Lab range ' +
          (range.lo !== null && range.hi !== null
            ? `${range.lo}–${range.hi}`
            : range.hi !== null
              ? `< ${range.hi}`
              : `> ${range.lo}`),
      );
    }

    return parts.join(' · ');
  }

  function trendCard(title, series, note, width) {
    const card = document.createElement('div');

    card.className = 'rqm-trend';

    const head = document.createElement('div');

    head.className = 'rqm-trend-head';

    const name = document.createElement('b');

    name.textContent = title;

    const meta = document.createElement('span');

    meta.textContent = note;

    head.appendChild(name);

    head.appendChild(meta);

    card.appendChild(head);

    card.appendChild(drawChart(series, series[0].range || null, width));

    return card;
  }

  function trendMsg(box, text) {
    box.textContent = '';

    const m = document.createElement('div');

    m.className = 'rqm-trend-msg';

    m.textContent = text;

    box.appendChild(m);
  }

  const TREND_TESTS = {
    dm: ['dm'],
    dlp: ['tc', 'ldl', 'hdl', 'tg'],
    ckd: ['acr', 'creatinine'],
  };

  const LINE = '#1f4e79';

  async function loadTrends(modal, boxes, pid) {
    const ctx = { ...S.ctx };

    const alive = () => document.getElementById('rqm-modal') === modal && S.ctx.patientuid === pid;

    const quit = () => {
      if (document.getElementById('rqm-modal') === modal && S.ctx.patientuid !== pid) {
        const b = document.getElementById('rqm-modal-backdrop');

        if (b) {
          b.remove();
        }
      }
    };

    const demo = readBanner();

    const gender = demo ? demo.gender : null;

    let labs = S.labsFor && S.labsFor.pid === pid ? S.labsFor.labs : null;

    const bpPromise = fetchBpSeries(ctx).catch((e) => {
      log('bp', e && e.message);

      return null;
    });

    if (!labs) {
      const [visits, fit] = await Promise.all([fetchVisits(ctx), fetchFitResults(ctx)]);

      labs = await fetchLabHistory(ctx, visits);

      if (!labs) return;
      if (fit) {
        labs.items.push(...fit);
      }

      labs.fitFailed = !fit;

      if (!visits) {
        labs.complete = false;
      }
    }

    const partial = labs.complete === false;

    for (const [cond, keys] of Object.entries(TREND_TESTS)) {
      const box = boxes[cond];

      if (!box) {
        continue;
      }

      const all = [];

      for (const key of keys) {
        all.push(...(await trendSeries(ctx, labs, key, gender)));
      }

      if (!alive()) {
        return quit();
      }

      box.textContent = '';

      if (!all.length) {
        trendMsg(
          box,
          partial ? 'Could not read the lab history - press Refresh.' : 'No results in the last 3 years.',
        );

        continue;
      }

      for (const s of all) {
        box.appendChild(
          trendCard(
            s.name,
            [{ points: s.points, color: LINE, range: s.range }],
            trendNote(s.points, s.range),
          ),
        );
      }

      if (partial) {
        const m = document.createElement('div');

        m.className = 'rqm-trend-msg';

        m.textContent = 'Some results could not be read - press Refresh.';

        box.appendChild(m);
      }
    }

    if (boxes.crc) {
      const since = Date.now() - CFG.trendDays * DAY;

      const fits = (labs.items || [])
        .filter((it) => it.status === 'resulted' && labMatches(it, CFG.labs.fit))
        .map((it) => parseDate(it.resultAt) || parseDate(it.date))
        .filter((t) => t && t >= since)
        .sort((a, b) => a - b)
        .map(fmtDate)
        .filter((d, i, arr) => arr.indexOf(d) === i)
        .slice(-CFG.trendPoints);

      if (!alive()) {
        return quit();
      }

      trendMsg(
        boxes.crc,
        fits.length
          ? 'FIT results in the last 3 years: ' + fits.join(' · ')
          : partial || labs.fitFailed
            ? 'Could not read FIT results - press Refresh.'
            : 'No FIT result in the last 3 years.',
      );
    }

    const bp = await bpPromise;

    if (!alive() || !boxes.bp) {
      return quit();
    }

    boxes.bp.textContent = '';

    if (!bp) {
      trendMsg(boxes.bp, 'Could not read blood pressure - press Refresh.');
    } else if (!bp.length) {
      trendMsg(boxes.bp, 'No blood pressure readings in the last 3 years.');
    } else {
      const sys = bp.map((r) => ({ t: r.t, value: r.sys }));

      const dia = bp.map((r) => ({ t: r.t, value: r.dia }));

      const last = bp[bp.length - 1];

      const fs = fitLine(sys);

      const fd = fitLine(dia);

      const slope = (f) =>
        f ? ` ${f.perYear > 0 ? '↑ +' : f.perYear < 0 ? '↓ ' : '→ '}${fmtNum(f.perYear)}/yr` : '';

      boxes.bp.appendChild(
        trendCard(
          'Systolic / diastolic (mmHg)',
          [
            { points: sys, color: LINE },
            { points: dia, color: '#7a9cc6' },
          ],
          `Latest ${last.sys}/${last.dia} · ${fmtDate(last.t)} · Systolic${slope(fs)} · Diastolic${slope(fd)}`,
          900,
        ),
      );
    }
  }

  function partText(p, followup = false) {
    const w = p.window || {};

    if (p.state === 'pending') {
      return (
        `${p.label}: Ordered - result pending` +
        (p.pending && p.pending.t ? ` · Ordered ${fmtDate(p.pending.t)}` : '')
      );
    }

    if (p.state === 'invalid' || p.state === 'unreadable') {
      return (
        `${p.label}: ${STATE[p.state].label}` + (w.bad && w.bad.t ? ` · Result ${fmtDate(w.bad.t)}` : '')
      );
    }

    if (w.status === 'missing') {
      return `${p.label}: Not found`;
    }

    if (w.status === 'expired') {
      return `${p.label}: Expired · Last ${fmtDate(w.lastDate)}`;
    }

    if (w.status === 'dueSoon') {
      return `${p.label}: Due in ${w.remainingDays} days · Last ${fmtDate(w.lastDate)}`;
    }

    return `${p.label}: ${followup ? 'Up to date' : 'Screened'} · Last ${fmtDate(w.lastDate)}`;
  }

  function detailLines(res) {
    if (res.state === 'excluded') {
      return [res.why || 'Not eligible'];
    }

    const lines = [];

    if (res.details && res.details.reason) {
      lines.push(res.details.reason);
    }

    if (res.details && res.details.sourceDx && res.details.sourceDx.length) {
      lines.push('Eligibility source: ' + res.details.sourceDx.join(' + '));
    }

    if (res.details && res.details.parts) {
      for (const p of res.details.parts) {
        lines.push(partText(p, res.mode === 'followup'));
      }
    } else {
      lines.push(res.why || 'No data');
    }

    return lines;
  }

  const AR_DAY = 86400000;
  const AR_WINDOW_DAYS = 3 * 365;
  const AR_MAX_PAGES = 10;
  const AR_CONCURRENCY = 4;
  const AR_PAGE_LIMIT = 50;

  const AR_STATUS = {
    resulted: ['579b0cb3f3fd3fa90b83e339', '5d1c30ebcd65741feb09d709', 'ORDSTS12', 'ORDSTS36'],
    dropped: [
      '579b0bcbf3fd3fa90b83e32f',
      '611cdc3ceab0e53328ec49fc',
      '579b0c5af3fd3fa90b83e334',
      'ORDSTS4',
      'REJECTED',
      'ORDSTS8',
    ],
  };

  const AR_UNIT_TAIL = /\s*(?:mg\/dl|mg\/l|mmol\/l|[u\u00b5]mol\/l|mg\/mmol|mg\/g|%)\s*$/i;
  const AR_NUMBER = /^(<=|>=|<|>|=)?\s*(-?(?:\d+(?:\.\d+)?|\.\d+))$/;

  function arText(s) {
    return String(s == null ? '' : s)
      .replace(/\s+/g, ' ')
      .trim();
  }

  function arUid(x) {
    return x ? String(x._id || x) : '';
  }

  function arDate(v) {
    const t = Date.parse(v || '');
    return Number.isNaN(t) ? null : t;
  }

  function arStatus(item) {
    const s = item.statusuid || {};
    const ids = [typeof s === 'string' ? s : s._id, s.valuecode].filter(Boolean).map(String);
    if (ids.some((x) => AR_STATUS.dropped.includes(x))) return 'dropped';
    if (ids.some((x) => AR_STATUS.resulted.includes(x))) return 'resulted';
    return 'pending';
  }

  function arForeign(po, patientuid) {
    const other = (x) => x && x.patientuid && arUid(x.patientuid) !== patientuid;
    return other(po) || (po.patientorderitems || []).some(other);
  }

  async function arListLabOrders(patientuid, api, alive, now) {
    const items = [];
    const seen = new Set();
    let ended = false;
    let failed = false;
    let foreign = false;
    let pagesRead = 0;

    for (let page = 1; page <= AR_MAX_PAGES && !ended; page++) {
      const body = {
        fromdate: new Date(now - AR_WINDOW_DAYS * AR_DAY).toISOString(),
        todate: new Date(now).toISOString(),
        patientuid,
        patientvisituid: null,
        ordercattype: ['LAB'],
        populatedata: true,
        pagenumber: page,
        limit: AR_PAGE_LIMIT,
      };
      let r = null;
      for (let attempt = 0; attempt < 2 && !(r && Array.isArray(r.patientorders)); attempt++) {
        if (!alive()) return null;
        r = await api('/ordermanagement/patientorder/search', body);
        if (!alive()) return null;
      }
      if (!r || !Array.isArray(r.patientorders)) {
        failed = true;
        break;
      }
      pagesRead++;
      if (!r.patientorders.length) {
        ended = true;
        break;
      }
      if (r.patientorders.some((po) => po && arForeign(po, patientuid))) {
        foreign = true;
        continue;
      }
      for (const po of r.patientorders) {
        for (const item of (po && po.patientorderitems) || []) {
          const uid = item._id ? String(item._id) : '';
          if (uid && seen.has(uid)) continue;
          if (uid) seen.add(uid);
          const oi = item.orderitemuid || {};
          const name = arText(item.orderitemname || oi.name);
          items.push({
            uid,
            orderuid: arUid(po._id),
            visituid: arUid(po.patientvisituid),
            name,
            code: arText(oi.code),
            panel: arText((oi.ordersubcatuid || {}).name) || name,
            status: arStatus(item),
            t:
              arDate(item.resultauthorizedat) ||
              arDate(po.orderdate) ||
              arDate(item.orderdate) ||
              arDate(item.startdate) ||
              arDate(item.createdat),
          });
        }
      }
    }

    return { items, listComplete: ended && !failed && !foreign, pagesRead, foreign, failed };
  }

  function arUsable(lr) {
    return !!lr && Array.isArray(lr.resultvalues) && lr.resultvalues.length > 0;
  }

  async function arReadItem(patientuid, item, api, alive, cache) {
    if (!item.uid || !item.orderuid) return null;
    if (cache && cache.has(item.uid)) {
      const hit = await cache.get(item.uid);
      if (!alive()) return null;
      if (arUsable(hit)) return hit;
    }
    const body = {
      patientuid,
      patientvisituid: item.visituid,
      patientorderuid: item.orderuid,
      patientorderitemuid: item.uid,
    };
    for (let attempt = 0; attempt < 2; attempt++) {
      if (!alive()) return null;
      const r = await api('/lab/labresult/getdetail', body);
      if (!alive()) return null;
      const lr = r && r.labresult;
      if (arUsable(lr)) {
        if (cache) cache.set(item.uid, Promise.resolve(lr));
        return lr;
      }
    }
    return null;
  }

  function arUnit(line) {
    const uom = line.uomuid || {};
    const field =
      line.uomdescription ||
      (typeof uom === 'object' && (uom.valuedescription || uom.description || uom.name));
    if (field) return arText(field);
    const m = arText(line.resultvalue).match(AR_UNIT_TAIL);
    return m ? m[0].trim() : '';
  }

  function arNameKey(name) {
    return arText(name)
      .toLowerCase()
      .replace(/[\s.:]+$/, '');
  }

  function arExplode(item, lr, since) {
    const lines = lr.resultvalues.filter(Boolean);
    const filled = lines.filter((l) => arText(l.resultvalue) !== '');
    const t = arDate(lr.resultdate) || arDate(lr.approvaldate) || item.t;
    if (t !== null && t < since) return [];
    return (filled.length ? filled : lines).map((line) => {
      const name = arText(line.name) || item.name;
      const shown = arText(line.resultvalue).replace(AR_UNIT_TAIL, '');
      const m = shown.match(AR_NUMBER);
      return {
        key: lines.length === 1 && item.code ? 'c:' + item.code : 'n:' + arNameKey(name),
        nameKey: arNameKey(name),
        name,
        panel: item.panel,
        t,
        shown,
        value: m ? parseFloat(m[2]) : null,
        comparator: m && m[1] && m[1] !== '=' ? m[1] : '',
        flag: arText(line.HLN),
        unit: arUnit(line),
        range: arText(line.normalrange),
        orderItemUid: item.uid,
        orderName: item.name,
      };
    });
  }

  function arGroupTests(points) {
    const groups = new Map();
    for (const p of points) {
      if (!groups.has(p.key)) groups.set(p.key, []);
      groups.get(p.key).push(p);
    }
    const byName = new Map();
    for (const [key, pts] of groups) {
      if (!key.startsWith('c:')) continue;
      for (const p of pts) if (!byName.has(p.nameKey)) byName.set(p.nameKey, key);
    }
    for (const [key, pts] of [...groups]) {
      const target = key.startsWith('n:') && byName.get(key.slice(2));
      if (target) {
        groups.get(target).push(...pts);
        groups.delete(key);
      }
    }
    const tests = [];
    for (const [key, pts] of groups) {
      pts.sort((a, b) => (b.t === null ? -Infinity : b.t) - (a.t === null ? -Infinity : a.t));
      const units = new Set(
        pts.filter((p) => p.value !== null).map((p) => p.unit.toLowerCase().replace(/\s+/g, '')),
      );
      tests.push({
        key,
        name: pts[0].name,
        panel: pts[0].panel,
        unit: (pts.find((p) => p.unit) || {}).unit || '',
        range: (pts.find((p) => p.range) || {}).range || '',
        mixedUnits: units.size > 1,
        points: pts.map((p) => ({
          t: p.t,
          shown: p.shown,
          value: p.value,
          comparator: p.comparator,
          flag: p.flag,
          unit: p.unit,
          range: p.range,
          orderItemUid: p.orderItemUid,
          orderName: p.orderName,
        })),
      });
    }
    const newest = (x) => (x.points[0].t === null ? -Infinity : x.points[0].t);
    return tests.sort((a, b) => newest(b) - newest(a) || a.name.localeCompare(b.name));
  }

  async function arFetchAllResults(ctx, opts) {
    const { api, alive, onProgress, cache } = opts;
    const now = opts.now || Date.now();
    const patientuid = ctx.patientuid;
    if (!patientuid || !alive()) return null;

    const list = await arListLabOrders(patientuid, api, alive, now);
    if (!list || !alive()) return null;

    const toRead = list.items.filter((i) => i.status === 'resulted');
    const total = toRead.length;
    const since = now - AR_WINDOW_DAYS * AR_DAY;
    const points = [];
    const failed = [];
    let done = 0;
    let next = 0;
    let stopped = false;
    let circuitOpen = false;
    let consecutiveFailures = 0;
    const failureLimit = 8;

    if (onProgress) onProgress(0, total);
    while (next < total && !stopped && !circuitOpen) {
      if (!alive()) {
        stopped = true;
        break;
      }
      const batch = toRead.slice(next, next + AR_CONCURRENCY);
      next += batch.length;
      const outcomes = await Promise.all(
        batch.map((item) => arReadItem(patientuid, item, api, alive, cache)),
      );
      if (!alive()) {
        stopped = true;
        break;
      }
      let batchHasSuccess = false;
      for (let i = 0; i < batch.length; i++) {
        const item = batch[i];
        const lr = outcomes[i];
        done++;
        if (lr) {
          batchHasSuccess = true;
          points.push(...arExplode(item, lr, since));
        } else {
          failed.push(item);
        }
        if (onProgress) onProgress(done, total);
      }
      consecutiveFailures = batchHasSuccess ? 0 : consecutiveFailures + batch.length;
      if (consecutiveFailures >= failureLimit) circuitOpen = true;
    }
    if (stopped || !alive()) return null;

    if (circuitOpen) {
      while (next < total) {
        failed.push(toRead[next++]);
        done++;
      }
      if (onProgress) onProgress(done, total);
    }

    return {
      tests: arGroupTests(points),
      listComplete: list.listComplete,
      readsFailed: failed.map((i) => i.name),
      failedItems: failed.map((i) => ({
        name: i.name,
        panel: i.panel,
        code: i.code,
        t: i.t,
        orderItemUid: i.uid,
      })),
      readsTotal: total,
      readsDone: done,
      notAuthorised: list.items.filter((i) => i.status === 'pending').length,
      pagesRead: list.pagesRead,
      complete: list.listComplete && !failed.length,
    };
  }

  let calcCurrentList = [];
  const CALC = (function (MEDCLASS, currentMeds) {
    function calcConst() {
      return {
        DAY: 86400000,
        RECENT_DAYS: 365,
        CREAT_UMOL_PER_MGDL: 88.42,
        CHOL_MGDL_PER_MMOL: 38.67,
        FRAX_URL: 'https://frax.shef.ac.uk/FRAX/tool.aspx?country=84',
        MONTHS: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      };
    }

    function calcIsNum(x) {
      return typeof x === 'number' && Number.isFinite(x);
    }

    function calcRound(x, dp) {
      const f = Math.pow(10, dp);
      return Math.round((x + Number.EPSILON) * f) / f;
    }

    function calcRangeErr(name, x, lo, hi, unit) {
      if (!calcIsNum(x)) return `${name} missing or not a number`;
      if (x < lo || x > hi) return `${name} ${x} ${unit} outside accepted range ${lo}-${hi} ${unit}`;
      return null;
    }

    function calcBoolErr(name, x) {
      return typeof x === 'boolean'
        ? null
        : `${name} must be an explicit true/false (got ${JSON.stringify(x)})`;
    }

    function calcSexErr(sex) {
      return sex === 'F' || sex === 'M' ? null : `sex must be 'F' or 'M' (got ${JSON.stringify(sex)})`;
    }

    function calcFirstErr(list) {
      for (const e of list) if (e) return e;
      return null;
    }

    function calcNorm(s) {
      return String(s == null ? '' : s)
        .replace(/\s+/g, ' ')
        .trim();
    }

    function calcT(v) {
      if (calcIsNum(v)) return v;
      if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v.getTime();
      const t = Date.parse(v || '');
      return Number.isNaN(t) ? null : t;
    }

    function calcFmtDate(t) {
      if (!calcIsNum(t)) return 'unknown date';
      const d = new Date(t);
      return `${String(d.getDate()).padStart(2, '0')} ${calcConst().MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    }

    function calcDayKey(t) {
      const d = new Date(t);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }

    function calcCreatinineMgdl(value, unitLabel) {
      const C = calcConst();
      if (!calcIsNum(value) || value <= 0) return { refused: 'creatinine missing, zero or not a number' };
      const u = String(unitLabel || '')
        .toLowerCase()
        .replace(/\s/g, '');
      if (!u) return { refused: 'creatinine unit not reported' };
      if (/µmol|umol|micromol/.test(u))
        return { value: value / C.CREAT_UMOL_PER_MGDL, from: 'µmol/L', warnings: [] };
      if (/mg\/dl|mg%/.test(u)) {
        if (value <= 20) return { value, from: 'mg/dL', warnings: [] };
        return {
          value: value / C.CREAT_UMOL_PER_MGDL,
          from: 'µmol/L',
          warnings: [`Labelled mg/dL but ${value} > 20: treated as µmol/L (÷${C.CREAT_UMOL_PER_MGDL})`],
        };
      }
      return { refused: `unknown creatinine unit ${JSON.stringify(unitLabel)}` };
    }

    function calcCholMgdl(value, unitLabel) {
      const u = String(unitLabel || '')
        .toLowerCase()
        .replace(/\s/g, '');
      if (!calcIsNum(value)) return { refused: 'cholesterol missing or not a number' };
      if (!u) return { refused: 'unit not reported' };
      if (/mmol\/l/.test(u)) return { value: value * calcConst().CHOL_MGDL_PER_MMOL, from: 'mmol/L' };
      if (/mg\/dl|mg%/.test(u)) return { value, from: 'mg/dL' };
      return { refused: `unit ${JSON.stringify(unitLabel)} not recognised` };
    }

    function calcKdigoG(egfr) {
      if (egfr >= 90) return 'G1 (normal or high)';
      if (egfr >= 60) return 'G2 (mildly decreased)';
      if (egfr >= 45) return 'G3a (mildly to moderately decreased)';
      if (egfr >= 30) return 'G3b (moderately to severely decreased)';
      if (egfr >= 15) return 'G4 (severely decreased)';
      return 'G5 (kidney failure)';
    }

    function calcEgfr({ ageYears, sex, scrMgdl } = {}) {
      const err = calcFirstErr([
        calcSexErr(sex),
        calcRangeErr('age', ageYears, 0, 120, 'y'),
        calcRangeErr('serum creatinine', scrMgdl, 0.1, 25, 'mg/dL'),
      ]);
      if (err) return { refused: err };
      if (ageYears < 18)
        return { refused: 'age < 18 y: CKD-EPI is for adults (bedside Schwartz for children)' };
      const f = sex === 'F';
      const r = scrMgdl / (f ? 0.7 : 0.9);
      const exact =
        142 *
        Math.pow(Math.min(r, 1), f ? -0.241 : -0.302) *
        Math.pow(Math.max(r, 1), -1.2) *
        Math.pow(0.9938, ageYears) *
        (f ? 1.012 : 1);
      const value = Math.round(exact);
      return {
        value,
        exact,
        unit: 'mL/min/1.73 m²',
        band: calcKdigoG(value),
        warnings: [
          'eGFR assumes steady-state creatinine; not valid in AKI, pregnancy, extremes of muscle mass, amputation or dialysis.',
          'CKD needs eGFR <60 or kidney-damage markers (e.g. ACR >=30 mg/g) persisting >3 months; G1/G2 alone is not CKD.',
        ],
      };
    }

    function calcFib4({ ageYears, astUL, altUL, plateletsE9L } = {}) {
      const err = calcFirstErr([
        calcRangeErr('age', ageYears, 18, 110, 'y'),
        calcRangeErr('AST', astUL, 1, 10000, 'U/L'),
        calcRangeErr('ALT', altUL, 1, 10000, 'U/L'),
        calcRangeErr('platelets', plateletsE9L, 1, 2000, 'x10^9/L'),
      ]);
      if (err) return { refused: err };
      const exact = (ageYears * astUL) / (plateletsE9L * Math.sqrt(altUL));
      const value = calcRound(exact, 2);
      const older = ageYears > 65;
      const low = older ? 2.0 : 1.3;
      let band;
      if (value < low)
        band = `Low risk of advanced fibrosis (<${low.toFixed(1)}${older ? ', age >65 cut-off' : ''})`;
      else if (value <= 2.67) band = `Indeterminate (${low.toFixed(1)}-2.67): second-line test (VCTE/ELF)`;
      else band = 'High risk of advanced fibrosis (>2.67): refer/hepatology work-up';
      const warnings = [
        'Rule-out tool for advanced fibrosis (F3-F4) in suspected MASLD/viral liver disease; not a diagnosis of fibrosis or cirrhosis.',
        'Not valid in acute hepatitis or acutely ill patients; use AST, ALT and platelets from the same date.',
      ];
      if (ageYears < 35)
        warnings.push(
          'Age < 35: FIB-4 has low accuracy (AASLD 2023); consider a second-line test if metabolic risk or raised enzymes.',
        );
      if (astUL > 200 || altUL > 200)
        warnings.push(
          'AST or ALT > 200 U/L (script heuristic, about 5x ULN): suggests acute injury; FIB-4 unreliable.',
        );
      if (plateletsE9L < 100)
        warnings.push('Platelets < 100: exclude non-hepatic causes of thrombocytopenia before interpreting.');
      return { value, exact, unit: 'index', band, warnings };
    }

    function calcMentzer({ mcvFl, rbcE12L } = {}) {
      const err = calcFirstErr([
        calcRangeErr('MCV', mcvFl, 40, 130, 'fL'),
        calcRangeErr('RBC', rbcE12L, 1, 9, 'x10^12/L'),
      ]);
      if (err) return { refused: err };
      if (mcvFl >= 80)
        return { refused: `MCV ${mcvFl} fL is not microcytic (>= 80): Mentzer index not applicable` };
      const exact = mcvFl / rbcE12L;
      const value = calcRound(exact, 1);
      let band;
      if (exact < 13) band = 'Favours thalassaemia trait (<13)';
      else if (exact > 13) band = 'Favours iron deficiency (>13)';
      else band = 'Indeterminate (=13)';
      const warnings = [
        'Screening hint only: confirm with ferritin (iron status) and Hb electrophoresis/HPLC (HbA2).',
        'Unreliable with combined iron deficiency + thalassaemia trait, alpha-thalassaemia, anaemia of chronic disease, pregnancy, children, or after transfusion.',
        'Iron deficiency can lower HbA2 and mask beta-thalassaemia trait: replete iron before excluding the trait.',
      ];
      if (Math.abs(exact - 13) < 1)
        warnings.push('Value within 1 of the 13 cut-off: low discriminating power.');
      return { value, exact, unit: 'index', band, warnings };
    }

    function calcPreventCoef() {
      return {
        10: {
          F: {
            totalCvd: [
              0.7939329, 0.0305239, -0.1606857, -0.2394003, 0.3600781, 0.8667604, 0.5360739, 0, 0, 0.6045917,
              0.0433769, 0.3151672, -0.1477655, -0.0663612, 0.1197879, -0.0819715, 0.0306769, -0.0946348,
              -0.27057, -0.078715, 0, -0.1637806, -3.307728,
            ],
            ascvd: [
              0.719883, 0.1176967, -0.151185, -0.0835358, 0.3592852, 0.8348585, 0.4831078, 0, 0, 0.4864619,
              0.0397779, 0.2265309, -0.0592374, -0.0395762, 0.0844423, -0.0567839, 0.0325692, -0.1035985,
              -0.2417542, -0.0791142, 0, -0.1671492, -3.819975,
            ],
            hf: [
              0.8998235, 0, 0, -0.4559771, 0.3576505, 1.038346, 0.583916, -0.0072294, 0.2997706, 0.7451638,
              0.0557087, 0.3534442, 0, -0.0981511, 0, 0, 0, -0.0946663, -0.3581041, -0.1159453, -0.003878,
              -0.1884289, -4.310409,
            ],
          },
          M: {
            totalCvd: [
              0.7688528, 0.0736174, -0.0954431, -0.4347345, 0.3362658, 0.7692857, 0.4386871, 0, 0, 0.5378979,
              0.0164827, 0.288879, -0.1337349, -0.0475924, 0.150273, -0.0517874, 0.0191169, -0.1049477,
              -0.2251948, -0.0895067, 0, -0.1543702, -3.031168,
            ],
            ascvd: [
              0.7099847, 0.1658663, -0.1144285, -0.2837212, 0.3239977, 0.7189597, 0.3956973, 0, 0, 0.3690075,
              0.0203619, 0.2036522, -0.0865581, -0.0322916, 0.114563, -0.0300005, 0.0232747, -0.0927024,
              -0.2018525, -0.0970527, 0, -0.1217081, -3.500655,
            ],
            hf: [
              0.8972642, 0, 0, -0.6811466, 0.3634461, 0.923776, 0.5023736, -0.0485841, 0.3726929, 0.6926917,
              0.0251827, 0.2980922, 0, -0.0497731, 0, 0, 0, -0.1289201, -0.3040924, -0.1401688, 0.0068126,
              -0.1797778, -3.946391,
            ],
          },
        },
        30: {
          F: {
            totalCvd: [
              0.5503079, -0.0928369, 0.0409794, -0.1663306, -0.1628654, 0.3299505, 0.6793894, 0.3196112, 0, 0,
              0.1857101, 0.0553528, 0.2894, -0.075688, -0.056367, 0.1071019, -0.0751438, 0.0301786,
              -0.0998776, -0.3206166, -0.1607862, 0, -0.1450788, -1.318827,
            ],
            ascvd: [
              0.4669202, -0.0893118, 0.1256901, -0.1542255, -0.0018093, 0.322949, 0.6296707, 0.268292, 0, 0,
              0.100106, 0.0499663, 0.1875292, 0.0152476, -0.0276123, 0.0736147, -0.0521962, 0.0316918,
              -0.1046101, -0.2727793, -0.1530907, 0, -0.1299149, -1.974074,
            ],
          },
          M: {
            totalCvd: [
              0.4627309, -0.0984281, 0.0836088, -0.1029824, -0.2140352, 0.2904325, 0.5331276, 0.2141914, 0, 0,
              0.1155556, 0.0603775, 0.232714, -0.0272112, -0.0384488, 0.134192, -0.0511759, 0.0165865,
              -0.1101437, -0.2585943, -0.1566406, 0, -0.1166776, -1.148204,
            ],
            ascvd: [
              0.3994099, -0.0937484, 0.1744643, -0.120203, -0.0665117, 0.2753037, 0.4790257, 0.1782635, 0, 0,
              -0.0218789, 0.0602553, 0.1421182, 0.0135996, -0.0218265, 0.1013148, -0.0312619, 0.020673,
              -0.0920935, -0.2159947, -0.1548811, 0, -0.0712547, -1.736444,
            ],
          },
        },
      };
    }

    function calcLogistic(coef, terms) {
      let x = 0;
      for (let i = 0; i < coef.length; i++) x += coef[i] * terms[i];
      return 100 * (Math.exp(x) / (1 + Math.exp(x)));
    }

    function calcPrevent({
      ageYears,
      sex,
      tcMgdl,
      hdlMgdl,
      sbpMmHg,
      bpTreated,
      statin,
      diabetes,
      smoker,
      egfr,
      bmi,
    } = {}) {
      const err = calcFirstErr([
        calcSexErr(sex),
        calcRangeErr('age', ageYears, 30, 79, 'y'),
        calcRangeErr('total cholesterol', tcMgdl, 130, 320, 'mg/dL'),
        calcRangeErr('HDL cholesterol', hdlMgdl, 20, 100, 'mg/dL'),
        calcRangeErr('systolic BP', sbpMmHg, 90, 180, 'mmHg'),
        calcRangeErr('eGFR', egfr, 15, 140, 'mL/min/1.73 m²'),
        calcBoolErr('bpTreated', bpTreated),
        calcBoolErr('statin', statin),
        calcBoolErr('diabetes', diabetes),
        calcBoolErr('smoker', smoker),
      ]);
      if (err) return { refused: err };
      const warnings = [
        'Primary prevention only (no known ASCVD/HF); lipid thresholds apply to LDL-C 70-189 mg/dL (2026 ACC/AHA).',
        'Derived in US adults; not validated in Saudi/Middle-Eastern populations.',
      ];
      const bmiOk = calcIsNum(bmi) && bmi >= 18.5 && bmi <= 39.9;
      if (!bmiOk)
        warnings.push(
          'BMI missing or outside 18.5-39.9: heart-failure risk not calculated (ASCVD/total CVD unaffected).',
        );
      const MMOL = 0.02586;
      const age = (ageYears - 55) / 10;
      const nonHdl = (tcMgdl - hdlMgdl) * MMOL - 3.5;
      const hdl = (hdlMgdl * MMOL - 1.3) / 0.3;
      const sbpGe = (Math.max(sbpMmHg, 110) - 130) / 20;
      const b = bmiOk ? bmi : 25;
      const bmiGe = (Math.max(b, 30) - 30) / 5;
      const eLt = (Math.min(egfr, 60) - 60) / -15;
      const dm = diabetes ? 1 : 0;
      const smk = smoker ? 1 : 0;
      const tx = bpTreated ? 1 : 0;
      const st = statin ? 1 : 0;
      const t10 = [
        age,
        nonHdl,
        hdl,
        (Math.min(sbpMmHg, 110) - 110) / 20,
        sbpGe,
        dm,
        smk,
        (Math.min(b, 30) - 25) / 5,
        bmiGe,
        eLt,
        (Math.max(egfr, 60) - 90) / -15,
        tx,
        st,
        tx * sbpGe,
        st * nonHdl,
        age * nonHdl,
        age * hdl,
        age * sbpGe,
        age * dm,
        age * smk,
        age * bmiGe,
        age * eLt,
        1,
      ];
      const t30 = [age, age * age].concat(t10.slice(1));
      const K = calcPreventCoef();
      const ascvd10 = calcLogistic(K[10][sex].ascvd, t10);
      const young = ageYears <= 59;
      if (!young) warnings.push('30-year risk not shown: valid for ages 30-59 only.');
      let band;
      if (ascvd10 < 3) band = 'Low (<3%)';
      else if (ascvd10 < 5) band = 'Borderline (3-<5%)';
      else if (ascvd10 < 10) band = 'Intermediate (5-<10%)';
      else band = 'High (>=10%)';
      return {
        value: calcRound(ascvd10, 1),
        exact: ascvd10,
        unit: '% 10-y ASCVD (PREVENT base)',
        band,
        warnings,
        totalCvd10y: calcLogistic(K[10][sex].totalCvd, t10),
        heartFailure10y: bmiOk ? calcLogistic(K[10][sex].hf, t10) : null,
        ascvd30y: young ? calcLogistic(K[30][sex].ascvd, t30) : null,
        totalCvd30y: young ? calcLogistic(K[30][sex].totalCvd, t30) : null,
      };
    }

    function calcFraxPrefill({
      ageYears,
      sex,
      weightKg,
      heightCm,
      currentSmoking,
      glucocorticoids,
      rheumatoidArthritis,
      secondaryOsteoporosis,
    } = {}) {
      const err = calcFirstErr([calcSexErr(sex), calcRangeErr('age', ageYears, 40, 90, 'y')]);
      if (err) return { refused: err + ' (FRAX accepts ages 40-90)' };
      const v = (x) => (x === undefined ? null : x);
      return {
        value: null,
        band: 'Not computed locally; enter in the official Saudi FRAX tool',
        warnings: [
          'FRAX algorithm is proprietary; do not approximate it locally.',
          'Previous fracture, parental hip fracture, alcohol >=3 units/day and femoral-neck BMD have no Raqeem source; the doctor must answer them.',
        ],
        url: calcConst().FRAX_URL,
        prefill: {
          country: 'Saudi Arabia',
          age: ageYears,
          sex,
          weightKg: v(weightKg),
          heightCm: v(heightCm),
          previousFracture: null,
          parentFracturedHip: null,
          currentSmoking: v(currentSmoking),
          glucocorticoids: v(glucocorticoids),
          rheumatoidArthritis: v(rheumatoidArthritis),
          secondaryOsteoporosis: v(secondaryOsteoporosis),
          alcohol3OrMoreUnitsPerDay: null,
          femoralNeckBmdTscore: null,
        },
      };
    }

    function calcRules() {
      const CBC = /\bcbc\b|complete\s*blood|blood\s*count|ha?emogram|777-3|787-2|789-8/i;
      const LFT =
        /\blft\b|liver\s*function|hepatic|\b(ast|alt|sgot|sgpt)\b|amino\s*transferase|1920-8|1742-6/i;
      const URINE = /urin|albumin|\bu?acr\b|32294-1|14959-1|9318-7/i;
      return {
        creatinine: {
          label: 'creatinine',
          line: /^\s*(?:serum\s+|s\.\s*)?creatinine\b(?!.*(?:urine|ratio|clearance))/i,
          order: /creatinine|renal\s*function|kidney\s*function|\b[rk]ft\b|2160-0|14682-9|38483-4|69405-9/i,
          skipOrder: URINE,
        },
        tc: {
          label: 'total cholesterol',
          line: /^\s*(?:(?:total|serum|s\.)\s+)?cholesterol\b(?!.*(?:hdl|ldl|vldl|high\s*dens|low\s*dens|ratio|non[\s-]*hdl))|^\s*tc\s*$/i,
          order: /cholesterol|lipid|2093-3|2085-9/i,
        },
        hdl: {
          label: 'HDL',
          line: /^(?!.*(?:ratio|non[\s-]*hdl|\/\s*hdl|hdl\s*\/)).*(?:\bhdl\b|high[\s-]*density)/i,
          order: /cholesterol|lipid|\bhdl\b|2093-3|2085-9/i,
        },
        ast: {
          label: 'AST',
          line: /^(?!.*(?:ratio|\b(?:ast|sgot)\s*\/|\/\s*(?:ast|sgot)\b)).*(?:\b(?:ast|sgot)\b|aspartate\s*(?:amino)?\s*transferase)/i,
          order: LFT,
        },
        alt: {
          label: 'ALT',
          line: /^(?!.*(?:ratio|\b(?:alt|sgpt)\s*\/|\/\s*(?:alt|sgpt)\b)).*(?:\b(?:alt|sgpt)\b|alanine\s*(?:amino)?\s*transferase)/i,
          order: LFT,
        },
        plt: {
          label: 'platelets',
          line: /^\s*(?:plt|platelets?)\b(?!.*(?:mean|distribution|width|crit|large|clump|aggregat))/i,
          order: CBC,
          skipOrder: URINE,
        },
        mcv: {
          label: 'MCV',
          line: /\bmcv\b|mean\s*(?:corpuscular|cell)\s*volume/i,
          order: CBC,
          skipOrder: URINE,
        },
        rbc: {
          label: 'RBC',
          line: /^\s*(?:rbc|red\s*(?:blood\s*)?cells?|erythrocytes?)\b(?!.*(?:mean|distribution|width|morpholog|sediment|urine|hpf|nucleated|indices|fragment))/i,
          order: CBC,
          skipOrder: URINE,
        },
        acr: {
          label: 'ACR',
          line: /albumin\s*\/\s*creatinine.{0,40}ratio|\bu?acr\b/i,
          order: URINE,
        },
      };
    }

    function calcParseLine(line) {
      const text = calcNorm(line && line.resultvalue);
      const m = text.match(/^([<>]=?)?\s*(\d+(?:\.\d+)?|\.\d+)(?:\s+([^\d\s,].*)|([^\d\s.,].*))?$/);
      if (!m) return null;
      const uom = (line.uomuid && typeof line.uomuid === 'object' && line.uomuid) || {};
      const unit = calcNorm(
        line.uomdescription || uom.valuedescription || uom.description || uom.name || m[3] || m[4],
      );
      return { value: parseFloat(m[2]), shown: (m[1] || '') + m[2], bound: !!m[1], unit };
    }

    function calcLabValues(pkg, key) {
      const rule = calcRules()[key];
      const vals = [];
      const unread = [];
      for (const r of pkg.results || []) {
        const item = (r && r.item) || {};
        if (item.status && item.status !== 'resulted') continue;
        const orderText = `${item.name || ''} ${item.code || ''}`;
        if (rule.skipOrder && rule.skipOrder.test(orderText)) continue;
        const lr = r && r.lr;
        const t =
          (lr && (calcT(lr.resultdate) || calcT(lr.approvaldate))) ||
          calcT(item.resultAt) ||
          calcT(item.date);
        if (!lr) {
          if (rule.order.test(orderText)) unread.push(t);
          continue;
        }
        const line = (lr.resultvalues || []).find((l) => rule.line.test(calcNorm(l && l.name)));
        const p = line && calcParseLine(line);
        if (p && t) vals.push({ ...p, t, name: calcNorm(line.name) });
      }
      return { rule, vals: vals.sort((a, b) => b.t - a.t), unread };
    }

    function calcRecent(t, now) {
      const C = calcConst();
      return calcIsNum(t) && now - t <= C.RECENT_DAYS * C.DAY;
    }

    function calcLabProblem(pkg, lv, v, now, label) {
      const newerUnread = lv.unread.some((t) => !calcIsNum(t) || ((!v || t > v.t) && calcRecent(t, now)));
      if (newerUnread) return `A ${v ? 'newer ' : ''}${label} result could not be read — press ↻`;
      if (!v) {
        const latest = lv.vals[0];
        if (latest && !calcRecent(latest.t, now))
          return `Latest ${label} is from ${calcFmtDate(latest.t)} (older than 12 months)`;
        return pkg.resultsComplete === false
          ? `${label[0].toUpperCase() + label.slice(1)} not found — results not fully read, press ↻`
          : `No ${label} in the last 12 months`;
      }
      if (v.bound)
        return `${label[0].toUpperCase() + label.slice(1)} reported as ${v.shown} on ${calcFmtDate(v.t)} (a bound, not a value)`;
      return null;
    }

    function calcPickLab(pkg, key, now) {
      const lv = calcLabValues(pkg, key);
      const v = lv.vals[0] && calcRecent(lv.vals[0].t, now) ? lv.vals[0] : null;
      const problem = calcLabProblem(pkg, lv, v, now, lv.rule.label);
      return problem ? { missing: problem } : { val: v };
    }

    function calcPickSameDay(pkg, keys, now) {
      const lvs = keys.map((k) => calcLabValues(pkg, k));
      const recent = lvs.map((lv) => lv.vals.filter((x) => calcRecent(x.t, now)));
      const days = recent[0].map((x) => calcDayKey(x.t));
      const day = days.find((d) => recent.every((list) => list.some((x) => calcDayKey(x.t) === d)));
      const picked = recent.map((list) =>
        day ? list.find((x) => calcDayKey(x.t) === day) : list[0] || null,
      );
      const missing = [];
      lvs.forEach((lv, i) => {
        const p = calcLabProblem(pkg, lv, picked[i], now, lv.rule.label);
        if (p) missing.push(p);
      });
      if (!missing.length && !day)
        missing.push(
          `${lvs.map((lv) => lv.rule.label).join(', ')} are not from the same date in the last 12 months (latest: ${lvs
            .map((lv, i) => `${lv.rule.label} ${calcFmtDate(picked[i].t)}`)
            .join(', ')})`,
        );
      return { missing, vals: picked };
    }

    function calcLabInput(key, label, v, extra) {
      return {
        key,
        text: `${label} ${v.shown}${v.unit ? ' ' + v.unit : ''}${extra || ''} · ${calcFmtDate(v.t)}`,
        value: v.value,
        shown: v.shown,
        unit: v.unit,
        date: v.t,
        source: 'lab',
      };
    }

    function calcDemoInputs(pkg, now, inputs, missing) {
      const d = pkg.demo;
      if (!d || !calcIsNum(d.age) || (d.gender !== 'M' && d.gender !== 'F')) {
        missing.push('Could not read age and sex from the patient banner');
        return null;
      }
      inputs.push({
        key: 'age',
        text: `Age ${d.age}`,
        value: d.age,
        shown: String(d.age),
        unit: 'y',
        date: now,
        source: 'banner',
      });
      const sexText = d.gender === 'M' ? 'Male' : 'Female';
      inputs.push({
        key: 'sex',
        text: sexText,
        value: d.gender,
        shown: sexText,
        unit: '',
        date: now,
        source: 'banner',
      });
      return d;
    }

    function calcDx(diagnoses, re, activeOnly) {
      return (diagnoses || []).filter(
        (x) => x && re.test(String(x.code || '')) && (!activeOnly || x.active !== false),
      );
    }

    function calcDxInput(key, label, hits, noneText, now) {
      const codes = [...new Set(hits.map((x) => x.code))];
      const dates = hits.map((x) => calcT(x.codedAt) || calcT(x.onset)).filter(calcIsNum);
      return hits.length
        ? {
            key,
            text: `${label} (${codes.join(', ')})`,
            value: true,
            shown: codes.join(', '),
            unit: '',
            date: dates.length ? Math.max(...dates) : null,
            source: 'diagnosis',
          }
        : { key, text: noneText, value: false, shown: '', unit: '', date: now, source: 'diagnosis' };
    }

    function calcMedLib() {
      const ix = typeof S !== 'undefined' && S && S._internals ? S._internals : {};
      const cls = typeof MEDCLASS !== 'undefined' ? MEDCLASS : ix.MEDCLASS;
      const current = typeof currentMeds === 'function' ? currentMeds : ix.currentMeds;
      return cls && typeof current === 'function' ? { cls, current } : null;
    }

    function calcCurrentMeds(lib, medicines) {
      const r = lib.current(medicines);
      return Array.isArray(r) ? r : (r && r.items) || [];
    }

    function calcMedInput(key, hits, yesText, noText, now) {
      const names = [...new Set(hits.map((m) => calcNorm(m.name)))];
      const dates = hits.map((m) => calcT(m.date)).filter(calcIsNum);
      return hits.length
        ? {
            key,
            text: `${yesText}: ${names.join(', ')}`,
            value: true,
            shown: names.join(', '),
            unit: '',
            date: dates.length ? Math.max(...dates) : null,
            source: 'medicine',
          }
        : { key, text: noText, value: false, shown: '', unit: '', date: now, source: 'medicine' };
    }

    function calcPickVital(pkg, field, label, now) {
      const rows = (pkg.vitals || [])
        .filter((r) => r && calcIsNum(r[field]) && calcIsNum(calcT(r.t)))
        .sort((a, b) => calcT(b.t) - calcT(a.t));
      const v = rows[0];
      if (!v) return { missing: `No ${label} in the last 12 months` };
      const t = calcT(v.t);
      if (!calcRecent(t, now))
        return { missing: `Latest ${label} is from ${calcFmtDate(t)} (older than 12 months)` };
      return { value: v[field], t };
    }

    function calcFinish(inputs, missing, run) {
      return { inputs, missing, result: missing.length ? { refused: missing.join('; ') } : run() };
    }

    function calcMapEgfr(pkg, now) {
      const inputs = [];
      const missing = [];
      const d = calcDemoInputs(pkg, now, inputs, missing);
      const cr = calcPickLab(pkg, 'creatinine', now);
      let mg = null;
      if (cr.missing) missing.push(cr.missing);
      else {
        mg = calcCreatinineMgdl(cr.val.value, cr.val.unit);
        if (mg.refused) {
          missing.push(`Creatinine ${cr.val.shown} on ${calcFmtDate(cr.val.t)}: ${mg.refused}`);
          inputs.push(calcLabInput('creatinine', 'Creatinine', cr.val));
        } else {
          const shownUnit = mg.from === 'mg/dL' ? cr.val.unit : 'µmol/L';
          inputs.push({
            ...calcLabInput('creatinine', 'Creatinine', { ...cr.val, unit: shownUnit }),
            value: mg.value,
            text: `Creatinine ${cr.val.shown} ${shownUnit}${mg.from === 'mg/dL' ? '' : ` = ${mg.value.toFixed(2)} mg/dL`} · ${calcFmtDate(cr.val.t)}`,
          });
        }
      }
      const out = calcFinish(inputs, missing, () => {
        const r = calcEgfr({ ageYears: d.age, sex: d.gender, scrMgdl: mg.value });
        if (!r.refused && mg.warnings.length) r.warnings = mg.warnings.concat(r.warnings);
        return r;
      });
      const acr = calcPickLab(pkg, 'acr', now);
      if (acr.val) {
        const u = acr.val.unit.toLowerCase().replace(/\s/g, '');
        const x = acr.val.value;
        let cat = null;
        if (/mg\/mmol/.test(u)) cat = x < 3 ? 'A1' : x <= 30 ? 'A2' : 'A3';
        else if (/mg\/g/.test(u)) cat = x < 30 ? 'A1' : x <= 300 ? 'A2' : 'A3';
        out.inputs.push({ ...calcLabInput('acr', 'ACR', acr.val, cat ? ` (${cat})` : ''), category: cat });
      }
      return out;
    }

    function calcMapFib4(pkg, now) {
      const inputs = [];
      const missing = [];
      const d = calcDemoInputs(pkg, now, inputs, missing);
      const s = calcPickSameDay(pkg, ['ast', 'alt', 'plt'], now);
      missing.push(...s.missing);
      const [ast, alt, plt] = s.vals;
      if (!s.missing.length) {
        inputs.push(
          calcLabInput('ast', 'AST', ast),
          calcLabInput('alt', 'ALT', alt),
          calcLabInput('plt', 'Platelets', plt),
        );
      }
      return calcFinish(inputs, missing, () =>
        calcFib4({ ageYears: d.age, astUL: ast.value, altUL: alt.value, plateletsE9L: plt.value }),
      );
    }

    function calcMapMentzer(pkg, now) {
      const inputs = [];
      const missing = [];
      const s = calcPickSameDay(pkg, ['mcv', 'rbc'], now);
      missing.push(...s.missing);
      const [mcv, rbc] = s.vals;
      if (!s.missing.length) inputs.push(calcLabInput('mcv', 'MCV', mcv), calcLabInput('rbc', 'RBC', rbc));
      return calcFinish(inputs, missing, () => calcMentzer({ mcvFl: mcv.value, rbcE12L: rbc.value }));
    }

    function calcMapPrevent(pkg, now, egfrOut) {
      const inputs = [];
      const missing = [];
      const d = calcDemoInputs(pkg, now, inputs, missing);
      if (!d) return calcFinish(inputs, missing);
      if (d.age < 30 || d.age > 79) {
        missing.push(`Age ${d.age}: PREVENT is for ages 30–79`);
        return calcFinish(inputs, missing);
      }
      const dx = pkg.diagnoses;
      if (!Array.isArray(dx)) missing.push('Could not read diagnoses — press ↻');
      else {
        const cvd = calcDx(dx, /^(?:I2[0-5]|I50|I6\d|G45|I7[0-3])(?:\.|$)/i, false);
        if (cvd.length) {
          const out = calcFinish(
            [calcDxInput('ascvd', 'Known ASCVD or heart failure', cvd, '', now)],
            [
              `Known ASCVD or heart failure (${[...new Set(cvd.map((x) => x.code))].join(', ')}): PREVENT is for primary prevention`,
            ],
          );
          out.result.hidden = true;
          return out;
        }
        inputs.push(
          calcDxInput('diabetes', 'Diabetes', calcDx(dx, /^E1[0-4](?:\.|$)/i, true), 'No diabetes code', now),
        );
      }
      const lip = {};
      for (const [key, label] of [
        ['tc', 'Total cholesterol'],
        ['hdl', 'HDL'],
      ]) {
        const p = calcPickLab(pkg, key, now);
        if (p.missing) {
          missing.push(p.missing);
          continue;
        }
        const mg = calcCholMgdl(p.val.value, p.val.unit);
        if (mg.refused) {
          missing.push(`${label} ${p.val.shown} on ${calcFmtDate(p.val.t)}: ${mg.refused}`);
          continue;
        }
        lip[key] = mg.value;
        const conv = mg.from === 'mmol/L' ? ` = ${Math.round(mg.value)} mg/dL` : '';
        inputs.push({ ...calcLabInput(key, label, p.val, conv), value: mg.value });
      }
      let sbp = null;
      let bmi = null;
      if (!Array.isArray(pkg.vitals)) missing.push('Could not read vitals — press ↻');
      else {
        sbp = calcPickVital(pkg, 'sys', 'systolic BP', now);
        if (sbp.missing) missing.push(sbp.missing);
        else
          inputs.push({
            key: 'sbp',
            text: `Systolic BP ${sbp.value} mmHg · ${calcFmtDate(sbp.t)}`,
            value: sbp.value,
            shown: String(sbp.value),
            unit: 'mmHg',
            date: sbp.t,
            source: 'vital',
          });
        bmi = calcPickVital(pkg, 'bmi', 'BMI', now);
        if (!bmi.missing)
          inputs.push({
            key: 'bmi',
            text: `BMI ${bmi.value} · ${calcFmtDate(bmi.t)}`,
            value: bmi.value,
            shown: String(bmi.value),
            unit: 'kg/m²',
            date: bmi.t,
            source: 'vital',
          });
      }
      const eg = egfrOut.result;
      if (eg.refused) missing.push(`eGFR not available (${egfrOut.missing.join('; ') || eg.refused})`);
      else
        inputs.push({
          key: 'egfr',
          text: `eGFR ${eg.value} (CKD-EPI 2021)`,
          value: eg.value,
          shown: String(eg.value),
          unit: eg.unit,
          date: (egfrOut.inputs.find((x) => x.key === 'creatinine') || {}).date || null,
          source: 'derived',
        });
      let statin = null;
      let bpTx = null;
      const lib = calcMedLib();
      if (!pkg.medicines || pkg.medicines.complete !== true)
        missing.push('Medicine list not fully read — press ↻');
      else if (!lib) missing.push('Medicine classes not loaded');
      else {
        const cur = calcCurrentMeds(lib, pkg.medicines);
        const BP = ['acei', 'arb', 'arni', 'ccb', 'thiazide', 'betaBlocker', 'mra'];
        const bpHits = cur.filter((m) => BP.some((k) => lib.cls[k] && lib.cls[k].test(String(m.name || ''))));
        const stHits = cur.filter((m) => lib.cls.statin && lib.cls.statin.test(String(m.name || '')));
        bpTx = bpHits.length > 0;
        statin = stHits.length > 0;
        inputs.push(
          calcMedInput('bpTreated', bpHits, 'On BP treatment', 'No BP medicine in current list', now),
        );
        inputs.push(calcMedInput('statin', stHits, 'On statin', 'No statin in current list', now));
      }
      if (typeof pkg.smoker !== 'boolean') missing.push('Tick smoker Yes or No');
      else
        inputs.push({
          key: 'smoker',
          text: `Smoker: ${pkg.smoker ? 'yes' : 'no'} (ticked, not saved)`,
          value: pkg.smoker,
          shown: pkg.smoker ? 'yes' : 'no',
          unit: '',
          date: now,
          source: 'tick',
        });
      const out = calcFinish(inputs, missing, () =>
        calcPrevent({
          ageYears: d.age,
          sex: d.gender,
          tcMgdl: lip.tc,
          hdlMgdl: lip.hdl,
          sbpMmHg: sbp.value,
          bpTreated: bpTx,
          statin,
          diabetes: inputs.find((x) => x.key === 'diabetes').value,
          smoker: pkg.smoker,
          egfr: eg.value,
          bmi: bmi.missing ? undefined : bmi.value,
        }),
      );
      if (!out.result.refused && out.result.heartFailure10y === null)
        out.result.heartFailureRefused = bmi.missing || `BMI ${bmi.value} outside 18.5–39.9`;
      if (!out.result.refused && pkg.resultsComplete === false)
        out.result.warnings.unshift('Results not fully read: a newer lipid or creatinine value may exist.');
      return out;
    }

    function calcMapFrax(pkg, now) {
      const inputs = [];
      const missing = [];
      const d = calcDemoInputs(pkg, now, inputs, missing);
      if (!d) return calcFinish(inputs, missing);
      const vit = {};
      for (const [field, key, label, unit] of [
        ['weight', 'weightKg', 'weight', 'kg'],
        ['height', 'heightCm', 'height', 'cm'],
      ]) {
        const v = Array.isArray(pkg.vitals)
          ? calcPickVital(pkg, field, label, now)
          : { missing: 'Could not read vitals' };
        if (v.missing) missing.push(v.missing);
        else {
          vit[key] = v.value;
          inputs.push({
            key,
            text: `${label[0].toUpperCase() + label.slice(1)} ${v.value} ${unit} · ${calcFmtDate(v.t)}`,
            value: v.value,
            shown: String(v.value),
            unit,
            date: v.t,
            source: 'vital',
          });
        }
      }
      let gc;
      const lib = calcMedLib();
      if (!pkg.medicines || pkg.medicines.complete !== true || !lib) {
        gc = null;
        missing.push(
          lib
            ? 'Glucocorticoids: medicine list not fully read'
            : 'Glucocorticoids: medicine classes not loaded',
        );
      } else {
        const GC =
          /\b(?:prednisolone|prednisone|methylprednisolone|dexamethasone|hydrocortisone|deflazacort|betamethasone)\b/i;
        const LOCAL = /cream|ointment|eye|ear|drop|inhal|nasal|spray|topical|lotion|gel|enema|suppositor/i;
        const hits = calcCurrentMeds(lib, pkg.medicines).filter(
          (m) => GC.test(String(m.name || '')) && !LOCAL.test(`${m.name || ''} ${m.dose || ''}`),
        );
        gc = hits.length ? null : false;
        const inp = calcMedInput(
          'glucocorticoids',
          hits,
          'Glucocorticoid in current list',
          'Glucocorticoids: none found',
          now,
        );
        if (hits.length) {
          inp.value = null;
          inp.text += ' — confirm ≥3 months at ≥5 mg/day';
          missing.push('Glucocorticoids: confirm duration and dose');
        }
        inputs.push(inp);
      }
      let ra = null;
      let sec = null;
      if (!Array.isArray(pkg.diagnoses))
        missing.push('Rheumatoid arthritis, secondary osteoporosis: could not read diagnoses');
      else {
        const raHits = calcDx(pkg.diagnoses, /^M0[56](?:\.|$)/i, true);
        const secHits = calcDx(
          pkg.diagnoses,
          /^(?:E10|E05|K90|K7[0-7])(?:\.|$)|^(?:E23\.0|E28\.3|E29\.1|Q78\.0)/i,
          true,
        );
        ra = raHits.length > 0;
        sec = secHits.length > 0;
        inputs.push(
          calcDxInput(
            'rheumatoidArthritis',
            'Rheumatoid arthritis',
            raHits,
            'Rheumatoid arthritis: none found',
            now,
          ),
        );
        inputs.push(
          calcDxInput(
            'secondaryOsteoporosis',
            'Secondary osteoporosis cause',
            secHits,
            'Secondary osteoporosis: none found',
            now,
          ),
        );
      }
      if (typeof pkg.smoker === 'boolean')
        inputs.push({
          key: 'currentSmoking',
          text: `Current smoking: ${pkg.smoker ? 'yes' : 'no'} (ticked, not saved)`,
          value: pkg.smoker,
          shown: pkg.smoker ? 'yes' : 'no',
          unit: '',
          date: now,
          source: 'tick',
        });
      else missing.push('Current smoking: not recorded');
      missing.push('Not in Raqeem: previous fracture, parent hip fracture, alcohol, BMD');
      return {
        inputs,
        missing,
        result: calcFraxPrefill({
          ageYears: d.age,
          sex: d.gender,
          weightKg: vit.weightKg,
          heightCm: vit.heightCm,
          currentSmoking: typeof pkg.smoker === 'boolean' ? pkg.smoker : null,
          glucocorticoids: gc,
          rheumatoidArthritis: ra,
          secondaryOsteoporosis: sec,
        }),
      };
    }

    function calcInputs(pkg) {
      const p = pkg || {};
      const now = calcIsNum(p.now) ? p.now : Date.now();
      const egfr = calcMapEgfr(p, now);
      return {
        egfr,
        fib4: calcMapFib4(p, now),
        mentzer: calcMapMentzer(p, now),
        prevent: calcMapPrevent(p, now, egfr),
        frax: calcMapFrax(p, now),
      };
    }

    async function calcResolveReads(labs) {
      const reads = (labs && labs.reads) || new Map();
      const items = ((labs && labs.items) || []).filter((it) => it && it.status === 'resulted');
      return Promise.all(
        items.map(async (item) => {
          let lr = null;
          try {
            lr = reads.has(item.itemuid) ? (await reads.get(item.itemuid)) || null : null;
          } catch (e) {
            lr = null;
          }
          return { item, lr };
        }),
      );
    }

    return { calcInputs, calcFmtDate, calcConst, calcResolveReads };
  })(
    Object.fromEntries(
      Object.keys(MEDCLASS).map((cls) => [
        cls,
        {
          test: (name) =>
            calcCurrentList.some((m) => m.name === name && medClass(m, cls)) || medClass({ name }, cls),
        },
      ]),
    ),
    (medicines) => (calcCurrentList = ((medicines && medicines.items) || []).filter(currentMedicine)),
  );

  const DT_TABS = [
    ['caregaps', 'Care gaps'],
    ['results', 'Results'],
    ['vitals', 'Vitals'],
    ['medicines', 'Medicines'],
    ['calculators', 'Calculators'],
  ];

  const DT_GROUPS = [
    ['Diabetes', /a1c|glycat|glucose/i],
    ['Lipids', /cholesterol|\b(?:v?ldl|hdl)\b|triglycer|lipid/i],
    ['Kidney', /creatinine|\bu?acr\b|urea|\bbun\b|\begfr\b|potassium|sodium|chloride|uric/i],
    ['Liver', /\b(?:alt|ast|sgpt|sgot|ggt|alp)\b|alanine|aspartate|phosphatase|bilirubin|albumin|liver/i],
    [
      'CBC',
      /h(?:a)?emoglobin(?!\s*a1c)|\bhb\b|\b(?:rbc|wbc|mcv|mch|mchc|rdw|plt|hct)\b|platelet|red (?:blood )?cell|white (?:blood )?cell|ha?ematocrit|neutrophil|lymphocyte/i,
    ],
    ['Thyroid', /\btsh\b|\bf?t[34]\b|thyro/i],
  ];

  const DT_TEST_ORDER = [
    /h(?:a)?emoglobin a1c|hba1c|a1c/i,
    /fasting glucose|glucose fasting/i,
    /total cholesterol|^cholesterol$/i,
    /ldl/i,
    /hdl/i,
    /triglycer/i,
    /^creatinine|serum creatinine/i,
    /albumin.*creatinine|uacr|acr/i,
    /ast|aspartate/i,
    /alt|alanine/i,
    /platelet|plt/i,
    /mcv/i,
    /rbc|red (?:blood )?cell/i,
  ];

  const DT_CALC = [
    [
      'egfr',
      'eGFR · CKD-EPI 2021',
      'Inker, NEJM 2021',
      'https://www.kidney.org/ckd-epi-creatinine-equation-2021',
    ],
    ['fib4', 'FIB-4', 'Sterling, Hepatology 2006', 'https://doi.org/10.1002/hep.21178'],
    [
      'mentzer',
      'Mentzer index',
      'Mentzer, Lancet 1973',
      'https://pubmed.ncbi.nlm.nih.gov/?term=Mentzer+1973+thalassaemia+trait',
    ],
    [
      'prevent',
      'PREVENT · 10-year risk',
      'AHA PREVENT, Khan 2024',
      'https://www.ahajournals.org/doi/10.1161/CIRCULATIONAHA.123.067626',
    ],
    ['frax', 'Saudi FRAX · 10-year fracture probability', 'FRAX Saudi Arabia', CALC.calcConst().FRAX_URL],
  ];

  const DT_EGFR_RANGE = { G1: '≥90', G2: '60–89', G3a: '45–59', G3b: '30–44', G4: '15–29', G5: '<15' };

  let dtSeq = 0;

  function dtEl(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = String(text);
    return n;
  }

  const dtDate = (t) => (t ? CALC.calcFmtDate(t) : 'Unknown date');

  const dtNote = (text, cls = 'rqm-dt-note') => dtEl('p', cls, text);

  const dtGroup = (name) => (DT_GROUPS.find(([, re]) => re.test(name || '')) || [])[0] || null;

  const dtSlope = (fit, unit) =>
    fit
      ? `${fit.perYear > 0 ? '↑ +' : fit.perYear < 0 ? '↓ ' : '→ '}${fmtNum(fit.perYear)}${unit ? ' ' + unit : ''}/yr`
      : '';

  function dtTable(cls, caption, heads) {
    const table = document.createElement('table');
    table.className = cls;
    table.appendChild(dtEl('caption', 'rqm-sr', caption));
    const thead = document.createElement('thead');
    const row = document.createElement('tr');
    for (const [text, thCls] of heads) {
      const th = dtEl('th', thCls, text);
      th.setAttribute('scope', 'col');
      row.appendChild(th);
    }
    thead.appendChild(row);
    table.appendChild(thead);
    return table;
  }

  function dtGroupRow(text, span) {
    const tr = dtEl('tr', 'rqm-grp');
    const th = dtEl('th', '', text);
    th.setAttribute('colspan', String(span));
    th.setAttribute('scope', 'colgroup');
    tr.appendChild(th);
    return tr;
  }

  function dtRangeText(text, gender) {
    const r = parseRange(text, gender);
    if (r)
      return r.lo !== null && r.hi !== null ? `${r.lo} - ${r.hi}` : r.hi !== null ? `< ${r.hi}` : `> ${r.lo}`;
    return normText(
      String(text || '')
        .replace(/<[a-z/][^>]*>/gi, ' ')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&nbsp;|&amp;/gi, ' '),
    );
  }

  function dtFlag(p, gender) {
    const f = String(p.flag || '')
      .trim()
      .toUpperCase()[0];
    if (f === 'H' || f === 'L') return f;
    if (f === 'N' || typeof p.value !== 'number') return '';
    const r = parseRange(p.range, gender);
    if (!r) return '';
    const c = p.comparator || '';
    const hi =
      r.hi !== null &&
      (c === '' ? p.value > r.hi : c === '>' ? p.value >= r.hi : c === '>=' && p.value > r.hi);
    const lo =
      r.lo !== null &&
      (c === '' ? p.value < r.lo : c === '<' ? p.value <= r.lo : c === '<=' && p.value < r.lo);
    return hi ? 'H' : lo ? 'L' : '';
  }

  function dtValue(p, gender, withUnit) {
    const span = dtEl('span');
    const f = dtFlag(p, gender);
    const shown = p.shown === '' ? 'Blank' : p.shown;
    span.appendChild(dtEl('b', f ? 'rqm-ab' : '', f ? `${shown} ${f}` : shown));
    if (withUnit && p.unit) span.appendChild(dtEl('span', 'rqm-u', ` ${p.unit}`));
    return span;
  }

  function dtValueCell(p, gender, withUnit) {
    const td = dtEl('td');
    td.appendChild(dtValue(p, gender, withUnit));
    td.appendChild(dtEl('span', 'rqm-dd', p.t === null ? 'Unknown date' : dtDate(p.t)));
    return td;
  }

  async function dtData(ctx) {
    if (S.rawFor && S.rawFor.pid === ctx.patientuid) return S.rawFor;
    const [diagnoses, medicines, vitals] = await Promise.all([
      fetchDiagnoses(ctx),
      fetchMedicines(ctx),
      fetchVitals(ctx),
    ]);
    return { diagnoses, medicines, vitals };
  }

  function dtReadCache(pid) {
    if (S.labsFor && S.labsFor.pid === pid) return (S.labsFor.labs.reads = S.labsFor.labs.reads || new Map());
    if (!S.readCache || S.readCache.pid !== pid) S.readCache = { pid, map: new Map() };
    return S.readCache.map;
  }

  function dtResultsLine(res, calculators) {
    if (calculators) return '';
    const names = [
      ...new Set(
        [
          ...(res.failedItems || []).map((item) => item && item.name),
          ...(res.readsFailed || []).map((item) => (typeof item === 'string' ? item : item && item.name)),
        ].filter(Boolean),
      ),
    ];
    let what = '';
    if (names.length) {
      what = `Could not read ${names.slice(0, 3).join(', ')}`;
      if (names.length > 3) what += ` … and ${names.length - 3} more`;
    } else if (!res.listComplete && !res.pagesRead) {
      what = 'Could not read results';
    }
    if (!res.listComplete) what += `${what ? '; list' : 'List'} may be incomplete`;
    if (what) return `${what} — press ↻`;
    return res.tests.length ? '' : 'No results in the last 3 years';
  }

  function dtProgress(panel, M) {
    const line = dtNote('Reading results…', 'rqm-dt-progress');
    line.setAttribute('role', 'status');
    panel.appendChild(line);
    M.listeners.push((done, total) => {
      line.textContent = `Reading results ${done} / ${total}`;
    });
  }

  const dtDue = (due) =>
    !due ? '' : /^(?:now|soon|in |by )/.test(due) ? `Due ${due}` : due[0].toUpperCase() + due.slice(1);
  const dtNormEvidence = (text) =>
    String(text || '')
      .toLowerCase()
      .replace(/[^a-z0-9.%]+/g, ' ')
      .trim();
  function dtUsefulMore(gap) {
    const more = dtNormEvidence(gap.more);
    if (!more) return '';
    const context = [gap.fact, gap.action, gap.due, gap.rule].map(dtNormEvidence).filter(Boolean);
    const mt = new Set(more.split(' ').filter((x) => x.length > 1));
    const nearDuplicate = context.some((text) => {
      if (text === more || text.includes(more) || more.includes(text)) return true;
      const tt = new Set(text.split(' ').filter((x) => x.length > 1));
      const overlap = [...mt].filter((x) => tt.has(x)).length;
      return mt.size > 1 && overlap / mt.size >= 0.8;
    });
    return nearDuplicate ? '' : gap.more;
  }

  function dtCareGaps(panel) {
    if (!S.careGapsComplete) {
      const what = S.careGapsUnread && S.careGapsUnread.length ? S.careGapsUnread.join(', ') : 'some data';
      panel.appendChild(dtNote(`Could not read: ${what} — press ↻`, 'rqm-care-head'));
    } else if (!S.careGaps.length) {
      panel.appendChild(dtNote('No care gaps found', 'rqm-care-head'));
    }
    if (!S.careGaps.length) return;

    const table = dtTable('rqm-cg', 'Care gaps by action', [
      ['Action'],
      ['Latest evidence'],
      ['Rule'],
      ['Source'],
    ]);
    const verbs = [
      ...GAP_VERBS,
      ...new Set(S.careGaps.map((g) => g.verb).filter((v) => !GAP_VERBS.includes(v))),
    ];
    for (const verb of verbs) {
      const list = S.careGaps.filter((g) => g.verb === verb);
      if (!list.length) continue;
      const body = document.createElement('tbody');
      body.appendChild(dtGroupRow(`${verb} · ${list.length}`, 4));
      for (const gap of [...list.filter((g) => g.tone === 'red'), ...list.filter((g) => g.tone !== 'red')]) {
        const tr = dtEl('tr', `rqm-care-row ${gap.tone === 'red' ? 'red' : 'amber'}`);
        const action = dtEl('td', 'rqm-ac');
        action.appendChild(dtEl('b', '', gap.action));
        if (gap.due) action.appendChild(dtEl('span', 'rqm-due', dtDue(gap.due)));
        const evidence = dtEl('td', 'rqm-ev');
        evidence.appendChild(dtEl('b', '', gap.fact));
        if (gap.date) evidence.appendChild(document.createTextNode(` · ${dtDate(gap.date)}`));
        const more = dtUsefulMore(gap);
        if (more) evidence.appendChild(dtEl('span', 'rqm-ex', more));
        tr.appendChild(action);
        tr.appendChild(evidence);
        tr.appendChild(dtEl('td', 'rqm-ru', gap.rule));
        tr.appendChild(dtEl('td', 'rqm-src', gap.src || ''));
        body.appendChild(tr);
      }
      table.appendChild(body);
    }
    panel.appendChild(table);
  }

  function dtGraph(test, gender, width) {
    const box = dtEl('div', 'rqm-gp');
    const head = dtEl('p', 'rqm-gh');
    head.appendChild(dtEl('b', '', test.name));
    const points = test.points
      .filter((p) => p.t !== null)
      .slice()
      .reverse()
      .map((p) => ({
        t: p.t,
        value: p.value,
        bound: !!p.comparator,
        shown: p.shown,
        unit: p.unit,
        bad: p.value === null ? 'NA' : null,
      }));
    const slope = dtSlope(fitLine(points.filter((p) => typeof p.value === 'number')), test.unit);
    if (slope) head.appendChild(document.createTextNode(` · ${slope}`));
    box.appendChild(head);
    if (points.length)
      box.appendChild(drawChart([{ points, color: LINE }], parseRange(test.range, gender), width));
    const table = dtTable('rqm-every', `Every ${test.name} result`, [['Date'], ['Value']]);
    const body = document.createElement('tbody');
    for (const p of test.points) {
      const tr = dtEl('tr');
      tr.appendChild(dtEl('td', '', p.t === null ? 'Unknown date' : dtDate(p.t)));
      const td = dtEl('td');
      td.appendChild(dtValue(p, gender, true));
      tr.appendChild(td);
      body.appendChild(tr);
    }
    table.appendChild(body);
    box.appendChild(table);
    return box;
  }

  function dtResults(panel, M) {
    dtProgress(panel, M);
    M.results().then((res) => {
      if (!res || !M.alive()) return;
      panel.textContent = '';
      const note = dtResultsLine(res, false);
      if (note) panel.appendChild(dtNote(note));
      if (!res.tests.length && !res.failedItems.length) return;

      const gender = M.demo ? M.demo.gender : null;
      const entries = [
        ...res.tests.map((test) => ({ test, name: test.name, t: test.points[0].t, panel: test.panel })),
        ...res.failedItems.map((item) => ({ item, name: item.name, t: item.t, panel: item.panel })),
      ].map((e) => ({ ...e, group: dtGroup(e.name) || dtGroup(e.panel) || 'Other' }));
      const rank = (e) => {
        const n = String(e.name || '').toLowerCase();
        if (/a1c/.test(n)) return 0;
        if (/fast.*glucose|glucose.*fast/.test(n)) return 1;
        if (/total.*cholesterol|^cholesterol$/.test(n)) return 2;
        if (n.includes('ldl')) return 3;
        if (n.includes('hdl')) return 4;
        if (n.includes('triglycer')) return 5;
        const i = DT_TEST_ORDER.findIndex((re) => re.test(n));
        return i < 0 ? DT_TEST_ORDER.length : i;
      };
      const table = dtTable('rqm-rl', 'Results', [
        ['Test'],
        ['Latest'],
        ['Previous'],
        ['Normal range', 'rqm-rg'],
      ]);
      const pane = dtEl('div', 'rqm-rpane');
      const picks = [];
      const choose = (i) => {
        picks.forEach((p, j) => {
          p.tr.className = j === i ? 'rqm-pick selected' : 'rqm-pick';
          p.button.setAttribute('aria-expanded', j === i ? 'true' : 'false');
          p.erow.hidden = j !== i;
          p.cell.textContent = '';
        });
        pane.textContent = '';
        pane.appendChild(dtGraph(picks[i].test, gender, 520));
        picks[i].cell.appendChild(dtGraph(picks[i].test, gender, 340));
      };
      for (const group of [...DT_GROUPS.map(([g]) => g), 'Other']) {
        const list = entries.filter((e) => e.group === group).sort((a, b) => rank(a) - rank(b));
        if (!list.length) continue;
        const body = document.createElement('tbody');
        body.appendChild(dtGroupRow(group, 4));
        for (const e of list) {
          const tr = dtEl('tr', e.test ? 'rqm-pick' : '');
          const testCell = dtEl('td', 'rqm-tn');
          tr.appendChild(testCell);
          body.appendChild(tr);
          if (!e.test) {
            testCell.textContent = e.name;
            const td = dtEl('td');
            td.appendChild(dtEl('span', 'rqm-unread', 'Could not read'));
            td.appendChild(dtEl('span', 'rqm-dd', e.t === null ? 'Unknown date' : dtDate(e.t)));
            tr.appendChild(td);
            tr.appendChild(dtEl('td', '', '—'));
            tr.appendChild(dtEl('td', 'rqm-rg', '—'));
            continue;
          }
          const [last, prev] = e.test.points;
          tr.appendChild(dtValueCell(last, gender, true));
          tr.appendChild(prev ? dtValueCell(prev, gender, false) : dtEl('td', '', '—'));
          tr.appendChild(dtEl('td', 'rqm-rg', dtRangeText(e.test.range, gender) || '—'));
          const erow = dtEl('tr', 'rqm-erow');
          const cell = dtEl('td');
          cell.setAttribute('colspan', '4');
          const i = picks.length;
          const graphId = `rqm-result-graph-${i}`;
          cell.id = graphId;
          cell.setAttribute('role', 'region');
          cell.setAttribute('aria-label', `${e.name} result graph and readings`);
          erow.appendChild(cell);
          erow.hidden = true;
          body.appendChild(erow);
          const button = dtEl('button', 'rqm-pick-btn', e.name);
          button.type = 'button';
          button.setAttribute('aria-expanded', 'false');
          button.setAttribute('aria-controls', graphId);
          testCell.appendChild(button);
          picks.push({ tr, erow, cell, button, test: e.test });
          button.onclick = () => choose(i);
          button.onkeydown = (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              choose(i);
            }
          };
        }
        table.appendChild(body);
      }
      const split = dtEl('div', 'rqm-split');
      split.appendChild(table);
      split.appendChild(pane);
      panel.appendChild(split);
      if (picks.length) choose(0);
      else pane.hidden = true;
    });
  }

  function dtDaily(rows, ok) {
    const days = new Set();
    return rows
      .filter(ok)
      .sort((a, b) => b.t - a.t)
      .filter((r) => {
        const d = new Date(r.t).toDateString();
        return days.has(d) ? false : days.add(d);
      })
      .slice(0, CFG.trendPoints)
      .reverse();
  }

  function dtVitalCard(title, latest, series, legend, width) {
    const card = dtEl('div', 'rqm-vcard');
    const head = dtEl('div', 'rqm-vh');
    head.appendChild(dtEl('b', '', title));
    if (latest) head.appendChild(dtEl('span', '', latest));
    card.appendChild(head);
    if (!series[0].points.length) {
      card.appendChild(dtEl('p', 'rqm-vs', 'No readings in the last 3 years'));
      return card;
    }
    if (legend.length) {
      const line = dtEl('p', 'rqm-vs');
      for (const [color, text] of legend) {
        const item = dtEl('span');
        if (color) {
          const swatch = dtEl('i', 'rqm-lg');
          swatch.style.background = color;
          item.appendChild(swatch);
        }
        item.appendChild(document.createTextNode(text));
        line.appendChild(item);
      }
      card.appendChild(line);
    }
    const chartWidth =
      typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width:700px)').matches
        ? 320
        : width;
    card.appendChild(drawChart(series, null, chartWidth));
    return card;
  }

  function dtVitals(panel, M) {
    M.data().then(({ vitals }) => {
      if (!M.alive()) return;
      if (!vitals) {
        panel.appendChild(dtNote('Could not read vitals — press ↻'));
        return;
      }
      const bp = dtDaily(
        vitals,
        (r) =>
          r.sys !== null &&
          r.dia !== null &&
          r.sys >= 50 &&
          r.sys <= 300 &&
          r.dia >= 20 &&
          r.dia <= 200 &&
          r.sys > r.dia,
      );
      const sys = bp.map((r) => ({ t: r.t, value: r.sys }));
      const dia = bp.map((r) => ({ t: r.t, value: r.dia }));
      const last = bp[bp.length - 1];
      panel.appendChild(
        dtVitalCard(
          'Blood pressure',
          last ? `${last.sys}/${last.dia} mmHg · ${dtDate(last.t)}` : '',
          [
            { points: sys, color: LINE },
            { points: dia, color: '#7a9cc6' },
          ],
          [
            [LINE, `Systolic ${dtSlope(fitLine(sys), 'mmHg')}`.trim()],
            ['#7a9cc6', `Diastolic ${dtSlope(fitLine(dia), 'mmHg')}`.trim()],
          ],
          900,
        ),
      );
      const grid = dtEl('div', 'rqm-vgrid');
      for (const [field, title, unit, lo, hi] of [
        ['bmi', 'BMI', 'kg/m²', 10, 80],
        ['weight', 'Weight', 'kg', 2, 400],
      ]) {
        const rows = dtDaily(vitals, (r) => typeof r[field] === 'number' && r[field] >= lo && r[field] <= hi);
        const points = rows.map((r) => ({ t: r.t, value: r[field] }));
        const latest = rows[rows.length - 1];
        const slope = dtSlope(fitLine(points), unit);
        grid.appendChild(
          dtVitalCard(
            title,
            latest ? `${latest[field]} ${unit} · ${dtDate(latest.t)}` : '',
            [{ points, color: LINE }],
            slope ? [[null, slope]] : [],
            440,
          ),
        );
      }
      panel.appendChild(grid);
    });
  }

  function dtMedicineRows(medicines) {
    const byKey = new Map();
    for (const m of (medicines && medicines.items) || []) {
      const name = normText(m.name);
      if (!name) continue;
      const k = `${name.toLowerCase()}|${normText(m.dose).toLowerCase()}`;
      const had = byKey.get(k);
      if (!had || (medStopped(had) && !medStopped(m))) byKey.set(k, m);
    }
    const state = (m) =>
      medStopped(m)
        ? normText(m.status) || 'Stopped'
        : /complet/i.test(m.status || '')
          ? 'Completed'
          : currentMedicine(m)
            ? 'Active'
            : 'Not current';
    const rows = [...byKey.values()].map((m) => ({ ...m, state: state(m) }));
    const t = (m) => parseDate(m.date) || 0;
    return [
      ...rows.filter((m) => m.state === 'Active').sort((a, b) => t(b) - t(a)),
      ...rows.filter((m) => m.state !== 'Active').sort((a, b) => t(b) - t(a)),
    ];
  }

  function dtMedicines(panel, M) {
    M.data().then(({ medicines }) => {
      if (!M.alive()) return;
      const note = medicineReadNote(medicines);
      if (note) panel.appendChild(dtNote(note));
      const rows = dtMedicineRows(medicines);
      if (!rows.length) {
        if (!note) panel.appendChild(dtNote('No medicines in Raqeem'));
        return;
      }
      const table = document.createElement('table');
      table.className = 'rqm-dt-t rqm-medt';
      const head = document.createElement('thead');
      const headRow = document.createElement('tr');
      for (const text of ['Medicine', 'Dose / frequency', 'Last ordered', 'Status']) {
        const cell = document.createElement('th');
        cell.setAttribute('scope', 'col');
        cell.textContent = text;
        headRow.appendChild(cell);
      }
      head.appendChild(headRow);
      table.appendChild(head);
      const body = document.createElement('tbody');
      for (const m of rows) {
        const row = document.createElement('tr');
        for (const [cls, label, text] of [
          ['rqm-mn', '', m.name],
          ['', 'Dose', m.dose || '—'],
          ['', 'Last ordered', parseDate(m.date) ? dtDate(parseDate(m.date)) : 'Unknown date'],
          [`rqm-mst ${m.state === 'Active' ? 'rqm-st-active' : 'rqm-st-other'}`, 'Status', m.state],
        ]) {
          const cell = document.createElement('td');
          cell.className = cls;
          if (label) cell.setAttribute('data-l', label);
          cell.textContent = text;
          row.appendChild(cell);
        }
        body.appendChild(row);
      }
      table.appendChild(body);
      panel.appendChild(table);
    });
  }

  function dtCalcResults(res) {
    const byItem = new Map();
    const at = (t) => (t === null ? null : new Date(t).toISOString());
    for (const test of res.tests) {
      for (const p of test.points) {
        if (!byItem.has(p.orderItemUid)) {
          byItem.set(p.orderItemUid, {
            item: { status: 'resulted', name: p.orderName, code: '', resultAt: at(p.t) },
            lr: { resultdate: at(p.t), resultvalues: [] },
          });
        }
        byItem
          .get(p.orderItemUid)
          .lr.resultvalues.push({ name: test.name, resultvalue: p.shown, uomdescription: p.unit });
      }
    }
    return [
      ...byItem.values(),
      ...res.failedItems.map((i) => ({
        item: { status: 'resulted', name: i.name, code: i.code, resultAt: at(i.t) },
        lr: null,
      })),
    ];
  }

  function dtBand(band, tone, extra) {
    const box = dtEl('div');
    box.appendChild(dtEl('span', `rqm-band ${tone}`, band));
    if (extra) box.appendChild(dtEl('span', 'rqm-band2', extra));
    return box;
  }

  function dtEgfrTone(g, acrCat) {
    const a = acrCat === 'A3' ? 2 : acrCat === 'A2' ? 1 : 0;
    if (g === 'G1' || g === 'G2') return ['green', 'amber', 'red'][a];
    if (g === 'G3a') return a ? 'red' : 'amber';
    return 'red';
  }

  const DT_PREVENT_BAND = {
    Low: ['green', 'Low (<3 %)'],
    Borderline: ['amber', 'Borderline (3–<5 %)'],
    Intermediate: ['amber', 'Intermediate (5–<10 %)'],
    High: ['red', 'High (≥10 %)'],
  };

  function dtCalcCell(tr, cls, label) {
    const td = dtEl('td', cls);
    if (label) td.setAttribute('data-l', label);
    const box = dtEl('div');
    td.appendChild(box);
    tr.appendChild(td);
    return box;
  }

  function dtCalculators(panel, M) {
    dtProgress(panel, M);
    Promise.all([M.results(), M.data()]).then(([res, data]) => {
      if (!res || !M.alive()) return;
      panel.textContent = '';
      const note = dtResultsLine(res, true);
      if (note) panel.appendChild(dtNote(note));
      const pkg = {
        demo: M.demo,
        diagnoses: data.diagnoses,
        results: dtCalcResults(res),
        resultsComplete: res.complete,
        vitals: data.vitals,
        medicines: data.medicines,
      };
      const table = dtTable('rqm-dt-t rqm-calc', 'Calculators', [
        ['Calculator'],
        ['Result'],
        ['Band'],
        ['Inputs used'],
        ['Source'],
      ]);
      const body = document.createElement('tbody');
      const cells = {};
      for (const [key, name, srcText, url] of DT_CALC) {
        const tr = dtEl('tr');
        tr.setAttribute('data-calc', key);
        const first = dtEl('td', 'rqm-cn1');
        first.appendChild(dtEl('b', '', name));
        tr.appendChild(first);
        const result = dtCalcCell(tr, 'rqm-res', 'Result');
        const out = dtEl('div');
        result.appendChild(out);
        const band = dtCalcCell(tr, 'rqm-bd', 'Band');
        const inputs = dtEl('ul', 'rqm-inp');
        dtCalcCell(tr, '', 'Inputs').appendChild(inputs);
        const link = dtEl('a', '', srcText);
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        dtCalcCell(tr, 'rqm-src', 'Source').appendChild(link);
        body.appendChild(tr);
        cells[key] = { result, out, band, inputs };
      }
      table.appendChild(body);
      panel.appendChild(table);

      const smoker = dtEl('fieldset', 'rqm-smk');
      const legend = dtEl('legend', '', 'Smoker');
      legend.appendChild(dtEl('span', '', ' · not saved'));
      smoker.appendChild(legend);
      const group = `rqm-smoker-${++dtSeq}`;
      for (const [label, value] of [
        ['Yes', true],
        ['No', false],
      ]) {
        const tick = dtEl('label');
        const input = dtEl('input');
        input.type = 'radio';
        input.name = group;
        input.value = label.toLowerCase();
        input.onchange = () => {
          M.smoker = value;
          paint();
        };
        tick.appendChild(input);
        tick.appendChild(document.createTextNode(label));
        smoker.appendChild(tick);
      }
      cells.prevent.result.appendChild(smoker);

      const list = (ul, inputs, skip, extra) => {
        const banner = inputs.filter((x) => x.source === 'banner').map((x) => x.text);
        for (const x of inputs)
          if (x.source !== 'banner' && !skip.includes(x.key)) ul.appendChild(dtEl('li', '', x.text));
        if (banner.length) ul.appendChild(dtEl('li', '', banner.join(' · ')));
        for (const text of extra || []) ul.appendChild(dtEl('li', '', text));
      };
      const missing = (box, calc) => {
        for (const text of calc.missing.length ? calc.missing : [calc.result.refused]) {
          if (text !== 'Tick smoker Yes or No') box.appendChild(dtEl('span', 'rqm-miss', text));
        }
      };
      const number = (box, text, unit) => {
        box.appendChild(dtEl('b', 'rqm-big', text));
        if (unit) box.appendChild(dtEl('span', 'rqm-u', ` ${unit}`));
      };

      function paint() {
        const all = CALC.calcInputs({ ...pkg, smoker: M.smoker });
        for (const c of Object.values(cells)) {
          c.out.textContent = '';
          c.band.textContent = '';
          c.inputs.textContent = '';
        }
        const eg = all.egfr;
        const acr = eg.inputs.find((x) => x.key === 'acr');
        if (eg.result.refused) missing(cells.egfr.out, eg);
        else {
          number(cells.egfr.out, String(eg.result.value), eg.result.unit);
          const g = eg.result.band.split(' ')[0];
          cells.egfr.band.appendChild(
            dtBand(
              `${g} · ${DT_EGFR_RANGE[g]}`,
              dtEgfrTone(g, acr && acr.category),
              acr
                ? `with ACR ${acr.shown}${acr.unit ? ' ' + acr.unit : ''}${acr.category ? ` (${acr.category})` : ''}`
                : '',
            ),
          );
        }
        list(cells.egfr.inputs, eg.inputs, ['acr']);
        const fib = all.fib4;
        if (fib.result.refused) missing(cells.fib4.out, fib);
        else {
          number(cells.fib4.out, fib.result.value.toFixed(2));
          const text = fib.result.band.split(':')[0];
          cells.fib4.band.appendChild(
            dtBand(text, /^Low/.test(text) ? 'green' : /^Indeterminate/.test(text) ? 'amber' : 'red'),
          );
        }
        list(cells.fib4.inputs, fib.inputs, []);
        const mz = all.mentzer;
        if (mz.result.refused) missing(cells.mentzer.out, mz);
        else {
          number(cells.mentzer.out, mz.result.value.toFixed(1));
          cells.mentzer.band.appendChild(
            dtBand(mz.result.band, /Indeterminate/.test(mz.result.band) ? 'grey' : 'amber'),
          );
        }
        list(cells.mentzer.inputs, mz.inputs, []);
        const pv = all.prevent;
        const outside = pv.result.hidden || pv.missing.some((x) => /PREVENT is for/.test(x));
        if (outside) smoker.remove();
        if (outside) missing(cells.prevent.out, pv);
        else if (pv.result.refused) {
          missing(cells.prevent.out, pv);
          list(cells.prevent.inputs, pv.inputs, ['smoker']);
        } else {
          const r = pv.result;
          number(cells.prevent.out, r.value.toFixed(1));
          cells.prevent.out.appendChild(document.createTextNode(' % ASCVD'));
          cells.prevent.out.appendChild(
            dtEl(
              'span',
              'rqm-sub2',
              `Total CVD ${r.totalCvd10y.toFixed(1)} % · Heart failure ${
                r.heartFailure10y === null
                  ? `not calculated (${r.heartFailureRefused})`
                  : `${r.heartFailure10y.toFixed(1)} %`
              }`,
            ),
          );
          const [tone, text] = DT_PREVENT_BAND[r.band.split(' ')[0]] || ['grey', r.band];
          cells.prevent.band.appendChild(dtBand(text, tone));
          list(cells.prevent.inputs, pv.inputs, ['smoker']);
        }
        const fx = all.frax;
        if (fx.result.refused) cells.frax.out.appendChild(dtEl('span', 'rqm-miss', fx.result.refused));
        else {
          const open = dtEl('a', 'rqm-dt-btn', 'Open FRAX');
          open.href = fx.result.url;
          open.target = '_blank';
          open.rel = 'noopener noreferrer';
          cells.frax.out.appendChild(open);
        }
        list(cells.frax.inputs, fx.inputs, [], fx.missing);
      }
      paint();
    });
  }

  function showDetails() {
    injectCss();

    if (!S.verdicts || CFG.display.some((key) => S.verdicts[key] && S.verdicts[key].state === 'loading'))
      return;
    const returnFocus = document.activeElement;

    if (document.querySelectorAll) {
      document.querySelectorAll('.rqm-screening-pop').forEach((pop) => {
        if (typeof pop.__rqmClose === 'function') pop.__rqmClose();
        else pop.hidden = true;
      });
    }

    const existing = document.getElementById('rqm-modal-backdrop');

    if (existing) {
      existing.remove();
    }

    const backdrop = document.createElement('div');
    backdrop.id = 'rqm-modal-backdrop';
    const modal = document.createElement('div');
    modal.id = 'rqm-modal';
    if (modal.setAttribute) {
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'rqm-modal-title');
    }

    const pid = S.ctx.patientuid;
    const ctx = { ...S.ctx };
    const demo = readBanner();
    const alive = () => document.getElementById('rqm-modal') === modal && S.ctx.patientuid === pid;
    const dismiss = () => {
      backdrop.remove();
      if (returnFocus && typeof returnFocus.focus === 'function') returnFocus.focus();
    };

    const head = dtEl('div', 'rqm-dt-head');
    const title = dtEl('h2', '', 'Details');
    title.id = 'rqm-modal-title';
    if (demo) title.appendChild(dtEl('span', '', `${demo.age} ${demo.gender}`));
    head.appendChild(title);
    head.appendChild(dtEl('span', 'rqm-asof', S.readAt ? `Raqeem data up to ${dtDate(S.readAt)}` : ''));
    const close = dtEl('button', 'rqm-dt-x', '×');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close details');
    close.onclick = dismiss;
    head.appendChild(close);
    modal.appendChild(head);

    if (S.knownConditions.length) {
      const known = dtEl('div', 'rqm-dt-known');
      for (const item of S.knownConditions) {
        const line = dtEl('span');
        line.appendChild(dtEl('b', '', item.name));
        line.appendChild(document.createTextNode(` ${item.code} · ${dtDate(parseDate(item.firstCoded))}`));
        known.appendChild(line);
      }
      modal.appendChild(known);
    }

    const M = { pid, demo, alive, listeners: [], smoker: null, resultsP: null, dataP: null };
    M.results = () =>
      M.resultsP ||
      (M.resultsP = arFetchAllResults(ctx, {
        api,
        alive,
        cache: dtReadCache(pid),
        onProgress: (done, total) => M.listeners.forEach((fn) => fn(done, total)),
      }).catch((e) => {
        log('results', e && e.message);
        return { tests: [], failedItems: [], listComplete: false, pagesRead: 0, complete: false };
      }));
    M.data = () =>
      M.dataP ||
      (M.dataP = dtData(ctx).catch((e) => {
        log('details data', e && e.message);
        return { diagnoses: null, medicines: null, vitals: null };
      }));

    const BUILD = {
      caregaps: dtCareGaps,
      results: dtResults,
      vitals: dtVitals,
      medicines: dtMedicines,
      calculators: dtCalculators,
    };
    const tablist = dtEl('div', 'rqm-dt-tabs');
    tablist.setAttribute('role', 'tablist');
    tablist.setAttribute('aria-label', 'Details');
    const body = dtEl('div', 'rqm-dt-body');
    const tabs = [];
    const panels = [];
    const built = {};
    const select = (i, focus) => {
      tabs.forEach((t, j) => {
        t.setAttribute('aria-selected', j === i ? 'true' : 'false');
        t.setAttribute('tabindex', j === i ? '0' : '-1');
        panels[j].hidden = j !== i;
      });
      const key = DT_TABS[i][0];
      if (!built[key]) {
        built[key] = true;
        try {
          BUILD[key](panels[i], M);
        } catch (e) {
          log('details', key, e && e.message);
          panels[i].appendChild(dtNote('Could not show this tab — press ↻'));
        }
      }
      if (focus && typeof tabs[i].focus === 'function') tabs[i].focus();
    };
    DT_TABS.forEach(([key, label], i) => {
      const tab = dtEl('button', 'rqm-dt-tab', label);
      tab.type = 'button';
      tab.id = `rqm-tab-${key}`;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', `rqm-panel-${key}`);
      tab.onclick = () => select(i, false);
      tab.onkeydown = (event) => {
        const n = DT_TABS.length;
        const to = { ArrowRight: (i + 1) % n, ArrowLeft: (i + n - 1) % n, Home: 0, End: n - 1 }[event.key];
        if (to === undefined) return;
        event.preventDefault();
        select(to, true);
      };
      const panel = dtEl('div', 'rqm-dt-panel');
      panel.id = `rqm-panel-${key}`;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tab.id);
      panel.setAttribute('tabindex', '0');
      tabs.push(tab);
      panels.push(panel);
      tablist.appendChild(tab);
      body.appendChild(panel);
    });
    modal.appendChild(tablist);
    modal.appendChild(body);
    select(0, false);

    backdrop.appendChild(modal);

    backdrop.onclick = (e) => {
      if (e.target === backdrop) dismiss();
    };

    document.body.appendChild(backdrop);
    modal.onkeydown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        dismiss();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(
        modal.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.closest('[hidden]') && el.getAttribute('tabindex') !== '-1');
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    if (typeof close.focus === 'function') close.focus();
  }

  function render(verdicts, pidShown) {
    injectCss();
    const banner = document.getElementById('patientbanner');
    if (!banner) return;

    let row = document.getElementById('rqm-chips');
    if (!row || !banner.contains(row)) {
      if (row) row.remove();
      row = document.createElement('div');
      row.id = 'rqm-chips';
      const sec = banner.querySelector('.sec-banner');
      (sec || banner).appendChild(row);
    }
    row.textContent = '';

    const eligibleForAdd = [];
    const actionable = CFG.display.filter(
      (key) => verdicts && ['eligible', 'invalid'].includes(verdicts[key] && verdicts[key].state),
    );
    const followDue = actionable.filter((key) => verdicts[key].mode === 'followup').length;
    const screenDue = actionable.length - followDue;
    const dueText = [followDue && `${followDue} follow-up`, screenDue && `${screenDue} screening`]
      .filter(Boolean)
      .join(' · ');
    const loading = CFG.display.some((key) => verdicts && verdicts[key] && verdicts[key].state === 'loading');
    const lead = document.createElement('div');
    lead.className = 'rqm-screening-lead';
    const heading = document.createElement('b');
    heading.textContent = 'Screening & follow-up';
    const badge = document.createElement('span');
    badge.className = 'rqm-screening-badge';
    if (badge.setAttribute) {
      badge.setAttribute('role', 'status');
      badge.setAttribute('aria-live', 'polite');
      badge.setAttribute('aria-atomic', 'true');
    }
    const unreadCount = CFG.display.filter(
      (key) => verdicts && verdicts[key] && verdicts[key].state === 'unreadable',
    ).length;
    badge.textContent = loading
      ? 'Checking…'
      : dueText
        ? `${dueText} due`
        : unreadCount
          ? `${unreadCount} could not be read`
          : 'Nothing due';
    badge.style.background = loading
      ? '#5b646c'
      : dueText
        ? '#c0392b'
        : unreadCount
          ? STATE.unreadable.accent
          : '#2e7d4f';
    badge.style.color = '#fff';
    lead.appendChild(heading);
    lead.appendChild(badge);
    row.appendChild(lead);

    const popups = [];
    const closePopups = (except) => {
      for (const pop of popups) {
        if (pop !== except && typeof pop.__rqmClose === 'function') pop.__rqmClose();
      }
    };

    for (const [index, key] of CFG.display.entries()) {
      const res = verdicts && verdicts[key];
      if (!res) continue;
      const followup = res.mode === 'followup';
      if ((res.state === 'eligible' || res.state === 'invalid') && CFG.icdAdd[key] && !followup) {
        eligibleForAdd.push(key);
      }

      const style = STATE[res.state] || STATE.excluded;
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'rqm-screening-cell';
      cell.style.cssText = `--rqm-bg:${style.bg};--rqm-fg:${style.fg};--rqm-accent:${style.accent}`;

      const icon = document.createElement('i');
      icon.className = 'rqm-screening-icon';
      icon.textContent = style.icon;
      const mode = document.createElement('span');
      mode.className = `rqm-mode rqm-mode-${followup ? 'followup' : 'screening'}`;
      mode.textContent = followup ? 'FOLLOW-UP' : 'SCREENING';
      const copy = document.createElement('span');
      copy.className = 'rqm-screening-copy';
      const name = document.createElement('b');
      name.textContent = itemName(key, res);
      const state = document.createElement('span');
      state.className = 'rqm-screening-state';
      state.textContent = stateLabel(res);
      const note = document.createElement('span');
      note.className = 'rqm-screening-note';
      note.textContent = res.note || res.why || '';
      copy.appendChild(name);
      copy.appendChild(state);
      copy.appendChild(note);
      cell.appendChild(icon);
      cell.appendChild(mode);
      cell.appendChild(copy);

      const pop = document.createElement('span');
      const popId = `rqm-screening-pop-${key}`;
      pop.id = popId;
      pop.className = `rqm-screening-pop${index > 1 ? ' rqm-pop-right' : ''}`;
      pop.hidden = true;
      if (pop.setAttribute) pop.setAttribute('role', 'tooltip');
      if (cell.setAttribute) {
        cell.setAttribute('aria-controls', popId);
        cell.setAttribute('aria-expanded', 'false');
      }
      const popTitle = document.createElement('b');
      popTitle.textContent = `${itemName(key, res)} — ${stateLabel(res)}`;
      pop.appendChild(popTitle);
      for (const text of detailLines(res)) {
        const line = document.createElement('span');
        line.textContent = text;
        pop.appendChild(line);
      }
      cell.appendChild(pop);
      let hoverGen = 0;
      let pinned = false;
      const setPopupOpen = (open) => {
        pop.hidden = !open;
        if (cell.setAttribute) cell.setAttribute('aria-expanded', String(open));
      };
      pop.__rqmClose = () => {
        pinned = false;
        hoverGen++;
        setPopupOpen(false);
      };
      popups.push(pop);
      cell.onmouseenter = () => {
        const gen = ++hoverGen;
        setTimeout(() => {
          if (gen === hoverGen) {
            closePopups(pop);
            setPopupOpen(true);
          }
        }, 300);
      };
      cell.onmouseleave = () => {
        hoverGen++;
        if (!pinned) setPopupOpen(false);
      };
      cell.onfocus = () => {
        closePopups(pop);
        setPopupOpen(true);
      };
      cell.onblur = () => {
        pop.__rqmClose();
      };
      cell.onclick = (event) => {
        if (event) event.stopPropagation();
        closePopups(pop);
        pinned = !pinned;
        setPopupOpen(pinned);
      };
      cell.onkeydown = (event) => {
        if (event.key === 'Escape') {
          if (event.preventDefault) event.preventDefault();
          pop.__rqmClose();
          if (typeof cell.blur === 'function') cell.blur();
        }
      };
      row.appendChild(cell);
    }

    const actions = document.createElement('div');
    actions.className = 'rqm-screening-actions';
    const details = document.createElement('button');
    details.className = 'rqm-btn rqm-btn-primary';
    details.textContent = 'Details';
    details.disabled = loading;
    details.title = loading ? 'Wait for screening checks to finish' : 'Open care gaps and recommendations';
    details.onclick = showDetails;
    actions.appendChild(details);

    const refresh = document.createElement('button');
    refresh.className = 'rqm-btn';
    refresh.textContent = '↻';
    refresh.title = 'Refresh';
    if (refresh.setAttribute) refresh.setAttribute('aria-label', 'Refresh screening checks');
    refresh.onclick = () => refreshNow(S.ctx.patientuid);
    actions.appendChild(refresh);

    if (eligibleForAdd.length) {
      const add = document.createElement('button');
      add.className = 'rqm-btn rqm-btn-add';
      add.textContent = 'Add screening codes';
      add.onclick = () =>
        S.ctx.patientuid === pidShown
          ? addAllEligible(eligibleForAdd)
          : alert('The patient has changed. Press ↻ and try again.');
      actions.appendChild(add);
    }
    row.appendChild(actions);

    if (!S.popupOutsideBound && typeof document.addEventListener === 'function') {
      document.addEventListener('click', (event) => {
        const current = document.getElementById('rqm-chips');
        if (!current || !current.contains(event.target)) {
          for (const pop of document.querySelectorAll('.rqm-screening-pop')) {
            if (typeof pop.__rqmClose === 'function') pop.__rqmClose();
          }
        }
      });
      S.popupOutsideBound = true;
    }
  }

  function kick() {
    if (oldScriptRunning()) {
      return;
    }

    if (!/emrview/.test(location.hash)) {
      return;
    }

    const pid = S.ctx.patientuid;

    if (!pid) {
      return;
    }

    const demo = readBanner();

    if (!demo) {
      const stale = document.getElementById('rqm-chips');

      if (stale) {
        stale.remove();
      }

      if (!bannerTimer && bannerTries < 20) {
        bannerTries++;

        bannerTimer = setTimeout(() => {
          bannerTimer = null;

          kick();
        }, 500);
      }

      return;
    }

    bannerTries = 0;

    const key = `${pid}|${demo.gender}|${demo.age}`;

    if (S.verdicts && inflightKey === key) {
      render(S.verdicts, pid);

      return;
    }

    const cached = cacheGet(pid, key);

    if (cached) {
      S.verdicts = cached.verdicts;
      S.careGaps = cached.careGaps || [];
      S.careGapsComplete = cached.careGapsComplete === true;
      S.knownConditions = cached.knownConditions || [];
      S.medicines = cached.medicines || [];
      S.medicineNote = cached.medicineNote || '';
      S.careGapsUnread = [];
      S.readAt = cached.readAt || null;

      inflightKey = key;

      render(S.verdicts, pid);

      return;
    }

    render(loadingVerdicts(), pid);

    if (inflight && inflightKey === key) {
      return;
    }

    inflightKey = key;

    const gen = ++runGen;

    inflight = refine({ ...S.ctx }, demo, key, gen).finally(() => {
      if (gen === runGen) {
        inflight = null;
      }
    });
  }

  async function refine(ctx, demo, key, gen) {
    const [diagnoses, visits, fit, medicines, vitals] = await Promise.all([
      fetchDiagnoses(ctx),
      fetchVisits(ctx),
      fetchFitResults(ctx),
      fetchMedicines(ctx),
      fetchVitals(ctx),
    ]);

    const labs = await fetchLabHistory(ctx, visits);

    if (!labs || gen !== runGen || key !== inflightKey || ctx.patientuid !== S.ctx.patientuid) return;
    if (!visits) labs.complete = false;
    if (fit) {
      labs.items.push(...fit);
    }

    labs.fitFailed = !fit;
    if (labs.fitFailed) labs.complete = false;

    await resolveLabValues(ctx, labs);

    await resolveHistory(ctx, labs, historyKeys(diagnoses));

    if (gen !== runGen || key !== inflightKey || ctx.patientuid !== S.ctx.patientuid) {
      return;
    }

    S.verdicts = evaluate(demo, diagnoses, visits, labs, medicines);
    S.careGaps = buildCareGaps(demo, diagnoses, S.verdicts, medicines, vitals, labs, visits);
    const resultReadFailed =
      Object.values(labs.checks || {}).some((list) => list.some((c) => c.check === 'unreadable')) ||
      Object.values(labs.history || {}).some((list) =>
        list.some((c) => c.check === 'unreadable' && !c.capped),
      );
    const anyUnreadable = CFG.display.some((k) => S.verdicts[k] && S.verdicts[k].state === 'unreadable');
    const displayComplete = !!(
      diagnoses &&
      visits &&
      labs.complete &&
      !labs.fitFailed &&
      medicines &&
      medicines.complete &&
      vitals &&
      pregnancyStatus(demo, diagnoses, visits, labs) !== null &&
      !resultReadFailed &&
      !anyUnreadable
    );
    S.careGapsComplete = displayComplete;
    S.knownConditions = knownConditions(diagnoses);
    S.medicines = medicineSummary(medicines);
    S.medicineNote = medicineReadNote(medicines);
    const unread = [
      [!diagnoses, 'diagnoses'],
      [!visits || pregnancyStatus(demo, diagnoses, visits, labs) === null, 'visits'],
      [(!labs.complete && !labs.fitFailed) || resultReadFailed, 'lab results'],
      [labs.fitFailed, 'FIT results'],
      [!medicines || !medicines.complete, 'medicines'],
      [!vitals, 'vitals'],
    ]
      .filter(([bad]) => bad)
      .map(([, what]) => what);
    S.careGapsUnread = displayComplete ? [] : unread.length ? unread : ['lab results'];
    S.readAt = Date.now();
    S.rawFor = { pid: ctx.patientuid, diagnoses, medicines, vitals };

    S.labsFor = { pid: ctx.patientuid, labs };
    S.vitalsFor = { pid: ctx.patientuid, rows: vitals };

    if (displayComplete) {
      cachePut(ctx.patientuid, key, {
        verdicts: S.verdicts,
        careGaps: S.careGaps,
        careGapsComplete: S.careGapsComplete,
        knownConditions: S.knownConditions,
        medicines: S.medicines,
        medicineNote: S.medicineNote,
        readAt: S.readAt,
      });
    }

    render(S.verdicts, ctx.patientuid);
  }

  window.addEventListener('hashchange', kick);

  let watchTimer = null;

  function watchBanner() {
    watchTimer = null;

    const pid = S.ctx.patientuid;

    if (!pid || !document.getElementById('patientbanner')) {
      return;
    }

    const demo = readBanner();

    const shown = demo ? `${pid}|${demo.gender}|${demo.age}` : '';

    if (!document.getElementById('rqm-chips') || shown !== inflightKey) {
      kick();
    }
  }

  const observer = new MutationObserver(() => {
    if (!watchTimer) {
      watchTimer = setTimeout(watchBanner, 200);
    }
  });

  function armObserver() {
    observer.observe(document.body, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', armObserver);
  } else {
    armObserver();
  }

  S._internals = {
    CFG,
    STATUS,
    evaluate,
    fetchDiagnoses,
    fetchVisits,
    fetchLabHistory,
    fetchFitResults,
    labMatches,
    latestResult,
    latestPending,
    resultWindowStatus,
    resolveLabValues,
    checkLine,
    parseRange,
    fitLine,
    valueOf,
    drawChart,
    trendNote,
    loadTrends,
    trendSeries,
    fetchBpSeries,
    fetchMedicines,
    fetchVitals,
    buildCareGaps,
    knownConditions,
    medicineSummary,
    chipNote,
    addAllEligible,
    showDetails,
    render,
    MEDCLASS,
    medClass,
    currentMedicine,
    currentMeds,
    pregnancyStatus,
    fitResult,
    hcgResult,
    atLeast,
    isBelow,
    egfrFrom,
    resolveHistory,
    historyKeys,
    detailLines,
    medicineReadNote,
    statinEvent,
    statinIntensity,
    leadingRun,
    a1cAtLeast,
    acrAtLeast,
    arFetchAllResults,
    CALC,
    dtFlag,
    dtRangeText,
    dtMedicineRows,
    dtCalcResults,
    dtResultsLine,
  };
})();
