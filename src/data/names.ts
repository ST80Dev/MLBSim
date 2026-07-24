// Pool di nomi per la generazione procedurale dei giocatori.
//
// Obiettivo: rispecchiare la varieta' etnica reale della MLB, evitando la
// prevalenza (e la ripetitivita') di pochi cognomi. I nomi sono raggruppati per
// ORIGINE, cosi' che nome e cognome combacino in modo credibile (niente
// "Hideki Rossi"); ogni origine ha un PESO che approssima la demografia MLB:
// forte base nordamericana, ampia componente latina, e quote asiatiche/varie.
// (Nomi di fantasia composti da elementi comuni; l'import di giocatori storici
// reali arrivera' in Fase 2.)

export interface NameOrigin {
  /** Etichetta interna (utile per debug/test). */
  key: string;
  /** Peso relativo nel mix (approssima la demografia MLB). */
  weight: number;
  first: readonly string[];
  last: readonly string[];
}

// --- Nordamericana (anglo + afroamericana): la componente maggioritaria. ---
const NORTH_AMERICAN: NameOrigin = {
  key: 'na',
  weight: 54,
  first: [
    'Jake', 'Ryan', 'Tyler', 'Cody', 'Blake', 'Chase', 'Cole', 'Connor',
    'Dylan', 'Ethan', 'Hunter', 'Logan', 'Mason', 'Nathan', 'Nolan', 'Parker',
    'Riley', 'Grant', 'Drew', 'Brett', 'Wade', 'Dustin', 'Casey', 'Shane',
    'Zach', 'Jared', 'Austin', 'Trevor', 'Kyle', 'Brandon', 'Clint', 'Chad',
    'James', 'Michael', 'David', 'William', 'Andrew', 'Matt', 'Sam', 'Jack',
    'Marcus', 'Dexter', 'Curtis', 'Andre', 'Reggie', 'Cedric', 'Elijah',
    'Jalen', 'Xavier', 'Cameron', 'Devon', 'Malik', 'Terrance', 'Darius',
    'Hank', 'Cal', 'Duke', 'Ozzie', 'Chip', 'Buck', 'Dale', 'Roy',
  ],
  last: [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis',
    'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin',
    'Thompson', 'White', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker',
    'Allen', 'Young', 'Hall', 'Wright', 'Scott', 'Green', 'Baker', 'Adams',
    'Nelson', 'Carter', 'Mitchell', 'Roberts', 'Turner', 'Collins', 'Stewart',
    'Morris', 'Murphy', 'Cook', 'Rogers', 'Reed', 'Bell', 'Bailey', 'Cooper',
    'Cox', 'Howard', 'Ward', 'Brooks', 'Price', 'Bennett', 'Wood', 'Barnes',
    'Ross', 'Henderson', 'Coleman', 'Perry', 'Powell', 'Long', 'Foster',
    'Bryant', 'Gordon', 'Fowler', 'Hughes', 'Sullivan', 'Fitzgerald',
    'Donovan', 'Hayes', 'Grady', 'Whitaker', 'Sheldon', 'Vaughn',
  ],
};

// --- Latina (Dominicana, Venezuelana, Cubana, Portoricana, Messicana). ---
const LATIN: NameOrigin = {
  key: 'latin',
  weight: 28,
  first: [
    'Jose', 'Luis', 'Carlos', 'Juan', 'Miguel', 'Rafael', 'Pedro', 'Fernando',
    'Roberto', 'Alberto', 'Manuel', 'Ramon', 'Francisco', 'Jorge', 'Hector',
    'Angel', 'Victor', 'Eduardo', 'Javier', 'Adrian', 'Nelson', 'Edwin',
    'Julio', 'Ozzie', 'Elvis', 'Wilson', 'Yordan', 'Ronald', 'Eugenio',
    'Wander', 'Marcell', 'Salvador', 'Gleyber', 'Ozzie', 'Starlin', 'Gary',
    'Yandy', 'Teoscar', 'Ketel', 'Jeimer', 'Framber', 'Cristian', 'Emilio',
  ],
  last: [
    'Garcia', 'Martinez', 'Rodriguez', 'Gonzalez', 'Hernandez', 'Lopez',
    'Perez', 'Sanchez', 'Ramirez', 'Flores', 'Rivera', 'Gomez', 'Diaz',
    'Reyes', 'Cruz', 'Morales', 'Ortiz', 'Gutierrez', 'Chavez', 'Ramos',
    'Ruiz', 'Alvarez', 'Mendoza', 'Vasquez', 'Castillo', 'Jimenez', 'Moreno',
    'Romero', 'Herrera', 'Medina', 'Aguilar', 'Vargas', 'Guerrero', 'Pena',
    'Cabrera', 'Beltran', 'Polanco', 'Bautista', 'Cordero', 'Franco',
    'Guzman', 'Nunez', 'Santana', 'Valdez', 'Contreras', 'Marte', 'Berrios',
    'Encarnacion', 'Almonte', 'Feliz', 'Tejada', 'Solano', 'Carrasco',
  ],
};

