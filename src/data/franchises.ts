// Le 30 franchigie MLB reali: dati identitari fattuali (nome, citta', colori,
// stadio, lega/division). Loghi/foto ufficiali NON inclusi (marchi protetti):
// la UI genera un badge originale coi colori squadra. Vedi README per come
// aggiungere asset reali in locale. Le franchigie storiche arriveranno in Fase 2.

export interface Franchise {
  id: string;
  abbrev: string;
  city: string;
  name: string; // nome completo, es. "New York Yankees"
  league: 'AL' | 'NL';
  division: 'E' | 'C' | 'W';
  primaryColor: string;
  secondaryColor: string;
  ballpark: string;
}

export const FRANCHISES: Franchise[] = [
  // AL East
  { id: 'BAL', abbrev: 'BAL', city: 'Baltimore', name: 'Baltimore Orioles', league: 'AL', division: 'E', primaryColor: '#DF4601', secondaryColor: '#000000', ballpark: 'Oriole Park at Camden Yards' },
  { id: 'BOS', abbrev: 'BOS', city: 'Boston', name: 'Boston Red Sox', league: 'AL', division: 'E', primaryColor: '#BD3039', secondaryColor: '#0C2340', ballpark: 'Fenway Park' },
  { id: 'NYY', abbrev: 'NYY', city: 'New York', name: 'New York Yankees', league: 'AL', division: 'E', primaryColor: '#0C2340', secondaryColor: '#C4CED4', ballpark: 'Yankee Stadium' },
  { id: 'TBR', abbrev: 'TBR', city: 'Tampa Bay', name: 'Tampa Bay Rays', league: 'AL', division: 'E', primaryColor: '#092C5C', secondaryColor: '#8FBCE6', ballpark: 'Tropicana Field' },
  { id: 'TOR', abbrev: 'TOR', city: 'Toronto', name: 'Toronto Blue Jays', league: 'AL', division: 'E', primaryColor: '#134A8E', secondaryColor: '#1D2D5C', ballpark: 'Rogers Centre' },
  // AL Central
  { id: 'CWS', abbrev: 'CWS', city: 'Chicago', name: 'Chicago White Sox', league: 'AL', division: 'C', primaryColor: '#27251F', secondaryColor: '#C4CED4', ballpark: 'Guaranteed Rate Field' },
  { id: 'CLE', abbrev: 'CLE', city: 'Cleveland', name: 'Cleveland Guardians', league: 'AL', division: 'C', primaryColor: '#0C2340', secondaryColor: '#E31937', ballpark: 'Progressive Field' },
  { id: 'DET', abbrev: 'DET', city: 'Detroit', name: 'Detroit Tigers', league: 'AL', division: 'C', primaryColor: '#0C2340', secondaryColor: '#FA4616', ballpark: 'Comerica Park' },
  { id: 'KCR', abbrev: 'KCR', city: 'Kansas City', name: 'Kansas City Royals', league: 'AL', division: 'C', primaryColor: '#004687', secondaryColor: '#BD9B60', ballpark: 'Kauffman Stadium' },
  { id: 'MIN', abbrev: 'MIN', city: 'Minnesota', name: 'Minnesota Twins', league: 'AL', division: 'C', primaryColor: '#002B5C', secondaryColor: '#D31145', ballpark: 'Target Field' },
  // AL West
  { id: 'HOU', abbrev: 'HOU', city: 'Houston', name: 'Houston Astros', league: 'AL', division: 'W', primaryColor: '#002D62', secondaryColor: '#EB6E1F', ballpark: 'Minute Maid Park' },
  { id: 'LAA', abbrev: 'LAA', city: 'Los Angeles', name: 'Los Angeles Angels', league: 'AL', division: 'W', primaryColor: '#003263', secondaryColor: '#BA0021', ballpark: 'Angel Stadium' },
  { id: 'OAK', abbrev: 'OAK', city: 'Oakland', name: 'Oakland Athletics', league: 'AL', division: 'W', primaryColor: '#003831', secondaryColor: '#EFB21E', ballpark: 'Oakland Coliseum' },
  { id: 'SEA', abbrev: 'SEA', city: 'Seattle', name: 'Seattle Mariners', league: 'AL', division: 'W', primaryColor: '#0C2C56', secondaryColor: '#005C5C', ballpark: 'T-Mobile Park' },
  { id: 'TEX', abbrev: 'TEX', city: 'Texas', name: 'Texas Rangers', league: 'AL', division: 'W', primaryColor: '#003278', secondaryColor: '#C0111F', ballpark: 'Globe Life Field' },
  // NL East
  { id: 'ATL', abbrev: 'ATL', city: 'Atlanta', name: 'Atlanta Braves', league: 'NL', division: 'E', primaryColor: '#CE1141', secondaryColor: '#13274F', ballpark: 'Truist Park' },
  { id: 'MIA', abbrev: 'MIA', city: 'Miami', name: 'Miami Marlins', league: 'NL', division: 'E', primaryColor: '#00A3E0', secondaryColor: '#EF3340', ballpark: 'loanDepot park' },
  { id: 'NYM', abbrev: 'NYM', city: 'New York', name: 'New York Mets', league: 'NL', division: 'E', primaryColor: '#002D72', secondaryColor: '#FF5910', ballpark: 'Citi Field' },
  { id: 'PHI', abbrev: 'PHI', city: 'Philadelphia', name: 'Philadelphia Phillies', league: 'NL', division: 'E', primaryColor: '#E81828', secondaryColor: '#002D72', ballpark: 'Citizens Bank Park' },
  { id: 'WSH', abbrev: 'WSH', city: 'Washington', name: 'Washington Nationals', league: 'NL', division: 'E', primaryColor: '#AB0003', secondaryColor: '#14225A', ballpark: 'Nationals Park' },
  // NL Central
  { id: 'CHC', abbrev: 'CHC', city: 'Chicago', name: 'Chicago Cubs', league: 'NL', division: 'C', primaryColor: '#0E3386', secondaryColor: '#CC3433', ballpark: 'Wrigley Field' },
  { id: 'CIN', abbrev: 'CIN', city: 'Cincinnati', name: 'Cincinnati Reds', league: 'NL', division: 'C', primaryColor: '#C6011F', secondaryColor: '#000000', ballpark: 'Great American Ball Park' },
  { id: 'MIL', abbrev: 'MIL', city: 'Milwaukee', name: 'Milwaukee Brewers', league: 'NL', division: 'C', primaryColor: '#12284B', secondaryColor: '#FFC52F', ballpark: 'American Family Field' },
  { id: 'PIT', abbrev: 'PIT', city: 'Pittsburgh', name: 'Pittsburgh Pirates', league: 'NL', division: 'C', primaryColor: '#27251F', secondaryColor: '#FDB827', ballpark: 'PNC Park' },
  { id: 'STL', abbrev: 'STL', city: 'St. Louis', name: 'St. Louis Cardinals', league: 'NL', division: 'C', primaryColor: '#C41E3A', secondaryColor: '#0C2340', ballpark: 'Busch Stadium' },
  // NL West
  { id: 'ARI', abbrev: 'ARI', city: 'Arizona', name: 'Arizona Diamondbacks', league: 'NL', division: 'W', primaryColor: '#A71930', secondaryColor: '#E3D4AD', ballpark: 'Chase Field' },
  { id: 'COL', abbrev: 'COL', city: 'Colorado', name: 'Colorado Rockies', league: 'NL', division: 'W', primaryColor: '#333366', secondaryColor: '#C4CED4', ballpark: 'Coors Field' },
  { id: 'LAD', abbrev: 'LAD', city: 'Los Angeles', name: 'Los Angeles Dodgers', league: 'NL', division: 'W', primaryColor: '#005A9C', secondaryColor: '#EF3E42', ballpark: 'Dodger Stadium' },
  { id: 'SDP', abbrev: 'SDP', city: 'San Diego', name: 'San Diego Padres', league: 'NL', division: 'W', primaryColor: '#2F241D', secondaryColor: '#FFC425', ballpark: 'Petco Park' },
  { id: 'SFG', abbrev: 'SFG', city: 'San Francisco', name: 'San Francisco Giants', league: 'NL', division: 'W', primaryColor: '#FD5A1E', secondaryColor: '#27251F', ballpark: 'Oracle Park' },
];

export function franchiseById(id: string): Franchise | undefined {
  return FRANCHISES.find((f) => f.id === id);
}
