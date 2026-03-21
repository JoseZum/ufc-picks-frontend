/**
 * Country Code Mapping Utility
 * Maps country names/nationalities to country and Flagpack-specific codes.
 * Used with local react-flagpack assets in /public/flags.
 */

interface CountryMapping {
  code: string;
  patterns: RegExp[];
}

const countryMappings: CountryMapping[] = [
  // North America
  { code: 'US', patterns: [/^usa?$/i, /united\s*states/i, /america/i] },
  { code: 'CA', patterns: [/^canada$/i, /canadian/i] },
  { code: 'MX', patterns: [/^mexico$/i, /mexican/i, /^mex$/i] },

  // South America
  { code: 'BR', patterns: [/^brazil$/i, /brazilian/i, /brasil/i] },
  { code: 'AR', patterns: [/^argentina$/i, /argentinian/i, /argentine/i] },
  { code: 'CL', patterns: [/^chile$/i, /chilean/i] },
  { code: 'CO', patterns: [/^colombia$/i, /colombian/i] },
  { code: 'PE', patterns: [/^peru$/i, /peruvian/i] },
  { code: 'VE', patterns: [/^venezuela$/i, /venezuelan/i] },
  { code: 'EC', patterns: [/^ecuador$/i, /ecuadorian/i] },
  { code: 'UY', patterns: [/^uruguay$/i, /uruguayan/i] },
  { code: 'PY', patterns: [/^paraguay$/i, /paraguayan/i] },
  { code: 'BO', patterns: [/^bolivia$/i, /bolivian/i] },
  { code: 'GY', patterns: [/^guyana$/i, /guyanese/i] },
  { code: 'SR', patterns: [/^suriname$/i, /surinamese/i] },

  // Europe - Western
  { code: 'GB-ENG', patterns: [/^england$/i, /english/i] },
  { code: 'GB-SCT', patterns: [/^scotland$/i, /scottish/i] },
  { code: 'GB-WLS', patterns: [/^wales$/i, /welsh/i] },
  { code: 'GB-NIR', patterns: [/^northern\s*ireland$/i, /northern\s*irish/i] },
  { code: 'GB-UKM', patterns: [/^uk$/i, /^britain$/i, /^great\s*britain$/i, /united\s*kingdom/i, /british/i] },
  { code: 'IE', patterns: [/^ireland$/i, /irish/i] },
  { code: 'FR', patterns: [/^france$/i, /french/i] },
  { code: 'DE', patterns: [/^germany$/i, /german/i, /deutschland/i] },
  { code: 'NL', patterns: [/^netherlands$/i, /dutch/i, /holland/i] },
  { code: 'BE', patterns: [/^belgium$/i, /belgian/i] },
  { code: 'AT', patterns: [/^austria$/i, /austrian/i] },
  { code: 'CH', patterns: [/^switzerland$/i, /swiss/i] },
  { code: 'LU', patterns: [/^luxembourg$/i, /luxembourgish/i] },

  // Europe - Southern
  { code: 'ES', patterns: [/^spain$/i, /spanish/i, /espa[nñ]a/i] },
  { code: 'PT', patterns: [/^portugal$/i, /portuguese/i] },
  { code: 'IT', patterns: [/^italy$/i, /italian/i, /italia/i] },
  { code: 'GR', patterns: [/^greece$/i, /greek/i] },
  { code: 'HR', patterns: [/^croatia$/i, /croatian/i] },
  { code: 'SI', patterns: [/^slovenia$/i, /slovenian/i] },
  { code: 'RS', patterns: [/^serbia$/i, /serbian/i] },
  { code: 'BA', patterns: [/^bosnia$/i, /bosnian/i, /bosnia.*herzegovina/i] },
  { code: 'ME', patterns: [/^montenegro$/i, /montenegrin/i] },
  { code: 'MK', patterns: [/^north\s*macedonia$/i, /^macedonia$/i, /macedonian/i] },
  { code: 'AL', patterns: [/^albania$/i, /albanian/i] },
  { code: 'MT', patterns: [/^malta$/i, /maltese/i] },
  { code: 'CY', patterns: [/^cyprus$/i, /cypriot/i] },

  // Europe - Northern
  { code: 'SE', patterns: [/^sweden$/i, /swedish/i] },
  { code: 'NO', patterns: [/^norway$/i, /norwegian/i] },
  { code: 'DK', patterns: [/^denmark$/i, /danish/i] },
  { code: 'FI', patterns: [/^finland$/i, /finnish/i] },
  { code: 'IS', patterns: [/^iceland$/i, /icelandic/i] },

  // Europe - Eastern
  { code: 'PL', patterns: [/^poland$/i, /polish/i, /polska/i] },
  { code: 'CZ', patterns: [/^czech$/i, /^czechia$/i, /czech\s*republic/i] },
  { code: 'SK', patterns: [/^slovakia$/i, /slovak/i] },
  { code: 'HU', patterns: [/^hungary$/i, /hungarian/i] },
  { code: 'RO', patterns: [/^romania$/i, /romanian/i] },
  { code: 'BG', patterns: [/^bulgaria$/i, /bulgarian/i] },
  { code: 'MD', patterns: [/^moldova$/i, /moldovan/i] },
  { code: 'UA', patterns: [/^ukraine$/i, /ukrainian/i] },
  { code: 'BY', patterns: [/^belarus$/i, /belarusian/i] },
  { code: 'LT', patterns: [/^lithuania$/i, /lithuanian/i] },
  { code: 'LV', patterns: [/^latvia$/i, /latvian/i] },
  { code: 'EE', patterns: [/^estonia$/i, /estonian/i] },

  // Russia & Caucasus
  { code: 'RU', patterns: [/^russia$/i, /russian/i, /^dagestan$/i, /dagestani/i, /^chechnya$/i, /chechen/i] },
  { code: 'GE', patterns: [/^georgia$/i, /georgian/i] },
  { code: 'AM', patterns: [/^armenia$/i, /armenian/i] },
  { code: 'AZ', patterns: [/^azerbaijan$/i, /azerbaijani/i, /azeri/i] },

  // Central Asia
  { code: 'KZ', patterns: [/^kazakhstan$/i, /kazakh/i] },
  { code: 'UZ', patterns: [/^uzbekistan$/i, /uzbek/i] },
  { code: 'TJ', patterns: [/^tajikistan$/i, /tajik/i] },
  { code: 'KG', patterns: [/^kyrgyzstan$/i, /kyrgyz/i] },
  { code: 'TM', patterns: [/^turkmenistan$/i, /turkmen/i] },

  // Middle East
  { code: 'TR', patterns: [/^turkey$/i, /turkish/i, /^t[uü]rkiye$/i] },
  { code: 'IL', patterns: [/^israel$/i, /israeli/i] },
  { code: 'SA', patterns: [/^saudi$/i, /saudi\s*arabia/i] },
  { code: 'AE', patterns: [/^uae$/i, /^emirates$/i, /united\s*arab\s*emirates/i, /emirati/i, /dubai/i] },
  { code: 'IQ', patterns: [/^iraq$/i, /iraqi/i] },
  { code: 'IR', patterns: [/^iran$/i, /iranian/i, /persian/i] },
  { code: 'SY', patterns: [/^syria$/i, /syrian/i] },
  { code: 'JO', patterns: [/^jordan$/i, /jordanian/i] },
  { code: 'LB', patterns: [/^lebanon$/i, /lebanese/i] },
  { code: 'KW', patterns: [/^kuwait$/i, /kuwaiti/i] },
  { code: 'QA', patterns: [/^qatar$/i, /qatari/i] },
  { code: 'BH', patterns: [/^bahrain$/i, /bahraini/i] },
  { code: 'OM', patterns: [/^oman$/i, /omani/i] },
  { code: 'YE', patterns: [/^yemen$/i, /yemeni/i] },
  { code: 'PS', patterns: [/^palestine$/i, /palestinian/i] },

  // Asia - East
  { code: 'CN', patterns: [/^china$/i, /chinese/i] },
  { code: 'JP', patterns: [/^japan$/i, /japanese/i] },
  { code: 'KR', patterns: [/^south\s*korea$/i, /^korea$/i, /korean/i] },
  { code: 'KP', patterns: [/^north\s*korea$/i] },
  { code: 'TW', patterns: [/^taiwan$/i, /taiwanese/i] },
  { code: 'HK', patterns: [/^hong\s*kong$/i] },
  { code: 'MO', patterns: [/^macau$/i, /^macao$/i] },
  { code: 'MN', patterns: [/^mongolia$/i, /mongolian/i] },

  // Asia - Southeast
  { code: 'TH', patterns: [/^thailand$/i, /thai/i] },
  { code: 'VN', patterns: [/^vietnam$/i, /vietnamese/i] },
  { code: 'PH', patterns: [/^philippines$/i, /filipino/i, /filipina/i] },
  { code: 'ID', patterns: [/^indonesia$/i, /indonesian/i] },
  { code: 'MY', patterns: [/^malaysia$/i, /malaysian/i] },
  { code: 'SG', patterns: [/^singapore$/i, /singaporean/i] },
  { code: 'MM', patterns: [/^myanmar$/i, /^burma$/i, /burmese/i] },
  { code: 'KH', patterns: [/^cambodia$/i, /cambodian/i, /khmer/i] },
  { code: 'LA', patterns: [/^laos$/i, /lao/i, /laotian/i] },

  // Asia - South
  { code: 'IN', patterns: [/^india$/i, /indian/i] },
  { code: 'PK', patterns: [/^pakistan$/i, /pakistani/i] },
  { code: 'BD', patterns: [/^bangladesh$/i, /bangladeshi/i] },
  { code: 'NP', patterns: [/^nepal$/i, /nepali/i, /nepalese/i] },
  { code: 'LK', patterns: [/^sri\s*lanka$/i, /sri\s*lankan/i] },
  { code: 'AF', patterns: [/^afghanistan$/i, /afghan/i] },

  // Oceania
  { code: 'AU', patterns: [/^australia$/i, /australian/i, /^aussie$/i] },
  { code: 'NZ', patterns: [/^new\s*zealand$/i, /^nz$/i, /kiwi/i] },
  { code: 'FJ', patterns: [/^fiji$/i, /fijian/i] },
  { code: 'PG', patterns: [/^papua\s*new\s*guinea$/i] },
  { code: 'WS', patterns: [/^samoa$/i, /samoan/i] },
  { code: 'TO', patterns: [/^tonga$/i, /tongan/i] },
  { code: 'GU', patterns: [/^guam$/i, /guamanian/i] },

  // Africa - North
  { code: 'EG', patterns: [/^egypt$/i, /egyptian/i] },
  { code: 'MA', patterns: [/^morocco$/i, /moroccan/i] },
  { code: 'DZ', patterns: [/^algeria$/i, /algerian/i] },
  { code: 'TN', patterns: [/^tunisia$/i, /tunisian/i] },
  { code: 'LY', patterns: [/^libya$/i, /libyan/i] },

  // Africa - West
  { code: 'NG', patterns: [/^nigeria$/i, /nigerian/i] },
  { code: 'GH', patterns: [/^ghana$/i, /ghanaian/i] },
  { code: 'SN', patterns: [/^senegal$/i, /senegalese/i] },
  { code: 'CI', patterns: [/^ivory\s*coast$/i, /^c[oô]te\s*d'?ivoire$/i, /ivorian/i] },
  { code: 'CM', patterns: [/^cameroon$/i, /cameroonian/i] },
  { code: 'ML', patterns: [/^mali$/i, /malian/i] },
  { code: 'BF', patterns: [/^burkina\s*faso$/i, /burkinabe/i] },
  { code: 'NE', patterns: [/^niger$/i, /nigerien/i] },
  { code: 'GN', patterns: [/^guinea$/i, /guinean/i] },
  { code: 'BJ', patterns: [/^benin$/i, /beninese/i] },
  { code: 'TG', patterns: [/^togo$/i, /togolese/i] },
  { code: 'SL', patterns: [/^sierra\s*leone$/i, /sierra\s*leonean/i] },
  { code: 'LR', patterns: [/^liberia$/i, /liberian/i] },
  { code: 'MR', patterns: [/^mauritania$/i, /mauritanian/i] },
  { code: 'CV', patterns: [/^cape\s*verde$/i, /cabo\s*verde/i, /cape\s*verdean/i] },
  { code: 'GM', patterns: [/^gambia$/i, /gambian/i] },
  { code: 'GW', patterns: [/^guinea.bissau$/i] },

  // Africa - East
  { code: 'KE', patterns: [/^kenya$/i, /kenyan/i] },
  { code: 'ET', patterns: [/^ethiopia$/i, /ethiopian/i] },
  { code: 'TZ', patterns: [/^tanzania$/i, /tanzanian/i] },
  { code: 'UG', patterns: [/^uganda$/i, /ugandan/i] },
  { code: 'RW', patterns: [/^rwanda$/i, /rwandan/i] },
  { code: 'SO', patterns: [/^somalia$/i, /somali/i] },
  { code: 'SD', patterns: [/^sudan$/i, /sudanese/i] },
  { code: 'SS', patterns: [/^south\s*sudan$/i] },
  { code: 'ER', patterns: [/^eritrea$/i, /eritrean/i] },
  { code: 'DJ', patterns: [/^djibouti$/i, /djiboutian/i] },

  // Africa - South
  { code: 'ZA', patterns: [/^south\s*africa$/i, /south\s*african/i] },
  { code: 'ZW', patterns: [/^zimbabwe$/i, /zimbabwean/i] },
  { code: 'ZM', patterns: [/^zambia$/i, /zambian/i] },
  { code: 'BW', patterns: [/^botswana$/i, /botswanan/i] },
  { code: 'NA', patterns: [/^namibia$/i, /namibian/i] },
  { code: 'MZ', patterns: [/^mozambique$/i, /mozambican/i] },
  { code: 'MW', patterns: [/^malawi$/i, /malawian/i] },
  { code: 'AO', patterns: [/^angola$/i, /angolan/i] },
  { code: 'LS', patterns: [/^lesotho$/i, /basotho/i] },
  { code: 'SZ', patterns: [/^eswatini$/i, /^swaziland$/i, /swazi/i] },

  // Africa - Central
  { code: 'CD', patterns: [/^democratic.*congo$/i, /^drc$/i, /^congo.*kinshasa$/i, /congolese/i] },
  { code: 'CG', patterns: [/^republic.*congo$/i, /^congo$/i, /^congo.*brazzaville$/i] },
  { code: 'CF', patterns: [/^central\s*african\s*republic$/i, /^car$/i] },
  { code: 'TD', patterns: [/^chad$/i, /chadian/i] },
  { code: 'GA', patterns: [/^gabon$/i, /gabonese/i] },
  { code: 'GQ', patterns: [/^equatorial\s*guinea$/i] },

  // Caribbean
  { code: 'CU', patterns: [/^cuba$/i, /cuban/i] },
  { code: 'JM', patterns: [/^jamaica$/i, /jamaican/i] },
  { code: 'HT', patterns: [/^haiti$/i, /haitian/i] },
  { code: 'DO', patterns: [/^dominican$/i, /dominican\s*republic/i] },
  { code: 'PR', patterns: [/^puerto\s*rico$/i, /puerto\s*rican/i] },
  { code: 'TT', patterns: [/^trinidad$/i, /trinidadian/i, /trinidad.*tobago/i] },
  { code: 'BB', patterns: [/^barbados$/i, /barbadian/i, /bajan/i] },
  { code: 'BS', patterns: [/^bahamas$/i, /bahamian/i] },

  // Central America
  { code: 'GT', patterns: [/^guatemala$/i, /guatemalan/i] },
  { code: 'HN', patterns: [/^honduras$/i, /honduran/i] },
  { code: 'SV', patterns: [/^el\s*salvador$/i, /salvadoran/i] },
  { code: 'NI', patterns: [/^nicaragua$/i, /nicaraguan/i] },
  { code: 'CR', patterns: [/^costa\s*rica$/i, /costa\s*rican/i] },
  { code: 'PA', patterns: [/^panama$/i, /panamanian/i] },
  { code: 'BZ', patterns: [/^belize$/i, /belizean/i] },
];

/**
 * Maps a country name or nationality to a code supported by the local flag assets
 * @param countryOrNationality - Country name or nationality string
 * @returns Country or Flagpack-specific code, or null if not found
 */
export function getCountryCode(countryOrNationality: string | null | undefined): string | null {
  if (!countryOrNationality) return null;

  const normalized = countryOrNationality.trim();
  const uppercased = normalized.toUpperCase();

  // Preserve direct country codes and Flagpack's UK subdivision codes.
  if (
    /^[A-Z]{2}$/i.test(normalized) ||
    /^GB-(ENG|NIR|SCT|UKM|WLS)$/i.test(normalized)
  ) {
    return uppercased;
  }

  // Search through mappings
  for (const mapping of countryMappings) {
    for (const pattern of mapping.patterns) {
      if (pattern.test(normalized)) {
        return mapping.code;
      }
    }
  }

  return null;
}

/**
 * Maps a country code or name to a flag code for the local Flagpack assets.
 * Most flags use alpha-2 codes, but UK subdivisions use GB-ENG/GB-SCT/etc.
 */
export function getFlagCode(countryOrCode: string | null | undefined): string {
  if (!countryOrCode) return 'UN'; // United Nations as fallback

  const normalized = countryOrCode.trim();
  const uppercased = normalized.toUpperCase();

  // Preserve direct country codes and Flagpack's UK subdivision codes.
  if (
    /^[A-Z]{2}$/i.test(normalized) ||
    /^GB-(ENG|NIR|SCT|UKM|WLS)$/i.test(normalized)
  ) {
    return uppercased;
  }

  // Try to get the country code
  const code = getCountryCode(normalized);
  return code || 'UN'; // United Nations as fallback
}

export default getCountryCode;
