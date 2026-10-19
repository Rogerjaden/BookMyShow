// Values match the backend ScreenType enum exactly. The old UI sent TWO_D and DOLBY, which the API rejects.
export const SCREEN_TYPES = [
  { value: 'STANDARD', label: 'Standard', color: '#78909C', description: 'Regular 2D projection' },
  { value: 'THREE_D', label: '3D', color: '#26A69A', description: 'Stereoscopic 3D' },
  { value: 'IMAX', label: 'IMAX', color: '#29B6F6', description: 'Giant screen, premium sound' },
  { value: 'DOLBY_CINEMA', label: 'Dolby Cinema', color: '#AB47BC', description: 'Dolby Vision and Atmos' },
  { value: 'FOUR_DX', label: '4DX', color: '#EF5350', description: 'Moving seats and effects' },
  { value: 'OTHER', label: 'Other', color: '#8D6E63', description: 'Anything else' },
];

export const SCREEN_TYPE_BY_VALUE = Object.fromEntries(SCREEN_TYPES.map((t) => [t.value, t]));

export const screenTypeMeta = (value) =>
  SCREEN_TYPE_BY_VALUE[value] || { value, label: value || 'Unknown', color: '#8D6E63', description: '' };