// --- Giapponese. ---
const JAPANESE: NameOrigin = {
  key: 'jp',
  weight: 5,
  first: [
    'Hideki', 'Hideo', 'Ichiro', 'Yu', 'Kenta', 'Masahiro', 'Kenji', 'Kazuo',
    'Koji', 'Daisuke', 'Kosuke', 'Tsuyoshi', 'Munenori', 'Seiya', 'Shogo',
    'Akira', 'Takashi', 'Ryo', 'Sho', 'Yoshi', 'Naoki', 'Haruki',
  ],
  last: [
    'Suzuki', 'Tanaka', 'Nakamura', 'Matsui', 'Yamamoto', 'Watanabe', 'Ito',
    'Kobayashi', 'Kato', 'Sato', 'Yoshida', 'Yamada', 'Sasaki', 'Matsumoto',
    'Inoue', 'Kimura', 'Hayashi', 'Shimizu', 'Okada', 'Aoki', 'Uehara',
    'Maeda', 'Kikuchi', 'Fujita', 'Mori',
  ],
};

// --- Coreana. ---
const KOREAN: NameOrigin = {
  key: 'kr',
  weight: 3,
  first: [
    'Hyun-jin', 'Shin-soo', 'Ji-man', 'Jung-ho', 'Byung-ho', 'Kwang-hyun',
    'Ha-seong', 'Dae-ho', 'Ji-hwan', 'Sung-min', 'Eun-woo', 'Woo-jin',
  ],
  last: [
    'Kim', 'Park', 'Lee', 'Choi', 'Ryu', 'Kang', 'Cho', 'Yoon', 'Jung', 'Oh',
    'Han', 'Shin', 'Seo', 'Baek',
  ],
};

// --- Varie: Caraibi olandesi (Curacao/Aruba), Europa, Oceania. ---
const OTHER: NameOrigin = {
  key: 'other',
  weight: 10,
  first: [
    'Xander', 'Andruw', 'Kenley', 'Jurickson', 'Simon', 'Jonathan', 'Liam',
    'Nick', 'Max', 'Rik', 'Bas', 'Sven', 'Lars', 'Jan', 'Loek', 'Mervyn',
    'Sharlon', 'Kalian', 'Ralph', 'Gift', 'Aaron', 'Tim', 'Diego', 'Aidan',
  ],
  last: [
    'De Jong', 'Van Dyk', 'Meijer', 'Bakker', 'Visser', 'Smit', 'Jansen',
    'Groot', 'Nilsson', 'Larsen', 'Andersen', 'Novak', 'Horvat', 'Muller',
    'Weber', 'Fischer', 'Becker', 'Schmidt', 'Klein', 'Wagner', 'Vogel',
    'Brandt', 'Kuijpers', 'Balentin',
  ],
};

export const NAME_ORIGINS: readonly NameOrigin[] = [
  NORTH_AMERICAN,
  LATIN,
  JAPANESE,
  KOREAN,
  OTHER,
];

// Manteniamo gli export storici per eventuali usi/test, ora come unione piatta.
export const FIRST_NAMES: readonly string[] = NAME_ORIGINS.flatMap((o) => o.first);
export const LAST_NAMES: readonly string[] = NAME_ORIGINS.flatMap((o) => o.last);

// Elementi per squadre di fantasia italiane (feature separata, non usata per i
// nomi dei giocatori MLB).
export const CITY_NAMES = [
  'Milano', 'Roma', 'Torino', 'Napoli', 'Genova', 'Firenze', 'Bologna',
  'Palermo', 'Venezia', 'Verona', 'Bari', 'Trieste', 'Padova', 'Catania',
  'Parma', 'Modena', 'Livorno', 'Cagliari', 'Rimini', 'Lecce',
];

export const TEAM_NICKNAMES = [
  'Lupi', 'Aquile', 'Titani', 'Corsari', 'Draghi', 'Falchi', 'Tori',
  'Lince', 'Squali', 'Vipere', 'Orsi', 'Comete', 'Fulmini', 'Sentinelle',
  'Gladiatori', 'Corvi', 'Pantere', 'Cavalieri', 'Bisonti', 'Meteore',
];
